import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { client } from "@/lib/github";

export const runtime = "nodejs";

// Statut de session.
export async function GET() {
  const session = await getSession();
  return NextResponse.json({ authenticated: !!session.token, login: session.login || null });
}

// Connexion : l'utilisateur fournit son token GitHub ; on le valide et on ouvre la session.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const token = typeof body.token === "string" ? body.token.trim() : "";
  if (!token) {
    return NextResponse.json({ error: "Token requis" }, { status: 400 });
  }
  try {
    const octo = client(token);
    const { data } = await octo.users.getAuthenticated();
    const session = await getSession();
    session.token = token;
    session.login = data.login;
    await session.save();
    return NextResponse.json({ authenticated: true, login: data.login });
  } catch {
    return NextResponse.json({ error: "Token GitHub invalide" }, { status: 401 });
  }
}

// Déconnexion.
export async function DELETE() {
  const session = await getSession();
  session.destroy();
  return NextResponse.json({ authenticated: false });
}
