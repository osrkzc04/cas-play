import uuid

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.modules.course_modules.models import Module


class ModuleRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, module_id: uuid.UUID) -> Module | None:
        statement = select(Module).where(Module.id == module_id)
        return self.db.scalar(statement)

    def list_by_course(self, course_id: uuid.UUID) -> list[Module]:
        statement = (
            select(Module)
            .where(Module.course_id == course_id)
            .order_by(Module.position)
        )
        return list(self.db.scalars(statement).all())

    def next_position(self, course_id: uuid.UUID) -> int:
        statement = (
            select(func.coalesce(func.max(Module.position), 0))
            .where(Module.course_id == course_id)
        )
        return (self.db.scalar(statement) or 0) + 1

    def create(
        self,
        course_id: uuid.UUID,
        title: str,
        description: str | None,
        position: int,
    ) -> Module:
        module = Module(
            course_id=course_id,
            title=title,
            description=description,
            position=position,
        )

        self.db.add(module)
        self.db.commit()
        self.db.refresh(module)

        return module

    def save(self, module: Module) -> Module:
        self.db.commit()
        self.db.refresh(module)
        return module

    def save_reorder(self, modules: list[Module]) -> list[Module]:
        self.db.commit()
        for module in modules:
            self.db.refresh(module)
        return sorted(modules, key=lambda module: module.position)

    def delete(self, module: Module) -> None:
        self.db.delete(module)
        self.db.commit()
