from datetime import datetime, timezone
import uuid
from sqlalchemy import (
    Column,
    String,
    Boolean,
    DateTime,
    Date,
    UniqueConstraint,
    JSON,
)
from sqlalchemy.dialects.postgresql import UUID
from app.database.base import Base


class UserNotificationPreference(Base):
    __tablename__ = "user_notification_preferences"

    user_id = Column(String, primary_key=True)
    daily_digest_enabled = Column(Boolean, default=True, nullable=False)
    include_messages = Column(Boolean, default=True, nullable=False)
    include_invitations = Column(Boolean, default=True, nullable=False)
    include_recommendations = Column(Boolean, default=True, nullable=False)
    include_project_activity = Column(Boolean, default=True, nullable=False)
    updated_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )


class DailyDigestLog(Base):
    __tablename__ = "daily_digest_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String, nullable=False, index=True)
    digest_date = Column(Date, nullable=False)  # UTC date of the digest
    sent_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    summary_data = Column(JSON, nullable=True)

    __table_args__ = (
        UniqueConstraint("user_id", "digest_date", name="uq_user_daily_digest_date"),
    )
