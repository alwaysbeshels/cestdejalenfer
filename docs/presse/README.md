# Dossier de presse

Édition du **3 octobre 2026**, en français. Les notes ci-dessous sont destinées à la préparation et à la maintenance du dossier; elles ne font pas partie du PDF à transmettre aux médias.

## Présentation pour Infoman

Une édition distincte du **4 octobre 2026**, spécifiquement préparée pour l'entrevue et le reportage demandés à Shelsea, est disponible en **20 diapositives 16:9**, sans photo de la créatrice :

- [infoman-mediakit.pdf](infoman-mediakit.pdf) : présentation PDF, environ 8,22 Mo, avec captures haute résolution et sources cliquables.
- [infoman-mediakit.html](infoman-mediakit.html) : source modifiable de la présentation, indépendante des scripts de l'application.
- [infoman-recherche.md](infoman-recherche.md) : recherche Web sourcée sur l'émission, propositions d'angles, provenance des chiffres et questions à compléter.
- [infoman-couverture.png](visuels/infoman-couverture.png) : aperçu du montage ordinateur et téléphone, extrait du PDF final.
- [infoman-apercu-mobile.png](visuels/infoman-apercu-mobile.png) et [infoman-apercu-lecteur.png](visuels/infoman-apercu-lecteur.png) : les deux nouvelles diapositives consacrées au mobile et au mode lecteur d'écran.

Le kit Infoman couvre les neuf rubriques demandées, mais reste une version de préparation : courriel, téléphone, langues d'entrevue et modalités du tournage attendent confirmation. La nouveauté Personnalisé est identifiée comme locale et non publiée. Les deux volets statistiques sont distincts. Aucun engagement commercial, anecdote ou témoignage n'est inventé; aucune photo n'est attendue pour cette édition. Rien n'est publié par sa création locale, et le dossier général du 3 octobre ci-dessous reste conservé.

La refonte visuelle remplace toutes les illustrations du kit par de nouvelles captures du 4 octobre. La couverture présente un ordinateur et un téléphone; les écrans conservent leur ratio d'origine. Les diapositives 8 et 10 présentent respectivement l'interface mobile et le mode lecteur d'écran pour les personnes aveugles ou malvoyantes. Le montage d'appareils est une illustration de présentation, pas une photographie ni une certification sur les appareils représentés. Le mode a été activé et son affichage contrôlé dans Chromium, sans revendiquer une nouvelle séance VoiceOver.

## Documents

- [dossier-presse.pdf](dossier-presse.pdf) : dossier de huit pages destiné aux médias.
- [dossier-presse.html](dossier-presse.html) : source modifiable, lisible sans JavaScript et imprimable en A4.
- [visuels/](visuels/) : six captures PNG en haute résolution, utilisées par le dossier.

Le HTML contient sa propre mise en page. Il ne dépend ni des styles ni des scripts de l'application. Conserver le dossier `visuels/` à côté du HTML pour une lecture locale. Le PDF incorpore les images et peut être transmis seul. Aucun serveur de production, service externe de génération ou nouvelle dépendance n'est ajouté.

Le PDF de diffusion pèse environ **3,3 Mo**. Après l'export Chromium, les images de plus de 300 ppp ont été rééchantillonnées à 240 ppp, qualité JPEG 88, avec PyMuPDF déjà installé localement. Les huit pages, leur texte, leurs liens et les 34 entrées du plan ont été comparés avant/après et conservés. Les six PNG d'origine restent inchangés par cette optimisation; un nouvel export brut avec la commande ci-dessous peut être plus volumineux.

## Avant l'envoi

