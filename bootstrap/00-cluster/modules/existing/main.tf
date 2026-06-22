# Module "existing" : aucun cluster n'est provisionné.
# On suppose un cluster déjà en place (Rancher/RKE2/k3s, cluster managé importé...).
# Le module se contente de valider les entrées et de réexposer les outputs standard.

locals {
  use_kubeconfig = var.kubeconfig_path != ""
  # Endpoint exposé : déduit du couple host/token si pas de kubeconfig.
  endpoint = local.use_kubeconfig ? "" : var.cluster_endpoint
}

# Garde-fou : il faut soit un kubeconfig, soit un couple endpoint + token.
# La précondition s'évalue au plan/apply sans nécessiter d'accès au cluster.
resource "terraform_data" "validate_inputs" {
  input = var.cluster_name

  lifecycle {
    precondition {
      condition     = local.use_kubeconfig || (var.cluster_endpoint != "" && var.cluster_token != "")
      error_message = "Provider 'existing' : renseignez existing_kubeconfig_path OU (existing_cluster_endpoint + existing_cluster_token)."
    }
  }
}
