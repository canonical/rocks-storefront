from flask import (
    Blueprint,
    request,
    make_response,
)

from webapp.packages.logic import get_packages

store_packages = Blueprint(
    "package",
    __name__,
)


@store_packages.route("/store.json")
def get_store_packages():
    args = dict(request.args)
    
    res = make_response(get_packages(12, args))
    return res
