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

output "robot_account_secret" {
  description = "Token du compte robot (régénéré à chaque rotation) à injecter dans le vault Ansible/SOPS."
  value       = harbor_robot_account.vm_pull.secret
  sensitive   = true
}

output "robot_token_rotation_at" {
  description = "Horodatage de la prochaine rotation du token robot."
  value       = time_rotating.robot.rotation_rfc3339
}
