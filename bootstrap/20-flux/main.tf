# Bootstrap de FluxCD : installe les controllers et connecte le dépôt GitOps.
provider "kubernetes" {
  config_path = var.kubeconfig_path
}

provider "github" {
  token = var.git_token
}

provider "flux" {
  kubernetes = {
    config_path = var.kubeconfig_path
  }
  git = {
    url    = var.git_repository_url
    branch = var.git_branch
    http = {
      username = "git"
      password = var.git_token
    }
  }
}

resource "flux_bootstrap_git" "this" {
  embedded_manifests = true
  path               = "clusters/${var.environment}"

  # Controllers installés (dont image automation et notification).
  components_extra = [
    "image-reflector-controller",
    "image-automation-controller",
  ]

  interval = "5m"
}
