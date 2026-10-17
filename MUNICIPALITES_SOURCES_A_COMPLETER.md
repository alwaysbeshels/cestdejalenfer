# Bilan des cartes municipales analysées — 17 octobre 2026

## Intégrées à la carte

- **Boucherville** — snapshot statique après analyse des 18 avis REST et des 17 marqueurs officiels : quatre fiches d’entraves auto et un point de fermeture de piste multifonctionnelle sur la carte piétonne. Le POST FacetWP n’autorise pas le CORS nécessaire à une intégration live.
- **Brossard** — snapshot statique de deux entraves auto (Grande Allée et permis 2026-12018). Le POST fonctionne dans l’iframe OpaTech officielle; la carte statique ne peut pas le lire directement à cause du CORS/405. Les six géométries de Grande Allée restent séparées. La page « Travaux et entraves » et le PTI 2024–2026 ont aussi été lus; ils ne publient pas d’intervalle ni de configuration temporaire supplémentaire exploitable.
- **Chambly** — flux live de l’API CORS `GET /api/v1/pois`, limité au point officiel de la rue Lapalme. La source ne publie pas de période ni d’impact auto pour ce point : il est affiché comme chantier seulement, pas comme fermeture.
- **McMasterville** — flux live combinant les avis WordPress et le KML public : fermeture datée du chemin du Richelieu (route 223), avec sa LineString et son Point officiels. Le même événement figure dans Québec 511; une seule carte reste affichée et l’avis municipal est lié au popup tant que l’identité, les dates, les limites et la géométrie concordent.
- **Saint-Basile-le-Grand** — snapshot statique de 13 points courants, parmi 68 éléments de carte et 16 projets de travaux; trois candidats restent en revue. Les 15 avis de l’index, la page liée du Millénia et 28 médias/pièces jointes ont été examinés et leurs empreintes sont conservées. Les points restent neutres. Les fermetures de Bella-Vista/des Martinets et du Millénia n’ont pas de fins exactes ou de limites cohérentes; elles ne sont pas tracées.
- **Sainte-Julie** — snapshot statique d’un point de travaux au chemin du Fer-à-Cheval, avec l’échéance approximative « fin octobre 2026 » conservée comme texte. Aucun type de fermeture n’est déduit.
- **Carte piétonne** — les travaux de trottoirs de Sainte-Catherine restent intégrés comme Point; son inventaire éditorial de six avis et six images est revérifié avec un point de reprise. La fermeture publiée de la piste multifonctionnelle de Boucherville est ajoutée comme Point, sans tracer le passage.

## Non intégrées à la carte Auto

- **Rosemère** — la carte Google ne fournit pas de données de travaux exploitables.
- **Beauharnois** — la carte consultée est générique; aucun avis routier exploitable n’y est publié.
- **Notre-Dame-de-l’Île-Perrot** — aucun avis routier courant et admissible n’a été établi.
- **Mont-Saint-Hilaire** — les couches contiennent des échéanciers saisonniers et un attribut « Alternance : Oui », mais aucun statut courant explicite ni période datée pour confirmer une entrave active.
- **Mercier** — un avis Route 138 / rue William et des Érables est conservé dans le snapshot en revue, mais pas sur la carte : les dates n’ont pas d’année et l’image, bien qu’inspectée, n’est pas géoréférencée.
- **Sainte-Catherine** — les notices vérifiées concernent des travaux piétonniers/cyclables ou des travaux sans impact automobile confirmé; le POST municipal n’a pas de CORS exploitable depuis la carte statique.

Le FAQ compte dynamiquement **25 / 82 municipalités membres de la CMM** avec au moins une source locale intégrée aux cartes Auto ou Piétons. Le lien CMM a renvoyé un défi Cloudflare en ligne de commande et en Chromium headless; une session Chromium normale a ensuite chargé le tableau officiel. Le fichier [`data/municipalites_cmm.csv`](data/municipalites_cmm.csv) reprend ses 82 lignes et ses colonnes `MUNICIPALITÉS`, `MRC` et `SECTEUR`; les valeurs provisoires provenant du registre MAMH ont été remplacées par celles du tableau CMM.

## À examiner dans une prochaine passe

- Saint-Bruno-de-Montarville — https://stbruno.ca/citoyens/info-travaux/
- Les Cèdres — https://www.ville.lescedres.qc.ca/fr/services-aux-citoyens/travaux-publics-et-services-techniques/info-travaux

## Sources et méthodes vérifiées

### Boucherville

- Carte filtrée « Avis de travaux » : https://www.boucherville.ca/carte-interactive/?_poi_categories=avis-de-travaux
- Générateur : `npm run snapshot:boucherville`; snapshot : `data/boucherville-roadworks-snapshot.json`.
- Le snapshot compare l’inventaire complet WordPress (18 avis) aux 17 points de `FWP_MAP.markersArray`. Il conserve les dates, textes et Points publiés; il ne fabrique pas de ligne à partir d’un point.
- Les permaliens REST des avis échantillonnés redirigent vers l’accueil; les popups pointent vers la carte officielle filtrée, où le détail est publié.
- Les pages officielles « Chantiers et projets », « Avis de travaux », « Travaux prévus 2026 » et « Complexe multisport » sont aussi fingerprintées dans `validation.bouchervilleReview`. Elles n’ajoutent pas de limites routières datées à celles de la carte; une modification de texte, lien ou média bloque la prochaine actualisation jusqu’à revue.
- Pages examinées : https://www.boucherville.ca/travaux-infrastructures/chantiers-projets/, https://www.boucherville.ca/travaux-infrastructures/chantiers-projets/avis-travaux/, https://www.boucherville.ca/travaux-infrastructures/chantiers-projets/travaux-prevus/ et https://www.boucherville.ca/travaux-infrastructures/chantiers-projets/construction-dun-complexe-multisport/.

