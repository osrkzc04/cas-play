"""Integración — Evaluaciones (inicio, envío, calificación e intentos)."""

import pytest

from app.core.exceptions import (
    BadRequestException,
    ConflictException,
    ForbiddenException,
)
from app.modules.evaluations.schemas import (
    AnswerSubmit,
    AttemptSubmit,
    EvaluationCreate,
    OptionCreate,
    QuestionCreate,
)
from app.modules.evaluations.service import EvaluationService
from app.shared.enums import AttemptStatus, QuestionType


def _submit_all_correct(db, factory, service, attempt, evaluation_id, student):
    correct = factory.correct_option_map(evaluation_id)
    payload = AttemptSubmit(
        answers=[
            AnswerSubmit(question_id=q.id, selected_option_id=correct[q.id])
            for q in attempt.questions
        ]
    )
    return service.submit_attempt(attempt.id, payload, student)


def test_single_evaluation_per_course(db, factory):
    instructor = factory.instructor()
    course = factory.course(instructor, published=True)
    service = EvaluationService(db)
    service.create_evaluation(course.id, EvaluationCreate(title="Final"), instructor)

    with pytest.raises(ConflictException):
        service.create_evaluation(
            course.id, EvaluationCreate(title="Otra"), instructor
        )


def test_question_bank_is_capped_at_20(db, factory):
    instructor = factory.instructor()
    course = factory.course(instructor, published=True)
    evaluation = factory.evaluation_with_bank(course, instructor, size=20)

    with pytest.raises(BadRequestException):
        EvaluationService(db).add_question(
            evaluation.id,
            QuestionCreate(
                statement="Extra",
                question_type=QuestionType.MULTIPLE_CHOICE,
                options=[
                    OptionCreate(text="A", is_correct=True),
                    OptionCreate(text="B", is_correct=False),
                ],
            ),
            instructor,
        )


def test_start_attempt_picks_ten_questions(db, factory):
    instructor = factory.instructor()
    student = factory.student()
    course = factory.course(instructor, published=True)
    factory.enroll(student, course)
    evaluation = factory.evaluation_with_bank(course, instructor)

    attempt = EvaluationService(db).start_attempt(evaluation.id, student)
    assert len(attempt.questions) == 10
    assert attempt.status == AttemptStatus.IN_PROGRESS


def test_start_attempt_requires_enrollment(db, factory):
    instructor = factory.instructor()
    student = factory.student()
    course = factory.course(instructor, published=True)
    evaluation = factory.evaluation_with_bank(course, instructor)

    with pytest.raises(ForbiddenException):
        EvaluationService(db).start_attempt(evaluation.id, student)


def test_start_attempt_resumes_in_progress(db, factory):
    instructor = factory.instructor()
    student = factory.student()
    course = factory.course(instructor, published=True)
    factory.enroll(student, course)
    evaluation = factory.evaluation_with_bank(course, instructor)
    service = EvaluationService(db)

    first = service.start_attempt(evaluation.id, student)
    second = service.start_attempt(evaluation.id, student)
    assert first.id == second.id


def test_max_two_attempts_enforced(db, factory):
    instructor = factory.instructor()
    student = factory.student()
    course = factory.course(instructor, published=True)
    factory.enroll(student, course)
    evaluation = factory.evaluation_with_bank(course, instructor)
    service = EvaluationService(db)

    for _ in range(2):
        attempt = service.start_attempt(evaluation.id, student)
        _submit_all_correct(db, factory, service, attempt, evaluation.id, student)

    with pytest.raises(ConflictException):
        service.start_attempt(evaluation.id, student)


def test_submit_scores_and_marks_passed(db, factory):
    instructor = factory.instructor()
    student = factory.student()
    course = factory.course(instructor, published=True)
    factory.enroll(student, course)
    evaluation = factory.evaluation_with_bank(course, instructor)
    service = EvaluationService(db)

    attempt = service.start_attempt(evaluation.id, student)
    result = _submit_all_correct(db, factory, service, attempt, evaluation.id, student)

    assert result.score == 10.0
    assert result.passed is True
    assert result.status == AttemptStatus.SUBMITTED


def test_resubmit_submitted_attempt_fails(db, factory):
    instructor = factory.instructor()
    student = factory.student()
    course = factory.course(instructor, published=True)
    factory.enroll(student, course)
    evaluation = factory.evaluation_with_bank(course, instructor)
    service = EvaluationService(db)

    attempt = service.start_attempt(evaluation.id, student)
    _submit_all_correct(db, factory, service, attempt, evaluation.id, student)

    with pytest.raises(BadRequestException):
        service.submit_attempt(attempt.id, AttemptSubmit(answers=[]), student)
