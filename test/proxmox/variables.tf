variable "proxmox_endpoint" {
  description = "URL de l'API Proxmox VE."
  type        = string
  default     = "https://100.127.112.10:8006/"
}

variable "proxmox_insecure" {
  description = "Accepter le certificat TLS auto-signé de Proxmox."
  type        = bool
  default     = true
}

variable "proxmox_node" {
  description = "Nom du nœud Proxmox cible (ex: pve)."
  type        = string
}

variable "datastore_id" {
  description = "Datastore pour les disques des VMs (ex: local-lvm)."
  type        = string
  default     = "local-lvm"
}

variable "snippets_datastore_id" {
  description = "Datastore supportant les snippets (cloud-init user-data), ex: local."
  type        = string
  default     = "local"
}

variable "bridge" {
  description = "Pont réseau Proxmox (ex: vmbr0)."
  type        = string
  default     = "vmbr0"
}

variable "template_id" {
  description = "VM ID du template cloud-init Ubuntu 22.04 à cloner."
  type        = number
}

variable "gateway" {
  description = "Passerelle réseau des VMs."
  type        = string
}

variable "ssh_user" {
  description = "Utilisateur créé par cloud-init (sudo)."
  type        = string
  default     = "ubuntu"
}

variable "ssh_public_key" {
  description = "Clé publique SSH injectée dans les VMs."
  type        = string
}

variable "nodes" {
  description = "Nœuds du cluster de test (control-plane + workers)."
  type = list(object({
    name   = string
    vm_id  = number
    ip     = string
    cores  = number
    memory = number # Mo
    disk   = number # Go
    role   = string # control-plane | worker
  }))
  default = [
    { name = "obs-test-cp1", vm_id = 9001, ip = "100.127.112.21", cores = 2, memory = 4096, disk = 40, role = "control-plane" },
    { name = "obs-test-w1", vm_id = 9002, ip = "100.127.112.22", cores = 4, memory = 8192, disk = 60, role = "worker" },
    { name = "obs-test-w2", vm_id = 9003, ip = "100.127.112.23", cores = 4, memory = 8192, disk = 60, role = "worker" },
  ]
}

variable "netmask" {
  description = "Masque réseau (CIDR) des VMs."
  type        = number
  default     = 24
}
