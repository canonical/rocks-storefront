import os

APP_NAME = "rockstore"
DETAILS_VIEW_REGEX = "[A-Za-z0-9-]*[A-Za-z][A-Za-z0-9-]*"

SEARCH_FIELDS = [
    "result.categories",
    "result.summary",
    "result.media",
    "result.title",
    "result.publisher.display-name",
    "default-release.revision.revision",
    "default-release.channel",
    "result.deployable-on",
]

SENTRY_DSN = os.getenv("SENTRY_DSN", "").strip()
