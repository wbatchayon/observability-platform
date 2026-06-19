# bootstrap/00-cluster — Provisioning Kubernetes

Provisionne le cluster Kubernetes. **Étape obligatoire** : tout le reste en dépend.
Défaut : **kubeadm on-prem** (adapté au contexte air-gap multi-DC). Architecture **pluggable** :
pour une cible cloud, remplacez le module `kubeadm` par le module managé voulu en conservant les
mêmes outputs (`kubeconfig`, `cluster_endpoint`, `cluster_name`).

## Prérequis

- Nœuds Linux accessibles en SSH (utilisateur sudo), `kubeadm`/`kubelet`/`kubectl` pré-installés
  (ou servis par le miroir interne en air-gap).
- Un miroir de registre interne (`registry_mirror`) si les nœuds n'ont pas d'accès Internet.

## Variables (via `environments/<env>/00-cluster.tfvars`)

| Variable | Description |
|---|---|
| `cluster_name` | Nom du cluster |
| `kubernetes_version` | Version K8s (défaut 1.29.4) |
| `control_plane_nodes` | Liste `{name, ip}` (le 1er initialise) |
| `worker_nodes` | Liste `{name, ip}` |
| `pod_cidr` / `service_cidr` | Plages réseau |
| `cni` | `calico` (défaut) ou `cilium` |
| `apiserver_advertise_address` | IP annoncée par l'API server |
| `ssh_user` / `ssh_private_key_path` | Accès SSH aux nœuds |
| `registry_mirror` | Miroir interne pour images système (air-gap) |

## Utilisation

```bash
terraform init
terraform plan  -var-file=../../environments/dev/00-cluster.tfvars
terraform apply -var-file=../../environments/dev/00-cluster.tfvars
```

## Outputs

| Output | Consommé par |
|---|---|
| `kubeconfig` (sensitive) | `10-vault`, `20-flux` |
| `cluster_endpoint` | `10-vault`, `20-flux` |
| `cluster_name` | `30-package-repo` |

## Ajouter une cible cloud

Créez `modules/<cloud>/` exposant `kubeconfig` + `api_endpoint`, puis remplacez l'appel `module
"kubeadm"` dans `main.tf`. Les couches supérieures restent inchangées.
