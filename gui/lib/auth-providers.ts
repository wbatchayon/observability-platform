import { client, isAuthorized } from "@/lib/github";
import type { ProviderId, SessionUser } from "@/lib/session";

export interface Endpoints {
  authorize: string;
  token: string;
  userinfo?: string;
}

export interface IdentityResult {
  user: SessionUser;
  ghToken?: string; // jeton GitHub à stocker (connexion GitHub uniquement)
}

export interface Provider {
  id: ProviderId;
  label: string;
  scope: string;
  clientId: string;
  clientSecret: string;
  enabled: boolean;
  endpoints: () => Promise<Endpoints>;
  // Récupère l'identité à partir du jeton d'accès et applique l'autorisation.
  identify: (accessToken: string) => Promise<IdentityResult | null>;
}

// Autorisation des connexions par fournisseur d'identité (Google/SSO) : email autorisé / domaine.
function emailAllowed(email: string): boolean {
  const e = email.toLowerCase();
  const list = (process.env.ALLOWED_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const domain = (process.env.ALLOWED_EMAIL_DOMAIN || "").toLowerCase().replace(/^@/, "");
  if (list.includes(e)) return true;
  if (domain && e.endsWith("@" + domain)) return true;
  return false; // par défaut (aucune allowlist) : refus
}

async function fetchUserinfo(userinfo: string, accessToken: string): Promise<{ email?: string; name?: string }> {
  const r = await fetch(userinfo, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!r.ok) throw new Error("userinfo");
  return r.json();
}

let oidcCache: Endpoints | null = null;
async function oidcDiscovery(): Promise<Endpoints> {
  if (oidcCache) return oidcCache;
  const issuer = (process.env.OIDC_ISSUER || "").replace(/\/+$/, "");
  const r = await fetch(`${issuer}/.well-known/openid-configuration`);
  if (!r.ok) throw new Error("OIDC discovery échouée");
  const d = await r.json();
  oidcCache = {
    authorize: d.authorization_endpoint,
    token: d.token_endpoint,
    userinfo: d.userinfo_endpoint,
  };
  return oidcCache;
}

export function providers(): Provider[] {
  return [
    {
      id: "github",
      label: "GitHub",
      scope: "repo workflow",
      clientId: process.env.GITHUB_OAUTH_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_OAUTH_CLIENT_SECRET || "",
      enabled: !!(process.env.GITHUB_OAUTH_CLIENT_ID && process.env.GITHUB_OAUTH_CLIENT_SECRET),
      endpoints: async () => ({
        authorize: "https://github.com/login/oauth/authorize",
        token: "https://github.com/login/oauth/access_token",
      }),
      identify: async (accessToken) => {
        const octo = client(accessToken);
        const { data } = await octo.users.getAuthenticated();
        if (!(await isAuthorized(octo, data.login))) return null;
        return { user: { login: data.login, email: data.email || undefined, provider: "github" }, ghToken: accessToken };
      },
    },
    {
      id: "google",
      label: "Google",
      scope: "openid email profile",
      clientId: process.env.GOOGLE_OAUTH_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET || "",
      enabled: !!(process.env.GOOGLE_OAUTH_CLIENT_ID && process.env.GOOGLE_OAUTH_CLIENT_SECRET),
      endpoints: async () => ({
        authorize: "https://accounts.google.com/o/oauth2/v2/auth",
        token: "https://oauth2.googleapis.com/token",
        userinfo: "https://openidconnect.googleapis.com/v1/userinfo",
      }),
      identify: async (accessToken) => {
        const ep = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
          headers: { Authorization: `Bearer ${accessToken}` },
        }).then((r) => r.json());
        const email: string | undefined = ep.email;
        // Rejeter les emails non vérifiés (Google renvoie email_verified).
        if (ep.email_verified !== true) return null;
        if (!email || !emailAllowed(email)) return null;
        return { user: { login: email, email, provider: "google" } };
      },
    },
    {
      id: "oidc",
      label: process.env.OIDC_LABEL || "SSO",
      scope: "openid email profile",
      clientId: process.env.OIDC_CLIENT_ID || "",
      clientSecret: process.env.OIDC_CLIENT_SECRET || "",
      enabled: !!(process.env.OIDC_ISSUER && process.env.OIDC_CLIENT_ID && process.env.OIDC_CLIENT_SECRET),
      endpoints: oidcDiscovery,
      identify: async (accessToken) => {
        const ep = await oidcDiscovery();
        if (!ep.userinfo) return null;
        const info = await fetchUserinfo(ep.userinfo, accessToken);
        const email = info.email;
        if (!email || !emailAllowed(email)) return null;
        return { user: { login: email, email, provider: "oidc" } };
      },
    },
  ];
}

export function getProvider(id: string): Provider | undefined {
  return providers().find((p) => p.id === id);
}

export function enabledProviders(): { id: ProviderId; label: string }[] {
  return providers()
    .filter((p) => p.enabled)
    .map((p) => ({ id: p.id, label: p.label }));
}
