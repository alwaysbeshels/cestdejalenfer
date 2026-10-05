# Inventaire des données des entraves routières

État vérifié le **4 octobre 2026**.

Ce document distingue deux niveaux : **toutes les données de l'inventaire**, avec les 47 familles de données et les 7 indicateurs calculés identifiés dans le site, puis les **tableaux d'objets finaux** réellement construits par le code. La première partie regroupe les champs apparentés; la seconde décrit les noms des tableaux, leurs clés et leurs types actuels.

**Les nids-de-poule et le colmatage sont exclus de cet inventaire.**

## Sommaire

- [Inventaire des données des entraves routières](#inventaire-des-données-des-entraves-routières)
  - [Sommaire](#sommaire)
  - [Toutes les données de l'inventaire](#toutes-les-données-de-linventaire)
    - [Périmètre et conventions](#périmètre-et-conventions)
    - [Identification et provenance](#identification-et-provenance)
    - [Localisation et réseau routier](#localisation-et-réseau-routier)
    - [Impacts et usagers touchés](#impacts-et-usagers-touchés)
    - [Dates et horaires](#dates-et-horaires)
    - [Permis, travaux et projets](#permis-travaux-et-projets)
    - [Géométrie et qualité](#géométrie-et-qualité)
    - [Signalements citoyens](#signalements-citoyens)
    - [Métadonnées et champs non exploitables](#métadonnées-et-champs-non-exploitables)
    - [Indicateurs calculés](#indicateurs-calculés)
    - [Limites et précautions](#limites-et-précautions)
    - [Références techniques](#références-techniques)
  - [Tableaux d'objets finaux](#tableaux-dobjets-finaux)
    - [Vue d'ensemble](#vue-densemble)
    - [Tableau principal allClosures](#tableau-principal-allclosures)
      - [Clés communes](#clés-communes)
      - [Clés facultatives des importateurs](#clés-facultatives-des-importateurs)
      - [Données conservées depuis les snapshots](#données-conservées-depuis-les-snapshots)
      - [Clés des signalements citoyens](#clés-des-signalements-citoyens)
      - [Clés techniques précalculées](#clés-techniques-précalculées)
    - [Objets imbriqués](#objets-imbriqués)
    - [Sélections de la carte](#sélections-de-la-carte)
    - [Objets statistiques](#objets-statistiques)
      - [Objet retourné par computeStats](#objet-retourné-par-computestats)
      - [Clés de stats.items](#clés-de-statsitems)
      - [Compléments du mode territorial](#compléments-du-mode-territorial)
    - [Objets des graphiques](#objets-des-graphiques)
    - [Exemple de normalisation](#exemple-de-normalisation)
    - [Ce qui reste séparé](#ce-qui-reste-séparé)

## Toutes les données de l'inventaire

### Périmètre et conventions

L'inventaire repose sur le code d'importation, les snapshots conservés et les réponses API chargées lors de la vérification. Les simples liens du catalogue vers des sites externes ne sont pas considérés comme des données intégrées.

- **Affiché** : présent dans une carte, une fiche, un filtre ou une statistique du site.
- **Stocké** : présent dans les fichiers locaux, même si l'interface ne l'utilise pas.
- **Brut** : reçu de la source mais peu ou pas repris dans les objets normalisés de l'application.
- **Calculé** : produit par le site à partir des champs disponibles, et non publié directement sous cette forme par la source.

Les types indiqués décrivent la nature de l'information. Selon la source, une date peut arriver comme texte ou timestamp, et un objet peut être encodé dans une chaîne JSON.

**La disponibilité varie selon les sources. Un champ existant peut être vide.** Cet inventaire décrit un état constaté, pas une garantie que toutes les valeurs resteront disponibles ni que les sources seront toujours accessibles. Il n'est pas actualisé automatiquement.

### Identification et provenance

| Donnée et principaux champs | Type | Description | Présence et utilisation |
| --- | --- | --- | --- |
| Identifiants et références : `id`, `reference`, `sourceRecordId`, `identifiantChantier`, `externalReferenceIds` | Texte, identifiant | Identifie une entrave, un permis ou un chantier source; ce ne sont pas toujours les mêmes unités. | Affichés partiellement; références supplémentaires dans les données brutes. |
| Titre et désignation : `title`, `occupancyName`, `obstructionTitle` | Texte | Nom de l'entrave, de l'occupation ou des travaux. | Affiché; certaines désignations originales ne sont pas reprises. |
| Description et commentaires : `impact`, `description`, `details`, remarques | Texte, HTML, liste | Explications des travaux, restrictions, précisions et commentaires publiés. | Affichés en partie; descriptions françaises et anglaises supplémentaires au MTMD. |
| Catégorie du site : `category` | Catégorie | Municipal, privé, régional, événement, signalement citoyen, etc. | Affichée; classification de l'application. |
| Source et liens : `source`, `sourceKind`, `sourceUrl`, liens complémentaires | Texte, URL | Origine officielle ou complémentaire, famille d'importation et lien vers l'avis. | Affichés et stockés. |
| Publication, modification et extraction : `miseAJour`, `loadDate`, `date_publication`, `EditDate`, `extractedAt` | Date et heure | Dates de publication, modification, chargement chez la source ou extraction locale. Ces dates ont des sens différents. | Certaines affichées; beaucoup restent brutes ou stockées. |
| Documents et images : pièces jointes, plans, `img`, liens détaillés | URL, HTML, liste | Avis complets, plans de signalisation, documents de détour et images associées. | Plusieurs sources en fournissent; beaucoup ne sont pas affichés dans notre interface. |

### Localisation et réseau routier

| Donnée et principaux champs | Type | Description | Présence et utilisation |
| --- | --- | --- | --- |
| Municipalité et arrondissement : `municipality`, `borough`, `boroughId` | Catégorie, code | Territoire associé à l'entrave. Le champ `borough` contient parfois une municipalité plutôt qu'un arrondissement. | Affichés; harmonisation nécessaire entre sources. |
| Rue, route et numéro : `streets`, `streetName`, `routeNumber`, `routeAutoroute` | Texte, code | Nom de voie et numéro d'autoroute ou de route lorsqu'il est publié ou reconnu. | Affichés et utilisés dans les statistiques. |
| Localisation et limites : adresses, `from`, `to`, `limits` | Texte, liste | Emplacement précis et limites « entre telle rue et telle rue ». | Affichées en texte; limites structurées présentes dans certains fichiers et flux. |
| Direction : `direction`, direction publiée | Texte, catégorie | Nord, sud, est, ouest, deux directions ou description d'un segment. | Affichée; une description de segment n'est pas nécessairement une direction de circulation. |
| Type de voie : `roadType` | Catégorie | Rue, route, autoroute, pont, tunnel, etc. | Déduit et affiché; regroupements supplémentaires dans les statistiques. |
| Caractère artériel : `spatialAnalysis.isArterial` | Booléen | Indique si le segment appartient au réseau artériel selon Montréal. | Brut et stocké dans les analyses géométriques; non proposé dans les graphiques auto. |

### Impacts et usagers touchés

| Donnée et principaux champs | Type | Description | Présence et utilisation |
| --- | --- | --- | --- |
| Impact harmonisé : `severity`, `trafficLabel` | Catégorie, texte | Fermeture complète, voie touchée, accès limité, stationnement et cas particuliers. | Affiché et filtrable. |
| Impact original et ampleur : `rawType`, `streetImpactType`, `trafficLabels`, `entraveType` | Code, texte, liste | Classification publiée par chaque source. L'ampleur MTMD « mineure/majeure » est distincte du type de fermeture. | Partiellement affiché; les nombres de voies fermées restent souvent dans du texte. |
| Largeur de l'impact : `width`, `streetImpactWidth` | Texte numérique | Largeur déclarée de l'occupation ou de l'impact sur la rue. | Montréal : conservée, mais pas utilisée comme mesure dans les graphiques; unité et conversion à vérifier. |
| Places de stationnement : `nbFreeParkingPlace`, `parkingSpacesRemoved` | Nombre entier | Nombre déclaré de places concernées, repris comme places retirées dans l'analyse locale. | Montréal : brut et stocké; pas un inventaire de toutes les places disponibles. |
| Détours et alternatives | Texte, URL, géométrie | Itinéraire alternatif, accès maintenu, consignes de circulation et parfois tracé du détour. | Texte souvent affiché; structures plus détaillées conservées à Mont-Royal notamment. |
| Cause, conséquence et durée annoncée d'un événement | Texte | Cause d'une restriction MTMD, conséquence publiée et durée annoncée en langage naturel. | Prévu dans les fiches MTMD; certains champs peuvent être vides. |
| Restrictions de charges et dimensions : `entravesLieesAuxChargesEtDimensions` | Texte | Restrictions particulières liées aux véhicules, charges ou dimensions. | Reçu du MTMD, mais non repris dans les graphiques actuels. |
| Zones touchées : `affectedArea`, parc, ruelle | Liste, catégorie, texte | Chaussée, ruelle, parc ou autre espace concerné; nom et restriction du parc lorsqu'indiqués. | Montréal : brut et snapshots détaillés; peu exploité côté auto. |
| Trottoirs, pistes et usagers : `sidewalk`, `backSidewalk`, `bikePath`, `affectedUsers`, `side` | Objets, catégories | Fermeture ou restriction d'un trottoir, du côté opposé, d'une piste; usagers et côté touchés. | Brut et snapshots; certaines informations sont utilisées sur la carte piétonne, pas dans les statistiques auto. |
| Transport collectif : `publicTransportImpact` | Objet, catégories | Impacts STM, autres transporteurs et voies réservées. | Montréal : brut et stocké; non proposé dans les graphiques auto. |
| Équipements et infrastructures : `assetImpactAssets`, `assetType`, `assetId`, `action` | Liste d'objets | Équipements concernés, identifiants, actions et informations sur parcomètres, stationnement ou bornes. | Montréal : brut et snapshots; autres structures d'équipements à Mont-Royal. |
| Avis connexes : eau potable, ébullition | Code, texte, objet | Informations de service associées aux travaux, distinctes de l'impact automobile. | Champs sources à Châteauguay et Mont-Royal; remplissage variable. |

### Dates et horaires

| Donnée et principaux champs | Type | Description | Présence et utilisation |
| --- | --- | --- | --- |
| Dates de début et de fin : `startDate`, `endDate` | Date | Période de l'entrave retenue par l'importateur. | Affichées; peuvent être absentes, approximatives ou remplacées par une valeur technique. |
| Heures de début et de fin : `startTime`, `endTime` | Heure | Bornes horaires précises lorsqu'elles sont publiées. | Affichées pour certaines sources; d'autres heures restent seulement dans les données brutes. |
| Horaire hebdomadaire : `schedule`, `durationDays*` | Liste, booléens, heures | Jours concernés, journée complète ou plage horaire propre à chaque jour. | Montréal et signalements citoyens notamment; affiché, mais pas exploité dans les graphiques. |
| Intervalles et récurrences : `publishedIntervals`, `recurringSchedule`, `scheduleText` | Liste, objet, texte | Plusieurs périodes, horaires récurrents, exceptions et indications hors horaire. | Pris en charge selon les importateurs; certains horaires restent stockés en texte. |
| Jour et nuit : `periods` | Liste de catégories | Classement utilisé par les filtres jour/nuit. | Affiché et filtrable; parfois déduit ou défini par défaut, donc pas toujours un horaire officiel. |
| Dates réelles, anticipées et de reprise | Date, heure, texte | Bornes distinctes permettant de différencier prévision, réalisation et reprise des travaux. | Brutes à Saint-Eustache notamment; dates prévues supplémentaires à Longueuil. L'importation simplifie ces distinctions. |

### Permis, travaux et projets

| Donnée et principaux champs | Type | Description | Présence et utilisation |
| --- | --- | --- | --- |
| Statut et transitions : `currentStatus`, `statuses`, `statut_avis`, `EtatProjet` | Catégorie, liste datée | État administratif du permis, de l'avis ou du projet et certaines transitions de statut. | Souvent utilisés pour filtrer ou laissés bruts; pas un historique complet des entraves. |
| Motif, nature et type de permis : `reasonKind`, `reasonCategory`, `permitCategory`, `TypeTravaux` | Catégorie, code, texte | Pourquoi l'occupation existe et quelle intervention est réalisée : voirie, réseaux, construction, etc. | Très variable; parfois dans les fiches, souvent disponible seulement dans le brut. |
| Responsable, organisation et demandeur : `responsible`, `organization`, `siteAuthority`, `responsibleCode` | Texte, catégorie, code | Organisme ou entreprise associé à l'entrave, type de demandeur et certaines informations sur le bénéficiaire. | Affichés et partiellement analysés; certains importateurs attribuent un responsable par défaut. |
| Gestion de projet : phases, segments, conflits, demande et autorisation | Objets, listes, dates | Découpage du projet, fermetures par phase, conflits signalés par la plateforme et dates administratives. | Mont-Royal : stocké dans `publishedProject`, presque entièrement absent des statistiques. |
| Piétonnisations affectant la circulation auto | Catégories, dates, identifiants | Projet, rue, limites, repartage de la rue, implantation saisonnière ou permanente et date d'ouverture. | Snapshot montréalais; certaines restrictions sont intégrées à la carte auto. |
| Parcours UCI complémentaires | Géométrie, date, heure, texte | Parcours, identifiants, noms français et anglais, dates et heures des courses, en plus des restrictions. | Couche `routes` stockée; la carte auto importe surtout la couche `restrictions`. |

### Géométrie et qualité

| Donnée et principaux champs | Type | Description | Présence et utilisation |
| --- | --- | --- | --- |
| Géométrie : `geometry` | GeoJSON | Point, ligne, multiligne, polygone ou multipolygone représentant l'entrave. | Utilisée sur la carte; origine et précision variables. |
| Position et bornes cartographiques : `point`, `routeEndpoints`, `limitCoordinates`, emprise | Coordonnées, listes | Point représentatif, extrémités et enveloppe géographique. | Stockés ou calculés; le point affiché n'est pas nécessairement le centre exact du chantier. |
| Longueur publiée : `spatialAnalysis.length`, `publishedLengthMeters` | Nombre | Longueur indiquée par une source pour un segment ou un projet. | Disponible pour certains jeux montréalais; distincte de notre estimation géométrique. |
| Surface et périmètre : `Shape__Area`, `Shape__Length`, `perimeter` | Nombre | Mesures géométriques fournies par certains services. | Brutes ou stockées; unités à vérifier, et un périmètre n'est pas une longueur de route fermée. |
| Provenance et qualité géométrique : `geometryStatus`, `geometrySource`, `geometryNote`, `analysis` | Catégorie, objet, texte | Tracé officiel, reconstruction géobase/OSM, point seulement, avertissements et méthode utilisée. | Partiellement affichées; détails supplémentaires stockés. |

### Signalements citoyens

Ces signalements portent ici sur les **entraves routières**, pas sur les nids-de-poule.

| Donnée et principaux champs | Type | Description | Présence et utilisation |
| --- | --- | --- | --- |
| Déclaration citoyenne : `submittedAtLocal`, `observedAt`, `informationOrigin`, `reportedFields`, `reportedDates` | Texte, dates, objet | Réception, observation, origine déclarée, commentaire original, lien justificatif et précision des dates. | Stockée; certaines informations sont affichées pour les signalements admissibles. |
| Validation citoyenne : `review` | Booléens, catégorie, liste | Admissibilité à la carte, vérification géométrique, confirmation officielle et réserves. | Stockée et partiellement affichée; géométrie vérifiée ne signifie pas restriction officiellement confirmée. |

### Métadonnées et champs non exploitables

| Donnée et principaux champs | Type | Description | Présence et utilisation |
| --- | --- | --- | --- |
| Métadonnées et contrôles techniques | Nombres, dates, objets | Comptes reçus/retenus/exclus, erreurs de sources, méthode d'extraction, versions, paramètres de résolution et d'affichage. | Stockés ou calculés; surtout utiles au suivi de qualité, pas comme mesures de circulation. |
| Contacts et données administratives | Texte, identifiants, URL | Contacts de projet, auteurs de modifications et certains champs nommés « internes ». | Présents dans quelques réponses ou snapshots; à exclure des graphiques et d'une exposition publique supplémentaire. |
| Champs présents mais actuellement vides | Types variables | Notamment `cost`, `workCategory`, `serviceInfra`, `servicePublic`, `eventType` à Mont-Royal. | Structure disponible, pas de donnée exploitable actuellement; `cost` est vide dans les 11 projets conservés au moment de la vérification. |

### Indicateurs calculés

Ces indicateurs ne sont pas de nouveaux champs publiés par les municipalités : ils sont produits à partir des données précédentes.

| Indicateur | Type | Signification | Limite |
| --- | --- | --- | --- |
| Nombre d'entraves et classements | Entier, rang | Comptage par territoire, impact, voie, responsable, source, etc. | Ce ne sont pas nécessairement des chantiers uniques. |
| Parts et pourcentages | Pourcentage | Part d'un groupe ou d'un impact dans un ensemble filtré. | Le dénominateur doit être explicite. |
| Longueur estimée touchée | Nombre, kilomètres | Mesure des lignes et estimation de certaines zones allongées. | Les superpositions peuvent être comptées plusieurs fois. |
| Durée prévue et médiane | Nombre de jours | Durée issue des dates retenues, médiane et tranches. | Pas une mesure du temps réellement travaillé. |
| Ancienneté | Nombre de jours, tranche | Temps écoulé depuis le début publié, jusqu'à aujourd'hui ou jusqu'à la fin pour une entrave terminée. | Dépend de la présence et de la fiabilité de la date de début; ne prouve pas une activité continue. |
| État temporel et échéances | Catégorie, booléen, compte | En cours, à venir, terminé selon les dates; débuts et fins dans les prochains jours. | Calculé à partir des dates disponibles, pas une confirmation sur le terrain. |
| Classifications analytiques | Catégorie | Type de responsable, réalisation publique/privée, bénéficiaire public/privé et regroupements territoriaux ou routiers. | Ce sont des interprétations des champs disponibles. |

### Limites et précautions

- **Pas d'historique complet.** Les données actuelles et les snapshots conservés ne permettent pas une comparaison fiable entre années pour toutes les entraves.
- **Pas de trafic mesuré.** Nous ne disposons pas de mesures de congestion ou de débit de circulation dans ce corpus.
- **Pas de coûts exploitables actuellement.** La présence d'un champ `cost` ne suffit pas : il est vide dans les 11 projets de Mont-Royal vérifiés.
- **Une valeur manquante n'est pas zéro.** Il faut distinguer champ absent, champ vide, valeur inconnue et zéro publié.
- **Une fin en `2099` peut être technique.** Elle peut représenter une durée indéterminée, pas une vraie échéance.
- **Jour/nuit n'est pas toujours publié.** Plusieurs importateurs utilisent une classification déduite ou une valeur par défaut.
- **Une entrave n'est pas un chantier unique.** Un chantier peut générer plusieurs segments, permis ou publications; des sources différentes peuvent décrire le même événement.
- **Les kilomètres ne représentent pas nécessairement un réseau unique fermé.** Les superpositions et les zones estimées doivent être signalées.
- **Les champs doivent être harmonisés avant comparaison.** Les codes, unités, définitions de statut et niveaux de détail diffèrent entre sources.
- **Les contacts et champs internes ne sont pas des options de graphique.** Leur contenu n'est pas reproduit dans ce document et ne doit pas être exposé davantage.
- **Un tracé vérifié ne confirme pas une restriction.** La qualité géographique et la validation de l'information de circulation sont deux contrôles distincts.

### Références techniques

La vérification des données a été réalisée en lecture seule, sans actualisation des snapshots. Les réponses API reçues dans le navigateur ont aussi été examinées pour identifier les champs qui ne sont pas repris par les importateurs.

- [Importation, normalisation, horaires et fiches](../js/app.js).
- [Calculs et visualisations des statistiques d'entraves](../js/stats.js).
- [Catalogue des sources](../data/sources.js).
- [Géométries résolues et analyses des entraves de Montréal](../data/montreal-entraves-geometries-snapshot.json).
- [Avis détaillés de Montréal](../data/montreal-pedestrian-notices-snapshot.json).
- [Projets et entraves de Mont-Royal](../data/mont-royal-snapshot.json).
- [Travaux de Beaconsfield](../data/beaconsfield-snapshot.json).
- [Signalements citoyens d'entraves](../data/citizen-reports-snapshot.json).
- [Restrictions et parcours UCI](../data/montreal-uci-closures-snapshot.json).
- [Piétonnisations de Montréal](../data/montreal-pedestrian-snapshot.json).
- [Avis de travaux PJCCI](../data/pjcci-work-advisories-snapshot.json).
- [Complément Noovo](../data/noovo-road-closures-snapshot.json).
- [Données de la carte piétonne](../data/pedestrian-closures-snapshot.json).

## Tableaux d'objets finaux

Cette partie décrit les structures utilisées par l'application pour les entraves routières. Il s'agit de l'état actuel du code, pas d'un nouveau modèle à implémenter. Les objets sont construits progressivement pendant le chargement; leur présence ne signifie pas que toutes les sources ont répondu.

**Un tableau JavaScript correspond ici à une collection de lignes. Chaque objet est une ligne, et ses propriétés sont les colonnes ou clés.** Les mêmes objets peuvent être référencés par plusieurs tableaux sans que leurs données soient fusionnées.

Les noms `Entrave`, `ItemStatistique` et `SpecificationGraphique` servent uniquement à expliquer les structures dans ce document. Ce ne sont pas des classes ni des types déclarés dans le code actuel. Les types décrits sont ceux des valeurs produites ou conservées par les importateurs vérifiés; il n'existe pas encore de contrat de schéma complet commun à toutes les sources.

### Vue d'ensemble

| Tableau ou résultat | Type des éléments | Construction et usage | Particularité |
| --- | --- | --- | --- |
| `allClosures` | `Array<Entrave>` | Tableau principal regroupant les entraves normalisées et préparées pour l'exécution. | Global dans le module de carte; alimenté par lots de sources. |
| `currentClosures` | `Array<Entrave>` | Sélection utilisée par la carte après application de ses filtres. | Même structure et mêmes objets que dans `allClosures`, sans nouvelles colonnes. |
| Résultat de `getClosuresInViewport()`; variable locale `viewportClosures` | `Array<Entrave>` | Sélection des entraves de `currentClosures` dont l'emprise intersecte la vue. | Tableau temporaire, pas une nouvelle table globale. |
| Résultat de `getFilterBaseClosures()` | `Array<Entrave>` | Base des compteurs de types d'impact, avant le filtre sur les impacts cochés. | Utilisé pour les compteurs; même structure d'entrave. |
| `stats.items` | `Array<ItemStatistique>` | Objets préparés par `computeStats()` pour les analyses. | Contient une référence `closure` et quatre propriétés analytiques. |
| `stats.starting` | `Array<Entrave>` | Entraves dont le début est annoncé après aujourd'hui et dans les sept prochains jours. | Objets d'entrave, pas des `ItemStatistique`. |
| `stats.ending` | `Array<Entrave>` | Entraves déjà commencées dont la fin est annoncée entre aujourd'hui et dans sept jours. | Exclut les fins techniques à partir de `2099`. |
| `stats.options.municipalities` | `Array<object>` | Choix de municipalités pour le mode territorial. | Présent après `territoryScope()`. |
| `stats.options.boroughs` | `Array<object>` | Choix d'arrondissements du flux montréalais pour le mode territorial. | Présent après `territoryScope()`. |
| `chartSpecs` | `Array<SpecificationGraphique>` | Descriptions des graphiques du rendu courant, avant conversion en configuration Chart.js. | Local à la fonction englobante des statistiques; pas une table d'entraves. |
| `charts` | Tableau d'instances Chart.js | Graphiques effectivement créés pour les canvas. | Objets de rendu à détruire/recréer, pas des données métier à fusionner. |

`stats` est une variable locale de rendu contenant le résultat de `computeStats()`, éventuellement restreint par `territoryScope()`. Ce n'est pas une table globale supplémentaire remplie une seule fois à la fin du chargement.

Références : [déclaration des collections](../js/app.js#L862), [chargement progressif](../js/app.js#L3402), [calcul des statistiques](../js/stats.js#L445) et [préparation des graphiques](../js/stats.js#L599).

### Tableau principal allClosures

`allClosures` commence avec les entraves de secours, puis reçoit les snapshots et les résultats des API après leur normalisation. Les données de secours sont retirées lorsque des données principales ont été obtenues. `dedupeClosures()` prépare les objets, exclut les entraves explicitement sans impact automobile en mode auto, puis conserve la première occurrence de chaque `id`.

**Ce dédoublonnage porte sur `id`, pas sur les numéros de permis, les identifiants de chantier ou les références externes.** Deux sources décrivant le même chantier peuvent donc conserver deux objets distincts. Une entrée source de Montréal peut aussi produire plusieurs objets, un par impact retenu.

Les clés communes ci-dessous constituent le format généralement construit par les importateurs. Elles ne garantissent pas une information publiée ni une valeur valide. Les clés facultatives peuvent être absentes, valoir `undefined` ou `null`, ou contenir une chaîne vide. Une absence n'est pas remplacée systématiquement par `null` dans le code actuel.

#### Clés communes

| Clé de l'objet `Entrave` | Type actuel | Description | Remarque |
| --- | --- | --- | --- |
| `id` | `string` | Identifiant utilisé par le site pour distinguer l'objet. | Souvent construit avec un préfixe de source; clé du dédoublonnage. |
| `title` | `string` | Titre de l'entrave affiché dans la liste et la fiche. | Peut être reconstruit depuis plusieurs champs source. |
| `category` | `string` | Catégorie de l'application : municipal, privé, événement, etc. | Ce n'est pas le type d'impact automobile. |
| `sourceKind` | `string` | Famille technique d'importation, par exemple `montreal-wfs` ou `quebec511-mtmd-wfs`. | Sert aussi à appliquer certaines règles propres aux sources. |
| `source` | `string` | Nom lisible de l'origine de l'information. | Utilisé pour l'attribution et les regroupements. |
| `sourceUrl` | `string` | Adresse de la source ou de l'avis. | Peut mener à une carte générale plutôt qu'à un avis individuel. |
| `responsible` | `string` ou `null` | Responsable retenu pour la fiche. | Peut être publié, déduit de la source ou remplacé par une valeur par défaut. |
| `borough` | `string` | Libellé ou code territorial conservé par l'importateur. | Peut désigner un arrondissement, une ville ou un secteur; pas une colonne d'arrondissement uniforme. |
| `streets` | `string` | Localisation textuelle de l'entrave. | Peut inclure nom de rue, limites, numéro de route et précisions. |
| `direction` | `string` | Direction ou explication relative au segment. | Peut contenir un message « non publiée » ou une description, pas seulement un point cardinal. |
| `startDate` | `string`, parfois `null` | Date de début retenue, généralement `AAAA-MM-JJ`. | Peut être vide ou issue d'une règle de l'importateur. |
| `endDate` | `string`, parfois `null` | Date de fin retenue, généralement `AAAA-MM-JJ`. | Peut être vide; `2099-12-31` peut marquer une durée indéterminée. |
| `impact` | `string` | Description de l'effet sur la circulation. | Texte libre, parfois assemblé depuis plusieurs champs. |
| `trafficLabel` | `string` | Libellé court de l'impact. | Distinct du code harmonisé `severity`. |
| `severity` | `string` | Code d'impact : `critical`, `major`, `moderate`, `parking` ou cas particulier `minor`. | Utilisé par les filtres et la palette du site. |
| `roadType` | `string` ou `null` | Type de voie reconnu : `highway`, `route`, `road`, `street`, `bridge`, `tunnel`. | Classification souvent déduite du texte. |
| `periods` | `Array<string>` | Catégories temporelles `day` et/ou `night`. | Peuvent être définies par défaut sans horaire précis publié. |
| `color` | `string` | Couleur d'affichage appliquée après la classification. | Ne doit pas servir à déduire la catégorie ou la gravité d'une source. |
| `geometry` | Objet GeoJSON | Géométrie utilisée pour représenter l'entrave. | Contient notamment `type` et `coordinates`; géométrie publiée ou reconstruite. |
| `point` | Tableau de deux nombres | Point représentatif dans l'ordre `[longitude, latitude]`. | N'est pas nécessairement le centre du chantier. |

#### Clés facultatives des importateurs

| Clé de l'objet `Entrave` | Type lorsqu'elle est renseignée | Description | Présence habituelle |
| --- | --- | --- | --- |
| `reference` | `string` | Référence métier, souvent un numéro de permis. | Montréal, snapshots municipaux et certains signalements. |
| `sourceRecordId` | `string` | Identifiant de l'enregistrement d'origine. | Montréal; distinct de l'`id` créé par impact. |
| `siteAuthority` | `string` | Code du type de demandeur ou de responsable publié. | Montréal. |
| `organization` | `string` | Nom de l'organisation conservé séparément du responsable affiché. | Montréal; peut être `null`. |
| `responsibleCode` | `number` | Code numérique du responsable publié par la source. | Longueuil; peut être `null`. |
| `routeNumber` | `string` | Numéro de route ou d'autoroute publié. | MTMD; peut être `null`. |
| `rawType` | `string` | Type d'impact original conservé. | Montréal, UCI, Longueuil, Repentigny. |
| `width` | `string` | Largeur d'impact conservée telle que publiée. | Montréal; aucune conversion numérique commune. |
| `startTime` | `string` | Heure de début, généralement `HH:MM`. | MTMD et certains compléments Noovo. |
| `endTime` | `string` | Heure de fin, généralement `HH:MM`. | MTMD et certains compléments Noovo. |
| `schedule` | `Array<object>` | Horaire par jour; structure détaillée plus bas. | Montréal et signalements citoyens. |
| `scheduleText` | `string` | Horaire ou précision en texte libre. | Terrebonne, Boisbriand, signalements citoyens; peut être vide ou `null`. |
| `publishedIntervals` | `Array<string>` | Intervalles publiés sous la forme début/fin. | Importateur Open511 de Repentigny; présence conditionnelle à une réponse exploitable. |
| `details` | Tableau de couples | Lignes complémentaires de fiche sous la forme `[libellé, valeur]`. | Plusieurs sources; les valeurs vides sont écartées à l'affichage. |
| `directionIsSegmentDescription` | `boolean` | Signale que la direction décrit le segment. | Montréal; intervient dans le regroupement des fiches. |
| `automobileImpact` | `boolean` | Indique si l'entrée concerne la circulation automobile. | Certains importateurs municipaux; `false` est exclu lors du dédoublonnage en mode auto. |
| `geometryNote` | `string` | Explication de la provenance ou de la limite du tracé. | Montréal et certains tracés municipaux/PJCCI; peut être `null`. |
| `tunnelNote` | `string` | Note complémentaire liée à un tunnel. | MTMD; peut être `null`. |
| `routeEndpoints` | Tableau de coordonnées | Extrémités utilisées pour l'alignement d'un trajet. | Entraves régionales, piétonnisations et avis municipaux intégrés. |
| `roadSearchText` | `string` | Texte dédié à l'identification ou la recherche de la voie. | Dorval, Boisbriand, Noovo notamment. |
| `roadQueries` | `Array<string>` | Noms de voies utilisés pour chercher une géométrie. | Compléments Noovo. |
| `searchRadius` | `number` | Rayon de recherche de géométrie. | Certains compléments; paramètre technique, pas étendue mesurée de l'entrave. |
| `limitCoordinates` | Tableau de coordonnées | Bornes utilisées pour délimiter le tracé recherché. | Certains compléments Noovo. |
| `directionFilter` | `string` | Filtre directionnel appliqué à la géométrie. | Certains compléments Noovo; différent de la description publique `direction`. |
| `hideOverlappingUci` | `boolean` | Active la règle de masquage de restrictions UCI couvertes par un complément. | Certains compléments Noovo; pas une fusion des objets source. |
| `geometryDisplay` | `string` | Indication de représentation géométrique. | Certains compléments Noovo. |

#### Données conservées depuis les snapshots

Certains importateurs utilisent `...record` ou `...closure`. Ils copient donc les propriétés du fichier avant d'ajouter ou de remplacer les clés communes. Ces propriétés supplémentaires restent dans les objets admissibles, sans être toutes normalisées ni affichées. De nouveaux champs de snapshot pourraient ainsi apparaître sans modification explicite du schéma.

| Clé conservée | Type lorsqu'elle est renseignée | Description | Origine habituelle |
| --- | --- | --- | --- |
| `trafficLabels` | `Array<string>` | Liste des impacts ou natures de travaux publiés. | Mont-Royal, Beaconsfield, signalements. |
| `publishedProject` | `object` | Projet brut avec informations, phases, segments et autres structures du fournisseur. | Mont-Royal; ses sous-clés ne sont pas des colonnes communes aux municipalités. |
| `publishedSchedule` | `string` | Période publiée conservée en texte. | Beaconsfield; distinct de l'horaire normalisé `schedule`. |
| `placemarks` | `Array<object>` | Objets KML à l'origine de l'enregistrement; notamment `id`, `index`, `name`, `type`. | Beaconsfield. |
| `sourceDetailUrl` | `string` | Lien vers le détail de la publication. | Beaconsfield. |
| `sourceDescriptionHtml` | `string` | Description HTML originale conservée. | Beaconsfield; non affichée intégralement dans la fiche standard. |
| `geometrySource` | `object` ou `string` | Provenance du tracé dans le format du snapshot. | Mont-Royal et signalements notamment; structure non uniforme. |
| `geometrySourceUrl` | `string` | Lien vers la source géométrique. | Beaconsfield notamment. |
| `geometryStatus` | `string` | Statut de vérification ou de construction géométrique conservé. | Signalements notamment; ailleurs une information équivalente peut rester dans `details` ou dans le snapshot. |
| `coordinates` | Tableau de deux nombres | Coordonnées originales des données de secours, dans l'ordre `[latitude, longitude]`. | Secours seulement; ne pas les confondre avec l'ordre de `point`. |
| `path` | Tableau de coordonnées | Tracé original des données de secours, en `[latitude, longitude]`. | Secours seulement; `geometry` contient la conversion en GeoJSON. |

#### Clés des signalements citoyens

Le chargement ne retient que les enregistrements admissibles à la carte, géométriquement vérifiés et disposant d'impacts valides. Chaque impact retenu devient un objet `Entrave` distinct. L'objet combine `...record` puis `...impact`; l'`id` final est donc celui de l'impact, et `geometryRef` garde le lien avec le signalement.

| Clé | Type lorsqu'elle est renseignée | Description | Remarque |
| --- | --- | --- | --- |
| `municipality` | `string` | Municipalité déclarée puis conservée dans le snapshot. | Plus explicite que le champ commun `borough`. |
| `limits` | `Array<string>` | Limites textuelles de l'emplacement. | Donnée déclarée, pas nécessairement deux intersections géocodées. |
| `description` | `string` | Commentaire du signalement. | Peut être `null`. |
| `type` | `string` | Type de l'impact du signalement. | Différent de `stats.items[].type`, qui décrit le responsable. |
| `status` | `string` | État retenu pour le signalement, par exemple `reported-active`. | Pas le statut administratif d'un permis municipal. |
| `statusSource` | `string` | Origine de l'information de statut. | Aide à interpréter la fiabilité du statut. |
| `submittedAtLocal` | `string` | Date et heure locales de réception. | Ne pas supposer une conversion UTC déjà faite. |
| `submissionTimeZone` | `string` ou `null` | Fuseau de réception lorsqu'il est connu. | Peut être non renseigné. |
| `submissionRef` | `string` | Référence de la réponse reçue. | Pas un numéro de permis. |
| `submissionTimestampRaw` | `string` | Horodatage original de la réponse. | Conservé pour la traçabilité. |
| `observedAt` | `string` | Date d'observation ou de consultation déclarée. | Distincte de la réception du formulaire. |
| `informationOrigin` | `string` | Origine déclarée de l'information. | Observation ou avis consulté, par exemple. |
| `supportingSourceUrl` | `string` ou `null` | Lien justificatif fourni. | Peut être absent ou vide. |
| `supportingSourceReview` | `object` | Analyse d'un lien justificatif : période, localisation et conclusion. | Propagé uniquement si un enregistrement admissible le contient. |
| `reportedFields` | `object` | Réponses originales, indexées par libellé de question. | Objet brut, pas un dictionnaire de colonnes normalisées. |
| `reportedDates` | `object` | Dates saisies, précision, texte publié et réserves. | Complète les dates retenues dans `startDate` et `endDate`. |
| `review` | `object` | Résultat de validation : `status`, `mapEligible`, `geometryVerified`, `restrictionOfficiallyVerified`, `warnings`. | La validation géométrique ne confirme pas la restriction. |
| `impacts` | `Array<object>` | Liste d'impacts du signalement d'origine. | Reste conservée même après création d'un objet final par impact. |
| `geometryRef` | `string` | Identifiant du signalement dont la géométrie est réutilisée. | Relie les impacts à leur origine commune. |
| `recurringSchedule` | `object` | Horaire récurrent original : jours, heures, fuseau, texte et limites. | Sert au filtrage temporel des signalements. |

#### Clés techniques précalculées

Ces cinq propriétés sont ajoutées par [prepareClosureForRuntime](../js/app.js#L3242). Elles accélèrent les recherches et les filtres; ce ne sont pas de nouvelles données publiées par les sources.

| Clé | Type | Description | Remarque |
| --- | --- | --- | --- |
| `_runtimePrepared` | `boolean` | Marque l'objet comme préparé. | Vaut `true` après préparation. |
| `_searchText` | `string` | Texte normalisé réunissant les champs recherchables. | Un index de recherche, pas une nouvelle description officielle. |
| `_startTime` | `number` | Horodatage de début en millisecondes. | Heure absente : `00:00`; heure invalide : repli au midi local. Peut être `NaN` si la date est inexploitable. |
| `_endTime` | `number` | Horodatage de fin en millisecondes. | Heure absente : `23:59`; heure invalide : repli au midi local. Peut être `NaN`. |
| `_bounds` | Tableau de quatre nombres ou `null` | Emprise `[ouest, sud, est, nord]`, calculée depuis la géométrie ou le point. | Sert aux tests d'intersection avec la carte. |

### Objets imbriqués

Les clés ci-dessous ne sont pas des tableaux globaux : elles appartiennent à chaque objet `Entrave`.

| Chemin | Type | Description | Utilisation |
| --- | --- | --- | --- |
| `schedule[].day` | `string` | Jour de semaine, par exemple `Mon`. | Regroupement des jours et affichage des horaires. |
| `schedule[].allDay` | `boolean` | Indique une journée complète. | Évite d'interpréter des heures absentes comme une plage précise. |
| `schedule[].start` | `string`, `null` ou `undefined` | Heure de début pour ce jour. | Utilisée si l'entrée n'est pas une journée complète. |
| `schedule[].end` | `string`, `null` ou `undefined` | Heure de fin pour ce jour. | Même réserve que pour l'heure de début. |
| `details[][0]` | `string` | Libellé d'une information complémentaire. | Par exemple « Détour », « Référence », « Nature ». |
| `details[][1]` | Valeur variable | Valeur de l'information complémentaire, généralement texte ou nombre. | Ce n'est pas une colonne dédiée commune à toutes les sources; les valeurs vides sont masquées dans les fiches. |
| `geometry.type` | `string` | Type GeoJSON de la géométrie. | Par exemple `Point`, `LineString`, `MultiLineString`, `Polygon`, `MultiPolygon`. |
| `geometry.coordinates` | Tableau imbriqué de nombres | Coordonnées dont la profondeur dépend du type GeoJSON. | Les deux premières composantes d'une position sont longitude et latitude. |
| `recurringSchedule.days` | `Array<string>` | Jours concernés par le signalement. | Horaire récurrent du signalement d'origine. |
| `recurringSchedule.allDay` | `boolean` | Horaire continu durant les jours concernés. | Distinct d'une fermeture permanente tous les jours. |
| `recurringSchedule.startTime`, `recurringSchedule.endTime` | `string` ou `null` | Bornes de l'horaire récurrent. | Valeurs originales conservées. |
| `recurringSchedule.timeZone`, `recurringSchedule.timeZoneBasis` | `string` ou `null` | Fuseau et justification de ce fuseau. | Permettent d'interpréter les heures déclarées. |
| `recurringSchedule.reportedText`, `recurringSchedule.outsideScheduleText`, `recurringSchedule.limitation` | `string` ou `null`, parfois absentes | Texte original, précision hors horaire et limites. | N'impliquent pas une validation officielle des horaires. |

### Sélections de la carte

`currentClosures` reçoit le résultat de [getFilteredClosures](../js/app.js#L1326) lors de [updateView](../js/app.js#L4287), en mode carte. Les entraves sont sélectionnées selon les catégories, impacts, horaires, dates et recherche; les restrictions couvertes par un complément sont écartées. Le tableau est trié par rang d'impact.

**Il n'y a pas de nouvelle liste de colonnes pour `currentClosures` : ce sont les mêmes objets que ceux de `allClosures`.** Le cadrage intervient ensuite dans `getClosuresInViewport()`. La liste visible ajoute également certains avis PJCCI hors cadre; elle ne correspond donc pas toujours exactement au compteur des seules entraves dans la vue.

En mode statistiques, `updateView()` appelle le rendu statistique puis retourne avant de recalculer `currentClosures`. Ce tableau peut donc conserver l'état précédent de la carte. **Les statistiques ne s'appuient pas sur lui : elles repartent de `allClosures`.**

### Objets statistiques

#### Objet retourné par computeStats

[computeStats](../js/stats.js#L445) ne renvoie pas directement un tableau : il renvoie un objet contenant trois tableaux et deux informations de période.

| Clé | Type | Description | Filtrage et particularité |
| --- | --- | --- | --- |
| `items` | `Array<ItemStatistique>` | Entraves enrichies pour les analyses. | Impacts et jour/nuit sélectionnés; chevauchement avec la période sauf mode toutes dates. |
| `range` | Objet avec `start` et `end` | Période choisie; les deux valeurs sont des objets JavaScript `Date`. | Une fin ouverte peut correspondre à `2099-12-31`. |
| `today` | `string` | Date du jour au format `AAAA-MM-JJ`. | Point de référence des échéances et de l'ancienneté. |
| `starting` | `Array<Entrave>` | Début annoncé strictement après aujourd'hui et au plus tard dans sept jours. | Construit depuis les candidats, pas depuis `items`; signalements citoyens et entraves déjà expirées exclus. |
| `ending` | `Array<Entrave>` | Entraves déjà commencées avec fin annoncée d'aujourd'hui à dans sept jours. | Même base que `starting`; les fins en `2099` ou au-delà sont exclues. |

Les candidats suivent les impacts et le filtre jour/nuit et écartent les restrictions couvertes par un complément. Ils ne suivent pas la recherche, les catégories de la carte ni son cadrage. Le filtre de période de `items` n'est pas appliqué de la même manière aux échéances `starting` et `ending`.

#### Clés de stats.items

Un élément de `stats.items` contient **exactement les cinq propriétés construites ci-dessous**. Les champs de l'entrave ne sont pas recopiés au même niveau : ils restent accessibles par `item.closure`.

| Clé | Type | Description | Exemple d'accès |
| --- | --- | --- | --- |
| `closure` | Objet `Entrave` | Référence vers l'entrave normalisée. | `item.closure.startDate`, `item.closure.severity`. |
| `type` | `string` | Type de responsable calculé : `city`, `publicOrg`, `cityContractor`, `private`, `utility`, `citizen`, `event`, `citizenReport`, `unknown`. | `item.type`; pas le type de voie ni l'impact. |
| `route` | `string` ou `null` | Numéro de voie harmonisé pour les statistiques, par exemple `A-40` ou `R-132`. | `item.route`; peut être déduit du texte. |
| `organization` | `string` ou `null` | Organisation identifiable pour les types d'acteurs concernés. | `item.organization`; résultat d'une règle analytique, pas toujours identique au champ source. |
| `length` | Objet avec `kind` et `meters` | Résultat de la mesure ou de l'estimation géométrique. | `item.length.kind`, `item.length.meters`. |

| Clé de `length` | Type | Description | Valeurs et limites |
| --- | --- | --- | --- |
| `kind` | `string` | Méthode ou impossibilité de mesure. | `line` : tracé mesuré; `estimated` : zone allongée estimée; `compact` : zone sans longueur exploitable; `none` : pas de longueur mesurable. |
| `meters` | `number` | Longueur en mètres utilisée par les calculs. | Pour `compact` ou `none`, le code retourne `0` : c'est une absence de mesure, pas la preuve d'une entrave de longueur nulle. |

La municipalité harmonisée, le nom de rue retenu, le secteur public/privé, la durée prévue et l'ancienneté ne sont pas tous enregistrés comme propriétés supplémentaires de `stats.items`. Ils sont calculés par les fonctions ou sections qui en ont besoin.

#### Compléments du mode territorial

[territoryScope](../js/stats.js#L1316) garde la structure précédente, filtre `items`, `starting` et `ending` sur le territoire choisi, puis ajoute `options` et `choice`.

| Chemin | Type | Description | Remarque |
| --- | --- | --- | --- |
| `options.municipalities` | `Array<object>` | Municipalités proposées avant restriction au territoire choisi. | Chaque objet possède `key`, `label`, `count`. |
| `options.municipalities[].key` | `string` | Clé normalisée de la municipalité. | Sert à comparer les choix. |
| `options.municipalities[].label` | `string` | Libellé affiché de la municipalité. | Choisi parmi les libellés présents dans les données. |
| `options.municipalities[].count` | `number` | Nombre d'éléments statistiques associés à ce choix. | Dépend du périmètre statistique courant. |
| `options.boroughs` | `Array<object>` | Arrondissements trouvés dans les entraves du flux Montréal. | Chaque objet possède `key` et `label`, sans `count`. |
| `options.boroughs[].key` | `string` | Code d'arrondissement retenu. | Issu du champ `borough` de Montréal. |
| `options.boroughs[].label` | `string` | Nom lisible de l'arrondissement. | Traduit à partir du code lorsque possible. |
| `choice.municipality` | `string` | Clé de la municipalité effectivement affichée. | Peut utiliser un choix de repli pendant le chargement. |
| `choice.borough` | `string` | Code de l'arrondissement effectivement affiché. | Chaîne vide si aucun arrondissement n'est sélectionné. |

### Objets des graphiques

Les sections statistiques fabriquent leurs agrégats, puis [chartBlock](../js/stats.js#L599) ajoute une description au tableau `chartSpecs` si elle contient des libellés. [chartConfig](../js/stats.js#L1521) convertit cette description en configuration Chart.js. Ces objets sont reconstruits au rendu; ils ne sont pas ajoutés aux entraves de `allClosures`.

| Clé d'une `SpecificationGraphique` | Type | Description | Présence |
| --- | --- | --- | --- |
| `key` | `string` | Identifiant du graphique dans la vue. | Commun. |
| `type` | `string` | Format interne : `hbar`, `vbar`, `doughnut` ou `sunburst`. | Le format `sunburst` est réalisé avec deux anneaux Chart.js. |
| `labels` | `Array<string>` | Libellés des catégories représentées. | Commun; peut ne contenir qu'un classement limité, pas toutes les lignes du tableau de chiffres. |
| `height` | `number` | Hauteur de base en pixels. | Présentation, pas une mesure métier. |
| `summary` | `string` | Résumé textuel accessible du graphique. | Commun. |
| `totals` | `Array<number>` | Totaux par catégorie, notamment pour les étiquettes. | Graphiques en barres. |
| `series` | `Array<object>` | Séries des graphiques en barres. | Chaque série possède `label`, `values`, `color`. |
| `series[].label` | `string` | Nom de la série. | Par exemple un type d'impact. |
| `series[].values` | `Array<number>` | Valeurs alignées sur `labels`. | Même ordre que les catégories du graphique. |
| `series[].color` | `string` | Couleur de la série. | Paramètre d'affichage. |
| `values` | `Array<number>` | Valeurs des secteurs. | Anneaux, dont anneau externe du `sunburst`. |
| `colors` | `Array<string>` | Couleurs des secteurs. | Alignées sur `values`. |
| `innerLabels` | `Array<string>` | Libellés de l'anneau interne. | `sunburst` seulement. |
| `innerValues` | `Array<number>` | Valeurs de l'anneau interne. | `sunburst` seulement. |
| `innerColors` | `Array<string>` | Couleurs de l'anneau interne. | `sunburst` seulement. |
| `sideLegend` | `string` | Légende latérale en HTML. | Facultative. |

Dans la configuration remise à Chart.js, `series[].values` devient `data.datasets[].data`, et `series[].color` devient `backgroundColor`. Pour les anneaux, les valeurs et couleurs sont placées directement dans les jeux de données correspondants.

Le tableau `charts` contient ensuite les instances créées par `new Chart(...)`. Il sert à gérer le rendu et sa destruction, pas à conserver une nouvelle version de toutes les entraves. Certains indicateurs utilisent du HTML plutôt que Chart.js et n'ont donc pas d'entrée dans `chartSpecs`.

### Exemple de normalisation

| Source et champ reçu | Clé dans l'objet final | Type retenu | Ce que fait le code |
| --- | --- | --- | --- |
| Montréal : `durationStartDate` | `startDate` | `string` | Retient la partie date. |
| MTMD : `debut` | `startDate` et `startTime` | Deux chaînes | Sépare la date et l'heure publiées. |
| Dorval : `DateDebut` | `startDate` | `string` | Convertit la valeur reçue en date. |
| Montréal : `permitPermitId` | `reference` | `string` ou `null` | Conserve le numéro de permis séparément. |
| Montréal : `id` | `sourceRecordId`, et contribution à `id` | `string` | Garde l'identifiant source et construit un identifiant distinct par impact. |
| MTMD : `identifiantChantier` | Aucune clé commune actuelle | Non recopié | Reste dans la réponse brute, pas dans l'entrave normalisée par cet importateur. |
| Montréal : `externalReferenceIds` | Aucune clé commune actuelle | Non recopié | Reste dans la réponse brute, pas dans l'objet final. |

Il n'existe donc pas une seule colonne fusionnant tous les identifiants. [popupReference](../js/app.js#L3607) choisit une référence à afficher, puis un identifiant de remplacement si nécessaire : il ne modifie pas le modèle des données.

### Ce qui reste séparé

- Les **réponses API brutes** sont notamment conservées dans `memoryFetchCache`, une `Map` indexée par URL. Ce cache peut contenir des champs que les objets normalisés n'ont pas repris; ce n'est pas une table finale harmonisée.
- Les **géométries résolues de Montréal** sont indexées dans `montrealResolvedGeometries`, une `Map` par `requestId`. Une entrée peut aider à reconstruire une entrave, sans que toutes ses propriétés `analysis` soient recopiées dans `allClosures`.
- Les **snapshots** contiennent aussi des métadonnées, des enregistrements exclus et des couches qui ne deviennent pas tous des entraves auto. Les retrouver dans un fichier ne signifie pas les retrouver dans `allClosures`.
- Les **totaux, pourcentages et autres agrégats** sont construits par les sections statistiques. Ce ne sont pas des colonnes présentes sur chaque entrave.
- Les **objets de présentation** et les **instances Chart.js** ne doivent pas être confondus avec le modèle d'entrave.

**Bilan : le site partage déjà un noyau de clés communes, mais conserve aussi des variantes par source. Les clés équivalentes sont normalisées lorsqu'un importateur le prévoit; les identifiants de nature différente restent distincts, et une partie de l'inventaire n'a pas encore de colonne finale commune.**

[Retour à la documentation du projet](README.md)
