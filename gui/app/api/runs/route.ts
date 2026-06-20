import { NextResponse } from "next/server";
import { requireToken } from "@/lib/session";
import { client, targetRepo, listRuns } from "@/lib/github";

export const runtime = "nodejs";

// Suivi des exécutions (statut/conclusion/liens).
export async function GET() {
  let auth;
  try {
    auth = await requireToken();
  } catch {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  try {
    const { owner, repo } = targetRepo();
    const octo = client(auth.token);
    const runs = await listRuns(octo, owner, repo);
    return NextResponse.json({ runs });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
