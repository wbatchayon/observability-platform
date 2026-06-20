import { getIronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export type ProviderId = "github" | "google" | "oidc" | "token";

export interface SessionUser {
  login: string; // identifiant affiché (login GitHub ou email)
  email?: string;
  provider: ProviderId;
}

export interface SessionData {
  user?: SessionUser;
  // Jeton GitHub de l'utilisateur (présent uniquement pour les connexions GitHub).
  // Pour Google/SSO, les actions GitHub utilisent GITHUB_SERVICE_TOKEN côté serveur.
  ghToken?: string;
}

const password = process.env.SESSION_SECRET || "";

export const sessionOptions: SessionOptions = {
  password,
  cookieName: "obs_gui_session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  },
};

export async function getSession() {
  if (password.length < 32) {
    throw new Error("SESSION_SECRET manquant ou trop court (>= 32 caractères requis).");
  }
  return getIronSession<SessionData>(cookies(), sessionOptions);
}

export async function requireUser(): Promise<SessionUser> {
  const session = await getSession();
  if (!session.user) {
    throw new Error("Non authentifié");
  }
  return session.user;
}
