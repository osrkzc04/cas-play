"""Integración — Certificados (elegibilidad, emisión y verificación)."""

import pytest

from app.core.exceptions import (
    BadRequestException,
    ConflictException,
    NotFoundException,
)
from app.modules.certificates.service import CertificateService
from app.modules.courses.service import CourseService
from app.modules.evaluations.schemas import AnswerSubmit, AttemptSubmit
from app.modules.evaluations.service import EvaluationService


def _pass_evaluation(db, factory, course, instructor, student):
    """Matricula, rinde y aprueba la evaluación final con nota máxima."""
    factory.enroll(student, course)
    evaluation = factory.evaluation_with_bank(course, instructor)
    service = EvaluationService(db)
    attempt = service.start_attempt(evaluation.id, student)
    correct = factory.correct_option_map(evaluation.id)
    service.submit_attempt(
        attempt.id,
        AttemptSubmit(
            answers=[
                AnswerSubmit(question_id=q.id, selected_option_id=correct[q.id])
                for q in attempt.questions
            ]
        ),
        student,
    )
    return evaluation


def test_eligibility_negative_without_attempt(db, factory):
    instructor = factory.instructor()
    student = factory.student()
    course = factory.course(instructor, published=True)
    factory.enroll(student, course)
    factory.evaluation_with_bank(course, instructor)

    eligibility = CertificateService(db).get_eligibility(course.id, student)
    assert eligibility.is_eligible is False
    assert eligibility.reason is not None


def test_eligibility_positive_after_passing(db, factory):
    instructor = factory.instructor()
    student = factory.student()
    course = factory.course(instructor, published=True)
    _pass_evaluation(db, factory, course, instructor, student)

    eligibility = CertificateService(db).get_eligibility(course.id, student)
    assert eligibility.is_eligible is True
    assert eligibility.final_score == 10.0


def test_eligibility_negative_with_incomplete_content(db, factory):
    instructor = factory.instructor()
    student = factory.student()
    course = factory.course(instructor, published=True)
    _, lessons = factory.lessons(course, instructor, count=3)
    _pass_evaluation(db, factory, course, instructor, student)
    factory.complete_lessons(student, lessons, count=2)

    eligibility = CertificateService(db).get_eligibility(course.id, student)
    assert eligibility.is_eligible is False
    assert "100% del contenido" in eligibility.reason


def test_eligibility_positive_with_full_content(db, factory):
    instructor = factory.instructor()
    student = factory.student()
    course = factory.course(instructor, published=True)
    _, lessons = factory.lessons(course, instructor, count=3)
    _pass_evaluation(db, factory, course, instructor, student)
    factory.complete_lessons(student, lessons, count=3)

    eligibility = CertificateService(db).get_eligibility(course.id, student)
    assert eligibility.is_eligible is True


def test_issue_not_eligible_fails(db, factory):
    instructor = factory.instructor()
    student = factory.student()
    course = factory.course(instructor, published=True)
    factory.enroll(student, course)
    factory.evaluation_with_bank(course, instructor)

    with pytest.raises(BadRequestException):
        CertificateService(db).issue_certificate(course.id, student)


def test_issue_certificate_succeeds(db, factory):
    instructor = factory.instructor()
    student = factory.student()
    course = factory.course(instructor, published=True)
    _pass_evaluation(db, factory, course, instructor, student)

    certificate = CertificateService(db).issue_certificate(course.id, student)
    assert certificate.code.startswith("CAS-")
    assert certificate.final_score == 10.0


def test_issue_duplicate_conflicts(db, factory):
    instructor = factory.instructor()
    student = factory.student()
    course = factory.course(instructor, published=True)
    _pass_evaluation(db, factory, course, instructor, student)
    service = CertificateService(db)
    service.issue_certificate(course.id, student)

    with pytest.raises(ConflictException):
        service.issue_certificate(course.id, student)


def test_verify_valid_certificate(db, factory):
    instructor = factory.instructor()
    student = factory.student()
    course = factory.course(instructor, published=True)
    _pass_evaluation(db, factory, course, instructor, student)
    service = CertificateService(db)
    certificate = service.issue_certificate(course.id, student)

    verification = service.verify_certificate(certificate.code)
    assert verification.is_valid is True
    assert verification.code == certificate.code


def test_verify_unknown_code_not_found(db, factory):
    with pytest.raises(NotFoundException):
        CertificateService(db).verify_certificate("CAS-0000-0000-0000")


def test_certificate_valid_after_course_hidden(db, factory):
    instructor = factory.instructor()
    student = factory.student()
    course = factory.course(instructor, published=True)
    _pass_evaluation(db, factory, course, instructor, student)
    service = CertificateService(db)
    certificate = service.issue_certificate(course.id, student)

    CourseService(db).hide_course(course.id, instructor)

    verification = service.verify_certificate(certificate.code)
    assert verification.is_valid is True
