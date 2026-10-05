---
name: actualiser-nids-de-poule
description: "Actualiser les snapshots nids-de-poule de Montreal (signalements 311, colmatage mecanise, recurrence par position), verifier les sources et l'integrite, sans publication automatique."
argument-hint: "Rafraichissement normal par defaut. Sinon : annee courante seulement, annees precises (2019,2020), reconstruction complete, changement de rayon d'appariement."
agent: "Carte des entraves"
---

# Actualiser les snapshots nids-de-poule

Actualise le dossier `data/nids-de-poule/` jusqu'a sa validation locale complete.
Respecte les [regles de publication](./deployment-rules.md).

Ce dossier **ne suit pas** la convention `extractedAt` de l'[agent Snapshots officiels](../agents/snapshots-municipaux.agent.md). Ne lui applique pas son etape 7. La divergence est voulue et decrite plus bas dans la section « Convention de fraicheur propre a ce dossier ». Toutes les autres exigences d'honnetete, de preservation des donnees et de validation reelle restent en vigueur.

## Perimetre

- Seul `tools/build-nids-de-poule-snapshot.mjs` est autorise a ecrire les snapshots. Les outils de validation en lecture seule sont autorises. N'ecris jamais a la main dans un fichier de `data/nids-de-poule/`.
- Ne touche ni au code de la carte, ni a `js/app.js`, ni aux pages HTML, ni au CSS dans le cadre d'un rafraichissement. Ces snapshots sont consommes par `potholes.html`, ses cartes, ses statistiques et ses profils d'arrondissement; le generateur regenere automatiquement leurs fichiers derives.
- Ne cree pas de nouvelle source de nids-de-poule. Aucune autre municipalite du Grand Montreal ne publie ce type de donnees : verification faite sur Donnees Quebec (Laval 130 jeux, Longueuil 31, Repentigny 39) et sur le flux MTMD (624 chantiers, zero mention de nid-de-poule ou de colmatage). Ne reouvre pas cette recherche sans demande explicite.
- N'ajoute pas ces sources a `MAP_SOURCE_NAMES` dans `data/sources.js`. Leurs quatre entrees doivent rester `inMap: false` tant que la carte ne les charge pas.
- Ne fais aucun commit, push, deploiement ni installation de dependances sans demande explicite distincte. Une autorisation de publication d'une session precedente ne vaut pas pour cette execution.

## Ce que contient le dossier

| Fichier | Role |
| --- | --- |
| `verification.json` | Seul fichier reecrit a chaque execution. Porte `derniereVerification`, l'etat de sonde par annee, le `last_modified` CKAN de chaque ressource de colmatage, et l'empreinte SHA-256 de chaque fichier. |
| `index.json` | Manifeste : sources, compteurs par annee, limites connues. |
| `signalements-2014.json` a `signalements-2026.json` | Signalements 311 de categorie `Nid-de-poule`, tous champs publies. |
| `reparations-2016.json` a `reparations-2025.json` | Traces GPS du colmatage mecanise reel. |
| `positions.json` | Recurrence par position. **Seul** endroit ou vivent les compteurs cumulatifs. |
| `carte.json`, `historique-colmatages.json` | Index de carte, periodes actives et historique des colmatages rapproches. |
| `statistiques.json`, `analyses.json` | Bilans, classements et analyses derives des fichiers annuels. |
| `arrondissements.json`, `arrondissements/*.json` | Index et profils des 19 arrondissements, avec leur provenance. |

Le cache des GeoPackage est dans `tools/cache-nids-de-poule/`, ignore par Git. Ne le versionne pas et ne le supprime pas sans raison : il evite de retelecharger une cinquantaine de megaoctets.

## Convention de fraicheur propre a ce dossier

- `verification.json` porte la **date de verification**. Il est reecrit a chaque execution, meme si rien n'a change.
- Chaque autre fichier porte `contenuModifieLe`, qui est la **date du dernier changement de contenu**, pas une date de verification.
- Un fichier n'est reecrit que si l'empreinte SHA-256 de son contenu change. C'est volontaire : cela evite de reecrire tout le corpus a chaque passage.
- N'inscris jamais une date de verification dans un fichier de donnees. N'ajoute pas d'`extractedAt` a ces fichiers.
- Ne mets pas de date dans les quatre entrees de `data/sources.js` liees aux nids-de-poule. Leur fraicheur est portee par `verification.json`, ce qui est indique en commentaire dans le catalogue.

## Comment fonctionne le rafraichissement

