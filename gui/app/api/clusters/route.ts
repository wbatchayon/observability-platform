import { NextResponse } from "next/server";
import { requireUser, getSession } from "@/lib/session";
import { githubClient, targetRepo, readEnvConfig } from "@/lib/github";
import { serverError } from "@/lib/http";

export const runtime = "nodejs";

const ENVIRONMENTS = ["dev", "staging", "prod"] as const;

interface ClusterInfo {
  environment: string;
  provider: string | null;
  storageClass: string | null;
  lbServiceType: string | null;
  chartSource: string | null;
  networkPolicies: string | null;
  configured: boolean;
}

// Liste le fournisseur de cluster et les knobs de portabilité configurés par environnement,
// lus depuis environments/<env>/env-values.yaml (config GitOps, jamais en dur).
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

    const clusters: ClusterInfo[] = await Promise.all(
      ENVIRONMENTS.map(async (environment) => {
        const cfg = await readEnvConfig(octo, owner, repo, environment);
        return {
          environment,
          provider: cfg?.CLUSTER_PROVIDER ?? null,
          storageClass: cfg?.STORAGE_CLASS ?? null,
          lbServiceType: cfg?.LB_SERVICE_TYPE ?? null,
          chartSource: cfg?.CHART_SOURCE ?? null,
          networkPolicies: cfg?.NETWORK_POLICIES_ENABLED ?? null,
          configured: !!cfg,
        };
      }),
    );

    return NextResponse.json({ clusters });
  } catch (e) {
    return serverError("clusters", e);
  }
}
