// Erreurs typées utilisables dans un provider (intégrées au build, aucun import à l'exécution).
// Le moteur affiche le message : il doit rester court, sans secret ni donnée personnelle.

export function providerError(message, { kind = "provider", status } = {}) {
  const error = new Error(message);
  error.name = "ProviderError";
  error.kind = kind;
  if (status !== undefined) error.status = status;
  return error;
}

export function httpError(status, url) {
  const host = (() => {
    try {
      return new URL(url).host;
    } catch {
      return "cible";
    }
  })();
  return providerError(`HTTP ${status} depuis ${host}`, { kind: "http", status });
}

export function notFound(what) {
  return providerError(`${what} introuvable`, { kind: "not-found" });
}

export function parseError(what) {
  return providerError(`Réponse illisible (${what})`, { kind: "parse" });
}

/** isAdult / 18+ : à filtrer côté provider quand la source le signale. */
export function adultNotSupported() {
  return providerError("Contenu 18+ non traité par ce provider", { kind: "policy" });
}
