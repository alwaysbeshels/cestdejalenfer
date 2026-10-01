# Carte des entraves auto du Grand Montreal

Documentation complete du projet. Consultez aussi le [guide utilisateur des prompts Copilot](GUIDE_PROMPTS.md) ou revenez a l'[index du depot](../README.md).

Les [annonces GitHub](annonces/README.md) sont classees par date, avec une version francaise et anglaise dans chaque fichier et une proposition de versions et de tags. Elles deviennent consultables dans le depot lors de la publication autorisee qui les inclut, sans statut manuel dans leur tableau.

Les commandes et les chemins de fichiers mentionnes ci-dessous sont relatifs a la racine du projet, pas au dossier `docs/`. Les mises a jour de cette documentation doivent etre faites ici; le README a la racine reste un index.

Application statique pour visualiser les fermetures de rues, voies retranchees, autoroutes, ponts, viaducs et restrictions qui compliquent les déplacements en auto dans la region metropolitaine de Montreal, y compris Montreal, Laval, Longueuil, la Rive-Sud, la Rive-Nord et les grands axes de la grande region.

## Utilisation

La carte est une application statique. Depuis la racine du projet, démarrez le serveur local avec `python -m http.server 5500`, puis ouvrez `http://localhost:5500/index.html`. Vous pouvez aussi utiliser l'extension Live Server de VS Code en configurant son port sur `5500`. La commande standard du projet est donc `python -m http.server 5500`, et il faut tester sur `localhost:5500`, pas sur un autre port. Elle utilise Leaflet avec le fond OpenStreetMap standard et des données GeoJSON officielles.

### Application installable (PWA)

Les cartes et la FAQ partagent un manifeste et un service worker sous la racine du site, y compris depuis `/fr/` et `/en/`. Sur GitHub Pages (HTTPS) ou `localhost`, le site peut etre ajoute a l'ecran d'accueil. Cette premiere version reste **en ligne uniquement** : le service worker ne conserve ni entraves ni fond de carte, afin de ne pas afficher des informations perimees hors connexion.

Dans la PWA installee, le dernier mode Auto/Pietons est conserve localement et restaure au prochain lancement depuis l'icone. La carte demande la position au lancement et quand l'application revient au premier plan; le navigateur gere la permission a la premiere demande. En cas de refus ou d'indisponibilite, la carte reste utilisable et le bouton de localisation permet de reessayer. La position n'est pas enregistree. Un onglet de navigateur ordinaire ne declenche pas cette localisation automatique.

Pour tester sans Chrome sur Mac : installez Xcode depuis l'App Store, ouvrez Xcode > Settings > Components et installez un simulateur iOS si necessaire, puis lancez Xcode > Open Developer Tool > Simulator. Depuis le simulateur, ouvrez Safari sur `http://localhost:5500/index.html` apres avoir demarre le serveur local; utilisez Partager > Sur l'ecran d'accueil et ouvrez l'icone ajoutee. Le simulateur iOS requiert l'installation complete de Xcode; les seuls outils en ligne de commande ne suffisent pas. Testez egalement sur un vrai iPhone via l'URL HTTPS de GitHub Pages avant publication : le simulateur ne reproduit pas tous les comportements du materiel. L'application installee ne fonctionne pas hors ligne et ne remplace pas une application native App Store.

## Développement local (optionnel)

### Carte des nids-de-poule et du colmatage

La page [potholes.html](../potholes.html), egalement disponible sous `/fr/potholes.html` et `/en/potholes.html`, est independante des cartes Auto et Pietons. Aucun bouton n'est ajoute a leurs menus; son futur emplacement reste a definir. La couche de points de colmatage et sa section de filtres sont masquees. Les colmatages servent uniquement a l'estimation des statuts et a l'historique des positions.

Seule l'annee courante, a l'heure de Montreal, est selectionnee au demarrage et a la reinitialisation; tous les statuts administratifs 311 restent admissibles. Le filtre Annee est un multichoix : Tout reste une commande explicite, jamais le choix par defaut. Une selection vide n'affiche aucun resultat. L'annee correspond a une periode pendant laquelle la position etait active, pas a l'annee de creation d'une demande : chaque signalement ouvre ou prolonge une periode, le prochain colmatage rapproche la ferme, et un signalement ulterieur en ouvre une autre. Une periode sans fin connue continue les annees suivantes. La fin est exclusive : un colmatage a minuit le 1er janvier ne rend pas la position active dans cette nouvelle annee. Une annee entierement situee dans un intervalle inactif est exclue.

Le filtre de mois est retire. La recherche porte sur la rue, l'intersection ou l'identifiant 311; un filtre d'arrondissement et un filtre de statut actuel restent disponibles. Les marqueurs sont de simples points Canvas, sans nombres ni grappes, avec un rayon qui augmente progressivement de 2 pixels au zoom 10 a 8 pixels au zoom 19. Les compteurs de signalements restent dans les fiches et la liste, pas sur les points; ils comptent les dossiers historiques des positions retenues, pas seulement ceux crees durant les annees cochees.

Les demandes partageant un `positionId` sont regroupees, sans fusion de leurs dossiers. Chaque position possede exactement un statut actuel, independant du 311 et des annees selectionnees : **Actif** (rouge) par defaut; **Reparation presumee** (gris) si le dernier colmatage rapproche est strictement posterieur au dernier signalement connu; **Statut inconnu** (point rouge evide) si la date du dernier signalement est inexploitable. Un nouveau signalement apres le dernier colmatage remet la position uniquement a Actif, meme lorsqu'une ancienne annee est selectionnee. Les reparations passees restent des evenements de l'historique, pas des statuts supplementaires. La selection de plusieurs periodes ou annees ne duplique pas la position. Deux dates identiques ne suffisent pas a griser un point. Le calcul porte sur tous les signalements disponibles, pas uniquement sur le dossier consulte.

La fiche affiche le nombre total de signalements, le nombre correspondant a la selection, les dernieres dates de signalement et de colmatage rapproche, puis le statut du dossier 311 sur une ligne ordinaire. Le delai jusqu'au dernier statut reste distinct d'un delai de reparation. L'historique mele les signalements individuels et toutes les traces GPS valides dans le rayon configure (25 m actuellement), apres le premier signalement a cette position. Les evenements sont tries du plus ancien au plus recent, par lots de 40 a l'affichage; les doubles traces identiques (date, appareil, coordonnees) sont dedupliquees. Les rapprochements ne constituent pas des confirmations de reparation d'un trou unique. Aucun itineraire, niveau de gravite ou travail futur n'est deduit.

Inventaire local du 30 septembre 2026 :

| Corpus | Enregistrements | Limites observees |
| --- | --- | --- |
| Demandes 311, 2014-2026 | 134 347 | 20 981 demandes d'information; 89 933 demandes avec position cartographiable; 27 949 positions publiques historiques |
| Colmatage mecanise, 2016-2025 | 1 027 267 | Periodes annuelles souvent partielles; certaines dates appartiennent a une autre annee que le nom du fichier |
| Dernier fichier de colmatage, 2025 | 74 159 | Dates presentes du 18 janvier au 20 mai 2025; aucune donnee de colmatage 2026 dans ce corpus |

**Limites geographiques :** les positions 311 sont obfusquees au milieu de troncons, pas a l'emplacement exact des trous. Les informations, positions administratives et coordonnees non exploitables sont exclues des marqueurs mais leur presence reste explicite dans les compteurs et les sources. Les fichiers 311 de 2014 a 2016 ne contiennent aucune position marquee fiable par le generateur actuel. Le garde-fou de coordonnees est une enveloppe de plausibilite autour de Montreal, pas une frontiere municipale precise.

**Anomalie 2021 conservee et signalee :** les 50 320 colmatages du snapshot 2021 ont des coordonnees hors de cette enveloppe (exemple : latitude `0.000412`, longitude `-76.237951`). Ils sont exclus des rapprochements et de la chronologie, avec un avertissement de couverture incomplete. Le generateur applique EPSG:2950 a tous les GeoPackage; le systeme de reference du fichier source 2021 reste a verifier avant une correction en amont. Les snapshots annuels, `positions.json`, `index.json`, `verification.json` et les anciens appariements restent intacts lors d'une compilation locale de la carte.

**Interpretation :** dossier ferme ne signifie pas trou repare; une trace GPS n'est pas un decompte certifie de trous; un rapprochement spatio-temporel n'est pas une confirmation officielle; aucune correspondance ne prouve pas l'absence de reparation. Les reparations manuelles ne sont pas couvertes. La comparaison « au plus tard au dernier statut » utilise la date de dernier statut, y compris pour un dossier encore ouvert. Les horodatages sans fuseau sont affiches tels que publies; les dates UTC de verification sont affichees a l'heure de Montreal.

Le generateur existant construit deux fichiers derives : `data/nids-de-poule/carte.json` (positions, references compactes des dossiers, dates extremes, dernier colmatage et `periodesActives`) et `historique-colmatages.json` (evenements rapproches). Les periodes actives utilisent toutes les dates de signalements et de colmatages rapproches; le dernier colmatage seul ne suffit pas a retrouver les interruptions historiques. Ils sont recalcules apres une actualisation des sources ou, sans reseau, avec `npm run snapshot:potholes:map`. Une compilation identique ne les reecrit pas et ne fait pas avancer la date de verification des sources. Chaque fichier porte une version commune derivee du catalogue et du schema de carte (version 2); le worker refuse une carte ou un detail de dossier obsolete.

Le Web Worker charge uniquement l'index compact au demarrage, puis l'historique des colmatages a la premiere fiche et le fichier annuel du dossier consulte. Deux fichiers annuels au maximum restent dans son cache. Les filtres ne changent pas la chronologie globale servant au statut actuel. Seuls les points du rectangle visible sont transmis au fil principal; les marqueurs communs sont conserves au deplacement et leur rayon est ajuste au zoom. Supercluster n'est plus charge. La page reutilise Leaflet 1.9.4, OpenStreetMap et Lucide 0.468.0 et reste en ligne uniquement.

Validation des regles, des snapshots et des index derives : `npm run test:potholes` (ou `node tools/validate-potholes.mjs`). Elle controle notamment la reactivation apres colmatage, l'unicite du statut actuel, les annees actives sans nouvelle demande, les interruptions completes, la borne du 1er janvier, la chronologie, la selection vide et les rayons aux differents zooms. Aucun acces aux API municipales n'est necessaire. Pour la validation interactive, servir le depot puis ouvrir `http://localhost:5500/fr/potholes.html` ou `http://localhost:5500/en/potholes.html`; verifier annee courante par defaut, multichoix d'annees d'activite, taille des points, details, langues, petit ecran et echecs de chargement avant publication.

### Carte pietonne

La page `pedestrian.html`, disponible aussi sous `/fr/pedestrian.html` et `/en/pedestrian.html`, est distincte de la carte automobile. Les liens Auto / Pietons permettent de changer de page en gardant la langue. Elle reutilise le moteur Leaflet, les filtres de dates et de responsables, les compteurs lies a la vue et le panneau mobile. Elle ne charge aucune fermeture automobile, rue pietonnisee saisonniere ou donnee de demonstration comme entrave pietonne.

