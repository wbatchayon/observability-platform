# platform-overlays - Overlays de portabilité

Overlays Kustomize empilables au-dessus de la base `platform/`. Ils permettent d'adapter la
plateforme à des contextes de déploiement différents **sans modifier la base** (et donc sans
casser le mode par défaut : air-gap + Harbor OCI).

> La base par défaut (`kustomize build platform/`) reste **air-gap** : toutes les
> `HelmRepository` pointent vers `oci://${HARBOR_REGISTRY}/charts`. Les overlays ci-dessous ne
> s'appliquent que si on les construit explicitement.

## Overlays disponibles

| Overlay | But | Build |
| --- | --- | --- |
| `airgap/` | Mode par défaut explicite (charts depuis Harbor OCI). Sert de référence. | `kustomize build platform-overlays/airgap/` |
| `internet/` | **CHART_SOURCE = internet** : bascule les `HelmRepository` vers les dépôts Helm publics upstream (grafana, minio, opentelemetry, prometheus-community, oneuptime). | `kustomize build platform-overlays/internet/` |
| `openshift/` | Retire les `runAsUser`/`fsGroup`/`runAsGroup` codés en dur pour compatibilité avec les SCC OpenShift (`restricted-v2` assigne les UID/GID). | `kustomize build platform-overlays/openshift/` |

## CHART_SOURCE (air-gap vs internet)

- **air-gap (défaut)** : `kustomize build platform/` (ou `platform-overlays/airgap/`). Les
  charts proviennent du registre Harbor interne via OCI.
- **internet** : `kustomize build platform-overlays/internet/`. Les `HelmRepository` sont
  patchées (type `default`, URL HTTPS upstream). À utiliser pour un POC connecté ou un
  cluster qui ne dispose pas de Harbor.

Pour qu'un overlay soit réconcilié par Flux, faites pointer le `path:` de la Kustomization
`platform` (voir `clusters/<env>/platform.yaml`) vers `./platform-overlays/<overlay>` au lieu
de `./platform`. La substitution `postBuild.substituteFrom` reste inchangée.

## OpenShift

L'overlay `openshift/` neutralise les `securityContext` à UID/GID fixes (incompatibles avec les
SecurityContextConstraints qui imposent une plage d'UID par namespace). Les charts Helm
(Loki/Mimir/Tempo/MinIO/Grafana/...) doivent être configurés séparément si nécessaire ; cet
overlay traite les objets gérés directement dans `platform/` (ex. GLPI/MariaDB).
