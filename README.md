# Carte des entraves auto du Grand Montreal

Application statique pour visualiser les fermetures de rues, voies retranchees, autoroutes, ponts, viaducs et restrictions qui compliquent les déplacements en auto dans la region metropolitaine de Montreal, y compris Montreal, Laval, Longueuil, la Rive-Sud, la Rive-Nord et les grands axes de la grande region.

## Utilisation

La carte est une application statique. Depuis la racine du projet, démarrez le serveur local avec `python3 -m http.server 5500`, puis ouvrez `http://localhost:5500/index.html`. Vous pouvez aussi utiliser l'extension Live Server de VS Code en configurant son port sur `5500`. La commande standard du projet est donc `python3 -m http.server 5500`, et il faut tester sur `localhost:5500`, pas sur un autre port. Elle utilise Leaflet avec le fond OpenStreetMap standard et des données GeoJSON officielles.

## Développement local (optionnel)

Le site lui-même ne nécessite ni Node.js ni installation: c'est du HTML/CSS/JS statique servi tel quel. Un `package.json` est fourni uniquement pour les outils de développement (validation par navigateur automatisé). Si vous clonez le projet et voulez ces outils:

```bash
npm install
npx playwright install chromium
npm run serve
```

`npm run serve` démarre le même serveur statique local (`python3 -m http.server 5500`) sur `http://localhost:5500`. Le dossier `node_modules/` n'est jamais publié ni requis en production; il est exclu par `.gitignore`.

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
- Filtres par date, recherche texte et categories.
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
- Chargement en direct des attributs Laval Info-Travaux et affichage des lignes officielles depuis son MapServer public.
- Filtres Jour/Nuit, avec la nuit definie comme toute entrave qui touche la plage 23 h à 5 h.
- Section de sources travaux pour les 15 municipalites independantes de l'ile de Montreal qui ne sont pas toujours couvertes par le WFS de la Ville de Montreal.
- Travaux concrets extraits des pages accèssibles de certaines villes liées, dont Baie-d'Urfe, Dollard-des-Ormeaux, Dorval, Hampstead, Kirkland, Pointe-Claire et Westmount, puis alignes aux rues avec OSRM quand une rue ou un axe est exploitable.
- Affichage des segments lineaires avec fleches de direction lorsque la géométrie officielle est une ligne.
- Les fleches sont reduites automatiquement sur les vues tres denses, puis reapparaissent au zoom pour garder la carte lisible.
- Affichage des zones de travaux en polygones lorsque la Ville publie une zone d'occupation plutot qu'un axe lineaire.
- Donnees exemples dans `data/closures.js` utilisees seulement comme secours si les APIs publiques ne repondent pas.
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
5. **Laval ArcGIS:** https://gis.laval.ca/arcgis/rest/services/ing/Obstruction_14_jours/MapServer
6. **Quebec 511 WFS:** https://ws.mapserver.transports.gouv.qc.ca/swtq (travaux routiers provinciaux)
7. **Données Québec API:** https://www.donneesquebec.ca/api/3 (accès provincial aux datasets)

### Limitations Connues
- **Couronne Nord (26 villes):** Aucune source centralisée identifiée
- **Couronne Sud (39 villes):** Aucune source centralisée identifiée
- **Solution Phase 3:** Recherche Données Québec par MRC (nécessite recherche individuelle par municipalité)
- Les APIs CKAN disposent de fallback inclus dans le code pour résilience

## Note importante

Les flux live publics peuvent changer de schema ou etre temporairement indisponibles. Les données Quebec 511 proviennent du GeoJSON public MTMD diffuse sur Donnees Quebec et sont rechargees a chaque ouverture ou actualisation de l'application.
