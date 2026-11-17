# Format réellement accepté par Weebox — spécification technique

Document de référence. Tout ce qui suit est **extrait du code source du moteur** utilisé par
Weebox, et non supposé. Weebox n'étant pas modifiable, ce document ne fait que décrire.

Sources examinées (lecture seule) :

- `RimamashiroHina/Weebox` — `README.md` : Weebox accepte des « source repositories » ajoutés
  dans *Settings › Plugins*, et cite comme dépôt de référence les **extensions Anix**.
- `MaidLover69/Anix` — `src-tauri/src/plugins/` (`registry.rs`, `engine.rs`, `provider.rs`,
  `transpile.rs`, `prelude.js`) : moteur d'extensions réellement embarqué (QuickJS sandboxé).

Conclusion : Weebox ne charge **qu'un seul type d'extension**, `onlinestream-provider`
(protocole de providers de Seanime), écrit en **JavaScript ou TypeScript**, exécuté dans un
moteur **QuickJS** isolé (pas de loader de modules, pas d'accès fichiers ni processus).

---

## 1. Lien de dépôt ajouté dans Weebox

Le lien peut être :

| Lien fourni | Ce que le moteur lit |
|---|---|
| `https://github.com/<owner>/<repo>` | `https://raw.githubusercontent.com/<owner>/<repo>/main/index.json` puis `…/master/index.json` |
| `https://github.com/<owner>/<repo>/tree/<branche>` | `…/raw.githubusercontent.com/<owner>/<repo>/<branche>/index.json` |
| `https://github.com/<owner>/<repo>/blob/<branche>/<chemin>` | `https://raw.githubusercontent.com/<owner>/<repo>/<branche>/<chemin>` |
| lien de partage Google Drive (`drive.google.com/file/d/<id>/view`, `?id=<id>`) | `https://drive.usercontent.google.com/download?id=<id>&export=download&confirm=t` |
| toute autre URL `http(s)` | l'URL telle quelle (doit renvoyer du JSON) |

Sans schéma (`exemple.com/fichier.json`), `https://` est ajouté. Les échecs Drive typiques sont
signalés explicitement : fichier non partagé « Tout le monde disposant du lien », page de
connexion, quota de téléchargements, page HTML au lieu de JSON.

**Conséquence pratique :** pour un lien de dépôt GitHub nu, l'index **doit** être à la racine du
dépôt, nommé exactement `index.json`. C'est le cas de ce projet.

## 2. Format de l'index

Trois formes acceptées (BOM UTF-8 toléré) :

```json
[ { …manifest… }, { …manifest… } ]
```
```json
{ "name": "Nom du dépôt", "plugins": [ { …manifest… } ] }
```
```json
{ …un seul manifest… }
```

Contraintes : **2 Mio maximum**, **200 plugins maximum** par dépôt. Un objet contenant une clé
`type` n'est pas traité comme un index mais comme un manifest unique.

## 3. Format d'un manifest

```json
{
  "id": "mon-provider",
  "name": "Mon Provider",
  "version": "1.0.0",
  "author": "Auteur",
  "description": "Courte description",
  "icon": "https://…/icone.png",
  "type": "onlinestream-provider",
  "language": "javascript",
  "payloadURI": "provider.js",
  "payload": "",
  "manifestURI": "",
  "lang": "fr",
  "languages": { "sub": ["fr"], "dub": ["fr"] },
  "readme": "https://…",
  "notes": "…",
  "paused": "raison (optionnel)"
}
```

Règles vérifiées par le moteur :

- `type` : doit valoir exactement `onlinestream-provider`. Un autre type est **ignoré
  silencieusement** (donc une extension Aniyomi/Seanime d'un autre type n'apparaît pas).
- `id` : 1 à 64 caractères, uniquement `A-Z a-z 0-9 - _`. Un id invalide ou en double est rejeté.
- `version` : chaîne non vide ; c'est elle qui déclenche les mises à jour (`x.y.z` conseillé).
- `language` : `javascript`, `typescript` ou vide. Toute autre valeur est une erreur
  (« plugins written in '…' are not supported »). Un payload TypeScript est transpilé
  automatiquement (types retirés, `class Provider` conservée en déclaration globale).
- `payload` (code en ligne) **ou** `payloadURI` (chemin/URL du code) : au moins l'un des deux.
  Si `payload` est présent et non vide, il est prioritaire.
- `payload` / `payloadURI` : **2 Mio maximum** par extension, texte UTF-8 non vide.
- `payloadURI` relatif : résolu **par rapport à l'URL de l'index** (ou du manifest s'il a été
  récupéré via `manifestURI`).
- `manifestURI` : si l'entrée d'index ne porte ni code ni version, elle doit nommer un manifest
  à télécharger ; ce manifest doit avoir **le même `id`** et le type `onlinestream-provider`.
- `name`, `author`, `description`, `lang` : tronqués à 600 caractères.
- `languages.sub` / `languages.dub` : listes de codes ISO 639-1 ; servent à trier les providers
  selon la langue préférée (sous-titres et doublages) dans Weebox. À défaut, `lang` sert pour les
  deux.
- `paused` : chaîne non vide = provider marqué cassé temporairement ; il reste installé mais
  n'est plus interrogé automatiquement. Utile pour un statut « DÉGRADÉ ».

## 4. Contrat du code d'extension

Le payload doit déclarer une **classe globale nommée exactement `Provider`** (sinon :
« the plugin does not define a Provider class »).

```js
class Provider {
  getSettings()                                  // → { episodeServers: string[], supportsDub: boolean }
  async search(opts)                             // → SearchResult[]
  async findEpisodes(id)                         // → EpisodeDetails[]
  async findEpisodeServer(episode, server)       // → EpisodeServer
}
```

Structures :

```ts
type SearchResult   = { id: string, title: string, url: string, subOrDub: "sub"|"dub"|"both" }
type EpisodeDetails = { id: string, number: number, url: string, title?: string }
type EpisodeServer  = { server: string, headers: Record<string,string>, videoSources: VideoSource[] }
type VideoSource    = { url: string, type: "mp4"|"m3u8"|"unknown", quality: string, label?: string,
                        subtitles: VideoSubtitle[] }
type VideoSubtitle  = { id: string, url: string, language: string, isDefault: boolean }
```

`search(opts)` reçoit `{ media, query, dub, year? }` où `media` contient les métadonnées AniList
(`id`, `idMal`, `romajiTitle`, `englishTitle`, `episodeCount`, `synonyms`, `isAdult`,
`startDate`, `absoluteSeasonOffset`…).

Extensions propres au moteur (ignorées par Seanime, prises en compte par Weebox) :

- résultat de recherche : `altTitles?: string[]`, `year?: number`, `episodeCount?: number` —
  améliorent l'appariement titre/année/nombre d'épisodes ;
- épisode : `image?: string`, `synopsis?: string`, `filler?: boolean` ;
- sous-titre : `format?: "vtt"|"srt"|"ass"|"ssa"` quand l'URL est trompeuse ;
- serveur d'épisode : `skip: { introStart, introEnd, outroStart, outroEnd }` en secondes.

Délais par défaut : `getSettings` 5 s, `search` / `findEpisodes` / `findEpisodeServer` 20 s.
Les serveurs listés dans `episodeServers` sont interrogés en parallèle (3 à la fois) ; les noms
contenant `sub` / `dub` servent à distinguer les versions. Le nom `default` est prioritaire.

## 5. Environnement d'exécution (QuickJS)

Globaux disponibles (liste exacte issue du prélude du moteur) :

```
fetch, console, setTimeout, clearTimeout, setInterval, clearInterval, queueMicrotask,
URL, URLSearchParams, TextEncoder, TextDecoder, Buffer, atob, btoa,
AbortController, AbortSignal, AbortContext, CryptoJS, Doc, LoadDoc, $anix, $anilili,
$sleep, $store, $scannerUtils, $isOffline, $getUserPreference
```

- **Aucun loader de modules** : pas de `import`, pas de `require`. Le payload doit être
  **un seul fichier autonome**. Le code partagé de ce projet est donc intégré au build
  (`tools/build.mjs`), jamais importé à l'exécution.
- **`LoadDoc(html)`** fournit un DOM de type jQuery pour le scraping HTML.
- `fetch` passe par le client HTTP de l'application : respect des restrictions réseau, sessions
  et limites de requêtes simultanées du moteur.
- Pas d'accès au système de fichiers, ni aux processus, ni aux sockets brutes.
- Le moteur coupe les payloads qui bloquent (`sleep`/traitement trop long).

## 6. Ce que Weebox n'accepte pas

- Extensions **Aniyomi/Tachiyomi** (`.apk`, index `pkg`/`apk`/`sources`) : format totalement
  différent, non supporté.
- Extensions **Mangayomi** (`index.json` Mangayomi, fichiers `.js` avec `mangayomi` API) :
  non supporté.
- Modules **Stremio** (`/manifest.json`, protocole `stremio://`) : aucun mécanisme de chargement
  de ce type dans le moteur. Un module Stremio ne peut donc être utilisé qu'en **réécrivant** un
  provider `onlinestream-provider` qui appelle ses endpoints HTTP (streams directs uniquement,
  jamais torrent/magnet).
- Extensions **Multi/manga** au sens Seanime (`manga-provider`) : le moteur ne charge que
  `onlinestream-provider`. Les mangas ne sont donc possibles que si une source expose des
  images via un provider de streaming réécrit — à évaluer source par source, sans simulation.
- TypeScript avec `import`/`export` de modules : le payload est évalué comme script global ; les
  instructions de module ne sont pas résolues.

## 7. Mise à jour d'un provider

Le moteur compare la version et le contenu du code : un provider déjà installé est remplacé
quand la version change (ou quand le code en ligne change). Il suffit donc de modifier le
`provider.js` et d'incrémenter `version` dans son manifest, puis de reconstruire `index.json` —
sans reconstruire tout le dépôt, et sans réinstaller les autres providers.
