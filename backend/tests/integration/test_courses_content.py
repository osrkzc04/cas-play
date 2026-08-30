"""Integración — Cursos y contenidos (creación, publicación, estados, acceso)."""

import pytest

from app.core.exceptions import (
    BadRequestException,
    ForbiddenException,
    NotFoundException,
)
from app.modules.courses.schemas import CourseCreate
from app.modules.courses.service import CourseService
from app.modules.lessons.service import LessonService
from app.shared.enums import CourseStatus


def test_instructor_creates_own_course(db, factory):
    instructor = factory.instructor()
    course = CourseService(db).create_course(
        CourseCreate(title="Cocina básica"), instructor
    )
    assert course.instructor_id == instructor.id


def test_admin_creates_course_for_instructor(db, factory):
    admin = factory.admin()
    instructor = factory.instructor()

    course = CourseService(db).create_course(
        CourseCreate(title="Repostería", instructor_id=instructor.id), admin
    )
    assert course.instructor_id == instructor.id


def test_admin_create_with_invalid_instructor_fails(db, factory):
    admin = factory.admin()
    student = factory.student()

    with pytest.raises(BadRequestException):
        CourseService(db).create_course(
            CourseCreate(title="Inválido", instructor_id=student.id), admin
        )


def test_publish_moves_draft_to_published(db, factory):
    instructor = factory.instructor()
    course = factory.course(instructor)

    published = CourseService(db).publish_course(course.id, instructor)
    assert published.status == CourseStatus.PUBLISHED


def test_invalid_transition_is_rejected(db, factory):
    instructor = factory.instructor()
    course = factory.course(instructor)  # DRAFT

    # DRAFT no puede pasar directamente a HIDDEN.
    with pytest.raises(BadRequestException):
        CourseService(db).hide_course(course.id, instructor)


def test_finished_course_is_terminal(db, factory):
    instructor = factory.instructor()
    service = CourseService(db)
    course = factory.course(instructor, published=True)
    service.finish_course(course.id, instructor)

    with pytest.raises(BadRequestException):
        service.publish_course(course.id, instructor)


def test_public_course_only_when_published(db, factory):
    instructor = factory.instructor()
    service = CourseService(db)
    draft = factory.course(instructor)

    with pytest.raises(NotFoundException):
        service.get_public_course(draft.id)

    published = factory.course(instructor, published=True)
    assert service.get_public_course(published.id).id == published.id


def test_lessons_get_incremental_position(db, factory):
    instructor = factory.instructor()
    course = factory.course(instructor)
    _, lessons = factory.lessons(course, instructor, count=2)

    positions = sorted(lesson.position for lesson in lessons)
    assert positions == [1, 2]


def test_reorder_lessons_with_exact_set(db, factory):
    instructor = factory.instructor()
    course = factory.course(instructor)
    module, lessons = factory.lessons(course, instructor, count=2)

    reordered_ids = [lessons[1].id, lessons[0].id]
    result = LessonService(db).reorder_lessons(module.id, reordered_ids, instructor)

    by_id = {lesson.id: lesson.position for lesson in result}
    assert by_id[lessons[1].id] == 1
    assert by_id[lessons[0].id] == 2


def test_reorder_lessons_with_invalid_set_fails(db, factory):
    instructor = factory.instructor()
    course = factory.course(instructor)
    module, lessons = factory.lessons(course, instructor, count=2)

    with pytest.raises(BadRequestException):
        LessonService(db).reorder_lessons(module.id, [lessons[0].id], instructor)


def test_preview_lesson_is_public(db, factory):
    instructor = factory.instructor()
    course = factory.course(instructor, published=True)
    _, lessons = factory.lessons(course, instructor, count=1, preview_first=True)

    lesson = LessonService(db).get_consumable_lesson(lessons[0].id, None)
    assert lesson.id == lessons[0].id


def test_non_preview_content_requires_enrollment(db, factory):
    instructor = factory.instructor()
    student = factory.student()
    course = factory.course(instructor, published=True)
    _, lessons = factory.lessons(course, instructor, count=1)

    with pytest.raises(ForbiddenException):
        LessonService(db).get_consumable_lesson(lessons[0].id, student)


def test_enrolled_student_accesses_content(db, factory):
    instructor = factory.instructor()
    student = factory.student()
    course = factory.course(instructor, published=True)
    _, lessons = factory.lessons(course, instructor, count=1)
    factory.enroll(student, course)

    lesson = LessonService(db).get_consumable_lesson(lessons[0].id, student)
    assert lesson.id == lessons[0].id
