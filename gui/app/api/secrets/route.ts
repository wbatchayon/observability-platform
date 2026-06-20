import { NextRequest, NextResponse } from "next/server";
import { requireToken } from "@/lib/session";
import { client, targetRepo, setEnvironmentSecret } from "@/lib/github";
import { secretsSchema } from "@/lib/validation";
import { serverError } from "@/lib/http";

export const runtime = "nodejs";

// Enregistre les credentials d'un environnement comme secrets scopés au GitHub Environment
// correspondant (sealed box). Jamais stockés ni journalisés en clair.
export async function POST(req: NextRequest) {
  let auth;
  try {
    auth = await requireToken();
  } catch {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = secretsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation échouée", issues: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const { environment, ...secrets } = parsed.data;

  try {
    const { owner, repo } = targetRepo();
    const octo = client(auth.token);
    const names: string[] = [];
    for (const [k, v] of Object.entries(secrets)) {
      if (!v) continue; // facultatif laissé vide -> on ne pose pas
      await setEnvironmentSecret(octo, owner, repo, environment, k, v as string);
      names.push(k);
    }
    return NextResponse.json({ ok: true, environment, secretsSet: names });
  } catch (e) {
    return serverError("secrets", e);
  }
}