Par defaut, l'outil recharge **uniquement l'annee courante**. Pour chaque annee anterieure, il envoie une sonde legere qui compare trois signaux au contenu de `verification.json` :

1. le nombre d'enregistrements de l'annee,
2. `max(DDS_DATE_CREATION)`,
3. `max(DATE_DERNIER_STATUT)`, qui detecte une requete ancienne dont le statut a bouge.

L'annee n'est rechargee que si l'un des trois differe. Pour le colmatage, l'outil compare le `last_modified` CKAN de la ressource et la version d'import geographique : un GeoPackage dont `versionGeometrieGeoPackage` est absente ou obsolete doit etre relu, meme si la source est inchangee. Une correction de conversion impose le recalcul des appariements et des fichiers derives par la commande normale; `--carte-locale` ne corrige pas un snapshot annuel mal importe.

Deux garde-fous independants cohabitent. La sonde decide s'il faut **relire la source**. L'empreinte decide s'il faut **reecrire le fichier**. Une relecture qui redonne exactement le meme contenu ne produit aucune ecriture, et c'est le comportement attendu.

## Contraintes des sources, verifiees et a ne pas redecouvrir

- **User-Agent obligatoire.** Le WAF de `donnees.montreal.ca` renvoie `403 Forbidden` en HTML sur le User-Agent par defaut de Node et de Python. L'outil envoie un User-Agent navigateur. Si tu sondes manuellement, fais de meme. Un 403 HTML n'est pas une panne de source.
- **POST obligatoire.** En GET, le proxy CKAN ignore silencieusement les parametres contenant des caracteres encodes : `filters`, `sort` et `sql` sont perdus sans erreur, et `datastore_search_sql` repond `409 Valeur manquante`. Une requete GET peut retourner 200 avec des lignes qui ne correspondent pas au filtre. Toujours passer par POST JSON.
- **Plafond de 32 000 lignes** par reponse SQL. L'outil pagine par 20 000 avec `ORDER BY "_id"` et `OFFSET`.
- **Liste blanche de fonctions SQL.** `cast`, `to_char` et `EXTRACT` sont refuses (`Not authorized to call function`). `count`, `max`, `min` et `substr` passent. Les comparaisons de plages ISO (`>= '2019-01-01' AND < '2020-01-01'`) fonctionnent sur les colonnes texte comme sur les colonnes timestamp : c'est la seule methode portable entre la ressource courante et les archives.
- **Annee 2016 publiee en double.** Les ressources `f62595b0` (2014-2016) et `dbc02208` (2016-2018) contiennent chacune les memes 8 768 nids-de-poule de 2016. L'outil ne lit 2016 que depuis `f62595b0`. Ne fusionne jamais les archives sans dedupliquer 2016.
- **Ressource fantome.** `f180b33d` (archives 2017-2018) est annoncee `datastore_active: true` mais sa table n'existe pas (`relation does not exist`). 2017 et 2018 viennent de `dbc02208`. Ne tente pas de la reactiver.
- **Colmatage disponible en deux formats, mais pas une projection unique.** 2016 a 2020 sont dans le datastore CSV en WGS84. Pour chaque GeoPackage, lire `gpkg_geometry_columns` et `gpkg_spatial_ref_sys`, puis verifier le `srs_id` des geometries. Conserver `referenceSpatiale` et `versionGeometrieGeoPackage` dans le snapshot. Refuser une reference inconnue ou incoherente au lieu de deviner a partir de l'annee, d'un identifiant local ou de l'ordre de grandeur des coordonnees.
- **2021 est deja en WGS84.** Verification du fichier officiel le 5 octobre 2026 : reference locale `srs_id: 100000`, `organization: NONE`, definition geographique WGS84 avec axes longitude/latitude et unite degre. Ses 50 320 points sont dans l'enveloppe de Montreal sans reprojection. L'ancienne conversion EPSG:2950 produisait latitude `0.000412`, longitude `-76.237951` a partir de longitude `-73.70349884033203`, latitude `45.583255767822266`. C'etait un bogue de notre import, pas des coordonnees municipales invalides. Ne jamais retablir cette conversion ni assouplir l'enveloppe pour la masquer.
- **2022 a 2025 declarent EPSG:2950.** Ces GeoPackage utilisent NAD83(CSRS) / MTM zone 8; garder la conversion existante vers WGS84, validee contre les coordonnees projetees et geographiques publiees des requetes 311. Toute nouvelle reference doit etre analysee avant ajout; ne jamais appliquer cette conversion automatiquement a tous les fichiers.
- **`DateHeure` de 2016 est en format 12 h** (`11:16:39 AM`) alors que les autres annees sont en 24 h. L'outil normalise les deux.

