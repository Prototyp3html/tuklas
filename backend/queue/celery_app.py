"""Celery application.

TODO (Milestone 3): wire the deterministic pipeline (discovery -> research -> audit
-> opportunity -> outreach) as chained tasks with run-state logging and retries.
"""

from celery import Celery

from backend.config import settings

celery_app = Celery(
    "tuklas",
    broker=settings.redis_url,
    backend=settings.redis_url,
)
