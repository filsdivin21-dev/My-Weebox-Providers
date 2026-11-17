// Calcule l'URL HTTPS brute exacte de l'index à donner à Weebox.
//
//   node tools/raw-url.mjs
//   node tools/raw-url.mjs --owner moncompte --repo mon-depot
//   node tools/raw-url.mjs --owner moncompte --repo mon-depot --branch main --subdir My-Weebox-Providers
//
// Sans argument, l'origine est lue dans le remote Git du projet (`git remote get-url origin`).
// L'URL produite est celle que le moteur Weebox télécharge : raw.githubusercontent.com.

import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function arg(name, fallback = "") {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? fallback : String(process.argv[index + 1] ?? "").trim();
}

function git(...args) {
  try {
    return execFileSync("git", args, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
}

/** « git@github.com:owner/repo.git » ou « https://github.com/owner/repo » → { owner, repo }. */
function parseRemote(remote) {
  const cleaned = remote.trim().replace(/\.git$/, "");
  const match =
    cleaned.match(/^git@[^:]+:(?<owner>[^/]+)\/(?<repo>.+)$/) ??
    cleaned.match(/^https?:\/\/[^/]+\/(?<owner>[^/]+)\/(?<repo>.+)$/);
  if (!match?.groups) return null;
  return { owner: match.groups.owner, repo: match.groups.repo };
}

const remote = arg("remote") || git("remote", "get-url", "origin");
const parsed = parseRemote(remote);
const owner = arg("owner") || parsed?.owner || "";
const repo = arg("repo") || parsed?.repo || "";
const branch =
  arg("branch") ||
  git("symbolic-ref", "--short", "refs/remotes/origin/HEAD").replace(/^origin\//, "") ||
  "main";
const subdir = arg("subdir").replace(/^\/+|\/+$/g, "");

if (!owner || !repo) {
  console.error("ÉCHEC  Dépôt inconnu : aucun remote GitHub utilisable et --owner/--repo absents.");
  console.error("        node tools/raw-url.mjs --owner <compte> --repo <dépôt> [--branch main] [--subdir dossier]");
  process.exit(1);
}

const indexPath = subdir ? `${subdir}/index.json` : "index.json";
const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${indexPath}`;

console.log(`Dépôt      : ${owner}/${repo} (branche ${branch})`);
console.log(`Index      : ${indexPath}`);
console.log("");
console.log("URL brute de l'index (ce que télécharge Weebox) :");
console.log(`  ${rawUrl}`);
console.log("");
console.log("Lien à ajouter dans Weebox › Settings › Plugins :");
if (subdir) {
  console.log(`  ${rawUrl}`);
  console.log("  (index dans un sous-dossier : donner l'URL brute du fichier, pas l'URL du dépôt)");
} else {
  console.log(`  https://github.com/${owner}/${repo}`);
  console.log(`  (équivalent : ${rawUrl})`);
}
