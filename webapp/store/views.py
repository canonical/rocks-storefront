from flask import (
    Blueprint,
    request,
    make_response,
    render_template,
)

from webapp.config import DETAILS_VIEW_REGEX
from webapp.store.logic import get_rocks, get_rock


store = Blueprint(
    "store", __name__, template_folder="/templates", static_folder="/static"
)


@store.route("/store.json")
def get_store_packages():
    args = dict(request.args)
    query_string = args.get("q", "")
    page = int(args.get("page", 1))
    res = make_response(
        get_rocks(size=12, query_string=query_string, page=page)
    )
    return res


@store.route('/<regex("' + DETAILS_VIEW_REGEX + '"):entity_name>')
def details_overview(entity_name):
    rock = get_rock(entity_name)

    context = {
        "package": rock,
    }

    context["package_type"] = "rock"

    return render_template("details/overview.html", **context)


@store.route("/")
def store_index():
    response = make_response(render_template("store.html"))
    return response