- **Contact direct :** le dossier utilise le profil LinkedIn public de Shelsea Saint-Fleur. Ajouter un courriel presse et, seulement si souhaité, un téléphone de contact; aucune coordonnée n'a été inventée.
- **Portrait :** ajouter une photographie fournie ou autorisée par la créatrice, avec son crédit et ses modalités de réutilisation. Aucun portrait artificiel ou de remplacement n'est utilisé.
- **Biographie :** faire approuver la formulation « diplômée d'un baccalauréat en génie logiciel et spécialisée dans les données », reprise du document fourni. Le dossier n'infère pas un titre professionnel réglementé.
- **Audience :** confirmer le libellé de l'indicateur et la période dans l'outil d'analytique. Les 6 715 visiteurs uniques du 5 septembre au 1er octobre 2026 sont attribués à la créatrice, pas présentés comme une mesure indépendante. Les événements d'utilisation ne sont pas assimilés à des visites.
- **Disponibilité publique :** le domaine a renvoyé `ERR_NAME_NOT_RESOLVED` dans Chromium depuis cet environnement pendant cette préparation. Les captures proviennent de la version locale. Vérifier les liens publics et les fonctionnalités annoncées depuis un navigateur ayant accès au domaine avant l'envoi; ce constat local ne démontre pas une panne publique générale.
- **Références médias :** le lien QUB/YouTube est celui du document fourni. Sa récupération automatique a renvoyé HTTP 401; la vidéo n'a pas été visionnée ici. Confirmer son titre et sa date avant diffusion. L'article du Journal de Montréal du 17 septembre 2026 n'est pas cité sans son URL exacte. Radio Centre-Ville n'est pas présenté comme une entrevue diffusée sur la seule base du document de préparation.

## Provenance éditoriale

| Élément | Base utilisée | Traitement dans le dossier |
| --- | --- | --- |
| Identité, diplôme, lancement le 5 septembre, audience | Analyse de sept pages jointe par la créatrice, datée du 2 octobre 2026; [préparation radio](../../PREPARATION_ENTREVUES_RADIO.md) pour la démarche personnelle | Biographie courte; lancement et audience attribués. Aucune anecdote ni citation personnelle inventée. |
| Fonctions et limites | [Documentation](../README.md), [annonces](../annonces/README.md), pages et scripts actuels, exécution Chromium locale | Deux volets statistiques distincts, cartes Auto/Piétons et Nids-de-poule/Colmatages, méthode et couverture géographique explicites. |
| Périodes des données | [Catalogue](../../data/nids-de-poule/index.json) | Demandes 311 : 2014-2026; fichiers de colmatage : 2016-2025. Le fichier 2025 compte 74 159 interventions du 18 janvier au 20 mai 2025, sans les présenter comme des trous uniques. |
| Graphique de persistance | [Analyses](../../data/nids-de-poule/analyses.json), période `recent` | 2022-2026; classes 11 183, 4 567, 2 212, 1 059, 434, soit 19 455 emplacements et 8 272 avec plusieurs années signalées. Les 1 584 signalements non localisables sont exclus de ce calcul. |
| Portraits territoriaux | [Index des arrondissements](../../data/nids-de-poule/arrondissements.json) | 19 portraits; ce nombre n'est pas un décompte de municipalités couvertes par les entraves. |
| « 19 municipalités » et « environ 40 sources » | Chiffres présents dans le document fourni, sans définition de décompte associée | Non repris comme indicateurs de couverture. Les organismes, flux, fichiers et sources documentaires ne doivent pas être additionnés sans méthode. |

Le graphique illustré utilise des demandes 311 allant jusqu'au 1er octobre 2026 et des colmatages allant jusqu'au 20 mai 2025. Sa version de données indique une modification au 3 octobre 2026. Cette date de fichier ne signifie pas que des travaux ont été réalisés ce jour-là. Aucune collecte ou actualisation des snapshots n'a été lancée pour produire le dossier.

Les noms de sources ont aussi été relevés dans `allClosures` lors des captures. Le chargement auto contenait notamment Montréal, Mont-Royal, Beaconsfield, Longueuil, Laval, MTMD, PJCCI et les intégrations municipales disponibles. Les totaux chargés contiennent aussi des entrées hors période : ils ne deviennent pas un nombre de chantiers actifs dans le dossier. Repentigny n'est pas présenté comme une source reçue. Cette opération n'est ni une nouvelle certification de toutes les sources ni une vérification terrain.

## Légendes des visuels

