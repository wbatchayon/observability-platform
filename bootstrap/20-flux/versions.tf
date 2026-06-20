terraform {
  required_version = ">= 1.6.0"

  required_providers {
    flux = {
      source  = "fluxcd/flux"
      version = "~> 1.3"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.27"
    }
    github = {
      source  = "integrations/github"
      version = "~> 6.2"
    }
  }
}
