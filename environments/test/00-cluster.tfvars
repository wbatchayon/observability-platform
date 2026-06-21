# Cluster de test sur Proxmox — bootstrap/00-cluster
# IPs alignées sur test/proxmox/terraform.tfvars (sortie `terraform output`).
cluster_name       = "observability-test"
kubernetes_version = "1.29.4"

control_plane_nodes = [
  { name = "obs-test-cp1", ip = "100.127.112.21" },
]
worker_nodes = [
  { name = "obs-test-w1", ip = "100.127.112.22" },
  { name = "obs-test-w2", ip = "100.127.112.23" },
]

pod_cidr                    = "10.244.0.0/16"
service_cidr                = "10.96.0.0/12"
cni                         = "calico"
apiserver_advertise_address = "100.127.112.21"
ssh_user                    = "ubuntu"
ssh_private_key_path        = "~/.ssh/id_ed25519"
# Test avec accès Internet : pas de miroir interne (le miroir containerd est alors ignoré).
registry_mirror = ""
