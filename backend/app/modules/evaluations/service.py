import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.exceptions import (
    BadRequestException,
    ConflictException,
    ForbiddenException,
    NotFoundException,
)
from app.modules.course_modules.repository import ModuleRepository
from app.modules.course_modules.service import ModuleService
from app.modules.enrollments.repository import EnrollmentRepository
from app.modules.evaluations.models import (
    AttemptAnswer,
    Evaluation,
    EvaluationAttempt,
    Question,
)
from app.modules.evaluations.repository import (
    AttemptRepository,
    EvaluationRepository,
    QuestionRepository,
)
from app.modules.evaluations.schemas import (
    AnswerResult,
    AttemptDetailResponse,
    AttemptSubmit,
    AttemptSummary,
    EvaluationCreate,
    EvaluationDetailResponse,
    EvaluationResponse,
    EvaluationUpdate,
    OptionCreate,
    QuestionCreate,
    QuestionPublic,
    QuestionResponse,
    QuestionUpdate,
)
from app.modules.users.models import User
from app.shared.enums import AttemptStatus, QuestionType


class EvaluationService:
    # Reglas de negocio del módulo de evaluaciones.
    REQUIRED_BANK_SIZE = 20  # BR-021: el banco contiene 20 preguntas.
    QUESTIONS_PER_ATTEMPT = 10  # BR-022: cada intento presenta 10 aleatorias.
    MAX_ATTEMPTS = 2  # BR-024: máximo 2 intentos.
    PASSING_SCORE = 7.0  # BR-025: nota mínima aprobatoria 7/10.
    MAX_SCORE = 10

    def __init__(self, db: Session):
        self.evaluation_repository = EvaluationRepository(db)
        self.question_repository = QuestionRepository(db)
        self.attempt_repository = AttemptRepository(db)
        self.module_repository = ModuleRepository(db)
        self.enrollment_repository = EnrollmentRepository(db)
        # Reutiliza el control de propiedad/rol sobre el curso del módulo.
        self.module_service = ModuleService(db)

    # ------------------------------------------------------------------ #
    # Gestión (ADMIN / INSTRUCTOR)
    # ------------------------------------------------------------------ #

    def _get_managed_evaluation(
        self,
        evaluation_id: uuid.UUID,
        current_user: User,
    ) -> Evaluation:
        evaluation = self.evaluation_repository.get_by_id(evaluation_id)
        if evaluation is None:
            raise NotFoundException("Evaluación no encontrada")

        # Valida que el usuario gestione el curso dueño del módulo.
        self.module_service.get_managed_module(evaluation.module_id, current_user)
        return evaluation

    def _validate_question_options(
        self,
        question_type: QuestionType,
        options: list[OptionCreate],
    ) -> None:
        # Cada pregunta debe tener exactamente una opción correcta (BR-023).
        correct = [option for option in options if option.is_correct]
        if len(correct) != 1:
            raise BadRequestException(
                "La pregunta debe tener exactamente una opción correcta"
            )

        if question_type == QuestionType.TRUE_FALSE and len(options) != 2:
            raise BadRequestException(
                "Una pregunta de verdadero/falso debe tener exactamente dos opciones"
            )

    def _build_evaluation_response(
        self,
        evaluation: Evaluation,
    ) -> EvaluationResponse:
        question_count = self.evaluation_repository.count_questions(evaluation.id)
        return EvaluationResponse(
            id=evaluation.id,
            module_id=evaluation.module_id,
            title=evaluation.title,
            description=evaluation.description,
            question_count=question_count,
            is_ready=question_count == self.REQUIRED_BANK_SIZE,
            created_at=evaluation.created_at,
            updated_at=evaluation.updated_at,
        )

    def create_evaluation(
        self,
        module_id: uuid.UUID,
        data: EvaluationCreate,
        current_user: User,
    ) -> EvaluationResponse:
        self.module_service.get_managed_module(module_id, current_user)

        # Cada módulo tiene una única evaluación (BR-020).
        if self.evaluation_repository.get_by_module(module_id) is not None:
            raise ConflictException("El módulo ya tiene una evaluación")

        evaluation = self.evaluation_repository.create(
            module_id=module_id,
            title=data.title,
            description=data.description,
        )
        return self._build_evaluation_response(evaluation)

    def get_evaluation_by_module(
        self,
        module_id: uuid.UUID,
        current_user: User,
    ) -> EvaluationDetailResponse:
        self.module_service.get_managed_module(module_id, current_user)

        evaluation = self.evaluation_repository.get_by_module(module_id)
        if evaluation is None:
            raise NotFoundException("Evaluación no encontrada")

        questions = self.question_repository.list_by_evaluation(evaluation.id)
        return EvaluationDetailResponse(
            id=evaluation.id,
            module_id=evaluation.module_id,
            title=evaluation.title,
            description=evaluation.description,
            question_count=len(questions),
            is_ready=len(questions) == self.REQUIRED_BANK_SIZE,
            created_at=evaluation.created_at,
            updated_at=evaluation.updated_at,
            questions=[QuestionResponse.model_validate(q) for q in questions],
        )

    def update_evaluation(
        self,
        evaluation_id: uuid.UUID,
        data: EvaluationUpdate,
        current_user: User,
    ) -> EvaluationResponse:
        evaluation = self._get_managed_evaluation(evaluation_id, current_user)

        if data.title is not None:
            evaluation.title = data.title

        if data.description is not None:
            evaluation.description = data.description

        evaluation = self.evaluation_repository.save(evaluation)
        return self._build_evaluation_response(evaluation)

    def delete_evaluation(
        self,
        evaluation_id: uuid.UUID,
        current_user: User,
    ) -> None:
        evaluation = self._get_managed_evaluation(evaluation_id, current_user)
        self.evaluation_repository.delete(evaluation)

    def add_question(
        self,
        evaluation_id: uuid.UUID,
        data: QuestionCreate,
        current_user: User,
    ) -> Question:
        self._get_managed_evaluation(evaluation_id, current_user)

        # El banco admite como máximo 20 preguntas (BR-021).
        count = self.evaluation_repository.count_questions(evaluation_id)
        if count >= self.REQUIRED_BANK_SIZE:
            raise BadRequestException(
                f"El banco ya tiene el máximo de {self.REQUIRED_BANK_SIZE} preguntas"
            )

        self._validate_question_options(data.question_type, data.options)

        return self.question_repository.create(
            evaluation_id=evaluation_id,
            statement=data.statement,
            question_type=data.question_type,
            options=[(option.text, option.is_correct) for option in data.options],
        )

    def list_questions(
        self,
        evaluation_id: uuid.UUID,
        current_user: User,
    ) -> list[Question]:
        self._get_managed_evaluation(evaluation_id, current_user)
        return self.question_repository.list_by_evaluation(evaluation_id)

    def update_question(
        self,
        question_id: uuid.UUID,
        data: QuestionUpdate,
        current_user: User,
    ) -> Question:
        question = self.question_repository.get_by_id(question_id)
        if question is None:
            raise NotFoundException("Pregunta no encontrada")

        self._get_managed_evaluation(question.evaluation_id, current_user)

        new_type = data.question_type or question.question_type

        if data.statement is not None:
            question.statement = data.statement

        if data.question_type is not None:
            question.question_type = data.question_type

        if data.options is not None:
            self._validate_question_options(new_type, data.options)
            self.question_repository.replace_options(
                question,
                [(option.text, option.is_correct) for option in data.options],
            )
        elif data.question_type is not None:
            # Si cambia el tipo sin reenviar opciones, las existentes deben seguir
            # siendo válidas para el nuevo tipo (p. ej. V/F exige dos opciones).
            current_options = [
                OptionCreate(text=option.text, is_correct=option.is_correct)
                for option in question.options
            ]
            self._validate_question_options(new_type, current_options)

        return self.question_repository.save(question)

    def delete_question(
        self,
        question_id: uuid.UUID,
        current_user: User,
    ) -> None:
        question = self.question_repository.get_by_id(question_id)
        if question is None:
            raise NotFoundException("Pregunta no encontrada")

        self._get_managed_evaluation(question.evaluation_id, current_user)
        self.question_repository.delete(question)

    # ------------------------------------------------------------------ #
    # Estudiante (rendir la evaluación)
    # ------------------------------------------------------------------ #

    def _resolve_evaluation_for_student(
        self,
        evaluation_id: uuid.UUID,
        current_user: User,
    ) -> Evaluation:
        evaluation = self.evaluation_repository.get_by_id(evaluation_id)
        if evaluation is None:
            raise NotFoundException("Evaluación no encontrada")

        module = self.module_repository.get_by_id(evaluation.module_id)
        if module is None:
            raise NotFoundException("Evaluación no encontrada")

        # Solo estudiantes matriculados pueden rendir la evaluación (BR-016).
        if not self.enrollment_repository.exists(current_user.id, module.course_id):
            raise ForbiddenException("No se encuentra matriculado en este curso")

        return evaluation

    def _correct_option_id(self, question: Question) -> uuid.UUID:
        for option in question.options:
            if option.is_correct:
                return option.id
        # No debería ocurrir: toda pregunta se valida con una opción correcta.
        raise BadRequestException("La pregunta no tiene una opción correcta definida")

    def _build_attempt_detail(
        self,
        attempt: EvaluationAttempt,
    ) -> AttemptDetailResponse:
        question_ids = [answer.question_id for answer in attempt.answers]
        questions = self.question_repository.list_by_ids(question_ids)
        questions_by_id = {question.id: question for question in questions}
        ordered_questions = sorted(questions, key=lambda question: question.created_at)

        submitted = attempt.status == AttemptStatus.SUBMITTED

        answers_out: list[AnswerResult] = []
        correct_count: int | None = None

        # Las respuestas correctas solo se revelan una vez enviado el intento.
        if submitted:
            correct_count = 0
            for answer in attempt.answers:
                question = questions_by_id[answer.question_id]
                answers_out.append(
                    AnswerResult(
                        question_id=answer.question_id,
                        selected_option_id=answer.selected_option_id,
                        correct_option_id=self._correct_option_id(question),
                        is_correct=answer.is_correct,
                    )
                )
                if answer.is_correct:
                    correct_count += 1

        score = float(attempt.score) if attempt.score is not None else None
        passed = score >= self.PASSING_SCORE if score is not None else None

        return AttemptDetailResponse(
            id=attempt.id,
            evaluation_id=attempt.evaluation_id,
            attempt_number=attempt.attempt_number,
            status=attempt.status,
            score=score,
            passed=passed,
            total_questions=len(attempt.answers),
            correct_count=correct_count,
            questions=[QuestionPublic.model_validate(q) for q in ordered_questions],
            answers=answers_out,
        )

    def _get_owned_attempt(
        self,
        attempt_id: uuid.UUID,
        current_user: User,
    ) -> EvaluationAttempt:
        attempt = self.attempt_repository.get_by_id(attempt_id)
        # Un intento solo es accesible por su propietario; se oculta a terceros.
        if attempt is None or attempt.user_id != current_user.id:
            raise NotFoundException("Intento no encontrado")
        return attempt

    def start_attempt(
        self,
        evaluation_id: uuid.UUID,
        current_user: User,
    ) -> AttemptDetailResponse:
        self._resolve_evaluation_for_student(evaluation_id, current_user)

        # Un intento en curso se reanuda en lugar de consumir un intento nuevo.
        in_progress = self.attempt_repository.get_in_progress(
            current_user.id,
            evaluation_id,
        )
        if in_progress is not None:
            return self._build_attempt_detail(in_progress)

        bank_size = self.evaluation_repository.count_questions(evaluation_id)
        if bank_size < self.REQUIRED_BANK_SIZE:
            raise BadRequestException(
                "La evaluación aún no está disponible: "
                f"requiere {self.REQUIRED_BANK_SIZE} preguntas"
            )

        attempts = self.attempt_repository.count_by_user_and_evaluation(
            current_user.id,
            evaluation_id,
        )
        if attempts >= self.MAX_ATTEMPTS:
            raise ConflictException(
                f"Ha alcanzado el máximo de {self.MAX_ATTEMPTS} intentos permitidos"
            )

        questions = self.question_repository.pick_random(
            evaluation_id,
            self.QUESTIONS_PER_ATTEMPT,
        )

        attempt = EvaluationAttempt(
            evaluation_id=evaluation_id,
            user_id=current_user.id,
            attempt_number=attempts + 1,
            status=AttemptStatus.IN_PROGRESS,
            answers=[
                AttemptAnswer(question_id=question.id, is_correct=False)
                for question in questions
            ],
        )
        attempt = self.attempt_repository.create(attempt)
        return self._build_attempt_detail(attempt)

    def submit_attempt(
        self,
        attempt_id: uuid.UUID,
        data: AttemptSubmit,
        current_user: User,
    ) -> AttemptDetailResponse:
        attempt = self._get_owned_attempt(attempt_id, current_user)

        if attempt.status != AttemptStatus.IN_PROGRESS:
            raise BadRequestException("Este intento ya fue enviado")

        question_ids = [answer.question_id for answer in attempt.answers]
        questions = self.question_repository.list_by_ids(question_ids)
        questions_by_id = {question.id: question for question in questions}

        selected_by_question = {
            answer.question_id: answer.selected_option_id for answer in data.answers
        }

        # Corrección automática: cada pregunta vale 1 punto; nota sobre 10 (BR-025).
        correct_count = 0
        for answer in attempt.answers:
            question = questions_by_id[answer.question_id]
            valid_option_ids = {option.id for option in question.options}

            selected = selected_by_question.get(answer.question_id)
            if selected is not None and selected not in valid_option_ids:
                raise BadRequestException(
                    "La opción seleccionada no pertenece a la pregunta"
                )

            answer.selected_option_id = selected
            answer.is_correct = (
                selected is not None
                and selected == self._correct_option_id(question)
            )
            if answer.is_correct:
                correct_count += 1

        attempt.score = round(
            correct_count / self.QUESTIONS_PER_ATTEMPT * self.MAX_SCORE, 2
        )
        attempt.status = AttemptStatus.SUBMITTED
        attempt.submitted_at = datetime.now(timezone.utc)

        attempt = self.attempt_repository.save(attempt)
        return self._build_attempt_detail(attempt)

    def get_attempt(
        self,
        attempt_id: uuid.UUID,
        current_user: User,
    ) -> AttemptDetailResponse:
        attempt = self._get_owned_attempt(attempt_id, current_user)
        return self._build_attempt_detail(attempt)

    def list_my_attempts(
        self,
        evaluation_id: uuid.UUID,
        current_user: User,
    ) -> list[AttemptSummary]:
        self._resolve_evaluation_for_student(evaluation_id, current_user)

        attempts = self.attempt_repository.list_by_user_and_evaluation(
            current_user.id,
            evaluation_id,
        )

        summaries: list[AttemptSummary] = []
        for attempt in attempts:
            score = float(attempt.score) if attempt.score is not None else None
            summaries.append(
                AttemptSummary(
                    id=attempt.id,
                    attempt_number=attempt.attempt_number,
                    status=attempt.status,
                    score=score,
                    passed=score >= self.PASSING_SCORE if score is not None else None,
                    created_at=attempt.created_at,
                    submitted_at=attempt.submitted_at,
                )
            )
        return summaries
