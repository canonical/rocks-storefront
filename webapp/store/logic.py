import datetime
import humanize
from dateutil import parser
from webapp.helpers import get_yaml_loader

yaml = get_yaml_loader()

PLATFORMS = {
    "ubuntu": "Ubuntu",
    "centos": "CentOS",
}

ARCHITECTURES = ["amd64", "arm64", "ppc64el", "riscv64", "s390x"]


def convert_date(date_to_convert):
    """
    Convert date to human readable format: Month Day Year

    If date is less than a day return: today or yesterday

    Format of date to convert: 2019-01-12T16:48:41.821037+00:00
    Output: Jan 12 2019

    :param date_to_convert: Date to convert
    :returns: Readable date
    """
    date_parsed = parser.parse(date_to_convert).replace(tzinfo=None)
    delta = datetime.datetime.now() - datetime.timedelta(days=1)
    if delta < date_parsed:
        return humanize.naturalday(date_parsed).title()
    else:
        return date_parsed.strftime("%d %b %Y")


def get_icons(package):
    media = package["result"]["media"]
    return [m["url"] for m in media if m["type"] == "icon"]

def format_slug(slug):
    """Format slug name into a standard title format
    :param slug: The hypen spaced, lowercase slug to be formatted
    :return: The formatted string
    """

    return (
        slug.title()
        .replace("-", " ")
        .replace("_", " ")
        .replace("And", "and")
        .replace("Iot", "IoT")
    )
