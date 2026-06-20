import { Octokit } from "@octokit/rest";
import sodium from "tweetsodium";

// Dépôt cible (org/repo) configuré par variable d'environnement côté serveur.
export function targetRepo(): { owner: string; repo: string } {
  const full = process.env.GITHUB_REPOSITORY || "";
  const [owner, repo] = full.split("/");
  if (!owner || !repo) {
    throw new Error("GITHUB_REPOSITORY non configuré (format attendu: owner/repo).");
  }
  return { owner, repo };
}

// Référence Git ciblée par les dispatch (configurable ; défaut = branche par défaut).
export function deployRef(): string {
  return process.env.DEPLOY_REF || "main";
}

export function client(token: string): Octokit {
  return new Octokit({ auth: token });
}

// Contrôle d'accès applicatif : seuls les utilisateurs autorisés peuvent ouvrir une session.
// Ordre : allowlist de logins -> appartenance à une organisation -> accès en écriture au dépôt.
export async function isAuthorized(octo: Octokit, login: string): Promise<boolean> {
  const allowedLogins = (process.env.ALLOWED_GITHUB_LOGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (allowedLogins.length > 0) {
    return allowedLogins.includes(login);
  }

  const allowedOrg = process.env.ALLOWED_GITHUB_ORG;
  if (allowedOrg) {
    try {
      await octo.orgs.checkMembershipForUser({ org: allowedOrg, username: login });
      return true;
    } catch {
      return false;
    }
  }

  // Par défaut : accès en écriture (push/maintain/admin) au dépôt cible, évalué avec le jeton
  // de l'utilisateur (repos.get renvoie ses permissions ; lève si pas d'accès).
  try {
    const { owner, repo } = targetRepo();
    const { data } = await octo.repos.get({ owner, repo });
    const p = data.permissions;
    return !!(p && (p.admin || p.push || p.maintain));
  } catch {
    return false;
  }
}

function seal(value: string, publicKeyB64: string): string {
  const messageBytes = Buffer.from(value, "utf-8");
  const keyBytes = Buffer.from(publicKeyB64, "base64");
  const encryptedBytes = sodium.seal(messageBytes, keyBytes);
  return Buffer.from(encryptedBytes).toString("base64");
}

// Pose un secret scopé à un GitHub Environment (isolé par env, jamais en clair).
export async function setEnvironmentSecret(
  octo: Octokit,
  owner: string,
  repo: string,
  environment: string,
  name: string,
  value: string,
): Promise<void> {
  // S'assure que l'Environment existe.
  await octo.repos.createOrUpdateEnvironment({ owner, repo, environment_name: environment });
  const { data: key } = await octo.actions.getEnvironmentPublicKey({
    owner,
    repo,
    environment_name: environment,
  });
  await octo.actions.createOrUpdateEnvironmentSecret({
    owner,
    repo,
    environment_name: environment,
    secret_name: name,
    encrypted_value: seal(value, key.key),
    key_id: key.key_id,
  });
}

// Écrit/maj la config d'un environnement sur une branche STABLE par env + réutilise la PR ouverte.
export async function writeEnvConfigPR(
  octo: Octokit,
  owner: string,
  repo: string,
  environment: string,
  yamlContent: string,
): Promise<{ prUrl: string; branch: string }> {
  const base = "main";
  const branch = `gui/config-${environment}`;
  const path = `environments/${environment}/env-values.yaml`;

  // Crée la branche si absente (sinon réutilise l'existante).
  try {
    await octo.git.getRef({ owner, repo, ref: `heads/${branch}` });
  } catch {
    const { data: baseRef } = await octo.git.getRef({ owner, repo, ref: `heads/${base}` });
    await octo.git.createRef({ owner, repo, ref: `refs/heads/${branch}`, sha: baseRef.object.sha });
  }

  // SHA existant du fichier (pour mise à jour).
  let sha: string | undefined;
  try {
    const { data } = await octo.repos.getContent({ owner, repo, path, ref: branch });
    if (!Array.isArray(data) && "sha" in data) sha = data.sha;
  } catch {
    // fichier absent -> création
  }

  await octo.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    branch,
    message: `chore(gui): configuration de l'environnement ${environment}`,
    content: Buffer.from(yamlContent, "utf-8").toString("base64"),
    sha,
  });

  // Réutilise la PR ouverte pour cette branche, sinon en crée une.
  const { data: existing } = await octo.pulls.list({
    owner,
    repo,
    state: "open",
    head: `${owner}:${branch}`,
  });
  if (existing.length > 0) {
    return { prUrl: existing[0].html_url, branch };
  }
  const { data: pr } = await octo.pulls.create({
    owner,
    repo,
    base,
    head: branch,
    title: `chore(gui): configuration de l'environnement ${environment}`,
    body: "Configuration générée via la console de management (sans modification manuelle du code).",
  });
  return { prUrl: pr.html_url, branch };
}

// Déclenche un workflow via workflow_dispatch ; message clair si le workflow est absent de la ref.
export async function dispatchWorkflow(
  octo: Octokit,
  owner: string,
  repo: string,
  workflowFile: string,
  ref: string,
  inputs: Record<string, string>,
): Promise<void> {
  try {
    await octo.actions.createWorkflowDispatch({ owner, repo, workflow_id: workflowFile, ref, inputs });
  } catch (e) {
    const status = (e as { status?: number }).status;
    if (status === 404) {
      throw new Error(
        `Workflow "${workflowFile}" introuvable sur la ref "${ref}". ` +
          "Vérifiez qu'il est présent sur la branche par défaut (PR mergée) ou ajustez DEPLOY_REF.",
      );
    }
    throw e;
  }
}

// Liste les exécutions récentes (suivi).
export async function listRuns(octo: Octokit, owner: string, repo: string) {
  const { data } = await octo.actions.listWorkflowRunsForRepo({ owner, repo, per_page: 20 });
  return data.workflow_runs.map((r) => ({
    id: r.id,
    name: r.name || r.display_title,
    status: r.status,
    conclusion: r.conclusion,
    event: r.event,
    branch: r.head_branch,
    createdAt: r.created_at,
    url: r.html_url,
  }));
}
