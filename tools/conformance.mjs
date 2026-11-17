// Harnais de conformité : exécute le code publié comme le ferait le moteur de Weebox
// (moteur JS isolé, classe globale `Provider`) et vérifie le contrat des quatre méthodes.
//
// Ce que ce harnais prouve : le code se charge, expose `Provider`, et renvoie des structures
// conformes. Ce qu'il ne prouve pas : le comportement de QuickJS dans l'application, ni le
// rendu réel des flux. La compatibilité définitive exige le test sur téléphone (phase B).

import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CALL_TIMEOUT_MS = 5000;

const failures = [];
const results = [];

function fail(scope, message) {
  failures.push(`${scope} : ${message}`);
}

function makeSandbox(id) {
  const stats = { fetches: 0, logs: [] };
  const notAvailable = (what) => () => {
    throw new Error(`${what} non fourni par le harnais`);
  };
  const sandbox = {
    console: {
      log: (...args) => stats.logs.push(["log", args.join(" ")]),
      warn: (...args) => stats.logs.push(["warn", args.join(" ")]),
      error: (...args) => stats.logs.push(["error", args.join(" ")]),
      info: (...args) => stats.logs.push(["info", args.join(" ")]),
      debug: (...args) => stats.logs.push(["debug", args.join(" ")]),
    },
    // Aucune sortie réseau par défaut : un provider qui a besoin du réseau est signalé.
    fetch: async () => {
      stats.fetches += 1;
      throw new Error("réseau désactivé dans le harnais");
    },
    setTimeout: (fn) => setTimeout(fn, 0),
    clearTimeout,
    setInterval: notAvailable("setInterval"),
    clearInterval: () => {},
    queueMicrotask,
    atob: (value) => Buffer.from(String(value), "base64").toString("latin1"),
    btoa: (value) => Buffer.from(String(value), "latin1").toString("base64"),
    URL,
    URLSearchParams,
    TextEncoder,
    TextDecoder,
    Buffer,
    AbortController,
    LoadDoc: notAvailable("LoadDoc"),
    CryptoJS: {},
    $store: { get: () => undefined, set: () => {} },
  };
  const context = vm.createContext(sandbox);
  return { context, stats, sandbox, id };
}

function withTimeout(promise, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} : délai de ${CALL_TIMEOUT_MS} ms dépassé`)), CALL_TIMEOUT_MS),
    ),
  ]);
}

function isString(value) {
  return typeof value === "string";
}

function checkSearchResults(scope, value) {
  if (!Array.isArray(value)) return fail(scope, "search n'a pas renvoyé de tableau");
  for (const [i, item] of value.entries()) {
    if (!item || typeof item !== "object") return fail(scope, `search[${i}] n'est pas un objet`);
    if (!isString(item.id) || !item.id.trim()) fail(scope, `search[${i}].id manquant`);
    if (!isString(item.title) || !item.title.trim()) fail(scope, `search[${i}].title manquant`);
    if (!["sub", "dub", "both"].includes(item.subOrDub)) {
      fail(scope, `search[${i}].subOrDub = ${JSON.stringify(item.subOrDub)} (sub|dub|both attendu)`);
    }
  }
}

function checkEpisodes(scope, value) {
  if (!Array.isArray(value)) return fail(scope, "findEpisodes n'a pas renvoyé de tableau");
  for (const [i, item] of value.entries()) {
    if (!item || typeof item !== "object") return fail(scope, `findEpisodes[${i}] n'est pas un objet`);
    if (!isString(item.id) || !item.id.trim()) fail(scope, `findEpisodes[${i}].id manquant`);
    if (typeof item.number !== "number" || !Number.isFinite(item.number)) {
      fail(scope, `findEpisodes[${i}].number doit être un nombre`);
    }
  }
}

function checkServer(scope, value) {
  if (!value || typeof value !== "object") return fail(scope, "findEpisodeServer n'a pas renvoyé d'objet");
  if (!isString(value.server)) fail(scope, "findEpisodeServer.server doit être une chaîne");
  if (!value.headers || typeof value.headers !== "object") fail(scope, "findEpisodeServer.headers doit être un objet");
  if (!Array.isArray(value.videoSources)) return fail(scope, "findEpisodeServer.videoSources doit être un tableau");
  for (const [i, source] of value.videoSources.entries()) {
    if (!isString(source?.url) || !source.url.trim()) fail(scope, `videoSources[${i}].url manquant`);
    if (!["mp4", "m3u8", "unknown"].includes(source?.type)) {
      fail(scope, `videoSources[${i}].type = ${JSON.stringify(source?.type)} (mp4|m3u8|unknown attendu)`);
    }
    if (!isString(source?.quality) || !source.quality.trim()) fail(scope, `videoSources[${i}].quality manquant`);
    if (!Array.isArray(source?.subtitles)) {
      fail(scope, `videoSources[${i}].subtitles doit être un tableau`);
    } else {
      for (const [j, sub] of source.subtitles.entries()) {
        for (const key of ["id", "url", "language"]) {
          if (!isString(sub?.[key]) || !sub[key].trim()) fail(scope, `subtitles[${j}].${key} manquant`);
        }
        if (typeof sub?.isDefault !== "boolean") fail(scope, `subtitles[${j}].isDefault doit être un booléen`);
      }
    }
  }
}

