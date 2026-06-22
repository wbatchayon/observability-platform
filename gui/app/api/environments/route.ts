import { NextRequest, NextResponse } from "next/server";
import { requireUser, getSession } from "@/lib/session";
import { githubClient, targetRepo, writeEnvValuesMergePR } from "@/lib/github";
import { envValuesSchema, envValuesRecord } from "@/lib/validation";
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
    const env = parsed.data.environment;
    const values = envValuesRecord(parsed.data);
    const { prUrl, branch } = await writeEnvValuesMergePR(octo, owner, repo, env, values, {
      branch: `gui/config-${env}`,
      title: `chore(gui): configuration de l'environnement ${env}`,
      message: `chore(gui): configuration de l'environnement ${env}`,
      body: "Configuration générée via la console (fusion en place, sans modification du code).",
    });
    return NextResponse.json({ ok: true, prUrl, branch });
  } catch (e) {
    return serverError("environments", e);
  }
}
