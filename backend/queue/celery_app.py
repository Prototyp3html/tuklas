"""Celery application.

M3 wires the discovery task. Dev/CI run eager (``task_always_eager``) so no
broker is needed; a real worker + Redis arrives with Docker. Tasks are declared
via ``conf.imports`` rather than importing ``backend.queue.tasks`` here, to keep
the module import acyclic.
"""

from celery import Celery

from backend.config import settings

celery_app = Celery(
    "tuklas",
    broker=settings.redis_url,
    backend=settings.redis_url,
)

celery_app.conf.update(
    task_always_eager=settings.celery_task_always_eager,
    task_eager_propagates=True,
    task_store_eager_result=True,
    imports=("backend.queue.tasks",),
)
