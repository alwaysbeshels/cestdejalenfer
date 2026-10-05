# Modèle de données pour les graphiques personnalisés

Proposition préparée le **4 octobre 2026** pour l'onglet **Personnalisé / Custom** des statistiques des entraves routières.

**Statut : première version implémentée localement.** Ce document conserve le modèle de référence discuté pour les tableaux d'objets et leurs croisements. La section « État de la page » précise ce qui est livré; les colonnes supplémentaires restent à harmoniser. Aucune publication du site n'est effectuée par cette implémentation.

Les nids-de-poule et le colmatage sont exclus. L'[inventaire des données et des objets existants](INVENTAIRE_DONNEES_ENTRAVES_ROUTIERES.md) reste la référence pour distinguer ce que le site possède actuellement de ce que cette proposition ajouterait.

## Sommaire

- [Objectif](#objectif)
- [Architecture proposée](#architecture-proposée)
- [Le tableau customClosures](#le-tableau-customclosures)
  - [Colonnes principales](#colonnes-principales)
  - [Colonnes supplémentaires à harmoniser](#colonnes-supplémentaires-à-harmoniser)
- [Le tableau customChartRows](#le-tableau-customchartrows)
- [Le catalogue customFields](#le-catalogue-customfields)
- [Croisements entre les données](#croisements-entre-les-données)
- [Fonctionnement des sélections](#fonctionnement-des-sélections)
- [Garde-fous](#garde-fous)
- [État de la page](#état-de-la-page)
- [Validation](#validation)

## Objectif

Permettre à l'utilisateur de composer son graphique directement à l'écran : choisir ce qu'il souhaite comparer, la répartition en séries, la mesure et les éléments à inclure ou exclure.

Tous les graphiques de l'onglet Personnalisé utiliseraient la même base d'entraves. Changer de comparaison ne demanderait pas de recréer une collection de données indépendante pour chaque graphique.

## Architecture proposée

La proposition repose sur **deux tableaux de données et un catalogue de choix**.

| Structure | Nature | Une ligne représente | Rôle |
| --- | --- | --- | --- |
| `customClosures` | Tableau de données détaillées | Une entrave normalisée, pas nécessairement un chantier unique. | Base commune des filtres et des analyses. |
| `customChartRows` | Tableau de résultats agrégés | Un groupe et une série pour une mesure donnée. | Résultat du croisement choisi, prêt à être présenté dans un graphique. |
| `customFields` | Catalogue de configuration | Un choix de regroupement, de filtre ou de mesure. | Décrit les colonnes disponibles, leurs calculs et leurs compatibilités. |

Ces structures n'ont pas le même niveau de détail. `customFields` décrit les choix : ce n'est pas une seconde collection d'entraves. `customChartRows` contient les résultats calculés : ce n'est pas une copie de `customClosures`.

## Le tableau customClosures

**Une ligne par entrave normalisée.** Ce tableau serait construit à partir de `allClosures`, avec des compléments des sources lorsque nécessaire.

Les catégories utiliseraient des codes stables, les mesures des nombres et les dates des chaînes normalisées. Une information inconnue vaudrait `null`, pas zéro. Les noms lisibles seraient conservés séparément des clés utilisées pour les rapprochements.

### Colonnes principales

| Famille | Colonnes proposées | Types proposés | Utilité |
| --- | --- | --- | --- |
| Identifiants | `id`, `sourceRecordId`, `permitReference`, `projectId` | Identifiants textuels; références non disponibles à `null`. | Retrouver l'entrave et distinguer entrée source, permis et chantier. |
| Source | `sourceKind`, `sourceLabel`, `sourceUrl` | Textes et URL. | Filtrer par provenance et consulter l'avis. |
| Municipalité | `municipalityKey`, `municipalityLabel` | Clé et libellé textuels, ou `null`. | Comparer des municipalités avec une clé stable et un nom lisible. |
| Arrondissement | `boroughKey`, `boroughLabel` | Clé et libellé textuels, ou `null`. | Comparer les arrondissements lorsque cette information est disponible. |
| Voie | `streetKey`, `streetLabel`, `routeNumber`, `roadKind` | Textes ou codes, ou `null`. | Comparer rues, routes, autoroutes, ponts et tunnels. |
| Direction | `directionCode` | Code ou `null`. | Comparer les directions réellement publiées; sinon valeur inconnue. |
| Impact | `impactType` | Code de catégorie. | Fermeture complète, voie touchée, accès limité, stationnement. |
| Responsable | `authorityType`, `organizationKey`, `organizationLabel` | Codes et textes, ou `null` lorsque non déterminés. | Comparer types de responsables et organisations identifiables. |
| Secteurs | `performerSector`, `beneficiarySector` | Codes public/privé, ou `null`. | Distinguer qui réalise les travaux et pour qui ils sont faits. |
| Dates | `startDate`, `endDate`, `temporalStatus` | Dates normalisées ou `null`; code d'état temporel. | Filtrer les périodes et distinguer en cours, à venir, terminé ou indéterminé. |
| Durées | `plannedDurationDays`, `ageDays` | Nombres de jours ou `null`. | Comparer durées prévues et ancienneté, sans confondre les deux. |
| Horaire | `timePeriod`, `timePeriodBasis` | Codes de catégorie et de provenance. | Jour, nuit, jour et nuit, inconnu; préciser si publié, déduit ou défini par défaut. |
| Longueur | `lengthMeters`, `lengthMethod` | Nombre de mètres ou `null`; code de méthode. | Comparer les longueurs, en distinguant mesure, estimation et absence de mesure. |
| Qualité des dates | `startDateBasis`, `endDateBasis` | Codes de provenance ou de qualité. | Distinguer dates publiées, déclarées, estimées ou inconnues. |

Les champs d'identification restent séparés : l'identifiant d'une entrave n'est pas interchangeable avec un numéro de permis ou un identifiant de chantier. La présence d'une référence de chantier ne garantit pas que des références issues de sources différentes désignent le même chantier.

### Colonnes supplémentaires à harmoniser

Les colonnes suivantes seraient ajoutées après harmonisation des champs sources et vérification de leur signification. Leur présence dans une API ne signifie pas qu'elles sont déjà prêtes pour une comparaison entre municipalités.

| Colonnes supplémentaires | Type proposé | Utilité | Condition |
| --- | --- | --- | --- |
| `workNature`, `permitCategory`, `permitStatus` | Catégories ou `null`. | Comparer les natures de travaux et les permis. | Harmoniser les codes et conserver les distinctions entre sources. |
| `isArterial` | Booléen ou `null`. | Distinguer les artères des autres voies. | Ne pas traiter l'absence d'information comme `false`. |
| `parkingSpacesRemoved` | Nombre ou `null`. | Comparer le stationnement touché. | Confirmer le sens du champ et la couverture disponible. |
| `sidewalkImpact`, `cyclingImpact`, `transitImpact` | Catégories ou `null`. | Croiser l'impact automobile avec les autres modes de déplacement. | Harmoniser les niveaux de restriction publiés. |

## Le tableau customChartRows

**Une ligne par groupe et par série**, recalculée selon les choix de l'utilisateur. Les filtres qui ont servi au calcul sont conservés dans le contexte de la sélection.

Les colonnes `groupFieldKey` et `seriesFieldKey`, ajoutées à la proposition initiale, rendent chaque résultat explicite : elles indiquent quelles dimensions ont été croisées, et pas seulement les valeurs trouvées.

| Colonne | Type proposé | Description | Exemple ou précision |
| --- | --- | --- | --- |
| `groupFieldKey` | Texte | Identifie la dimension comparée. | `municipalityKey`. |
| `groupKey` | Texte ou `null` | Clé de l'élément comparé. | Clé stable de Laval; `null` pour un groupe inconnu si celui-ci est conservé. |
| `groupLabel` | Texte | Nom affiché de l'élément comparé. | Laval. |
| `seriesFieldKey` | Texte ou `null` | Identifie la dimension utilisée pour la répartition. | `impactType`; `null` sans répartition en séries. |
| `seriesKey` | Texte ou `null` | Clé de la série. | Code de fermeture complète. |
| `seriesLabel` | Texte ou `null` | Nom affiché de la série. | Fermeture complète. |
| `metricKey` | Texte | Identifie la mesure calculée. | Nombre, pourcentage, kilomètres, durée médiane. |
| `value` | Nombre ou `null` | Résultat à afficher. | Une mesure inconnue reste `null`. |
| `unit` | Code | Unité du résultat. | Entraves, %, mètres ou jours; l'affichage convertit les mètres en kilomètres et les jours en mois moyens. |
| `recordCount` | Entier | Nombre d'entraves du groupe après filtrage. | Effectif avant exclusion des valeurs manquantes pour la mesure. |
| `validCount` | Entier | Nombre d'entraves avec une valeur exploitable pour la mesure. | Permet d'interpréter une médiane ou une somme partielle. |
| `missingCount` | Entier | Nombre d'entraves sans valeur exploitable pour la mesure. | Rend visible l'information manquante. |
| `denominator` | Nombre ou `null` | Base utilisée pour un pourcentage. | Le périmètre de cette base doit être explicite. |

Par exemple, **Laval x fermeture complète x nombre d'entraves** produit une ligne. Avec la même sélection et la mesure « durée prévue médiane », le résultat est recalculé uniquement à partir des durées exploitables.

Avec `groupFieldKey`, `groupKey`, `seriesFieldKey`, `seriesKey` et `metricKey`, on sait quelles dimensions et quelle mesure définissent la ligne. Les filtres conservés dans le contexte précisent sur quel périmètre le résultat a été calculé.

## Le catalogue customFields

Ce catalogue de configuration permettrait de construire les menus et de proposer des combinaisons compatibles.

| Colonne | Type proposé | Description | Utilité |
| --- | --- | --- | --- |
| `key` | Texte | Identifiant stable du choix. | Relier la sélection à sa définition. |
| `labelKey` | Texte | Clé de traduction français/anglais. | Afficher le libellé sans utiliser le texte traduit comme identifiant. |
| `role` | Code | Regroupement, filtre ou mesure. | Organiser les choix proposés à l'utilisateur. |
| `field` | Texte ou `null` | Colonne de données utilisée. | Peut être `null` pour un comptage de lignes sans colonne numérique dédiée. |
| `valueType` | Code | Type de valeur manipulée. | Catégorie, nombre, date, booléen, etc. |
| `unit` | Code ou `null` | Unité pertinente pour le choix. | Aucune unité pour une simple catégorie. |
| `aggregation` | Code ou `null` | Calcul applicable. | Comptage, somme, médiane ou pourcentage; sans agrégation pour un simple filtre. |
| `compatibleChartTypes` | Liste de codes | Présentations autorisées pour ce choix. | Éviter notamment un anneau de durées médianes. |
| `availability` | Code | État de disponibilité du choix. | Disponible ou nécessitant encore une normalisation. |

`customFields` décrit quels champs peuvent se combiner et comment calculer les résultats. Il ne contient ni les entraves détaillées ni les valeurs finales des graphiques.

## Croisements entre les données

Les croisements partiraient tous de **la même base `customClosures`**. Les dimensions à croiser sont déjà présentes sur la même ligne d'entrave.

| Comparer | Répartir par | Mesurer | Résultat recherché |
| --- | --- | --- | --- |
| Municipalité | Type d'impact | Nombre d'entraves | Voir les volumes et la composition des impacts de chaque municipalité. |
| Arrondissement | Secteur qui réalise les travaux | Durée prévue médiane | Comparer les durées exploitables selon le territoire et le réalisateur public/privé. |
| Type de voie | Type d'impact | Longueur estimée touchée | Comparer les longueurs connues ou estimées selon le réseau et l'impact. |
| Organisation | Municipalité | Nombre d'entraves | Voir la répartition territoriale des entraves associées aux organisations identifiables. |

Pour « municipalité x impact », on regroupe les entraves par ces deux colonnes, puis on calcule la mesure. Il n'est pas nécessaire de joindre deux tableaux indépendants.

On peut ensuite limiter l'analyse à certaines municipalités, certains impacts ou une période donnée. Les exemples ne présument pas que toutes les sources renseignent toutes les dimensions; les valeurs manquantes doivent rester identifiables.

## Fonctionnement des sélections

1. Préparer `customClosures` à partir des entraves chargées et des compléments disponibles.
2. Utiliser `customFields` pour proposer les regroupements, filtres, mesures et présentations compatibles.
3. Appliquer à `customClosures` les cases cochées, les menus et la période choisis par l'utilisateur.
4. Regrouper les entraves retenues par la dimension principale et, si demandée, la dimension de série.
5. Calculer la mesure et produire `customChartRows`, avec les effectifs utiles et le dénominateur des pourcentages.
6. Fournir les résultats à Chart.js pour afficher le graphique.
7. Recalculer le résultat à chaque changement de sélection, en conservant les filtres qui définissent son contexte.

Cocher ou décocher un choix agirait donc sur les données et les calculs, pas uniquement sur la visibilité d'une couleur dans la légende.

## Garde-fous

- **Utiliser les clés stables**, pas les noms affichés ou traduits, pour les regroupements et les rapprochements.
- **Garder les valeurs inconnues distinctes de zéro.** La qualité de la donnée doit rester visible dans les résultats.
- **Recalculer les médianes et les pourcentages depuis les entraves concernées.** Ne pas additionner des médianes ou des pourcentages déjà agrégés pour créer un nouveau résultat.
- **Conserver les filtres ayant servi au calcul.** Deux résultats de même libellé mais de périmètres différents ne sont pas interchangeables.
- **Ne pas confondre entrave et chantier unique.** Une référence de permis ou de chantier n'est pas une clé universelle de fusion entre sources.
- **Encadrer les combinaisons mesure/graphique.** Une durée médiane ne constitue pas une part de total adaptée à un anneau; un pourcentage doit avoir une base explicite.
- **Harmoniser les champs supplémentaires avant de les activer.** La présence d'une colonne brute ne garantit ni son remplissage ni sa comparabilité.

Cette structure permettrait de changer de croisement sans recréer un tableau de données pour chaque graphique.

## État de la page

L'onglet Personnalisé est disponible à l'adresse `?view=stats&tab=custom`, en français et en anglais. Il comporte un panneau de choix, un graphique configurable et un tableau de chiffres repliable. Sur ordinateur, le panneau de choix est une section toujours ouverte, avec « Réinitialiser les choix » immédiatement sous le titre. Sur mobile, il reste repliable. Ses listes sont recherchables et disposent d'une case « Tout » à trois états : tout coché, rien coché, ou sélection partielle. Cliquer une sélection partielle sélectionne tout.

Une recherche commencée alors que toutes les valeurs étaient cochées fait apparaître « Afficher seulement la sélection ». Cette commande conserve uniquement les valeurs visibles encore cochées et décoche les autres. Elle n'apparaît pas si la recherche commence avec une sélection partielle ou vide; cocher « Tout » après le début de la recherche ne change pas cette condition. Elle est désactivée quand aucune valeur visible n'est cochée et disparaît après application ou effacement de la recherche.

Pendant la recherche, la liste garde la hauteur qu'elle avait au début de la saisie. L'espace de l'action de sélection est réservé à côté de « Tout », afin que son apparition ne déplace pas les contrôles. Aucun choix correspondant affiche « Aucun choix ne correspond à cette recherche ». Les positions de défilement du panneau et de la vue sont conservées, ainsi que le curseur du champ lors d'un rafraîchissement. L'effacement de la recherche rétablit la hauteur naturelle de la liste.

Tous les onglets des statistiques partagent une barre principale de 96 px. Auto, Piétons et Statistiques sont empilés verticalement; les liens secondaires restent accessibles par des icônes avec infobulles et noms accessibles. Les textes de présentation répétés et la poignée du menu principal sont masqués. Sur ordinateur, le bouton de fermeture du menu est retiré. Sur mobile, le menu garde sa navigation verticale et son bouton d'ouverture/fermeture; un dégagement supérieur de 72 px place les liens sous le X. La transition entre carte et statistiques dure 280 ms et respecte la réduction des mouvements. Les autres onglets de données présentent leurs filtres communs dans une bande repliable au-dessus du contenu; l'onglet d'aide n'affiche pas de filtres inutilisés.

Le panneau de choix de Personnalisé possède sa propre poignée à flèches sur les dispositions à deux colonnes. Elle fonctionne à la souris, avec les flèches gauche/droite et les touches Home/End. Sa largeur préférée par défaut est de 360 px, pour afficher le texte du filtre de dates au complet. Sa largeur minimale reste 250 px; sa limite supérieure, au plus 520 px, conserve de l'espace pour le graphique. Cette préférence est mémorisée séparément sous `entraves-custom-panel-width-v1`; une largeur déjà choisie manuellement reste prioritaire. Un rafraîchissement de données attend la fin du déplacement avant de reconstruire le panneau.

« Période des données » est repliable et fermée par défaut. Son état ouvert est conservé pendant les changements de filtres et les rafraîchissements. Les dates sont absentes lorsque « Toutes les données disponibles » est choisi. « Type d'impact » est placé immédiatement sous la période et replié par défaut, puis vient « Moment des travaux ». Ces trois sections appartiennent au même conteneur, sans espace supplémentaire entre elles. Le filtre Source reste toujours le dernier de la liste.

Toutes les sections de filtres de « Choix des données » sont fermées à chaque chargement, y compris celles qui correspondent aux axes et aux filtres sauvegardés. Aucun regroupement enregistré ne déclenche leur ouverture initiale. L'utilisateur peut ensuite les ouvrir; leurs états sont conservés pendant les rafraîchissements de la vue. Sur mobile, le panneau de choix lui-même démarre aussi replié.

Municipalité est placée avant Arrondissement et reste repliée au chargement, même lorsqu'elle est le regroupement choisi. « Réinitialiser les choix » la replie également, sans modifier son comportement de sélection. Hors comparaison par arrondissement, ce dernier filtre apparaît seulement si Montréal fait partie des municipalités cochées, y compris « Tout »; une sélection d'arrondissement est retirée si Montréal est décochée, pour éviter un filtre invisible. Si la catégorie choisie pour un axe ou « Répartir par » vaut Arrondissement, le graphique utilise exclusivement les enregistrements dont `municipalityKey` vaut `montreal`, masque Municipalité et affiche un avertissement au-dessus du graphique. Ce périmètre s'applique aussi aux dénominateurs et aux regroupements de séries. Le choix antérieur de municipalité n'est pas écrasé : il reprend effet en quittant le mode arrondissement. Les arrondissements non renseignés restent identifiés comme tels.

La présentation se choisit dans des boîtes distinctes : type, orientation et agencement. Orientation n'apparaît que pour les barres. Agencement est masqué s'il ne propose pas plusieurs choix, notamment pour les médianes ou en l'absence de séries. Les préférences existantes restent lisibles, et l'orientation est conservée quand un changement de mesure impose des barres regroupées.

La compatibilité est réciproque : `customAxisChoices()` limite aussi les options des axes au style choisi. Camembert, anneau, aire polaire, barres empilées et barres à 100 % ne proposent que nombre, part et longueur; les médianes restent disponibles dans les représentations compatibles. Pour passer d'un empilement à une médiane, choisir d'abord l'agencement regroupé. Les quinze catégories restent valides pour les comparaisons groupées et Y2 du Mixte exclut la mesure de Y1.

Pour les comparaisons groupées, le premier choix est « X - Catégories », suivi de « Y - Mesure ». Cet ordre exprime les rôles des données : les barres horizontales conservent cet ordre de choix, même si leur dessin place physiquement la mesure à l'horizontale et les catégories à la verticale. Les types sans axes cartésiens gardent leurs notions propres. Le catalogue `customAxisControls()` ne change pas les clés des préférences déjà enregistrées.

| Type | Premier choix | Deuxième choix | Particularité |
| --- | --- | --- | --- |
| Barres horizontales | X - catégories | Y - mesure | Ordre logique des choix; le dessin place la mesure horizontalement et les catégories verticalement. |
| Colonnes verticales et courbe | X - catégories | Y - mesure | L'orientation ne change pas l'ordre des choix ni les champs sélectionnés. |
| Mixte | Axe X - catégories | Axes Y1 et Y2 indépendants | Y1 correspond aux barres à gauche; Y2 à la courbe à droite. |
| Camembert et anneau | Catégories | Valeur - mesure | Pas d'axes X/Y : les catégories sont les secteurs et la valeur détermine leur part. |
| Aire polaire | Catégories | Valeur radiale - mesure | Pas d'axes cartésiens; le rayon représente la valeur. |
| Radar | Axes du radar - catégories | Valeur radiale - mesure | Chaque catégorie est une direction du radar; les séries restent possibles. |

Ces boîtes sont placées à droite du titre « Statistiques des entraves / Personnalisé » sur ordinateur, et sous ce titre lorsque la largeur ne le permet pas. Quand « Voir les données » est fermé et que les choix et le graphique sont côte à côte, leur hauteur suit l'espace restant dans la vue. Les longues listes et les graphiques denses défilent dans leur propre zone. Les fenêtres très courtes ou les dispositions empilées conservent le défilement nécessaire à la lecture; ouvrir les données peut également allonger la page.

Une icône d'information Lucide près du titre ouvre une grande fenêtre d'aide. Ses tableaux expliquent les 15 catégories, les 5 mesures et leurs unités, les filtres, les axes et les 7 familles de graphiques. Le tableau « Catégories disponibles » contient seulement le choix et sa définition, sans colonne de type. L'aide distingue une entrave d'un chantier unique, les sommes des médianes par groupe, et les valeurs réellement absentes des différences de périmètre entre onglets. Style, Orientation, Agencement et Groupes affichés ont chacun leur icône d'aide; pour Groupes affichés, le texte définit seulement la limite de catégories dessinées.

X, Y, Y1/Y2 et Répartir par ont aussi une aide contextuelle. Chaque popup explique le rôle du contrôle et présente un tableau correspondant exactement à ses options actuelles, avec leurs définitions; les types et unités sont conservés pour les mesures.

La fenêtre utilise un élément `dialog` modal, avec une largeur maximale de 960 px et un contenu défilant. Son ouverture anime uniquement l'opacité et une translation pendant 240 ms, sa fermeture pendant 160 ms; ces animations sont désactivées en mouvement réduit. Le clavier reste dans la fenêtre. Échap, le bouton de fermeture et le clic sur le fond la ferment, puis le focus revient au bouton d'origine, même après une reconstruction des contrôles. Sur téléphone, les cellules des tableaux se lisent à la suite en pleine largeur, tout en conservant leurs rôles accessibles. Le dialogue est détruit avec le contrôleur de la vue.

| Élément | Version locale | Détail | Limite |
| --- | --- | --- | --- |
| Dimensions | 15 | Municipalité, arrondissement, impact, type de voie, route, rue, type de responsable, organisation, secteur réalisateur, secteur bénéficiaire, direction, source, état temporel, jour/nuit et méthode de mesure. | Les valeurs non renseignées restent un groupe explicite. |
| Mesures | 5 | Nombre, part de la sélection, longueur estimée, durée prévue médiane et ancienneté médiane. | Les mesures inconnues restent `null`. |
| Styles | 7 familles, 12 combinaisons | Barres/colonnes regroupées, empilées ou à 100 %, camembert, anneau, aire polaire, radar, courbe comparative et mixte. | Les médianes ne sont jamais empilées ni transformées en parts de cercle. Les types de répartition et le mode mixte utilisent une seule dimension de regroupement. |
| Périmètre commun | Synchronisé | Dates, mode toutes données, impacts et jour/nuit utilisent les mêmes valeurs que les autres statistiques. | Les filtres propres au graphique ne modifient pas les catégories ou la recherche de la carte. |
| Filtres personnalisés | Sélections cumulables | Les filtres actifs restent visibles même lorsque le regroupement change. Une sélection vide ne signifie jamais « tout ». | Les choix peuvent rester sélectionnés avec un effectif nul si une source n'est plus disponible. |
| Conservation des choix | Stockage local | Regroupement, série, mesures, style, limite de groupes, mesure des barres du Mixte et filtres sont mémorisés sous `entraves-custom-chart-v1`. | Les anciennes préférences restent lisibles; les styles retirés reviennent aux barres et la mesure gauche du Mixte vaut `count` si `barMetricKey` est absent. Aucune archive des entraves n'est enregistrée. |
| Chiffres détaillés | Tableau triable et défilant | Valeur, effectifs, valeurs connues/manquantes et dénominateur; dix lignes visibles, défilement vertical et en-têtes fixes comme les autres statistiques. | Toutes les lignes restent présentes, sans pagination. Le tri passe par ordre croissant, décroissant puis initial. |
| Chargement dégradé | Tableau de repli | Si Chart.js échoue, les chiffres deviennent visibles et une commande de nouvelle tentative est proposée. | La bibliothèque graphique reste chargée depuis le CDN épinglé du site. |

La préparation est réalisée par `customRecords()` dans [le module des statistiques](../js/stats.js). Elle reprend les classifications existantes et produit une collection correspondant à `customClosures`, avec un indicateur interne `_inScope` pour les filtres communs. La vue conserve cette collection localement, sans modifier les objets originaux de `allClosures`.

[Le module personnalisé](../js/stats-custom.mjs) contient le catalogue `customFields`, les fonctions `filterCustomClosures()`, `aggregateCustomRows()` et `prepareCustomChartRows()`, ainsi que le contrôleur de la vue. Les lignes de résultat correspondent au modèle `customChartRows`; elles restent locales à la vue et ne sont pas ajoutées aux entraves.

Le tableau réutilise les classes, les icônes de tri et la fonction `limitTable()` des statistiques générales. Une colonne « État selon les dates » n'est ajoutée que si ce champ a été choisi comme dimension. Avec une sélection limitée à aujourd'hui, les états datés sont généralement « en cours »; cela ne constitue pas une mesure supplémentaire. Lorsqu'un état est constant et qu'une autre dimension décrit déjà les lignes, sa colonne est remplacée par une note unique au-dessus du tableau. La colonne reste visible si plusieurs états sont présents ou si elle est la seule dimension. Aucune valeur agrégée n'est modifiée.

Le choix Camembert, Anneau ou Aire polaire est désormais accessible directement pour les mesures additives, même si une répartition était sélectionnée auparavant. Il retire cette répartition pour présenter le total par groupe. Ces types ne sont pas proposés pour les médianes. Radar accepte des séries de même mesure; il demande au moins trois groupes et propose une limite de cinq ou dix axes pour rester lisible. La courbe comparative relie les catégories classées par effectif, sans prétendre montrer une évolution historique.

Le mode Mixte propose deux mesures indépendantes parmi les cinq mesures agrégées : `barMetricKey` pour Y1 (barres, gauche) et `metricKey` pour Y2 (courbe, droite). Par défaut, les barres montrent le nombre d'entraves et la courbe la durée prévue médiane. La même mesure n'est pas proposée simultanément sur les deux axes; si une modification de Y1 crée ce doublon, Y2 reprend une autre mesure valide. La catégorie X reste configurable, et la répartition en séries est retirée.

`prepareCustomChartRows()` calcule les deux agrégations depuis les mêmes entraves filtrées et les rapproche par clé de groupe. Les barres utilisent `barValue` et `barUnit`, la courbe `value` et `unit`; `recordCount` garde son sens d'effectif indépendamment des mesures. Les médianes sont recalculées depuis les observations, les pourcentages conservent leur base et les valeurs inconnues restent `null`. Les unités, les valeurs connues/manquantes de chaque axe (`barValidCount`, `barMissingCount`, `validCount`, `missingCount`) et les dénominateurs éventuels (`barDenominator`, `denominator`) sont distincts dans le tableau. Les réserves sur les mesures s'appliquent aux deux axes. Ce graphique compare des agrégats par catégorie : ce n'est pas un calcul de corrélation entre observations individuelles.

Les couleurs des types d'impact proviennent toujours de la palette `SEVERITY_META` du site. Cette règle s'applique à une série d'impact, aux barres/secteurs groupés par impact et aux points des courbes, radars et mixtes colorés par impact. Une ligne reliant plusieurs catégories d'impact utilise un trait neutre avec des points de la couleur de chaque impact. « Type d'impact » reste une dimension catégorielle, pas une mesure numérique.

Les autres catégories utilisent une palette contrastée de teintes distinctes. Sans répartition en séries, chaque catégorie reçoit sa couleur, y compris dans les barres et les points des courbes ou radars; les traits qui les relient restent neutres. Les valeurs inconnues sont grises. Le Mixte conserve une courbe distincte des barres, sauf lorsque ses points représentent explicitement les impacts.

Toutes les durées visibles sont exprimées en mois moyens : `jours / (365.25 / 12)`, soit 30,4375 jours par mois. Cette conversion s'applique aux axes, aux valeurs du tableau et aux infobulles, y compris en Mixte. Les données sources, les agrégats et les unités internes restent en jours. L'affichage utilise au plus une décimale et ne force pas de zéro final. Une durée positive inférieure à 0,1 mois est affichée « <0,1 », sans devenir un faux zéro.

Les styles Nuage de points et Bulles ont été retirés à la demande de l'utilisateur. Ils ne sont plus proposés ni décrits dans l'aide de la page. Leurs anciens choix sauvegardés reviennent à un graphique en barres compatible, sans supprimer les filtres valides ni modifier les durées en mois. Les contrôles Couleur par, Taille des bulles et Inclure les valeurs extrêmes ne sont plus affichés.

### Pourcentages et limitation visuelle

- La mesure « Part des entraves sélectionnées » utilise comme dénominateur toutes les entraves retenues après les filtres, y compris les groupes non dessinés.
- Les styles à 100 % utilisent la somme connue de chaque groupe comme dénominateur. Une somme nulle ne produit pas un pourcentage inventé; pour les longueurs, la base conservée dans le tableau est en mètres.
- « Groupes affichés » limite les catégories dessinées, par exemple les 10 municipalités les plus présentes; ce n'est pas un nombre de mesures. Les analyses groupées proposent 10, 20 ou 40 groupes, le Radar 5 ou 10. Le tableau conserve tous les groupes et les pourcentages gardent leur base explicite.
- Les camemberts, anneaux et aires polaires réunissent les groupes restants dans un secteur « Autres groupes » afin de conserver la totalité de la répartition connue.
- Au-delà de huit séries, les sept plus fréquentes restent distinctes et les autres sont regroupées. Les valeurs de ce regroupement sont recalculées depuis les entraves, y compris les médianes; elles ne sont pas obtenues en moyennant des médianes.

### Qualité et extensions

Les longueurs non mesurables sont converties en `null`, même si le moteur général emploie un zéro technique pour ces cas. Les dates artificielles de fin à partir de `2099` ne deviennent pas des durées prévues. Les signalements citoyens et les dates estimées ou d'origine indéterminée sont exclus des mesures de durée et d'ancienneté. Pour cette première version, les événements MTMD, les avis PJCCI et les données de secours sont traités prudemment comme d'origine temporelle indéterminée dans ces mesures; cela ne les retire pas des comptages ni de la carte.

Le champ Organisation utilise `customOrganizationName()` : il reprend les entreprises identifiées et les responsables nommés des villes, organismes publics et événements. L'ancien raccordement à `organizationName()`, volontairement réservé aux entreprises dans les autres statistiques, classait à tort ces organismes publics comme absents. La classification des secteurs conserve son fonctionnement antérieur.

Les autres écarts de valeurs manquantes viennent aussi du périmètre : le tableau des entreprises retient les entreprises nommées, celui des arrondissements uniquement `montreal-wfs`, et celui des routes par direction uniquement les routes numérotées dont la direction est publiée. Personnalisé garde les catégories inconnues dans la population sélectionnée. Les libellés précisent le cas : « Direction non publiée », « Organisation non précisée », « Sans numéro de route identifié », « Arrondissement non publié », « Voie non identifiée » ou « Longueur non mesurable ». Le compteur de valeurs absentes d'une mesure ne désigne pas le nombre de catégories inconnues.

Lors du contrôle du 4 octobre 2026 sur la sélection active de 1 175 entraves, 1 045 n'avaient pas de direction publiée, tandis que 85 avaient une longueur non mesurable. Ce sont deux champs différents. Au moins 449 entraves avec un responsable public nommé étaient affectées par l'ancien raccordement des organisations. Ces effectifs décrivent cette sélection de contrôle, pas un total permanent du site; aucune direction n'a été inventée pour réduire les absences.

Les huit colonnes supplémentaires du modèle, dont la nature des travaux, les informations de permis, le stationnement et les impacts sur les autres modes, ne sont pas encore proposées comme nouveaux champs harmonisés. Les aires remplies ne sont pas encore implémentées. « Live » désignerait une politique d'actualisation, pas un type Chart.js; il ne faut pas le confondre avec Line, la courbe comparative disponible, ni inventer un historique continu à partir des publications courantes.

La catégorie d'un axe et « Répartir par » permettent de croiser deux dimensions; les valeurs à inclure sont multisélectionnables dans les filtres. Barres et courbes relient une catégorie à une mesure agrégée, le Mixte compare deux mesures agrégées sur des axes distincts. Les graphiques circulaires et radiaux gardent leurs propres notions de catégories et de valeur au lieu d'afficher des axes X/Y fictifs.

## Validation

Depuis la racine du projet :

```bash
npm run test:custom-stats
npm run test:custom-stats -- --browser
```

Le [validateur personnalisé](../tools/validate-custom-stats.mjs) vérifie les regroupements, sélections vides, valeurs inconnues, zéros réels, médianes, dénominateurs et compatibilités de styles. Il couvre aussi le recalcul des séries regroupées.

Le parcours Playwright utilise par défaut `http://localhost:5000`; la variable `CUSTOM_STATS_URL` permet de choisir une autre origine. Il teste les douze combinaisons, les filtres, les tableaux, la conservation des choix, la navigation, les versions française et anglaise à 320, 768 et 1440 pixels, les pixels du canvas, ainsi que la panne et la relance de Chart.js. Les flux externes autres que les bibliothèques CDN sont bloqués dans ce parcours, qui s'appuie sur les snapshots locaux. Les service workers sont désactivés uniquement dans le contexte de test pour garantir les interceptions réseau.

Le parcours vérifie aussi la barre de 96 px sur tous les onglets, l'alignement vertical des modes sur ordinateur et mobile, l'espace libre sous le X mobile, l'absence de bouton de fermeture sur ordinateur, la réduction des mouvements et les valeurs intermédiaires de largeur entre carte et statistiques. Il couvre les trois états de « Tout », les dates conditionnelles, les horaires repliables, les impacts repliés sous la période, l'ordre des filtres, le retrait d'un filtre d'arrondissement masqué, la poignée à la souris et au clavier, la largeur minimale et sa conservation après rechargement.

Les contrôles supplémentaires portent sur les réglages à droite du titre, l'absence de défilement initial dans la vue desktop testée, le maintien de l'orientation, la recherche commencée en sélection complète/partielle/vide, l'isolation des valeurs visibles cochées, les dix lignes visibles avec en-têtes fixes, le cycle de tri et l'état temporel constant ou variable.

La validation vérifie aussi la période initialement repliée, l'ordre Municipalité/Arrondissement, le périmètre Montréal dans les deux dimensions et la restauration de la municipalité précédente. La saisie sans résultat est testée avec une hauteur de liste et des positions de défilement inchangées, y compris caractère par caractère sur téléphone. Radar, Aire polaire, Courbe et Mixte sont vérifiés sur les trois formats; le Mixte doit posséder deux jeux de données de types et d'axes distincts.

Les couleurs des impacts sont vérifiées pour les séries, groupes, courbes et mixtes. Le parcours vérifie aussi l'absence des styles Nuage et Bulles et de leurs contrôles, leur retrait de l'aide et le retour aux barres à partir de chacune des anciennes préférences, sans perdre les filtres valides.

Les contrôles d'axes des sept familles sont vérifiés dans les deux langues et les trois formats d'écran. Les tests couvrent la catégorie en premier choix malgré l'orientation horizontale, les titres d'axes, la fermeture initiale de Municipalité et sa fermeture après réinitialisation. Pour le Mixte, ils contrôlent les deux mesures configurables, leurs unités, les valeurs manquantes, les pourcentages, l'absence de doublon de mesure et la conservation des choix après rechargement.

Les aides générales et contextuelles sont testées en français et en anglais sur les trois formats : définitions sans clés de traduction brutes, icônes chargées, absence de débordement, animations et mouvement réduit, boucle clavier, fermetures et retour du focus. Les options des aides d'axes et de répartition doivent correspondre aux choix réellement proposés; le tableau des catégories n'a que deux colonnes. Une reconstruction des contrôles pendant l'ouverture vérifie que l'aide reste utilisable. Les tests vérifient aussi la largeur par défaut de 360 px, le texte complet du filtre de dates, la reconnaissance d'un organisme public du snapshot UCI, le maintien des directions non publiées et les mois avec au plus une décimale dans le Mixte, ses infobulles et les cellules du tableau. Le contrôle du canvas compte aussi la teinte grise des données inconnues.

Le chargement avec toutes les sections de filtres fermées est vérifié sur ordinateur et mobile, y compris avec des choix sauvegardés. La création des animations est observée au démarrage dans le test pour éviter de confondre une animation déjà terminée avec une animation absente.

[Retour à la documentation du projet](README.md)
