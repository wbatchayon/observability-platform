import { NextRequest, NextResponse } from "next/server";
import { requireToken } from "@/lib/session";
import { client, targetRepo, dispatchWorkflow } from "@/lib/github";
import { dispatchSchema } from "@/lib/validation";

export const runtime = "nodejs";

// Déclenche un pipeline (validate/bootstrap/deploy) via workflow_dispatch — sans toucher au code.
export async function POST(req: NextRequest) {
  let auth;
  try {
    auth = await requireToken();
  } catch {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = dispatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation échouée", issues: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  try {
    const { owner, repo } = targetRepo();
    const octo = client(auth.token);
    await dispatchWorkflow(octo, owner, repo, "deploy.yaml", "main", {
      environment: parsed.data.environment,
      action: parsed.data.pipeline,
    });
    return NextResponse.json({ ok: true, dispatched: parsed.data });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
