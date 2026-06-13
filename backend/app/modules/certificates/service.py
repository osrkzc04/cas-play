import math
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.exceptions import (
    BadRequestException,
    ConflictException,
    ForbiddenException,
    NotFoundException,
)
from app.modules.audit.service import AuditService
from app.modules.certificates import generator
from app.modules.certificates.models import Certificate
from app.modules.certificates.repository import CertificateRepository
from app.modules.certificates.schemas import (
    CertificateEligibilityResponse,
    CertificateResponse,
    CertificateVerificationResponse,
)
from app.modules.courses.models import Course
from app.modules.courses.repository import CourseRepository
from app.modules.enrollments.repository import EnrollmentRepository
from app.modules.evaluations.repository import AttemptRepository, EvaluationRepository
from app.modules.lessons.repository import LessonRepository
from app.modules.progress.repository import ProgressRepository
from app.modules.users.models import User
from app.shared.enums import AuditAction
from app.shared.pagination import PaginatedResponse


@dataclass
class _Eligibility:
    total_lessons: int
    completed_lessons: int
    progress_percentage: float
    average_score: float | None
    is_progress_complete: bool
    are_evaluations_complete: bool
    is_eligible: bool
    reason: str | None


class CertificateService:
    PASSING_SCORE = 7.0  # BR-026: promedio mínimo aprobatorio 7/10.
    _MAX_CODE_ATTEMPTS = 5

    def __init__(self, db: Session):
        self.certificate_repository = CertificateRepository(db)
        self.course_repository = CourseRepository(db)
        self.enrollment_repository = EnrollmentRepository(db)
        self.lesson_repository = LessonRepository(db)
        self.progress_repository = ProgressRepository(db)
        self.evaluation_repository = EvaluationRepository(db)
        self.attempt_repository = AttemptRepository(db)
        self.audit = AuditService(db)

    # ------------------------------------------------------------------ #
    # Elegibilidad (BR-026, BR-027)
    # ------------------------------------------------------------------ #

    def _resolve_enrolled_course(
        self,
        course_id: uuid.UUID,
        current_user: User,
    ) -> Course:
        course = self.course_repository.get_by_id(course_id)
        if course is None:
            raise NotFoundException("Curso no encontrado")

        if not self.enrollment_repository.exists(current_user.id, course_id):
            raise ForbiddenException("No se encuentra matriculado en este curso")

        return course

    def _compute_eligibility(
        self,
        course_id: uuid.UUID,
        current_user: User,
    ) -> _Eligibility:
        total_lessons = self.lesson_repository.count_by_course(course_id)
        completed_lessons = self.progress_repository.count_completed_by_course(
            current_user.id,
            course_id,
        )
        progress_percentage = (
            round(completed_lessons / total_lessons * 100, 2)
            if total_lessons
            else 0.0
        )
        is_progress_complete = total_lessons > 0 and completed_lessons == total_lessons

        # El promedio del curso se calcula con la mejor nota de cada evaluación
        # de módulo; aprueba por promedio, no por evaluación individual (BR-027).
        evaluations = self.evaluation_repository.list_by_course(course_id)
        best_scores: list[float] = []
        missing_evaluation = False
        for evaluation in evaluations:
            best = self.attempt_repository.best_submitted_score(
                current_user.id,
                evaluation.id,
            )
            if best is None:
                missing_evaluation = True
            else:
                best_scores.append(float(best))

        are_evaluations_complete = bool(evaluations) and not missing_evaluation
        average_score = (
            round(sum(best_scores) / len(evaluations), 2)
            if are_evaluations_complete
            else None
        )

        reason = self._eligibility_reason(
            total_lessons=total_lessons,
            is_progress_complete=is_progress_complete,
            has_evaluations=bool(evaluations),
            are_evaluations_complete=are_evaluations_complete,
            average_score=average_score,
        )

        return _Eligibility(
            total_lessons=total_lessons,
            completed_lessons=completed_lessons,
            progress_percentage=progress_percentage,
            average_score=average_score,
            is_progress_complete=is_progress_complete,
            are_evaluations_complete=are_evaluations_complete,
            is_eligible=reason is None,
            reason=reason,
        )

    def _eligibility_reason(
        self,
        *,
        total_lessons: int,
        is_progress_complete: bool,
        has_evaluations: bool,
        are_evaluations_complete: bool,
        average_score: float | None,
    ) -> str | None:
        if total_lessons == 0:
            return "El curso aún no tiene contenido disponible"
        if not is_progress_complete:
            return "Debe completar el 100% del contenido del curso"
        if not has_evaluations:
            return "El curso aún no tiene evaluaciones disponibles"
        if not are_evaluations_complete:
            return "Debe rendir todas las evaluaciones del curso"
        if average_score is None or average_score < self.PASSING_SCORE:
            return (
                f"El promedio del curso ({average_score:.2f}) no alcanza el "
                f"mínimo de {self.PASSING_SCORE:.0f}/10"
            )
        return None

    def get_eligibility(
        self,
        course_id: uuid.UUID,
        current_user: User,
    ) -> CertificateEligibilityResponse:
        self._resolve_enrolled_course(course_id, current_user)
        eligibility = self._compute_eligibility(course_id, current_user)
        already_issued = (
            self.certificate_repository.get_by_user_and_course(
                current_user.id, course_id
            )
            is not None
        )

        return CertificateEligibilityResponse(
            course_id=course_id,
            total_lessons=eligibility.total_lessons,
            completed_lessons=eligibility.completed_lessons,
            progress_percentage=eligibility.progress_percentage,
            average_score=eligibility.average_score,
            passing_score=self.PASSING_SCORE,
            is_progress_complete=eligibility.is_progress_complete,
            are_evaluations_complete=eligibility.are_evaluations_complete,
            is_eligible=eligibility.is_eligible,
            already_issued=already_issued,
            reason=eligibility.reason,
        )

    # ------------------------------------------------------------------ #
    # Emisión (BR-028)
    # ------------------------------------------------------------------ #

    def issue_certificate(
        self,
        course_id: uuid.UUID,
        current_user: User,
    ) -> CertificateResponse:
        course = self._resolve_enrolled_course(course_id, current_user)

        existing = self.certificate_repository.get_by_user_and_course(
            current_user.id,
            course_id,
        )
        if existing is not None:
            raise ConflictException("El certificado de este curso ya fue emitido")

        eligibility = self._compute_eligibility(course_id, current_user)
        if not eligibility.is_eligible:
            raise BadRequestException(eligibility.reason)

        student_name = f"{current_user.first_name} {current_user.last_name}".strip()
        issued_at = datetime.now(timezone.utc)
        code = self._generate_unique_code()

        # Se persiste primero para que el índice único reserve el código; el PDF
        # se genera a continuación y se enlaza al registro.
        certificate = Certificate(
            user_id=current_user.id,
            course_id=course_id,
            code=code,
            student_name=student_name,
            course_title=course.title,
            average_score=eligibility.average_score,
            issued_at=issued_at,
        )
        certificate = self.certificate_repository.add(certificate)

        certificate.pdf_path = generator.build_certificate_pdf(
            code=code,
            student_name=student_name,
            course_title=course.title,
            average_score=float(eligibility.average_score),
            issued_at=issued_at,
        )
        certificate = self.certificate_repository.save(certificate)

        self.audit.record(
            action=AuditAction.CERTIFICATE_ISSUED,
            actor_id=current_user.id,
            entity_type="certificate",
            entity_id=certificate.id,
            details={"code": certificate.code, "course_id": str(course_id)},
        )

        return self._to_response(certificate)

    def _generate_unique_code(self) -> str:
        for _ in range(self._MAX_CODE_ATTEMPTS):
            code = generator.generate_code()
            if not self.certificate_repository.exists_code(code):
                return code
        raise ConflictException("No fue posible generar un código de certificado único")

    # ------------------------------------------------------------------ #
    # Consulta (propietario)
    # ------------------------------------------------------------------ #

    def list_my_certificates(
        self,
        current_user: User,
        page: int,
        size: int,
    ) -> PaginatedResponse:
        skip = (page - 1) * size
        items = self.certificate_repository.list_by_user(
            current_user.id,
            skip=skip,
            limit=size,
        )
        total = self.certificate_repository.count_by_user(current_user.id)

        return PaginatedResponse(
            items=[self._to_response(item) for item in items],
            total=total,
            page=page,
            size=size,
            pages=math.ceil(total / size) if total else 0,
        )

    def _get_owned_certificate(
        self,
        certificate_id: uuid.UUID,
        current_user: User,
    ) -> Certificate:
        certificate = self.certificate_repository.get_by_id(certificate_id)
        # Un certificado solo es accesible por su propietario; se oculta a terceros.
        if certificate is None or certificate.user_id != current_user.id:
            raise NotFoundException("Certificado no encontrado")
        return certificate

    def get_certificate(
        self,
        certificate_id: uuid.UUID,
        current_user: User,
    ) -> CertificateResponse:
        certificate = self._get_owned_certificate(certificate_id, current_user)
        return self._to_response(certificate)

    def get_certificate_for_download(
        self,
        certificate_id: uuid.UUID,
        current_user: User,
    ) -> Certificate:
        certificate = self._get_owned_certificate(certificate_id, current_user)
        if not certificate.pdf_path:
            raise NotFoundException("El certificado no tiene un PDF disponible")
        return certificate

    # ------------------------------------------------------------------ #
    # Validación pública (BR-030)
    # ------------------------------------------------------------------ #

    def verify_certificate(self, code: str) -> CertificateVerificationResponse:
        certificate = self.certificate_repository.get_by_code(code)
        if certificate is None:
            raise NotFoundException("Certificado no encontrado")

        return CertificateVerificationResponse(
            is_valid=True,
            code=certificate.code,
            student_name=certificate.student_name,
            course_title=certificate.course_title,
            issued_at=certificate.issued_at,
        )

    # ------------------------------------------------------------------ #

    def _to_response(self, certificate: Certificate) -> CertificateResponse:
        return CertificateResponse(
            id=certificate.id,
            code=certificate.code,
            course_id=certificate.course_id,
            course_title=certificate.course_title,
            student_name=certificate.student_name,
            average_score=float(certificate.average_score),
            issued_at=certificate.issued_at,
            pdf_available=bool(certificate.pdf_path),
            created_at=certificate.created_at,
            updated_at=certificate.updated_at,
        )
