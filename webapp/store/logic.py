import humanize
from typing import List, Dict, TypedDict, Any, Union
import datetime
from dateutil import parser

from canonicalwebteam.store_api.devicegw import DeviceGW

from webapp.helpers import get_yaml_loader, is_date_format
from webapp.extensions import cache

ARCHITECTURES = ["amd64", "arm64", "ppc64el", "riscv64", "s390x"]
FIND_FIELDS = [
    "contact",
    "description",
    "license",
    "summary",
    "title",
    "website",
    "publisher",
    "categories",
    "links",
]

DETAILS_FIELDS = [
    "categories",
    "contact",
    "description",
    "license",
    "links",
    "media",
    "private",
    "publisher",
    "summary",
    "title",
    "website",
    "created-at",
    "download",
    "version",
    "revision",
    "channel-map",
]

yaml = get_yaml_loader()
device_gw = DeviceGW("rock", staging=True)

Packages = TypedDict(
    "Packages",
    {
        "packages": List[
            Dict[
                str,
                Union[Dict[str, Union[str, List[str]]], List[Dict[str, str]]],
            ]
        ]
    },
)

Package = TypedDict(
    "Package",
    {
        "package": Dict[
            str, Union[Dict[str, str], List[str], List[Dict[str, str]]]
        ]
    },
)


def convert_date(date_to_convert):
    """
    Convert a datetime string to a human-readable string.
    (e.g. 'Today', 'Yesterday', or '12 Jan 2023').
    """
    date_parsed = parser.parse(date_to_convert).replace(tzinfo=None)
    delta = datetime.datetime.now() - datetime.timedelta(days=1)
    if delta < date_parsed:
        return humanize.naturalday(date_parsed).title()
    else:
        return date_parsed.strftime("%d %b %Y")


def format_relative_date(date_str: str) -> str:
    """
    Return a relative time string from an ISO datetime string.
    (e.g. '2 weeks ago', '25 Apr 2025').
    """
    try:
        given_date = datetime.datetime.fromisoformat(date_str)
        now = datetime.datetime.now(datetime.timezone.utc)
        delta = now - given_date

        if delta.days < 0:
            return "in the future"
        elif delta.days == 0:
            return "today"
        elif delta.days == 1:
            return "yesterday"
        elif delta.days < 7:
            return f"{delta.days} days ago"
        elif delta.days < 30:
            weeks = delta.days // 7
            return f"{weeks} week{'s' if weeks > 1 else ''} ago"
        elif delta.days < 90:
            months = delta.days // 30
            return f"{months} month{'s' if months > 1 else ''} ago"
        else:
            return given_date.strftime("%d %b %Y")

    except Exception as e:
        return f"Invalid date: {e}"


def get_icons(package):
    """
    Extracts a list of icon URLs from the package metadata.
    """
    media = package["result"]["media"]
    return [m["url"] for m in media if m["type"] == "icon"]


def format_slug(slug):
    """
    Converts a slug to a title-like string.
    (e.g. 'my-rock-name' to 'My Rock Name').
    """
    return (
        slug.title()
        .replace("-", " ")
        .replace("_", " ")
        .replace("And", "and")
        .replace("Iot", "IoT")
    )


def get_icon(media):
    icons = [m["url"] for m in media if m["type"] == "icon"]
    if len(icons) > 0:
        return icons[0]
    return ""


def parse_package_for_card(
    package: Dict[str, Any],
) -> Package:
    """
    Parses a package dictionary into a simplified schema for card display.
    """
    resp = {
        "package": {
            "summary": "",
            "display_name": "",
            "icon_url": "",
            "name": "",
            "platforms": [],
            "website": "",
            "contact": "",
            "support": "",
            "cves": "",
            "last_updated": "",
        },
        "publisher": {"display_name": "", "name": "", "validation": ""},
    }

    metadata = package.get("metadata", {})
    publisher = metadata.get("publisher", {})

    resp["package"]["name"] = package.get("name", "")
    resp["package"]["summary"] = metadata["summary"] or metadata["description"]
    resp["package"]["display_name"] = format_slug(
        package.get("name", metadata.get("title"))
    )
    resp["package"]["icon_url"] = get_icon(
        metadata.get("links", {}).get("media", [])
    )
    resp["package"]["website"] = metadata.get("website", "")
    resp["package"]["contact"] = metadata.get("contact", "")

    resp["publisher"]["display_name"] = publisher.get("display-name", "")
    resp["publisher"]["name"] = publisher.get("username", "")
    resp["publisher"]["validation"] = publisher.get("validation", "")

    return resp


