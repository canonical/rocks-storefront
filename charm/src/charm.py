#!/usr/bin/env python3

"""
ExpressJS Charm entrypoint.
This is just the name that the paas-charm gives to a NodeJS based environment.
We are not using Express for this project.
"""

import logging
import typing

import ops

from paas_charm.expressjs import Charm
from paas_charm.app import App, WorkloadConfig
from paas_charm.charm_state import CharmState
from paas_charm.database_migration import DatabaseMigration


logger = logging.getLogger(__name__)


class NodeApp(App):
    def __init__(
        self,
        *,
        container: ops.Container,
        charm_state: CharmState,
        workload_config: WorkloadConfig,
        database_migration: DatabaseMigration,
        framework_config_prefix: str = "",
        configuration_prefix: str = "",
        integrations_prefix: str = "",
    ):
        super().__init__(
            container=container,
            charm_state=charm_state,
            workload_config=workload_config,
            database_migration=database_migration,
            framework_config_prefix=framework_config_prefix,
            configuration_prefix=configuration_prefix,
            integrations_prefix=integrations_prefix,
        )


    def gen_environment(self) -> dict[str, str]:
        env = super().gen_environment()
        # Add environment variables here, as paas_charm overwrites the
        # services present in rockcraft.yaml 
        env[f"{self.configuration_prefix}NODE_USE_ENV_PROXY"] = "1"
        return env


class NodeCharm(Charm):
    """ExpressJS Charm service."""

    def __init__(self, *args: typing.Any) -> None:
        """Initialize the instance.

        Args:
            args: passthrough to CharmBase.
        """
        super().__init__(*args)


    def _create_app(self) -> App:
        """Build a App instance.

        Returns:
            A new App instance.
        """
        charm_state = self._create_charm_state()
        return NodeApp(
            container=self._container,
            charm_state=charm_state,
            workload_config=self._workload_config,
            database_migration=self._database_migration,
        )


if __name__ == "__main__":
    ops.main.main(NodeCharm)
