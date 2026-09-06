# Carte des entraves auto du Grand Montreal

Application statique pour visualiser les fermetures de rues, voies retranchees et restrictions qui compliquent les déplacements en auto dans la region de Montreal, Laval et Longueuil.

## Utilisation

La carte est une application statique. Depuis la racine du projet, démarrez le serveur local avec `python3 -m http.server 5500`, puis ouvrez `http://localhost:5500/index.html`. Vous pouvez aussi utiliser l'extension Live Server de VS Code en configurant son port sur `5500`. La commande standard du projet est donc `python3 -m http.server 5500`, et il faut tester sur `localhost:5500`, pas sur un autre port. Elle utilise Leaflet avec le fond OpenStreetMap standard et des données GeoJSON officielles.

## Publication avec GitHub Pages

1. Creez un depot GitHub et envoyez le contenu de ce dossier a sa racine.
2. Dans **Settings > Pages**, choisissez **Deploy from a branch**.
3. Selectionnez la branche `main` et le dossier `/(root)`.

GitHub Pages publie directement `index.html`, `faq.html`, les dossiers `css`, `js`, `data`, `languages`, `fr`, `en` et `404.html`. Aucun serveur Python ou Node.js n'est requis. La page `404.html` redirige les chemins inconnus vers l'application.

Le catalogue partagé des sources se trouve dans `data/sources.js`. Il alimente le panneau Sources de la carte et le tableau de la section Sources du FAQ; toute nouvelle source ajoutée à ce catalogue apparaît automatiquement dans les deux endroits.

## Langues

La carte et le FAQ sont disponibles en français et en anglais avec le bouton `FR` / `EN`. Les traductions de l'interface se trouvent dans `languages/fr.js` et `languages/en.js`, et le moteur de bascule se trouve dans `js/i18n.js`. La langue choisie est conservée dans le navigateur.

Les liens partageables sont disponibles directement sous `fr/` et `en/`, par exemple `http://localhost:5500/fr/`, `http://localhost:5500/en/`, `http://localhost:5500/fr/faq.html` et `http://localhost:5500/en/faq.html`. Le même format fonctionne sur GitHub Pages et le domaine public.

Les textes provenant directement des organismes publics restent dans leur langue originale afin de préserver leur exactitude et leur traçabilité. Les libellés produits par l'application, comme les filtres, les titres, les messages d'état et les étiquettes de popup, sont traduits par les catalogues de langue. Une traduction automatique des descriptions officielles pourrait modifier une direction, une limite ou une nuance importante; elle ne sera ajoutée que si une traduction officielle ou une couche de traduction vérifiée est disponible.

Les sources externes restent liées à leurs pages officielles. L'application ne devine pas un chemin anglais qui pourrait être invalide: les sites qui offrent leur propre bouton de langue peuvent être basculés directement depuis leur page source.

## Ce qui est inclus

- Vraie carte interactive centrée sur Montreal.
- Pan/zoom fluide avec les controles natifs de Leaflet.
- Filtres par date, recherche texte et categories.
- Chargement en direct du WFS officiel des entraves de la Ville de Montreal.
- Chargement en direct des restrictions de circulation UCI 2026 par date.
- Chargement en direct des entraves de Longueuil depuis son FeatureServer public, avec surfaces et localisations filtrees pour les impacts auto.
- Ajout des fermetures majeures Mobilité Montréal pour les ponts, tunnels et grands axes lorsque ces entraves ne sont pas dans le flux municipal.
- Chargement en direct du GeoJSON MTMD publie sur Donnees Quebec pour les travaux routiers Quebec 511, avec géométries lineaires, directions, dates, entraves et détours officiels. Le flux est relu a chaque rafraichissement de la page.
- Chargement en direct des attributs Laval Info-Travaux et affichage des lignes officielles depuis son MapServer public.
- Filtres Jour/Nuit, avec la nuit definie comme toute entrave qui touche la plage 23 h à 5 h.
- Section de sources travaux pour les 15 municipalites independantes de l'ile de Montreal qui ne sont pas toujours couvertes par le WFS de la Ville de Montreal.
- Travaux concrets extraits des pages accèssibles de certaines villes liées, dont Baie-d'Urfe, Dollard-des-Ormeaux, Dorval, Hampstead, Kirkland, Pointe-Claire et Westmount, puis alignes aux rues avec OSRM quand une rue ou un axe est exploitable.
- Affichage des segments lineaires avec fleches de direction lorsque la géométrie officielle est une ligne.
- Les fleches sont reduites automatiquement sur les vues tres denses, puis reapparaissent au zoom pour garder la carte lisible.
- Affichage des zones de travaux en polygones lorsque la Ville publie une zone d'occupation plutot qu'un axe lineaire.
- Donnees exemples dans `data/closures.js` utilisees seulement comme secours si les APIs publiques ne repondent pas.

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

## Note importante

Les flux live publics peuvent changer de schema ou etre temporairement indisponibles. Les données Quebec 511 proviennent du GeoJSON public MTMD diffuse sur Donnees Quebec et sont rechargees a chaque ouverture ou actualisation de l'application.
