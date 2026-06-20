import { NextRequest, NextResponse } from "next/server";
import { requireToken } from "@/lib/session";
import { client, targetRepo, setActionsSecret } from "@/lib/github";
import { secretsSchema } from "@/lib/validation";

export const runtime = "nodejs";

// Enregistre les credentials d'un environnement comme secrets GitHub Actions (sealed box).
// Les valeurs ne sont jamais stockées ni journalisées en clair.
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
  const prefix = environment.toUpperCase();

  try {
    const { owner, repo } = targetRepo();
    const octo = client(auth.token);
    const names: string[] = [];
    for (const [k, v] of Object.entries(secrets)) {
      const name = `${prefix}_${k}`;
      await setActionsSecret(octo, owner, repo, name, v as string);
      names.push(name);
    }
    return NextResponse.json({ ok: true, secretsSet: names });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
