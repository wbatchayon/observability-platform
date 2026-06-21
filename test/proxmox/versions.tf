terraform {
  required_version = ">= 1.6.0"

  required_providers {
    proxmox = {
      source  = "bpg/proxmox"
      version = "~> 0.66"
    }
  }
}

provider "proxmox" {
  endpoint = var.proxmox_endpoint
  # Authentification : jeton d'API recommandé (PVEAPIToken). Fournir via variables d'env :
  #   export PROXMOX_VE_API_TOKEN="user@pam!tokenid=uuid"
  # ou décommenter username/password ci-dessous.
  # username = var.proxmox_username
  # password = var.proxmox_password
  insecure = var.proxmox_insecure # true si certificat auto-signé (cas par défaut Proxmox)

  ssh {
    agent    = true
    username = var.ssh_user
  }
}
