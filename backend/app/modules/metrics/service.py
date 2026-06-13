from sqlalchemy.orm import Session

from app.modules.metrics.repository import MetricsRepository
from app.modules.metrics.schemas import (
    AdminCourseRow,
    AdminMetricsResponse,
    CourseStatusCountsResponse,
    InstructorCourseRow,
    InstructorMetricsResponse,
    StudentCourseRow,
    StudentMetricsResponse,
    UserCountsResponse,
)
from app.modules.users.models import User
from app.shared.enums import CourseStatus

TOP_COURSES_LIMIT = 5


class MetricsService:
    def __init__(self, db: Session):
        self.repository = MetricsRepository(db)

    def get_admin_metrics(self) -> AdminMetricsResponse:
        user_counts = self.repository.count_users_by_role()
        status_counts = self.repository.count_courses_by_status()

        top = self.repository.top_courses_by_enrollments(TOP_COURSES_LIMIT)
        top_ids = [course.id for course, _ in top]
        certificates = self.repository.certificates_by_course(top_ids)
        ratings = self.repository.ratings_by_course(top_ids)

        top_courses = [
            AdminCourseRow(
                course_id=course.id,
                title=course.title,
                status=course.status,
                enrollments=enrollments,
                certificates=certificates.get(course.id, 0),
                average_rating=self._round_rating(ratings.get(course.id)),
            )
            for course, enrollments in top
        ]

        return AdminMetricsResponse(
            users=UserCountsResponse(**user_counts),
            courses=self._course_status_counts(status_counts),
            enrollments_total=self.repository.count_enrollments(),
            certificates_total=self.repository.count_certificates(),
            top_courses=top_courses,
        )

    def get_instructor_metrics(self, current_user: User) -> InstructorMetricsResponse:
        courses = self.repository.list_courses_by_instructor(current_user.id)
        course_ids = [course.id for course in courses]

        status_counts = self.repository.count_courses_by_status(current_user.id)
        enrollments = self.repository.enrollments_by_course(course_ids)
        certificates = self.repository.certificates_by_course(course_ids)
        ratings = self.repository.ratings_by_course(course_ids)

        breakdown = [
            InstructorCourseRow(
                course_id=course.id,
                title=course.title,
                status=course.status,
                enrollments=enrollments.get(course.id, 0),
                certificates=certificates.get(course.id, 0),
                ratings_count=ratings.get(course.id, (0.0, 0))[1],
                average_rating=self._round_rating(ratings.get(course.id)),
            )
            for course in courses
        ]

        ratings_total = sum(count for _, count in ratings.values())
        # Promedio ponderado de todas las valoraciones de los cursos del instructor.
        weighted_sum = sum(avg * count for avg, count in ratings.values())
        average_rating = (
            round(weighted_sum / ratings_total, 2) if ratings_total else None
        )

        return InstructorMetricsResponse(
            courses=self._course_status_counts(status_counts),
            enrollments_total=self.repository.count_enrollments(course_ids),
            certificates_total=self.repository.count_certificates(course_ids),
            ratings_total=ratings_total,
            average_rating=average_rating,
            courses_breakdown=breakdown,
        )

    def get_student_metrics(self, current_user: User) -> StudentMetricsResponse:
        enrollments = self.repository.list_enrollments_with_course(current_user.id)
        course_ids = [enrollment.course_id for enrollment in enrollments]

        total_lessons = self.repository.lessons_count_by_courses(course_ids)
        completed_lessons = self.repository.completed_lessons_by_courses(
            current_user.id,
            course_ids,
        )
        certified = self.repository.certificate_course_ids(current_user.id, course_ids)

        breakdown: list[StudentCourseRow] = []
        completed_courses = 0
        for enrollment in enrollments:
            course_id = enrollment.course_id
            total = total_lessons.get(course_id, 0)
            done = completed_lessons.get(course_id, 0)
            # El avance se calcula sobre las clases completadas (BR-019).
            percentage = round(done / total * 100, 2) if total else 0.0
            is_complete = total > 0 and done == total
            if is_complete:
                completed_courses += 1

            breakdown.append(
                StudentCourseRow(
                    course_id=course_id,
                    title=enrollment.course.title,
                    total_lessons=total,
                    completed_lessons=done,
                    progress_percentage=percentage,
                    has_certificate=course_id in certified,
                )
            )

        enrolled_courses = len(enrollments)

        return StudentMetricsResponse(
            enrolled_courses=enrolled_courses,
            completed_courses=completed_courses,
            in_progress_courses=enrolled_courses - completed_courses,
            certificates_earned=len(certified),
            courses_breakdown=breakdown,
        )

    # ------------------------------------------------------------------ #

    @staticmethod
    def _course_status_counts(
        counts: dict[CourseStatus, int],
    ) -> CourseStatusCountsResponse:
        return CourseStatusCountsResponse(
            total=sum(counts.values()),
            draft=counts.get(CourseStatus.DRAFT, 0),
            published=counts.get(CourseStatus.PUBLISHED, 0),
            hidden=counts.get(CourseStatus.HIDDEN, 0),
            finished=counts.get(CourseStatus.FINISHED, 0),
        )

    @staticmethod
    def _round_rating(value: tuple[float, int] | None) -> float | None:
        if value is None:
            return None
        return round(value[0], 2)
