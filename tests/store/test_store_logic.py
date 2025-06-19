import unittest
from datetime import datetime, timedelta, timezone
from webapp.store.logic import (
    convert_date,
    format_relative_date,
    get_icon,
    format_slug,
    parse_package_for_card,
    paginate,
)


class TestStoreLogic(unittest.TestCase):

    def test_convert_date_today(self):
        today = datetime.now(timezone.utc).isoformat()
        result = convert_date(today)
        self.assertIn(result, ["Today", "Yesterday"])

    def test_format_relative_date_today(self):
        now = datetime.now(timezone.utc).isoformat()
        self.assertEqual(format_relative_date(now), "today")

    def test_format_relative_date_yesterday(self):
        yesterday = (
            datetime.now(timezone.utc) - timedelta(days=1)
        ).isoformat()
        self.assertEqual(format_relative_date(yesterday), "yesterday")

    def test_format_relative_date_weeks(self):
        old_date = (
            datetime.now(timezone.utc) - timedelta(days=14)
        ).isoformat()
        self.assertEqual(format_relative_date(old_date), "2 weeks ago")

    def test_format_relative_date_months(self):
        old_date = (
            datetime.now(timezone.utc) - timedelta(days=60)
        ).isoformat()
        self.assertEqual(format_relative_date(old_date), "2 months ago")

    def test_get_icon_with_icons(self):
        media = [{"type": "icon", "url": "https://example.com/icon.png"}]
        self.assertEqual(get_icon(media), "https://example.com/icon.png")

    def test_format_slug(self):
        self.assertEqual(
            format_slug("hello-world_iot_and_some_random_text"),
            "Hello World IoT and Some Random Text",
        )

    def test_parse_package_for_card(self):
        package = {
            "name": "test-package",
            "metadata": {
                "summary": "A test summary",
                "description": "A test description",
                "title": "test-title",
                "website": "https://example.com",
                "contact": "test@example.com",
                "links": {
                    "media": [
                        {"type": "icon", "url": "https://example.com/icon.png"}
                    ]
                },
                "publisher": {
                    "display-name": "Test Publisher",
                    "username": "testuser",
                    "validation": "verified",
                },
            },
        }
        result = parse_package_for_card(package)
        self.assertEqual(result["package"]["name"], "test-package")
        self.assertEqual(result["package"]["display_name"], "Test Title")
        self.assertEqual(
            result["package"]["icon_url"], "https://example.com/icon.png"
        )
        self.assertEqual(result["publisher"]["name"], "testuser")

    def test_paginate_bounds(self):
        packages = [{"name": f"pkg{i}"} for i in range(25)]
        page = 2
        size = 10
        paged = paginate(packages, page, size)
        self.assertEqual(len(paged), 10)
        self.assertEqual(paged[0]["name"], "pkg10")

    def test_paginate_overflow(self):
        packages = [{"name": f"pkg{i}"} for i in range(5)]
        paged = paginate(packages, page=10, size=2)
        self.assertTrue(len(paged) <= 2)
