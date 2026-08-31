# This package is named `queue` and MUST only ever be imported as `backend.queue`.
# Importing it as a bare top-level `queue` (i.e. putting `backend/` on sys.path)
# shadows the standard library's `queue` module, which Celery's own dependencies
# (billiard, kombu), concurrent.futures and pandas all import — that breaks the
# worker with an opaque traceback. Repo root is the only sys.path entry; every
# first-party import is `backend.*`. See docs/DECISIONS.md.
