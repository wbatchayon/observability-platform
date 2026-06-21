# Provisionne un cluster de test sur Proxmox : clone d'un template Ubuntu cloud-init,
# avec préparation des nœuds (containerd + kubeadm) via cloud-init.

# user-data cloud-init partagé (prérequis Kubernetes).
resource "proxmox_virtual_environment_file" "cloud_init" {
  content_type = "snippets"
  datastore_id = var.snippets_datastore_id
  node_name    = var.proxmox_node

  source_raw {
    file_name = "obs-test-k8s-node.yaml"
    data      = file("${path.module}/../cloud-init/k8s-node.yaml")
  }
}

resource "proxmox_virtual_environment_vm" "node" {
  for_each = { for n in var.nodes : n.name => n }

  name      = each.value.name
  vm_id     = each.value.vm_id
  node_name = var.proxmox_node
  tags      = ["observability", "test", each.value.role]

  agent {
    enabled = true
  }

  clone {
    vm_id = var.template_id
    full  = true
  }

  cpu {
    cores = each.value.cores
    type  = "host"
  }

  memory {
    dedicated = each.value.memory
  }

  disk {
    datastore_id = var.datastore_id
    interface    = "scsi0"
    size         = each.value.disk
  }

  network_device {
    bridge = var.bridge
  }

  initialization {
    datastore_id      = var.datastore_id
    user_data_file_id = proxmox_virtual_environment_file.cloud_init.id

    ip_config {
      ipv4 {
        address = "${each.value.ip}/${var.netmask}"
        gateway = var.gateway
      }
    }

    user_account {
      username = var.ssh_user
      keys     = [var.ssh_public_key]
    }
  }
}
