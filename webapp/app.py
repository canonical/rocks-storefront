import re

import talisker.requests
from flask import render_template, make_response, request, escape
from webapp.extensions import csrf, cache
from webapp.config import APP_NAME
from webapp.handlers import set_handlers
from webapp.store.views import store
from webapp.helpers import markdown_to_html
from canonicalwebteam.flask_base.app import FlaskBase


app = FlaskBase(
    __name__,
    "rockstore.io",
    template_404="404.html",
    template_500="500.html",
    favicon_url="https://assets.ubuntu.com/v1/5d4edefd-jaas-favicon.png",
    static_folder="../static",
    template_folder="../templates",
)


app.name = APP_NAME
app.config["CACHE_TYPE"] = "simple"
cache.init_app(app)
set_handlers(app)

request_session = talisker.requests.get_session()


@app.template_filter("linkify")
def linkify(text):
    escaped_text = escape(text)
    url_pattern = re.compile(
        r"http[s]?://"
        r"(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|"
        r"(?:%[0-9a-fA-F][0-9a-fA-F]))+"
        r"(?:#[\w-]+)?"
    )

    def replace_with_link(match):
        url = match.group(0)
        anchor_tag = f'<a href="{url}" target="_blank">{url}</a>'
        return anchor_tag

    return url_pattern.sub(replace_with_link, str(escaped_text))


csrf.init_app(app)

app.register_blueprint(store)


app.jinja_env.filters["markdown"] = markdown_to_html


@app.route("/contact-us")
def contact_us():
    return render_template("contact-us.html")


@app.route("/thank-you")
def thank_you():
    return render_template("thank-you.html")


@app.route("/icon-validator")
def icon_validator():
    return render_template("icon-validator.html")


@app.route("/sitemap.xml")
def site_map():
    xml_sitemap = render_template(
        "sitemap/sitemap.xml",
        base_url=f"{request.scheme}://{request.host}",
    )
    response = make_response(xml_sitemap)
    response.headers["Content-Type"] = "application/xml"

    return response


@app.route("/sitemap-links.xml")
def site_map_links():
    links = [
        "/contact-us",
    ]

    xml_sitemap = render_template(
        "sitemap/sitemap-links.xml",
        base_url=f"{request.scheme}://{request.host}",
        links=links,
    )
    response = make_response(xml_sitemap)
    response.headers["Content-Type"] = "application/xml"

    return response
