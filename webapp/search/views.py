from flask import Blueprint, json, request, render_template

from webapp.packages.logic import parse_package_for_card


search = Blueprint(
    "search", __name__, template_folder="/templates", static_folder="/static"
)


@search.route("/all-search")
def all_search():
    return render_template("all-search.html")


@search.route("/all-search.json")
def all_search_json():
    params = request.args
    term = params.get("q")
    limit = int(params.get("limit", 5))

    with open("webapp/rocks.json", "r") as rocks:
        rocks = json.load(rocks)
        rocks = [
            parse_package_for_card(rock)
            for rock in rocks
            if term in rock["display_name"]
        ][:limit]
        return {"rocks": rocks}
