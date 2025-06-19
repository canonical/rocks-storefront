import unittest
from unittest.mock import patch
from webapp.app import app  

class StoreRouteTests(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    @patch("webapp.store.views.get_rocks")
    def test_get_store_packages_json(self, mock_get_rocks):
        mock_get_rocks.return_value = {"packages": [], "total_pages": 1, "total_items": 0}
        response = self.client.get("/store.json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json["total_pages"], 1)

    @patch("webapp.store.views.get_rock")
    def test_store_details(self, mock_get_rock):
        mock_get_rock.return_value = {
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
                        "track": "latest"
                    },
                    "revision": {
                        "version": "1.0.0",
                        "revision": 1
                    }
                }
            ]
        }

        response = self.client.get("/sample-rock")
        self.assertEqual(response.status_code, 200)
        response_text = response.get_data(as_text=True)
        self.assertIn("sample-rock", response_text)
        self.assertIn("Test rock", response_text)
    