Les amenagements / travaux pietons sont orange (`#ff8c00`), comme les voies touchees de la carte auto; leur categorie reste distincte. La palette automobile ne change pas.

Les deux cartes utilisent le meme regroupement de popups (`groupPopupClosures` dans `js/app.js`). Les troncons d'une meme reference et d'une meme source sont regroupes uniquement si leurs impacts, cotes, dates, horaires et autres details sont identiques. Les directions publiees distinctes ne sont pas fusionnees. Pour Montreal auto, la description generee des limites du troncon peut varier : chaque rue, limite et description de segment reste conservee dans la fiche commune. Les permis distincts restent separes et leur reference est affichee; a defaut, la fiche affiche l'identifiant source sans pretendre qu'il s'agit d'un permis. Les geometries et enregistrements sources restent distincts dans le jeu de donnees; seul le compteur du popup compte les fiches regroupees parmi les entrees proches du clic. Le permis `OCC-2609DY18597171` affiche ainsi une seule fiche pietonne pour Ontario Est et Saint-Dominique.

Audit reproductible, serveur local actif : `node tools/validate-popup-grouping.mjs`. Il examine toutes les entrees chargees des deux cartes, controle la preservation des identites, impacts, rues, horaires, directions et geometries, puis execute des clics de geometries dans les sources ayant des regroupements actifs. Le 25 septembre 2026, le controle a porte sur 1 120 entrees pietonnes (103 groupes regroupables) et 8 001 entrees auto (124 groupes regroupables). Ce bilan global ne constitue pas un compteur d'entraves visibles; les donnees live evoluent. Les sources absentes ou en echec ne sont pas declarees verifiees par cet audit d'affichage.

La page charge uniquement [le snapshot pieton consolide](../data/pedestrian-closures-snapshot.json) via `js/pedestrian.js`, et non les flux municipaux en direct. Les cases Trottoirs / Parcs / Sentiers restent cochees dans « Zones touchees », replie par defaut. La consolidation du 25 septembre retient Montreal, Mont-Royal, Dorval, Laval et Terrebonne; une source examinee peut ne fournir aucun impact admissible. Aucune absence de resultat ne garantit un passage libre ou accessible.

Le WFS Montreal est relu sans le filtre automobile `affectedArea like '%street%'`. Le normalisateur lit `sidewalk.blockedType` et `occupancyImpactParkImpactBlockedType`. Les codes ne doivent pas etre traduits litteralement en fermetures : les avis officiels verifiés le 25 septembre 2026 affichent « Aménagement prévu pour la circulation piétonne en tout temps » pour les trottoirs `blocked` et `obstructed`, et « Travaux en cours dans le parc » pour les parcs `blocked` et `closed`. Ces entrees sont donc classees comme amenagements / travaux, pas comme passages fermes. Le champ `backSidewalk` n'est pas interprete comme un trottoir oppose : ce n'est pas la regle utilisee par les avis publics examines.

Chaque fiche Montreal pointe vers `https://montreal.ca/entraves-travaux/entraves/{permitPermitId}`. Les dates WFS sont converties dans le fuseau `America/Toronto`, et non tronquees en UTC (la fin de Gordon est le 12 novembre 2027, pas le 13). Les descriptions officielles restent dans leur langue source. La geometrie demeure celle de la source : ligne publiee, emprise de chantier ou point; elle ne prouve ni le cote du trottoir, ni un itineraire accessible. Aucun itineraire automobile ni aucune fleche directionnelle n'est genere sur cette page.

Les avis individuels et leur recherche sont bloques par CORS depuis le site statique. Leurs attributs sont livres dans `data/montreal-pedestrian-notices-snapshot.json`, produit localement par :

```bash
node tools/build-montreal-pedestrian-notices.mjs
```

Le generateur parcourt toutes les pages de l'API publique `/entraves-travaux/api/recherche`, compare les permis attendus au WFS, refuse les doublons contradictoires et consulte directement tout avis pieton manquant. Il conserve les avis actifs/futurs, les impacts structures, les descriptions complementaires lorsqu'elles sont publiees et les libelles officiels verifies dans les donnees structurees d'une page d'avis. Une extraction incomplete ne remplace pas le fichier precedent. Synchroniser ensuite son `extractedAt` dans `data/sources.js`.

Extraction du 25 septembre 2026 a 15:58:29.169 UTC : 194 pages, 1 936 resultats, 919 avis pietons actifs/futurs conserves. Un doublon identique de permis de ruelle est present dans la recherche; les avis pietons attendus sont controles contre le WFS. Aucun champ `workImpact` contenant une description particuliere n'a ete renvoye parmi ces 919 avis. Ce constat ne couvre pas les autres pages editoriales d'avis et alertes du site Montreal.ca.

Le snapshot de details enrichit seulement les permis presents dans le WFS au moment de la consolidation, sans ajouter ses propres geometries. Il n'est pas charge comme second flux d'entraves par la page. Les descriptions complementaires ne sont reprises que si les dates du permis correspondent. Les mises a jour des libelles officiels exigent une nouvelle verification, pas une supposition sur les noms des codes.

Longueuil conserve uniquement `Sentier_Ferme`, avec statut officiel en cours ou planifie (1 ou 2), dates et geometrie publiees. Le champ combine `Trottoirs_Liens_Cyclable_Inacces` n'est pas une preuve suffisante, a lui seul, d'une fermeture pietonne. Les echecs sont isoles par source lors de la consolidation et restent consultables dans le panneau Sources, sans bandeau persistant sur une carte chargee avec succes. Une panne du fichier commun reste signalee et ne charge aucune fermeture automobile de remplacement.

Validation Chromium : avis Gordon, Duquette et Percy-Walters compares aux pages officielles; filtre Parcs et popup Duquette; bascule FR/EN du popup; filtres de zones et d'impacts; compteurs au deplacement; panneau mobile; panne de Longueuil; chargement et rendu de la carte automobile. Les sources live changent a chaque visite; les nombres charges ne sont pas les nombres visibles ni necessairement actifs a la date selectionnee.

### Separation des impacts automobiles et pietons

Une piste cyclable en travaux ne constitue pas automatiquement une entrave automobile. Les normaliseurs peuvent publier `automobileImpact: false`; le chargement commun exclut alors la fiche de la carte auto uniquement. Les fiches manuelles ainsi marquees sont exclues avant toute recherche d'itineraire. Les normaliseurs restent utilisables par la consolidation pietonne. Les impacts mixtes, les voies automobiles retranchees, le stationnement et les rues temporairement pietonnisees restent admissibles sur la carte auto.

L'audit du 25 septembre 2026 a examine les candidats des 21 familles effectivement chargees sur la carte auto, puis les flux et entrees locales de la consolidation. Cinq fiches sans impact automobile documente ont ete exclues : le tunnel pieton/cyclable du Vieux-Terrebonne, la piste Comtois-Martin, la voie cyclable entre du Renard et Sainte-Rose a Laval, la piste Clark-Graham vers la gare Exo a Baie-d'Urfe et la refection de trottoir Dorval `2026-228`. Les chantiers mixtes Pierre-Dansereau, Champfleury/Parulines, les pistes de Longueuil, Industriel a Saint-Eustache et Rene-A.-Robert/Roland-Durand du MTMD ont ete conserves. La simple presence d'un mot cyclable ou pieton n'est pas une exclusion.

Le tunnel Terrebonne reste sur la carte pietonne. Dorval `2026-228` y est ajoute en orange comme travaux de trottoir, du 28 septembre au 1er octobre 2026, avec le point officiel, cote inconnu et sans fermeture supposee. La page pietonne accueille aussi les restrictions cyclables : Comtois-Martin est une fermeture cyclable rouge, l'entree Laval du Renard/Sainte-Rose un obstacle/chantier cyclable orange. Elles conservent leurs geometries officielles et `affectedUsers: ["cyclists"]`; les popups indiquent « Impact cyclable », sans affirmer une fermeture pietonne. Le filtre Sentiers / pistes cyclables les inclut. Les mentions sans restriction etablie restent en revue. Le regroupement ne fusionne pas des usagers concernes differents.

L'[avis Clark-Graham](https://baie-durfe.qc.ca/fr/nos-departements/page/info-travaux) confirme un usage cycliste et pieton, mais seulement un debut « mi-septembre 2026 », une duree d'environ six semaines et l'acces a la gare maintenu. La page pietonne l'affiche dans « Avis sans trace verifie », depuis une entree documentaire de `review` marquee `displayOnPedestrianPage`. Les anciennes dates precises et le point non justifies ont ete retires de la fiche manuelle. Cet avis n'est ni un marqueur ni une fermeture confirmee et n'entre pas dans le compteur des geometries visibles. Les periodes approximatives ne sont pas converties en dates de filtrage.

Assemblage du transfert cyclable : `2026-09-25T21:23:22.764Z`, 1 124 fiches, dont les 1 122 precedentes conservees hors `sourceCheckedAt`, et 179 candidats en revue, dont l'avis documentaire Clark-Graham affiche. Les 29 entrees sources comprennent 13 flux verifies en direct, 10 entrees locales non reverifiees et 6 echecs : cinq couches Mont-Saint-Hilaire et le flux Repentigny. Les heures de verification propres a chaque source restent dans le snapshot; aucun `extractedAt` global ou catalogue n'est avance pour cette consolidation. Les pages detaillees ne sont toujours pas toutes consultees par le generateur. L'audit ne garantit donc pas une couverture exhaustive des avis ni l'accessibilite sur le terrain.

Les liens Auto / Pietons transmettent le centre et le zoom via le parametre `mapView`, ainsi que les dates et les choix Jour / Nuit. La destination valide ces valeurs puis les restaure avant le premier affichage, sans recadrage automatique a la fin du chargement. Une premiere visite sans position transmise garde le comportement initial. La commande Recentrer reste disponible.

`node tools/validate-popup-grouping.mjs` controle aussi les exclusions par mode, les cas mixtes Terrebonne/Laval/Dorval, la distinction travaux/fermeture et la conservation des enregistrements lors des tests, sur les deux cartes.

### Outils locaux

Le site lui-même ne nécessite ni Node.js ni installation: c'est du HTML/CSS/JS statique servi tel quel. Un `package.json` est fourni uniquement pour les outils de développement (validation par navigateur automatisé). Si vous clonez le projet et voulez ces outils:

```bash
npm install
npx playwright install chromium
npm run serve
```

`npm run serve` démarre le même serveur statique local (`python -m http.server 5500`) sur `http://localhost:5500`. Le dossier `node_modules/` n'est jamais publié ni requis en production; il est exclu par `.gitignore`.

### Date de vérification des snapshots

Lors de chaque mise à jour demandée des snapshots, `extractedAt` indique la dernière vérification réussie de la source, même si aucune nouvelle donnée admissible n'est trouvée. Les métadonnées de fraîcheur correspondantes dans `data/sources.js` doivent porter la même date. Si les données sont inchangées, seuls ces horodatages sont actualisés : les enregistrements, géométries et dates publiées par les organismes restent intacts. Une consultation échouée, partielle ou limitée au cache local ne fait pas avancer la date. Cette date ne signifie ni que la source vient de publier de nouvelles données, ni que les géométries ont été reconstruites.

