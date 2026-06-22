import { NextRequest, NextResponse } from "next/server";
import { requireUser, getSession } from "@/lib/session";
import { githubClient, targetRepo, setEnvironmentSecret } from "@/lib/github";
import { validateCredentials } from "@/lib/validation";
import { serverError } from "@/lib/http";

export const runtime = "nodejs";

// Enregistre TOUS les credentials saisis (cloud, Ansible, Vault, registre, plateforme,
// notifications) comme secrets scopés au GitHub Environment (sealed box). Jamais en clair.
// Seuls les champs renseignés sont posés.
export async function POST(req: NextRequest) {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { environment, ...rest } = body as { environment?: string } & Record<string, unknown>;
  const { ok, values, error } = validateCredentials(String(environment || ""), rest);
  if (!ok) {
    return NextResponse.json({ error }, { status: 400 });
  }
  if (Object.keys(values).length === 0) {
    return NextResponse.json({ error: "Aucun credential à enregistrer" }, { status: 400 });
  }

  try {
    const { owner, repo } = targetRepo();
    const session = await getSession();
    const octo = githubClient(session.ghToken);
    const names: string[] = [];
    for (const [k, v] of Object.entries(values)) {
      await setEnvironmentSecret(octo, owner, repo, String(environment), k, v);
      names.push(k);
    }
    return NextResponse.json({ ok: true, environment, secretsSet: names });
  } catch (e) {
    return serverError("credentials", e);
  }
}
