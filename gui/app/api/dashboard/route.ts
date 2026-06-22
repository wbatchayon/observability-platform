import { NextResponse } from "next/server";
import { requireUser, getSession } from "@/lib/session";
import { githubClient, targetRepo, listRuns } from "@/lib/github";
import { serverError } from "@/lib/http";

export const runtime = "nodejs";
// Lecture des variables TOOL_* à l'exécution (pas de prérendu statique).
export const dynamic = "force-dynamic";

const ENVIRONMENTS = ["dev", "staging", "prod"] as const;

const TOOL_KEYS = [
  "grafana",
  "minio",
  "harbor",
  "vault",
  "oneuptime",
  "glpi",
] as const;

const TOOL_ENV: Record<string, string> = {
  grafana: "TOOL_GRAFANA_URL",
  minio: "TOOL_MINIO_URL",
  harbor: "TOOL_HARBOR_URL",
  vault: "TOOL_VAULT_URL",
  oneuptime: "TOOL_ONEUPTIME_URL",
  glpi: "TOOL_GLPI_URL",
};

const TOOL_NAME: Record<string, string> = {
  grafana: "Grafana",
  minio: "MinIO",
  harbor: "Harbor",
  vault: "Vault",
  oneuptime: "OneUptime",
  glpi: "GLPI",
};

// Vue d'ensemble : dernier déploiement par environnement (Actions), liens d'accès aux outils,
// santé synthétique. Réutilise listRuns + variables TOOL_*.
export async function GET() {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const { owner, repo } = targetRepo();
    const session = await getSession();
    const octo = githubClient(session.ghToken);
    const runs = await listRuns(octo, owner, repo);

    // Dernier déploiement par environnement, déduit de la branche de config GUI (gui/config-<env>)
    // ou, à défaut, de la dernière exécution toutes branches confondues.
    const environments = ENVIRONMENTS.map((env) => {
      const match = runs.find((r) => r.branch === `gui/config-${env}`) || null;
      return {
        environment: env,
        lastRun: match
          ? {
              id: match.id,
              name: match.name,
              status: match.status,
              conclusion: match.conclusion,
              createdAt: match.createdAt,
              url: match.url,
            }
          : null,
      };
    });

    const tools = TOOL_KEYS.map((key) => {
      const u = process.env[TOOL_ENV[key]];
      return { key, name: TOOL_NAME[key], url: u && u.length > 0 ? u : null };
    });

    // Santé synthétique : succès / échecs sur les exécutions récentes.
    const completed = runs.filter((r) => r.status === "completed");
    const failures = completed.filter((r) => r.conclusion && r.conclusion !== "success").length;
    const inProgress = runs.filter((r) => r.status !== "completed").length;
    const health =
      failures > 0 ? "degraded" : inProgress > 0 ? "running" : completed.length > 0 ? "ok" : "unknown";

    return NextResponse.json({
      environments,
      tools,
      health: { status: health, failures, inProgress, total: runs.length },
      recentRuns: runs.slice(0, 5),
    });
  } catch (e) {
    return serverError("dashboard", e);
  }
}
