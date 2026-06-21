output "control_plane_nodes" {
  description = "Nœuds control-plane (name, ip) — à reporter dans environments/test/00-cluster.tfvars."
  value       = [for n in var.nodes : { name = n.name, ip = n.ip } if n.role == "control-plane"]
}

output "worker_nodes" {
  description = "Nœuds workers (name, ip)."
  value       = [for n in var.nodes : { name = n.name, ip = n.ip } if n.role == "worker"]
}

output "all_node_ips" {
  description = "Toutes les IPs des nœuds provisionnés."
  value       = [for n in var.nodes : n.ip]
}

output "ssh_user" {
  description = "Utilisateur SSH des VMs."
  value       = var.ssh_user
}
