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
  name      = "vault"
  namespace = kubernetes_namespace.vault.metadata[0].name
  # Chart servi depuis le registre interne Harbor (OCI) - aucun accès Internet.
  repository = "oci://${var.harbor_registry}/charts"
  chart      = "vault"
  version    = "0.28.0"

  values = [yamlencode({
    global = {
      # Toutes les images Vault tirées depuis Harbor.
      imageRepository = "${var.harbor_registry}/library/hashicorp/vault"
    }
    server = {
      image = {
        repository = "${var.harbor_registry}/library/hashicorp/vault"
      }
      ha = {
        enabled  = true
        replicas = var.vault_replicas
        raft = {
          enabled = true
          # Auto-unseal via le moteur Transit d'un Vault de bootstrap (air-gap, pas de KMS cloud).
          config = <<-HCL
            ui = true
            listener "tcp" {
              tls_disable = 0
              address = "[::]:8200"
              cluster_address = "[::]:8201"
              tls_cert_file = "/vault/userconfig/vault-tls/tls.crt"
              tls_key_file  = "/vault/userconfig/vault-tls/tls.key"
            }
            storage "raft" {
              path = "/vault/data"
            }
            seal "transit" {
              address     = "${var.transit_unseal_address}"
              disable_renewal = "false"
              key_name    = "${var.transit_unseal_key_name}"
              mount_path  = "transit/"
              tls_ca_cert = "/vault/userconfig/transit-tls/ca.crt"
            }
            service_registration "kubernetes" {}
          HCL
        }
      }
      # TLS + token Transit montés depuis des secrets.
      extraEnvironmentVars = {
        VAULT_CACERT = "/vault/userconfig/vault-tls/ca.crt"
      }
      extraSecretEnvironmentVars = [{
        envName    = "VAULT_SEAL_TRANSIT_TOKEN"
        secretName = "vault-transit-unseal"
        secretKey  = "token"
      }]
      standalone = { enabled = false }
      dataStorage = {
        enabled = true
        size    = "10Gi"
      }
    }
    injector = {
      enabled = true
      image   = { repository = "${var.harbor_registry}/library/hashicorp/vault-k8s" }
    }
    ui = { enabled = true }
  })]
}
