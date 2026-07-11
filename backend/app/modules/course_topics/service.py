import uuid

from sqlalchemy.orm import Session

from app.modules.course_topics.models import CourseTopic
from app.modules.course_topics.repository import CourseTopicRepository
from app.modules.course_topics.schemas import CourseTopicReplace
from app.modules.courses.service import CourseService
from app.modules.users.models import User


class CourseTopicService:
    def __init__(self, db: Session):
        self.topic_repository = CourseTopicRepository(db)
        # Reutiliza el control de propiedad/rol del módulo de cursos.
        self.course_service = CourseService(db)

    def list_topics(
        self,
        course_id: uuid.UUID,
        current_user: User,
    ) -> list[CourseTopic]:
        self.course_service.get_managed_course(course_id, current_user)
        return self.topic_repository.list_by_course(course_id)

    def replace_topics(
        self,
        course_id: uuid.UUID,
        data: CourseTopicReplace,
        current_user: User,
    ) -> list[CourseTopic]:
        self.course_service.get_managed_course(course_id, current_user)
        return self.topic_repository.replace_all(course_id, data.items)
