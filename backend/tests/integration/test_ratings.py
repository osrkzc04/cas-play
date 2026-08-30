"""Integración — Valoraciones (según progreso y prevención de duplicados)."""

import pytest

from app.core.exceptions import ConflictException, ForbiddenException
from app.modules.ratings.schemas import RatingCreate, RatingUpdate
from app.modules.ratings.service import RatingService


def test_rate_course_with_enough_progress(db, factory):
    instructor = factory.instructor()
    student = factory.student()
    course = factory.course(instructor, published=True)
    _, lessons = factory.lessons(course, instructor, count=1)
    factory.enroll(student, course)
    factory.complete_lessons(student, lessons, count=1)  # 100%

    rating = RatingService(db).rate_course(
        course.id, RatingCreate(score=5, comment="Excelente"), student
    )
    assert rating.score == 5


def test_rate_course_below_progress_forbidden(db, factory):
    instructor = factory.instructor()
    student = factory.student()
    course = factory.course(instructor, published=True)
    factory.lessons(course, instructor, count=2)  # 0% completado
    factory.enroll(student, course)

    with pytest.raises(ForbiddenException):
        RatingService(db).rate_course(
            course.id, RatingCreate(score=4), student
        )


def test_rate_course_without_enrollment_forbidden(db, factory):
    instructor = factory.instructor()
    student = factory.student()
    course = factory.course(instructor, published=True)
    factory.lessons(course, instructor, count=1)

    with pytest.raises(ForbiddenException):
        RatingService(db).rate_course(
            course.id, RatingCreate(score=5), student
        )


def test_duplicate_rating_conflicts(db, factory):
    instructor = factory.instructor()
    student = factory.student()
    course = factory.course(instructor, published=True)
    _, lessons = factory.lessons(course, instructor, count=1)
    factory.enroll(student, course)
    factory.complete_lessons(student, lessons, count=1)
    service = RatingService(db)
    service.rate_course(course.id, RatingCreate(score=5), student)

    with pytest.raises(ConflictException):
        service.rate_course(course.id, RatingCreate(score=4), student)


def test_update_my_rating(db, factory):
    instructor = factory.instructor()
    student = factory.student()
    course = factory.course(instructor, published=True)
    _, lessons = factory.lessons(course, instructor, count=1)
    factory.enroll(student, course)
    factory.complete_lessons(student, lessons, count=1)
    service = RatingService(db)
    service.rate_course(course.id, RatingCreate(score=3), student)

    updated = service.update_my_rating(
        course.id, RatingUpdate(score=5, comment="Mejoró"), student
    )
    assert updated.score == 5


def test_course_summary_reports_average(db, factory):
    instructor = factory.instructor()
    student = factory.student()
    course = factory.course(instructor, published=True)
    _, lessons = factory.lessons(course, instructor, count=1)
    factory.enroll(student, course)
    factory.complete_lessons(student, lessons, count=1)
    service = RatingService(db)
    service.rate_course(course.id, RatingCreate(score=4), student)

    summary = service.get_course_summary(course.id)
    assert summary.total == 1
    assert summary.average == 4.0
