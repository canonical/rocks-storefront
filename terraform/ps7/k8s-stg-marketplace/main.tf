resource "juju_application" "rocks_storefront" {
  model_uuid = juju_model.service_model.uuid
  units      = var.units

  charm {
    name     = var.charm_name
    channel  = var.charm_channel
  }

  resources = {
    (var.resource_name) = tostring(var.resource_revision)
  }

  expose {
    cidrs = "10.0.0.0/8"
  }
}

resource "juju_application" "ingress_configurator" {
  model_uuid  = juju_model.service_model.uuid
  units       = 1

  charm {
    name      = "ingress-configurator"
    channel   = "latest/stable"
  }

  trust = true

  config = {
    hostname  = var.hostname
  }
}

resource "juju_integration" "ingress_app" {
  model_uuid  = juju_model.service_model.uuid

  application {
    name      = juju_application.rocks_storefront.name
    endpoint  = var.ingress_endpoint
  }

  application {
    name      = module.app_ps7.ingress_app_name
    endpoint  = var.ingress_endpoint
  }
}

resource "juju_integration" "ingress_haproxy" {
  model_uuid  = juju_model.service_model.uuid

  application {
    name      = juju_application.ingress_configurator.name
    endpoint  = "haproxy-route"
  }

  application {
    offer_url = "795798e4-922f-49c7-9169-004ffc17df90@serviceaccount/prod-cloud-ingress-ps7.ingress-ps7-webdesign"
  }
}
