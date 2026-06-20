import { NextResponse } from "next/server";

// Erreur serveur : le détail est journalisé côté serveur, jamais renvoyé au client (#3).
export function serverError(context: string, e: unknown) {
  // eslint-disable-next-line no-console
  console.error(`[${context}]`, e);
  return NextResponse.json(
    { error: "Erreur interne. Consultez les logs du serveur." },
    { status: 500 },
  );
}

// Erreur de configuration (ex: SESSION_SECRET manquant) : message explicite, pas un 500 opaque (#6).
export function isConfigError(e: unknown): boolean {
  const m = (e as Error)?.message || "";
  return m.includes("SESSION_SECRET") || m.includes("GITHUB_REPOSITORY");
}

export function configError(e: unknown) {
  return NextResponse.json(
    { error: `Configuration serveur incomplète : ${(e as Error).message}` },
    { status: 503 },
  );
}
