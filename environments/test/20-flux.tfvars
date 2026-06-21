# FluxCD - bootstrap/20-flux
kubeconfig_path    = "../00-cluster/modules/kubeadm/kubeconfig-observability-test"
git_repository_url = "https://github.com/test/observability-platform"
git_branch         = "main"
environment        = "test" # dev | staging | prod
flux_namespace     = "flux-system"
# git_token : via TF_VAR_git_token (déchiffré de SOPS).
