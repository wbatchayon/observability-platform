# Projet, compte robot read-only et rétention pour les packages OTel.
provider "harbor" {
  url      = var.harbor_url
  username = "admin"
  password = var.harbor_admin_password
}

# Projet privé dédié aux packages OpenTelemetry.
resource "harbor_project" "otel_packages" {
  name                   = "otel-packages"
  public                 = false
  vulnerability_scanning = true
}

# Compte robot read-only : utilisé par les VMs (via Ansible) pour tirer les packages.
resource "harbor_robot_account" "vm_pull" {
  name        = "vm-pull"
  description = "Compte read-only pour les VMs air-gap (pull des packages OTel)"
  level       = "project"

  permissions {
    access {
      action   = "pull"
      resource = "repository"
    }
    kind      = "project"
    namespace = harbor_project.otel_packages.name
  }
}

# Rétention des artefacts non-release.
resource "harbor_retention_policy" "otel" {
  scope    = harbor_project.otel_packages.id
  schedule = "Daily"

  rule {
    most_recently_pulled = 10
    untagged             = true
  }
}

# Immutabilité des tags de release (ex: la version OTel figée).
resource "harbor_immutable_tag_rule" "releases" {
  project_id     = harbor_project.otel_packages.id
  tag_matching   = var.otel_version
  repo_matching  = "**"
}
