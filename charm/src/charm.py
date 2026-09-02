#!/usr/bin/env python3

"""
ExpressJS Charm entrypoint.

This is just the name that the paas-charm gives to a NodeJS based environment.
We are not using Express for this project.
"""

import logging
import typing

import ops

import paas_charm.expressjs

logger = logging.getLogger(__name__)


class NodeCharm(paas_charm.expressjs.Charm):
    """ExpressJS Charm service."""

    def __init__(self, *args: typing.Any) -> None:
        """Initialize the instance.

        Args:
            args: passthrough to CharmBase.
        """
        super().__init__(*args)


if __name__ == "__main__":
    ops.main.main(NodeCharm)
