# Prérequis & dimensionnement (ressources minimales)

Cette page indique **ce qu'il faut avant de lancer `make bootstrap`** et **les
ressources CPU/RAM/stockage** par composant, pour deux profils : **minimal**
(évaluation / POC) et **production** (HA). Les chiffres sont des *requests*
(réservations) ; prévoyez ~30 % de marge pour les pics.

## 1. Prérequis du cluster

| Élément | Exigence |
|---|---|
| Version Kubernetes | **1.25+** (testé 1.29) |
| StorageClass | une **SC par défaut** OU `STORAGE_CLASS` renseigné (cf. `environments/<env>/env-values.yaml`). Les distros sans SC (Talos, kubeadm nu) doivent en installer une — `local-path-provisioner` fourni en option |
| CNI | **compatible NetworkPolicy** (Calico, Cilium, Canal…) si `NETWORK_POLICIES_ENABLED=true` (défaut). Flannel pur ou AWS VPC-CNI sans add-on n'appliquent pas les policies |
| Exposition | un fournisseur **LoadBalancer** (cloud, MetalLB…) OU `LB_SERVICE_TYPE=NodePort` |
| Architecture | amd64 (arm64 : voir [portability](../how-it-works/portability.md)) |
| Accès | air-gap : Harbor seedé ; connecté : `CHART_SOURCE=internet` possible |

Voir la matrice des distributions (vanilla, Rancher/RKE2/k3s, Talos, EKS/GKE/AKS,
OpenShift) dans **[portability.md](../how-it-works/portability.md)**.

## 2. Profil **minimal** (évaluation / POC)

Cœur d'observabilité uniquement (sans OneUptime/GLPI/Harbor), réplicas à 1.
Tient sur **1 nœud de 4 vCPU / 16 Go** ou idéalement **3 nœuds de 2 vCPU / 8 Go**.

| Composant | CPU (req) | RAM (req) | Stockage |
|---|---|---|---|
| cert-manager (+webhook,cainjector) | 150m | 192 Mi | — |
| Kyverno | 200m | 256 Mi | — |
| MinIO (1) | 250m | 512 Mi | 20 Gi |
| Loki (single binary) | 200m | 512 Mi | 10 Gi |
| Mimir (monolithique) | 300m | 768 Mi | 10 Gi |
| Tempo (monolithique) | 200m | 512 Mi | 10 Gi |
| OTel Collector (gateway) | 100m | 256 Mi | — |
| Prometheus | 250m | 1 Gi | 10 Gi |
| Alertmanager | 50m | 128 Mi | 2 Gi |
| Grafana | 100m | 256 Mi | 2 Gi |
| **Total cœur** | **≈ 1,8 vCPU** | **≈ 5 Go** | **≈ 74 Gi** |

> Validé en test sur une VM 4 vCPU / 16 Go (cf. la stack tournait à ~5–6 Go au repos).

## 3. Profil **production** (HA)

Réplicas et volumes alignés sur `environments/prod/env-values.yaml`. Cible :
**≥ 3 workers**, au total **~16 vCPU / ~40 Go RAM** + stockage objet conséquent.

| Composant | Réplicas | CPU (req, total) | RAM (req, total) | Stockage |
|---|---|---|---|---|
| cert-manager | 2 | 300m | 384 Mi | — |
| Kyverno | 3 | 600m | 768 Mi | — |
| MinIO | 4 (distribué) | 2 | 4 Gi | 500 Gi+ |
| Loki (ingester/…) | 3–4 | 2 | 6 Gi | via MinIO |
| Mimir (microservices) | 3+ | 3 | 8 Gi | via MinIO |
| Tempo | 3 | 1,5 | 4 Gi | via MinIO |
| OTel gateway + edge | 3 + DaemonSet | 1,5 | 2 Gi | — |
| Prometheus | 2 | 1 | 4 Gi | 50 Gi |
| Alertmanager | 3 | 150m | 384 Mi | 5 Gi |
| Grafana | 2 | 300m | 512 Mi | 10 Gi |
| Vault | 3 (HA) | 600m | 768 Mi | 10 Gi |
| Harbor | — | 1,5 | 3 Gi | 100 Gi+ |
| OneUptime | — | 1,5 | 3 Gi | 20 Gi |
| GLPI (+MariaDB) | — | 800m | 1,5 Gi | 20 Gi |
| **Total** | | **≈ 16 vCPU** | **≈ 38 Go** | **≈ 745 Gi+** |

## 4. Ajuster le dimensionnement

Le sizing est piloté **par environnement**, sans toucher au code :
`environments/<env>/env-values.yaml` (réplicas, tailles de volume) — ex.
`MINIO_VOLUME_SIZE`, `LOKI_INGESTER_REPLICAS`, `PROMETHEUS_RETENTION`. Voir aussi
le runbook [scaling](../runbooks/scaling.md).

## 5. Vérification avant déploiement

```bash
make preflight ENV=<env>   # vérifie StorageClass, LoadBalancer/NodePort, version K8s, CNI
```
