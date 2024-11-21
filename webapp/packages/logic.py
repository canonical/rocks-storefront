import re

import yaml

import talisker
from flask import make_response
from typing import List, Dict, TypedDict, Any, Union

from canonicalwebteam.store_api.exceptions import StoreApiError
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


def fetch_packages(store_api, fields: List[str], query_params) -> Packages:
    """
    Fetches packages from the store API based on the specified fields.

    :param: store_api: The specific store API object.
    :param: fields (List[str]): A list of fields to include in the package
    data.
    :param: query_params: A search query

    :returns: a dictionary containing the list of fetched packages.
    """
    store = store_api(talisker.requests.get_session())

    category = query_params.get("categories", "")
    query = query_params.get("q", "")
    package_type = query_params.get("type", None)
    platform = query_params.get("platforms", "")
    architecture = query_params.get("architecture", "")
    provides = query_params.get("provides", None)
    requires = query_params.get("requires", None)

    if package_type == "all":
        package_type = None

    args = {
        "category": category,
        "fields": fields,
        "query": query,
    }

    if package_type:
        args["type"] = package_type

    if provides:
        provides = provides.split(",")
        args["provides"] = provides

    if requires:
        requires = requires.split(",")
        args["requires"] = requires

    packages = store.find(**args).get("results", [])

    if platform and platform != "all":
        filtered_packages = []
        for p in packages:
            platforms = p["result"].get("deployable-on", [])
            if not platforms:
                platforms = ["vm"]
            if platform in platforms:
                filtered_packages.append(p)
        packages = filtered_packages

    if architecture and architecture != "all":
        args["architecture"] = architecture
        packages = store.find(**args).get("results", [])

    return packages


def fetch_package(store_api, package_name: str, fields: List[str]) -> Package:
    """
    Fetches a package from the store API based on the specified package name.

    :param: store_api: The specific store API object.
    :param: package_name (str): The name of the package to fetch.
    :param: fields (List[str]): A list of fields to include in the package

    :returns: a dictionary containing the fetched package.
    """
    store = store_api(talisker.requests.get_session())
    package = store.get_item_details(
        name=package_name,
        fields=fields,
        api_version=2,
    )
    response = make_response({"package": package})
    response.cache_control.max_age = 3600
    return response.json


def get_bundle_charms(charm_apps):
    result = []

    if charm_apps:
        for app_name, data in charm_apps.items():
            # Charm names could be with the old prefix/suffix
            # Like: cs:~charmed-osm/mariadb-k8s-35
            name = data["charm"]
            if name.startswith("cs:") or name.startswith("ch:"):
                name = re.match(r"(?:cs:|ch:)(?:.+/)?(\S*?)(?:-\d+)?$", name)[
                    1
                ]

            charm = {"display_name": format_slug(name), "name": name}

            result.append(charm)

    return result


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
        # hardcoded temporarily until we have this data from the API
        "ratings": {"value": "0", "count": "0"},
    }

    publisher = package.get("publisher", {})
    resp["package"]["type"] = package.get("type", "")
    resp["package"]["name"] = package.get("name", "")
    resp["package"]["description"] = package["summary"] or package["description"]
    resp["package"]["display_name"] = package.get(
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

    with open ("webapp/rocks.json", "r") as f:
        packages = json.load(f)
        f.close()
    
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


def parse_categories(
    categories_json: Dict[str, List[Dict[str, str]]]
) -> List[Dict[str, str]]:
    """
    :param categories_json: The returned json from store_api.get_categories()
    :returns: A list of categories in the format:
    [{"name": "Category", "slug": "category"}]
    """

    categories = []

    if "categories" in categories_json:
        for category in categories_json["categories"]:
            categories.append(
                {"slug": category, "name": format_slug(category)}
            )

    return categories


def get_store_categories(store_api) -> List[Dict[str, str]]:
    """
    Fetches all store categories.

    :param: store_api: The store API object used to fetch the categories.
    :returns: A list of categories in the format:
    [{"name": "Category", "slug": "category"}]
    """
    store = store_api(talisker.requests.get_session())
    try:
        all_categories = store.get_categories()
    except StoreApiError:
        all_categories = []

    for cat in all_categories["categories"]:
        cat["display_name"] = format_slug(cat["name"])

    categories = list(
        filter(
            lambda cat: cat["name"] != "featured", all_categories["categories"]
        )
    )

    return categories


def get_package(
    store,
    publisher_api,
    package_name: str,
    fields: List[str],
    libraries: bool,
) -> Package:
    """Get a package by name

    :param store: The store object.
    :param store_name: The name of the store.
    :param package_name: The name of the package.
    :param fields: The fields to fetch.

    :return: A dictionary containing the package.
    """
    package = fetch_package(store, package_name, fields).get("package", {})
    resp = parse_package_for_card(package, store, publisher_api, libraries)
    return {"package": resp}
