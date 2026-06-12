import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.base_model import BaseModel
from app.shared.enums import AttemptStatus, QuestionType


class Evaluation(Base, BaseModel):
    __tablename__ = "evaluations"

    # Cada módulo tiene una única evaluación (BR-020).
    __table_args__ = (
        UniqueConstraint("module_id", name="uq_evaluation_module"),
    )

    module_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("modules.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    title: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    questions: Mapped[list["Question"]] = relationship(
        back_populates="evaluation",
        cascade="all, delete-orphan",
        order_by="Question.created_at",
    )


class Question(Base, BaseModel):
    __tablename__ = "questions"

    evaluation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("evaluations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    statement: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    question_type: Mapped[QuestionType] = mapped_column(
        Enum(QuestionType, name="question_type"),
        nullable=False,
    )

    evaluation: Mapped["Evaluation"] = relationship(back_populates="questions")

    options: Mapped[list["AnswerOption"]] = relationship(
        back_populates="question",
        cascade="all, delete-orphan",
        order_by="AnswerOption.created_at",
    )


class AnswerOption(Base, BaseModel):
    __tablename__ = "answer_options"

    question_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("questions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    text: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )

    # Cada pregunta tiene exactamente una opción correcta (validado en el service).
    is_correct: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    question: Mapped["Question"] = relationship(back_populates="options")


class EvaluationAttempt(Base, BaseModel):
    __tablename__ = "evaluation_attempts"

    # Un intento se identifica de forma única por evaluación, estudiante y número
    # de intento (1 o 2); refuerza el límite de intentos (BR-024).
    __table_args__ = (
        UniqueConstraint(
            "evaluation_id",
            "user_id",
            "attempt_number",
            name="uq_attempt_evaluation_user_number",
        ),
    )

    evaluation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("evaluations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    attempt_number: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    status: Mapped[AttemptStatus] = mapped_column(
        Enum(AttemptStatus, name="attempt_status"),
        nullable=False,
        default=AttemptStatus.IN_PROGRESS,
    )

    # Nota sobre 10; nula mientras el intento sigue en curso (BR-025).
    score: Mapped[Decimal | None] = mapped_column(
        Numeric(5, 2),
        nullable=True,
    )

    submitted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    answers: Mapped[list["AttemptAnswer"]] = relationship(
        back_populates="attempt",
        cascade="all, delete-orphan",
    )


class AttemptAnswer(Base, BaseModel):
    __tablename__ = "attempt_answers"

    attempt_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("evaluation_attempts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    question_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("questions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Opción elegida por el estudiante; nula si la pregunta queda sin responder.
    selected_option_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("answer_options.id", ondelete="SET NULL"),
        nullable=True,
    )

    is_correct: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    attempt: Mapped["EvaluationAttempt"] = relationship(back_populates="answers")
    question: Mapped["Question"] = relationship()
