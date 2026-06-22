"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Locale = "fr" | "en";

type Dict = Record<string, string>;

const fr: Dict = {
  "nav.dashboard": "Tableau de bord",
  "nav.config": "Configuration",
  "nav.pipelines": "Pipelines",
  "nav.runs": "Suivi",
  "nav.tools": "Outils",
  "nav.patch": "Patch management",
  "nav.credentials": "Credentials",
  "nav.account": "Compte",

  "dash.title": "Console de management",
  "dash.subtitle":
    "Paramétrez vos environnements et vos identifiants, puis déclenchez vos pipelines CI/CD sans toucher au code.",
  "dash.environments": "Environnements",
  "dash.noDeploy": "Aucun déploiement récent.",
  "dash.deployBtn": "Déployer",
  "dash.tools": "Outils",
  "dash.allTools": "Tous les outils",
  "dash.recentRuns": "Exécutions récentes",
  "dash.allRuns": "Toutes les exécutions",
  "dash.viewSteps": "Voir les étapes",
  "dash.health.ok": "Opérationnel",
  "dash.health.degraded": "Dégradé",
  "dash.health.running": "En cours",
  "dash.health.unknown": "Inconnu",
  "common.environment": "Environnement",
  "dash.notConnected": "Vous n'êtes pas connecté. Connectez-vous avec votre jeton GitHub pour commencer.",
  "dash.signin": "Se connecter avec GitHub",
  "dash.connectedAs": "Connecté en tant que {login}.",
  "dash.steps": "Démarrez en 3 étapes",
  "dash.step": "Étape",
  "dash.s1.title": "Configurer",
  "dash.s1.desc": "Renseignez les valeurs d'un environnement. Elles sont validées puis proposées dans une Pull Request.",
  "dash.s2.title": "Identifiants",
  "dash.s2.desc": "Enregistrez vos identifiants de façon chiffrée dans GitHub Secrets.",
  "dash.s3.title": "Lancer et suivre",
  "dash.s3.desc": "Déclenchez la validation, le provisionnement ou le déploiement, puis suivez l'exécution.",

  "login.title": "Connexion",
  "login.connectedAs": "Connecté :",
  "login.signout": "Se déconnecter",
  "login.providerSection": "Connexion avec un fournisseur",
  "login.signinWith": "Se connecter avec {label}",
  "login.tokenSection": "Connexion par jeton GitHub",
  "login.tokenSectionAlt": "Ou par jeton GitHub",
  "login.tokenLabel": "Jeton GitHub (portées repo et workflow)",
  "login.generate": "Générer un jeton (portées pré-remplies)",
  "login.tokenBtn": "Se connecter avec un jeton",
  "login.connecting": "Connexion…",
  "login.note":
    "Accès réservé aux identités autorisées (email/domaine pour Google/SSO, accès en écriture au dépôt pour GitHub). Aucune donnée sensible n'est stockée côté serveur.",
  "login.connected": "Connecté.",
  "login.disconnected": "Déconnecté.",
  "login.fail": "Échec de connexion.",
  "err.state": "Échec de vérification de sécurité (state). Réessayez.",
  "err.token": "Échec de l'échange OAuth. Réessayez.",
  "err.forbidden": "Accès refusé : identité non autorisée (email/domaine ou accès au dépôt).",
  "err.provider_disabled": "Ce fournisseur de connexion n'est pas configuré sur ce serveur.",

  "env.title": "Configuration d'environnement",
  "env.values": "Valeurs (non sensibles)",
  "env.valuesHint": "Proposées dans une Pull Request",
  "env.secrets": "Identifiants (sensibles)",
  "env.secretsHint": "Chiffrés dans GitHub Secrets, jamais en clair",
  "env.validate": "Valider et créer la Pull Request",
  "env.saveSecrets": "Enregistrer les identifiants",
  "env.prCreated": "Pull Request créée :",
  "env.secretsSaved": "Identifiants enregistrés :",

  "pipe.title": "Pipelines",
  "pipe.envTarget": "Environnement cible",
  "pipe.note": "Déclenche le workflow de déploiement via l'API GitHub, sans modifier le code source.",
  "pipe.run": "Lancer {label}",
  "pipe.dispatching": "Déclenchement…",
  "pipe.dispatched": "Pipeline « {pipeline} » déclenché pour {env}. Consultez l'onglet Suivi.",
  "pipe.fail": "Échec",
  "pipe.validate": "Validation",
  "pipe.validate.desc": "Lint, kubeconform et scans de sécurité. Aucun déploiement.",
  "pipe.bootstrap": "Provisionnement",
  "pipe.bootstrap.desc": "Provisionne le socle : cluster, Harbor, Vault puis Flux.",
  "pipe.deploy": "Déploiement",
  "pipe.deploy.desc": "Réconcilie la plateforme via FluxCD.",

  "runs.title": "Suivi des exécutions",
  "runs.refresh": "Rafraîchir",
  "runs.loading": "Chargement…",
  "runs.none": "Aucune exécution.",
  "runs.workflow": "Workflow",
  "runs.branch": "Branche",
  "runs.event": "Événement",
  "runs.status": "Statut",
  "runs.logs": "Voir les logs",
  "runs.authRequired": "Connectez-vous depuis l'onglet Compte pour suivre les exécutions.",

  "tools.title": "Outils de la plateforme",
  "tools.subtitle": "Accès direct aux interfaces des composants déployés.",
  "tools.footer":
    "Les URLs sont fournies par les variables TOOL_* (renseignées après déploiement, ou injectées par Flux/Helm). Les outils non renseignés apparaissent « non configuré ».",
  "tools.notConfigured": "non configuré",
  "tools.authRequired": "Connectez-vous depuis l'onglet Compte pour accéder aux outils.",

  "pipe.wizard.subtitle": "Provisionnez et déployez la plateforme étape par étape.",
  "pipe.portability": "Portabilité",
  "pipe.portability.desc": "Paramètres écrits dans la configuration d'environnement via une Pull Request.",
  "pipe.knob.provider": "Fournisseur de cluster",
  "pipe.knob.storageClass": "StorageClass",
  "pipe.knob.lbType": "Type de Service (exposition)",
  "pipe.knob.chartSource": "Source des charts",
  "pipe.knob.netpol": "NetworkPolicies",
  "pipe.saveKnobs": "Enregistrer la configuration",
  "pipe.goRuns": "Voir les exécutions",
  "pipe.preflight": "Pré-vol",
  "pipe.preflight.desc": "Vérifie les prérequis du cluster : StorageClass, exposition, version, CNI.",
  "pipe.verify": "Vérification",
  "pipe.verify.desc": "Contrôle l'état des composants après déploiement.",

  "runs.noJobs": "Aucun job.",

  "patch.title": "Patch management",
  "patch.subtitle": "Choisissez la version cible de chaque composant. La mise à jour ouvre une Pull Request GitOps, puis Flux déploie.",
  "patch.tip": "Renovate ouvre aussi des Pull Requests proposant les dernières versions stables.",
  "patch.col.component": "Composant",
  "patch.col.namespace": "Namespace",
  "patch.col.current": "Version actuelle",
  "patch.col.next": "Nouvelle version",
  "patch.none": "Aucun composant chargé.",
  "patch.launch": "Lancer la mise à jour",
  "patch.readFail": "Lecture impossible.",
  "patch.created": "Pull Request de montée de version créée :",
  "patch.dispatched": "Déploiement déclenché.",
  "patch.toMerge": "Mergez-la pour déployer.",

  "cred.title": "Credentials",
  "cred.subtitle": "Saisissez ici tous les identifiants du projet. Ils sont chiffrés (sealed box) et stockés comme secrets du GitHub Environment correspondant. Jamais en clair, jamais dans le code. Les pipelines Terraform, Ansible et de déploiement les consomment automatiquement.",
  "cred.hint": "Seuls les champs renseignés sont enregistrés. Laissez vide ce qui ne s'applique pas.",
  "cred.save": "Enregistrer les credentials",
  "cred.empty": "Aucun credential saisi.",
  "cred.saved": "{n} credential(s) enregistré(s) et chiffré(s) pour « {env} ».",
  "cred.group.cloud": "Infrastructure et cloud (providers Terraform)",
  "cred.group.ansible": "Ansible (configuration des VMs air-gap)",
  "cred.group.core": "Vault et registre",
  "cred.group.platform": "Plateforme",
  "cred.group.notif": "Authentification et notifications",
};

