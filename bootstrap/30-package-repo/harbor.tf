# Déploiement de Harbor : registre OCI + dépôt d'artefacts pour les packages OTel (air-gap).
provider "helm" {
  kubernetes {
    config_path = var.kubeconfig_path
  }
}

provider "kubernetes" {
  config_path = var.kubeconfig_path
}

resource "kubernetes_namespace" "harbor" {
  metadata {
    name = var.harbor_namespace
  }
}

resource "helm_release" "harbor" {
  name       = "harbor"
  namespace  = kubernetes_namespace.harbor.metadata[0].name
  repository = "https://helm.goharbor.io"
  chart      = "harbor"
  version    = "1.14.0"

  values = [yamlencode({
    externalURL         = var.harbor_url
    harborAdminPassword = var.harbor_admin_password
    expose = {
      type = "ingress"
      tls = {
        enabled    = true
        certSource = "secret"
        secret     = { secretName = "harbor-tls" }
      }
      ingress = {
        hosts = { core = replace(var.harbor_url, "https://", "") }
      }
    }
    persistence = {
      enabled = true
      persistentVolumeClaim = {
        registry = { size = var.storage_size }
      }
    }
    # Scanner de vulnérabilités Trivy intégré activé.
    trivy = { enabled = true }
  })]
}
