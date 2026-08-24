resource "juju_integration" "ingress_app" {
  model_uuid  = module.app_ps7.model_uuid

  application {
    name      = juju_application.rockstore_io.name
    endpoint  = var.ingress_endpoint
  }

  application {
    name      = module.app_ps7.ingress_app_name
    endpoint  = var.ingress_endpoint
  }
}
