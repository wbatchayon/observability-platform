import { NextRequest, NextResponse } from "next/server";
import { requireUser, getSession } from "@/lib/session";
import {
  githubClient,
  targetRepo,
  deployRef,
  readChartVersions,
  writeChartVersionsPR,
  dispatchWorkflow,
} from "@/lib/github";
import { chartComponents, validateChartVersions } from "@/lib/validation";
import { serverError, isConfigError, configError } from "@/lib/http";

export const runtime = "nodejs";

const ENVS = ["dev", "staging", "prod"];

// GET ?environment=dev : versions actuelles des charts + catalogue des composants.
export async function GET(req: NextRequest) {
  try {
    await requireUser();
  } catch (e) {
    if (isConfigError(e)) return configError(e);
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const environment = req.nextUrl.searchParams.get("environment") || "dev";
  if (!ENVS.includes(environment)) {
    return NextResponse.json({ error: "Environnement invalide" }, { status: 400 });
  }
  try {
    const { owner, repo } = targetRepo();
    const session = await getSession();
    const octo = githubClient(session.ghToken);
    const current = await readChartVersions(octo, owner, repo, environment);
    const components = chartComponents.map((c) => ({
      key: c.key,
      label: c.label,
      namespace: c.ns,
      current: current[c.key] || "",
    }));
    return NextResponse.json({ ok: true, environment, components });
  } catch (e) {
    return serverError("patch-management", e);
  }
}

// POST { environment, versions: {KEY: "x.y.z"}, launch?: boolean }
// Écrit les nouvelles versions via une PR (GitOps). Si launch, déclenche aussi le déploiement.
export async function POST(req: NextRequest) {
  try {
    await requireUser();
  } catch (e) {
    if (isConfigError(e)) return configError(e);
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const environment = String(body.environment || "");
  if (!ENVS.includes(environment)) {
    return NextResponse.json({ error: "Environnement invalide" }, { status: 400 });
  }
  const { ok, values, errors } = validateChartVersions(body.versions || {});
  if (!ok) {
    return NextResponse.json({ error: "Versions invalides", issues: errors }, { status: 422 });
  }
  if (Object.keys(values).length === 0) {
    return NextResponse.json({ error: "Aucune version à mettre à jour" }, { status: 400 });
  }
  try {
    const { owner, repo } = targetRepo();
    const session = await getSession();
    const octo = githubClient(session.ghToken);
    const { prUrl, branch } = await writeChartVersionsPR(octo, owner, repo, environment, values);
    let dispatched = false;
    if (body.launch === true) {
      try {
        await dispatchWorkflow(octo, owner, repo, "deploy.yaml", deployRef(), {
          action: "deploy",
          environment,
        });
        dispatched = true;
      } catch {
        // PR créée même si le dispatch échoue (workflow absent de la ref, etc.)
      }
    }
    return NextResponse.json({ ok: true, prUrl, branch, dispatched });
  } catch (e) {
    return serverError("patch-management", e);
  }
}
