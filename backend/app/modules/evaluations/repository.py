import uuid

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.modules.evaluations.models import (
    AnswerOption,
    AttemptAnswer,
    Evaluation,
    EvaluationAttempt,
    Question,
)


class EvaluationRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, evaluation_id: uuid.UUID) -> Evaluation | None:
        statement = select(Evaluation).where(Evaluation.id == evaluation_id)
        return self.db.scalar(statement)

    def get_by_module(self, module_id: uuid.UUID) -> Evaluation | None:
        statement = select(Evaluation).where(Evaluation.module_id == module_id)
        return self.db.scalar(statement)

    def create(
        self,
        module_id: uuid.UUID,
        title: str,
        description: str | None,
    ) -> Evaluation:
        evaluation = Evaluation(
            module_id=module_id,
            title=title,
            description=description,
        )

        self.db.add(evaluation)
        self.db.commit()
        self.db.refresh(evaluation)

        return evaluation

    def save(self, evaluation: Evaluation) -> Evaluation:
        self.db.commit()
        self.db.refresh(evaluation)
        return evaluation

    def delete(self, evaluation: Evaluation) -> None:
        self.db.delete(evaluation)
        self.db.commit()

    def count_questions(self, evaluation_id: uuid.UUID) -> int:
        statement = (
            select(func.count())
            .select_from(Question)
            .where(Question.evaluation_id == evaluation_id)
        )
        return self.db.scalar(statement) or 0


class QuestionRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, question_id: uuid.UUID) -> Question | None:
        statement = (
            select(Question)
            .where(Question.id == question_id)
            .options(selectinload(Question.options))
        )
        return self.db.scalar(statement)

    def list_by_evaluation(self, evaluation_id: uuid.UUID) -> list[Question]:
        statement = (
            select(Question)
            .where(Question.evaluation_id == evaluation_id)
            .options(selectinload(Question.options))
            .order_by(Question.created_at)
        )
        return list(self.db.scalars(statement).all())

    def pick_random(
        self,
        evaluation_id: uuid.UUID,
        limit: int,
    ) -> list[Question]:
        # Selección aleatoria de preguntas del banco para un intento (BR-022).
        statement = (
            select(Question)
            .where(Question.evaluation_id == evaluation_id)
            .options(selectinload(Question.options))
            .order_by(func.random())
            .limit(limit)
        )
        return list(self.db.scalars(statement).all())

    def list_by_ids(self, question_ids: list[uuid.UUID]) -> list[Question]:
        if not question_ids:
            return []
        statement = (
            select(Question)
            .where(Question.id.in_(question_ids))
            .options(selectinload(Question.options))
        )
        return list(self.db.scalars(statement).all())

    def create(
        self,
        evaluation_id: uuid.UUID,
        statement: str,
        question_type,
        options: list[tuple[str, bool]],
    ) -> Question:
        question = Question(
            evaluation_id=evaluation_id,
            statement=statement,
            question_type=question_type,
            options=[
                AnswerOption(text=text, is_correct=is_correct)
                for text, is_correct in options
            ],
        )

        self.db.add(question)
        self.db.commit()
        self.db.refresh(question)

        return question

    def replace_options(
        self,
        question: Question,
        options: list[tuple[str, bool]],
    ) -> None:
        question.options = [
            AnswerOption(text=text, is_correct=is_correct)
            for text, is_correct in options
        ]

    def save(self, question: Question) -> Question:
        self.db.commit()
        self.db.refresh(question)
        return question

    def delete(self, question: Question) -> None:
        self.db.delete(question)
        self.db.commit()


class AttemptRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, attempt_id: uuid.UUID) -> EvaluationAttempt | None:
        statement = (
            select(EvaluationAttempt)
            .where(EvaluationAttempt.id == attempt_id)
            .options(selectinload(EvaluationAttempt.answers))
        )
        return self.db.scalar(statement)

    def count_by_user_and_evaluation(
        self,
        user_id: uuid.UUID,
        evaluation_id: uuid.UUID,
    ) -> int:
        statement = (
            select(func.count())
            .select_from(EvaluationAttempt)
            .where(
                EvaluationAttempt.user_id == user_id,
                EvaluationAttempt.evaluation_id == evaluation_id,
            )
        )
        return self.db.scalar(statement) or 0

    def get_in_progress(
        self,
        user_id: uuid.UUID,
        evaluation_id: uuid.UUID,
    ) -> EvaluationAttempt | None:
        from app.shared.enums import AttemptStatus

        statement = (
            select(EvaluationAttempt)
            .where(
                EvaluationAttempt.user_id == user_id,
                EvaluationAttempt.evaluation_id == evaluation_id,
                EvaluationAttempt.status == AttemptStatus.IN_PROGRESS,
            )
            .options(selectinload(EvaluationAttempt.answers))
        )
        return self.db.scalar(statement)

    def list_by_user_and_evaluation(
        self,
        user_id: uuid.UUID,
        evaluation_id: uuid.UUID,
    ) -> list[EvaluationAttempt]:
        statement = (
            select(EvaluationAttempt)
            .where(
                EvaluationAttempt.user_id == user_id,
                EvaluationAttempt.evaluation_id == evaluation_id,
            )
            .order_by(EvaluationAttempt.attempt_number)
        )
        return list(self.db.scalars(statement).all())

    def create(self, attempt: EvaluationAttempt) -> EvaluationAttempt:
        self.db.add(attempt)
        self.db.commit()
        self.db.refresh(attempt)
        return attempt

    def save(self, attempt: EvaluationAttempt) -> EvaluationAttempt:
        self.db.commit()
        self.db.refresh(attempt)
        return attempt
