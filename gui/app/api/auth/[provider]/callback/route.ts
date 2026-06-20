import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getProvider } from "@/lib/auth-providers";
import { baseUrl } from "@/lib/oauth";

export const runtime = "nodejs";

// Callback OAuth/OIDC : échange le code, récupère l'identité, applique l'autorisation, ouvre la session.
export async function GET(req: NextRequest, { params }: { params: { provider: string } }) {
  const base = baseUrl(req);
  const fail = (reason: string) => NextResponse.redirect(`${base}/login?error=${reason}`);

  const provider = getProvider(params.provider);
  if (!provider || !provider.enabled) return fail("provider_disabled");

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieState = req.cookies.get("oauth_state")?.value;
  if (!code || !state || !cookieState || state !== cookieState) return fail("state");

  // Échange du code contre un access token (form-urlencoded, réponse JSON).
  let accessToken: string;
  try {
    const ep = await provider.endpoints();
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: provider.clientId,
      client_secret: provider.clientSecret,
      redirect_uri: `${base}/api/auth/${provider.id}/callback`,
    });
    const resp = await fetch(ep.token, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body,
    });
    const data = (await resp.json()) as { access_token?: string };
    if (!data.access_token) return fail("token");
    accessToken = data.access_token;
  } catch {
    return fail("token");
  }

  // Identité + autorisation.
  let identity;
  try {
    identity = await provider.identify(accessToken);
  } catch {
    return fail("token");
  }
  if (!identity) return fail("forbidden");

  const session = await getSession();
  session.user = identity.user;
  session.ghToken = identity.ghToken;
  await session.save();

  const res = NextResponse.redirect(`${base}/`);
  res.cookies.delete("oauth_state");
  res.cookies.delete("oauth_provider");
  return res;
}
