# Configuration des providers cloud transmise aux modules selon cluster_provider.
# Volontairement minimale et sans credentials en dur : l'authentification se fait
# via les variables d'environnement / profils standard (AWS_PROFILE, gcloud auth,
# az login...). Cela permet à `terraform validate` de passer hors ligne.
#
# Pour un déploiement kubeadm ou existing, ces providers ne sont jamais utilisés
# (modules désactivés par count = 0) ; aucune credential n'est requise.

provider "aws" {
  region = var.region != "" ? var.region : "eu-west-1"
}

provider "google" {
  project = var.gcp_project_id != "" ? var.gcp_project_id : null
  region  = var.region != "" ? var.region : null
}

provider "azurerm" {
  features {}
  # skip_provider_registration évite tout appel API au plan/validate.
  skip_provider_registration = true
}

provider "talos" {}
