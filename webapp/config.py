import os

APP_NAME = "rockstore"
DETAILS_VIEW_REGEX = "[A-Za-z0-9-]*[A-Za-z][A-Za-z0-9-]*"

SENTRY_DSN = os.getenv("SENTRY_DSN", "").strip()