const en: Dict = {
  "nav.dashboard": "Dashboard",
  "nav.config": "Configuration",
  "nav.pipelines": "Pipelines",
  "nav.runs": "Runs",
  "nav.tools": "Tools",
  "nav.patch": "Patch management",
  "nav.credentials": "Credentials",
  "nav.account": "Account",

  "dash.title": "Management console",
  "dash.subtitle":
    "Set up your environments and credentials, then trigger your CI/CD pipelines without touching the code.",
  "dash.environments": "Environments",
  "dash.noDeploy": "No recent deployment.",
  "dash.deployBtn": "Deploy",
  "dash.tools": "Tools",
  "dash.allTools": "All tools",
  "dash.recentRuns": "Recent runs",
  "dash.allRuns": "All runs",
  "dash.viewSteps": "View steps",
  "dash.health.ok": "Healthy",
  "dash.health.degraded": "Degraded",
  "dash.health.running": "Running",
  "dash.health.unknown": "Unknown",
  "common.environment": "Environment",
  "dash.notConnected": "You are not signed in. Sign in with your GitHub token to get started.",
  "dash.signin": "Sign in with GitHub",
  "dash.connectedAs": "Signed in as {login}.",
  "dash.steps": "Get started in 3 steps",
  "dash.step": "Step",
  "dash.s1.title": "Configure",
  "dash.s1.desc": "Enter an environment's values. They are validated then proposed in a Pull Request.",
  "dash.s2.title": "Credentials",
  "dash.s2.desc": "Store your credentials encrypted in GitHub Secrets.",
  "dash.s3.title": "Launch & track",
  "dash.s3.desc": "Trigger validation, provisioning or deployment, then track the run.",

  "login.title": "Sign in",
  "login.connectedAs": "Signed in:",
  "login.signout": "Sign out",
  "login.providerSection": "Sign in with a provider",
  "login.signinWith": "Sign in with {label}",
  "login.tokenSection": "Sign in with a GitHub token",
  "login.tokenSectionAlt": "Or with a GitHub token",
  "login.tokenLabel": "GitHub token (repo and workflow scopes)",
  "login.generate": "Generate a token (scopes pre-filled)",
  "login.tokenBtn": "Sign in with a token",
  "login.connecting": "Signing in…",
  "login.note":
    "Access restricted to authorized identities (email/domain for Google/SSO, write access to the repo for GitHub). No sensitive data is stored server-side.",
  "login.connected": "Signed in.",
  "login.disconnected": "Signed out.",
  "login.fail": "Sign-in failed.",
  "err.state": "Security check failed (state). Please retry.",
  "err.token": "OAuth exchange failed. Please retry.",
  "err.forbidden": "Access denied: identity not authorized (email/domain or repo access).",
  "err.provider_disabled": "This sign-in provider is not configured on this server.",

  "env.title": "Environment configuration",
  "env.values": "Values (non-sensitive)",
  "env.valuesHint": "Proposed in a Pull Request",
  "env.secrets": "Credentials (sensitive)",
  "env.secretsHint": "Encrypted in GitHub Secrets, never in clear text",
  "env.validate": "Validate and create the Pull Request",
  "env.saveSecrets": "Save credentials",
  "env.prCreated": "Pull Request created:",
  "env.secretsSaved": "Credentials saved:",

  "pipe.title": "Pipelines",
  "pipe.envTarget": "Target environment",
  "pipe.note": "Triggers the deployment workflow via the GitHub API, without touching the source code.",
  "pipe.run": "Run {label}",
  "pipe.dispatching": "Triggering…",
  "pipe.dispatched": "Pipeline \"{pipeline}\" triggered for {env}. See the Runs tab.",
  "pipe.fail": "Failed",
  "pipe.validate": "Validation",
  "pipe.validate.desc": "Lint, kubeconform and security scans. No deployment.",
  "pipe.bootstrap": "Provisioning",
  "pipe.bootstrap.desc": "Provisions the base: cluster, Harbor, Vault then Flux.",
  "pipe.deploy": "Deployment",
  "pipe.deploy.desc": "Reconciles the platform via FluxCD.",

  "runs.title": "Run history",
  "runs.refresh": "Refresh",
  "runs.loading": "Loading…",
  "runs.none": "No runs.",
  "runs.workflow": "Workflow",
  "runs.branch": "Branch",
  "runs.event": "Event",
  "runs.status": "Status",
  "runs.logs": "View logs",
  "runs.authRequired": "Sign in from the Account tab to track runs.",

  "tools.title": "Platform tools",
  "tools.subtitle": "Direct access to the deployed components' interfaces.",
  "tools.footer":
    "URLs come from the TOOL_* variables (set after deployment, or injected by Flux/Helm). Unset tools show as \"not configured\".",
  "tools.notConfigured": "not configured",
  "tools.authRequired": "Sign in from the Account tab to access the tools.",

  "pipe.wizard.subtitle": "Provision and deploy the platform step by step.",
  "pipe.portability": "Portability",
  "pipe.portability.desc": "Settings written to the environment configuration via a Pull Request.",
  "pipe.knob.provider": "Cluster provider",
  "pipe.knob.storageClass": "StorageClass",
  "pipe.knob.lbType": "Service type (exposure)",
  "pipe.knob.chartSource": "Chart source",
  "pipe.knob.netpol": "NetworkPolicies",
  "pipe.saveKnobs": "Save configuration",
  "pipe.goRuns": "View runs",
  "pipe.preflight": "Preflight",
  "pipe.preflight.desc": "Checks cluster prerequisites: StorageClass, exposure, version, CNI.",
  "pipe.verify": "Verification",
  "pipe.verify.desc": "Checks component status after deployment.",

  "runs.noJobs": "No jobs.",

  "patch.title": "Patch management",
  "patch.subtitle": "Choose the target version for each component. The update opens a GitOps Pull Request, then Flux deploys.",
  "patch.tip": "Renovate also opens Pull Requests proposing the latest stable versions.",
  "patch.col.component": "Component",
  "patch.col.namespace": "Namespace",
  "patch.col.current": "Current version",
  "patch.col.next": "New version",
  "patch.none": "No component loaded.",
  "patch.launch": "Launch the update",
  "patch.readFail": "Could not read.",
  "patch.created": "Version-bump Pull Request created:",
  "patch.dispatched": "Deployment triggered.",
  "patch.toMerge": "Merge it to deploy.",

  "cred.title": "Credentials",
  "cred.subtitle": "Enter every project credential here. They are encrypted (sealed box) and stored as secrets of the matching GitHub Environment. Never in clear text, never in the code. The Terraform, Ansible and deployment pipelines consume them automatically.",
  "cred.hint": "Only filled fields are saved. Leave blank anything that does not apply.",
  "cred.save": "Save credentials",
  "cred.empty": "No credential entered.",
  "cred.saved": "{n} credential(s) saved and encrypted for \"{env}\".",
  "cred.group.cloud": "Infrastructure and cloud (Terraform providers)",
  "cred.group.ansible": "Ansible (air-gapped VM configuration)",
  "cred.group.core": "Vault and registry",
  "cred.group.platform": "Platform",
  "cred.group.notif": "Authentication and notifications",
};

