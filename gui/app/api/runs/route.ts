import { NextResponse } from "next/server";
import { requireUser, getSession } from "@/lib/session";
import { githubClient, targetRepo, listRuns } from "@/lib/github";
import { serverError } from "@/lib/http";

export const runtime = "nodejs";

// Suivi des exécutions (statut/conclusion/liens).
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
    return NextResponse.json({ runs });
  } catch (e) {
    return serverError("runs", e);
  }
}
