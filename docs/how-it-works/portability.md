# Portabilité multi-cluster (cloud & on-premise)

La plateforme se déploie sur tout cluster Kubernetes conforme. Selon la
distribution, certains prérequis doivent être fournis par le cluster ou activés
via les variables d'environnement (`environments/<env>/env-values.yaml`).

## Variables de portabilité

| Variable | Rôle | Défaut |
|---|---|---|
| `STORAGE_CLASS` | StorageClass des PVC (vide = SC par défaut du cluster) | `""` |
| `LB_SERVICE_TYPE` | Type de Service d'exposition : `LoadBalancer` ou `NodePort` | `LoadBalancer` |
| `NETWORK_POLICIES_ENABLED` | Active les NetworkPolicies deny-by-default (exige un CNI compatible) | `true` |
| `CHART_SOURCE` | `airgap` (Harbor OCI) ou `internet` (dépôts Helm publics) | `airgap` |
| `cluster_provider` (Terraform) | `kubeadm`, `existing`, `eks`, `gke`, `aks`, `talos` | `kubeadm` |

## Cibler un cluster existant (Rancher, cloud managé, Talos…)

Le plus universel : **ne pas provisionner le cluster** avec ce projet, mais lui
fournir un `kubeconfig`. Sautez `bootstrap/00-cluster` et utilisez `cluster_provider=existing` :

```bash
export KUBECONFIG=/chemin/mon-cluster.kubeconfig
make bootstrap ENV=<env> CLUSTER_PROVIDER=existing   # Harbor -> Vault -> Flux
make deploy ENV=<env>
```

## Matrice des distributions

| Distribution | Statut | À faire |
|---|---|---|
| **Vanilla kubeadm** (on-prem) | ✅ cible | Installer une SC (`local-path`) et un LB (MetalLB) ou `LB_SERVICE_TYPE=NodePort` |
| **Rancher RKE2 / k3s** | ✅ | SC (`local-path`) et ServiceLB fournis. Utiliser `cluster_provider=existing`. k3s embarque Traefik → désactiver ou ne pas déployer HAProxy |
| **EKS / GKE / AKS** | ✅ | LB & SC cloud OK. `cluster_provider=existing` (ou module cloud). NetworkPolicies : activer Calico/Cilium (EKS : add-on requis). `CHART_SOURCE=internet` possible |
| **Talos** | ⚠️ adaptations | OS immuable, pas de SSH : ne pas utiliser le module kubeadm. Créer le cluster via `talosctl`, installer une SC, puis `cluster_provider=existing`. Miroir registre via machine config Talos |
| **OpenShift** | ⚠️ adaptations | Retirer les `runAsUser` codés en dur (SCC assigne les UID) ; utiliser les Routes natives au lieu du Service LB ; cert-manager/Kyverno doublonnent l'outillage natif |

## Pré-requis par capacité

- **Stockage** : une SC par défaut OU `STORAGE_CLASS`. Sur Talos/kubeadm nu :
  `kubectl apply -f https://raw.githubusercontent.com/rancher/local-path-provisioner/v0.0.30/deploy/local-path-storage.yaml`
  puis `kubectl annotate sc local-path storageclass.kubernetes.io/is-default-class=true`.
- **Exposition** : LoadBalancer (cloud/MetalLB) ou `LB_SERVICE_TYPE=NodePort`.
- **NetworkPolicy** : CNI compatible, sinon `NETWORK_POLICIES_ENABLED=false`
  (⚠️ baisse la posture de sécurité).

## Mode connecté vs air-gap

- **air-gap** (`CHART_SOURCE=airgap`, défaut) : charts/images tirés de **Harbor**
  (cf. [air-gap.md](air-gap.md)). Harbor doit être seedé avant `make deploy`.
- **connecté** (`CHART_SOURCE=internet`) : charts tirés des dépôts publics
  (grafana.github.io, etc.). Pratique pour un POC en cloud.

## Vérification

```bash
make preflight ENV=<env>   # contrôle SC, LB/NodePort, version K8s, CNI NetworkPolicy
```

> Feuille de route : modules Terraform natifs `talos`/`eks`/`gke`/`aks` et overlay
> OpenShift (SCC/Routes) — voir les issues « portability ».
