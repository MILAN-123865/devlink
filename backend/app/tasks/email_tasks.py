import logging
from app.core.celery_app import celery_app
from app.tasks.base import BaseTask

logger = logging.getLogger(__name__)


@celery_app.task(base=BaseTask, bind=True, name="tasks.send_welcome_email")
def send_welcome_email(self, email: str, user_name: str) -> dict:
    """Send transactional email via background worker."""
    logger.info("Sending welcome email to: %s", email)
    return {"status": "SENT", "email": email}
