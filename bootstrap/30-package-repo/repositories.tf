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

# Projet des charts Helm (OCI) en lecture publique INTERNE : permet le pull anonyme par
# FluxCD/Helm depuis le réseau privé, sans secret de pull dans chaque namespace.
resource "harbor_project" "charts" {
  name                   = "charts"
  public                 = true
  vulnerability_scanning = true
}

# Projet miroir des images (library) — lecture publique interne pour le miroir containerd.
resource "harbor_project" "library" {
  name                   = "library"
  public                 = true
  vulnerability_scanning = true
}

# Compte robot read-only : utilisé par les VMs (via Ansible) pour tirer les packages.
# Le token a une durée de vie bornée (rotation) — voir robot_token_rotation_days.
resource "time_rotating" "robot" {
  rotation_days = var.robot_token_rotation_days
}

resource "harbor_robot_account" "vm_pull" {
  name        = "vm-pull"
  description = "Compte read-only pour les VMs air-gap (pull des packages OTel)"
  level       = "project"
  # Expiration bornée ; la rotation force la regénération du token.
  duration = var.robot_token_rotation_days

  permissions {
    access {
      action   = "pull"
      resource = "repository"
    }
    kind      = "project"
    namespace = harbor_project.otel_packages.name
  }

  lifecycle {
    replace_triggered_by = [time_rotating.robot.id]
  }
}

# Rétention des artefacts non-release.
resource "harbor_retention_policy" "otel" {
  scope    = harbor_project.otel_packages.id
  schedule = "Daily"

  rule {
    most_recently_pulled = 10
    repo_matching        = "**"
    tag_matching         = "**"
    untagged_artifacts   = true
  }
}

# Immutabilité des tags de release (ex: la version OTel figée).
resource "harbor_immutable_tag_rule" "releases" {
  project_id    = harbor_project.otel_packages.id
  tag_matching  = var.otel_version
  repo_matching = "**"
}
