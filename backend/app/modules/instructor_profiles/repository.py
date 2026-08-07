import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.instructor_profiles.models import InstructorProfile


class InstructorProfileRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_user_id(self, user_id: uuid.UUID) -> InstructorProfile | None:
        statement = select(InstructorProfile).where(
            InstructorProfile.user_id == user_id
        )
        return self.db.scalar(statement)

    def create(self, user_id: uuid.UUID) -> InstructorProfile:
        profile = InstructorProfile(user_id=user_id)

        self.db.add(profile)
        self.db.commit()
        self.db.refresh(profile)

        return profile

    def save(self, profile: InstructorProfile) -> InstructorProfile:
        self.db.commit()
        self.db.refresh(profile)
        return profile
