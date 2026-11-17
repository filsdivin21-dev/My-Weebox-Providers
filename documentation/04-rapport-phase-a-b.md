# Rapport — Phase A (audit) et Phase B (compatibilité), étape 1

Date : 2026-11-17 · Version du dépôt : 0.1.0

## 1. Travail effectué

1. **Examen de l'environnement** : aucun projet `My-Weebox-Providers` existant (dossier vide).
   Rien n'a donc été écrasé ni supprimé.
2. **Identification du format réellement accepté par Weebox**, sans toucher à Weebox :
   lecture du `README.md` du dépôt `RimamashiroHina/Weebox` (lecture seule) et du code du moteur
   d'extensions dont il dépend, `MaidLover69/Anix` (`src-tauri/src/plugins/`).
3. **Création du projet indépendant** : arborescence, outils de build/validation/conformité,
   documentation, extension sonde inoffensive, dépôt Git initialisé localement.
4. **Vérification technique de la compatibilité** : exécution réelle des outils
   (`npm test`) — build, validation du format, chargement du payload dans un moteur isolé et
   contrôle du contrat des quatre méthodes.

## 2. Fichiers créés

- `README.md`, `CHANGELOG.md`, `.gitignore`, `package.json`, `index.json` (généré)
- `documentation/01-format-weebox.md`, `02-compatibilite-phase-b.md`, `03-conventions.md`,
  `04-rapport-phase-a-b.md`
- `providers/_probe/probe-hello-weebox/{manifest.json,provider.js,meta.json}`
- `tools/lib/rules.mjs`, `tools/build.mjs`, `tools/validate.mjs`, `tools/conformance.mjs`
- `shared/language/languages.js`, `shared/errors/errors.js`
- `tests/unit/languages.test.mjs`
- générés : `published/_probe/probe-hello-weebox/provider.js`, `repository/index.json`,
  `repository/index.drive.json`, `repository/catalog.json`, `repository/manifests/probe-hello-weebox.json`

## 3. Fichiers modifiés

Aucun : projet neuf. Le dépôt Weebox n'a fait l'objet d'aucune écriture.

## 4. Sources analysées

**Aucune source de contenu.** Conformément à la consigne, aucun site, annuaire, dépôt
d'extensions ou module Stremio n'a été recherché. Seuls ont été lus des documents et du code
techniques décrivant le format des extensions (voir §1).

## 5. Tests exécutés

| Test | Commande | Résultat |
|---|---|---|
| Build du dépôt | `node tools/build.mjs` | PASS — 1 extension, `index.json` = 675 octets |
| Conformité au format du moteur | `node tools/validate.mjs` | PASS — index conforme, 1 payload inspecté |
| Chargement + contrat | `node tools/conformance.mjs` | PASS — sonde chargée, 0 appel réseau, contrat vérifié |
| Priorité / projection des langues | `node --test tests/unit/` | PASS — 3 tests |

Un premier échec réel a été détecté et corrigé : le dossier de la sonde ne portait pas le même
nom que son `id` (règle interne), puis une erreur du harnais (`globalThis` hors contexte).
Après correction, `npm test` sort en code 0.

## 6. Résultats

**Format établi (extrait du code du moteur, pas d'une supposition) :**

- Type d'extension unique : `onlinestream-provider` (protocole Seanime), JavaScript ou
  TypeScript transpilé, exécuté dans un moteur **QuickJS sandboxé**, sans loader de modules.
- Lien de dépôt GitHub nu → lecture de `raw.githubusercontent.com/<owner>/<repo>/main/index.json`
  (puis `master`). Liens Google Drive → téléchargement direct du fichier partagé.
- Index accepté : tableau de manifests, `{name, plugins[]}`, ou manifest unique ; 2 Mio max ;
  200 plugins max.
- Manifest : `id` (1-64, `A-Za-z0-9-_`), `version`, `type`, `language`, `payload` **ou**
  `payloadURI` (relatif à l'index), `lang`, `languages.{sub,dub}`, `paused`, `icon`, `readme`.
- Code : classe globale **`Provider`** obligatoire, méthodes `getSettings`, `search`,
  `findEpisodes`, `findEpisodeServer` ; 2 Mio max par extension.
- Rejeté par le moteur : Aniyomi/Tachiyomi (`.apk`), Mangayomi, modules Stremio directs,
  extensions `manga-provider`.

**Conséquence pour la suite :** Animes, films et séries sont possibles via ce même type
`onlinestream-provider` (un film ou une série se déclare simplement avec un épisode unique ou des
saisons). Les **mangas** ne disposent pas de type dédié dans ce moteur : à traiter source par
source, et seulement si la source expose des images via un provider réécrit — sans jamais
simuler une capacité inexistante.

## 7. Problèmes rencontrés

- Le nom de dossier de la sonde ne correspondait pas à son `id` → renommé.
- Bug du harnais de conformité (`context.globalThis` non défini) → corrigé.
- L'endpoint public `anix-linux.vercel.app/extensions` n'a pas pu être lu (indisponible au
  moment du test). Contourné : la spécification a été établie directement depuis le code source
  du moteur, ce qui est plus fiable qu'un exemple.

## 8. Limitations

- **La compatibilité réelle avec Weebox n'est pas prouvée.** Le dépôt n'a pas été hébergé, et
  Weebox n'a pas été lancé. Les étapes 4 à 8 de la phase B (reconnaissance du dépôt, apparition,
  installation, chargement, exécution dans l'application) restent à faire **sur ton téléphone**.
- Le harnais local utilise V8, pas QuickJS : les différences d'API du moteur de l'application ne
  sont pas couvertes.
- Aucun test réseau n'a été fait : les liens GitHub/Drive du dépôt réel n'existent pas encore.
- Aucun provider de contenu n'existe à ce stade, volontairement.

## 9. État d'avancement

| Phase | État |
|---|---|
| A — Audit des sources | **EN ATTENTE** de tes liens |
| B — Compatibilité Weebox | **TECHNIQUE : FAIT** · **TEST RÉEL : EN ATTENTE** |
| C — Projet indépendant | **FAIT** |
| D → G | **NON COMMENCÉ** — bloqué par la validation de la phase B |

## 10. Prochaine étape

1. Héberger ce dossier (GitHub public, branche `main`, `index.json` à la racine) — ou utiliser
   la variante Google Drive `repository/index.drive.json`.
2. Ajouter l'URL du dépôt dans Weebox › Settings › Plugins et exécuter le protocole de
   [`02-compatibilite-phase-b.md`](02-compatibilite-phase-b.md).
3. Me rapporter les résultats (succès/échec, message exact, capture si possible).
4. Ensuite seulement : tu me fournis tes liens, j'audite, puis je développe les providers validés.

**Archive** : `My-Weebox-Providers-0.1.0.zip`, créée après ce rapport ; sa taille, son nombre de
fichiers et son empreinte SHA-256 sont indiqués dans le message de rapport de cette étape, avec
le résultat de la vérification de l'archive.
