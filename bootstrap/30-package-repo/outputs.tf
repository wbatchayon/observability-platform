output "package_repo_url" {
  description = "URL du dépôt de packages interne (consommé par Ansible / B13)."
  value       = var.harbor_url
}

output "otel_packages_path" {
  description = "Chemin du projet contenant les packages OTel."
  value       = "${var.harbor_url}/${harbor_project.otel_packages.name}"
}

output "robot_account_name" {
  description = "Nom du compte robot read-only pour les VMs."
  value       = harbor_robot_account.vm_pull.full_name
}
