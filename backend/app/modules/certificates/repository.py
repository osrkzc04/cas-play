import uuid

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.modules.certificates.models import Certificate


class CertificateRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, certificate_id: uuid.UUID) -> Certificate | None:
        statement = select(Certificate).where(Certificate.id == certificate_id)
        return self.db.scalar(statement)

    def get_by_code(self, code: str) -> Certificate | None:
        statement = select(Certificate).where(Certificate.code == code)
        return self.db.scalar(statement)

    def get_by_user_and_course(
        self,
        user_id: uuid.UUID,
        course_id: uuid.UUID,
    ) -> Certificate | None:
        statement = select(Certificate).where(
            Certificate.user_id == user_id,
            Certificate.course_id == course_id,
        )
        return self.db.scalar(statement)

    def exists_code(self, code: str) -> bool:
        statement = (
            select(func.count())
            .select_from(Certificate)
            .where(Certificate.code == code)
        )
        return (self.db.scalar(statement) or 0) > 0

    def add(self, certificate: Certificate) -> Certificate:
        self.db.add(certificate)
        self.db.commit()
        self.db.refresh(certificate)
        return certificate

    def save(self, certificate: Certificate) -> Certificate:
        self.db.commit()
        self.db.refresh(certificate)
        return certificate

    def list_by_user(
        self,
        user_id: uuid.UUID,
        skip: int,
        limit: int,
    ) -> list[Certificate]:
        statement = (
            select(Certificate)
            .where(Certificate.user_id == user_id)
            .order_by(Certificate.issued_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(self.db.scalars(statement).all())

    def count_by_user(self, user_id: uuid.UUID) -> int:
        statement = (
            select(func.count())
            .select_from(Certificate)
            .where(Certificate.user_id == user_id)
        )
        return self.db.scalar(statement) or 0

    def list_all(
        self,
        course_id: uuid.UUID | None,
        skip: int,
        limit: int,
    ) -> list[Certificate]:
        statement = select(Certificate)
        if course_id is not None:
            statement = statement.where(Certificate.course_id == course_id)
        statement = (
            statement.order_by(Certificate.issued_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(self.db.scalars(statement).all())

    def count_all(self, course_id: uuid.UUID | None) -> int:
        statement = select(func.count()).select_from(Certificate)
        if course_id is not None:
            statement = statement.where(Certificate.course_id == course_id)
        return self.db.scalar(statement) or 0
