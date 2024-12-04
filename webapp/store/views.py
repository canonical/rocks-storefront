import json

from flask import Blueprint, Response, abort
from flask import render_template, make_response

from webapp.config import DETAILS_VIEW_REGEX


store = Blueprint(
    "store", __name__, template_folder="/templates", static_folder="/static"
)


def get_package(entity_name):

    with open("webapp/rocks.json") as f:
        rocks = json.load(f)
        for rock in rocks:
            if rock["display_name"] == entity_name:
                return rock
    return rock


@store.route('/<regex("' + DETAILS_VIEW_REGEX + '"):entity_name>')
def details_overview(entity_name):
    package = get_package(entity_name)
    package["display_name"] = entity_name.capitalize()
    package["publisher"]["name"] = package["publisher"]["name"].capitalize()
    package["metadata"] = {
    "name": entity_name,
    "base": "bare",
    "build-base": "ubuntu@22.04",
    "version": "0.1",
    "summary": f"Rocked {entity_name}",
    "description": f"Description for {entity_name}.",
    "platforms": ["amd64"],
    "result": {
        "license": "Apache-2.0",
        }
    }

    context = {
        "package": package,
        "navigation": None,
        "last_update": None,
        "forum_url": None,
        "topic_path": None,
    }

    context["package_type"] = "rock"

    return render_template("details/overview.html", **context)


@store.route("/")
def store_index():
    response = make_response(render_template("store.html"))
    return response
