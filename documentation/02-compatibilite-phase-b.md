# Phase B — Compatibilité réelle avec Weebox

## État

| Étape | État | Preuve |
|---|---|---|
| 1. Identifier les formats acceptés | **FAIT** | [`01-format-weebox.md`](01-format-weebox.md) — extrait du moteur (`registry.rs`, `engine.rs`, `provider.rs`, `transpile.rs`, `prelude.js`) |
| 2. Extension minimale inoffensive | **FAIT** | `providers/_probe/hello-weebox/` (aucun réseau, aucune vidéo) |
| 3. Index de test | **FAIT** | `index.json`, `repository/index.drive.json` |
| 4. Weebox reconnaît le dépôt | **FAIT (téléphone)** | dépôt `filsdivin21-dev/My-Weebox-Providers` ajouté, sonde listée |
| 5. L'extension apparaît | **FAIT (téléphone)** | `Probe — Hello Weebox` visible dans les extensions |
| 6. Installation | **FAIT (téléphone)** | extension installée depuis le dépôt public |
| 7. Chargement | **FAIT (téléphone)** | provider chargé sans erreur par le moteur QuickJS |
| 8. Exécution réelle | **FAIT (téléphone)** | exécution de la sonde affichée : **« OK · 0,0 s »** (rapport de l'auteur, 2026-11-17) |

La compatibilité est **acquise** : le format des manifests, le chargement du payload et
l'exécution de la classe `Provider` ont été validés dans l'application réelle. Les providers de
contenu peuvent donc être développés sur cette base. Voir le rapport d'audit des sources
fournies : [`08-rapport-audit-sources.md`](08-rapport-audit-sources.md).

## Extension sonde

`probe-hello-weebox` (`providers/_probe/hello-weebox/`) :

- `getSettings()` → `{ episodeServers: ["probe"], supportsDub: false }`
- `search()` → un résultat factice unique, titre `Hello Weebox (probe)`
- `findEpisodes()` → 1 épisode factice
- `findEpisodeServer()` → `videoSources: []` — **aucune vidéo**, donc rien ne peut être lu
- **aucun appel réseau**, aucun accès fichier : elle prouve la reconnaissance, l'installation et
  l'exécution sans toucher à une source de contenu.

La compatibilité étant prouvée, elle est **conservée** comme contrôle de non-régression : si
une future modification de l'index casse la chaîne (nom, `payloadURI`, résolution des chemins),
la sonde cesse de répondre et le problème est visible immédiatement.

## Protocole de test sur ton téléphone

Prérequis : un hébergement accessible par Weebox (voir README, section Installation).

1. **Reconnaissance** — Weebox › Settings › Plugins › ajouter le lien du dépôt.
   Attendu : le dépôt apparaît avec le nom `My Weebox Providers` et 1 extension.
   Échec = message d'erreur du moteur à me transmettre tel quel (ex. « the link does not hold a
   plugin list », « Google Drive did not return the file… »).
2. **Apparition** — l'extension `Probe — Hello Weebox` est listée, avec version `0.1.0`.
3. **Installation** — l'activer ; l'état attendu passe de `disabled` à `ready`.
   Un état `error` affiche un motif : me le transmettre.
4. **Chargement** — le provider est retenu dans la liste des sources disponibles.
5. **Exécution** — ouvrir une fiche anime quelconque et vérifier que le provider est interrogé
   sans faire planter l'application (la sonde renvoie un résultat factice, puis aucun flux).
6. **Non-régression** — les providers déjà installés continuent de fonctionner normalement.

## Points à me rapporter

Pour chaque étape : succès/échec, message exact affiché, et — si possible — une capture d'écran.
Sans ces retours, la phase D (développement des providers) reste bloquée.

## Limites du harnais local

`tools/conformance.mjs` exécute le payload dans un moteur V8 (Node `vm`), avec des globaux
imitant Weebox. Il valide : absence d'import, présence de `Provider`, formes des structures
retournées, absence de dépendance réseau pour la sonde.

Il **ne** prouve pas : le comportement de QuickJS (différences d'API), le client HTTP de
l'application (TLS, certificats, User-Agent, sessions), le rendu des flux, ni l'appariement
titre/année côté Weebox. Ces points relèvent du test sur téléphone.
