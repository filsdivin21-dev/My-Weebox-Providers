# Publication dans un dépôt GitHub existant

Ce document prépare l'intégration de `My-Weebox-Providers` dans **ton** dépôt GitHub personnel,
sans créer de dépôt concurrent. Rien n'est publié : aucune poussée n'a été faite.

## 1. Contrainte technique qui décide de tout

Le moteur de Weebox lit l'index **relativement à l'URL de l'index**, et un lien de dépôt GitHub
nu est traduit en `raw.githubusercontent.com/<owner>/<repo>/<main|master>/index.json`.
Deux conséquences :

- **Cas A — `index.json` à la racine du dépôt** : le lien à donner dans Weebox est simplement
  `https://github.com/<owner>/<repo>`.
- **Cas B — projet placé dans un sous-dossier** (ex. `My-Weebox-Providers/`) : l'index n'est
  plus à la racine, donc il faut donner **l'URL brute du fichier** :
  `https://raw.githubusercontent.com/<owner>/<repo>/<branche>/My-Weebox-Providers/index.json`.
  Cela fonctionne, car `payloadURI` (`published/...`) est résolu par rapport à l'URL de l'index.

Dans les deux cas, **le dossier `published/` doit être publié** avec l'index : c'est lui qui
contient le code téléchargé par Weebox.

## 2. Choix recommandé

| Situation de ton dépôt | Intégration |
|---|---|
| dépôt vide ou réservé aux extensions | **Cas A** : le contenu du projet va à la racine |
| dépôt déjà utilisé pour autre chose | **Cas B** : le projet va dans un sous-dossier, on donne l'URL brute du fichier |
| tu veux éviter tout risque | dépôt **dédié** `My-Weebox-Providers` (recommandé) |

Le dépôt officiel de Weebox n'est concerné dans aucun cas : il reste en lecture seule.

## 3. Contenu à intégrer (branche de travail prête)

Branche préparée localement : **`weebox/providers-repository`** (aucune poussée).

À publier exactement :

```
index.json                 ← obligatoire, à la racine du dossier publié
published/                 ← obligatoire (code des extensions)
repository/                ← facultatif mais utile (catalogue, manifests, variante Drive)
documentation/  tools/  shared/  providers/  tests/   ← facultatif
```

Ne jamais publier : `.git/`, un fichier `.env`, une archive `.zip`, les journaux locaux.

## 4. Deux moyens de transférer sans que j'aie accès à ton dépôt

Depuis l'archive ou le dossier du projet :

**a) Import par bundle Git** (garde l'historique et la branche)

```bash
git clone My-Weebox-Providers.bundle My-Weebox-Providers
cd My-Weebox-Providers
git remote add origin https://github.com/<owner>/<repo>.git
git push -u origin weebox/providers-repository
```

**b) Application de patchs** (dans un dépôt existant, cas B)

```bash
cd <ton-depot>
git checkout -b weebox/providers-repository
git am /chemin/vers/patches/*.patch
git push -u origin weebox/providers-repository
```

## 5. URL à utiliser dans Weebox

Calcul automatique, une fois le remote connu :

```bash
npm run url                                  # lit origin
npm run url -- --owner <compte> --repo <dépôt> --branch main --subdir My-Weebox-Providers
```

Formules exactes :

- Cas A : `https://raw.githubusercontent.com/<owner>/<repo>/<branche>/index.json`
- Cas B : `https://raw.githubusercontent.com/<owner>/<repo>/<branche>/<dossier>/index.json`

## 6. Après la publication

1. Vérifier que l'URL brute répond par du JSON **dans un navigateur** (pas une page GitHub).
2. Dans Weebox › Settings › Plugins, ajouter cette URL.
3. Exécuter [`02-compatibilite-phase-b.md`](02-compatibilite-phase-b.md).
4. Ne rien conclure sur la compatibilité avant ce test.

## 7. Autorisation

Aucune poussée, aucune création de dépôt, aucune modification distante n'a été effectuée.
Toute publication attend ton **autorisation explicite**, et l'accès au dépôt (token ou clé) doit
être fourni par toi : il n'existe aucun identifiant GitHub dans cet environnement.
