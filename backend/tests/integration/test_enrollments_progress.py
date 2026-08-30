"""Integración — Matrículas y progreso."""

import pytest

from app.core.exceptions import (
    ConflictException,
    ForbiddenException,
    NotFoundException,
)
from app.modules.enrollments.schemas import AdminEnrollmentCreate
from app.modules.enrollments.service import EnrollmentService
from app.modules.progress.service import ProgressService


def test_enroll_in_published_course(db, factory):
    instructor = factory.instructor()
    student = factory.student()
    course = factory.course(instructor, published=True)

    enrollment = EnrollmentService(db).enroll(course.id, student)
    assert enrollment.user_id == student.id
    assert enrollment.course_id == course.id


def test_duplicate_enrollment_conflicts(db, factory):
    instructor = factory.instructor()
    student = factory.student()
    course = factory.course(instructor, published=True)
    service = EnrollmentService(db)
    service.enroll(course.id, student)

    with pytest.raises(ConflictException):
        service.enroll(course.id, student)


def test_enroll_in_unpublished_course_not_found(db, factory):
    instructor = factory.instructor()
    student = factory.student()
    draft = factory.course(instructor)  # DRAFT

    with pytest.raises(NotFoundException):
        EnrollmentService(db).enroll(draft.id, student)


def test_admin_enrollment_creates_new_student(db, factory):
    admin = factory.admin()
    instructor = factory.instructor()
    course = factory.course(instructor, published=True)

    enrollment, user, created = EnrollmentService(db).create_admin_enrollment(
        AdminEnrollmentCreate(
            course_id=course.id,
            email="nuevo.alumno@casplay.com",
            first_name="Nuevo",
            last_name="Alumno",
        ),
        actor=admin,
    )

    assert created is True
    assert user.email == "nuevo.alumno@casplay.com"
    assert enrollment.course_id == course.id


def test_admin_enrollment_reuses_existing_student(db, factory):
    admin = factory.admin()
    instructor = factory.instructor()
    course = factory.course(instructor, published=True)
    student = factory.student(email="existente@casplay.com")

    _, user, created = EnrollmentService(db).create_admin_enrollment(
        AdminEnrollmentCreate(course_id=course.id, email=student.email),
        actor=admin,
    )

    assert created is False
    assert user.id == student.id


def test_admin_enrollment_already_enrolled_conflicts(db, factory):
    admin = factory.admin()
    instructor = factory.instructor()
    course = factory.course(instructor, published=True)
    student = factory.student(email="ya@casplay.com")
    factory.enroll(student, course)

    with pytest.raises(ConflictException):
        EnrollmentService(db).create_admin_enrollment(
            AdminEnrollmentCreate(course_id=course.id, email=student.email),
            actor=admin,
        )


def test_complete_lesson_marks_completed(db, factory):
    instructor = factory.instructor()
    student = factory.student()
    course = factory.course(instructor, published=True)
    _, lessons = factory.lessons(course, instructor, count=1)
    factory.enroll(student, course)

    progress = ProgressService(db).complete_lesson(lessons[0].id, student)
    assert progress.is_completed is True
    assert progress.completed_at is not None


def test_save_last_second_persists(db, factory):
    instructor = factory.instructor()
    student = factory.student()
    course = factory.course(instructor, published=True)
    _, lessons = factory.lessons(course, instructor, count=1)
    factory.enroll(student, course)

    progress = ProgressService(db).save_last_second(lessons[0].id, 42, student)
    assert progress.last_second == 42


def test_progress_without_enrollment_forbidden(db, factory):
    instructor = factory.instructor()
    student = factory.student()
    course = factory.course(instructor, published=True)
    _, lessons = factory.lessons(course, instructor, count=1)

    with pytest.raises(ForbiddenException):
        ProgressService(db).complete_lesson(lessons[0].id, student)


def test_course_progress_percentage(db, factory):
    instructor = factory.instructor()
    student = factory.student()
    course = factory.course(instructor, published=True)
    _, lessons = factory.lessons(course, instructor, count=2)
    factory.enroll(student, course)
    factory.complete_lessons(student, lessons, count=1)

    result = ProgressService(db).get_course_progress(course.id, student)
    assert result.total_lessons == 2
    assert result.completed_lessons == 1
    assert result.percentage == 50.0
