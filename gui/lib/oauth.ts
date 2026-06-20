import { NextRequest } from "next/server";

// Configuration OAuth GitHub (OAuth App). Activée si client id + secret sont présents.
export function oauthClientId(): string {
  return process.env.GITHUB_OAUTH_CLIENT_ID || "";
}

export function oauthClientSecret(): string {
  return process.env.GITHUB_OAUTH_CLIENT_SECRET || "";
}

export function oauthEnabled(): boolean {
  return !!(oauthClientId() && oauthClientSecret());
}

// URL de base publique (pour construire le redirect_uri). GUI_BASE_URL prioritaire, sinon dérivée
// des en-têtes de la requête (compatible Vercel via x-forwarded-*).
export function baseUrl(req: NextRequest): string {
  if (process.env.GUI_BASE_URL) return process.env.GUI_BASE_URL.replace(/\/+$/, "");
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  return `${proto}://${host}`;
}

export const OAUTH_SCOPE = "repo workflow";