// Catégories + descriptions des outils (clé = tool.key).
const toolsFr: Dict = {
  "grafana.cat": "Visualisation", "grafana.desc": "Tableaux de bord des logs, métriques et traces, corrélés.",
  "prometheus.cat": "Monitoring", "prometheus.desc": "Métriques et règles d'alerte de la plateforme.",
  "alertmanager.cat": "Alerting", "alertmanager.desc": "Routage et inhibition des alertes.",
  "oneuptime.cat": "Incidents", "oneuptime.desc": "Disponibilité, statut et webhooks d'alerte.",
  "glpi.cat": "Incidents", "glpi.desc": "Tickets et cycle de vie des incidents.",
  "slack.cat": "Notifications", "slack.desc": "Notifications d'astreinte (problèmes majeurs) émises par OneUptime.",
  "renovate.cat": "Patch management", "renovate.desc": "Mises à jour automatiques des outils par Pull Request.",
  "harbor.cat": "Supply chain", "harbor.desc": "Registre OCI et dépôt de paquets pour les environnements isolés d'Internet.",
  "vault.cat": "Sécurité", "vault.desc": "Secrets et PKI mTLS de la plateforme.",
  "minio.cat": "Stockage", "minio.desc": "Console du stockage objet S3 (archivage long terme).",
};
const toolsEn: Dict = {
  "grafana.cat": "Visualization", "grafana.desc": "Correlated logs, metrics and traces dashboards.",
  "prometheus.cat": "Monitoring", "prometheus.desc": "Platform metrics and alerting rules.",
  "alertmanager.cat": "Alerting", "alertmanager.desc": "Alert routing and inhibition.",
  "oneuptime.cat": "Incidents", "oneuptime.desc": "Availability, status and alert webhooks.",
  "glpi.cat": "Incidents", "glpi.desc": "Tickets and incident lifecycle.",
  "slack.cat": "Notifications", "slack.desc": "On-call notifications (major issues) sent by OneUptime.",
  "renovate.cat": "Patch management", "renovate.desc": "Automatic tool updates via Pull Request.",
  "harbor.cat": "Supply chain", "harbor.desc": "OCI registry and package repository for air-gapped environments.",
  "vault.cat": "Security", "vault.desc": "Platform secrets and mTLS PKI.",
  "minio.cat": "Storage", "minio.desc": "S3 object storage console (long-term archival).",
};