def paginate(packages: List[Packages], page: int, size: int) -> List[Packages]:
    """
    Paginate the given packages list based on current page and size.
    """
    total_items = len(packages)
    total_pages = (total_items + size - 1) // size

    if page > total_pages:
        page = total_pages
    if page < 1:
        page = 1

    start = (page - 1) * size
    end = min(start + size, total_items)

    return packages[start:end]


def parse_rock_details(rock):
    """
    Parses detailed rock metadata into a structured format for internal use.
    """
    parsed_rock = {
        "display_name": "",
        "name": rock.get("name", ""),
        "description": rock["metadata"].get("description", ""),
        "summary": rock["metadata"].get("summary", ""),
        "icon_url": "",
        "metadata": {
            "license": rock["metadata"].get("license", ""),
            "links": rock["metadata"].get("links", {}),
            "private": rock["metadata"].get("private", False),
            "upstream_details": {},
            "related_rocks": [],
            "downstream_artifacts": {},
        },
        "categories": rock["metadata"].get("categories", []),
        "publisher": {
            "name": format_slug(
                rock["metadata"]["publisher"].get("display-name", "")
            ),
            "username": rock["metadata"]["publisher"].get("username", ""),
            "validation": rock["metadata"]["publisher"].get("validation", ""),
        },
        "channels": [],
    }

    parsed_rock["display_name"] = format_slug(rock.get("name", ""))
    parsed_rock["icon_url"] = get_icon(rock["metadata"].get("media", []))
    parsed_rock["license"] = rock["metadata"].get("license", "")

    # Build channel info
    for channel in rock.get("channel-map", []):
        channel_data = channel.get("channel", {})
        revision_data = channel.get("revision", {})
        v = revision_data.get("version", "").split(".")
        if len(v) < 3:
            v.append("0")
        normalized_version = ".".join(v)
        parsed_channel = {
            "workload_version": normalized_version,
            "risk": channel_data.get("risk", ""),
            "last_updated": format_relative_date(
                channel_data.get("released-at", "")
            ),
            "released_at": convert_date(channel_data.get("released-at", "")),
            "revision": revision_data["revision"],
            "version": revision_data.get("version", ""),
            "track": channel_data.get("track", ""),
        }
        parsed_rock["channels"].append(parsed_channel)
        parsed_rock["latest_channel"] = max(
            parsed_rock["channels"],
            key=lambda x: (
                datetime.datetime.strptime(x["released_at"], "%d %b %Y")
                if is_date_format(x["released_at"])
                else x["released_at"]
            ),
        )
    return parsed_rock


def fetch_rocks(query_string):
    cached_rocks = cache.get(f"cached_rocks-{query_string}")
    if cached_rocks is not None:
        return cached_rocks
    rocks = device_gw.find("%" if query_string == "" else query_string, fields=FIND_FIELDS).get("results", [])
    cached_rocks = cache.set(f"cached_rocks-{query_string}", rocks)
    return rocks


def get_rocks(
    size: int = 10,
    query_string: str = '',
    page: int = 0
) -> List[Dict[str, Any]]:
    """
    Fetches paginated and parsed rock packages using DeviceGW.
    """
    rocks = fetch_rocks(query_string)
    total_items = len(rocks)
    total_pages = (total_items + size - 1) // size
    rocks_per_page = paginate(rocks, page, size)
    parsed_rocks = [parse_package_for_card(rock) for rock in rocks_per_page]

    return {
        "packages": parsed_rocks,
        "total_pages": total_pages,
        "total_items": total_items,
    }


def get_rock(
    entity_name: str,
) -> Dict[str, Any]:
    """
    Retrieves a specific rock package by its name.
    """
    rock = device_gw.get_item_details(entity_name, fields=DETAILS_FIELDS)

    return rock
