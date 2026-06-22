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

// Client GitHub utilisé pour AGIR sur le dépôt :
// - connexion GitHub : jeton de l'utilisateur (ghToken) ;
// - connexion Google/SSO : jeton de service côté serveur (GITHUB_SERVICE_TOKEN).
export function githubClient(ghToken?: string): Octokit {
  const token = ghToken || process.env.GITHUB_SERVICE_TOKEN;
  if (!token) {
    throw new Error(
      "Aucune identité GitHub disponible : définissez GITHUB_SERVICE_TOKEN pour les connexions Google/SSO.",
    );
  }
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
    updatedAt: r.updated_at,
    runNumber: r.run_number,
    url: r.html_url,
  }));
}

// Détail d'une exécution : jobs et étapes (suivi quasi-temps réel des pipelines).
export async function getRunWithJobs(octo: Octokit, owner: string, repo: string, runId: number) {
  const { data: run } = await octo.actions.getWorkflowRun({ owner, repo, run_id: runId });
  const { data: jobsData } = await octo.actions.listJobsForWorkflowRun({
    owner,
    repo,
    run_id: runId,
    per_page: 50,
  });
  return {
    id: run.id,
    name: run.name || run.display_title,
    status: run.status,
    conclusion: run.conclusion,
    event: run.event,
    branch: run.head_branch,
    createdAt: run.created_at,
    updatedAt: run.updated_at,
    runNumber: run.run_number,
    url: run.html_url,
    jobs: jobsData.jobs.map((j) => ({
      id: j.id,
      name: j.name,
      status: j.status,
      conclusion: j.conclusion,
      startedAt: j.started_at,
      completedAt: j.completed_at,
      url: j.html_url,
      steps: (j.steps || []).map((s) => ({
        name: s.name,
        status: s.status,
        conclusion: s.conclusion,
        number: s.number,
      })),
    })),
  };
}

// Lit la config (ConfigMap env-values) d'un environnement depuis la branche par défaut,
// puis tente la branche de config GUI (plus récente) pour refléter les changements en attente.
export async function readEnvConfig(
  octo: Octokit,
  owner: string,
  repo: string,
  environment: string,
): Promise<Record<string, string> | null> {
  const path = `environments/${environment}/env-values.yaml`;
  const refs = [`gui/config-${environment}`, "main"];
  for (const ref of refs) {
    try {
      const { data } = await octo.repos.getContent({ owner, repo, path, ref });
      if (Array.isArray(data) || !("content" in data)) continue;
      const text = Buffer.from(data.content, "base64").toString("utf-8");
      return parseConfigMapData(text);
    } catch {
      // ref/fichier absent -> on tente la suivante
    }
  }
  return null;
}

// Parse minimaliste de la section data: d'un ConfigMap (clé: "valeur").
function parseConfigMapData(yaml: string): Record<string, string> {
  const out: Record<string, string> = {};
  let inData = false;
  for (const raw of yaml.split("\n")) {
    if (/^data:\s*$/.test(raw)) {
      inData = true;
      continue;
    }
    if (inData) {
      if (/^\S/.test(raw)) break; // fin de l'indentation data:
      const m = raw.match(/^\s+([A-Za-z0-9_]+):\s*(.*)$/);
      if (m) {
        let val = m[2].trim();
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1);
        }
        out[m[1]] = val;
      }
    }
  }
  return out;
}

// --- Patch management : lecture/écriture des versions de charts (env-values) ---

// Lit les versions de charts (*_CHART_VERSION) d'un environnement.
export async function readChartVersions(
  octo: Octokit,
  owner: string,
  repo: string,
  environment: string,
): Promise<Record<string, string>> {
  const cfg = (await readEnvConfig(octo, owner, repo, environment)) || {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(cfg)) {
    if (k.endsWith("_CHART_VERSION")) out[k] = v;
  }
  return out;
}

// Met à jour UNIQUEMENT les lignes de version dans env-values.yaml (préserve le reste),
// puis ouvre/réutilise une PR dédiée. Le déploiement se fait après merge (GitOps) ou via dispatch.
export async function writeChartVersionsPR(
  octo: Octokit,
  owner: string,
  repo: string,
  environment: string,
  versions: Record<string, string>,
): Promise<{ prUrl: string; branch: string }> {
  const base = "main";
  const branch = `gui/versions-${environment}`;
  const path = `environments/${environment}/env-values.yaml`;

  // Branche dédiée (créée depuis main si absente).
  try {
    await octo.git.getRef({ owner, repo, ref: `heads/${branch}` });
  } catch {
    const { data: baseRef } = await octo.git.getRef({ owner, repo, ref: `heads/${base}` });
    await octo.git.createRef({ owner, repo, ref: `refs/heads/${branch}`, sha: baseRef.object.sha });
  }

  // Contenu courant (branche dédiée sinon main).
  let sha: string | undefined;
  let text = "";
  for (const ref of [branch, base]) {
    try {
      const { data } = await octo.repos.getContent({ owner, repo, path, ref });
      if (!Array.isArray(data) && "content" in data) {
        text = Buffer.from(data.content, "base64").toString("utf-8");
        if (ref === branch && "sha" in data) sha = data.sha;
        if (text) break;
      }
    } catch {
      // ref absente -> suivante
    }
  }
  if (!text) throw new Error(`env-values.yaml introuvable pour l'environnement ${environment}`);

  // Remplacement ciblé ligne à ligne (KEY: "..." conservant l'indentation).
  for (const [k, v] of Object.entries(versions)) {
    const re = new RegExp(`(^\\s*${k}:\\s*).*$`, "m");
    if (re.test(text)) {
      text = text.replace(re, `$1"${v}"`);
    } else {
      // clé absente -> on l'ajoute en fin de section data:
      text = text.replace(/\n*$/, `\n  ${k}: "${v}"\n`);
    }
  }

  const keys = Object.keys(versions).join(", ");
  await octo.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    branch,
    message: `chore(gui): montée de version (${environment}) — ${keys}`,
    content: Buffer.from(text, "utf-8").toString("base64"),
    sha,
  });

  const { data: existing } = await octo.pulls.list({
    owner,
    repo,
    state: "open",
    head: `${owner}:${branch}`,
  });
  if (existing.length > 0) return { prUrl: existing[0].html_url, branch };
  const { data: pr } = await octo.pulls.create({
    owner,
    repo,
    base,
    head: branch,
    title: `chore(gui): montée de version des composants (${environment})`,
    body: "Patch management généré via la console. Merge = déploiement GitOps de la nouvelle version.",
  });
  return { prUrl: pr.html_url, branch };
}
