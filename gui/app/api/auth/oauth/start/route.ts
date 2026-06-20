import { NextRequest, NextResponse } from "next/server";
import { oauthClientId, oauthEnabled, baseUrl, OAUTH_SCOPE } from "@/lib/oauth";

export const runtime = "nodejs";

// Démarre le flux OAuth GitHub : redirige vers la page d'autorisation GitHub.
export async function GET(req: NextRequest) {
  if (!oauthEnabled()) {
    return NextResponse.redirect(`${baseUrl(req)}/login?error=oauth_disabled`);
  }
  const state = crypto.randomUUID();
  const redirectUri = `${baseUrl(req)}/api/auth/oauth/callback`;

  const authorize = new URL("https://github.com/login/oauth/authorize");
  authorize.searchParams.set("client_id", oauthClientId());
  authorize.searchParams.set("redirect_uri", redirectUri);
  authorize.searchParams.set("scope", OAUTH_SCOPE);
  authorize.searchParams.set("state", state);

  const res = NextResponse.redirect(authorize.toString());
  res.cookies.set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return res;
}
