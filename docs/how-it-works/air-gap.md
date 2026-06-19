# Air-gap — aucune communication directe avec Internet

Principe : **rien ne sort vers Internet**. Toutes les images de conteneurs et tous les charts Helm
sont **importés dans Harbor**, et tous les composants les tirent depuis Harbor.

## Trois mécanismes complémentaires

1. **Miroir containerd → Harbor** (niveau nœud). `bootstrap/00-cluster` configure
   `/etc/containerd/certs.d/<registry>/hosts.toml` sur chaque nœud pour rediriger `docker.io`,
   `quay.io`, `ghcr.io`, `registry.k8s.io` vers `harbor.observability.internal`. Toute image,
   même nommée publiquement, est résolue via Harbor.
2. **Charts Helm en OCI depuis Harbor.** Tous les `HelmRepository` Flux sont
   `type: oci`, `url: oci://${HARBOR_REGISTRY}/charts`. Aucun dépôt de charts public.
3. **Packages OTel des VMs** tirés du dépôt interne signé (apt/yum/tar.gz), agents air-gap.

## Amorçage (chicken-egg)

Harbor *est* le registre : il ne peut pas tirer son propre chart/images. Il est donc **seedé en
premier** (ordre Makefile : cluster → **Harbor** → Vault → Flux) :

```bash
# 1. Charger les images de Harbor dans containerd de chaque nœud (depuis archives locales)
sudo ctr -n k8s.io images import harbor-images.tar

# 2. Déposer le chart Harbor seedé
#    bootstrap/30-package-repo/charts-seed/harbor/   (archive helm extraite)

# 3. Amorcer (le Makefile déploie Harbor avant Vault)
make bootstrap ENV=<env>
```

Une fois Harbor en ligne, on y importe charts et images, puis le reste se déploie normalement.

## Inventaire à importer dans Harbor

### Charts Helm (projet OCI `charts`)

| Chart | Version | Origine |
|---|---|---|
| cert-manager | v1.14.4 | jetstack |
| kyverno | 3.2.1 | kyverno |
| minio | 5.2.0 | min.io |
| loki | 6.6.2 | grafana |
| mimir-distributed | 5.4.0 | grafana |
| tempo-distributed | 1.10.1 | grafana |
| opentelemetry-collector | 0.93.0 | open-telemetry |
| kube-prometheus-stack | 59.1.0 | prometheus-community |
| grafana | 7.3.11 | grafana |
| oneuptime | 7.0.0 | oneuptime |
| kubernetes-ingress (haproxy) | 1.41.0 | haproxytech |
| vault | 0.28.0 | hashicorp (seed bootstrap) |
| harbor | 1.14.0 | goharbor (seed bootstrap) |

### Images (projet `library`, miroir)

Toutes les images référencées par les charts ci-dessus + images explicites :
`minio/mc`, `mariadb`, `diouxx/glpi`, `otel/opentelemetry-collector-contrib:0.148.0`,
`hashicorp/vault`, `hashicorp/vault-k8s`, ainsi que les images de cert-manager, kyverno, loki,
mimir, tempo, grafana, prometheus, alertmanager, oneuptime, haproxy, calico.

> Procédure : `skopeo copy` / `oras` depuis une zone connectée vers un support, puis import dans
> Harbor côté air-gap. Vérifier signatures/digests. Kyverno impose ensuite la signature Cosign.

## Import des charts dans Harbor (OCI)

```bash
helm push <chart>-<version>.tgz oci://harbor.observability.internal/charts
```
