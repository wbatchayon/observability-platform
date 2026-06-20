import { NextResponse } from "next/server";

export const runtime = "nodejs";

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
  const tools: Tool[] = [
    {
      key: "grafana",
      name: "Grafana",
      category: "Visualisation",
      description: "Dashboards logs / métriques / traces (corrélés).",
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
      key: "harbor",
      name: "Harbor",
      category: "Supply chain",
      description: "Registre OCI + dépôt de packages (air-gap).",
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
      description: "Console du stockage objet S3 (long terme).",
      url: url("TOOL_MINIO_URL"),
    },
  ];

  return NextResponse.json({ tools });
}
