# Runbook - Reprise après sinistre (DR)

## Sauvegardes
- **MinIO** : versioning activé ; réplication cross-site recommandée.
- **Vault** : snapshots Raft réguliers (`vault operator raft snapshot save`).
- **Configuration** : intégralement dans Git (IaC) - rien à sauvegarder hors Git.
- **GLPI/OneUptime** : snapshots des bases (MariaDB/PostgreSQL).

## Restauration cluster (perte totale)
1. Re-provisionner : `make bootstrap ENV=<env>` (cluster, Vault, Flux, Harbor).
2. Restaurer le snapshot Vault (PKI/secrets) puis desceller.
3. Réimporter les packages OTel dans Harbor.
4. `make deploy ENV=<env>` → Flux reconstruit toute la plateforme depuis Git.
5. Les backends rechargent les données depuis MinIO (S3).
6. Réappliquer Ansible sur les VMs si nécessaire.

## RTO/RPO indicatifs
- RPO : selon fréquence snapshots MinIO/Vault (cible ≤ 1h).
- RTO : ~1–2h (bootstrap + reconcile Flux).
