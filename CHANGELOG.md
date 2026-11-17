# Journal des modifications

## 0.1.0 — 2026-11-17

Première étape : préparation du projet indépendant et vérification technique de la compatibilité.

- Création du dépôt indépendant `My-Weebox-Providers` (aucune modification de Weebox).
- Spécification du format réellement accepté par Weebox, extraite du moteur d'extensions :
  `onlinestream-provider`, JavaScript/TypeScript, QuickJS sandboxé, index JSON à la racine,
  manifests, limites de taille, résolution des liens GitHub et Google Drive.
- Extension sonde inoffensive `probe-hello-weebox` (aucun réseau, aucune vidéo).
- Outils : `build` (génère `index.json`, `repository/index.json`, variante Google Drive,
  catalogue), `validate` (règles du moteur), `conformance` (chargement + contrat des méthodes).
- Documentation : format, protocole de test sur téléphone, conventions, rapport de phase.

Aucun provider de contenu n'a été développé : la phase D reste bloquée jusqu'à validation de la
compatibilité par un test réel dans Weebox.