| Fichier | Contexte de capture du 3 octobre 2026 |
| --- | --- |
| [carte-auto.png](visuels/carte-auto.png) | Carte Auto, 3 octobre au 3 octobre, jour et nuit; trois types d'impact routier activés, stationnement exclu. Vue transmise : latitude 45,53, longitude -73,60, zoom 12. Bulle d'aide fermée par son bouton. |
| [carte-pietons.png](visuels/carte-pietons.png) | Carte Piétons, 3 octobre au 3 octobre; zones et deux types d'impact activés. Vue transmise : 45,52, -73,60, zoom 13. Portrait consolidé, pas des requêtes municipales en direct. |
| [statistiques-entraves.png](visuels/statistiques-entraves.png) | Général, mode « Actives durant la période choisie », 3 octobre 2026, jour et nuit, stationnement exclu. Les chiffres changent selon les données et ne décrivent pas des chantiers uniques. |
| [nids-de-poule.png](visuels/nids-de-poule.png) | Années d'activité : 2026 seulement; tous les statuts et arrondissements. Les groupes comptent des positions publiques. Le compteur de signalements connus peut inclure leur historique. |
| [colmatages.png](visuels/colmatages.png) | Fichier 2025; tous les mois et appareils. Positions GPS du 18 janvier au 20 mai 2025. Les groupes peuvent être dessinés comme marqueurs HTML sans pixels de points dans le Canvas. |
| [statistiques-nids-de-poule.png](visuels/statistiques-nids-de-poule.png) | Canvas du graphique de persistance, période 2022-2026. Les valeurs et le dénominateur ont été comparés au fichier d'analyses. La légende du PDF précise le sens du graphique et l'année partielle. |

Les captures montrent les données et l'interface réellement rendues. Aucun chiffre, marqueur, texte de source ou tracé n'a été retouché. Les captures de cartes conservent les attributions OpenStreetMap. Pour une réutilisation séparée, joindre la légende correspondante et les crédits; ne pas présenter une capture comme un état actuel permanent du réseau.

## Exporter après modification

Depuis la racine du projet, utiliser le serveur local habituel sur le port 5500. Les outils Playwright existants servent uniquement à l'export local; ils ne sont pas requis pour consulter ou publier le dossier HTML.

```bash
python -m http.server 5500
```

Dans un autre terminal, depuis la même racine :

```bash
node --input-type=module -e 'import { chromium } from "playwright"; const browser = await chromium.launch(); try { const page = await browser.newPage(); await page.emulateMedia({ media: "print" }); await page.goto("http://localhost:5500/docs/presse/dossier-presse.html", { waitUntil: "load" }); await page.evaluate(() => document.fonts.ready); await page.pdf({ path: "docs/presse/dossier-presse.pdf", format: "A4", preferCSSPageSize: true, printBackground: true, tagged: true, outline: true }); } finally { await browser.close(); }'
```

Après chaque modification, vérifier les huit pages du PDF, les liens, les six images, l'absence de texte coupé et l'accord des légendes avec les captures. Un changement de date d'édition ne constitue pas une actualisation des données. Pour de nouvelles captures, exécuter les vraies pages, attendre les données et les tuiles, vérifier les filtres et conserver le contexte; ne pas remplacer les cartes par des données de démonstration.

## Modèle de premier courriel

Texte à personnaliser hors du dossier public. Remplacer les champs entre crochets et retenir un seul angle adapté au média; ne pas présenter le site comme une application de navigation ou un palmarès de performance municipale.

**Objet :** Une initiative citoyenne pour mieux lire les entraves et les données routières de Montréal

Bonjour [prénom],

Je suis Shelsea Saint-Fleur, créatrice de cestdejalenfer.ca, un projet indépendant lancé le 5 septembre 2026. Il rassemble des informations publiques sur les entraves du Grand Montréal et propose aussi des cartes, des bilans et des statistiques sur les signalements de nids-de-poule et les colmatages mécanisés de Montréal.

Pour [nom du média], je pensais à un sujet sur [angle précis : un territoire, la dispersion des données ou la démarche citoyenne]. Je peux présenter le fonctionnement du site, expliquer le travail sur les sources et les limites des chiffres, avec une démonstration concrète.

Vous trouverez [le dossier en pièce jointe / un lien vérifié vers le dossier], avec des illustrations et les références utiles. Seriez-vous intéressé par un échange à ce sujet?

Shelsea Saint-Fleur
[Courriel presse et coordonnées autorisées]
