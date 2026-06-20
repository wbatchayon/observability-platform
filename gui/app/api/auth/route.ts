import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { client, isAuthorized } from "@/lib/github";
import { isConfigError, configError, serverError } from "@/lib/http";

export const runtime = "nodejs";

// Statut de session.
export async function GET() {
  try {
    const session = await getSession();
    return NextResponse.json({ authenticated: !!session.token, login: session.login || null });
  } catch (e) {
    if (isConfigError(e)) return configError(e);
    return serverError("auth.get", e);
  }
}

// Connexion : l'utilisateur fournit son token GitHub ; on le valide et on ouvre la session.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const token = typeof body.token === "string" ? body.token.trim() : "";
  if (!token) {
    return NextResponse.json({ error: "Jeton requis" }, { status: 400 });
  }

  const octo = client(token);

  // 1. Le jeton est-il valide ?
  let login: string;
  try {
    const { data } = await octo.users.getAuthenticated();
    login = data.login;
  } catch {
    return NextResponse.json({ error: "Jeton GitHub invalide" }, { status: 401 });
  }

  // 2. L'utilisateur est-il autorisé (allowlist / org / accès en écriture au dépôt) ?
  try {
    if (!(await isAuthorized(octo, login))) {
      return NextResponse.json(
        { error: "Accès refusé : un accès en écriture au dépôt (ou une autorisation explicite) est requis." },
        { status: 403 },
      );
    }
  } catch (e) {
    if (isConfigError(e)) return configError(e);
    return serverError("auth.authorize", e);
  }

  const session = await getSession();
  session.token = token;
  session.login = login;
  await session.save();
  return NextResponse.json({ authenticated: true, login });
}

// Déconnexion.
export async function DELETE() {
  const session = await getSession();
  session.destroy();
  return NextResponse.json({ authenticated: false });
}
