// Règles du moteur d'extensions Weebox, reproduites à partir de son code source.
// Toute modification ici doit être justifiée par le code du moteur, jamais par supposition.

export const PLUGIN_TYPE = "onlinestream-provider";
export const MAX_INDEX_BYTES = 2 * 1024 * 1024;
export const MAX_MANIFEST_BYTES = 2 * 1024 * 1024;
export const MAX_PAYLOAD_BYTES = 2 * 1024 * 1024;
export const MAX_PLUGINS_PER_REPO = 200;
export const MAX_ID_CHARS = 64;
export const MAX_TEXT_CHARS = 600;

const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

export function isValidPluginId(id) {
  return typeof id === "string" && ID_PATTERN.test(id);
}

export function clip(text) {
  return [...String(text ?? "").trim()].slice(0, MAX_TEXT_CHARS).join("");
}

/** Valide un manifest et renvoie la liste des problèmes (vide = conforme). */
export function checkManifest(manifest, { where = "manifest" } = {}) {
  const problems = [];
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    return [`${where}: ce n'est pas un objet JSON`];
  }
  if (manifest.type !== PLUGIN_TYPE) {
    problems.push(`${where}: type = ${JSON.stringify(manifest.type)} (attendu "${PLUGIN_TYPE}")`);
  }
  if (!isValidPluginId(manifest.id)) {
    problems.push(`${where}: id invalide (1-64 caractères A-Z a-z 0-9 - _) : ${JSON.stringify(manifest.id)}`);
  }
  if (typeof manifest.version !== "string" || !manifest.version.trim()) {
    problems.push(`${where}: version absente ou vide`);
  }
  const language = String(manifest.language ?? "").toLowerCase();
  if (!["javascript", "typescript", ""].includes(language)) {
    problems.push(`${where}: language = ${JSON.stringify(manifest.language)} non supporté (javascript|typescript)`);
  }
  const inline = typeof manifest.payload === "string" ? manifest.payload.trim() : "";
  const uri = typeof manifest.payloadURI === "string" ? manifest.payloadURI.trim() : "";
  if (!inline && !uri) {
    problems.push(`${where}: ni payload ni payloadURI`);
  }
  if (inline && Buffer.byteLength(inline, "utf8") > MAX_PAYLOAD_BYTES) {
    problems.push(`${where}: payload > 2 Mio`);
  }
  for (const field of ["name", "author", "description"]) {
    if (manifest[field] !== undefined && typeof manifest[field] !== "string") {
      problems.push(`${where}: ${field} doit être une chaîne`);
    }
  }
  if (typeof manifest.lang === "string" && manifest.lang.trim() && !/^[a-z]{2,3}$|^multi$/.test(manifest.lang.trim())) {
    problems.push(`${where}: lang = ${JSON.stringify(manifest.lang)} (ISO 639-1 ou "multi")`);
  }
  for (const key of ["sub", "dub"]) {
    const list = manifest.languages?.[key];
    if (list === undefined) continue;
    if (!Array.isArray(list) || list.some((code) => typeof code !== "string" || !/^[a-z]{2,3}$/.test(code))) {
      problems.push(`${where}: languages.${key} doit être une liste de codes ISO 639-1`);
    }
  }
  if (manifest.paused !== undefined && typeof manifest.paused !== "string") {
    problems.push(`${where}: paused doit être une chaîne`);
  }
  return problems;
}