## Regles d'exactitude a ne jamais assouplir

- **La position 311 est obfusquee.** La Ville relocalise chaque requete au milieu du troncon le plus proche de plus de 45 m. Ce n'est pas la position du trou. Ne presente jamais ces coordonnees comme exactes.
- **`positionId` designe un troncon de rue, pas un trou unique.** Deux signalements de deux trous differents sur le meme troncon partagent la meme position.
- **`LOC_ERREUR_GDT` doit etre filtre.** La valeur `1` signifie que la requete a ete repliee sur le bureau d'arrondissement. Ces positions agregent des rues sans rapport : une mesure brute donnait 74 signalements sur une position melangeant Sherbrooke, Souligny et Notre-Dame. Seul `LOC_ERREUR_GDT = '0'` alimente `positionId` et l'appariement.
- **Les enregistrements `NATURE = "Information"` ne sont pas des signalements.** Ils n'ont ni identifiant, ni statut, ni position. Ils sont conserves dans les snapshots mais marques `etat: "information"` et exclus de la recurrence.
- **`DERNIER_STATUT = "Terminee"` signifie requete fermee, pas trou repare.** N'ecris jamais « repare » sur la seule foi du statut.
- **Le bloc `colmatage` est une correspondance plausible, pas une preuve.** Le jeu ne couvre que le colmatage mecanise, soit une quinzaine d'appareils. Les reparations manuelles ne sont publiees nulle part. Conserve les champs `distanceM`, `joursApresSignalement`, `avantClotureDeLaRequete` et `confiance` pour que le lecteur puisse juger.
- **Aucune source ne publie les reparations planifiees.** Il est impossible de deduire quel nid-de-poule sera repare ni quand. Le seul signal d'avenir est le statut 311 (`Prise en charge`, `Acceptee`, `Transmise pour traitement`). Ne laisse jamais entendre le contraire.
- **Le colmatage s'arrete au dernier bilan annuel publie.** Le millesime 2025 couvre le 18 janvier au 20 mai 2025 et il n'existe rien pour 2026. Un `0 apparies` sur l'annee courante est normal, ce n'est pas une regression.
- **Couverture limitee a l'ile de Montreal.** Ne laisse pas croire a une couverture metropolitaine.
- **Ne derive jamais une classification d'une couleur.** Regle generale du projet, applicable ici aussi.

## Execution

1. Verifie l'etat du depot avec `git status --porcelain` et preserve les modifications deja presentes. Lis `data/nids-de-poule/verification.json` et `tools/build-nids-de-poule-snapshot.mjs` avant d'agir.
2. Prends une base de comparaison hors depot :
   `shasum -a 256 data/nids-de-poule/*.json data/nids-de-poule/arrondissements/*.json | sort > /tmp/nids-avant.txt`
3. Choisis la commande selon la demande :
   - rafraichissement normal : `node tools/build-nids-de-poule-snapshot.mjs`
   - annees precises : `node tools/build-nids-de-poule-snapshot.mjs --annees=2019,2020`
   - reconstruction complete : `node tools/build-nids-de-poule-snapshot.mjs --tout`
   - re-telecharger les GeoPackage : ajoute `--force`
   - changer le rayon d'appariement : ajoute `--rayon=50`
   Le defaut est `--rayon=25`, choisi pour privilegier la fiabilite. Ne le modifies pas sans demande explicite : il change tous les blocs `colmatage` et donc les treize fichiers de signalements.
4. Laisse l'execution aller au bout. Compte environ 30 s a vide et 110 s pour une reconstruction complete. N'interromps pas et ne relance pas en parallele.
5. Lis la sortie. Elle indique, par annee, `inchange` ou `recharge` avec la raison, puis la liste `fichiers modifies`. Ne resume pas cette liste : elle est la reponse a « qu'est-ce qui a change ».
6. Si une source echoue, l'outil conserve le snapshot precedent, le signale en `ECHEC` et continue avec les autres annees. Ne masque pas l'echec, ne remplace pas les donnees manquantes, ne presente pas l'annee comme actualisee.

## Validation

Execute reellement ces controles et rapporte leur sortie. Un HTTP 200 ou une absence d'erreur ne prouvent rien.

1. **Syntaxe des fichiers reellement modifies.**
   `node --check tools/build-nids-de-poule-snapshot.mjs` si l'outil a ete touche.
   `node --check tools/validate-potholes.mjs` si le validateur a ete touche.
   `node --check data/sources.js` si le catalogue a ete touche.
   Ne lance pas `node --check` sur un fichier que tu n'as pas modifie : cela ne prouve rien.
