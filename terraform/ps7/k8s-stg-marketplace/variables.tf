variable "units" {
  description = "Number of units per application."
  type        = number
  default     = 2
}

variable "hostname" {
  description = "Hostname the ingress-configurator advertises to HAProxy for this app."
  type        = string
  default     = "staging.rocks.ubuntu.com"
}

variable "ingress_endpoint" {
  description = "ingress relation endpoint"
  type        = string
  default     = "ingress"
}

variable "charm_name" {
  description = "Name of the charmed application."
  type        = string
  default     = "rocks-storefront"
}

variable "charm_channel" {
  description = "Name of the channel for the charmed application."
  type        = string
  default     = "latest/stable"
}

variable "resource_name" {
  description = "Name of the resource used by the charmed application."
  type        = string
  default     = "app-image"
}
variable "resource_revision" {
  description = "Revision number for the resource used by the charmed application (OCI image)."
  type        = number
}
