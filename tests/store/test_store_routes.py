import unittest
from unittest.mock import patch
from webapp.app import app
from webapp.store.logic import fetch_rocks, get_rock


class StoreRouteTests(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    @patch("webapp.store.views.get_rocks")
    def test_get_store_packages_json(self, mock_get_rocks):
        mock_get_rocks.return_value = {
            "packages": [],
            "total_pages": 1,
            "total_items": 0,
        }
        response = self.client.get("/store.json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json["total_pages"], 1)

    @patch("webapp.store.logic.device_gw.get_item_details")
    def test_store_details(self, mock_get_item_details):
        mock_get_item_details.return_value = {
            "name": "sample-rock",
            "metadata": {
                "description": "Test rock",
                "summary": "A summary",
                "license": "Apache-2.0",
                "links": {},
                "media": [],
                "private": False,
                "publisher": {
                    "display-name": "Test Publisher",
                    "username": "testuser",
                    "validation": "verified",
                },
                "categories": [],
            },
            "channel-map": [
                {
                    "channel": {
                        "risk": "stable",
                        "released-at": "2024-06-01T12:00:00+00:00",
                        "track": "latest",
                    },
                    "revision": {
                        "version": "1.0",
                        "revision": 1,
                    },
                }
            ],
        }

        response = self.client.get("/sample-rock")
        self.assertEqual(response.status_code, 200)
        response_text = response.get_data(as_text=True)
        self.assertIn("sample-rock", response_text)
        self.assertIn("Test rock", response_text)


class TestGetRockCaching(unittest.TestCase):
    def setUp(self):
        self.entity_name = "sample-rock"
        self.raw_rock = {
            "name": "sample-rock",
            "metadata": {
                "description": "Test rock",
                "summary": "A summary",
                "license": "Apache-2.0",
                "links": {},
                "media": [],
                "private": False,
                "publisher": {
                    "display-name": "Test Publisher",
                    "username": "testuser",
                    "validation": "verified",
                },
                "categories": [],
            },
            "channel-map": [
                {
                    "channel": {
                        "risk": "stable",
                        "released-at": "2024-06-01T12:00:00+00:00",
                        "track": "latest",
                    },
                    "revision": {
                        "version": "1.0",
                        "revision": 1,
                    },
                }
            ],
        }

    @patch("webapp.store.logic.device_gw.get_item_details")
    @patch("webapp.store.logic.cache")
    def test_get_rock_cache_miss(self, mock_cache, mock_get_item_details):
        """If rock not in cache, call device_gw and set cache."""
        mock_cache.get.return_value = None
        mock_get_item_details.return_value = self.raw_rock

        rock = get_rock(self.entity_name)

        mock_cache.get.assert_called_once_with(
            f"get_rock:{self.entity_name}", expected_type=dict
        )
        mock_get_item_details.assert_called_once_with(
            self.entity_name,
            fields=mock_get_item_details.call_args[1]["fields"],
        )
        mock_cache.set.assert_called_once()
        self.assertEqual(rock["name"], "sample-rock")

    @patch("webapp.store.logic.device_gw.get_item_details")
    @patch("webapp.store.logic.cache")
    def test_get_rock_cache_hit(self, mock_cache, mock_get_item_details):
        """If rock is already cached, it should not call device_gw."""
        cached_rock = {"name": "sample-rock", "channels": []}
        mock_cache.get.return_value = cached_rock

        rock = get_rock(self.entity_name)

        mock_cache.get.assert_called_once_with(
            f"get_rock:{self.entity_name}", expected_type=dict
        )
        mock_get_item_details.assert_not_called()
        mock_cache.set.assert_not_called()
        self.assertEqual(rock, cached_rock)

    @patch("webapp.store.logic.device_gw.find")
    @patch("webapp.store.logic.cache")
    def test_fetch_rocks_cache_miss(self, mock_cache, mock_find):
        mock_cache.get.return_value = None
        mock_find.return_value = {"results": [self.raw_rock]}

        fetch_rocks("test")

        mock_cache.get.assert_called_once_with(
            ("fetch_rocks", {"q": "test"}), expected_type=list
        )
        mock_find.assert_called_once_with(
            "test", fields=mock_find.call_args[1]["fields"]
        )
        mock_cache.set.assert_called_once()

    @patch("webapp.store.logic.device_gw.find")
    @patch("webapp.store.logic.cache")
    def test_fetch_rocks_cache_hit(self, mock_cache, mock_find):
        cached_list = [{"sample_rock": "cached-rock"}]
        mock_cache.get.return_value = cached_list

        rocks = fetch_rocks("test")

        mock_find.assert_not_called()
        mock_cache.set.assert_not_called()
        self.assertEqual(rocks, cached_list)
