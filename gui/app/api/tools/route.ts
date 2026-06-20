import { NextResponse } from "next/server";
import { requireToken } from "@/lib/session";

export const runtime = "nodejs";
// Lecture des variables TOOL_* à l'exécution (pas de prérendu statique au build).
export const dynamic = "force-dynamic";

// Catalogue des outils de la plateforme et leurs URLs (configurées via variables TOOL_*).
// Après déploiement, l'opérateur renseigne ces URLs (ou elles sont injectées par Flux/Helm).
interface Tool {
  key: string;
  name: string;
  category: string;
  description: string;
  url: string | null;
}

function url(name: string): string | null {
  const v = process.env[name];
  return v && v.length > 0 ? v : null;
}

export async function GET() {
  try {
    await requireToken();
  } catch {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const tools: Tool[] = [
    {
      key: "grafana",
      name: "Grafana",
      category: "Visualisation",
      description: "Tableaux de bord des logs, métriques et traces, corrélés.",
      url: url("TOOL_GRAFANA_URL"),
    },
    {
      key: "prometheus",
      name: "Prometheus",
      category: "Monitoring",
      description: "Métriques et règles d'alerte de la plateforme.",
      url: url("TOOL_PROMETHEUS_URL"),
    },
    {
      key: "alertmanager",
      name: "Alertmanager",
      category: "Alerting",
      description: "Routage et inhibition des alertes.",
      url: url("TOOL_ALERTMANAGER_URL"),
    },
    {
      key: "oneuptime",
      name: "OneUptime",
      category: "Incidents",
      description: "Disponibilité, statut et webhooks d'alerte.",
      url: url("TOOL_ONEUPTIME_URL"),
    },
    {
      key: "glpi",
      name: "GLPI",
      category: "Incidents",
      description: "Tickets et cycle de vie des incidents.",
      url: url("TOOL_GLPI_URL"),
    },
    {
      key: "slack",
      name: "Slack",
      category: "Notifications",
      description: "Notifications d'astreinte (problèmes majeurs) émises par OneUptime.",
      url: url("TOOL_SLACK_URL"),
    },
    {
      key: "renovate",
      name: "Renovate",
      category: "Patch management",
      description: "Mises à jour automatiques des outils (charts, images, dépendances) par Pull Request.",
      url: url("TOOL_RENOVATE_URL"),
    },
    {
      key: "harbor",
      name: "Harbor",
      category: "Supply chain",
      description: "Registre OCI et dépôt de paquets pour les environnements isolés d'Internet.",
      url: url("TOOL_HARBOR_URL"),
    },
    {
      key: "vault",
      name: "Vault",
      category: "Sécurité",
      description: "Secrets et PKI mTLS de la plateforme.",
      url: url("TOOL_VAULT_URL"),
    },
    {
      key: "minio",
      name: "MinIO",
      category: "Stockage",
      description: "Console du stockage objet S3 (archivage long terme).",
      url: url("TOOL_MINIO_URL"),
    },
  ];

  return NextResponse.json({ tools });
}
