# Conventions du projet

## Identifiants

`id` d'un provider = `<categorie>-<source>` en minuscules, ASCII, tirets uniquement.

- Catégories : `anime`, `movie`, `series`, `manga`.
- Exemples : `anime-exemple`, `movie-exemple`, `manga-exemple`.
- Contrainte moteur : `[A-Za-z0-9_-]`, 1 à 64 caractères, unique dans le dépôt.
- Le dossier du provider doit porter le même nom que l'`id` :
  `providers/<categorie>/<id>/{manifest.json,provider.js}`.

## Versions

`MAJOR.MINOR.PATCH` :

- `PATCH` : correction sans changement de comportement visible ;
- `MINOR` : nouvelle capacité (épisodes, serveur, sous-titres) ;
- `MAJOR` : rupture (source changée, contrat modifié).

Toute modification du `provider.js` impose d'incrémenter `version`, sinon Weebox ne met pas à jour.

## Langues

Weebox raisonne en codes **ISO 639-1** (`lang`, `languages.sub`, `languages.dub`). La
classification demandée est donc stockée dans `repository/catalog.json`, et projetée ainsi :

| Classification interne | `languages.sub` | `languages.dub` | `lang` |
|---|---|---|---|
| `fr-VF` | — | `["fr"]` | `fr` |
| `fr-VOSTFR` | `["fr"]` | — | `fr` |
| `fr` (non spécifié) | `["fr"]` | `["fr"]` | `fr` |
| `en` | `["en"]` | `["en"]` | `en` |
| `multi` | langues réelles | langues réelles | `multi` |
| `unknown` | `[]` | `[]` | `` (vide) |

Règles : une langue n'est déclarée que si elle a été **observée** sur la source (piste audio ou
sous-titre réellement listée). `unknown` par défaut, jamais `fr` par défaut.
Ordre de priorité d'affichage : VF › VOSTFR › français non spécifié › autres langues.

Sous-titres : le champ `language` d'un `VideoSubtitle` est un code ISO 639-1 (`"fr"`).
Une piste dont la langue n'est pas identifiable reçoit `"und"` (indéterminée) — jamais `"fr"`
par supposition.

## Statuts

`STABLE` · `DÉGRADÉ` · `EN DÉVELOPPEMENT` · `CASSÉ` · `RETIRÉ`

- Stockés dans `repository/catalog.json` (`status`), jamais dans le manifest publié.
- `CASSÉ` / `DÉGRADÉ` : ajouter `paused` dans le manifest pour désactiver l'interrogation
  automatique, sans désinstaller l'extension.
- Un provider n'entre dans `catalog.json` qu'après audit de sa source et test d'exécution réel.

## Un provider = un dossier autonome

```
providers/anime/mon-provider/
├── manifest.json     métadonnées publiées (type onlinestream-provider)
├── provider.js       code exécutable — UN SEUL fichier, aucune importation
└── NOTES.md          (optionnel) particularités de la source, preuves d'audit
```

Contraintes : `provider.js` ≤ 2 Mio, autonome, sans `import`/`require`, sans secret, sans accès
fichier, **sans torrent ni magnet**.

## Code partagé

`shared/` contient des aides réutilisables **au build uniquement** : `tools/build.mjs` remplace
les marqueurs `/* include: shared/<fichier> */` par le contenu du fichier, puis vérifie que le
résultat reste un fichier unique valide. Un provider publié ne contient donc jamais d'import.

## Archives

À chaque étape : archive ZIP de `My-Weebox-Providers/`, avec nom, taille, nombre de fichiers et
empreinte SHA-256 consignés dans le rapport. L'archive est produite dans l'espace de travail du
projet — elle n'est **pas** déposée automatiquement sur le téléphone de l'utilisateur.
