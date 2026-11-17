// Aides de langue — intégrées au build dans le provider (aucun import à l'exécution).
// Classification interne : "fr-VF", "fr-VOSTFR", "fr", "en", "multi", "unknown".

const KNOWN = new Set(["fr-VF", "fr-VOSTFR", "fr", "en", "multi", "unknown"]);

/** Ordre de priorité d'affichage demandé : VF, puis VOSTFR, puis français, puis le reste. */
export const PRIORITY = ["fr-VF", "fr-VOSTFR", "fr", "en", "multi", "unknown"];

export function isKnownLanguage(value) {
  return KNOWN.has(value);
}

export function languageRank(value) {
  const rank = PRIORITY.indexOf(value);
  return rank === -1 ? PRIORITY.length : rank;
}

/** Projette la classification interne sur les champs lus par Weebox. */
export function toWeeboxLanguages(classification) {
  switch (classification) {
    case "fr-VF":
      return { lang: "fr", languages: { sub: [], dub: ["fr"] } };
    case "fr-VOSTFR":
      return { lang: "fr", languages: { sub: ["fr"], dub: [] } };
    case "fr":
      return { lang: "fr", languages: { sub: ["fr"], dub: ["fr"] } };
    case "en":
      return { lang: "en", languages: { sub: ["en"], dub: ["en"] } };
    case "multi":
      return { lang: "multi", languages: { sub: [], dub: [] } };
    default:
      return { lang: "", languages: { sub: [], dub: [] } };
  }
}

/** Normalise une langue observée sur une source ; "und" quand elle n'est pas identifiable. */
export function normaliseSubtitleLanguage(value) {
  const code = String(value ?? "").trim().toLowerCase();
  if (/^[a-z]{2,3}$/.test(code)) return code;
  if (/^fr/i.test(code)) return "fr";
  if (/^en/i.test(code)) return "en";
  return "und";
}
