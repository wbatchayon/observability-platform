variable "cluster_name" {
  description = "Nom du cluster Talos."
  type        = string
}

variable "cluster_endpoint" {
  description = "Endpoint de l'API server (ex: https://10.0.0.11:6443)."
  type        = string
}

variable "control_plane_nodes" {
  description = "Nœuds control-plane Talos (le premier réalise le bootstrap)."
  type = list(object({
    name = string
    ip   = string
  }))
}

variable "worker_nodes" {
  description = "Nœuds workers Talos."
  type = list(object({
    name = string
    ip   = string
  }))
  default = []
}
