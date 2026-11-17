# Rapport d'audit initial des sources fournies

Date : 2026-11-17 · Auteur : audit technique automatisé (aucune source recherchée en dehors de
la liste fournie) · Méthode : requêtes HTTP réelles depuis l'espace de travail, avec
User-Agent mobile Chrome/Android, suivi des redirections, analyse du HTML renvoyé.

Aucun provider n'a été codé : la consigne était d'auditer d'abord, et l'audit conclut qu'aucune
des sources fournies n'est exploitable dans le cadre fixé.

## 1. Inventaire des liens fournis

15 liens distincts, tous du même message. Aucun lien antérieur n'a été oublié : les échanges
précédents ne contenaient aucune autre adresse de source de contenu.

## 2. Résultats bruts (relevés réels)

| # | Lien fourni | Réponse réelle | Nature constatée | Verdict |
|---|---|---|---|---|
| 1 | `https://cinefuse.icu` | HTTP 200 après redirection vers `https://referia.lol/cinefuse` — page « Les adresses », titre « Cinefuse · Referia » | Page d'annonce d'adresses/miroirs : liste `cinefuse.sbs`, section « Disponibilité par FAI », renvois Discord/TikTok/`stt.gg`/Cloudflare Radar. **Aucun catalogue, aucune recherche, aucun épisode.** | INEXPLOITABLE |
| 2 | `https://senpai-stream.forum/movie/la-fin-d-oak-street` | HTTP 000 — **aucun enregistrement DNS** pour `senpai-stream.forum` | Domaine mort (supprimé ou jamais résolu) | INEXPLOITABLE |
| 3 | `https://hbooru.com` | HTTP 200, titre « HBooru — **Adult** videos, galleries and comics », 28 occurrences « VOSTFR » | Galerie/board de contenus **pour adultes** (18+), vidéos et images | EXCLU (adulte) |
| 4 | `https://aftr.mom` | **HTTP 403** « Attention Required! \| Cloudflare » | Protection anti-robot Cloudflare active | INEXPLOITABLE sans contournement |
| 5 | `…/site/purstream` | HTTP 200, « Purstream : nouvelle adresse URL officielle (Novembre 2026) » | Page d'atterrissage SEO, pas un site de contenu | INEXPLOITABLE |
| 6 | `…/site/moiflix` | HTTP 200, « nouvelle adresse URL officielle » | Idem | INEXPLOITABLE |
| 7 | `…/site/xonaflix` | HTTP 200, « nouvelle adresse URL officielle » | Idem | INEXPLOITABLE |
| 8 | `…/site/vfstream` | HTTP 200, « **site fermé** — historique et alternatives » | Site déclaré fermé | INEXPLOITABLE |
| 9 | `…/site/wooflix` | HTTP 200, « nouvelle adresse URL officielle » | Page d'atterrissage SEO | INEXPLOITABLE |
| 10 | `…/site/xalaflix` | HTTP 200, « **site fermé** — historique et alternatives » | Site déclaré fermé | INEXPLOITABLE |
| 11 | `…/site/moovbob` | HTTP 200, « **site fermé** — historique et alternatives » | Site déclaré fermé | INEXPLOITABLE |
| 12 | `…/site/hyloplus` | HTTP 200, « **site fermé** — historique et alternatives » | Site déclaré fermé | INEXPLOITABLE |
| 13 | `…/site/hianime` | HTTP 200, « nouvelle adresse URL officielle » | Page d'atterrissage SEO | INEXPLOITABLE |
| 14 | `https://nakanime.tv` | **HTTP 404** sur `/`, `/anime`, `/catalogue`, `/fr`, `/accueil` — 216 octets : « Accès restreint — L'accès est bloqué aux pays non francophones, désactive ton VPN ou localise toi en France » | **Blocage géographique explicite** demandant de désactiver un VPN | INEXPLOITABLE (contournement d'accès interdit) |
| 15 | `https://recherche-stream.xyz` | HTTP 200, « Films & Séries Streaming Gratuit 2026 », 7 occurrences « streaming gratuit », « sans inscription » | Portail d'indexation de sites de streaming gratuit ; ne diffuse rien lui-même | INEXPLOITABLE |

## 3. Ce que l'audit établit

**Aucune des 15 sources n'expose un catalogue interrogeable par un provider.**

- 7 liens (`recherche-stream.xyz/site/*` et `cinefuse.icu`) sont des **pages d'annonce** :
  elles publient des adresses de miroirs et des consignes de contournement de blocage, sans
  catalogue, sans recherche, sans fiche, sans épisode, sans lecteur.
- 4 de ces sites sont explicitement **fermés** (vfstream, xalaflix, moovbob, hyloplus).
- 1 domaine est **mort** (senpai-stream.forum, aucun DNS).
- 1 site est **protégé par Cloudflare** (aftr.mom, 403).
- 1 site impose un **blocage géographique** et demande de désactiver un VPN (nakanime.tv).
- 1 site est un **board adulte 18+** (hbooru.com).
- `recherche-stream.xyz` est un **annuaire**, pas une source.

Aucune ne propose de pagination, de recherche, de structure de fiches ou de lecteur
directement interrogeable. Il n'y a donc **rien à auditer plus finement** au sens de la
consigne (catégories, langues, pagination, recherche, lecteurs) : le niveau catalogue n'existe
pas dans ce qui a été fourni.

## 4. Verdict de conformité

Les catalogues réellement visés par ces pages (miroirs `cinefuse.sbs`, `hianime`, `moiflix`,
`wooflix`, `xonaflix`, `purstream`) diffusent des **films et séries récents en VF/VOSTFR sans
autorisation des ayants droit** : ce sont des sites de rediffusion illégale, et les pages
fournies servent précisément à retrouver leurs adresses successives quand elles sont bloquées.

Écrire un provider Weebox pour ces sources reviendrait à construire un outil d'accès à des
œuvres diffusées sans droits — ce qui contredit la consigne n° 5 du projet (« uniquement des
contenus accessibles légalement ») et la règle « aucun contournement de protection d'accès »
(Cloudflare sur aftr.mom, blocage géographique sur nakanime.tv).

**Décision : aucun provider n'est développé à partir de cette liste.** Ce n'est pas un échec
technique mais une conclusion d'audit : ces liens ne permettent pas de construire des providers
conformes.

## 5. État du dépôt après cet audit

- Sonde `probe-hello-weebox` **conservée et inchangée** (compatibilité validée sur téléphone :
  « OK · 0,0 s »).
- `index.json` : inchangé, 1 extension (la sonde). Aucun ajout non testé.
- Aucune modification de Weebox ni de `Project-Translator-`.

## 6. Ce qui débloquerait la phase providers

Il faut fournir des sources qui remplissent les trois conditions suivantes :

1. **licite** : service ou catalogue autorisé (plateforme officielle, catalogue libre de droits,
   archive publique, site d'un ayant droit ou d'une association) ;
2. **accessible sans contournement** : pas de challenge anti-robot, pas de VPN exigé, pas de
   compte protégé à forcer ;
3. **structurée** : catalogue consultable en HTTP simple, avec recherche et fiches lisibles par
   un provider (HTML classique ou API publique documentée).

Une fois de telles sources fournies, la méthode est déjà prête : audit → provider → test
d'exécution réel → `npm test` → `index.json` → publication. Le socle technique (build, validate,
conformance, conventions, publication) est en place et n'a pas besoin d'être refait.
