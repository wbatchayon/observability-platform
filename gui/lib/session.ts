import { getIronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
  token?: string; // token GitHub de l'utilisateur (session uniquement)
  login?: string; // identifiant GitHub
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

export async function requireToken(): Promise<{ token: string; login: string }> {
  const session = await getSession();
  if (!session.token) {
    throw new Error("Non authentifié");
  }
  return { token: session.token, login: session.login || "" };
}
