// Vérifie que ce qui serait publié respecte les règles du moteur Weebox :
// index (2 Mio, 200 max), manifests, ids, résolution des payloadURI, taille du code,
// absence de modules et présence de la classe Provider.
// Lit les fichiers générés (published/, index.json) : lancer `npm run build` avant.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  MAX_INDEX_BYTES,
  MAX_PAYLOAD_BYTES,
  MAX_PLUGINS_PER_REPO,
  PLUGIN_TYPE,
  checkManifest,
  isValidPluginId,
} from "./lib/rules.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const problems = [];
const checked = [];

function add(scope, message) {
  problems.push(`${scope} : ${message}`);
}

function readJson(file, scope) {
  if (!fs.existsSync(file)) {
    add(scope, `fichier absent (${path.relative(ROOT, file)}) — lancer "npm run build"`);
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    add(scope, `JSON invalide (${error.message})`);
    return null;
  }
}

/** Équivalent de parse_index du moteur : tableau, {name, plugins[]} ou manifest unique. */
function parseIndex(data, scope) {
  if (Array.isArray(data)) return { entries: data, name: null };
  if (data && typeof data === "object" && !("type" in data) && Array.isArray(data.plugins)) {
    return { entries: data.plugins, name: data.name ?? null };
  }
  if (data && typeof data === "object" && "type" in data) return { entries: [data], name: null };
  add(scope, "n'est pas un index lisible (tableau de manifests, ou {name, plugins[]})");
  return { entries: [], name: null };
}

function checkPayload(entry, scope) {
  const uri = String(entry.payloadURI ?? "").trim();
  if (!uri) return;
  if (/^[a-z]+:\/\//i.test(uri)) {
    add(scope, `payloadURI absolu (${uri}) : une URL distante n'est pas vérifiable hors ligne`);
    return;
  }
  const file = path.resolve(ROOT, uri);
  if (!file.startsWith(ROOT)) {
    add(scope, `payloadURI sort du dépôt (${uri})`);
    return;
  }
  if (!fs.existsSync(file)) {
    add(scope, `payloadURI ne résout vers aucun fichier (${uri})`);
    return;
  }
  const code = fs.readFileSync(file, "utf8");
  if (!code.trim()) add(scope, `code vide (${uri})`);
  if (Buffer.byteLength(code, "utf8") > MAX_PAYLOAD_BYTES) add(scope, `code > 2 Mio (${uri})`);
  if (/\bimport\s+[^(]|\brequire\s*\(/.test(code)) add(scope, `code avec import/require (${uri})`);
  if (!/\bclass\s+Provider\b/.test(code)) add(scope, `aucune classe Provider (${uri})`);
  checked.push(uri);
}

function main() {
  const indexFile = path.join(ROOT, "index.json");
  const raw = fs.existsSync(indexFile) ? fs.readFileSync(indexFile, "utf8") : null;
  if (raw === null) {
    add("index.json", "absent — lancer \"npm run build\"");
  } else {
    if (Buffer.byteLength(raw, "utf8") > MAX_INDEX_BYTES) add("index.json", "dépasse 2 Mio");
    const { entries } = parseIndex(JSON.parse(raw), "index.json");
    if (entries.length > MAX_PLUGINS_PER_REPO) add("index.json", `plus de ${MAX_PLUGINS_PER_REPO} plugins`);
    const ids = new Set();
    for (const [i, entry] of entries.entries()) {
      const scope = `index.json[${i}]`;
      for (const problem of checkManifest(entry, { where: scope })) add(scope, problem);
      if (!entry || typeof entry !== "object") continue;
      if (entry.type !== PLUGIN_TYPE) {
        add(scope, `type ignoré par le moteur (${JSON.stringify(entry.type)})`);
        continue;
      }
      if (!isValidPluginId(entry.id)) continue;
      if (ids.has(entry.id)) add(scope, `id en double (${entry.id})`);
      ids.add(entry.id);
      checkPayload(entry, scope);

      const manifestFile = path.join(ROOT, "repository", "manifests", `${entry.id}.json`);
      const manifest = readJson(manifestFile, `repository/manifests/${entry.id}.json`);
      if (manifest && manifest.id !== entry.id) add(scope, "le manifest copié a un autre id");
    }
  }

  // Variante Google Drive : le code doit être en ligne, pas en payloadURI.
  const driveFile = path.join(ROOT, "repository", "index.drive.json");
  const drive = readJson(driveFile, "repository/index.drive.json");
  if (drive) {
    const { entries } = parseIndex(drive, "repository/index.drive.json");
    for (const [i, entry] of entries.entries()) {
      const scope = `index.drive.json[${i}]`;
      for (const problem of checkManifest(entry, { where: scope })) add(scope, problem);
      if (!String(entry.payload ?? "").trim()) add(scope, "payload en ligne absent (fichier unique requis)");
      if (String(entry.payloadURI ?? "").trim()) add(scope, "payloadURI présent dans la variante fichier unique");
    }
    if (Buffer.byteLength(JSON.stringify(drive), "utf8") > MAX_INDEX_BYTES) add(scope, "dépasse 2 Mio");
  }

  if (problems.length) {
    for (const problem of problems) console.error(`ÉCHEC  ${problem}`);
    console.error(`\nValidation : ${problems.length} problème(s), ${checked.length} payload(s) inspecté(s).`);
    process.exit(1);
  }
  console.log(`Validation OK — index conforme, ${checked.length} payload(s) inspecté(s) : ${checked.join(", ")}`);
}

main();
