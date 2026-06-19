# Déploiement de HashiCorp Vault en HA (Raft) via le chart Helm officiel.
provider "helm" {
  kubernetes {
    config_path = var.kubeconfig_path
  }
}

provider "kubernetes" {
  config_path = var.kubeconfig_path
}

resource "kubernetes_namespace" "vault" {
  metadata {
    name = var.vault_namespace
    labels = {
      "app.kubernetes.io/part-of" = "observability"
    }
  }
}

resource "helm_release" "vault" {
  name       = "vault"
  namespace  = kubernetes_namespace.vault.metadata[0].name
  repository = "https://helm.releases.hashicorp.com"
  chart      = "vault"
  version    = "0.28.0"

  values = [yamlencode({
    server = {
      ha = {
        enabled  = true
        replicas = var.vault_replicas
        raft = {
          enabled = true
        }
      }
      # TLS activé : certificat serveur monté depuis un secret.
      extraEnvironmentVars = {
        VAULT_CACERT = "/vault/userconfig/vault-tls/ca.crt"
      }
      standalone = { enabled = false }
      dataStorage = {
        enabled = true
        size    = "10Gi"
      }
    }
    injector = { enabled = true }
    ui       = { enabled = true }
  })]
}