### Brossard

- Carte : https://brossard.ca/informations-travaux/#carte
- Générateur : `npm run snapshot:brossard`; snapshot : `data/brossard-roadworks-snapshot.json`.
- Le navigateur répète le POST dans l’origine de l’iframe OpaTech avec le filtre auto publié. Aucun proxy ni contournement CORS n’est ajouté.
- La page https://brossard.ca/sujets/travaux-et-entraves/ et le PDF PTI 2024–2026 sont conservés dans `validation.brossardSupplementalReview`; les plans historiques ne constituent pas des dates ou géométries de fermetures actuelles.
- PDF examiné : https://brossard.ca/app/uploads/2025/04/attach_cmsUpload_32cd2f38-f18d-4ed0-a468-396f1030dd26.pdf.

### Chambly

- Carte des chantiers en cours : https://chambly.ca/carte-interactive/chantiers-municipaux/en-cours
- Flux live : `https://chambly.ca/api/v1/pois`; le statut `En cours` et le point WGS84 sont publiés. La ligne KML de Lapalme n’est pas présentée comme une fermeture.

### McMasterville

- Avis : https://www.mcmasterville.ca/services-aux-citoyens/info-travaux/
- KML : https://www.google.com/maps/d/kml?mid=1v2gaHW5Woc8hV-Majzrtnnu1EChm0BM&forcekml=1
- Le chargeur live vérifie la pagination WordPress, la notice détaillée et l’identité de la géométrie KML. Il ne trace ni détour ni interdiction de stationnement sans géométrie correspondante.

### Saint-Basile-le-Grand

- Carte : https://www.villesblg.ca/carte-interactive/?categorie=travaux
- Générateur : `npm run snapshot:saint-basile`; snapshot : `data/saint-basile-worksites-snapshot.json`.
- Seuls les Points portant le statut publié « en cours » sont retenus; les travaux à venir restent en revue. Dernière vérification complète : `2026-10-17T16:20:52.022Z`; 13 points retenus et trois candidats en revue.
- `validation.saintBasileReview` garde l’index et les 15 avis liés, la page Le Millénia, les empreintes de texte et des 28 médias, les décisions et le point de reprise. La dernière modification publiée de la liste examinée est celle du Rang des Vingt (`2026-10-16T15:54:46+00:00`); cette date n’est pas une période de travaux.
- La FAQ générale du Service du génie, https://www.villesblg.ca/wp-content/uploads/2023/11/GLR_2023_Liste-des-questions-frequentes-FAQ-travaux-infrastructures-routieres.pdf, fait 14 pages et ne donne que des pratiques générales. Les fermetures Bella-Vista/des Martinets et du Millénia restent sans géométrie cartographiable faute de période exacte ou de limites cohérentes.

### Sainte-Julie

- Carte : https://saintejulie.ca/fr/carte/travaux
- Générateur : `npm run snapshot:sainte-julie`; snapshot : `data/sainte-julie-worksites-snapshot.json`.
- Le JSON municipal publie le point du projet 7021 et l’échéance approximative « fin octobre 2026 », mais pas de type de fermeture routière.
- La page https://saintejulie.ca/travaux et ses images ont aussi été revues; les rendus du parc sont des illustrations d’aménagement, pas des plans d’entrave. `validation.sainteJulieSupplementalReview` conserve les empreintes et la décision.

### Sainte-Catherine

- Index des avis : https://www.ville.sainte-catherine.qc.ca/citoyens/informations-pratiques/avis-et-info-travaux/
- Avis conservés pour les contrôles : https://www.ville.sainte-catherine.qc.ca/citoyens/informations-pratiques/avis-et-info-travaux/20260921-it-bordures/ et https://www.ville.sainte-catherine.qc.ca/citoyens/informations-pratiques/avis-et-info-travaux/20261013-it-bds-1720ruecentrale/.
- Six avis et six images sont conservés dans `validation.sainteCatherineReview`. L’avis de trottoirs confirme aussi une fermeture de voie et une circulation en alternance « sur multiples rues », sans noms ni limites; le candidat cyclable reste en revue faute de période propre et de tracé.

### Mercier

- Index : https://www.ville.mercier.qc.ca/info-travaux/
- Avis détaillé : https://www.ville.mercier.qc.ca/info-travaux/route-138-coin-rue-william-et-des-erables/
- Générateur : `npm run snapshot:mercier`; snapshot : `data/mercier-roadworks-snapshot.json`.
- Le seul avis courant inventorié est « Route 138 / rue William et des Érables ». Le texte complet donne les détours des véhicules et des camions; l’image inspectée distingue fermeture, détour et circulation locale, mais n’est pas géoréférencée. L’année des dates manque : l’avis reste en revue, sans point ni ligne. `validation.mercierReview` conserve l’inventaire et le point de reprise.

### Mont-Saint-Hilaire

- Carte : https://experience.arcgis.com/experience/f6ea6c5a42f5440c970ec7a8bb5b17d4
- Le service courant du 13 octobre contient des échéanciers saisonniers et une ligne des Patriotes avec `Alternance: Oui`, sans dates ni statut actif explicite. Aucune entrave auto n’est affichée.
