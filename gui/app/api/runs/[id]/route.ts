import { NextRequest, NextResponse } from "next/server";
import { requireUser, getSession } from "@/lib/session";
import { githubClient, targetRepo, getRunWithJobs } from "@/lib/github";
import { serverError } from "@/lib/http";

export const runtime = "nodejs";

// Détail d'une exécution : jobs et étapes (suivi quasi-temps réel).
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const runId = Number(params.id);
  if (!Number.isInteger(runId) || runId <= 0) {
    return NextResponse.json({ error: "Identifiant d'exécution invalide" }, { status: 400 });
  }

  try {
    const { owner, repo } = targetRepo();
    const session = await getSession();
    const octo = githubClient(session.ghToken);
    const run = await getRunWithJobs(octo, owner, repo, runId);
    return NextResponse.json({ run });
  } catch (e) {
    return serverError("run-detail", e);
  }
}
