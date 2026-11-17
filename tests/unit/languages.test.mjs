import test from "node:test";
import assert from "node:assert/strict";
import { PRIORITY, languageRank, normaliseSubtitleLanguage, toWeeboxLanguages } from "../../shared/language/languages.js";

test("la priorité place VF puis VOSTFR puis français", () => {
  assert.deepEqual(PRIORITY.slice(0, 3), ["fr-VF", "fr-VOSTFR", "fr"]);
  assert.ok(languageRank("fr-VF") < languageRank("fr-VOSTFR"));
  assert.ok(languageRank("fr-VOSTFR") < languageRank("fr"));
  assert.ok(languageRank("fr") < languageRank("en"));
});

test("la classification est projetée sur les champs lus par Weebox", () => {
  assert.deepEqual(toWeeboxLanguages("fr-VF"), { lang: "fr", languages: { sub: [], dub: ["fr"] } });
  assert.deepEqual(toWeeboxLanguages("fr-VOSTFR"), { lang: "fr", languages: { sub: ["fr"], dub: [] } });
  assert.deepEqual(toWeeboxLanguages("unknown"), { lang: "", languages: { sub: [], dub: [] } });
});

test("une langue non identifiable reste indéterminée, jamais français par défaut", () => {
  assert.equal(normaliseSubtitleLanguage("French"), "fr");
  assert.equal(normaliseSubtitleLanguage("en-US"), "en");
  assert.equal(normaliseSubtitleLanguage("Türkçe"), "und");
  assert.equal(normaliseSubtitleLanguage(""), "und");
});