async function checkProvider(manifest, payloadFile) {
  const scope = manifest.id;
  if (!fs.existsSync(payloadFile)) {
    fail(scope, `payload absent : ${path.relative(ROOT, payloadFile)} (lancer "npm run build")`);
    return;
  }
  const code = fs.readFileSync(payloadFile, "utf8");
  const { context, stats } = makeSandbox(manifest.id);

  try {
    vm.runInContext(code, context, { filename: `${manifest.id}.js`, timeout: CALL_TIMEOUT_MS });
  } catch (error) {
    fail(scope, `le code ne se charge pas : ${error.message}`);
    return;
  }

  if (vm.runInContext("typeof Provider", context) !== "function") {
    fail(scope, "aucune classe globale Provider après chargement");
    return;
  }

  const provider = vm.runInContext("new Provider()", context);
  const settings = provider.getSettings();
  if (!settings || typeof settings !== "object") {
    fail(scope, "getSettings ne renvoie pas d'objet");
  } else {
    if (!Array.isArray(settings.episodeServers) || settings.episodeServers.some((name) => !isString(name) || !name.trim())) {
      fail(scope, "getSettings.episodeServers doit être une liste de noms non vides");
    }
    if (typeof settings.supportsDub !== "boolean") fail(scope, "getSettings.supportsDub doit être un booléen");
  }
  const servers = Array.isArray(settings?.episodeServers) && settings.episodeServers.length
    ? settings.episodeServers
    : ["default"];

  let searchResults = [];
  try {
    searchResults = await withTimeout(
      provider.search({
        media: { id: 1, synonyms: [], isAdult: false, romajiTitle: "Probe", englishTitle: "Probe" },
        query: "probe",
        dub: false,
      }),
      "search",
    );
    checkSearchResults(scope, searchResults);
  } catch (error) {
    fail(scope, `search a échoué : ${error.message}`);
  }

  const candidates = Array.isArray(searchResults) ? searchResults : [];
  for (const candidate of candidates.slice(0, 3)) {
    let episodes = [];
    try {
      episodes = await withTimeout(provider.findEpisodes(candidate.id), "findEpisodes");
      checkEpisodes(scope, episodes);
    } catch (error) {
      fail(scope, `findEpisodes(${JSON.stringify(candidate.id)}) a échoué : ${error.message}`);
      continue;
    }
    const episode = Array.isArray(episodes) ? episodes[0] : undefined;
    if (!episode) continue;
    for (const server of servers.slice(0, 2)) {
      try {
        const result = await withTimeout(provider.findEpisodeServer(episode, server), "findEpisodeServer");
        checkServer(scope, result);
      } catch (error) {
        fail(scope, `findEpisodeServer(${server}) a échoué : ${error.message}`);
      }
    }
  }

  const isProbe = path.basename(path.dirname(payloadFile)) === "hello-weebox";
  if (isProbe && stats.fetches > 0) fail(scope, `la sonde ne doit faire aucun appel réseau (${stats.fetches})`);
  if (!isProbe && stats.fetches === 0) {
    results.push(`${scope} : aucun appel réseau observé pendant le test (normal hors ligne)`);
  }

  results.push(`${scope} : chargé, ${candidates.length} résultat(s) de recherche, contrat vérifié`);
}

function main() {
  const indexFile = path.join(ROOT, "index.json");
  if (!fs.existsSync(indexFile)) {
    console.error('ÉCHEC  index.json absent — lancer "npm run build"');
    process.exit(1);
  }
  const index = JSON.parse(fs.readFileSync(indexFile, "utf8"));
  const entries = Array.isArray(index) ? index : index.plugins;
  if (!Array.isArray(entries)) {
    console.error("ÉCHEC  index.json n'a pas la forme attendue");
    process.exit(1);
  }

  const tasks = entries
    .filter((entry) => entry?.type === "onlinestream-provider")
    .map((entry) => checkProvider(entry, path.resolve(ROOT, String(entry.payloadURI ?? ""))));

  Promise.all(tasks).then(() => {
    for (const line of results) console.log(`  · ${line}`);
    if (failures.length) {
      for (const failure of failures) console.error(`ÉCHEC  ${failure}`);
      console.error(`\nConformité : ${failures.length} problème(s) sur ${tasks.length} extension(s).`);
      process.exit(1);
    }
    console.log(`Conformité OK — ${tasks.length} extension(s) chargée(s) et contrat vérifié.`);
  });
}

main();
