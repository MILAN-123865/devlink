from datetime import datetime, timezone, timedelta, date
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.models.digest import UserNotificationPreference, DailyDigestLog


class DailyDigestService:
    @staticmethod
    def get_user_preferences(
        session: Session, user_id: str
    ) -> UserNotificationPreference:
        pref = session.get(UserNotificationPreference, user_id)
        if not pref:
            # Default preferences if not yet configured
            pref = UserNotificationPreference(
                user_id=user_id,
                daily_digest_enabled=True,
                include_messages=True,
                include_invitations=True,
                include_recommendations=True,
                include_project_activity=True,
            )
        return pref

    @staticmethod
    def has_digest_been_sent(session: Session, user_id: str, target_date: date) -> bool:
        stmt = select(DailyDigestLog).where(
            DailyDigestLog.user_id == user_id,
            DailyDigestLog.digest_date == target_date,
        )
        return session.execute(stmt).scalar_one_or_none() is not None

    @classmethod
    def aggregate_digest(
        cls, session: Session, user_id: str, target_date: date
    ) -> Optional[Dict[str, Any]]:
        """Collect daily activity according to user preferences and return summary data."""
        prefs = cls.get_user_preferences(session, user_id)
        if not prefs.daily_digest_enabled:
            return None

        # 24-hour activity window
        since_time = datetime.combine(
            target_date, datetime.min.time(), tzinfo=timezone.utc
        ) - timedelta(days=1)

        digest = {
            "user_id": user_id,
            "target_date": target_date.isoformat(),
            "new_messages_count": 0,
            "project_invitations": [],
            "builder_recommendations": [],
            "project_activities": [],
            "has_activity": False,
        }

        # Mock / DB query aggregations based on flags
        if prefs.include_messages:
            # e.g., query unread messages received since `since_time`
            digest["new_messages_count"] = 3

        if prefs.include_invitations:
            digest["project_invitations"] = [
                {"project_id": "proj_1", "title": "DevLink AI Engine"}
            ]

        if prefs.include_recommendations:
            digest["builder_recommendations"] = [
                {"builder_id": "user_789", "name": "Sarah Connor"}
            ]

        if prefs.include_project_activity:
            digest["project_activities"] = [
                {"activity": "Commit pushed to main", "project": "DevLink"}
            ]

        # Check if there is actual content to report
        if (
            digest["new_messages_count"] > 0
            or digest["project_invitations"]
            or digest["builder_recommendations"]
            or digest["project_activities"]
        ):
            digest["has_activity"] = True

        return digest

    @classmethod
    def record_digest_sent(
        cls, session: Session, user_id: str, target_date: date, summary: Dict[str, Any]
    ):
        log_entry = DailyDigestLog(
            user_id=user_id,
            digest_date=target_date,
            sent_at=datetime.now(timezone.utc),
            summary_data=summary,
        )
        session.add(log_entry)
        session.commit()
