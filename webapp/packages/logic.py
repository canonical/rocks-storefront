import json
from typing import List, Dict, TypedDict, Any, Union

from webapp.store.logic import format_slug

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


def get_icon(media):
    icons = [m["url"] for m in media if m["type"] == "icon"]
    if len(icons) > 0:
        return icons[0]
    return ""

def parse_package_for_card(
    package: Dict[str, Any],
) -> Package:
    """
    Parses a package and returns the formatted package
    based on the given card schema.

    :param: package (Dict[str, Any]): The package to be parsed.
    :returns: a dictionary containing the formatted package.

    note:
        - This function has to be refactored to be more generic,
        so we won't have to check for the package type before parsing.

    """

    resp = {
        "package": {
            "description": "",
            "display_name": "",
            "icon_url": "",
            "name": "",
            "platforms": [],
            "type": "",
            "website": "",
            "tracks": [],
            "track_guardrails": [],
            "status": "",
            "private": False,
            "contact": "",
        },
        "publisher": {"display_name": "", "name": "", "validation": ""},
        "ratings": {"value": "0", "count": "0"},
    }

    publisher = package.get("publisher", {})
    resp["package"]["type"] = package.get("type", "")
    resp["package"]["name"] = package.get("name", "")
    resp["package"]["description"] = package["summary"] or package["description"]
    resp["package"]["display_name"] = package.get(
        "display_name", format_slug(package.get("name", ""))
    )
    resp["package"]["name"] = package.get(
        "display_name", format_slug(package.get("name", ""))
    )
    resp["publisher"]["display_name"] = publisher.get("display-name", "")
    resp["publisher"]["validation"] = publisher.get("validation", "")
    resp["package"]["icon_url"] = get_icon(package.get("media", []))
    resp["package"]["website"] = package.get("website", "")
    resp["package"]["status"] = package.get("status", "")
    resp["package"]["private"] = package.get("private", False)
    resp["package"]["contact"] = package.get("contact", "")

    return resp


def paginate(
    packages: List[Packages], page: int, size: int, total_pages: int
) -> List[Packages]:
    """
    Paginates a list of packages based on the specified page and size.

    :param: packages (List[Packages]): The list of packages to paginate.
    :param: page (int): The current page number.
    :param: size (int): The number of packages to include in each page.
    :param: total_pages (int): The total number of pages.
    :returns: a list of paginated packages.

    note:
        - If the provided page exceeds the total number of pages, the last
        page will be returned.
        - If the provided page is less than 1, the first page will be returned.
    """

    if page > total_pages:
        page = total_pages
    if page < 1:
        page = 1

    start = (page - 1) * size
    end = start + size
    if end > len(packages):
        end = len(packages)

    return packages[start:end]


def get_packages(
    size: int = 10,
    query_params: Dict[str, Any] = {},
) -> List[Dict[str, Any]]:
    """
    Retrieves a list of packages from the store based on the specified
    parameters.The returned packages are paginated and parsed using the
    card schema.

    """

    with open ("webapp/rocks.json", "r") as rocks:
        packages = json.load(rocks)
        rocks.close()
    
    for rock in packages:
        rock["icon_url"] = "https://api.charmhub.io/api/v1/media/download/charm_3uPxmv77o1PrixpQFIf8o7SkOLsnMWmZ_icon_ad1a94cf9bb9f68614cb6c17e54e2fbd9dcc7fecc514dc6012b7f58fb5b87f8f.png"

    total_pages = -(len(packages) // -size)

    total_pages = -(len(packages) // -size)
    total_items = len(packages)
    page = int(query_params.get("page", 1))
    packages_per_page = paginate(packages, page, size, total_pages)
    parsed_packages = []
    for package in packages_per_page:
        parsed_packages.append(
            parse_package_for_card(package)
        )
    res = parsed_packages
    return {
        "packages": parsed_packages,
        "total_pages": total_pages,
        "total_items": total_items,
    }
