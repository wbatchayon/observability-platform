# Module gke : wrappe le module communautaire officiel
# terraform-google-modules/kubernetes-engine/google avec un set d'inputs minimal.
# Utilise le réseau "default" du projet (réseau minimal acceptable).

module "gke" {
  source  = "terraform-google-modules/kubernetes-engine/google"
  version = "~> 31.0"

  project_id = var.project_id
  name       = var.cluster_name
  region     = var.region

  network           = "default"
  subnetwork        = "default"
  ip_range_pods     = ""
  ip_range_services = ""

  kubernetes_version = var.kubernetes_version
  regional           = true

  remove_default_node_pool = true

  node_pools = [
    {
      name         = "default-pool"
      machine_type = var.node_instance_type
      min_count    = 1
      max_count    = var.node_pool_size + 2
      node_count   = var.node_pool_size
    },
  ]
}