### Actualisation du 29 septembre 2026, 15 h UTC

Actualisation locale sans commit, push, deploiement, installation ni modification de l'interface. Les dix snapshots existants ont ete examines, avec une base de comparaison hors depot. Cinq sont identiques octet pour octet hors `extractedAt`; Mont-Royal, les avis Montreal, les geometries Montreal et la consolidation changent. Noovo reste integralement conserve faute de verification complete. Les 11 dates du catalogue concordent. Les comptes ci-dessous sont ceux de cette execution; les anciennes metadonnees autres que la fraicheur restent intactes lors des cinq mises a jour de date seulement. Heures UTC du 29 septembre, sauf indication contraire.

| Snapshot / source publique | Etat | Derniere verification reussie | Recus / retenus et exclusions | Geometries |
| --- | --- | --- | --- | --- |
| [Mont-Royal](https://montroyal.opatech.ca/#/public?city=montroyal&entraves=true&closing=true&detours=true&lang=fr) | Modifie | 15:10:35.367Z | 12 / 12 projets; aucune exclusion | 7 LineString, 5 MultiLineString |
| [Citoyens, formulaire non officiel](https://forms.gle/TKL6WkmPsWPmAUMV8) | Verifie sans changement | 15:12:27.843Z | 8 reponses, 14 colonnes lues dont 13 exportables / 9 fiches, 10 impacts; 0 reponse exclue | 3 LineString, 1 MultiLineString, 5 sans trace |
| [Rues pietonnisees Montreal, CKAN](https://donnees.montreal.ca/api/3/action/datastore_search?resource_id=ef2a8162-0644-47e7-bd03-bea33f14a5d2&limit=100) | Verifie sans changement | 15:08:28.268Z | 53 / 10 temporaires + 7 fiches manuelles; 43 modes non admissibles | 7 LineString, 3 Point; 7 lignes manuelles |
| [Avis pietons Montreal](https://montreal.ca/entraves-travaux/entraves) | Modifie | 15:11:23.404Z | 213 pages, 2 128 resultats / 1 067 avis; 1 061 hors criteres zone/date | Sans geometrie propre |
| [Geometries Montreal](https://donnees.montreal.ca/dataset/info-travaux) | Modifie | 15:14:27.390Z | 1 797 permis / 2 078 impacts; 64 anciennes identites absentes du WFS | 1 789 LineString, 3 MultiLineString, 286 emprises Polygon |
| [UCI Montreal](https://services.montreal.ca/cartes/uci) | Verifie sans changement | 15:11:25.677Z | 5 305 restrictions + 17 parcours / tous dates; aucune exclusion | 5 322 LineString |
| [Beaconsfield](https://www.beaconsfield.ca/fr/carte-interactive/info-travaux) | Verifie sans changement | 15:20:38.499Z | 6 couches, 494 objets / 241 dans 119 fiches; 253 exclus | 3 MultiLineString, 116 Polygon |
| [PJCCI archive](https://jacquescartierchamplain.ca/fr/structures/archive-des-avis-de-travaux-et-chantiers/) et [carte](https://jacquescartierchamplain.ca/fr/circulation-routiere/secteur-bonaventure/) | Verifie sans changement | 15:19:48.660Z | 144 parents / 2 parents, 9 segments; 142 parents historiques; 4 entrees carte comparees | 1 LineString, 1 MultiLineString, 7 sans trace |
| [Noovo, non officiel](https://www.noovomoi.ca/tendances/infos-pratiques/article/cyclisme-a-montreal-voici-les-rues-et-secteurs-a-eviter-en-septembre/) | Echec de verification complete | 2026-09-08, heure et fuseau absents | Article HTTP 200 consulte / 3 fiches conservees, dont 2 periodes expirees | 2 LineString, 1 sans geometrie stockee |
| [Consolidation pietonne](../data/pedestrian-closures-snapshot.json) | Modifie, verification partielle | Assemblage 15:23:28.993Z; verification par source ci-dessous | 29 entrees sources / 1 289 fiches, 178 candidats en revue | 1 277 Polygon, 5 LineString, 5 MultiLineString, 2 Point |

Mont-Royal : Graham Ouest entre Appin et Brookfield passe du 12 aout au 2 octobre a la periode officielle du 5 au 9 octobre 2026. Le texte annonce le resurfacage de la chaussee et la MultiLineString officielle est mise a jour; deux de ses quatre chemins different de la version precedente. Les 11 autres projets sont strictement identiques. La fiche pietonne correspondante conserve son impact et son cote inconnu, avec les nouvelles dates et la nouvelle geometrie.

Montreal : 1 829 impacts geometriques sont strictement conserves et 249 identites nouvelles sont traitees. Le resultat comprend 1 788 resolutions geobase, 4 lignes publiees et 286 emprises officielles. Le generateur conserve maintenant les emplacements inchanges avant tout calcul et refuse un WFS incomplet ou une erreur de recuperation geobase. Le cache existant est reutilise; 25 noms supplementaires sont traites et le cache de cette execution reste hors depot. Aucune reverification globale des anciennes geometries n'est revendiquee. Les avis ajoutent 150 permis admissibles, en retirent 115 dont 89 expires, et modifient 7 fiches; 910 restent identiques. Pagination, couverture des permis et libelles verifies; aucun doublon contradictoire ni recuperation directe, aucun `workImpact` particulier retourne.

Beaconsfield : les six details et les 494 objets KML sont compares, types textuels et coordonnees compris, sans reconstruire les geometries. Les exclusions confirment 4 echeanciers approximatifs, 107 objets termines en juillet et 142 objets lies a la date publiee invalide « 32 octobre 2026 ». PJCCI : la reponse cumulative complete de l'archive est validee par total, identifiants uniques et contenu, puis croisee avec la carte. Les deux parents et les quatre entrees carte sont inchanges. Tous les points de carte sont rattaches aux segments; le parent PEPSC reste sans correspondance de carte. Sept segments restent sans trace verifie, sans point de repli ni route inventee.

Les generateurs historiques de pietonnisation, Beaconsfield et PJCCI n'ont pas ete executes : ils reconstruiraient inutilement des fiches ou remplaceraient les interpretations validees par des dates fixes. Leurs sources ont ete controlees separement et les sorties inchangees exactement conservees. Les scripts temporaires et reponses de controle restent hors depot. Les autres generateurs ont ete executes dans une zone temporaire, puis leurs sorties validees avant remplacement local.

| Source de consolidation | Etat | Recus / retenus / revue | Verification ou extraction d'entree, UTC |
| --- | --- | --- | --- |
| Montreal | checked | 2 128 / 1 277 / 0 | 15:23:12.362Z |
| Longueuil | checked | 352 / 0 / 93 | 15:23:16.206Z |
| Dorval | checked | 588 / 2 / 11 | 15:23:17.645Z |
| Boisbriand | checked | 67 / 0 / 10 | 15:23:18.618Z |
| Saint-Eustache lignes | checked | 164 / 0 / 20 | 15:23:19.579Z |
| Saint-Eustache points | checked | 315 / 0 / 22 | 15:23:20.607Z |
| Chateauguay | checked | 39 / 0 / 0 | 15:23:21.253Z |
| L'Assomption | checked | 8 / 0 / 0 | 15:23:21.773Z |
| Terrebonne lignes | checked | 8 / 2 / 2 | 15:23:22.186Z |
| Terrebonne points | checked | 2 / 0 / 0 | 15:23:22.452Z |
| MTMD travaux | checked | 573 / 0 / 2 | 15:23:23.962Z |
| MTMD evenements | checked | 23 / 0 / 0 | 15:23:24.673Z |
| Laval | checked | 144 / 2 / 5 | 15:23:25.830Z |
| Mont-Saint-Hilaire couches 3, 4, 5, 6, 15 | failed : cinq `Invalid URL` | 0 conserve | Aucune verification reussie enregistree |
| Repentigny | failed : `fetch failed` | 0 conserve | Aucune verification reussie enregistree |
| Mont-Royal | local-snapshot, verifie en amont | 12 / 6 / 0 | 15:10:35.367Z |
| Beaconsfield | local-snapshot, verifie en amont | 119 / 0 / 0 | 15:20:38.499Z |
| PJCCI | local-snapshot, verifie en amont | 9 / 0 / 0 | 15:19:48.660Z |
| Citoyens | local-snapshot, verifie en amont | 9 / 0 / 1 | 15:12:27.843Z |
| Rues pietonnisees | local-snapshot, verifie en amont | 17 / 0 / 8 | 15:08:28.268Z |
| UCI | local-snapshot, verifie en amont | 5 305 / 0 / 0 | 15:11:25.677Z |
| Details Montreal | local-snapshot, verifie en amont | 1 067 / 0 / sans objet, enrichissement | 15:11:23.404Z |
| Noovo | local-snapshot, non reverifie | 3 / 0 / 0 | 2026-09-08, heure absente |
| Liste regionale | local-snapshot, non reverifiee | 7 / 0 / 0 | Non datee |
| Liste municipale manuelle | local-snapshot, non reverifiee | 25 / 0 / 4 | Non datee |

Les URLs exactes des 29 entrees restent dans `sources` du snapshot commun. Treize flux sont verifies en direct, dix entrees locales sont reutilisees et six flux echouent, correspondant a deux municipalites. Sept entrees locales ont ete verifiees en amont dans cette execution. Les derniers horodatages des sources en echec sont preserves; aucun ancien enregistrement admissible ne provient ici de ces six flux. `generatedAt` date seulement l'assemblage. La consolidation ajoute 164 identites et en retire 125, dont 95 expirees; 1 124 fiches communes restent identiques hors fraicheur et seule la fiche Graham change parmi les identites conservees. Ces nombres ne sont pas des nombres de nouveaux chantiers.

Limites : six fiches citoyennes restent en revue, trois fiches parentes produisent quatre impacts admissibles, aucune reponse ni geometrie citoyenne n'est recalculee. La divergence preexistante de fin Wellington entre le fichier manuel et le snapshot reste preservee selon la politique d'ajout seulement. UCI conserve ses donnees datees d'evenement, meme apres les courses. L'article Noovo annonce Parc du 4 septembre au 4 octobre, contre un debut au 7 septembre stocke; il ne confirme pas l'heure Champlain de 11 h 30. L'image fournie a l'origine n'est pas identifiee ni revalidee : aucune fraicheur Noovo n'avance. Les descriptions editoriales et pages detaillees ne sont pas parcourues exhaustivement par le consolidateur, notamment les exemples Longueuil Roland-Therrien et Louise-Gravel, non reexamines ici. Les 178 candidats restent distincts des fermetures confirmees; Clark-Graham demeure un avis documentaire sans trace verifie.

Validations : dix JSON, comptes, identifiants, references et geometries finies; conservation exacte des cinq mises a jour de fraicheur seule, des sept fiches manuelles et de Noovo; accord des 11 dates du catalogue. Les 14 colonnes citoyennes sont lues, dont 13 conservees, et l'absence du lien ou identifiant prive dans les fichiers suivis est verifiee. Le WFS incomplet simule est refuse sans ecriture. `node --check` passe sur le catalogue, le generateur modifie et les outils/chargeurs requis. Chromium teste `/index.html`, `/fr/pedestrian.html` et `/en/pedestrian.html`, ordinateur/mobile : huit snapshots auto, un seul snapshot pieton, cinq sources pietonnes avec vrais clics sur geometries et pixels canvas non vides, popups et cotes, orange/rouge, bornes de dates, filtres, zones repliees et cochees, fraicheur et panne sans repli auto. Horaires citoyens : neuf cas d'heures/bornes, filtres semaine/week-end/nuit, stationnement permanent sur la periode declaree, commentaire complet et reserves dans le popup, sans requete au tableur. Les popups Mont-Royal, Beaconsfield, PJCCI, citoyen et une ligne Montreal sont controles.

`node tools/validate-popup-grouping.mjs` passe sur 1 289 fiches pietonnes et 8 171 entrees auto chargees, sans erreur de page, avec un avertissement reseau auto. Les controles complementaires chargent 8 170 entrees auto, les flux live ayant evolue; ils passent egalement. Le reseau signale Repentigny (`ERR_CONNECTION_RESET`); des requetes de tuiles sont annulees lors des deplacements. Le premier test temporaire de couleur ponctuelle a ete corrige pour verifier `fillColor`, le contour blanc etant intentionnel; l'interface n'a pas ete modifiee. L'ancien validateur pieton n'est pas declare reussi avec ses hypotheses ARIA/filtres depassees. Les 13 avertissements Markdown des anciennes sections (MD022, MD032, MD034) restent inchanges. Captures conservees hors depot, sans transmission au chat; inspection visuelle humaine non effectuee. Cette verification des sources ne confirme pas les conditions sur le terrain.

### Actualisation du 28 septembre 2026, 22 h UTC

Actualisation locale sans commit, push, installation ni modification de l'interface. Base de comparaison conservee hors depot. Cinq snapshots sont strictement identiques hors `extractedAt`; trois snapshots d'entree et la consolidation changent. Noovo reste integralement conserve faute de verification complete. Les 11 entrees de fraicheur du catalogue correspondent aux snapshots. Les heures ci-dessous sont en UTC le 28 septembre 2026, sauf indication contraire.

| Snapshot / source publique | Etat | Derniere verification reussie | Recus / retenus et exclusions | Geometries |
| --- | --- | --- | --- | --- |
| [Mont-Royal](https://montroyal.opatech.ca/#/public?city=montroyal&entraves=true&closing=true&detours=true&lang=fr) | Verifie sans changement | 22:23:13.880Z | 12 projets / 12; aucune exclusion | 7 LineString, 5 MultiLineString |
| [Citoyens, formulaire non officiel](https://forms.gle/TKL6WkmPsWPmAUMV8) | Verifie sans changement | 22:23:18.947Z | 8 reponses, 13 champs publics / 9 fiches, 10 impacts; 0 reponse exclue | 3 LineString, 1 MultiLineString, 5 sans trace |
| [Rues pietonnisees Montreal, CKAN](https://donnees.montreal.ca/api/3/action/datastore_search?resource_id=ef2a8162-0644-47e7-bd03-bea33f14a5d2&limit=100) | Verifie sans changement | 22:23:19.769Z | 53 / 10 temporaires + 7 fiches manuelles; 43 modes non admissibles | 7 LineString, 3 Point; 7 lignes manuelles |
| [Avis pietons Montreal](https://montreal.ca/entraves-travaux/entraves) | Modifie | 22:23:53.949Z | 194 pages, 1 937 resultats / 1 032; 905 hors criteres zone/date | Sans geometrie propre |
| [Geometries Montreal](https://donnees.montreal.ca/dataset/info-travaux) | Modifie | 22:24:35.596Z | 1 634 permis / 1 893 impacts; jointure au WFS automobile | 1 631 LineString, 3 MultiLineString, 259 emprises Polygon |
| [UCI Montreal](https://services.montreal.ca/cartes/uci) | Verifie sans changement | 22:25:08.098Z | 5 305 restrictions + 17 parcours / tous dates; aucune exclusion | 5 322 LineString |
| [Beaconsfield](https://www.beaconsfield.ca/fr/carte-interactive/info-travaux) | Verifie sans changement | 22:25:15.504Z | 6 couches, 494 objets / 241 dans 119 fiches; 253 exclus pour echeanciers expires, approximatifs ou invalides | 3 MultiLineString, 116 Polygon |
| [PJCCI archive](https://jacquescartierchamplain.ca/fr/structures/archive-des-avis-de-travaux-et-chantiers/) et [carte](https://jacquescartierchamplain.ca/fr/circulation-routiere/secteur-bonaventure/) | Modifie | 22:25:51.574Z | 145 parents / 2 parents, 9 segments; 143 parents historiques; 4 entrees carte comparees | 1 LineString, 1 MultiLineString, 7 sans trace |
| [Noovo, non officiel](https://www.noovomoi.ca/tendances/infos-pratiques/article/cyclisme-a-montreal-voici-les-rues-et-secteurs-a-eviter-en-septembre/) | Echec de verification complete | 2026-09-08, heure et fuseau absents | Article HTTP 200 consulte / 3 fiches conservees; 2 des periodes stockees sont expirees | 2 LineString, 1 sans geometrie stockee |
| [Consolidation pietonne](../data/pedestrian-closures-snapshot.json) | Modifie, verification partielle | Assemblage 22:26:36.423Z; verification par source ci-dessous | 29 entrees sources / 1 250 fiches, 178 candidats en revue | 1 238 Polygon, 5 LineString, 5 MultiLineString, 2 Point |

Comparaison des donnees : les geometries Montreal conservent exactement 1 299 impacts; 594 identites nouvelles dans le WFS sont traitees et 588 anciennes ne sont plus dans ce flux. Le resultat comprend 1 630 resolutions geobase, 4 lignes publiees et 259 emprises. Le cache geobase est reutilise; aucune reverification globale des rues n'est revendiquee. Les avis Montreal ajoutent 356 permis au jeu admissible et en retirent 243, dont 226 expires; 17 autres ne sont plus dans le jeu admissible actuel. Les attributs d'impact de 51 permis et une date de debut changent. Les libelles officiels sont verifies; aucun doublon contradictoire, aucune recuperation directe et aucun `workImpact` particulier dans cette extraction.

La consolidation conserve 848 fiches identiques hors provenance de verification; une fiche conservee change de date de debut. Elle ajoute 401 identites et en retire 275, dont 257 expirees et 18 absentes du jeu admissible actuel. Ces nombres de nouvelles identites ne prouvent pas autant de nouveaux chantiers. Les dates de verification des avis dans les details correspondent a l'entree Montreal actualisee. Les fiches en echec conservent leurs derniers horodatages disponibles; ici aucun ancien enregistrement admissible ne provient des six flux en echec.

Les neuf segments PJCCI restants sont identiques a la base de comparaison. Les segments `samuel-de-champlain-uci-vers-montreal` et `jacques-cartier-uci-ralentissements`, dates jusqu'au 27 septembre, sont retires. Les deux parents restants concernent le parc d'entreprises de la Pointe-Saint-Charles et la mobilisation du secteur Bonaventure. Les quatre entrees de carte sont rattachees; le parent Pointe-Saint-Charles n'a pas de correspondance de carte. Sept segments restent sans geometrie verifiee et ne sont pas traces; les deux directions du pont Clement gardent leurs lignes verifiees. Aucun point de repli ni nouvel itineraire n'est invente.

| Source de consolidation | Etat | Recus / retenus / revue | Heure de verification ou extraction d'entree, UTC |
| --- | --- | --- | --- |
| Montreal | checked | 1 937 / 1 238 / 0 | 22:26:22.656Z |
| Longueuil | checked | 352 / 0 / 93 | 22:26:25.268Z |
| Dorval | checked | 588 / 2 / 11 | 22:26:26.833Z |
| Boisbriand | checked | 67 / 0 / 10 | 22:26:27.346Z |
| Saint-Eustache lignes | checked | 164 / 0 / 20 | 22:26:28.113Z |
| Saint-Eustache points | checked | 314 / 0 / 22 | 22:26:29.161Z |
| Chateauguay | checked | 39 / 0 / 0 | 22:26:29.796Z |
| L'Assomption | checked | 8 / 0 / 0 | 22:26:30.307Z |
| Terrebonne lignes | checked | 8 / 2 / 2 | 22:26:30.624Z |
| Terrebonne points | checked | 2 / 0 / 0 | 22:26:31.068Z |
| MTMD travaux | checked | 610 / 0 / 2 | 22:26:32.734Z |
| MTMD evenements | checked | 20 / 0 / 0 | 22:26:33.539Z |
| Laval | checked | 149 / 2 / 5 | 22:26:34.549Z |
| Mont-Saint-Hilaire couches 3, 4, 5, 6, 15 | failed : cinq `Invalid URL` | 0 conserve | Aucune verification reussie enregistree |
| Repentigny | failed : `fetch failed` | 0 conserve | Aucune verification reussie enregistree |
| Mont-Royal | local-snapshot, verifie en amont | 12 / 6 / 0 | 22:23:13.880Z |
| Beaconsfield | local-snapshot, verifie en amont | 119 / 0 / 0 | 22:25:15.504Z |
| PJCCI | local-snapshot, verifie en amont | 9 / 0 / 0 | 22:25:51.574Z |
| Citoyens | local-snapshot, verifie en amont | 9 / 0 / 1 | 22:23:18.947Z |
| Noovo | local-snapshot, non reverifie | 3 / 0 / 0 | 2026-09-08, heure absente |
| Rues pietonnisees | local-snapshot, verifie en amont | 17 / 0 / 8 | 22:23:19.769Z |
| UCI | local-snapshot, verifie en amont | 5 305 / 0 / 0 | 22:25:08.098Z |
| Liste regionale | local-snapshot, non reverifiee | 7 / 0 / 0 | Non datee |
| Liste municipale manuelle | local-snapshot, non reverifiee | 25 / 0 / 4 | Non datee |
| Details Montreal | local-snapshot, verifie en amont | 1 032 / 0 / 0, enrichissement | 22:23:53.949Z |

Les URLs exactes des 29 entrees sont dans `sources` du snapshot commun. Bilan : 13 verifications live reussies, 10 entrees locales reutilisees et 6 echecs correspondant a deux municipalites. Sept entrees locales ont ete verifiees en amont dans cette execution; Noovo reste ancien et les deux listes manuelles non datees. `generatedAt` n'est pas une verification universelle. Les 178 candidats en revue ne sont pas des fermetures confirmees; l'avis Clark-Graham reste documentaire, sans trace verifie.

Limites conservees : les trois fiches citoyennes admissibles produisent quatre impacts sur la carte, six fiches restent en revue; les huit reponses completes sont inchangees et aucune donnee de contact n'est exportee. La divergence Wellington reste preservee selon la politique d'ajout seulement. UCI garde sa politique specifique de donnees datees d'evenement, meme apres les courses. Noovo annonce toujours Parc du 4 septembre au 4 octobre, contre un debut au 7 septembre dans le snapshot; la piece image initiale n'est pas verifiee et l'heure Champlain stockee n'est pas confirmee par le texte. Le fichier Noovo et son horodatage ne sont donc pas modifies. Les pages editoriales detaillees ne sont pas parcourues systematiquement; les cas Longueuil Roland-Therrien et Louise-Gravel restent non integres. Une reponse de flux complete ne garantit pas une couverture exhaustive des avis.

Validations reussies : JSON, identites, references citoyennes, 13 champs publics, absence du lien et de l'identifiant du tableur dans les fichiers suivis, geometries finies, accord des 11 dates du catalogue et comparaison exacte des cinq actualisations de fraicheur. Syntaxe `node --check` du catalogue, de l'application et des outils requis; `git diff --check`. Chromium sur `http://localhost:5500/index.html`, FR/EN pietons ordinateur/mobile : popups des cinq sources representees, cotes, dates limites, zones repliees et cochees, orange/rouge, un seul snapshot sans appel au tableur; horaires citoyens semaine/week-end, heures limites, stationnement permanent. Panne du snapshot commun testee independamment : erreur visible et aucun repli auto. Popups Mont-Royal et PJCCI et ligne Berri rendue verifies.

Validation locale : `node tools/validate-popup-grouping.mjs` passe sur 1 250 fiches pietonnes et 8 025 auto chargees, sans erreur de page, avec un avertissement reseau auto. Le diagnostic complementaire du popup Berri a identifie un faux echec du test : la chaine interne contient « retranchees », tandis que `escapeHtml()` applique `correctFrenchText()` et affiche « retranchées » en francais. Le test temporaire compare desormais le texte corrige dans la fiche portant la bonne reference; il passe pour Berri, Mont-Royal et PJCCI. Le validateur complet repasse egalement les controles pietons FR/EN, horaires citoyens et panne du snapshot, sans erreur de page. Aucune modification de l'application, des snapshots ou de leurs horodatages pour ce diagnostic. Captures hors depot sans envoi au chat; inspection visuelle humaine non effectuee. Les limites de verification des sources ci-dessus demeurent. Cette verification des sources ne confirme pas les conditions sur le terrain.

### Actualisation du 25 septembre 2026, 22 h UTC

Execution locale sans publication ni changement d'interface. Huit snapshots d'entree sont verifies sans changement de contenu : seul `extractedAt` avance, avec les 11 entrees correspondantes du catalogue. Noovo reste integralement conserve. Les nombres recus ne sont pas des nombres d'entraves visibles.

| Snapshot / source publique | Etat | Verification du 25 septembre, UTC | Recus / retenus | Geometries conservees |
| --- | --- | --- | --- | --- |
| [Mont-Royal](https://montroyal.opatech.ca/#/public?city=montroyal&entraves=true&closing=true&detours=true&lang=fr) | Verifie sans changement | 22:00:40.309Z | 12 / 12 | 7 LineString, 5 MultiLineString |
| [Geometries Montreal](https://donnees.montreal.ca/dataset/info-travaux) | Verifie sans changement | 22:01:07.437Z | 1 617 permis / 1 887 impacts | 1 632 LineString, 3 MultiLineString, 252 Polygon |
| [UCI](https://services.montreal.ca/cartes/uci) | Verifie sans changement | 22:02:02.159Z | 5 305 restrictions + 17 parcours / tous | 5 322 LineString |
| [PJCCI archive](https://jacquescartierchamplain.ca/fr/structures/archive-des-avis-de-travaux-et-chantiers/) et [carte](https://jacquescartierchamplain.ca/fr/circulation-routiere/secteur-bonaventure/) | Verifie sans changement | 22:00:55.906Z | 148 parents / 3 parents, 11 segments; 4 entrees carte comparees | 1 LineString, 1 MultiLineString, 9 sans trace |
| [Beaconsfield](https://www.beaconsfield.ca/fr/carte-interactive/info-travaux) | Verifie sans changement | 22:02:09.711Z | 6 couches, 494 objets / 241 objets dans 119 fiches | 3 MultiLineString, 116 Polygon |
| [Rues pietonnisees Montreal, CKAN](https://donnees.montreal.ca/api/3/action/datastore_search?resource_id=ef2a8162-0644-47e7-bd03-bea33f14a5d2) | Verifie sans changement | 22:00:45.640Z | 53 / 10 temporaires + 7 fiches manuelles | 7 LineString, 3 Point; 7 lignes manuelles |
| [Avis Montreal](https://montreal.ca/entraves-travaux/entraves) | Verifie sans changement | 22:02:00.063Z | 194 pages, 1 936 resultats / 919 avis | Sans geometrie propre |
| [Formulaire citoyen](https://forms.gle/TKL6WkmPsWPmAUMV8) | Verifie sans changement, non officiel | 22:00:44.183Z | 8 reponses, 13 champs publics / 9 fiches, 10 impacts | 3 LineString, 1 MultiLineString, 5 sans trace |
| [Noovo](https://www.noovomoi.ca/tendances/infos-pratiques/article/cyclisme-a-montreal-voici-les-rues-et-secteurs-a-eviter-en-septembre/) | Verification incomplete, non officiel | Ancienne date : 2026-09-08, heure absente | Article consulte / 3 fiches conservees | 2 LineString, 1 sans geometrie stockee |
| [Consolidation pietonne](../data/pedestrian-closures-snapshot.json) | Fraicheur par source actualisee, donnees inchangees | Assemblage : 22:03:22.306Z, pas une verification universelle | 29 entrees sources / 1 124 fiches; 179 en revue | 1 112 Polygon, 5 LineString, 5 MultiLineString, 2 Point |

Les 1 124 fiches consolidees sont identiques hors `sourceCheckedAt` et date de verification des avis dans les details Montreal. Aucune geometrie reconstruite : les 1 887 geometries Montreal sont conservees; la geobase en cache n'est pas reverifiee. Les 919 avis restent identiques; la recherche a rencontre deux doublons identiques, sans recuperation directe requise. Ces comptes d'execution ne remplacent pas les anciennes metadonnees de source lors d'une actualisation de fraicheur seule.

Bilan de consolidation : heures UTC du 25 septembre; `local-snapshot` ne signifie pas reverifie par le consolidateur. Les URLs exactes de requete figurent dans `sources` du JSON.

| Source | Etat | Recus / retenus / revue | Verification ou extraction d'entree |
| --- | --- | --- | --- |
| Montreal | checked | 1 936 / 1 112 / 0 | 22:03:10.019Z |
| Longueuil | checked | 345 / 0 / 93 | 22:03:12.210Z |
| Dorval | checked | 585 / 2 / 11 | 22:03:13.256Z |
| Boisbriand | checked | 67 / 0 / 10 | 22:03:13.960Z |
| Saint-Eustache lignes | checked | 165 / 0 / 20 | 22:03:14.534Z |
| Saint-Eustache points | checked | 314 / 0 / 22 | 22:03:15.379Z |
| Chateauguay | checked | 39 / 0 / 0 | 22:03:15.901Z |
| L'Assomption | checked | 9 / 0 / 0 | 22:03:16.382Z |
| Terrebonne lignes | checked | 8 / 2 / 2 | 22:03:17.129Z |
| Terrebonne points | checked | 2 / 0 / 0 | 22:03:17.396Z |
| MTMD travaux | checked | 645 / 0 / 2 | 22:03:19.034Z |
| MTMD evenements | checked | 44 / 0 / 0 | 22:03:19.578Z |
| Laval | checked | 158 / 2 / 6 | 22:03:20.568Z |
| Mont-Saint-Hilaire couches 3, 4, 5, 6, 15 | failed, cinq `Invalid URL` | 0 conserve | Aucune verification reussie enregistree |
| Repentigny | failed, `fetch failed` | 0 conserve | Aucune verification reussie enregistree |
| Mont-Royal | local-snapshot, verifie en amont | 12 / 6 / 0 | 22:00:40.309Z |
| Beaconsfield | local-snapshot, verifie en amont | 119 / 0 / 0 | 22:02:09.711Z |
| PJCCI | local-snapshot, verifie en amont | 11 / 0 / 0 | 22:00:55.906Z |
| Citoyens | local-snapshot, verifie en amont | 9 / 0 / 1 | 22:00:44.183Z |
| Noovo | local-snapshot, non reverifie | 3 / 0 / 0 | 2026-09-08 |
| Rues pietonnisees | local-snapshot, verifie en amont | 17 / 0 / 8 | 22:00:45.640Z |
| UCI | local-snapshot, verifie en amont | 5 305 / 0 / 0 | 22:02:02.159Z |
| Liste regionale | local-snapshot, non reverifiee | 7 / 0 / 0 | Non datee |
| Liste municipale manuelle | local-snapshot, non reverifiee | 25 / 0 / 4 | Non datee |
| Details Montreal | local-snapshot, verifie en amont | 919 / 0 / 0, enrichissement | 22:02:00.063Z |

Exclusions et limites : 43 projets CKAN non temporaires; 145 parents PJCCI historiques; 253 objets Beaconsfield aux echeanciers expires, approximatifs ou invalides. Les citoyens conservent trois fiches parentes admissibles produisant quatre impacts sur la carte et six fiches en revue, sans nouvelles reponses ni geocodage. La divergence Wellington dans le fichier manuel reste documentee, pas corrigee silencieusement. Le snapshot UCI conserve sa politique specifique de donnees datees de l'evenement. Les neuf segments PJCCI sans geometrie verifiee ne sont pas traces. Les 179 candidats pietons/cyclables restent distincts des fermetures confirmees; Clark-Graham demeure un avis sans trace verifie.

Noovo : article HTTP 200 et images reperees, mais pieces visuelles non entierement validees; aucune date de fraicheur avancee. L'article annonce le debut sur Parc au 4 septembre, contre le 7 dans le snapshot; l'horaire Champlain stocke reste distinct du nouvel avis PJCCI. Le consolidateur ne consulte toujours pas systematiquement les pages detaillees, notamment les cas Longueuil Roland-Therrien et Louise-Gravel. Six echecs de flux correspondent a deux municipalites, pas six.

Validations reussies : JSON, identites, donnees inchangees hors fraicheur, accord des 11 dates du catalogue; Chromium FR/EN ordinateur/mobile, couches et popups des cinq sources pietonnes, filtres, bornes de dates, couleurs, maintien du centre/zoom; horaires citoyens semaine/week-end, heures limites et stationnement permanent; absence de requete au tableur; panne du snapshot sans repli automobile. `node tools/validate-popup-grouping.mjs` : 1 124 fiches pietonnes et 8 056 auto chargees, aucune erreur de page; un avertissement reseau auto subsiste. Captures conservees hors depot sans envoi au chat; inspection visuelle humaine non effectuee. Cette verification des donnees ne confirme pas les conditions sur le terrain.

### Bilan precedent du 25 septembre 2026, 20 h UTC

Actualisation locale terminee, sans publication. Les heures suivantes sont en UTC; les URLs publiques et les preuves restent dans chaque snapshot.

| Snapshot | Etat | Derniere verification | Recus / retenus | Geometries |
| --- | --- | --- | --- | --- |
| [Mont-Royal](../data/mont-royal-snapshot.json) | Modifie | 2026-09-25 20:32:48.165Z | 12 / 12 projets | 7 lignes, 5 multilignes |
| [Montreal geometries](../data/montreal-entraves-geometries-snapshot.json) | Modifie | 2026-09-25 20:39:42.797Z | 1 617 permis / 1 887 impacts | 1 631 lignes resolues, 4 publiees, 252 emprises |
| [UCI](../data/montreal-uci-closures-snapshot.json) | Modifie | 2026-09-25 20:34:07.016Z | 5 305 restrictions et 17 parcours / tous retenus | 5 322 lignes |
| [PJCCI](../data/pjcci-work-advisories-snapshot.json) | Modifie | 2026-09-25 20:38:57.788Z | 148 avis / 3 parents, 11 segments | 1 ligne, 1 multiligne, 9 sans trace |
| [Beaconsfield](../data/beaconsfield-snapshot.json) | Verifie sans changement | 2026-09-25 20:38:44.572Z | 494 objets / 241 dans 119 fiches | 3 multilignes, 116 polygones |
| [Rues pietonnisees auto](../data/montreal-pedestrian-snapshot.json) | Verifie sans changement | 2026-09-25 20:36:25.094Z | 53 projets / 10 temporaires, plus 7 fiches manuelles | 7 lignes et 3 points conserves; 7 lignes manuelles |
| [Avis pietons Montreal](../data/montreal-pedestrian-notices-snapshot.json) | Verifie sans changement | 2026-09-25 20:33:35.435Z | 194 pages, 1 936 resultats / 919 avis | Sans geometrie propre |
| [Signalements citoyens](../data/citizen-reports-snapshot.json) | Verifie sans changement | 2026-09-25 20:35:11.442Z | 8 reponses / 9 fiches, 10 impacts, dont 4 admissibles | 3 lignes, 1 multiligne, 5 sans trace |
| [Noovo](../data/noovo-road-closures-snapshot.json) | Verification incomplete, fichier conserve | 2026-09-08, heure absente | 3 fiches conservees | Non reverifiees |
| [Consolidation pietonne](../data/pedestrian-closures-snapshot.json) | Modifie, verification partielle | Assemblage 2026-09-25 20:41:00.136Z; verification par source | 29 entrees sources / 1 121 fiches, 159 en revue | 1 point, 4 lignes, 4 multilignes, 1 112 polygones |

La consolidation comprend 1 024 trottoirs, 96 parcs et 1 sentier. Les 1 120 fiches precedentes sont identiques hors fraicheur; une fermeture de trottoir Mont-Royal a ete ajoutee, sans cote invente. Les 13 flux verifies sont Montreal, Longueuil, Dorval, Boisbriand, Saint-Eustache lignes et points, Chateauguay, L'Assomption, Terrebonne lignes et points, MTMD travaux et evenements, et Laval. Leurs heures, comptes et URLs figurent dans `sources` du JSON. Les six echecs sont les couches Mont-Saint-Hilaire 3/4/5/6/15 (`Invalid URL`) et Repentigny (`fetch failed`), sans derniere verification reussie enregistree. Il s'agit de deux municipalites, pas six.

Les dix entrees locales reutilisees ne sont pas reverifiees par le consolidateur : Mont-Royal, Beaconsfield, PJCCI, citoyens, rues pietonnisees, UCI et details Montreal ont ete verifies en amont dans cette execution; Noovo garde sa date precedente; les listes regionales et municipales manuelles restent non datees. `generatedAt` date uniquement l'assemblage, jamais la verification globale. Regeneration : `node tools/build-pedestrian-snapshot.mjs`, serveur local et Chromium disponibles, apres les snapshots d'entree autorises.

Limites conservees : 253 objets Beaconsfield exclus pour echeanciers expires, approximatifs ou invalides, dont « 32 octobre »; six fiches citoyennes en revue, sans contacts publies; 43 projets CKAN non temporaires exclus, sans reconstruire les geometries existantes. La date Wellington du snapshot est conservee malgre une date differente dans le fichier manuel. Montreal reutilise le cache geobase : 1 483 geometries conservees et 404 emplacements traites, sans pretendre reverifier toute la geobase. Les 919 avis pietons sont inchanges; le controle a rencontre deux doublons de recherche identiques et recupere un avis directement. Seul `extractedAt` a change dans ce snapshot.

PJCCI ajoute la fermeture du pont Samuel-De Champlain vers Montreal et les ralentissements dans les deux directions sur Jacques-Cartier, les 26 et 27 septembre de 8 h a 13 h. Ces deux segments restent sans geometrie verifiee et ne sont pas traces. Les 145 parents historiques sont exclus. L'article Noovo est accessible, mais sa preuve image d'origine n'a pas ete retrouvee; des dates/horaires divergent des avis actuels. Aucune fraicheur Noovo n'a ete avancee. Les pages detaillees ne sont toujours pas examinees systematiquement par le consolidateur : les omissions Longueuil Roland-Therrien et Louise-Gravel documentees precedemment restent non integrees. Les 159 candidats comprennent 93 impacts trottoir/velo ambigus, 64 mentions sans restriction explicite et 2 cas sans dates/geometrie admissibles ou inactifs.

Validations : JSON, comptes, identifiants, geometries finies, conservation des fiches inchangees et accord des 11 entrees du catalogue; syntaxe JavaScript; Chromium FR/EN, ordinateur/mobile, popups des cinq sources pietonnes, cotes, filtres, dates limites, orange/rouge et panne sans repli auto. Horaires citoyens verifies en semaine/week-end, avant/apres fermeture, stationnement permanent et absence de requete au tableur. `node tools/validate-popup-grouping.mjs` passe sur 1 121 entrees pietonnes et 8 053 auto chargees, sans erreur de page; un avertissement reseau auto subsiste. Les controles complementaires temporaires ont adapte l'ouverture du panneau mobile; le validateur pieton historique n'est pas declare reussi avec ses anciennes hypotheses ARIA/filtres. Ces controles ne confirment pas les conditions sur le terrain.

### Snapshot des signalements citoyens

`data/citizen-reports-snapshot.json` conserve les informations transmises par le [formulaire de signalement](https://forms.gle/TKL6WkmPsWPmAUMV8), avec la source « Signalement citoyen transmis via notre formulaire ». Ce ne sont pas des avis officiels municipaux. La provenance des observations et celle des géométries sont distinctes; un tracé officiel ne confirme pas une fermeture déclarée.

Chaque réponse conserve les 13 colonnes non personnelles dans `reportedFields`, notamment le texte libre intégral après contrôle de confidentialité. La colonne de courriel et le lien du tableur des réponses ne sont jamais exportés. `startDate` et `endDate` reprennent les dates saisies, également conservées dans `reportedDates`. Les réserves du texte libre sur leur précision sont conservées et doivent être affichées : une date déclarée ou estimée n'est pas présentée comme une échéance officielle, mais cette réserve ne bloque pas à elle seule le signalement. L'horodatage de soumission sans fuseau explicite n'est pas transformé en UTC.

Le premier signalement concerne Foucher entre Chabanel Est et de Louvain Est. Il conserve un seul tracé `LineString` officiel WGS84 (segment géobase `1040221`) et deux impacts qui le référencent : fermeture du lundi au vendredi de 07:00 à 19:00, et stationnement interdit tous les jours en tout temps. Sa période déclarée est du 1er juillet au 31 octobre 2026; le commentaire précise que les dates exactes n'ont pas été communiquées et que la fin octobre est estimée. Le signalement est admissible à l'intégration (`review.mapEligible: true`), sans être un avis officiel. Le statut `reported-active` décrit seulement ce que la personne signale.

Ce snapshot est chargé par `js/app.js` et son entrée au catalogue est active (`inMap: true`), sous le filtre distinct « Signalements citoyens ». Le chargeur lit seulement le JSON local, jamais Google Sheets ni le formulaire, et isole les échecs des autres sources. Chaque impact admissible ayant une géométrie vérifiée produit une entrée distincte sans reconstruire son tracé. Le stationnement demeure décoché par défaut, comme pour les autres sources.

Les filtres de dates respectent les jours déclarés et les bornes inclusives; les filtres jour/nuit conservent les périodes propres à chaque impact. Il n'y a pas de sélecteur d'heure précise. Le popup affiche l'horaire exact, la circulation permise hors fermeture, les réserves sur les dates, le commentaire complet et l'origine non officielle. L'indication d'activité à son ouverture utilise l'heure du lieu déclaré (`America/Toronto` pour Foucher), pas le fuseau du navigateur, sans confirmer les conditions sur place. Les tests Chromium ont vérifié les deux couches `LineString`, le popup, les filtres de dates/jours/périodes, le rendu ordinateur/mobile et la page anglaise.

Pour une mise à jour, relire l'onglet de réponses fourni par le propriétaire via l'export structuré Google Sheets (`GET /spreadsheets/d/{id}/gviz/tq?gid={onglet}&headers=1&tqx=out:json`), accessible ici sans connexion via Chromium/Playwright. Valider le statut de réponse, les colonnes et toutes les lignes avant d'avancer `extractedAt`; l'accessibilité publique peut changer. Ne pas utiliser `eval` pour lire la réponse Google Visualization. Revoir toutes les colonnes ensemble, les contradictions et les données personnelles dans le texte libre. Vérifier les limites contre une géométrie publiée, contrôler les doublons et conserver les identifiants des signalements déjà connus. Aucun import automatique ni générateur n'est encore branché pour cette source.

Une réponse expirée ne doit pas devenir une entrave affichée. Une date saisie valide peut servir de borne déclarée, en conservant toute réserve du texte libre; une date absente ou invalide ne doit pas être inventée. Une vérification partielle ou échouée laisse le fichier et sa date inchangés. Toute mise à jour réussie doit synchroniser le catalogue et vérifier le JSON, les horaires distincts, les incertitudes et l'absence de données personnelles; l'activation ultérieure exige les tests Chromium des couches, popups et filtres de dates/horaires.

L'accès stable au tableur est mémorisé hors dépôt dans `%LOCALAPPDATA%/CarteEntraves/citizen-reports-source.json`, champ `responseSheetUrl`. L'agent doit lire cette configuration avant de redemander le lien. Ne jamais publier son contenu. À chaque vérification, comparer les réponses complètes avant tout calcul : les fiches inchangées, leurs horaires, leur revue, leur géométrie et leur provenance restent exactement conservés. Seuls les éléments nouveaux ou réellement modifiés sont à traiter.

La vérification du 18 septembre 2026 à 14:21:58.965 UTC conserve les 7 réponses et leurs 13 colonnes non personnelles dans 8 fiches, sans suppression ni fusion. Foucher est inchangé. Une réponse LaSalle est séparée en deux fiches avec la même `submissionRef` : fermeture complète entre Rielle et Gordon, et entrave partielle entre Rielle et Willibrord avec circulation vers l'ouest seulement. Les deux horaires déclarés sont 24/24; aucune fin n'est saisie. Leurs tracés exacts proviennent des segments géobase `1601305` et `1601458`, vérifiés à Verdun, sans confirmation officielle des restrictions.

Les 9 impacts conservés comprennent 4 impacts admissibles à la carte. Cinq réponses restent conservées pour revue mais hors carte : Saint-Hubert/Saint-Grégoire, MacArthur/Griffith/Ness, Boyer/Villeray/du Rosaire et Barry à Brossard n'établissent pas un maintien actuel sans dates; LaSalle/Gordon/2e Avenue conserve ses dates déclarées et sa géométrie vérifiée, mais son horaire est absent. La page municipale de cette dernière confirme le chantier et une période approximative, pas une fermeture complète continue. `retainedResponseCount` compte les réponses; `retainedRecordCount` compte les fiches, y compris celles en attente; `mapEligibleRecordCount`, `pendingReviewRecordCount` et `mapEligibleImpactCount` distinguent leur admissibilité. Aucune heure manquante n'est assimilée à une fermeture permanente.

La vérification complète du 22 septembre 2026 à 19:06:24.874 UTC conserve les sept réponses précédentes exactement et ajoute une huitième réponse, soit neuf fiches et dix impacts au total. Le nouveau signalement McArthur/Griffith est conservé hors carte : la municipalité saisie est Dorval, tandis que la voie est décrite à Saint-Laurent; aucune géométrie n'est déduite de l'autre réponse MacArthur/Griffith/Ness. Son horaire déclaré 24/24 est conservé, ses dates de travaux restent absentes et le texte du champ lien n'est pas transformé en URL. Six fiches restent en attente de revue et quatre impacts sont admissibles à la carte. Aucun rapprochement n'a fusionné les réponses et aucune donnée de contact n'est publiée.

### Snapshot UCI 2026

Pour conserver une copie locale de toutes les restrictions, fermetures et segments de parcours publies dans la [carte UCI de Montreal](https://services.montreal.ca/cartes/uci), executez:

```bash
npm run snapshot:montreal-uci
```

La commande ecrit `data/montreal-uci-closures-snapshot.json`. Le fichier conserve les deux couches WFS officielles brutes: `restrictions` et `routes`, avec leurs attributs et geometries GeoJSON. Il doit etre regenere pour refleter toute mise a jour de la Ville.

Pour reproduire le filtre par date de la carte UCI, passez la date voulue au generateur:

```bash
node tools/build-montreal-uci-snapshot.mjs --date=2026-09-22
```

Une restriction est incluse lorsque cette date est comprise entre sa date de debut et sa date de fin inclusivement; un parcours est inclus lorsque sa date correspond. Comme la carte officielle, le generateur exclut les entites sans dates publiees: elles ne sont affichees par aucune journee du selecteur UCI. `selectedDate` indique la date appliquee dans le snapshot. La commande `npm run snapshot:montreal-uci` sans argument conserve toutes les donnees datees affichees par la carte.

### Snapshot Montréal analysé

Le snapshot Montréal est mis a jour avec:

```bash
npm run snapshot:montreal
```

Cette commande relit le flux officiel des entraves, analyse chaque impact de rue individuellement, conserve les bornes publiees, la largeur, la longueur, le caractere arteriel, les impacts trottoir/velo/transport collectif et le nombre de places touchees, puis resout la geometrie. Les lignes reconstruites sont acceptees seulement si elles touchent l'emprise officielle; sinon, l'emprise polygonale est conservee.

Le champ `analysis` du fichier `data/montreal-entraves-geometries-snapshot.json` fournit les compteurs par type brut et par classification automobile, ainsi que les avertissements a relire avant publication. Une classification corrigee par un detail officiel est explicitement marquee dans `analysis.warnings`; elle ne doit pas etre assimilee automatiquement a une fermeture complete.

Au demarrage de la carte, les snapshots locaux UCI, Montréal, PJCCI, Noovo, piétonnisation, Mont-Royal et Beaconsfield sont charges en premier comme base de secours locale. Les APIs en direct sont ensuite appelees pour ajouter les donnees regionales et les mises a jour disponibles. Ainsi, une indisponibilite reseau ne vide pas la carte et ne remplace pas les snapshots par le seul jeu historique de `data/closures.js`.

Les avis PJCCI sont analyses par sous-sections: un segment distinct est cree pour chaque entrave decrite, et les directions sont separees lorsqu'elles ont un impact different. Un commentaire commun a plusieurs bullet points est conserve dans chaque popup concerne. Les dates d'une sous-section sont conservees independamment des dates generales de l'avis; une date de fin approximative reste explicitement indiquee comme telle dans le detail.

Chaque mise a jour PJCCI croise deux sources: l'archive des avis pour le texte, les secteurs, les directions et les dates detaillees, et la carte interactive du secteur Bonaventure pour les coordonnees, identifiants et dates generales des entraves geolocalisees. Le snapshot conserve les entrees brutes de la carte dans `interactiveMapEntraves` et les controles dans `validation`; une entrave de la carte non appariee est signalee au lieu d'etre ignoree silencieusement.

Politique geometrique PJCCI: aucune coordonnee n'est devinee a partir d'un titre, d'un secteur ou d'un itineraire OSRM generique. Une geometrie est acceptee seulement si elle est publiee par la source, provient d'un axe OSM nomme et verifie, ou correspond a un point fourni par la carte interactive PJCCI. Sinon, l'avis est marque sans geometrie et n'est pas dessine sur la carte.

## Publication avec GitHub Pages

1. Creez un depot GitHub et envoyez le contenu de ce dossier a sa racine.
2. Dans **Settings > Pages**, choisissez **Deploy from a branch**.
3. Selectionnez la branche `main` et le dossier `/(root)`.

GitHub Pages publie directement `index.html`, `faq.html`, les dossiers `css`, `js`, `data`, `languages`, `fr`, `en` et `404.html`. Aucun serveur Python ou Node.js n'est requis. La page `404.html` redirige les chemins inconnus vers l'application.

Le catalogue partagé des sources se trouve dans `data/sources.js`. Il alimente le panneau Sources de la carte et le tableau de la section Sources du FAQ; toute nouvelle source ajoutée à ce catalogue apparaît automatiquement dans les deux endroits.
Chaque entrée possède aussi le drapeau `inMap`; le FAQ n'affiche dans sa section des sources utilisées que les entrées dont `inMap` vaut `true`. Les pages, PDF et sources candidates conservés pour documentation restent à `false` jusqu'à leur intégration réelle dans la carte.

## Langues

La carte et le FAQ sont disponibles en français et en anglais avec le bouton `FR` / `EN`. Les traductions de l'interface se trouvent dans `languages/fr.js` et `languages/en.js`, et le moteur de bascule se trouve dans `js/i18n.js`. La langue choisie est conservée dans le navigateur.

Les liens partageables sont disponibles directement sous `fr/` et `en/`, par exemple `http://localhost:5500/fr/`, `http://localhost:5500/en/`, `http://localhost:5500/fr/faq.html` et `http://localhost:5500/en/faq.html`. Le même format fonctionne sur GitHub Pages et le domaine public.

Les textes provenant directement des organismes publics restent dans leur langue originale afin de préserver leur exactitude et leur traçabilité. Les libellés produits par l'application, comme les filtres, les titres, les messages d'état et les étiquettes de popup, sont traduits par les catalogues de langue. Une traduction automatique des descriptions officielles pourrait modifier une direction, une limite ou une nuance importante; elle ne sera ajoutée que si une traduction officielle ou une couche de traduction vérifiée est disponible.

Les sources externes restent liées à leurs pages officielles. L'application ne devine pas un chemin anglais qui pourrait être invalide: les sites qui offrent leur propre bouton de langue peuvent être basculés directement depuis leur page source.

## Ce qui est inclus

- Vraie carte interactive couvrant la grande region metropolitaine de Montreal.
- Pan/zoom fluide avec les controles natifs de Leaflet.
- Bouton de localisation près du zoom (icône Lucide Locate Fixed) : demande ponctuelle au clic, avec autorisation du navigateur, recentrage animé au zoom 16 (échelle affichée de 100 m dans la région de Montréal), point et cercle de précision réelle. Une position de moins de 30 secondes peut être réutilisée par le navigateur pour réduire l'attente; la haute précision reste demandée. Le déplacement dure environ 0,8 seconde et respecte la préférence de réduction des animations. Le zoom manuel reste libre. Aucun suivi continu ni stockage des coordonnées par l'application. HTTPS ou localhost requis; les tuiles OpenStreetMap sont chargées pour la zone affichée. Les refus et erreurs sont indiqués en FR/EN.
- Filtres par date, recherche texte et categories.
- Les fiches d'entraves actives contiennent un lien vers leur source, ouvrant un nouvel onglet sans recentrer la carte. Les fiches et les popups partagent l'affichage des horaires publiés : jours et heures de Montréal, heures de début/fin MTMD, intervalles Open511 de Repentigny (heure de Montréal), horaires textuels de Terrebonne et Boisbriand. Les horaires récurrents restent distincts des dates générales du chantier; aucune heure n'est ajoutée à une date seule.
- Sections du menu repliables au clic ou au clavier (dates, moment des travaux, sources, impacts et liste), sans réinitialiser les filtres. Les sections Type d'impact et Entraves actives sont ouvertes par défaut.
- Recherche visible au-dessus des dates, par rue, quartier/arrondissement et municipalité dans les entraves chargées, sans distinction d'accents ou de tirets, avec combinaison des mots et recentrage des résultats. Les filtres de date et d'impact restent appliqués; aucun géocodage de lieux sans entrave n'est effectué.
- Hauteur mobile adaptée à la zone visible du navigateur (`100dvh`) et recalcul de la taille Leaflet lors des changements de dimensions.
- Lien « Commentaires? » / « Comments? » dans les menus de la carte et de la FAQ, vers le formulaire de commentaires existant.
- Chargement en direct du WFS officiel des entraves de la Ville de Montreal.
- Chargement en direct des restrictions de circulation UCI 2026 par date.
- Chargement en direct des entraves de Longueuil depuis son FeatureServer public, avec surfaces et localisations filtrees pour les impacts auto.
- Ajout des fermetures majeures Mobilité Montréal pour les ponts, tunnels et grands axes lorsque ces entraves ne sont pas dans le flux municipal.
- Chargement en direct du GeoJSON MTMD publie sur Donnees Quebec pour les travaux routiers Quebec 511, avec géométries lineaires, directions, dates, entraves et détours officiels. Le flux est relu a chaque rafraichissement de la page.
- Chargement en direct des événements Open511 de Repentigny, avec événements actifs dates, limites routieres, impacts, detours et geometries LineString officielles.
- Chargement en direct des entraves ArcGIS de Saint-Eustache (lignes et points), de Châteauguay (polygones) et de L'Assomption (incidents ponctuels), avec filtrage des travaux termines, expires ou sans impact automobile.
- Chargement en direct des entraves actives de Dorval et des travaux dates de Boisbriand depuis leurs couches ArcGIS officielles, avec geometries ponctuelles et filtrage des enregistrements historiques ou de test.
- Chargement en direct des entraves Terrebonne depuis ses couches ArcGIS publiques de lignes et points, avec statut actif, dates, types d'entrave, horaires, circulation et détours publiés.
- Chargement en direct des travaux Mont-Saint-Hilaire depuis ses couches ArcGIS publiques de lignes, polygones et points, avec projets, tronçons, nature, échéanciers saisonniers et géométries officielles.
- La carte Mont-Royal expose bien des projets publiés, mais son endpoint `POST /public/get_projects` refuse les requêtes cross-origin depuis ce site statique (CORS/preflight); il reste documentaire tant qu'une couche publique CORS-compatible n'est pas fournie.
- Un snapshot statique Mont-Royal est conservé dans `data/mont-royal-snapshot.json`, extrait le 7 septembre 2026 depuis la réponse officielle. Il conserve uniquement les entraves actives ou futures à la date d'extraction; il n'est pas temps réel et doit être régénéré pour refléter les nouveaux projets. Les impacts publiés (fermeture, voie, stationnement, circulation locale, détour) sont conservés.
- Chargement en direct des projets publics de Mont-Royal via son endpoint officiel `public/get_projects`, avec dates, descriptions d'impact et géométries polyline publiées par la carte.
- Quand une source municipale ne publie qu'un point mais fournit explicitement un nom de rue, la carte tente de récupérer uniquement les segments nommés correspondants et conserve une MultiLineString; les points sans axe publié restent des points officiels plutôt qu'une diagonale inventée.
- Les descriptions qui publient plusieurs rues (par exemple « rues A, B et C ») sont séparées en requêtes de rues nommées indépendantes; les segments retournés restent séparés dans une MultiLineString.
- Chargement en direct des entraves de Laval avec leur géométrie officielle. La recherche standard de son MapServer retourne `geometry: null`, mais son opération `identify` appliquée à une enveloppe couvrant tout le territoire renvoie chaque entrave avec son tracé, ses dates, son type d'entrave, la circulation, la nature des travaux, le responsable et la référence, en une seule requête. Laval est donc affichée, filtrée et consultée exactement comme les autres sources, sans image serveur ni requête supplémentaire au déplacement.
- Filtres Jour/Nuit, avec la nuit definie comme toute entrave qui touche la plage 23 h à 5 h.
- Section de sources travaux pour les 15 municipalites independantes de l'ile de Montreal qui ne sont pas toujours couvertes par le WFS de la Ville de Montreal.
- Travaux concrets extraits des pages accèssibles de certaines villes liées, dont Baie-d'Urfe, Dollard-des-Ormeaux, Dorval, Hampstead, Kirkland, Pointe-Claire et Westmount, puis alignes aux rues avec OSRM quand une rue ou un axe est exploitable.
- Affichage des segments lineaires avec fleches de direction lorsque la géométrie officielle est une ligne.
- Les fleches sont reduites automatiquement sur les vues tres denses, puis reapparaissent au zoom pour garder la carte lisible.
- Affichage des zones de travaux en polygones lorsque la Ville publie une zone d'occupation plutot qu'un axe lineaire.
- Donnees exemples dans `data/closures.js` utilisees seulement comme secours si les APIs publiques ne repondent pas.
- PJCCI publie des avis structures pour les ponts Jacques-Cartier, Samuel-De Champlain, Honoré-Mercier et le secteur Bonaventure. Le générateur conserve uniquement les avis dont la date de fin est aujourd'hui ou future; les avis expirés ne sont pas chargés dans la carte.
- Les autres liens municipaux du catalogue `data/sources.js` documentent des pages, cartes ou services candidats; ils ne sont pas charges automatiquement tant qu'une reponse structuree, datee, automobile et geometrique n'a pas ete verifiee.
- Les pages HTML et PDF municipales sont conservees comme sources documentaires lorsqu'elles publient des avis officiels; elles ne deviennent pas automatiquement des entraves cartographiques sans dates, impact automobile et geometrie verifiables.
- Les KML Beaconsfield et McMasterville sont catalogues comme sources geographiques documentaires; ils ne sont pas actifs dans la carte tant que leurs dates/statuts d'entrave ne sont pas publies de facon exploitable.

## Sources publiques a brancher

- [Ville de Montreal - Info entraves et travaux](https://montreal.ca/entraves-travaux/)
- [Service Info entraves et travaux](https://montreal.ca/services/info-entraves-et-travaux)
- [Mobilité Montréal](https://mobilitemontreal.gouv.qc.ca/fermetures-majeures/)
- [Quebec 511](https://www.quebec511.info/fr/Carte/Default.aspx)
- [Données Québec - Travaux routiers MTMD](https://www.donneesquebec.ca/recherche/dataset/travaux-routiers)
- [Laval Info-Travaux](https://vl.maps.arcgis.com/apps/instant/sidebar/index.html?appid=729ff9eeb851437b9a4cf365efadfe8f)
- [Longueuil - travaux routiers](https://www.longueuil.quebec/fr/travaux-routiers)
- [Montreal 2026](https://www.montreal2026.org/planifiéz-vos-déplacements/)

## Municipalites independantes de l'ile

- [Baie-d'Urfe - Info-travaux](https://baie-durfe.qc.ca/fr/nos-departements/page/info-travaux/)
- [Beaconsfield - Construction et travaux publics](https://www.beaconsfield.ca/)
- [Cote-Saint-Luc - Projects and plans](https://cotesaintluc.org/en/municipal-documents/projects-and-plans/)
- [Dollard-des-Ormeaux - Travaux publics / Info-travaux](https://ville.ddo.qc.ca/)
- [Dorval - Travaux et infrastructures](https://www.ville.dorval.qc.ca/)
- [Hampstead - Public Works](https://www.hampstead.qc.ca/)
- [Kirkland - Travaux publics](https://www.ville.kirkland.qc.ca/)
- [L'Ile-Dorval - Avis municipaux](https://www.iledorval.com/)
- [Montreal-Est - Avis et travaux municipaux](https://ville.montreal-est.qc.ca/)
- [Montreal-Ouest - Avis et travaux municipaux](https://montreal-west.ca/)
- [Ville de Mont-Royal](https://www.ville.mont-royal.qc.ca/)
- [Pointe-Claire](https://www.pointe-claire.ca/)
- [Sainte-Anne-de-Bellevue](https://www.sadb.qc.ca/)
- [Senneville](https://www.ville.senneville.qc.ca/)
- [Westmount - Roadwork and Projects](https://westmount.org/en/urban-planning-and-infrastructure/roads-and-public-works/roadwork-and-projects)

## Sources de Données Validées (Phase 2 - 7 septembre 2026)

### Couverture Actuelle
- **Montreal (Agglomération):** 100% couverture via WFS + CKAN Montreal + restrictions UCI 2026
- **Laval:** 100% couverture via ArcGIS Laval (3 couches) + Données Québec
- **Longueuil:** 100% couverture via ArcGIS Longueuil (points et surfaces)
- **Couronne Nord/Sud:** ~0% (données fragmentées, Phase 3 en cours)
- **Total CMM:** ~27% couverture actuelle (24/88 municipalités validées)

### Endpoints API Validés (HTTP 200)
1. **Montreal WFS:** https://api.montreal.ca/api/it-platforms/geomatic/wfs-maps/montreal/ows (entraves ponctuelles)
2. **Montreal UCI:** https://api.montreal.ca/api/it-platforms/geomatic/wfs-feature/v1/ls-montreal/ (restrictions 2026)
3. **Montreal CKAN:** https://donnees.montreal.ca/api/3 (portail de données)
4. **Longueuil ArcGIS:** https://geomatique.longueuil.quebec/public/rest/services/Communication/Gestion_des_entraves_Diffusion/FeatureServer
5. **Laval ArcGIS:** https://gis.laval.ca/arcgis/rest/services/ing/Obstruction_14_jours/MapServer (operation `identify` avec `returnGeometry=true` pour obtenir les traces officiels)
6. **Quebec 511 WFS:** https://ws.mapserver.transports.gouv.qc.ca/swtq (travaux routiers provinciaux)
7. **Données Québec API:** https://www.donneesquebec.ca/api/3 (accès provincial aux datasets)

### Limitations Connues
- **Couronne Nord (26 villes):** Aucune source centralisée identifiée
- **Couronne Sud (39 villes):** Aucune source centralisée identifiée
- **Solution Phase 3:** Recherche Données Québec par MRC (nécessite recherche individuelle par municipalité)
- Les APIs CKAN disposent de fallback inclus dans le code pour résilience

## Performance et cache de session

La carte conserve en mémoire toutes les entraves chargées, mais ne dessine que celles qui touchent la vue courante (avec une marge autour de l'écran). Les entraves hors écran restent disponibles et apparaissent dès que la carte se déplace vers leur secteur; les filtres, les compteurs et la liste continuent de porter sur l'ensemble des données chargées.

Les flux officiels d'entraves (Montréal, Laval, Longueuil, MTMD, municipalités) restent relus à chaque ouverture ou actualisation de la page afin de préserver la fraîcheur des données. Seules les géométries déterministes retournées par les services d'appui (OSRM et Overpass/OpenStreetMap) sont conservées dans le `sessionStorage` du navigateur pour éviter de refaire les mêmes calculs pendant la session. Ce cache est propre à chaque session du navigateur: une nouvelle session repart sans cache et recharge les géométries.

## Géométrie des entraves publiées en points

Plusieurs sources municipales publient un point accompagné d'un texte qui précise les limites du chantier, par exemple « entre la rue A et la rue B » ou « de la rue A à la rue B ». Quand ces limites sont publiées, la carte récupère la géométrie de la rue nommée dans OpenStreetMap (Overpass) et conserve uniquement le tronçon situé entre les deux rues transversales. Nominatim n'est plus utilisé: il est bloqué par CORS depuis un site statique.

Règles appliquées pour ne rien inventer:

- les tronçons OSM ne sont raccordés que lorsqu'ils se touchent réellement, donc jamais de diagonale entre deux extrémités éloignées;
- si une seule limite est trouvée, les segments de la rue nommée sont conservés en `MultiLineString` sans découpage;
- si la rue nommée est introuvable, le point officiel de la source est conservé;
- une adresse civique sans limites publiées reste un point, car la source décrit un lieu précis et non un tronçon;
- si le service de géométrie est indisponible, la carte conserve les points officiels et continue de fonctionner normalement.

## Sources affichees dans le FAQ

Le catalogue partage `data/sources.js` porte un drapeau `inMap` par entree. Le FAQ n'affiche dans son tableau que les entrees `inMap: true`, c'est-a-dire les services reellement charges par la carte et les pages officielles citees comme origine d'une entrave affichee. Le fond de carte OpenStreetMap et les services de geometrie OSRM et Overpass y figurent aussi, puisqu'ils contribuent a ce qui est dessine. Les pages, PDF, KML et services candidats restent catalogues avec `inMap: false` tant qu'ils ne sont pas charges.

## Note importante

Les flux live publics peuvent changer de schema ou etre temporairement indisponibles. Les données Quebec 511 proviennent du GeoJSON public MTMD diffuse sur Donnees Quebec et sont rechargees a chaque ouverture ou actualisation de l'application.
