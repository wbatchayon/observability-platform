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

export function client(token: string): Octokit {
  return new Octokit({ auth: token });
}

// Pose un secret GitHub Actions chiffré (sealed box libsodium) — jamais en clair.
export async function setActionsSecret(
  octo: Octokit,
  owner: string,
  repo: string,
  name: string,
  value: string,
): Promise<void> {
  const { data: key } = await octo.actions.getRepoPublicKey({ owner, repo });
  // Sealed box (curve25519) — chiffrement à destination de la clé publique du dépôt.
  const messageBytes = Buffer.from(value, "utf-8");
  const keyBytes = Buffer.from(key.key, "base64");
  const encryptedBytes = sodium.seal(messageBytes, keyBytes);
  const encrypted_value = Buffer.from(encryptedBytes).toString("base64");
  await octo.actions.createOrUpdateRepoSecret({
    owner,
    repo,
    secret_name: name,
    encrypted_value,
    key_id: key.key_id,
  });
}

// Écrit/maj un fichier de configuration d'environnement sur une branche dédiée + ouvre une PR.
export async function writeEnvConfigPR(
  octo: Octokit,
  owner: string,
  repo: string,
  environment: string,
  yamlContent: string,
): Promise<{ prUrl: string; branch: string }> {
  const base = "main";
  const branch = `gui/env-${environment}-${Date.now()}`;
  const path = `environments/${environment}/env-values.yaml`;

  const { data: ref } = await octo.git.getRef({ owner, repo, ref: `heads/${base}` });
  await octo.git.createRef({ owner, repo, ref: `refs/heads/${branch}`, sha: ref.object.sha });

  // SHA existant du fichier (s'il existe) pour la mise à jour.
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

// Déclenche un workflow via workflow_dispatch.
export async function dispatchWorkflow(
  octo: Octokit,
  owner: string,
  repo: string,
  workflowFile: string,
  ref: string,
  inputs: Record<string, string>,
): Promise<void> {
  await octo.actions.createWorkflowDispatch({
    owner,
    repo,
    workflow_id: workflowFile,
    ref,
    inputs,
  });
}

// Liste les exécutions récentes (suivi).
export async function listRuns(octo: Octokit, owner: string, repo: string) {
  const { data } = await octo.actions.listWorkflowRunsForRepo({
    owner,
    repo,
    per_page: 20,
  });
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
