# docs/imgs — Schémas et visuels du projet

Diagrammes sources (Mermaid `.mmd`) — rendus en SVG/PNG par la CI docs ou localement :

```bash
# Rendu local d'un diagramme
npx -y @mermaid-js/mermaid-cli -i docs/imgs/architecture.mmd -o docs/imgs/architecture.svg
```

| Source (`.mmd`) | Contenu |
|---|---|---|
| `architecture.mmd` | Architecture globale (collecte → ingestion → backends → visu → incident) |
| `security.mmd` | Chaîne mTLS (Vault PKI → cert-manager) + garde-fous cluster |
| `gitops-flow.mmd` | Workflow GitOps / Pull Requests |


> Captures d'écran de démonstration (Grafana, OneUptime) : déposer sous `screenshots/` et les
> référencer depuis `docs/how-it-works/`.
