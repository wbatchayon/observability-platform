import { NextRequest } from "next/server";

// URL de base publique (pour construire les redirect_uri). GUI_BASE_URL prioritaire, sinon dérivée
// des en-têtes de la requête (compatible Vercel via x-forwarded-*).
export function baseUrl(req: NextRequest): string {
  if (process.env.GUI_BASE_URL) return process.env.GUI_BASE_URL.replace(/\/+$/, "");
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  return `${proto}://${host}`;
}
