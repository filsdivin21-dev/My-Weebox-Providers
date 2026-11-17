# Preuve de publication — GitHub

Dépôt : <https://github.com/filsdivin21-dev/My-Weebox-Providers> (public)
Branche par défaut : `main`
Date de publication : 2026-11-17

## Commit publié

```
d711f715e8e53c96d645859216571313fcc9f48a
Cible définitive : dépôt dédié My-Weebox-Providers (public, index à la racine)
auteur/date : 2026-11-17T10:27:55Z
```

Historique Git conservé (aucun `--force`, aucun nouvel historique) : la branche
`main` locale a été poussée telle quelle, avec `-u` (suivi `origin/main`).

## Vérifications réellement exécutées après le push

| Contrôle | Commande / source | Résultat |
| --- | --- | --- |
| Références distantes | `git ls-remote origin` | `refs/heads/main` = `d711f715e8e5…f48a`, `HEAD` = idem |
| Commit distant | API `commits/main` | SHA et message identiques au commit local |
| Nombre de fichiers suivis | API `git/trees/main?recursive=1` | 37 blobs (identique au `git ls-files` local) |
| Local vs distant | `git fetch` puis `git diff main origin/main` | aucune différence |
| `index.json` en ligne | `raw.githubusercontent.com/…/main/index.json` | HTTP 200, 675 octets, SHA-256 `e4f14f956086ad1cd0190de63f07bc4c4504b3aad596fb9920a8fe2318098d4b` (ident. local) |
| Charge utile publiée | `…/main/published/_probe/probe-hello-weebox/provider.js` | HTTP 200, 958 octets, SHA-256 `d728a305769e745a828e07d3d165848f095bab0d8ad5071870610885d730c4d3` (ident. local) |
| Sources providers | `…/main/providers/_probe/probe-hello-weebox/manifest.json` | HTTP 200, 515 octets |
| Outils | `…/main/tools/build.mjs` | HTTP 200, 8 442 octets |
| Documentation | `…/main/README.md`, `…/main/documentation/05-publication.md` | HTTP 200 |
| Dépôt | `gh repo view` | `isEmpty: false`, `visibility: PUBLIC`, `defaultBranchRef: main` |

## Ce qui n'est pas vérifié

- Le comportement réel dans l'application Weebox (reconnaissance du dépôt,
  exécution de la sonde) n'est **pas** prouvé ici : il doit être constaté sur le
  téléphone de l'auteur. Voir `documentation/02-compatibilite-phase-b.md`.
- Aucun provider de contenu n'existe à ce stade : seule la sonde inoffensive
  `probe-hello-weebox` est publiée.

## Portée

- `Project-Translator-` : non modifié (lecture seule, aucun push).
- Dépôt officiel / code de Weebox : non modifié.
- Aucune archive ZIP dans le dépôt (le `.gitignore` exclut `*.zip`) : Weebox lit
  directement `index.json` et `published/…`.
