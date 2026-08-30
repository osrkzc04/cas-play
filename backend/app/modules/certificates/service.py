import math
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.exceptions import (
    BadRequestException,
    ConflictException,
    ForbiddenException,
    NotFoundException,
)
from app.shared.storage import delete_file
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
    final_score: float | None
    has_evaluation: bool
    is_eligible: bool
    reason: str | None


class CertificateService:
    PASSING_SCORE = 7.0  # BR-026: nota mínima aprobatoria de la evaluación final 7/10.
    REQUIRED_PROGRESS = 100.0  # BR-027: se exige completar el 100% del contenido.
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

        # El certificado se concede al aprobar la única evaluación final del
        # curso con la mejor nota rendida (BR-027).
        evaluation = self.evaluation_repository.get_by_course(course_id)
        best = (
            self.attempt_repository.best_submitted_score(
                current_user.id,
                evaluation.id,
            )
            if evaluation is not None
            else None
        )
        final_score = round(float(best), 2) if best is not None else None

        reason = self._eligibility_reason(
            has_evaluation=evaluation is not None,
            final_score=final_score,
            total_lessons=total_lessons,
            completed_lessons=completed_lessons,
        )

        return _Eligibility(
            total_lessons=total_lessons,
            completed_lessons=completed_lessons,
            progress_percentage=progress_percentage,
            final_score=final_score,
            has_evaluation=evaluation is not None,
            is_eligible=reason is None,
            reason=reason,
        )

    def _eligibility_reason(
        self,
        *,
        has_evaluation: bool,
        final_score: float | None,
        total_lessons: int,
        completed_lessons: int,
    ) -> str | None:
        # BR-027: se exige completar el 100% del contenido y además aprobar la
        # evaluación final con la nota mínima. Un curso sin clases (total 0) no
        # bloquea por contenido: admite cursos solo-evaluación (ver test).
        if total_lessons and completed_lessons < total_lessons:
            return (
                f"Debe completar el 100% del contenido "
                f"({completed_lessons}/{total_lessons} clases)"
            )
        if not has_evaluation:
            return "El curso aún no tiene evaluación final disponible"
        if final_score is None:
            return "Debe rendir la evaluación final del curso"
        if final_score < self.PASSING_SCORE:
            return (
                f"La nota de la evaluación final ({final_score:.2f}) no alcanza el "
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
            final_score=eligibility.final_score,
            passing_score=self.PASSING_SCORE,
            has_evaluation=eligibility.has_evaluation,
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
            # Recuperación: si una emisión previa persistió el certificado pero
            # falló al generar el PDF, se regenera en lugar de bloquear al usuario.
            if not existing.pdf_path:
                existing.pdf_path = generator.build_certificate_pdf(
                    code=existing.code,
                    student_name=existing.student_name,
                    course_title=existing.course_title,
                    final_score=float(existing.final_score),
                    issued_at=existing.issued_at,
                )
                existing = self.certificate_repository.save(existing)
                return self._to_response(existing)
            raise ConflictException("El certificado de este curso ya fue emitido")

        eligibility = self._compute_eligibility(course_id, current_user)
        if not eligibility.is_eligible:
            raise BadRequestException(eligibility.reason)

        student_name = f"{current_user.first_name} {current_user.last_name}".strip()
        issued_at = datetime.now(timezone.utc)
        code = self._generate_unique_code()

        # El PDF se genera antes de persistir: si la generación falla no queda un
        # certificado sin documento que bloquee reintentos futuros (índice único
        # user+course). El código se reserva mediante _generate_unique_code.
        pdf_path = generator.build_certificate_pdf(
            code=code,
            student_name=student_name,
            course_title=course.title,
            final_score=float(eligibility.final_score),
            issued_at=issued_at,
        )

        certificate = Certificate(
            user_id=current_user.id,
            course_id=course_id,
            code=code,
            student_name=student_name,
            course_title=course.title,
            final_score=eligibility.final_score,
            issued_at=issued_at,
            pdf_path=pdf_path,
        )
        try:
            certificate = self.certificate_repository.add(certificate)
        except IntegrityError as exc:
            # Carrera: una emisión simultánea ya creó el certificado. Se revierte y
            # se descarta el PDF recién generado para no dejar archivos huérfanos.
            self.certificate_repository.db.rollback()
            delete_file(pdf_path)
            raise ConflictException(
                "El certificado de este curso ya fue emitido"
            ) from exc

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

    # ------------------------------------------------------------------ #
    # Supervisión global (ADMIN)
    # ------------------------------------------------------------------ #

    def list_all_certificates(
        self,
        course_id: uuid.UUID | None,
        page: int,
        size: int,
    ) -> PaginatedResponse:
        skip = (page - 1) * size
        items = self.certificate_repository.list_all(
            course_id=course_id,
            skip=skip,
            limit=size,
        )
        total = self.certificate_repository.count_all(course_id=course_id)

        return PaginatedResponse(
            items=[self._to_response(item) for item in items],
            total=total,
            page=page,
            size=size,
            pages=math.ceil(total / size) if total else 0,
        )

    def get_certificate_for_admin_download(
        self,
        certificate_id: uuid.UUID,
    ) -> Certificate:
        certificate = self.certificate_repository.get_by_id(certificate_id)
        if certificate is None:
            raise NotFoundException("Certificado no encontrado")
        if not certificate.pdf_path:
            raise NotFoundException("El certificado no tiene un PDF disponible")
        return certificate

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
            final_score=float(certificate.final_score),
            issued_at=certificate.issued_at,
            pdf_available=bool(certificate.pdf_path),
            created_at=certificate.created_at,
            updated_at=certificate.updated_at,
        )
