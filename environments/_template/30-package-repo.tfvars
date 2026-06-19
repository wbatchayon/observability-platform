# Dépôt de packages Harbor — bootstrap/30-package-repo
kubeconfig_path  = "../00-cluster/modules/kubeadm/kubeconfig-observability-REMPLACEZ"
harbor_namespace = "harbor"
harbor_url       = "https://harbor.observability.internal"
storage_size     = "100Gi"
otel_version     = "0.148.0"
retention_days   = 90
# harbor_admin_password : via TF_VAR_harbor_admin_password (déchiffré de SOPS).
