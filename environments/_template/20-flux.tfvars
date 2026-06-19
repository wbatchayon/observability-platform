# FluxCD — bootstrap/20-flux
kubeconfig_path    = "../00-cluster/modules/kubeadm/kubeconfig-observability-REMPLACEZ"
git_repository_url  = "https://github.com/REMPLACEZ/observability-platform"
git_branch         = "main"
git_path           = "platform"
environment        = "REMPLACEZ"  # dev | staging | prod
flux_namespace     = "flux-system"
# git_token : via TF_VAR_git_token (déchiffré de SOPS).
