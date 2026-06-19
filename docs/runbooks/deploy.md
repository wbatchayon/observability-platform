# Runbook — Déploiement

## Prérequis
- CLI : `terraform`, `flux`, `kubectl`, `helm`, `ansible`, `sops`, `age`.
- Accès SSH aux nœuds, dépôt Git + token, clé age.

## Étapes
1. Créer l'environnement : `cp -r environments/_template environments/<env>`, remplir, `make encrypt ENV=<env>`.
2. `make bootstrap ENV=<env>` (cluster → Vault → Flux → Harbor).
3. **Initialiser/desceller Vault** (ou auto-unseal) puis appliquer PKI/auth (cf. `bootstrap/10-vault/README.md`).
4. Importer les packages OTel dans Harbor (cf. `bootstrap/30-package-repo/README.md`).
5. `make deploy ENV=<env>` puis `flux get kustomizations` (tout `Ready`).
6. `ansible-playbook -i ansible/inventories/<env> ansible/playbooks/install-agent.yaml`.

## Vérifications
- `kubectl get pods -A` : pods `Running`.
- Grafana accessible (HTTPS) ; datasources OK ; données qui arrivent.
- `flux get all` sans erreur.

## Rollback
- GitOps : `git revert` de la PR fautive → Flux réconcilie l'état précédent.
- Terraform : `terraform apply` sur l'état précédent (state versionné).
