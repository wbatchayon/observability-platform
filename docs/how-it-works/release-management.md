# Gestion des releases

Releases **entièrement automatisées** à partir des Conventional Commits. Aucune étape manuelle de
versioning : on merge des PR, et les versions/changelog/artefacts se produisent seuls.

## Flux

```
PR mergées (conventional commits) ─▶ Release Please ouvre/maj une "release PR"
   (calcule la version SemVer + génère CHANGELOG.md)
        └─ merge de la release PR ─▶ tag vX.Y.Z + GitHub Release
              └─ job artifacts : bundle.tar.gz + SBOM + signatures cosign ─▶ attachés à la Release
```

## Composants

| Élément | Rôle |
|---|---|
| `.github/workflows/release.yaml` | Pipeline : Release Please + publication d'artefacts signés |
| `.github/release-please-config.json` | Type de release, sections de changelog, stratégie de bump |
| `.github/.release-please-manifest.json` | Version courante (source de vérité : `0.1.0` au départ) |

## Versioning (SemVer)

- Piloté par les **Conventional Commits** : `feat:` → mineure, `fix:`/`perf:` → patch,
  `feat!:`/`BREAKING CHANGE` → majeure.
- Avant la 1.0.0 : `feat` reste en bump mineur, breaking en mineur (config
  `bump-minor-pre-major`).
- Tags au format `vX.Y.Z` ; `CHANGELOG.md` généré et versionné.

## Artefacts de release (supply chain)

À chaque release :
- **`observability-platform-vX.Y.Z.tar.gz`** — bundle reproductible du dépôt (`git archive`).
- **`*.sbom.spdx.json`** — SBOM (syft).
- **Signatures cosign** (keyless OIDC) du bundle (`.sig` + `.pem`) et du SBOM (`.sig`).

Ces artefacts servent à la **distribution air-gap** (transfert hors-ligne, vérification
d'intégrité/signature avant import).

## Vérifier une release

```bash
# Télécharger les artefacts puis vérifier la signature du bundle
cosign verify-blob observability-platform-vX.Y.Z.tar.gz \
  --signature observability-platform-vX.Y.Z.tar.gz.sig \
  --certificate observability-platform-vX.Y.Z.tar.gz.pem \
  --certificate-identity-regexp 'https://github.com/wbatchayon/observability-platform/.*' \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com
```

## Responsabilités

Cadence d'approbation et rôles : voir le [RACI](../governance/raci-version-upgrades.md). La release
PR est revue avant merge (l'acte de release reste une décision humaine) ; tout le reste est
automatique.
