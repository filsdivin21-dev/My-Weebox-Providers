# My-Weebox-Providers

Dépôt **personnel et indépendant** de providers (extensions) pour l'application **Weebox**.

> Ce projet ne modifie pas Weebox, ne le reconstruit pas et ne publie rien dans son dépôt.
> Weebox sert uniquement de référence technique (format des extensions et mécanisme de chargement).

## État actuel

| Phase | État | Détail |
|---|---|---|
| A — Audit des sources | **EN ATTENTE** | Aucune source fournie. Aucune source recherchée. |
| B — Compatibilité Weebox | **FAIT (côté technique)** | Format identifié dans le code source du moteur ; sonde créée ; test réel sur téléphone **en attente** |
| C — Projet indépendant | **FAIT** | Arborescence, outils, documentation, archive |
| D — Développement des providers | **NON COMMENCÉ** | Bloqué jusqu'à validation de la phase B sur ton téléphone |
| E → G | **NON COMMENCÉ** | — |

## Ce qui est vérifié, et ce qui ne l'est pas

**Vérifié (preuves locales) :** les manifests et l'index sont conformes aux règles du moteur
Weebox/Anix (identifiants, type, limites de taille, résolution des liens), et l'extension sonde
définit bien une classe `Provider` exposant `getSettings`, `search`, `findEpisodes`,
`findEpisodeServer` avec les structures de données attendues.

**Non vérifié :** Weebox reconnaît réellement ce dépôt, affiche et installe l'extension, et
l'exécute. Cela ne peut être prouvé que par un test réel dans l'application, sur ton téléphone.
Voir [`documentation/02-compatibilite-phase-b.md`](documentation/02-compatibilite-phase-b.md).

## Arborescence

```
My-Weebox-Providers/
├── index.json                  ← À AJOUTER DANS WEEBOX (Settings › Plugins)
├── repository/
│   ├── index.json              copie lisible du même index
│   ├── index.drive.json        variante « fichier unique » (payload inclus) pour Google Drive
│   ├── catalog.json            métadonnées : statuts, langues, compatibilité
│   └── manifests/              copie de chaque manifest publié
├── providers/
│   ├── anime/  movies/  series/  manga/
│   └── _probe/hello-weebox/    extension sonde (inoffensive, sans réseau)
├── shared/                     code partagé, intégré au build (pas d'import à l'exécution)
├── tests/
├── tools/                      build, validation, harnais de conformité
└── documentation/
```

Chaque provider est un dossier autonome : `manifest.json` + `provider.js`. Ajouter ou retirer un
provider = ajouter ou supprimer son dossier, puis relancer `npm run build`.

## Installation dans Weebox

1. Héberge ce dossier sur un dépôt GitHub public (branche `main`).
2. Dans Weebox : **Settings › Plugins › Add source / Add by link**.
3. Colle l'URL du dépôt, par exemple `https://github.com/<ton-compte>/My-Weebox-Providers`.
   Le moteur lit automatiquement `https://raw.githubusercontent.com/<compte>/<repo>/main/index.json`.

Autre possibilité (fichier unique, sans GitHub) : héberger `repository/index.drive.json` sur
Google Drive, partagé en « Tout le monde disposant du lien », et coller le lien de partage du
fichier. Le moteur télécharge alors ce fichier directement.

## Commandes

```bash
npm run build     # régénère index.json, repository/index.json, index.drive.json, catalog.json
npm run validate  # vérifie les règles de format du moteur Weebox
npm test          # validate + harnais de conformité (contrat du provider)
```

Aucune dépendance externe n'est nécessaire (Node ≥ 18).

## Règles de travail

- Aucune source de contenu n'est recherchée ici : seules les sources fournies par le propriétaire
  du projet sont auditées.
- Aucun provider fonctionnel n'est écrit avant validation réelle de la compatibilité.
- Aucun torrent, aucun lien magnet, aucun téléchargement torrent (y compris pour Stremio).
- Aucune déclaration de langue sans preuve, aucun test marqué réussi sans exécution réelle.

Voir [`documentation/03-conventions.md`](documentation/03-conventions.md).
