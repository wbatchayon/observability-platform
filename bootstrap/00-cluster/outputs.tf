# Outputs standard consommés par bootstrap/10-vault, 20-flux et 30-package-repo.
# Indépendants du provider : un seul module est actif (count = 1), les autres sont vides.
locals {
  # Concatène les sorties de tous les modules ; un seul a un élément.
  active_kubeconfig = concat(
    module.kubeadm[*].kubeconfig,
    module.existing[*].kubeconfig,
    module.eks[*].kubeconfig,
    module.gke[*].kubeconfig,
    module.aks[*].kubeconfig,
    module.talos[*].kubeconfig,
  )
  active_endpoint = concat(
    module.kubeadm[*].api_endpoint,
    module.existing[*].api_endpoint,
    module.eks[*].api_endpoint,
    module.gke[*].api_endpoint,
    module.aks[*].api_endpoint,
    module.talos[*].api_endpoint,
  )
}

output "kubeconfig" {
  description = "Kubeconfig du cluster (chemin ou contenu selon le provider)."
  value       = length(local.active_kubeconfig) > 0 ? local.active_kubeconfig[0] : ""
  sensitive   = true
}

output "cluster_endpoint" {
  description = "Endpoint de l'API server Kubernetes."
  value       = length(local.active_endpoint) > 0 ? local.active_endpoint[0] : ""
}

output "cluster_name" {
  description = "Nom du cluster."
  value       = var.cluster_name
}
