# Carte des entraves auto du Grand Montreal

Application statique pour visualiser les fermetures de rues, voies retranchees, autoroutes, ponts, viaducs et restrictions qui compliquent les déplacements en auto dans la region metropolitaine de Montreal, y compris Montreal, Laval, Longueuil, la Rive-Sud, la Rive-Nord et les grands axes de la grande region.

## Utilisation

La carte est une application statique. Depuis la racine du projet, démarrez le serveur local avec `python -m http.server 5500`, puis ouvrez `http://localhost:5500/index.html`. Vous pouvez aussi utiliser l'extension Live Server de VS Code en configurant son port sur `5500`. La commande standard du projet est donc `python -m http.server 5500`, et il faut tester sur `localhost:5500`, pas sur un autre port. Elle utilise Leaflet avec le fond OpenStreetMap standard et des données GeoJSON officielles.

## Développement local (optionnel)

Le site lui-même ne nécessite ni Node.js ni installation: c'est du HTML/CSS/JS statique servi tel quel. Un `package.json` est fourni uniquement pour les outils de développement (validation par navigateur automatisé). Si vous clonez le projet et voulez ces outils:

```bash
npm install
npx playwright install chromium
npm run serve
```

`npm run serve` démarre le même serveur statique local (`python -m http.server 5500`) sur `http://localhost:5500`. Le dossier `node_modules/` n'est jamais publié ni requis en production; il est exclu par `.gitignore`.

### Date de vérification des snapshots

Lors de chaque mise à jour demandée des snapshots, `extractedAt` indique la dernière vérification réussie de la source, même si aucune nouvelle donnée admissible n'est trouvée. Les métadonnées de fraîcheur correspondantes dans `data/sources.js` doivent porter la même date. Si les données sont inchangées, seuls ces horodatages sont actualisés : les enregistrements, géométries et dates publiées par les organismes restent intacts. Une consultation échouée, partielle ou limitée au cache local ne fait pas avancer la date. Cette date ne signifie ni que la source vient de publier de nouvelles données, ni que les géométries ont été reconstruites.

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
