terraform {
  required_version = ">= 1.6.0"

  required_providers {
    null = {
      source  = "hashicorp/null"
      version = "~> 3.2"
    }
    local = {
      source  = "hashicorp/local"
      version = "~> 2.5"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
    # Providers cloud transmis aux modules eks/gke/aks/talos selon cluster_provider.
    # Configurés sans credentials (providers.tf) : terraform validate passe hors ligne.
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
    talos = {
      source  = "siderolabs/talos"
      version = "~> 0.6"
    }
  }

  # Backend distant recommandé (décommenter et adapter par environnement) :
  # backend "s3" {
  #   bucket = "tfstate-observability"
  #   key    = "00-cluster/terraform.tfstate"
  #   region = "eu-west-1"
  #   # endpoint MinIO interne pour contexte air-gap :
  #   # endpoints = { s3 = "https://minio.internal:9000" }
  # }
}
