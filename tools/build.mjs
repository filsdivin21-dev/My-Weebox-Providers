// Construit le dépôt publié à partir de providers/ :
//   published/<cat>/<id>/provider.js   payload résolu (includes intégrés)
//   index.json                        index lu par Weebox (racine du dépôt)
//   repository/index.json             même index, copie lisible
//   repository/index.drive.json       variante fichier unique (payload en ligne) pour Google Drive
//   repository/manifests/<id>.json    chaque manifest publié
//   repository/catalog.json           métadonnées : statut, langues, compatibilité
// Aucune dépendance externe.

import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MAX_INDEX_BYTES, MAX_PAYLOAD_BYTES, checkManifest, clip, isValidPluginId } from "./lib/rules.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PROVIDERS = path.join(ROOT, "providers");
const PUBLISHED = path.join(ROOT, "published");
const REPOSITORY = path.join(ROOT, "repository");

const CATEGORIES = ["anime", "movies", "series", "manga", "_probe"];

const failures = [];
const warnings = [];

function fail(message) {
  failures.push(message);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

/** Intègre les marqueurs `include:` du code partagé : le payload publié reste un fichier unique. */
function resolveIncludes(source, fromDir) {
  const marker = /\/\*\s*include:\s*([^*]+?)\s*\*\//g;
  return source.replace(marker, (_whole, spec) => {
    const candidates = [path.join(ROOT, spec), path.join(fromDir, spec)];
    const found = candidates.find((file) => fs.existsSync(file) && fs.statSync(file).isFile());
    if (!found) {
      fail(`include introuvable : ${spec}`);
      return "";
    }
    return resolveIncludes(fs.readFileSync(found, "utf8"), path.dirname(found));
  });
}

function listProviders() {
  const found = [];
  if (!fs.existsSync(PROVIDERS)) return found;
  for (const category of fs.readdirSync(PROVIDERS).sort()) {
    const categoryDir = path.join(PROVIDERS, category);
    if (!fs.statSync(categoryDir).isDirectory()) continue;
    if (!CATEGORIES.includes(category)) {
      warnings.push(`catégorie inconnue ignorée : providers/${category}`);
      continue;
    }
    for (const id of fs.readdirSync(categoryDir).sort()) {
      const dir = path.join(categoryDir, id);
      if (!fs.statSync(dir).isDirectory()) continue;
      const manifestPath = path.join(dir, "manifest.json");
      if (!fs.existsSync(manifestPath)) {
        fail(`providers/${category}/${id} : manifest.json manquant`);
        continue;
      }
      found.push({ category, dirName: id, dir, manifestPath });
    }
  }
  return found;
}

function buildProvider(entry) {
  let manifest;
  try {
    manifest = readJson(entry.manifestPath);
  } catch (error) {
    fail(`providers/${entry.category}/${entry.dirName} : manifest JSON invalide (${error.message})`);
    return null;
  }

  const where = `providers/${entry.category}/${entry.dirName}`;
  for (const problem of checkManifest(manifest, { where })) fail(problem);

  if (manifest.id !== entry.dirName) {
    fail(`${where} : l'id "${manifest.id}" doit être identique au nom du dossier "${entry.dirName}"`);
  }
  if (entry.category !== "_probe" && !/^(anime|movie|series|manga)-/.test(String(manifest.id))) {
    warnings.push(`${where} : id "${manifest.id}" ne suit pas <categorie>-<source>`);
  }

  const payloadUri = String(manifest.payloadURI ?? "provider.js").trim();
  const payloadName = path.basename(payloadUri);
  const sourcePath = path.join(entry.dir, payloadName);
  if (!fs.existsSync(sourcePath)) {
    fail(`${where} : code introuvable (${payloadName})`);
    return null;
  }

  let code = resolveIncludes(fs.readFileSync(sourcePath, "utf8"), entry.dir);
  if (!code.trim()) {
    fail(`${where} : code vide après résolution des includes`);
    return null;
  }
  if (Buffer.byteLength(code, "utf8") > MAX_PAYLOAD_BYTES) {
    fail(`${where} : code > 2 Mio`);
    return null;
  }
  if (/\bimport\s+[^(]|\brequire\s*\(/.test(code)) {
    fail(`${where} : le code utilise import/require — le moteur n'a pas de loader de modules`);
  }
  if (!/\bclass\s+Provider\b/.test(code)) {
    fail(`${where} : le code ne déclare pas de classe globale "Provider"`);
  }

  const publishedRel = `published/${entry.category}/${manifest.id}/${payloadName}`;
  const publishedPath = path.join(ROOT, publishedRel);
  fs.mkdirSync(path.dirname(publishedPath), { recursive: true });
  fs.writeFileSync(publishedPath, code, "utf8");

  const entryManifest = {
    ...manifest,
    name: clip(manifest.name),
    author: clip(manifest.author),
    description: clip(manifest.description),
    payload: undefined,
    payloadURI: publishedRel,
  };
  delete entryManifest.payload;

  const meta = fs.existsSync(path.join(entry.dir, "meta.json")) ? readJson(path.join(entry.dir, "meta.json")) : {};

  return {
    category: entry.category,
    dirName: entry.dirName,
    entry: entryManifest,
    code,
    meta: {
      id: manifest.id,
      category: meta.category ?? entry.category,
      name: clip(manifest.name),
      version: manifest.version,
      status: meta.status ?? "EN DEVELOPPEMENT",
      languages: meta.languages ?? [],
      compatible_weebox: meta.compatible_weebox ?? "non testé",
      audited_source: meta.audited_source ?? null,
      notes: meta.notes ?? "",
      payload_sha256: createHash("sha256").update(code).digest("hex"),
      payload_bytes: Buffer.byteLength(code, "utf8"),
    },
  };
}

function writeJson(file, value, { compact = false } = {}) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, compact ? JSON.stringify(value) : JSON.stringify(value, null, 2) + "\n", "utf8");
}

function main() {
  if (fs.existsSync(PUBLISHED)) fs.rmSync(PUBLISHED, { recursive: true, force: true });
  fs.mkdirSync(PUBLISHED, { recursive: true });
  fs.mkdirSync(path.join(REPOSITORY, "manifests"), { recursive: true });
  for (const file of fs.readdirSync(path.join(REPOSITORY, "manifests"))) {
    fs.rmSync(path.join(REPOSITORY, "manifests", file), { force: true });
  }

  const built = listProviders().map(buildProvider).filter(Boolean).sort((a, b) => a.entry.id.localeCompare(b.entry.id));

  const seen = new Set();
  for (const provider of built) {
    if (seen.has(provider.entry.id)) fail(`id en double : ${provider.entry.id}`);
    seen.add(provider.entry.id);
  }
  if (built.length > 200) fail(`${built.length} providers : le moteur n'en lit que 200`);

  const index = { name: "My Weebox Providers", plugins: built.map((provider) => provider.entry) };
  const indexText = JSON.stringify(index, null, 2) + "\n";
  if (Buffer.byteLength(indexText, "utf8") > MAX_INDEX_BYTES) fail("index.json dépasse 2 Mio");

  writeJson(path.join(ROOT, "index.json"), index);
  writeJson(path.join(REPOSITORY, "index.json"), index);

  // Variante « fichier unique » : le code est en ligne dans chaque entrée, donc un seul fichier
  // partagé sur Google Drive suffit comme dépôt.
  const driveIndex = built.map((provider) => {
    const entry = { ...provider.entry, payload: provider.code };
    delete entry.payloadURI;
    return entry;
  });
  writeJson(path.join(REPOSITORY, "index.drive.json"), driveIndex);

  for (const provider of built) {
    writeJson(path.join(REPOSITORY, "manifests", `${provider.entry.id}.json`), provider.entry);
  }

  writeJson(path.join(REPOSITORY, "catalog.json"), {
    repository: "My Weebox Providers",
    generated_by: "tools/build.mjs",
    weebox_extension_type: "onlinestream-provider",
    language_priority: ["fr-VF", "fr-VOSTFR", "fr", "en", "multi", "unknown"],
    statuses: ["STABLE", "DÉGRADÉ", "EN DÉVELOPPEMENT", "CASSÉ", "RETIRÉ"],
    count: built.length,
    providers: built.map((provider) => provider.meta),
  });

  for (const warning of warnings) console.warn(`AVERTISSEMENT  ${warning}`);
  if (failures.length) {
    for (const failure of failures) console.error(`ÉCHEC          ${failure}`);
    console.error(`\nBuild arrêté : ${failures.length} problème(s). Aucun index publié.`);
    process.exit(1);
  }
  console.log(`Build OK — ${built.length} extension(s) publiée(s) : ${built.map((p) => p.entry.id).join(", ") || "aucune"}`);
  console.log(`Index : index.json (${Buffer.byteLength(indexText, "utf8")} octets)`);
}

main();
