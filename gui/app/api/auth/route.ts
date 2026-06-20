import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { client, isAuthorized } from "@/lib/github";
import { enabledProviders } from "@/lib/auth-providers";
import { isConfigError, configError, serverError } from "@/lib/http";

export const runtime = "nodejs";

// Statut de session + méthodes de connexion disponibles.
export async function GET() {
  try {
    const session = await getSession();
    return NextResponse.json({
      authenticated: !!session.user,
      login: session.user?.login || null,
      provider: session.user?.provider || null,
      providers: enabledProviders(), // OAuth/OIDC activés (github/google/oidc)
    });
  } catch (e) {
    if (isConfigError(e)) return configError(e);
    return serverError("auth.get", e);
  }
}

// Connexion par jeton GitHub personnel (méthode toujours disponible).
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const token = typeof body.token === "string" ? body.token.trim() : "";
  if (!token) {
    return NextResponse.json({ error: "Jeton requis" }, { status: 400 });
  }

  const octo = client(token);
  let login: string;
  try {
    const { data } = await octo.users.getAuthenticated();
    login = data.login;
  } catch {
    return NextResponse.json({ error: "Jeton GitHub invalide" }, { status: 401 });
  }

  try {
    if (!(await isAuthorized(octo, login))) {
      return NextResponse.json(
        { error: "Accès refusé : un accès en écriture au dépôt est requis." },
        { status: 403 },
      );
    }
  } catch (e) {
    if (isConfigError(e)) return configError(e);
    return serverError("auth.authorize", e);
  }

  const session = await getSession();
  session.user = { login, provider: "token" };
  session.ghToken = token;
  await session.save();
  return NextResponse.json({ authenticated: true, login });
}

// Déconnexion.
export async function DELETE() {
  const session = await getSession();
  session.destroy();
  return NextResponse.json({ authenticated: false });
}
