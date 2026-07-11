import uuid

from sqlalchemy.orm import Session

from app.core.exceptions import ForbiddenException, NotFoundException
from app.modules.course_modules.repository import ModuleRepository
from app.modules.courses.repository import CourseRepository
from app.modules.courses.service import CourseService
from app.modules.curriculum.schemas import (
    CurriculumEvaluation,
    CurriculumLesson,
    CurriculumModule,
    CurriculumResponse,
)
from app.modules.enrollments.repository import EnrollmentRepository
from app.modules.evaluations.repository import EvaluationRepository
from app.modules.lessons.repository import LessonRepository
from app.modules.users.models import User
from app.shared.enums import CourseStatus

# El banco completo (BR-021) habilita rendir la evaluación.
REQUIRED_BANK_SIZE = 20


class CurriculumService:
    def __init__(self, db: Session):
        self.course_repository = CourseRepository(db)
        self.module_repository = ModuleRepository(db)
        self.lesson_repository = LessonRepository(db)
        self.enrollment_repository = EnrollmentRepository(db)
        self.evaluation_repository = EvaluationRepository(db)
        self.course_service = CourseService(db)

    def get_curriculum(
        self,
        course_id: uuid.UUID,
        current_user: User,
    ) -> CurriculumResponse:
        course = self.course_repository.get_by_id(course_id)
        if course is None:
            raise NotFoundException("Curso no encontrado")

        # El temario (estructura de módulos y clases) es público en el catálogo
        # para cursos PUBLICADOS; el contenido real (videos/materiales) sigue
        # protegido en sus propios endpoints (las clases de vista previa son las
        # únicas reproducibles sin matrícula, BR-011/BR-016). Para cursos no
        # publicados solo acceden el gestor o un estudiante ya matriculado.
        if (
            not self.course_service.user_manages_course(course_id, current_user)
            and course.status != CourseStatus.PUBLISHED
            and not self.enrollment_repository.exists(current_user.id, course_id)
        ):
            raise ForbiddenException("No tiene acceso al contenido de este curso")

        modules = self.module_repository.list_by_course(course_id)

        return CurriculumResponse(
            course_id=course_id,
            modules=[
                CurriculumModule(
                    id=module.id,
                    title=module.title,
                    description=module.description,
                    position=module.position,
                    lessons=[
                        CurriculumLesson.model_validate(lesson)
                        for lesson in self.lesson_repository.list_by_module(module.id)
                    ],
                )
                for module in modules
            ],
            final_evaluation=self._build_evaluation(course_id),
        )

    def _build_evaluation(
        self, course_id: uuid.UUID
    ) -> CurriculumEvaluation | None:
        evaluation = self.evaluation_repository.get_by_course(course_id)
        if evaluation is None:
            return None
        question_count = self.evaluation_repository.count_questions(evaluation.id)
        return CurriculumEvaluation(
            id=evaluation.id,
            title=evaluation.title,
            question_count=question_count,
            is_ready=question_count == REQUIRED_BANK_SIZE,
        )
