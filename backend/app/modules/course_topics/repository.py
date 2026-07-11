import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.course_topics.models import CourseTopic
from app.modules.course_topics.schemas import CourseTopicItem


class CourseTopicRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_by_course(self, course_id: uuid.UUID) -> list[CourseTopic]:
        statement = (
            select(CourseTopic)
            .where(CourseTopic.course_id == course_id)
            .order_by(CourseTopic.position)
        )
        return list(self.db.scalars(statement).all())

    def replace_all(
        self,
        course_id: uuid.UUID,
        items: list[CourseTopicItem],
    ) -> list[CourseTopic]:
        # Estrategia de reemplazo total: se eliminan los topics existentes y se
        # reinsertan con posiciones recalculadas. Simplifica la edición de
        # listas cortas frente a un CRUD granular con reordenamiento.
        existing = self.list_by_course(course_id)
        for topic in existing:
            self.db.delete(topic)

        if existing:
            self.db.flush()

        created: list[CourseTopic] = []
        for position, item in enumerate(items, start=1):
            topic = CourseTopic(
                course_id=course_id,
                content=item.content,
                position=position,
            )
            self.db.add(topic)
            created.append(topic)

        self.db.commit()
        for topic in created:
            self.db.refresh(topic)

        return sorted(created, key=lambda t: t.position)
