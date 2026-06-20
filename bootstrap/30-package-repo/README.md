# bootstrap/30-package-repo - Dépôt interne de packages OTel (air-gap)

Déploie **Harbor** (registre OCI + dépôt d'artefacts) pour héberger les packages OpenTelemetry
Collector contrib **v0.148.0**. Les **VMs sont air-gap** (zéro accès Internet) : elles tirent ces
packages depuis ce dépôt interne via Ansible (brique `ansible/`).

## Pourquoi Harbor

- Registre OCI + stockage d'artefacts génériques, 100% open source (CNCF).
- Scanner de vulnérabilités **Trivy** intégré.
- Comptes robot, rétention, immutabilité des tags release, RBAC projet.

## Packages hébergés (cf. `packages.tf`)

Liste alignée sur `VM_Configuration/Docs/Markdown/specification_packages_otel.md` :
`.deb` (amd64/arm64), `.rpm` (x86_64/aarch64), `.tar.gz` (windows + linux), `checksums.txt`.

## Procédure d'import offline

1. Sur une machine connectée, télécharger les artefacts depuis les GitHub Releases officielles
   (`opentelemetry-collector-releases` v0.148.0) + `checksums.txt`.
2. **Vérifier l'intégrité** : `sha256sum -c checksums.txt` et la **signature GPG** (Key ID
   `5F41515F29C651CC`).
3. Transférer vers la zone air-gap puis pousser dans Harbor (projet `otel-packages`).

## Variables (via `environments/<env>/30-package-repo.tfvars`)

`kubeconfig_path`, `harbor_url`, `harbor_admin_password` (SOPS), `storage_size`, `otel_version`,
`robot_token_rotation_days`.

## Outputs (consommés par Ansible / B13)

| Output | Usage |
|---|---|
| `package_repo_url` | URL du dépôt |
| `otel_packages_path` | chemin du projet `otel-packages` |
| `robot_account_name` | compte read-only utilisé par les VMs |

Les VMs accèdent **en read-only** via le compte robot `vm-pull`.

## Rotation du token robot

Le token du compte robot a une **durée de vie bornée** (`robot_token_rotation_days`, défaut 90j).
La ressource `time_rotating` force la **régénération automatique** du compte (et donc du token) à
chaque intervalle : un `terraform apply` après l'échéance recrée le robot avec un nouveau secret.

```bash
# Rotation (après échéance) + récupération du nouveau token
terraform apply -var-file=../../environments/<env>/30-package-repo.tfvars
terraform output -raw robot_account_secret   # à re-chiffrer dans le vault Ansible/SOPS
```

Le nouveau token doit être propagé aux VMs via `ansible-playbook ... configure-agent.yaml`.
