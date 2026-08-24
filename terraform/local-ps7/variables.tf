variable "units" {
  description = "Number of units per application."
  type        = map(number)
  default     = {
    rockstore = 2
  }
}

variable "ingress_endpoint" {
  description = "ingress relation endpoint"
  type        = string
  default     = "ingress"
}