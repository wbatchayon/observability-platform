# platform/storage — Stockage objet MinIO (S3)

Fournit le stockage objet compatible S3 pour le **stockage long terme** des logs, métriques et
traces (Loki/Mimir/Tempo y déposent leurs blocks).

## Produit (consommé par platform/backends)

| Interface | Valeur |
|---|---|
| Endpoint S3 | `http://minio.storage.svc.cluster.local:9000` (TLS interne) |
| Buckets | `loki`, `mimir`, `tempo` (versioning activé) |
| Secret | `minio-credentials` (clés `accesskey` / `secretkey`) |

## Consomme

- `ClusterIssuer` `vault-issuer` (platform/security) → certificat `minio-tls`.
- `environments/<env>/storage.values.yaml` : `MINIO_REPLICAS`, `MINIO_VOLUME_SIZE`, credentials
  (`MINIO_ACCESS_KEY`/`MINIO_SECRET_KEY` via SOPS).

## Sécurité

- MinIO en mode distribué (≥4 replicas), TLS via cert-manager, chiffrement au repos, versioning.
- Conteneurs non-root, ressources bornées (conforme aux policies Kyverno).