2. **Diff reel des fichiers.**
   ```
   shasum -a 256 data/nids-de-poule/*.json data/nids-de-poule/arrondissements/*.json | sort > /tmp/nids-apres.txt
   diff /tmp/nids-avant.txt /tmp/nids-apres.txt
   ```
   Croise ce resultat avec `fichiersModifiesCetteExecution` de `verification.json`, qui liste les changements de contenu sans se lister lui-meme. Les changements reels doivent correspondre exactement a cette liste plus `verification.json`. Si un autre fichier a change sans apparaitre dans la liste, ou l'inverse, enquete avant de conclure.
3. **Invariant du rafraichissement a vide.** Si ni la source, ni les regles d'import ou de calcul n'ont change, seul `verification.json` doit differer. Une correction geographique peut legitimement modifier les appariements et leurs derives sans changement de source; en demontrer la cause et la conservation des champs publies. Sinon, si d'autres fichiers changent alors que toutes les annees sont annoncees `inchange`, arrete-toi et cherche la cause.
4. **Integrite de la jointure.** Verifie qu'aucun `positionId` de signalement n'est absent de `positions.json`. Le resultat attendu est zero orphelin.
5. **Coherence des compteurs.** La somme des `nombre` des treize fichiers de signalements doit correspondre au total attendu, et `index.json` doit refleter les memes valeurs que les fichiers.
6. **Controle de contenu sur un echantillon.** Ouvre un signalement apparie avec `confiance: "elevee"` et verifie que `distanceM` respecte le rayon demande, que `joursApresSignalement` est positif et que `avantClotureDeLaRequete` est coherent avec `dateDernierStatut`.
7. **Absence de regression structurelle.** Les enregistrements ne doivent pas contenir de bloc `position` : les compteurs cumulatifs appartiennent a `positions.json`. Les reintroduire forcerait la reecriture des treize millesimes a chaque nouveau signalement.
8. **Poids et propriete du depot.** Controle `du -sh data/nids-de-poule` et confirme que `tools/cache-nids-de-poule/` reste ignore via `git check-ignore -v`. Aucun GeoPackage ne doit apparaitre dans `git status`.
9. **Nettoyage.** Supprime les fichiers temporaires hors depot que tu as crees. Ne laisse aucun `console.log` de debogage dans l'outil.
10. **References geographiques.** Execute `node tools/validate-potholes.mjs --geopackage`. Pour une correction, compare les coordonnees avec le fichier officiel, confirme la conservation des autres millesimes et des champs 311 publies, et verifie que les 50 320 points 2021 ne sont plus exclus. Une reference non reconnue doit rester un echec explicite, jamais une conversion supposee.

Execute `node tools/validate-potholes.mjs --browser` sur le serveur local existant a `http://localhost:5500`, ou un serveur temporaire de validation si aucun n'est disponible. La commande controle les fichiers annuels, les derives et l'affichage FR/EN sur ordinateur et mobile. Apres une correction de geometrie, ouvrir aussi un point et sa fiche dans le mode Colmatages, annee 2021. Ne declare pas le probleme resolu sur la seule foi des compteurs JSON.

## Bilan attendu

Reponds en francais, sans emoji, avec :

1. **La commande exacte executee** et sa duree reelle.
2. **Un tableau par annee de signalements** : annee, etat (`recharge` avec la raison de sonde, ou `inchange`), nombre d'enregistrements, nombre d'ouverts, nombre d'apparies a un colmatage, et si le fichier a ete reecrit.
3. **Un tableau par annee de colmatage** : annee, etat (`recharge`, `inchange`, `echec`), nombre d'interventions, fenetre temporelle couverte.
4. **La liste exacte des fichiers modifies**, croisee avec `fichiersModifiesCetteExecution`. Si la reponse est « aucun sauf verification.json », dis-le explicitement, c'est un resultat valide et non un echec.
5. **Les validations executees avec leur resultat reel**, et celles qui n'ont pas pu l'etre, avec la raison.
6. **Les echecs et limites**, separes des succes. Distingue toujours trois etats : modifie, verifie sans changement, echec ou non verifie.
7. **Le cout pour le depot** : poids total du dossier et poids ajoute par cette execution.
8. **Le rappel** que les changements restent locaux, sans commit ni push, et que la verification des sources ne confirme pas l'etat reel de la chaussee.

N'annonce jamais comme reussie une validation que tu n'as pas executee. Si un resultat te surprend, enquete avant de conclure plutot que d'empiler une correction supplementaire.
