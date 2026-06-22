# Provisioning du cluster - bootstrap/00-cluster
cluster_name       = "observability-REMPLACEZ"
kubernetes_version = "1.29.4"

control_plane_nodes = [
  { name = "cp-01", ip = "10.0.0.11" },
]
worker_nodes = [
  { name = "worker-01", ip = "10.0.0.21" },
  { name = "worker-02", ip = "10.0.0.22" },
  { name = "worker-03", ip = "10.0.0.23" },
]

pod_cidr                    = "10.244.0.0/16"
service_cidr                = "10.96.0.0/12"
cni                         = "calico"
apiserver_advertise_address = "10.0.0.11"
ssh_user                    = "REMPLACEZ"
ssh_private_key_path        = "~/.ssh/id_rsa"
registry_mirror             = "harbor.observability.internal"
