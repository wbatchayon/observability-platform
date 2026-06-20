import { NextRequest, NextResponse } from "next/server";
import { baseUrl } from "@/lib/oauth";
import { getProvider } from "@/lib/auth-providers";

export const runtime = "nodejs";

// Démarre le flux OAuth/OIDC pour le fournisseur demandé (github | google | oidc).
export async function GET(req: NextRequest, { params }: { params: { provider: string } }) {
  const base = baseUrl(req);
  const provider = getProvider(params.provider);
  if (!provider || !provider.enabled) {
    return NextResponse.redirect(`${base}/login?error=provider_disabled`);
  }

  const ep = await provider.endpoints();
  const state = crypto.randomUUID();
  const redirectUri = `${base}/api/auth/${provider.id}/callback`;

  const authorize = new URL(ep.authorize);
  authorize.searchParams.set("client_id", provider.clientId);
  authorize.searchParams.set("redirect_uri", redirectUri);
  authorize.searchParams.set("scope", provider.scope);
  authorize.searchParams.set("response_type", "code");
  authorize.searchParams.set("state", state);

  const res = NextResponse.redirect(authorize.toString());
  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 600,
  };
  res.cookies.set("oauth_state", state, cookieOpts);
  res.cookies.set("oauth_provider", provider.id, cookieOpts);
  return res;
}
