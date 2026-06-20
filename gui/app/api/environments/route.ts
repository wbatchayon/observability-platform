import { NextRequest, NextResponse } from "next/server";
import { requireUser, getSession } from "@/lib/session";
import { githubClient, targetRepo, writeEnvConfigPR } from "@/lib/github";
import { envValuesSchema, toEnvValuesYaml } from "@/lib/validation";
import { serverError } from "@/lib/http";

export const runtime = "nodejs";

// Soumet la configuration d'un environnement : validée puis écrite via une PR (GitOps).
export async function POST(req: NextRequest) {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = envValuesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation échouée", issues: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  try {
    const { owner, repo } = targetRepo();
    const session = await getSession();
    const octo = githubClient(session.ghToken);
    const yaml = toEnvValuesYaml(parsed.data);
    const { prUrl, branch } = await writeEnvConfigPR(octo, owner, repo, parsed.data.environment, yaml);
    return NextResponse.json({ ok: true, prUrl, branch });
  } catch (e) {
    return serverError("environments", e);
  }
}
