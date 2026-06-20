import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { client, isAuthorized } from "@/lib/github";
import { oauthClientId, oauthClientSecret, oauthEnabled, baseUrl } from "@/lib/oauth";

export const runtime = "nodejs";

// Callback OAuth GitHub : échange le code contre un jeton, vérifie l'autorisation, ouvre la session.
export async function GET(req: NextRequest) {
  const base = baseUrl(req);
  const fail = (reason: string) => NextResponse.redirect(`${base}/login?error=${reason}`);

  if (!oauthEnabled()) return fail("oauth_disabled");

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieState = req.cookies.get("oauth_state")?.value;

  if (!code || !state || !cookieState || state !== cookieState) {
    return fail("state");
  }

  // Échange du code contre un access token.
  let token: string;
  try {
    const resp = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        client_id: oauthClientId(),
        client_secret: oauthClientSecret(),
        code,
        redirect_uri: `${base}/api/auth/oauth/callback`,
      }),
    });
    const data = (await resp.json()) as { access_token?: string };
    if (!data.access_token) return fail("token");
    token = data.access_token;
  } catch {
    return fail("token");
  }

  // Validation + autorisation.
  let login: string;
  try {
    const octo = client(token);
    const { data } = await octo.users.getAuthenticated();
    login = data.login;
    if (!(await isAuthorized(octo, login))) return fail("forbidden");
  } catch {
    return fail("token");
  }

  const session = await getSession();
  session.token = token;
  session.login = login;
  await session.save();

  const res = NextResponse.redirect(`${base}/`);
  res.cookies.delete("oauth_state");
  return res;
}
