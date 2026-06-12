from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.auth.models import PasswordResetToken, RefreshToken


class RefreshTokenRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(
        self,
        user_id,
        token: str,
        expires_at: datetime,
    ) -> RefreshToken:
        refresh_token = RefreshToken(
            user_id=user_id,
            token=token,
            expires_at=expires_at,
        )

        self.db.add(refresh_token)
        self.db.commit()
        self.db.refresh(refresh_token)

        return refresh_token

    def get_active_by_token(self, token: str) -> RefreshToken | None:
        now = datetime.now(timezone.utc)

        statement = select(RefreshToken).where(
            RefreshToken.token == token,
            RefreshToken.revoked_at.is_(None),
            RefreshToken.expires_at > now,
        )

        return self.db.scalar(statement)

    def revoke(self, refresh_token: RefreshToken) -> RefreshToken:
        refresh_token.revoked_at = datetime.now(timezone.utc)

        self.db.commit()
        self.db.refresh(refresh_token)

        return refresh_token

    def revoke_all_by_user_id(self, user_id) -> None:
        now = datetime.now(timezone.utc)

        statement = select(RefreshToken).where(
            RefreshToken.user_id == user_id,
            RefreshToken.revoked_at.is_(None),
        )

        tokens = self.db.scalars(statement).all()

        for token in tokens:
            token.revoked_at = now

        self.db.commit()


class PasswordResetTokenRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(
        self,
        user_id,
        token: str,
        expires_at: datetime,
    ) -> PasswordResetToken:
        password_reset_token = PasswordResetToken(
            user_id=user_id,
            token=token,
            expires_at=expires_at,
        )

        self.db.add(password_reset_token)
        self.db.commit()
        self.db.refresh(password_reset_token)

        return password_reset_token

    def get_active_by_token(self, token: str) -> PasswordResetToken | None:
        now = datetime.now(timezone.utc)

        statement = select(PasswordResetToken).where(
            PasswordResetToken.token == token,
            PasswordResetToken.used_at.is_(None),
            PasswordResetToken.expires_at > now,
        )

        return self.db.scalar(statement)

    def mark_as_used(self, token: PasswordResetToken) -> PasswordResetToken:
        token.used_at = datetime.now(timezone.utc)

        self.db.commit()
        self.db.refresh(token)

        return token