import { NextRequest, NextResponse } from "next/server";
import { requireToken } from "@/lib/session";
import { client, targetRepo, dispatchWorkflow, deployRef } from "@/lib/github";
import { dispatchSchema } from "@/lib/validation";
import { serverError } from "@/lib/http";

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
    await dispatchWorkflow(octo, owner, repo, "deploy.yaml", deployRef(), {
      environment: parsed.data.environment,
      action: parsed.data.pipeline,
    });
    return NextResponse.json({ ok: true, dispatched: parsed.data });
  } catch (e) {
    // Le message d'absence de workflow est explicite et sûr à exposer.
    const msg = (e as Error).message || "";
    if (msg.includes("introuvable")) {
      return NextResponse.json({ error: msg }, { status: 409 });
    }
    return serverError("pipelines", e);
  }
}