const dicts: Record<Locale, Dict> = { fr: { ...fr }, en: { ...en } };
const toolDicts: Record<Locale, Dict> = { fr: toolsFr, en: toolsEn };

interface I18nCtx {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, params?: Record<string, string>) => string;
  tool: (key: string, field: "cat" | "desc") => string;
}

const Ctx = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("fr");

  useEffect(() => {
    const saved = (localStorage.getItem("locale") as Locale | null) || null;
    if (saved === "fr" || saved === "en") {
      setLocaleState(saved);
    } else if (typeof navigator !== "undefined" && navigator.language.toLowerCase().startsWith("en")) {
      setLocaleState("en");
    }
  }, []);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem("locale", l);
      document.documentElement.lang = l;
    } catch {
      /* ignore */
    }
  };

  const t = (key: string, params?: Record<string, string>) => {
    let s = dicts[locale][key] ?? dicts.fr[key] ?? key;
    if (params) for (const [k, v] of Object.entries(params)) s = s.replaceAll(`{${k}}`, v);
    return s;
  };

  const tool = (key: string, field: "cat" | "desc") =>
    toolDicts[locale][`${key}.${field}`] ?? toolDicts.fr[`${key}.${field}`] ?? "";

  return <Ctx.Provider value={{ locale, setLocale, t, tool }}>{children}</Ctx.Provider>;
}

export function useI18n(): I18nCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useI18n must be used within I18nProvider");
  return c;
}
