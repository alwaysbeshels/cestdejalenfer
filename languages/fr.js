window.TRANSLATIONS = window.TRANSLATIONS || {};
window.TRANSLATIONS.fr = {
  "language.name": "Français",
  "language.switch": "EN",
  "language.switchLabel": "Passer à l'anglais",
  "document.mapTitle": "Carte des entraves routières - Grand Montréal",
  "document.faqTitle": "Questions fréquentes | Carte des entraves",
  "nav.main": "Navigation principale",
  "nav.map": "Carte",
  "nav.auto": "Auto",
  "nav.pedestrian": "Piétons",
  "nav.potholes": "Nids-de-poule",
  "nav.mapMode": "Mode de déplacement",
  "potholes.documentTitle": "Nids-de-poule - Montréal",
  "potholes.region": "Ville de Montréal",
  "potholes.title": "Nids-de-poule",
  "potholes.howTitle": "Comment ça marche",
  "potholes.statisticsTitle": "Statistiques",
  "potholes.howDocumentTitle": "Comment ça marche | Nids-de-poule et colmatages",
  "potholes.statisticsDocumentTitle": "Statistiques | Nids-de-poule et colmatages",
  "potholes.statisticsSummaryDocumentTitle": "Bilan | Statistiques | Nids-de-poule et colmatages",
  "potholes.statisticsChartsDocumentTitle": "Graphiques | Statistiques | Nids-de-poule et colmatages",
  "potholes.statisticsBoroughsDocumentTitle": "Par arrondissement | Statistiques | Nids-de-poule et colmatages",
  "potholes.howHeading": "Comprendre les données et les statuts",
  "potholes.howLead": "Cette section compare les signalements citoyens aux colmatages enregistrés à proximité par la Ville de Montréal. Elle aide à lire leur historique, mais ne remplace pas une inspection de la chaussée. Un dossier 311, un emplacement public et un trou physique ne sont pas la même chose.",
  "potholes.howFactSources": "Des sources officielles",
  "potholes.howFactSourcesDetail": "Demandes 311 et colmatage mécanisé, conservés dans des copies datées des données.",
  "potholes.howFactLocations": "Des emplacements approximatifs",
  "potholes.howFactLocationsDetail": "Les coordonnées 311 sont déplacées sur un tronçon; plusieurs trous peuvent partager un point.",
  "potholes.howFactStatuses": "Des statuts estimés",
  "potholes.howFactStatusesDetail": "Nos couleurs traduisent une règle chronologique, pas une confirmation de la Ville.",
  "potholes.howContents": "Sommaire des explications",
  "potholes.howSourcesHeading": "Sources et collecte",
  "potholes.howLocationsHeading": "Signalements et emplacements",
  "potholes.howStatusesHeading": "Statuts 311 et statuts de la carte",
  "potholes.howHistoryHeading": "Historique et réactivations",
  "potholes.howRepairsHeading": "Données de colmatage",
  "potholes.howLimitsHeading": "Interprétation et limites",
  "potholes.howRadius": "Distance maximale utilisée pour repérer un colmatage près d'un emplacement signalé : {radius} mètres.",
  "potholes.how.q.report": "Comment signaler un nid-de-poule?",
  "potholes.how.a.report": "Pour l'instant, je n'ai pas de formulaire pour recevoir directement vos nids-de-poule et les ajouter à ma carte. À Montréal, vous pouvez les signaler à la Ville avec son formulaire Web, l'application 311 Montréal ou par téléphone au 311.",
  "potholes.how.reportOnline": "Signaler un nid-de-poule sur le site de Montréal",
  "potholes.how.reportApp": "Télécharger l'application 311 Montréal",
  "potholes.how.reportPhone": "Appeler le 311 (de l'extérieur de Montréal : 514 872-0311)",
  "potholes.how.reportDelay": "Un signalement à la Ville n'apparaît pas immédiatement ici : il doit être publié dans ses données ouvertes, puis intégré à une mise à jour de cette carte. En cas de danger nécessitant une intervention immédiate, appelez le 311. Pour une autoroute ou sa voie d'accès, contactez le 511.",
  "potholes.how.q.sources": "D'où viennent les données?",
  "potholes.how.a.sources": "Deux jeux de données ouverts de Montréal sont utilisés : les Demandes de services citoyennes (requêtes 311), limitées à la catégorie Nid-de-poule, et les Travaux de colmatage mécanisé de nid-de-poule des chaussées. Le premier décrit des demandes; le second publie des enregistrements GPS d'appareils. Notre regroupement et nos statuts sont calculés localement et ne font pas partie des statuts officiels de ces sources.",
  "potholes.how.q.collection": "Comment les données arrivent-elles dans la carte?",
  "potholes.how.a.collection": "<p>Un outil de collecte interroge les ressources configurées du portail de données ouvertes, par année et par pages de résultats. Les demandes 311 sont normalisées en conservant les champs publiés : dates, statut, rue, arrondissement et localisation. Les interventions de colmatage proviennent de ressources CSV ou GeoPackage; leurs coordonnées sont converties au besoin en latitude/longitude.</p><p>Les fichiers annuels sont ensuite assemblés dans un index de positions et un historique de colmatages proches. Les coordonnées manifestement incompatibles avec la région sont exclues de la carte. Le navigateur lit ces fichiers de données : il ne contacte pas le 311 à chaque déplacement de la carte. L'archive 2016 des demandes, présente dans deux ressources, n'est importée qu'une fois.</p>",
  "potholes.how.q.freshness": "Est-ce une carte en temps réel?",
  "potholes.how.a.freshness": "<p>Non. La source 311 annonce une mise à jour quotidienne et le colmatage est publié sous forme de fichiers annuels. Notre copie ne change qu'après une exécution de la collecte et la publication des nouveaux fichiers. Ouvrir ou actualiser la page ne relance pas cette collecte.</p><p>La date de vérification indique quand nos sources ont été contrôlées, pas quand chaque trou a été inspecté ou chaque travail effectué. La date de mise à jour d'un fichier de données change seulement si son contenu change. Une reconstruction locale de la carte ne rend pas les données plus récentes. Les années historiques sont généralement rechargées lorsque les sondes détectent une modification; ces sondes ne sont pas une relecture exhaustive de chaque champ à chaque exécution.</p>",
  "potholes.how.q.scope": "Est-ce que tout le Grand Montréal est couvert?",
  "potholes.how.a.scope": "<p>Non. Cette section utilise les ressources de Montréal, pas un inventaire exhaustif des nids-de-poule de toute la région. Des noms de villes liées peuvent apparaître dans les enregistrements, sans garantir une couverture complète de ces territoires. Les données des cartes Auto et Piétons ne sont pas ajoutées comme nids-de-poule.</p><p>Le contrôle de coordonnées utilise une enveloppe de plausibilité autour de Montréal. Il ne constitue pas une frontière administrative précise. Une zone vide peut simplement être absente des sources exploitées.</p>",
  "potholes.how.q.request": "Un signalement correspond-il à un seul nid-de-poule?",
  "potholes.how.a.request": "<p>Pas nécessairement. Il s'agit d'une demande 311 de catégorie Nid-de-poule : requête, plainte ou commentaire selon la nature publiée. Plusieurs demandes peuvent concerner le même problème; une demande peut aussi décrire plusieurs trous.</p><p>Les demandes de simple information sont comptées dans le corpus brut, mais ne deviennent pas des points de nids-de-poule. Les chiffres de demandes ne doivent donc pas être présentés comme un décompte de trous physiques.</p>",
  "potholes.how.q.location": "Pourquoi le point ne tombe-t-il pas exactement sur le trou?",
  "potholes.how.a.location": "<p>La Ville masque la localisation précise des demandes 311 : la coordonnée est relocalisée au milieu du tronçon admissible le plus proche, de plus de 45 mètres. Notre carte conserve cette position publique au lieu d'inventer une adresse plus précise.</p><p>Nous regroupons les demandes qui partagent exactement cette coordonnée. Cet emplacement peut représenter plusieurs trous ou plusieurs épisodes de dégradation sur le même tronçon. Il ne permet pas de conclure à un côté de rue, une voie ou un trou unique.</p>",
  "potholes.how.q.excluded": "Pourquoi certains enregistrements ne sont-ils pas cartographiés?",
  "potholes.how.a.excluded": "<p>Une information sans emplacement, une coordonnée absente ou incohérente, ou un point de repli au bureau d'arrondissement ne permet pas de situer un nid-de-poule. Ces demandes ne sont pas affichées comme des trous. Les fichiers 311 de 2014 à 2016 n'ont actuellement aucune position considérée exploitable par notre générateur.</p><p>L'exclusion de la carte ne supprime pas la demande du fichier annuel. C'est pourquoi le total d'une source peut être supérieur au nombre de demandes cartographiables.</p>",
  "potholes.how.q.clusters": "Que comptent les bulles et les emplacements?",
  "potholes.how.a.clusters": "<p>Le chiffre d'une bulle de regroupement compte des emplacements publics distincts, pas le nombre de demandes 311. Une bulle de cinq emplacements peut représenter beaucoup plus de cinq signalements. Au zoom rapproché, chaque point conserve son propre statut actuel.</p><p>Un groupe peut réunir des statuts différents; sa présentation neutre n'ajoute pas un quatrième statut aux points. Les totaux de la vue correspondent aux groupes et points représentés, même si une partie d'un groupe dépasse le bord visible.</p>",
  "potholes.how.q.cityStatus": "Que signifie le statut d'un dossier sur le 311?",
  "potholes.how.a.cityStatus": "<p>Il décrit le traitement administratif de la demande. Acceptée, Prise en charge, Transmise pour traitement, Réactivée et Urgente sont regroupés comme dossiers ouverts dans nos fichiers. Terminée, Annulée, Refusée et Supprimée sont regroupés comme dossiers fermés. Un statut absent ou non reconnu reste inconnu.</p><p><strong>Un dossier fermé n'est pas une preuve de réparation.</strong> Une annulation, un refus ou une suppression ne confirment évidemment pas un colmatage; même Terminée ne fournit pas, à elle seule, une intervention géolocalisée correspondant à ce trou. Nous conservons le libellé publié dans la fiche, séparément du statut de la carte.</p>",
  "potholes.how.q.whyStatuses": "Pourquoi avoir créé nos propres statuts?",
  "potholes.how.a.whyStatuses": "<p>Colorer automatiquement tous les dossiers 311 terminés comme des trous réparés serait trompeur. Nous comparons plutôt les signalements aux colmatages enregistrés dans un rayon de 25 m, tout en conservant la distinction avec le traitement administratif.</p><p>Nos statuts répondent à une question plus limitée : connaissons-nous un colmatage à proximité après le dernier signalement? Ce sont des <strong>estimations explicites</strong>, pas des décisions municipales, des prédictions ni des constats sur place.</p>",
  "potholes.how.q.ourStatuses": "Comment sont calculés Actif, Réparation présumée et Statut inconnu?",
  "potholes.how.status.active": "Aucun colmatage enregistré dans un rayon de 25 m n'est strictement postérieur au dernier signalement connu, ou un nouveau signalement est arrivé depuis. C'est l'état par défaut de notre règle, pas une certification qu'un trou est encore présent.",
  "potholes.how.status.repaired": "Un colmatage a été enregistré dans un rayon de 25 m après le dernier signalement, sans nouvelle demande ultérieure à cette position publique. Cela ne confirme pas la réparation de ce trou précis.",
  "potholes.how.status.unknown": "La date du dernier signalement ne permet pas d'établir une chronologie exploitable. L'absence de données récentes de colmatage ne suffit pas, à elle seule, à produire ce statut : sans colmatage ultérieur connu, notre règle laisse le point Actif.",
  "potholes.how.a.oneStatus": "Un emplacement possède un seul statut actuel. Les anciennes réparations ne sont pas des statuts supplémentaires. Les couleurs restent basées sur tout l'historique disponible, même lorsqu'on consulte une année ancienne. À date identique, un signalement et un colmatage ne suffisent pas à présumer la réparation.",
  "potholes.how.q.matching": "Comment associez-vous un colmatage à un signalement?",
  "potholes.how.a.matching": "La carte cherche les colmatages dont la position GPS se trouve à proximité de l'emplacement 311 publié, après son premier signalement. La distance maximale est indiquée ci-dessous. Les enregistrements ayant exactement les mêmes date, appareil et coordonnées ne sont comptés qu'une fois dans l'historique. Il n'existe pas de lien officiel entre le dossier 311 et ces travaux : un colmatage à proximité peut concerner un autre trou, voire l'autre côté de la rue. Il s'agit d'une réparation présumée, jamais d'une confirmation pour ce trou précis.",
  "potholes.how.q.radius": "Pourquoi 25 mètres plutôt que 10 mètres?",
  "potholes.how.a.radius": "<p>Les 25 m sont un choix technique de cette carte, pas une précision garantie ni un seuil validé par la Ville. La position publique d'une demande 311 est déplacée au milieu d'un tronçon de plus de 45 m : elle n'est donc pas forcément à moins de 10 m du trou réel. Le GPS des colmateuses peut aussi être décalé de quelques mètres, voire de quelques dizaines de mètres près de grands bâtiments.</p><p>Passer à 10 m est techniquement possible et retiendrait moins de colmatages voisins, mais pourrait aussi manquer davantage de travaux réellement liés au signalement. À 25 m, l'inverse est possible : un travail concernant un autre trou peut être retenu. Ni 10 m ni 25 m ne permettent de confirmer la réparation du trou signalé avec ces seules données. Pour choisir un meilleur seuil, il faudrait le comparer à des réparations vérifiées sur le terrain.</p>",
  "potholes.how.q.reactivated": "Pourquoi le point est-il actif alors que son historique contient plusieurs colmatages?",
  "potholes.how.a.reactivated": "Le statut dépend de l'événement le plus récent, pas du nombre cumulé de réparations. Un signalement après le dernier colmatage à proximité ouvre un nouvel épisode actif. Il peut s'agir d'une récidive ou d'un autre trou au même emplacement public. Nous ne pouvons pas les distinguer avec ces seules données.",
  "potholes.how.exampleLabel": "Exemple fictif, indépendant des données réelles",
  "potholes.how.exampleFirstDate": "10 janvier 2025",
  "potholes.how.exampleFirst": "Un signalement arrive",
  "potholes.how.exampleFirstState": "État estimé : Actif",
  "potholes.how.exampleRepairDate": "15 janvier 2025",
  "potholes.how.exampleRepair": "Un colmatage est enregistré à proximité",
  "potholes.how.exampleRepairState": "État estimé : Réparation présumée",
  "potholes.how.exampleLastDate": "2 mars 2025",
  "potholes.how.exampleLast": "Un nouveau signalement arrive",
  "potholes.how.exampleLastState": "État actuel estimé : Actif, malgré le colmatage passé",
  "potholes.how.q.disagreement": "Pourquoi un dossier terminé peut-il être rouge, ou un dossier ouvert gris?",
  "potholes.how.a.disagreement": "<p>Ces informations répondent à deux questions différentes. Le 311 indique l'état de traitement du dossier; notre couleur compare les dates de signalements et de colmatages proches.</p><p>Une demande Terminée sans colmatage ultérieur connu peut donc rester Actif. Inversement, un dossier encore Prise en charge peut être à un emplacement en Réparation présumée si une intervention postérieure est connue. Aucun des deux indicateurs n'est remplacé par l'autre.</p>",
  "potholes.how.q.years": "Que veut dire le filtre Année dans le mode Nids-de-poule?",
  "potholes.how.a.years": "<p>Il retient les emplacements qui ont eu une période estimée active pendant l'année choisie. Un signalement ouvre cette période; le prochain colmatage enregistré dans un rayon de 25 m la ferme; une nouvelle demande la rouvre. Sans fin connue, la période continue les années suivantes, même sans nouveau signalement.</p><p>Une année entièrement située entre une réparation et une réactivation est exclue. Mais la couleur du point reste son <strong>statut actuel dans les données</strong> : elle n'est pas une reconstitution de son état à la fin de l'année sélectionnée. Un emplacement n'apparaît qu'une fois même si plusieurs années sont cochées.</p>",
  "potholes.how.q.historyCount": "Pourquoi la fiche indique-t-elle des signalements d'années précédentes?",
  "potholes.how.a.historyCount": "<p>La fiche conserve l'historique complet de la position, alors que le filtre Année porte sur ses périodes d'activité. Le total depuis le premier signalement n'est donc pas un compteur annuel. Une recherche par numéro peut retenir un seul dossier tout en montrant un total historique plus élevé au survol.</p><p>Le nombre de colmatages depuis le premier signalement compte les interventions enregistrées dans un rayon de 25 m. Il ne prouve ni que chaque demande a reçu sa propre réparation, ni que toutes ces interventions concernaient le même trou. Une même intervention peut être à proximité de plusieurs positions publiques.</p>",
  "potholes.how.q.delay": "Le délai de la fiche est-il le temps nécessaire pour réparer?",
  "potholes.how.a.delay": "Non. Le délai jusqu'au dernier statut est la différence entre la création de la demande et la date de son dernier statut administratif. Ce statut peut encore être ouvert ou avoir changé pour une autre raison. Ce délai n'est ni une mesure certifiée du temps de réparation, ni une promesse d'intervention future.",
  "potholes.how.q.currentYear": "Pourquoi n'y a-t-il pas l'année courante dans Colmatages?",
  "potholes.how.a.currentYear": "<p>Les données de colmatage sont diffusées en fichiers annuels, pas comme un suivi complet en temps réel. Notre outil utilise actuellement les ressources de 2016 à 2025. Une nouvelle année nécessite d'identifier et d'ajouter la ressource appropriée, puis de collecter, vérifier et publier les données.</p><p><strong>L'absence de 2026 dans nos données ne prouve ni l'absence de travaux en 2026, ni l'absence d'une publication plus récente ailleurs.</strong> Nous ne fabriquons pas une année vide à partir de cette absence. Le bilan statistique et le mode Colmatages indiquent les périodes effectivement disponibles.</p>",
  "potholes.how.q.repairRecord": "Un point de colmatage signifie-t-il qu'un trou a été réparé?",
  "potholes.how.a.repairRecord": "<p>La source contient une position GPS, une date et un appareil de colmatage mécanisé. Plusieurs interventions peuvent partager la même coordonnée. Le point n'est pas un décompte certifié de trous uniques et les réparations manuelles ne sont pas couvertes par ce jeu.</p><p>Le fichier de données ne fournit pas de segment de rue réparé, de limites début/fin ni de nom de rue pour chaque trace. Relier les points en ligne ferait supposer que toute la portion a été traitée. Nous conservons donc les points et leurs données publiées.</p>",
  "potholes.how.q.partial": "Pourquoi une année de colmatage ne couvre-t-elle que quelques mois?",
  "potholes.how.q.manualRepairs": "Où sont les colmatages faits à la main?",
  "potholes.how.a.manualRepairs": "<p>La source utilisée publie les positions GPS des équipements mécanisés du service central. Sa documentation exclut les réparations manuelles et les interventions des arrondissements. Ce ne sont donc pas des travaux que notre carte a retirés.</p><p>Dans les catalogues de Montréal et de Données Québec consultés, nous n'avons pas trouvé de jeu ouvert donnant les lieux et les dates des colmatages manuels à Montréal. Cela ne signifie ni qu'ils n'ont pas lieu, ni que la Ville ne possède pas ces renseignements à l'interne. Un dossier 311 terminé ou un bilan chiffré ne fournit pas une preuve de réparation géolocalisée. La prochaine démarche est de demander ces données à la Ville.</p>",
  "potholes.how.requestManualData": "Contacter l'équipe des données ouvertes de Montréal",
  "potholes.how.a.partial": "<p>Le nom annuel du fichier ne garantit pas douze mois de couverture. Certains fichiers n'ont que des périodes partielles; quelques dates peuvent même appartenir à une autre année que celle du fichier. Le filtre Année de Colmatages choisit le fichier, tandis que le filtre Mois correspond aux dates effectivement présentes.</p><p>La première et la dernière date affichées sont les bornes observées, pas une garantie de données continues entre les deux. Un mois absent ne signifie pas nécessairement qu'aucune équipe n'a travaillé.</p>",
  "potholes.how.q.coordinates2021": "Pourquoi le fichier de colmatage 2021 ne donne-t-il aucun point?",
  "potholes.how.a.coordinates2021": "<p>Dans les données actuelles, les coordonnées des 50 320 interventions recensées en 2021 sont incompatibles avec Montréal. Elles ne sont ni affichées sur la carte ni utilisées pour estimer la réparation d'un emplacement. Le système de coordonnées du fichier d'origine doit encore être vérifié avant une correction de la conversion.</p><p>Les interventions restent dans le fichier source, avec un avertissement dans l'interface. Cette lacune rend l'historique incomplet : elle ne prouve pas que ces réparations n'ont pas eu lieu et peut laisser certaines positions classées Actif faute de colmatage exploitable.</p>",
  "potholes.how.q.statistics": "Peut-on comparer les années ou classer les arrondissements avec ces chiffres?",
  "potholes.how.a.statistics": "<p>Avec prudence. Les demandes 311 reflètent aussi le recours au service, les habitudes de signalement et la couverture des archives. Les colmatages ne couvrent qu'une méthode de réparation et les périodes publiées varient. Une année partielle ne se compare pas directement à une année complète.</p><p>Les tableaux distinguent les signalements de problèmes et les demandes d'information, par année de création. Les interventions de colmatage ont leur propre tableau. Il ne s'agit ni d'un palmarès de qualité des routes, ni d'un taux de réparation. Les demandes sans coordonnées cartographiables restent comptées dans leur catégorie, et plusieurs signalements peuvent concerner le même emplacement.</p>",
  "potholes.how.q.absence": "Une absence de point ou de colmatage permet-elle de conclure?",
  "potholes.how.a.absence": "<p>Non. Un trou peut ne pas avoir été signalé, une demande peut manquer de coordonnées utilisables, et une réparation manuelle peut ne pas apparaître dans le jeu de colmatage. Une publication tardive ou un problème de conversion peut aussi masquer une intervention.</p><p>Inversement, un colmatage dans le voisinage peut concerner un autre trou. Nos statuts peuvent donc produire des faux actifs et des réparations présumées incorrectes. L'état réel de la rue ne peut pas être confirmé par cette carte seule.</p>",
  "potholes.how.q.planning": "Peut-on connaître la prochaine réparation, la gravité ou la dangerosité?",
  "potholes.how.a.planning": "Non. Les champs exploités ne fournissent pas un calendrier de réparations futures ni une mesure fiable de profondeur, de taille ou de danger pour chaque trou. Le nombre de demandes n'est pas une échelle de gravité. Une couleur, une récurrence ou un ancien colmatage ne permet pas de prédire une date d'intervention.",
  "potholes.how.q.independent": "Est-ce un service officiel de la Ville?",
  "potholes.how.a.independent": "Non. Les données de départ sont officielles, mais leur assemblage, les regroupements et les statuts estimés de cette section sont indépendants. La FAQ décrit notre méthode actuelle. Pour le suivi administratif d'une demande ou les conditions sur le terrain, les services municipaux demeurent la référence; cette carte n'est pas un canal de signalement au 311.",
  "potholes.statisticsHeading": "Bilan des données disponibles",
  "potholes.statisticsNavigation": "Vues statistiques",
  "potholes.tableAll": "Tous",
  "potholes.tableFilter": "Filtrer : {column}",
  "potholes.tableSortAscending": "Trier {column} par ordre croissant",
  "potholes.tableSortDescending": "Trier {column} par ordre décroissant",
  "potholes.tableSortReset": "Rétablir l'ordre initial de {column}",
  "potholes.statisticsSummaryTab": "Bilan",
  "potholes.statisticsChartsTab": "Graphiques",
  "potholes.statisticsBoroughsTab": "Par Arrondissements",
  "potholes.boroughsHeading": "Portrait par arrondissement",
  "potholes.boroughsLead": "Signalements, emplacements persistants et colmatages présumés sur le territoire choisi. Les colmatages mécanisés recensés ne représentent pas toutes les réparations réalisées par l'arrondissement.",
  "potholes.boroughSelectedHeading": "Portrait de {name}",
  "potholes.boroughsLoadError": "La fiche de cet arrondissement n'a pas pu être chargée ou ne correspond plus aux données publiées. Aucune fiche d'un autre territoire n'est affichée à sa place.",
  "potholes.boroughReportCount": "Signalements reçus",
  "potholes.boroughLocationsCount": "Emplacements distincts signalés",
  "potholes.boroughPersistent": "Signalés sur plusieurs années",
  "potholes.boroughReturnsCount": "Signalés de nouveau après colmatage présumé",
  "potholes.boroughWithoutPatch": "Demandes répétées sans colmatage recensé",
  "potholes.boroughTrendTitle": "Les signalements dans cet arrondissement",
  "potholes.boroughPersistenceTitle": "Les mêmes emplacements reviennent-ils ?",
  "potholes.boroughPersistenceNote": "Années distinctes avec au moins un signalement au même emplacement. Un emplacement publié peut représenter plusieurs trous.",
  "potholes.boroughReturnsNote": "{count} emplacements signalés de nouveau sur {total} ayant douze mois complets de suivi après un premier colmatage présumé admissible. {excluded} cas trop récents écartés. Ce n'est pas un taux d'échec des réparations.",
  "potholes.boroughComparisonTitle": "La persistance par rapport au reste de Montréal",
  "potholes.boroughComparisonNote": "Part des emplacements signalés dans au moins deux années. Le reste de Montréal exclut l'arrondissement choisi et les rattachements incertains. Ce n'est pas une mesure de performance.",
  "potholes.boroughRestOfCity": "Reste de Montréal",
  "potholes.boroughCoverage": "{missing} signalements sont inclus dans le total, mais sans emplacement unique attribuable dans cette fiche. {streets} emplacements n'ont pas de rue identifiée avec assez de certitude. Colmatages mécanisés disponibles jusqu'au {end} ; réparations manuelles et interventions des arrondissements absentes de la source.",
  "potholes.boroughSearchLabel": "Rue ou emplacement",
  "potholes.boroughSearchPlaceholder": "Rechercher une rue ou une intersection",
  "potholes.boroughStreetsHeading": "Les rues et leurs demandes répétées",
  "potholes.boroughStreetsNote": "Emplacements publics attribués à une seule rue avec suffisamment de certitude. Les demandes sans position et les emplacements dont la rue reste incertaine ne figurent pas dans ce tableau.",
  "potholes.boroughLocationsHeading": "Les emplacements à examiner",
  "potholes.boroughLocationFilterLabel": "Type d'emplacements",
  "potholes.boroughFilterPersistent": "Signalés sur plusieurs années",
  "potholes.boroughFilterUnpatched": "Sans colmatage recensé",
  "potholes.boroughFilterReturns": "Signalés après colmatage",
  "potholes.boroughFilterAll": "Tous les emplacements",
  "potholes.boroughLocationsNote": "Signalements et dates de la période choisie. Colmatages proches comptés depuis le tout premier signalement connu, jusqu'au {end}. « Sans colmatage recensé » exige au moins deux demandes dans la période couverte par les colmatages ; cela ne prouve pas une absence de réparation.",
  "potholes.boroughYears": "Années signalées",
  "potholes.boroughLastReport": "Dernier signalement",
  "potholes.boroughNoPatch": "Aucun recensé",
  "potholes.boroughLatestPatch": "Dernier : {date}",
  "potholes.boroughViewMap": "Voir sur la carte",
  "potholes.boroughViewLocation": "Voir {place} sur la carte",
  "potholes.boroughPagination": "{first}–{last} sur {total}",
  "potholes.boroughStreetsPages": "Pages des rues",
  "potholes.boroughLocationsPages": "Pages des emplacements",
  "potholes.chartsHeading": "Les nids-de-poule dans les données",
  "potholes.chartsLead": "Données publiées par la Ville de Montréal uniquement : elles ne couvrent pas toute l'île ni le Grand Montréal. Les colmatages présentés sont exclusivement mécanisés. Nous n'avons aucune donnée sur les colmatages manuels dans cette source, qui n'inclut pas non plus les interventions des arrondissements.",
  "potholes.chartsPeriod": "Période étudiée",
  "potholes.chartsRecentPeriod": "{first}–{last}",
  "potholes.chartsAllPeriod": "{first}–{last}",
  "potholes.chartsReportsUpdated": "Mise à jour 311 : {date}",
  "potholes.chartsRepairsUpdated": "Mise à jour colmatages : {date}",
  "potholes.chartsSources": "Sources : demandes 311 de Montréal jusqu'au {reports}, colmatages mécanisés jusqu'au {repairs}. Demandes d'information exclues.",
  "potholes.chartsFigures": "Informations complémentaires",
  "potholes.chartsUnavailableValue": "Non disponible",
  "potholes.chartsNoData": "Les données disponibles ne permettent pas cette comparaison.",
  "potholes.chartsLoadError": "Les analyses n'ont pas pu être chargées ou ne correspondent plus aux sources publiées.",
  "potholes.chartsRefreshError": "Actualisation indisponible. Les dernières données reçues restent affichées.",
  "potholes.chartsLibraryError": "Les graphiques n'ont pas pu être chargés. Les chiffres restent accessibles dans les tableaux ci-dessous.",
  "potholes.chartTrendTitle": "Les signalements augmentent-ils ?",
  "potholes.chartTrendStatement": "signalements recensés en {year}, jusqu'au {date}.",
  "potholes.chartTrendNoComparison": "La variation ne peut pas être calculée pour cette période.",
  "potholes.chartTrendNote": "Tous les signalements disponibles de chaque année sont inclus. L'année {year} est encore partielle ; les années précédentes ne sont pas tronquées à la même date.",
  "potholes.chartPersistenceTitle": "Des emplacements signalés année après année",
  "potholes.chartPersistenceStatement": "{count} emplacements sur {total} ont des signalements dans au moins deux années distinctes.",
  "potholes.chartPersistenceNote": "Un emplacement publié peut représenter plusieurs trous. {excluded} signalements sans localisation utilisable ne participent pas à ce calcul.",
  "potholes.chartOneYear": "Une seule année",
  "potholes.chartTwoYears": "Deux années",
  "potholes.chartThreeYears": "Trois années",
  "potholes.chartFourYears": "Quatre années",
  "potholes.chartFiveYears": "Cinq années ou plus",
  "potholes.chartReportedYears": "Années avec signalements",
  "potholes.chartConcentrationTitle": "Combien de signalements par emplacement ?",
  "potholes.chartConcentrationStatement": "Le groupe le plus signalé reçoit en moyenne {main} demandes par emplacement, contre {other} pour les autres emplacements.",
  "potholes.chartConcentrationNote": "On compare les 10 % d'emplacements les plus signalés aux 90 % restants. Il s'agit de points précis, pas de 10 % des rues. Ce rapport montre où les demandes s'accumulent, pas la gravité des trous.",
  "potholes.chartTimes": "{value} fois",
  "potholes.chartReportsPerLocation": "Signalements par emplacement",
  "potholes.chartAnnualChange": "Variation annuelle",
  "potholes.chartPartialYear": "Année partielle, non comparable",
  "potholes.chartTopTen": "10 % les plus signalés",
  "potholes.chartOtherLocations": "Autres emplacements",
  "potholes.chartAllReports": "Signalements localisables",
  "potholes.chartGroup": "Groupe",
  "potholes.chartShare": "Part",
  "potholes.chartReturnsTitle": "De nouveaux signalements après colmatage",
  "potholes.chartReturnsStatement": "{count} emplacements sur {total} ont un nouveau signalement dans les douze mois après un premier colmatage présumé admissible.",
  "potholes.chartReturnsNote": "Un seul colmatage de référence par emplacement, avec douze mois complets de suivi. {excluded} cas trop récents écartés. Ce n'est pas une mesure de réparations ratées ni la preuve que le même trou est revenu.",
  "potholes.chartReportedAgain": "Signalé de nouveau",
  "potholes.chartNoNewReport": "Aucun nouveau signalement observé",
  "potholes.chartAfterPatching": "Dans les douze mois suivants",
  "potholes.chartUnpatchedTitle": "Des demandes répétées sans colmatage recensé",
  "potholes.chartUnpatchedStatement": "emplacements ont reçu au moins deux signalements, soit {count} demandes au total dans la période couverte.",
  "potholes.chartUnpatchedNote": "Les signalements se répètent au même emplacement sans qu'une intervention de colmatage mécanisé soit documentée dans nos données depuis le tout premier signalement connu, même avant la période choisie. Cela ne prouve pas l'absence d'une réparation manuelle, temporaire ou d'une solution de contournement non fournie par la source.",
  "potholes.chartTwoReports": "2 signalements",
  "potholes.chartThreeReports": "3 signalements",
  "potholes.chartFourReports": "4 signalements",
  "potholes.chartFivePlusReports": "5 signalements ou plus",
  "potholes.chartPolarLegend": "{group} : {count} emplacements",
  "potholes.chartPolarLegendTitle": "Signalements : emplacements",
  "potholes.chartPolarLegendCompact": "{group} : {count}",
  "potholes.chartDistrictsTitle": "Où les mêmes emplacements sont-ils signalés plusieurs années ?",
  "potholes.chartDistrictsStatement": "Au total, {count} emplacements sur {total} rattachés à un arrondissement ont été signalés dans au moins deux années différentes.",
  "potholes.chartDistrictsNote": "Chaque barre mesure la part des emplacements de cet arrondissement signalés durant plusieurs années. Par exemple, 40 % signifie 40 emplacements sur 100, pas 40 % des nids-de-poule de Montréal. {excluded} emplacements sans arrondissement unique reconnu sont écartés. Ce n'est pas un taux de réparation.",
  "potholes.chartDistrictTooltip": "{count} emplacements sur {total} signalés durant plusieurs années",
  "potholes.chartRecurring": "Signalés sur plusieurs années",
  "potholes.statisticsLead": "Les signalements d'un problème et les demandes d'information au 311 sont comptés séparément. Plusieurs signalements peuvent concerner le même emplacement : ce ne sont pas des nombres de trous différents. Les interventions de colmatage sont présentées à part.",
  "potholes.statisticsCalculationNote": "Les chiffres sont calculés automatiquement à partir des fichiers de données du site, sans nombres saisis manuellement dans le HTML. Ils évoluent après la collecte et la publication de nouvelles données, pas en temps réel depuis la Ville. Les filtres des cartes ne s'appliquent pas à ce bilan.",
  "potholes.statisticsLoadError": "Le bilan statistique n'a pas pu être chargé. Aucune valeur de remplacement n'est affichée.",
  "potholes.statisticsLatestReports": "Signalements au 311 en {year}",
  "potholes.statisticsLatestInformation": "Demandes d'information au 311 en {year}",
  "potholes.statisticsInformation": "Demandes d'information",
  "potholes.statisticsReportsTotal": "Signalements au 311 recensés, toutes années : {count}",
  "potholes.statisticsRepairsTotal": "Interventions de colmatage recensées, tous fichiers : {count}",
  "potholes.statisticsReportsHeading": "Demandes 311 par année de création",
  "potholes.statisticsReportsNote": "Les demandes d'information sont comptées séparément des signalements.",
  "potholes.statisticsYear": "Année de création",
  "potholes.statisticsRequests": "Signalements au 311",
  "potholes.statisticsRepairsHeading": "Colmatage mécanisé par fichier annuel",
  "potholes.statisticsRepairsNote": "Colmatage mécanisé seulement, hors réparations manuelles. Périodes parfois partielles; coordonnées de 2021 non exploitables.",
  "potholes.statisticsFirstDate": "Première date publiée",
  "potholes.statisticsLastDate": "Dernière date publiée",
  "potholes.rankingsHeading": "Emplacements, rues et colmateuses",
  "potholes.rankingsLimits": "Un emplacement publié peut regrouper plusieurs nids-de-poule. Un colmatage enregistré dans un rayon de 25 m ne confirme pas la réparation du trou signalé. Les retours et les absences de colmatage sont des estimations, pas des constats sur le terrain. Les réparations manuelles ne sont pas couvertes. Les tris et filtres portent seulement sur les lignes de chaque tableau, sans recalculer les totaux globaux.",
  "potholes.rankingsCoverage": "Colmatages recensés du {first} au {last}. Les comparaisons avec les signalements utilisent cette même période.",
  "potholes.rankingsMethod": "Périmètre et méthode",
  "potholes.rankingsGeography": "Attribution à une seule rue à moins de {radius} m : {matched} interventions retenues, {ambiguous} cas ambigus et {excluded} traces non attribuables, dont {unidentified} sans nom ou numéro de voie confirmé. {duplicates} doublons écartés. Une proximité ne constitue pas un lien officiel avec une demande 311.",
  "potholes.rankingsLocationsCoverage": "Classements par rue : {matched} emplacements attribués, {excluded} non attribués, dont {unidentified} sans nom ou numéro de voie confirmé. Les demandes d'information et les signalements sans position fiable ne sont pas inclus.",
  "potholes.rankingsGeobase": "Géobase actuelle récupérée le {date}. Les rues historiques peuvent avoir changé de nom ou de tracé. Les noms des rues locales, dont les directions Est et Ouest, restent distincts.",
  "potholes.rankingsRtss": "Réseau routier MTMD récupéré le {date} : un numéro de route a été identifié pour {identified} tronçons génériques sur {total}, d'après leur tracé et leur orientation. Les autoroutes identifiées sont regroupées par numéro. Les {remaining} tronçons non résolus ne sont jamais fusionnés sous un libellé générique ; leurs interventions restent dans les totaux, sans être affectées à une rue voisine.",
  "potholes.rankingsMachinesMethod": "Les identifiants des colmateuses sont conservés tels que publiés, sans fusion des changements éventuels d'identifiant. Les volumes par appareil comptent toutes les traces, même sans GPS utilisable. Une absence du dernier fichier, partiel, ne prouve pas une absence d'utilisation.",
  "potholes.rankingsUnavailable": "Les classements ne sont pas disponibles ou ne correspondent plus aux données annuelles. Les bilans ci-dessus restent disponibles.",
  "potholes.rankMostReported": "Les 5 emplacements les plus signalés",
  "potholes.rankAllReportsNote": "Signalements cumulés, toutes années disponibles.",
  "potholes.rankMostPatched": "Les 5 emplacements avec le plus de colmatages",
  "potholes.rankNearbyRepairsNote": "Colmatages enregistrés dans un rayon de 25 m après le premier signalement. Un emplacement peut représenter plusieurs trous; la réparation de chacun n'est pas confirmée.",
  "potholes.rankStreetLocations": "Les 5 rues avec le plus d'emplacements signalés",
  "potholes.rankStreetLocationsNote": "Emplacements publiés distincts par rue, toutes années disponibles.",
  "potholes.rankStreetReturns": "Les 5 rues avec le plus d'emplacements revenus",
  "potholes.rankStreetReturnsNote": "Nouveau signalement après un colmatage présumé. Tri par emplacements revenus, puis par colmatages associés.",
  "potholes.rankStreetPatching": "Les 5 rues avec le plus de colmatages",
  "potholes.rankStreetPatchingNote": "Interventions GPS distinctes attribuées à la rue, même sans signalement 311.",
  "potholes.rankUnpatched": "Les 5 emplacements les plus signalés sans colmatage recensé",
  "potholes.rankUnpatchedNote": "Signalements sur la période couverte, sans colmatage enregistré dans un rayon de 25 m après le premier signalement. Leur nombre seul ne prouve pas qu'une intervention était due.",
  "potholes.rankOldest": "Les 5 rues aux signalements sans colmatage les plus anciens",
  "potholes.rankOldestNote": "Date du plus ancien emplacement sans colmatage recensé. La rue peut avoir reçu des colmatages ailleurs.",
  "potholes.rankRatioHeading": "Les 5 rues avec le plus de colmatages par signalement",
  "potholes.rankRatioNote": "Période commune, signalements localisables. Ratio = colmatages / signalements, avec un diviseur de 1 lorsqu'aucun signalement n'est recensé.",
  "potholes.rankMachines": "Colmatages par colmateuse",
  "potholes.rankMachinesNote": "Traces publiées, toutes années, y compris celles sans coordonnées utilisables.",
  "potholes.rankUnusedMachines": "Colmateuses non recensées en {year}",
  "potholes.rankUnusedMachinesNote": "Absentes du dernier fichier disponible, partiel. La dernière année d'utilisation recensée est indiquée.",
  "potholes.rankLocation": "Emplacement",
  "potholes.rankStreet": "Rue",
  "potholes.rankDistricts": "{count} arrondissements",
  "potholes.rankReports": "Signalements",
  "potholes.rankNearbyRepairs": "Colmatages proches",
  "potholes.rankLocations": "Emplacements",
  "potholes.rankRecurringLocations": "Emplacements revenus",
  "potholes.rankReturns": "Retours",
  "potholes.rankRepairs": "Colmatages",
  "potholes.rankFirstReport": "Premier signalement",
  "potholes.rankUnpatchedLocations": "Emplacements concernés",
  "potholes.rankRatio": "Ratio",
  "potholes.rankMachine": "Colmateuse",
  "potholes.rankLastYear": "Dernière année",
  "potholes.rankNoResults": "Aucun résultat dans les données disponibles.",
  "potholes.modeLabel": "Rubriques nids-de-poule et colmatages",
  "potholes.repairsTitle": "Colmatages",
  "potholes.repairsDocumentTitle": "Colmatages mécanisés - Montréal",
  "potholes.repairsMapAria": "Carte des interventions historiques de colmatage mécanisé à Montréal",
  "potholes.repairCoverage": "Dates du fichier : {first} au {last}",
  "potholes.repairDatasetNote": "Données historiques, parfois partielles. Les réparations manuelles et les travaux futurs ne sont pas couverts.",
  "potholes.repairLegend": "Colmatage mécanisé · {year}",
  "potholes.repairExcluded": "{count} interventions de la sélection ont des coordonnées non exploitables et ne sont pas affichées.",
  "potholes.repairViewCounts": "Interventions : {count} · Positions GPS représentées : {positions}",
  "potholes.repairEmpty": "Aucun colmatage cartographiable dans cette vue pour ces filtres. Les données ne couvrent pas toutes les réparations.",
  "potholes.repairClusterTitle": "Colmatages regroupés",
  "potholes.repairClusterEvents": "{count} interventions",
  "potholes.repairClusterTooltip": "{positions} positions GPS · {count} interventions de colmatage",
  "potholes.repairPointTooltip": "Colmatage(s) : {count}\n{period}\nAppareil(s) : {devices}",
  "potholes.repairDate": "Date : {date}",
  "potholes.repairPeriod": "Du {first} au {last}",
  "potholes.repairEventsLabel": "Interventions",
  "potholes.repairEventsDefinition": "Enregistrements GPS des appareils de colmatage mécanique correspondant aux filtres. Ce n'est pas un décompte certifié de trous réparés.",
  "potholes.repairLocationsLabel": "Positions GPS",
  "potholes.repairLocationsDefinition": "Coordonnées distinctes des interventions retenues. Plusieurs passages, dates ou appareils peuvent partager exactement la même position.",
  "potholes.repairClustersDefinition": "Les groupes comptent les positions GPS, pas les interventions. Les compteurs de la vue incluent les groupes affichés, qui peuvent dépasser ses bords.",
  "potholes.repairYearNote": "L'année désigne le fichier source. Les mois sont les dates réellement présentes, parfois d'une autre année. Ce filtre ne représente pas une période d'activité comme dans le mode Nids-de-poule.",
  "potholes.repairSelectedCount": "Interventions à cette position",
  "potholes.repairFirst": "Première dans la sélection",
  "potholes.repairLast": "Dernière dans la sélection",
  "potholes.repairRecordPage": "Intervention {current} sur {total} dans la sélection",
  "potholes.roadMap": "Entraves routières",
  "potholes.roadMapLabel": "Retourner à la carte des entraves routières",
  "potholes.countsHelp": "Comprendre les compteurs",
  "potholes.knownReportsLabel": "Signalements connus",
  "potholes.knownReportsDefinition": "Demandes 311 associées aux positions retenues par les filtres, toutes années de création confondues. Plusieurs demandes peuvent concerner la même position.",
  "potholes.positionsLabel": "Positions",
  "potholes.positionsDefinition": "Emplacements publics distincts regroupant ces demandes. Les coordonnées sont déplacées au milieu d'un tronçon de rue : une position ne correspond pas forcément à un seul trou.",
  "potholes.clusterDefinition": "Le chiffre dans un groupe compte les positions, pas les demandes 311. Les compteurs de la vue incluent les points et les groupes affichés, même si un groupe s'étend au-delà du bord de la carte.",
  "potholes.clusterTitle": "Positions regroupées",
  "potholes.clusterReports": "{count} signalements connus",
  "potholes.clusterTooltip": "{positions} emplacements de nids-de-poule\nSignalement(s) : {reports}\nActifs : {active}\nRéparation présumée : {repaired}\nStatut inconnu : {unknown}",
  "potholes.pointTooltipNone": "Aucun",
  "potholes.pointTooltip": "Status : {status}\nSignalement(s) : {count} depuis {year}\nColmatage depuis 1er signalement : {repairs}",
  "potholes.reports": "Signalements 311",
  "potholes.repairs": "Colmatage mécanisé",
  "potholes.reportYear": "Année",
  "potholes.allYears": "Tout",
  "potholes.noYears": "Aucune",
  "potholes.mapStatus.active": "Actif",
  "potholes.mapStatus.presumed-repaired": "Réparation présumée",
  "potholes.mapStatus.unknown": "Statut inconnu",
  "potholes.mapStatusNote": "Un seul statut actuel, indépendant de l'année affichée. Un nouveau signalement après le dernier colmatage enregistré à proximité remet la position à Actif; les réparations précédentes restent uniquement dans l'historique. La réparation reste présumée, sans confirmation sur le terrain.",
  "potholes.activityYearNote": "L'année correspond à une période d'activité, du signalement au prochain colmatage enregistré dans un rayon de 25 m, ou sans fin connue. Une position peut être active une année sans nouvelle demande cette année-là. Une année entièrement située entre une réparation et une réactivation est exclue.",
  "potholes.status311": "Statut du dossier 311",
  "potholes.totalReports": "Signalements (toutes années)",
  "potholes.selectedReports": "Signalements dans la sélection",
  "potholes.latestReport": "Dernier signalement connu",
  "potholes.latestRepair": "Dernier colmatage à proximité",
  "potholes.timelineCounts": "Signalements : {reports} · Colmatages à proximité : {repairs}",
  "potholes.timelineReport": "Signalement 311",
  "potholes.timelineRepair": "Colmatage enregistré dans un rayon de 25 m",
  "potholes.moreHistory": "Voir la suite de l'historique",
  "potholes.repairHistoryExcluded": "{count} traces GPS invalides sont exclues du corpus de colmatage. L'historique peut être incomplet.",
  "potholes.repairYear": "Année du fichier",
  "potholes.month": "Mois",
  "potholes.allMonths": "Tous les mois",
  "potholes.state": "Statut actuel",
  "potholes.open": "Dossiers ouverts",
  "potholes.closed": "Dossiers fermés",
  "potholes.unknown": "Statut inconnu",
  "potholes.allStates": "Tous les statuts",
  "potholes.district": "Arrondissement",
  "potholes.allDistricts": "Tous les arrondissements",
  "potholes.search": "Rue, intersection ou numéro de dossier 311",
  "potholes.searchPlaceholder": "Rue, intersection ou dossier 311",
  "potholes.device": "Appareil de colmatage",
  "potholes.allDevices": "Tous les appareils",
  "potholes.filters": "Filtres et résultats",
  "potholes.mapFilters": "Filtres",
  "potholes.loading": "Chargement des données…",
  "potholes.loadError": "Données indisponibles. Le chargement peut être relancé.",
  "potholes.retry": "Réessayer",
  "potholes.coverage": "Signalements des positions retenues : {first} au {last}",
  "potholes.reportCounts": "Signalements connus : {count} · Positions : {positions}",
  "potholes.repairCounts": "{count} interventions · {positions} positions GPS",
  "potholes.noCoordinates": "Aucune position cartographiable parmi {count} enregistrements dans ce fichier.",
  "potholes.excluded": "{count} demandes du corpus sans position cartographiable. Leur période d'activité ne peut pas être établie.",
  "potholes.sources": "Sources et limites des données",
  "potholes.verified": "Dernière vérification du corpus : {date}",
  "potholes.dataUpdated": "Dernière mise à jour des données : {date}",
  "potholes.dataUpdateUnavailable": "Date de mise à jour des données indisponible.",
  "potholes.verificationUnavailable": "Date de vérification du corpus indisponible.",
  "potholes.modified": "Contenu du fichier modifié le {date}",
  "potholes.sourceCount": "{source} {year} : {count} enregistrements, dont {mapped} cartographiables avant filtrage.",
  "potholes.informationCount": "{count} demandes d'information, sans position de nid-de-poule.",
  "potholes.scopeNote": "Données de la Ville de Montréal. Aucune couverture n'est assurée pour les autres municipalités du Grand Montréal.",
  "potholes.positionNote": "Position 311 relocalisée au milieu d'un tronçon de rue de plus de 45 m. Ce n'est pas l'emplacement exact d'un trou. Les coordonnées de bureaux d'arrondissement sont exclues.",
  "potholes.statusNote": "Un dossier 311 fermé ne confirme pas une réparation. Il peut être terminé, annulé, refusé ou supprimé. Le statut provient de notre dernière copie des données, pas d'une vérification sur le terrain.",
  "potholes.repairNote": "Traces GPS de colmatage mécanisé uniquement, pas un décompte certifié de trous réparés. Les réparations manuelles et les travaux futurs ne sont pas couverts.",
  "potholes.matchNote": "Un colmatage à proximité désigne des travaux enregistrés dans un rayon de 25 m autour de la position publique 311. Il peut s'agir d'un autre trou : la Ville ne confirme pas le lien avec ce signalement.",
  "potholes.yearNote": "Les fichiers annuels peuvent être partiels ou contenir des dates d'une autre année. Les périodes affichées sont les dates effectivement présentes, sans garantie de couverture continue.",
  "potholes.sources311": "Source officielle : demandes 311",
  "potholes.sourcesRepairs": "Source officielle : colmatage mécanisé",
  "potholes.snapshotIndex": "Liste des fichiers de données (JSON)",
  "potholes.results": "Dans la vue",
  "potholes.viewCounts": "Signalements connus : {reports} · Positions représentées : {positions}",
  "potholes.empty": "Aucun résultat cartographiable dans cette vue pour ces filtres. Cela ne garantit pas l'absence de nids-de-poule.",
  "potholes.noLayers": "Aucune couche sélectionnée.",
  "potholes.more": "Voir davantage de résultats",
  "potholes.reportGroups": "Signalements regroupés",
  "potholes.repairGroups": "Colmatages regroupés",
  "potholes.groupArea": "Plusieurs positions dans ce secteur",
  "potholes.unknownStreet": "Position publique 311",
  "potholes.repairPosition": "Colmatage mécanisé",
  "potholes.mapAria": "Carte des nids-de-poule à Montréal et de leurs statuts estimés",
  "potholes.mapTools": "Commandes de la carte",
  "potholes.legend": "Légende des signalements et interventions",
  "potholes.details": "Détail de la position",
  "potholes.close": "Fermer la fiche",
  "potholes.previous": "Enregistrement précédent",
  "potholes.next": "Enregistrement suivant",
  "potholes.records": "Enregistrements à cette position",
  "potholes.recordPage": "Dossier {current} sur {total} dans la sélection",
  "potholes.notPublished": "Non publié",
  "potholes.reportId": "Dossier 311",
  "potholes.created": "Création",
  "potholes.statusDate": "Date du dernier statut",
  "potholes.statusDelay": "Délai jusqu'au dernier statut",
  "potholes.days": "{count} jours",
  "potholes.nature": "Nature de la demande",
  "potholes.locationType": "Type de lieu",
  "potholes.intersections": "Intersections publiées",
  "potholes.postalCode": "Code postal",
  "potholes.responsible": "Unité responsable",
  "potholes.origin": "Provenance publiée",
  "potholes.coordinates": "Coordonnées publiées",
  "potholes.administrative": "Données administratives",
  "potholes.history": "Historique de cette position",
  "potholes.historyUnavailable": "L'historique des colmatages est indisponible. La chronologie des signalements reste consultable, mais elle est incomplète.",
  "potholes.historyTotal": "{count} demandes, du {first} au {last}.",
  "potholes.historyNote": "Chronologie du plus ancien au plus récent, toutes années et tous statuts 311. Les colmatages ont été enregistrés dans un rayon de 25 m après le premier signalement; ils ne confirment pas la réparation de ce trou précis. Plusieurs trous peuvent partager cette position.",
  "potholes.estimatedMatch": "Colmatage enregistré à proximité",
  "potholes.noMatch": "Aucun colmatage enregistré dans un rayon de 25 m après cette demande dans les données disponibles. Cela ne prouve pas l'absence de réparation.",
  "potholes.outOfCoverage": "Cette demande est postérieure au dernier colmatage disponible. Aucun suivi de réparation ne peut en être déduit.",
  "potholes.nearbyTraces": "{count} traces GPS dans un rayon de {radius} m, toutes dates du corpus confondues.",
  "potholes.observedTime": "Date et heure publiées",
  "potholes.distance": "Distance à la position 311",
  "potholes.afterReport": "Après le signalement",
  "potholes.confidence": "Indice calculé à partir des données",
  "potholes.confidence.elevee": "Élevé (heuristique)",
  "potholes.confidence.moyenne": "Moyen (heuristique)",
  "potholes.confidence.faible": "Faible (heuristique)",
  "potholes.confidence.aucune": "Aucun",
  "potholes.beforeLastStatus": "Au plus tard au dernier statut",
  "potholes.yes": "Oui",
  "potholes.no": "Non",
  "potholes.sourceYear": "Fichier source : {year}",
  "potholes.officialSource": "Consulter la source officielle",
  "potholes.locate": "Ma position",
  "potholes.locating": "Localisation en cours…",
  "potholes.locateError": "Position indisponible ou permission refusée.",
  "potholes.tileError": "Fond de carte partiellement indisponible. Les données chargées restent consultables.",
  "potholes.reset": "Recentrer sur Montréal",
  "potholes.resetFilters": "Réinitialiser tous les filtres",
  "potholes.status.terminee": "Terminée (311)",
  "potholes.status.annulee": "Annulée",
  "potholes.status.refusee": "Refusée",
  "potholes.status.supprimee": "Supprimée",
  "potholes.status.acceptee": "Acceptée",
  "potholes.status.prise-en-charge": "Prise en charge",
  "potholes.status.transmise-pour-traitement": "Transmise pour traitement",
  "potholes.status.reactivee": "Réactivée",
  "potholes.status.urgente": "Urgente",
  "potholes.nature.requete": "Requête",
  "potholes.nature.plainte": "Plainte",
  "potholes.nature.commentaire": "Commentaire",
  "potholes.nature.information": "Information",
  "potholes.place.adresse": "Adresse",
  "potholes.place.intersection": "Intersection",
  "potholes.place.troncon": "Tronçon",
  "nav.install": "Installer l'application",
  "nav.installHelp": "Dans Safari, touchez Partager, puis Sur l'écran d'accueil.",
  "nav.installHelpChrome": "Dans Chrome, ouvrez le menu ⋮, puis choisissez Installer la page en tant qu'application ou Ajouter à l'écran d'accueil.",
  "nav.installHelpBrowser": "Utilisez le menu de votre navigateur pour ajouter ce site à votre écran d'accueil ou au Dock.",
  "list.more": "autres entraves dans la zone visible",
  "list.refine": "Affinez par date, rue ou responsable pour réduire la liste.",
  "pedestrian.document.mapTitle": "Entraves piétonnes - Grand Montréal",
  "pedestrian.map.title": "Entraves piétonnes",
  "pedestrian.map.intro": "Entraves piétonnes consolidées des sources municipales et régionales. Couverture partielle : une absence d’entrave ne garantit pas un passage libre ou accessible.",
  "pedestrian.map.interactiveLabel": "Carte des entraves piétonnes du Grand Montréal",
  "pedestrian.map.legendLabel": "Légende des impacts piétons",
  "pedestrian.map.loading": "Chargement du snapshot des entraves piétonnes...",
  "pedestrian.map.loadError": "Chargement des impacts piétons impossible. Aucune donnée automobile de secours n’est utilisée.",
  "pedestrian.map.sourcesText": "Snapshot consolidé, non mis à jour en direct. Chaque fiche conserve son lien officiel et la date de vérification de sa source. Les sources locales reprises gardent leur date d’extraction précédente.<br>Les impacts piétons et cyclables sont distingués. Une fermeture cyclable ne confirme pas une fermeture piétonne. Les avis sans tracé vérifié sont présentés séparément. Un aménagement annoncé par Montréal ne signifie pas une fermeture complète. Le côté opposé n’est jamais déduit. Fond de carte : OpenStreetMap.",
  "pedestrian.filters.sourceHelp": "Responsable publié pour l’entrave, distinct de l’organisme qui fournit les données. Impacts piétons et cyclables admissibles du snapshot.",
  "pedestrian.filters.impactGroupLabel": "Types d’impact sur les déplacements à pied ou à vélo",
  "pedestrian.filters.critical": "Fermeture confirmée",
  "pedestrian.filters.moderate": "Aménagement / travaux",
  "pedestrian.filters.impactHelp": "<p><strong>Fermeture confirmée :</strong> fermeture explicitement publiée d’un passage, comme un sentier fermé à Longueuil.</p><p><strong>Aménagement / travaux :</strong> Montréal annonce un aménagement pour la circulation piétonne ou des travaux dans un parc. Les codes bruts blocked, obstructed ou closed ne suffisent pas à conclure à une fermeture piétonne complète.</p>",
  "pedestrian.severity.critical": "Fermeture confirmée",
  "pedestrian.severity.moderate": "Aménagement / travaux",
  "pedestrian.areas": "Zones touchées",
  "pedestrian.area": "Zone touchée",
  "pedestrian.area.sidewalk": "Trottoirs",
  "pedestrian.area.park": "Parcs",
  "pedestrian.area.path": "Sentiers / pistes cyclables",
  "pedestrian.affectedUsers": "Usagers concernés",
  "pedestrian.cyclists": "Cyclistes (impact piéton non confirmé)",
  "pedestrian.cyclingImpact": "Impact cyclable",
  "pedestrian.unmappedNotices": "Avis sans tracé vérifié",
  "pedestrian.noticeSource": "Avis municipal",
  "pedestrian.category.private": "Autres responsables",
  "pedestrian.list.none": "Aucune entrave piétonne trouvée",
  "pedestrian.list.noneHint": "Vérifiez les dates, les filtres et la zone affichée. La couverture est partielle; l’absence d’entrave ne confirme pas l’accessibilité.",
  "pedestrian.popup.impact": "Impact piéton",
  "pedestrian.popup.direction": "Côté / direction",
  "pedestrian.pathClosed": "Sentier fermé selon la source.",
  "pedestrian.directionUnknown": "Côté et direction non précisés dans les champs exploités. Consulter l’avis détaillé pour les aménagements annoncés.",
  "pedestrian.geometryNote": "Géométrie officielle de localisation ou d’emprise du chantier, pas un tracé précis du trottoir ni un itinéraire piéton. Le côté touché et l’accessibilité ne sont pas déduits de cette géométrie.",
  "pedestrian.pointNote": "Point de localisation officiel. Aucun tracé précis du passage touché n’est publié dans les champs exploités.",
  "pedestrian.reference": "Référence",
  "popup.reference": "Référence",
  "popup.sourceId": "Identifiant source",
  "pedestrian.noticeChecked": "Avis vérifié (snapshot)",
  "pedestrian.noticeUnchecked": "Avis absent du snapshot; consulter la source",
  "pedestrian.noticeSnapshot": "Détails des avis Montréal (snapshot)",
  "pedestrian.sourceChecked": "Source vérifiée le",
  "pedestrian.generatedAt": "Consolidation générée le",
  "pedestrian.failedSources": "Flux non vérifiés lors de cette consolidation :",
  "pedestrian.snapshotLink": "Données et bilan des sources (JSON)",
  "pedestrian.side": "Côté publié",
  "pedestrian.side.unknown": "Non précisé",
  "pedestrian.side.not-applicable": "Passage entier",
  "pedestrian.side.north": "Nord",
  "pedestrian.side.south": "Sud",
  "pedestrian.side.east": "Est",
  "pedestrian.side.west": "Ouest",
  "pedestrian.endDate": "Fin publiée",
  "pedestrian.openEnded": "Non publiée; statut actif lors de la vérification de la source",
  "pedestrian.additionalInfo": "Information complémentaire publiée",
  "pedestrian.publishedType": "Impact brut publié",
  "pedestrian.intermittent": "Fermeture intermittente publiée",
  "pedestrian.workType": "Nature publiée",
  "pedestrian.workCategory": "Catégorie publiée",
  "pedestrian.description": "Description publiée",
  "pedestrian.scheduleUnknown": "Horaire détaillé",
  "pedestrian.sourceFailure": "Source piétonne indisponible ou incomplète :",
  "pedestrian.loaded": "Impacts piétons chargés",
  "nav.faq": "FAQ",
  "nav.comments": "Commentaires?",
  "nav.missing": "Entraves<br>manquantes?",
  "nav.missingLabel": "Signaler une entrave manquante",
  "faq.q.missing": "Une entrave manque sur la carte?",
  "faq.a.missing": "Vous pouvez signaler une entrave manquante dans le Grand Montréal à l'aide du formulaire dédié. Précisez la municipalité, la rue ou la route, l'emplacement exact et l'effet sur la circulation automobile. Ajoutez les dates, les horaires et un lien vers un avis officiel si vous les connaissez. Les signalements sont vérifiés avant tout ajout : l'envoi du formulaire ne garantit pas une publication ni une réponse. Ce formulaire n'est pas un service d'urgence. Ne le remplissez pas en conduisant.",
  "faq.missingLink": "Signaler une entrave manquante",
  "map.region": "Région métropolitaine de Montréal",
  "map.title": "Carte des entraves routières",
  "map.intro": "Carte de conduite pour repérer les rues fermées, les voies retranchées, les restrictions UCI et les secteurs où les détours sont probables.",
  "map.interactiveLabel": "Carte interactive de Montréal",
  "map.instruction": "Cliquez sur une ligne colorée pour voir les détails des travaux.",
  "map.tipLabel": "Conseil pour utiliser la carte",
  "map.tipTitle": "Petit conseil",
  "map.tipText": "Cliquez sur une ligne colorée pour consulter les dates, les détails et les détours.",
  "map.tipClose": "Fermer le conseil",
  "map.loading": "Chargement des entraves depuis plusieurs sources officielles...",
  "map.loadingInitial": "Chargement de la carte...",
  "map.tileError": "Le fond de carte charge mal. Les fermetures restent affichées, mais vérifiez la connexion Internet.",
  "map.loadError": "Impossible de charger les APIs officielles. Les données de secours restent affichées.",
  "map.apiUnavailable": "APIs officielles non disponibles: affichage des données de secours seulement.",
  "map.dataLoaded": "Données chargées",
  "map.legendLabel": "Légende des impacts auto",
  "map.sources": "Sources",
  "map.sourcesLabel": "Sources officielles",
  "map.sourcesClose": "Fermer les sources",
  "map.sourcesText": "La liste complète des sources et leurs liens est disponible dans le <a href=\"faq.html#sources-utilisees\">FAQ</a>.",
  "map.closeDetails": "Fermer les détails",
  "menu.open": "Ouvrir le menu",
  "menu.close": "Fermer le menu",
  "menu.resize": "Ajuster la largeur du menu",
  "filters.label": "Filtres",
  "filters.dates": "Dates",
  "filters.today": "Aujourd'hui",
  "filters.start": "Début",
  "filters.end": "Fin",
  "filters.dateHelpLabel": "Information sur la période",
  "filters.dateHelp": "La période affiche toutes les entraves qui touchent au moins une journée entre les deux dates, même si elles ne durent que quelques heures ou quelques jours.",
  "filters.time": "Moment des travaux",
  "filters.timeHelpLabel": "Information sur les travaux de jour et de nuit",
  "filters.timeHelp": "<p><strong>Jour:</strong> entraves hors de la plage de nuit.</p><p><strong>Nuit:</strong> toute entrave qui touche la période de 22 h à 5 h, même si elle commence avant 22 h ou finit après 5 h.</p>",
  "filters.day": "Jour",
  "filters.night": "Nuit",
  "filters.source": "Responsable / source",
  "filters.sourceHelpLabel": "Information sur responsable et source",
  "filters.sourceHelp": "Ce filtre sert à choisir la source ou le responsable publié pour les fermetures: Ville de Montréal, secteurs privés, événements, grands axes ou sources municipales indépendantes à consulter séparément.",
  "filters.sourceGroupLabel": "Responsable ou source des entraves",
  "filters.impact": "Type d'impact",
  "filters.impactHelpLabel": "Information sur les types d'impact",
  "filters.impactHelp": "<p><strong>Fermeture complète:</strong> circulation interdite sur le segment publié.</p><p><strong>Voie touchée:</strong> une voie de circulation est retranchée.</p><p><strong>Accès limité:</strong> circulation locale ou sens temporaire.</p><p><strong>Stationnement:</strong> la rue reste ouverte, mais le stationnement est retiré ou interdit.</p>",
  "filters.impactGroupLabel": "Types d'impact sur la circulation",
  "filters.critical": "Fermeture complète",
  "filters.major": "Voie touchée",
  "filters.moderate": "Accès limité",
  "filters.parking": "Stationnement",
  "summary.visible": "entraves visibles",
  "summary.reset": "Recentrer",
  "municipalities.title": "Sources travaux des villes liées",
  "municipalities.helpLabel": "Information sur les municipalités indépendantes",
  "municipalities.help": "Ces 15 municipalités sont sur l'île de Montréal, mais ne sont pas toujours incluses dans le flux Info-entraves de la Ville. Les liens pointent vers leurs pages Travaux, Info-travaux, projets ou avis officiels.",
  "municipalities.note": "Aucune source publique unique ne normalise toutes ces villes. Cette section les inclut comme sources officielles à consulter ou à brancher dans une prochaine couche de données.",
  "list.title": "Entraves actives",
  "list.searchLabel": "Recherche",
  "location.button": "Afficher ma position",
  "location.loading": "Recherche de votre position...",
  "location.found": "Carte centrée sur votre position. Le cercle indique la précision estimée.",
  "location.nearby": "Afficher les entraves autour de moi",
  "visualAssist.on": "Mode lecteur d’écran",
  "visualAssist.onLabel": "Activer le mode lecteur d’écran",
  "visualAssist.off": "Affichage classique",
  "visualAssist.offLabel": "Revenir à l’affichage classique",
  "map.zoomIn": "Zoom avant",
  "visualAssist.panelLabel": "Recherche et entraves actives",
  "map.zoomOut": "Zoom arrière",
  "location.foundList": "Position trouvée. La liste montre maintenant les entraves autour de vous.",
  "location.denied": "Localisation refusée. Autorisez l’accès à votre position dans les paramètres du navigateur, puis réessayez.",
  "location.timeout": "La localisation a pris trop de temps. Réessayez.",
  "location.unavailable": "Votre position est indisponible. Vérifiez que la localisation de votre appareil est activée, puis réessayez.",
  "location.unsupported": "La localisation est indisponible dans ce navigateur ou sur cette connexion. Elle nécessite une connexion HTTPS ou localhost.",
  "list.searchPlaceholder": "Rechercher une rue, un quartier ou une ville...",
  "list.none": "Aucune entrave auto trouvée",
  "list.noneHint": "Changez la date, les filtres ou le cadrage de la carte.",
  "severity.critical": "Fermeture complète",
  "severity.closedStreet": "Rue fermée",
  "severity.closedRoad": "Chemin fermé",
  "severity.closedRoute": "Route fermée",
  "severity.closedHighway": "Autoroute fermée",
  "severity.closedBridge": "Pont fermé",
  "severity.closedTunnel": "Tunnel fermé",
  "severity.major": "Voie touchée",
  "severity.moderate": "Accès limité",
  "severity.parking": "Stationnement",
  "severity.minor": "Faible impact",
  "category.municipal": "Ville",
  "category.citizen": "Signalements citoyens",
  "citizen.sourceKind": "Nature de la source",
  "citizen.unofficial": "Déclaration citoyenne, pas un avis officiel municipal. Entrave non confirmée officiellement.",
  "citizen.origin": "Origine déclarée",
  "citizen.observed": "Observation ou consultation",
  "citizen.dates": "Dates déclarées et réserves",
  "citizen.details": "Commentaire intégral",
  "citizen.warnings": "Réserves",
  "citizen.geometry": "Tracé vérifié",
  "citizen.geometryOnly": "La géobase confirme le tracé de la rue, pas la restriction.",
  "citizen.verified": "Dernière vérification du signalement",
  "citizen.schedule": "Horaire déclaré",
  "citizen.activeNow": "Dans la plage horaire déclarée actuellement; conditions sur place non confirmées.",
  "citizen.inactiveNow": "Hors de la période ou de la plage horaire déclarée actuellement.",
  "category.private": "Secteurs privés",
  "category.linkedCity": "Villes liées",
  "category.commercial": "Rues marchandes",
  "category.event": "Événements",
  "category.regional": "Grands axes",
  "category.q511": "Québec 511",
  "category.laval": "Laval",
  "category.longueuil": "Longueuil",
  "category.strike": "Grèves / manifestations",
  "laval.closed": "Rues barrées",
  "laval.partial": "Entrave partielle",
  "laval.planned": "Entrave planifiée",
  "source.open": "Ouvrir la source",
  "popup.one": "1 entrave à cet endroit",
  "popup.many": "entraves à cet endroit",
  "popup.otherNearby": "autres entraves très proches. Zoomez ou filtrez pour les isoler.",
  "popup.to": "au",
  "schedule.label": "Horaire publié",
  "schedule.to": "à",
  "popup.at": "à",
  "schedule.allDay": "24 h sur 24",
  "schedule.Mon": "Lun.",
  "schedule.Tue": "Mar.",
  "schedule.Wed": "Mer.",
  "schedule.Thu": "Jeu.",
  "schedule.Fri": "Ven.",
  "schedule.Sat": "Sam.",
  "schedule.Sun": "Dim.",
  "popup.responsible": "Responsable",
  "popup.period": "Moment",
  "popup.impact": "Impact auto",
  "popup.direction": "Direction",
  "popup.geometryNote": "Géométrie",
  "popup.tunnelNote": "Ce tracé suit un tunnel — il est dessiné sous les rues de surface affichées sur la carte.",
  "popup.notPublished": "non publiée",
  "popup.unknownPeriod": "Période indéterminée",
  "popup.startDate": "Début",
  "popup.endDate": "Fin",
  "popup.dayNight": "Jour et nuit",
  "popup.night": "Nuit (22 h à 5 h)",
  "popup.day": "Jour",
  "abbreviation.MTMD": "ministère des Transports et de la Mobilité durable",
  "abbreviation.VM": "Ville-Marie",
  "abbreviation.SO": "Le Sud-Ouest",
  "abbreviation.RPP": "Rosemont–La Petite-Patrie",
  "abbreviation.AC": "Ahuntsic-Cartierville",
  "abbreviation.CDNNDG": "Côte-des-Neiges–Notre-Dame-de-Grâce",
  "abbreviation.SLR": "Saint-Laurent",
  "abbreviation.LCH": "Lachine",
  "abbreviation.LSL": "LaSalle",
  "abbreviation.ANJ": "Anjou",
  "abbreviation.OUT": "Outremont",
  "abbreviation.RDPPAT": "Rivière-des-Prairies–Pointe-aux-Trembles",
  "abbreviation.PFDROX": "Pierrefonds-Roxboro",
  "abbreviation.IBZSGV": "L'Île-Bizard–Sainte-Geneviève",
  "abbreviation.SLN": "Saint-Léonard",
  "abbreviation.VRD": "Verdun",
  "abbreviation.VSMPE": "Villeray–Saint-Michel–Parc-Extension",
  "abbreviation.MHM": "Mercier–Hochelaga-Maisonneuve",
  "abbreviation.MTN": "Montréal-Nord",
  "abbreviation.PMR": "Le Plateau-Mont-Royal",
  "abbreviation.UCI": "Union Cycliste Internationale",
  "abbreviation.BIXI": "réseau de vélos en libre-service",
  "abbreviation.OSRM": "Open Source Routing Machine",
  "abbreviation.WFS": "Web Feature Service",
  "abbreviation.API": "interface de programmation d'application",
  "abbreviation.Open511": "format ouvert d'événements de circulation",
  "abbreviation.ArcGIS": "plateforme de services géographiques",
  "abbreviation.CKAN": "plateforme de catalogage de données ouvertes",
  "faq.eyebrow": "Carte des entraves",
  "faq.title": "Questions fréquentes",
  "faq.intro": "Repères utiles pour utiliser la carte et comprendre ce que les entraves affichées signifient pour vos déplacements.",
  "faq.potholesHelp": "Pour les questions sur les nids-de-poule et les colmatages, consultez la FAQ dédiée :",
  "faq.about": "À propos",
  "faq.use": "Utiliser la carte",
  "faq.data": "Données et fraîcheur",
  "faq.travel": "Préparer un déplacement",
  "faq.sectionNav": "Sections de la FAQ",
  "faq.openMap": "Ouvrir la carte des entraves",
  "faq.publicNote": "Les données affichées sont publiques, mais les conditions sur le terrain et la signalisation routière prévalent toujours.",
  "faq.sourcesCaption": "Sources utilisées par la carte",
  "faq.sourcesHeader": "Source",
  "faq.municipalityHeader": "Municipalité",
  "faq.typeHeader": "Type de données",
  "faq.sourceRegional": "Réseau / régional",
  "faq.sourceProvincial": "Provincial",
  "faq.metroRegion": "Région métropolitaine",
  "faq.linkHeader": "Lien",
  "faq.live": "En direct",
  "faq.snapshot": "Snapshot",
  "faq.snapshotUpdated": "Dernière mise à jour",
  "faq.all": "Tout",
  "faq.top": "Remonter en haut de la page",
  "faq.profile": "Mon LinkedIn:",
  "faq.instagram": "Mon Instagram:",
  "faq.feedbackLink": "Commentaires & Améliorations",
  "faq.sourceLink": "Ouvrir la source"
  ,"faq.q.aboutCreated": "Pourquoi cette carte a-t-elle été créée?"
  ,"faq.a.aboutCreated": "Parce qu'il devenait étonnamment compliqué de savoir quelle rue fermerait, à quel moment, dans quelle direction et pour combien de temps. Les autoroutes n'étaient pas plus simples. L'information existait, mais elle était dispersée. Cette carte a été créée pour la rassembler au même endroit, avant que le détour devienne un projet de fin de semaine."
  ,"faq.q.aboutName": "Pourquoi le nom cestdejalenfer.ca?"
  ,"faq.a.aboutName": "Le nom est un clin d'œil aux discussions très publiques sur les déplacements difficiles à Montréal, notamment à la formule « ça va être l'enfer » associée à la mairesse Soraya Martínez Ferrada. Pour beaucoup de personnes qui conduisent depuis le début de l'été, le site part d'un constat plus direct: c'est déjà compliqué. Autant avoir une carte sous la main."
  ,"faq.q.aboutCreator": "Qui a créé ce site?"
  ,"faq.a.aboutCreator": "Je m'appelle Shelsea Saint-Fleur. J'ai réalisé ce projet durant du temps libre, avec l'idée très simple de rendre les entraves routières un peu moins mystérieuses. Le site est perfectible, et c'est tout à fait normal: les travaux changent, les données publiques évoluent et personne n'a encore trouvé comment faire disparaître les cônes orange."
  ,"faq.q.aboutCode": "Vous aimeriez voir le code ou contribuer au projet?"
  ,"faq.a.aboutCode": "Le code et les changements du site sont publics sur GitHub. Vous pouvez consulter le projet, laisser des commentaires, ouvrir une demande de modification ou proposer des améliorations directement dans le dépôt."
  ,"faq.aboutCodeLink": "Voir le dépôt GitHub"
  ,"faq.q.aboutFeedback": "Vous aimeriez laisser un commentaire ou proposer une amélioration?"
  ,"faq.a.aboutFeedback": "Vous pouvez partager vos commentaires et vos idées dans le formulaire"
  ,"faq.q.colors": "Que signifient les couleurs?"
  ,"faq.a.colors": "<p>Les couleurs représentent le type d'impact automobile attribué par la carte:</p><ul><li><strong><span class=\"impact-word critical\">Rouge</span> - Fermeture complète:</strong> la circulation automobile est interdite sur le segment ou l'accès publié.</li><li><strong><span class=\"impact-word major\">Orange</span> - Voie touchée:</strong> au moins une voie de circulation est retranchée, fermée ou réorganisée, mais la rue demeure généralement ouverte.</li><li><strong><span class=\"impact-word moderate\">Jaune</span> - Accès limité:</strong> la circulation locale, le sens de circulation ou les conditions d'accès sont temporairement restreints.</li><li><strong><span class=\"impact-word parking\">Rose</span> - Stationnement:</strong> des places de stationnement pour voitures sont retirées ou interdites pour une période déterminée, sans fermeture complète de la rue.</li></ul><p>Ces couleurs sont celles de la carte et ne servent pas à interpréter les couleurs utilisées par les sources originales.</p>"
  ,"faq.q.parkingImpact": "Que signifie le type d'impact « Stationnement »?"
  ,"faq.a.parkingImpact": "<p>Cette catégorie est utilisée lorsque la rue demeure ouverte, mais que des places de stationnement pour voitures sont retirées ou interdites pour une période déterminée. Elle peut notamment signaler:</p><ul><li><strong>Des travaux routiers:</strong> des places de stationnement supprimées ou réservées pendant un chantier, même si aucune voie de circulation n'est fermée.</li><li><strong>Des entraves temporaires:</strong> du stationnement interdit pour un événement, une livraison, une opération d'entretien ou une autre intervention publiée.</li><li><strong>Des stations BIXI sur rue:</strong> des places de stationnement occupées par une station que les données officielles identifient comme installée dans du stationnement en bordure de rue. Les stations BIXI situées sur un trottoir, dans un parc ou dans un stationnement hors rue ne sont pas affichées comme un impact sur le stationnement automobile.</li></ul>"
  ,"faq.q.legend": "Pourquoi certaines couleurs ne figurent-elles pas dans la légende?"
  ,"faq.a.legend": "La légende au bas de la carte suit les choix du filtre « Type d'impact ». Une catégorie décochée est masquée sur la carte et retirée de la légende."
  ,"faq.q.viewport": "Pourquoi la liste des entraves change-t-elle lorsque je déplace la carte?"
  ,"faq.a.viewport": "La section « Entraves actives » affiche uniquement les entraves qui intersectent la zone actuellement visible. Les dates, les sources, le type d'impact, le moment des travaux et la recherche s'ajoutent à ce filtre géographique."
  ,"faq.q.seeWork": "Comment voir les travaux d'un endroit?"
  ,"faq.a.seeWork": "Vous pouvez utiliser les filtres et la liste « Entraves actives » dans le menu. Sur la carte, cliquez sur une ligne, une zone ou un marqueur pour ouvrir les détails publiés. Les points représentent les emplacements officiels lorsque la source ne publie pas de tracé; ils ne constituent pas nécessairement toute la longueur du chantier."
  ,"faq.q.search": "Comment rechercher une rue ou un secteur?"
  ,"faq.a.search": "Utilisez le champ de recherche au-dessus de la liste des entraves. Il recherche notamment les rues, les arrondissements, les municipalités, les responsables, les impacts et les directions publiées."
  ,"faq.q.pedestrianMode": "Qu'est-ce que le mode Piétons et en quoi est-il différent du mode Auto?"
  ,"faq.a.pedestrianMode": "<p>La carte offre deux modes, accessibles avec les boutons <strong>Auto</strong> et <strong>Piétons</strong> dans le menu. Passer d'un mode à l'autre conserve la langue, la zone affichée et les dates choisies.</p><ul><li><strong>Mode Auto :</strong> les entraves qui touchent la circulation automobile dans le Grand Montréal, comme les rues ou ponts fermés, les voies retranchées, les accès limités et le stationnement touché. Les couleurs indiquent l'impact pour les automobilistes.</li><li><strong>Mode Piétons :</strong> les entraves qui touchent les déplacements à pied ou à vélo, sur les trottoirs, dans les parcs et sur les sentiers ou pistes cyclables. Le rouge indique une fermeture confirmée par la source, et l'orange un aménagement ou des travaux annoncés.</li></ul><p>Une entrave automobile n'est pas automatiquement une entrave piétonne : une rue fermée aux voitures peut garder ses trottoirs ouverts. À l'inverse, une piste cyclable fermée n'est pas présentée comme une entrave automobile. Chaque mode utilise donc ses propres données et ses propres règles.</p><p>En mode Piétons, le filtre « Zones touchées » permet de choisir les trottoirs, les parcs ou les sentiers et pistes cyclables. Les données proviennent d'un portrait consolidé des sources municipales et régionales, mis à jour régulièrement plutôt qu'en direct.</p><p>La couverture reste partielle : l'absence d'une entrave sur la carte ne garantit pas qu'un passage est libre ou accessible. Le côté de la rue touché est indiqué seulement lorsque la source le publie.</p>"
  ,"faq.q.visualAssist": "Qu'est-ce que le mode lecteur d’écran?"
  ,"faq.a.visualAssist": "<p>Le mode lecteur d’écran est une version de la carte Piétons pensée pour les personnes aveugles ou malvoyantes qui naviguent avec un lecteur d'écran comme VoiceOver. Il est offert sur téléphone et sur tablette.</p><p>Ce mode est né des commentaires d'une personne de la Fondation INCA, qui soutient les personnes vivant avec une perte de vision. Elle a pris le temps de tester la carte avec VoiceOver sur son iPhone et de nous montrer, en vidéo, les obstacles qu'elle rencontrait : une recherche difficile à activer et une liste d'entraves impossible à atteindre dans le menu. Ses observations ont guidé chacun des changements de ce mode. Merci!</p><p><strong>Pour l'activer :</strong> sur la carte Piétons, ouvrez le menu et touchez « Mode lecteur d’écran ». Au même endroit, le bouton devient « Affichage classique » pour revenir à l'affichage habituel. Votre choix est mémorisé sur l'appareil : la carte s'ouvrira dans le même mode à votre prochaine visite.</p><p><strong>En résumé, ce qui change par rapport à l’affichage classique :</strong></p><ul><li>Seule la carte Piétons est offerte : le choix Auto / Piétons est retiré.</li><li>L'écran est partagé : la carte occupe la moitié du haut, et la liste des entraves reste toujours visible dans la moitié du bas, sans passer par le menu.</li><li>Le bouton « Afficher les entraves autour de moi » et la barre de recherche sont placés au-dessus de la liste et restent visibles pendant le défilement.</li><li>Les fenêtres de détail de la carte sont allégées : elles reprennent seulement les renseignements des fiches de la liste.</li></ul><p><strong>Avec VoiceOver :</strong> après le bouton du menu, VoiceOver passe directement au bouton de localisation, à la recherche, puis aux fiches des entraves, sans devoir parcourir la carte. Chaque fiche commence par un titre de niveau 3 : avec le rotor réglé sur « Titres », vous passez d'une entrave à l'autre d'un simple balayage. Le bouton « Afficher les entraves autour de moi » demande votre position; la liste montre ensuite seulement les entraves proches, et VoiceOver annonce le résultat.</p><p><strong>Astuce pour revenir à la recherche :</strong> touchez le haut de l'écran avec quatre doigts pour revenir au premier élément, puis balayez vers la droite jusqu'à la recherche. La barre de recherche reste aussi toujours au même endroit, juste sous la carte.</p><p>Ce mode continue d'évoluer. Si vous utilisez un lecteur d'écran, vos commentaires sont précieux : écrivez-nous avec le lien « Commentaires? » du menu.</p>"
  ,"faq.q.installApp": "Comment installer la carte comme une application sur mon téléphone?"
  ,"faq.a.installApp": "<p><strong>En résumé :</strong> il n'y a rien à télécharger dans l'App Store ou Google Play. Il suffit d'ajouter le site à l'écran d'accueil de votre téléphone ou de votre tablette. Une icône apparaît alors comme pour une application, et la carte s'ouvre en plein écran, sans la barre du navigateur. C'est gratuit et aucun compte n'est nécessaire.</p><p>Une fois installée, l'application rouvre la carte dans le dernier mode utilisé (Auto ou Piétons) et peut se centrer sur votre position à l'ouverture, si vous l'autorisez.</p><p>Sur certains navigateurs, le bouton « Installer l'application » de la carte ouvre directement la fenêtre d'installation. Sinon, voici les étapes selon votre appareil :</p><ul><li><strong>iPhone ou iPad, avec Safari :</strong> touchez le bouton Partager (le carré avec une flèche vers le haut; selon la version, il peut se trouver dans le menu « … »), puis « Sur l'écran d'accueil », et confirmez avec « Ajouter ».</li><li><strong>iPhone ou iPad, avec Chrome :</strong> touchez le bouton Partager dans la barre d'adresse, puis « Ajouter à l'écran d'accueil ».</li><li><strong>Android, avec Chrome :</strong> touchez le menu ⋮ en haut à droite, puis « Installer l'application » ou « Ajouter à l'écran d'accueil », et confirmez.</li><li><strong>Android, avec Samsung Internet :</strong> touchez le menu ☰ en bas, puis « Ajouter la page à » et « Écran d'accueil ».</li><li><strong>Android, avec Firefox :</strong> touchez le menu ⋮, puis « Installer » ou « Ajouter à l'écran d'accueil ».</li><li><strong>Android, avec Edge :</strong> touchez le menu … en bas, puis « Ajouter au téléphone » ou « Installer l'application ».</li></ul><p>Les noms des menus peuvent varier légèrement selon la version du navigateur. Pour retirer l'application, supprimez simplement son icône, comme pour toute autre application.</p>"
  ,"faq.q.arrows": "Pourquoi une flèche apparaît-elle sur certains segments?"
  ,"faq.a.arrows": "La flèche indique l'orientation de la géométrie affichée pour un segment, et non nécessairement le sens légal de circulation. Elle aide à distinguer les entraves directionnelles lorsque la source fournit une ligne. Les flèches ne sont utilisées que pour les géométries linéaires et certaines sont masquées à faible zoom ou dans les vues très denses pour garder la carte lisible."
  ,"faq.q.freshness": "À quel moment les données sont-elles mises à jour?"
  ,"faq.a.freshness": "<p><strong>À chaque ouverture ou actualisation:</strong> les flux publics en direct sont redemandés aux organismes qui les publient. Cela comprend notamment Montréal, Laval, Longueuil, le MTMD/Québec 511 et les intégrations municipales disponibles.</p><p><strong>Snapshots:</strong> certaines sources ne proposent pas un flux exploitable depuis une application statique. Leur dernière extraction est conservée dans un fichier local et affichée comme « Snapshot » dans le tableau des sources. Ces fichiers sont mis à jour régulièrement, mais ils ne sont pas rechargés automatiquement à chaque ouverture.</p><p><strong>Géométrie:</strong> les services OSRM et Overpass peuvent être utilisés pour aligner ou compléter certaines géométries. Ces résultats déterministes sont conservés dans le cache de session afin d'éviter de refaire le même calcul pendant la session; les données d'entraves, elles, restent relues lors d'une nouvelle ouverture ou actualisation.</p><p><strong>Tracés Montréal:</strong> le flux officiel des entraves de Montréal ne publie presque jamais la ligne du tronçon. Chaque impact est donc résolu hors ligne contre la géobase officielle de la Ville (chaque segment affiché est un tronçon réel de la rue, chaîné entre les intersections publiées par le permis). Quand la résolution est impossible, l'emprise de chantier officielle est affichée en pointillés et identifiée comme telle dans la fiche de détails.</p><p><strong>Limites:</strong> la fréquence de publication, les délais et les interruptions dépendent de chaque organisme. Les conditions sur le terrain et la signalisation demeurent prioritaires.</p>"
  ,"faq.q.sources": "Quelles sources sont utilisées?"
  ,"faq.a.sources": "Le tableau ci-dessous contient uniquement les sources qui contribuent actuellement à ce qui est chargé ou dessiné par la carte, ainsi que les fichiers snapshot utilisés par celle-ci. Les pages documentaires et les sources candidates du catalogue ne sont pas affichées ici tant qu'elles ne sont pas utilisées par un chargeur de la carte."
  ,"faq.a.snapshotNote": "Les snapshots sont des copies datées, pas des flux en direct. Les déclarations citoyennes et les compléments non officiels sont identifiés comme tels. Leur date de vérification n'avance qu'après un contrôle réussi; un contrôle incomplet ou en échec conserve la date précédente."
  ,"faq.a.sourceAvailability": "<strong>Vérification du 3 octobre 2026 :</strong> les cinq couches de projets de Mont-Saint-Hilaire sont de nouveau accessibles à l'extraction, mais leurs échéanciers saisonniers ne permettent pas d'en faire des entraves datées sur la carte. Le flux <a href=\"https://info-travaux.ville.repentigny.qc.ca/api/events/\" target=\"_blank\" rel=\"noopener noreferrer\">Info-travaux de Repentigny</a> échoue à établir sa connexion sécurisée depuis notre environnement de vérification; son site municipal indique toujours cette adresse et aucun remplacement n'a été confirmé. Le complément Noovo conserve sa date du 8 septembre, car l'image d'origine et certains horaires n'ont pas pu être revérifiés."
  ,"faq.q.snapshots": "Que sont les données snapshot et à quelle fréquence sont-elles mises à jour?"
  ,"faq.a.snapshots": "Les snapshots sont des copies de données conservées dans des fichiers locaux, notamment lorsqu'un service ne peut pas être chargé directement par une application statique. Ils sont actualisés séparément, pas à chaque ouverture de la carte. La colonne « Type de données » du tableau des sources les identifie. Pour les entraves, la date de vérification indique le dernier contrôle complet réussi, même si les fiches n'ont pas changé. La carte piétonne distingue la date d'assemblage et la fraîcheur de chaque source : une source en échec n'est pas déclarée à jour. Une déclaration citoyenne ou un complément Noovo n'est pas un avis municipal officiel."
  ,"faq.q.mtmd": "Pourquoi les entraves Québec 511 sont-elles attribuées au MTMD?"
  ,"faq.a.mtmd": "Les travaux routiers proviennent du GeoJSON public du ministère des Transports et de la Mobilité durable, publié sur Données Québec. Ce flux fournit les dates, la direction, les détours, le type d'entrave et la géométrie officielle des segments."
  ,"faq.q.laval": "D'où viennent les entraves de Laval?"
  ,"faq.a.laval": "Elles proviennent du service officiel Info-Travaux de la Ville de Laval, celui-là même qui alimente sa carte publique. La recherche standard de ce service ne retourne pas les tracés, mais son opération d'identification couvrant tout le territoire fournit chaque entrave avec sa géométrie officielle, ses dates, son type d'entrave, la circulation, la nature des travaux, le responsable et la référence. Les entraves de Laval s'affichent donc comme celles des autres sources, avec les mêmes couleurs, la même liste et les mêmes fiches de détails."
  ,"faq.q.abbreviations": "Que signifient les abréviations utilisées dans la carte?"
  ,"faq.a.abbreviations": "<p><strong>MTMD:</strong> ministère des Transports et de la Mobilité durable du Québec.</p><p><strong>UCI:</strong> Union Cycliste Internationale, l'organisme associé aux Championnats du monde cyclistes 2026.</p><p><strong>BIXI:</strong> réseau montréalais de vélos en libre-service.</p><p><strong>OSRM:</strong> Open Source Routing Machine, utilisé pour aligner certains axes sur le réseau routier.</p><p><strong>WFS:</strong> Web Feature Service, un service standard qui fournit des données géographiques.</p><p><strong>Open511:</strong> format et service ouvert pour publier des événements liés à la circulation.</p><p><strong>ArcGIS:</strong> plateforme de services géographiques utilisée par plusieurs organismes publics.</p><p><strong>CKAN:</strong> plateforme de catalogage et de diffusion de données ouvertes.</p>"
  ,"faq.q.coverage": "Les données couvrent-elles toutes les routes?"
  ,"faq.a.coverage": "Non. La carte dépend des entraves publiées par les organismes responsables. Une fermeture urgente, une entrave privée, un événement ponctuel ou un changement très récent peut apparaître avec un délai ou ne pas être disponible dans les flux publics."
  ,"faq.q.navigation": "La carte remplace-t-elle une application de navigation?"
  ,"faq.a.navigation": "Non. Elle sert à repérer les secteurs à risque et à comprendre la nature des entraves avant de partir. Vérifiez ensuite votre itinéraire dans votre outil de navigation habituel et respectez toujours la signalisation sur le terrain."
  ,"faq.q.continuous": "Les dates indiquent-elles une entrave continue?"
  ,"faq.a.continuous": "Pas nécessairement. La carte affiche aussi des entraves temporaires, des travaux de jour ou de nuit, des retraits de voie, des accès limités, des restrictions de stationnement et des fermetures qui ne sont actives qu'à certaines heures. Les dates indiquent la période générale pendant laquelle l'entrave peut s'appliquer; elles ne signifient pas automatiquement que la route est fermée sans interruption. Consultez le détail publié pour les horaires, la direction, les voies touchées, les détours et les exceptions."
  ,"faq.q.dayNight": "Que signifient les filtres Jour et Nuit?"
  ,"faq.a.dayNight": "Le filtre Nuit retient les entraves qui touchent la plage de 22 h à 5 h. Le filtre Jour affiche les autres entraves actives durant la journée. Une entrave continue peut être visible dans les deux catégories."
  ,"faq.q.dateFilter": "Pourquoi une entrave n'apparaît-elle pas après avoir choisi une date?"
  ,"faq.a.dateFilter": "Vérifiez d'abord la zone visible de la carte, les sources sélectionnées et le type d'impact. La liste n'affiche que les entraves qui correspondent à tous les filtres et qui se trouvent dans le cadrage actuel."
  ,"nav.stats": "Statistiques"
  ,"stats.title": "Statistiques des entraves"
  ,"stats.documentTitle": "Statistiques des entraves routières - Grand Montréal"
  ,"stats.documentTitle.general": "Statistiques des entraves routières - Grand Montréal"
  ,"stats.documentTitle.roads": "Autoroutes et routes numérotées | Statistiques des entraves routières - Grand Montréal"
  ,"stats.documentTitle.private": "Public et privé | Statistiques des entraves routières - Grand Montréal"
  ,"stats.documentTitle.territory": "Par municipalité | Statistiques des entraves routières - Grand Montréal"
  ,"stats.documentTitle.places": "Classements | Statistiques des entraves routières - Grand Montréal"
  ,"stats.documentTitle.custom": "Personnalisé | Statistiques des entraves routières - Grand Montréal"
  ,"stats.documentTitle.how": "Comment ça marche | Statistiques des entraves routières - Grand Montréal"
  ,"stats.disclaimer": "Portrait des données reçues au chargement de la page, pour toutes les sources et toute la région, peu importe le cadrage de la carte. Ce ne sont pas des données historiques : les chantiers terminés ne sont plus publiés, donc aucune tendance ni comparaison dans le temps n'est possible. Les durées sont les durées prévues publiées par les sources. Une même entrave peut être publiée par plus d'une source."
  ,"stats.loading": "Chargement des sources en cours… les chiffres se mettent à jour à mesure que les données arrivent."
  ,"stats.error": "Certaines sources principales sont indisponibles : les chiffres sont partiels."
  ,"stats.loadedAt": "Toutes les sources ont répondu — données chargées le {time}."
  ,"stats.periodFrom": "Période sélectionnée : à partir du {start}"
  ,"stats.periodDay": "Période sélectionnée : {date}"
  ,"stats.periodRange": "Période sélectionnée : du {start} au {end}"
  ,"stats.empty": "Aucune donnée pour les filtres choisis."
  ,"stats.notPublished": "Non publié"
  ,"stats.undetermined": "Indéterminée"
  ,"stats.intermunicipal": "Intermunicipal / ponts et grands axes"
  ,"stats.chartValues": "Voir les chiffres"
  ,"stats.scrollHint": "{visible} lignes visibles sur {total} : faites défiler le tableau pour voir la suite."
  ,"stats.seriesCritical": "Fermetures complètes"
  ,"stats.seriesOther": "Autres entraves"
  ,"stats.colMunicipality": "Municipalité"
  ,"stats.noMatch": "Aucune ligne ne correspond aux filtres."
  ,"stats.filterSearch": "Rechercher…"
  ,"stats.filterSearchLabel": "Rechercher dans « {title} »"
  ,"stats.filterImpact": "Types d'impact"
  ,"stats.filtersLabel": "Filtres de « {title} »"
  ,"stats.filterCount": "{shown} sur {total}"
  ,"stats.sortAscending": "Trier « {column} » en ordre croissant"
  ,"stats.sortDescending": "Trier « {column} » en ordre décroissant"
  ,"stats.sortReset": "Retirer le tri de « {column} »"
  ,"stats.filterAccount": "Pour le compte de"
  ,"stats.filterAllAccounts": "Tous les mandants"
  ,"stats.filterRouteKind": "Type de route"
  ,"stats.filterAllRoutes": "Autoroutes et routes"
  ,"stats.filterAxis": "Type d'axe"
  ,"stats.filterAllAxes": "Tous les axes"
  ,"stats.filterMunicipality": "Municipalité"
  ,"stats.filterAllMunicipalities": "Toutes les municipalités"
  ,"stats.filterSource": "Source"
  ,"stats.filterAllSources": "Toutes les sources"
  ,"stats.filterSourceType": "Type de source"
  ,"stats.filterAllSourceTypes": "Tous les types"
  ,"stats.axis.autoroute": "Autoroutes"
  ,"stats.axis.route": "Routes numérotées"
  ,"stats.axis.bridge": "Ponts"
  ,"stats.axis.tunnel": "Tunnels"
  ,"stats.axis.other": "Autres"
  ,"stats.colAxis": "Axe"
  ,"stats.colLocation": "Localisation"
  ,"stats.colResponsible": "Responsable"
  ,"stats.locationUnpublished": "Tronçon précis non publié par la Ville"
  ,"stats.locationNear": "À la hauteur de {place}"
  ,"stats.locationBetween": "Entre {from} et {to}"
  ,"stats.duplicates": "{n} entraves identiques regroupées"
  ,"stats.upperNote": "Les entraves identiques sont regroupées. Pour les autoroutes, la Ville de Montréal publie seulement le numéro de l'autoroute, sans sortie ni repère : l'arrondissement et le responsable sont alors les seules précisions disponibles."
  ,"stats.longestNote": "Entraves retenues par les filtres du panneau, de la plus longue durée prévue à la plus courte."
  ,"stats.colBorough": "Arrondissement"
  ,"stats.colDuration": "Durée prévue"
  ,"stats.kpiTotal": "entraves dans la période"
  ,"stats.kpiCritical": "fermetures complètes"
  ,"stats.kpiUpper": "sur autoroutes, ponts ou tunnels"
  ,"stats.kpiStarting": "débutent dans les 7 prochains jours"
  ,"stats.kpiKm": "de voies touchées (mesurées + estimées)"
  ,"stats.impactTitle": "Répartition par type d'impact"
  ,"stats.authorityTitle": "Responsables : public ou privé"
  ,"stats.info.authority": "Qui est responsable de l'entrave, selon ce que chaque source publie.<br><strong>Ville / municipalité</strong> : travaux faits par la municipalité elle-même.<br><strong>Entrepreneur mandaté par la Ville</strong> : entreprise privée engagée par la Ville pour des travaux municipaux.<br><strong>Entreprise privée</strong> : travaux privés pour son propre compte (ex. construction d'un immeuble).<br><strong>Réseaux techniques</strong> : Hydro-Québec, Bell, Énergir, Vidéotron, CSEM, télécoms.<br><strong>Organisme public</strong> : MTMD, STM, PJCCI, etc.<br>Le détail est publié par Montréal, Laval et Longueuil; pour les autres sources, le type est déduit de l'organisme qui publie.<br><strong>Sélecteur</strong> : « Tous » montre les trois groupes au centre et leurs types autour. En choisissant un groupe, le centre montre ses types et l'anneau extérieur leur détail : réseau (Hydro-Québec, Bell, Énergir…), entreprise, municipalité, organisme ou source. Les pourcentages sont alors calculés dans ce groupe. Au-delà de 6 détails par type, le reste est regroupé (ex. « 44 autres entreprises » : 44 entreprises de plus, dont le total d'entraves est indiqué à côté)."
  ,"stats.info.critical": "Nombre d'entraves de type « Fermeture complète » (rouge) : la rue ou la route est fermée à la circulation automobile sur le segment indiqué."
  ,"stats.info.major": "Nombre d'entraves de type « Voie touchée » (orange) : au moins une voie est fermée, mais la route reste ouverte."
  ,"stats.info.other": "Entraves « Accès limité » (jaune) et « Stationnement » (rose), si ce type est coché dans le panneau."
  ,"stats.info.impact": "Répartition des entraves retenues par les filtres du panneau selon leur impact sur la circulation automobile, avec les mêmes couleurs que la carte. Seuls les types cochés dans le panneau « Types d'impact » sont comptés."
  ,"stats.info.company": "Le type de mandat vient de la source, pas de nous. Montréal publie pour chaque permis le type de demandeur, et Longueuil un code de responsable. Les libellés en français sont les nôtres.<br><strong>Pour son propre compte</strong> : entreprise privée qui fait des travaux pour elle-même (Montréal « company », Longueuil « entrepreneur ou promoteur »).<br><strong>Mandaté par la Ville</strong> : entrepreneur privé engagé par la Ville de Montréal pour des travaux municipaux (« contractorCity »).<br><strong>Réseau technique</strong> : Hydro-Québec, Bell, Énergir, Vidéotron, CSEM et autres réseaux (« contractorRTU », « csem »).<br>Le nom de l'entreprise est celui publié; quand il manque, l'entrave est comptée sans nom."
  ,"stats.mandateTitle": "Proportion des travaux par type de mandat"
  ,"stats.colMandate": "Type de mandat"
  ,"stats.routeDirectionTitle": "Autoroutes et routes numérotées par direction"
  ,"stats.colDirection": "Direction"
  ,"stats.filterDirection": "Direction"
  ,"stats.filterAllDirections": "Toutes les directions"
  ,"stats.direction.north": "Nord"
  ,"stats.direction.south": "Sud"
  ,"stats.direction.east": "Est"
  ,"stats.direction.west": "Ouest"
  ,"stats.direction.both": "Deux directions"
  ,"stats.direction.alternating": "Une direction à la fois"
  ,"stats.direction.other": "Autre (voir l'avis)"
  ,"stats.direction.unpublished": "Non publiée"
  ,"stats.info.direction": "Direction touchée telle que publiée par la source. « Est / Ouest » signifie que les deux directions sont touchées. « Autre » : la source décrit la direction autrement (ex. « vers le centre-ville »). « Non publiée » : la source ne donne pas de direction."
  ,"stats.info.routeDirection": "Même tableau que « Autoroutes et routes numérotées », séparé par direction touchée telle que publiée par la source. « Est / Ouest » : les deux directions sont touchées. « Autre » : la source décrit la direction autrement (ex. « vers le centre-ville »). Le MTMD (Québec 511) publie une direction pour chaque chantier; la Ville de Montréal n'en publie pas pour les autoroutes de son flux, donc ces entraves sont exclues de ce tableau."
  ,"stats.info.upper": "Fermetures complètes (rouge) sur une autoroute, un pont ou un tunnel nommé, selon les filtres du panneau. Cliquez sur la source pour ouvrir l'avis officiel."
  ,"stats.info.axis": "Autoroute ou route numérotée (numéro publié ou lu dans la localisation), sinon nom du pont ou du tunnel."
  ,"stats.info.municipality": "Nombre d'entraves par municipalité, séparé par type d'impact avec les couleurs de la carte : fermeture complète (rouge), voie touchée (orange), accès limité (jaune) et stationnement (rose, si coché dans le panneau). Le graphique montre les 15 premières municipalités; « Voir les chiffres » les liste toutes. « Intermunicipal » regroupe les ponts et grands axes qui relient plusieurs villes. Les entraves du MTMD sont classées selon la municipalité nommée dans leur localisation."
  ,"stats.info.days": "Durée prévue entre la date de début et la date de fin publiées, les deux jours inclus, en années, mois et jours."
  ,"stats.info.moderate": "Nombre d'entraves de type « Accès limité » (jaune) : la circulation reste possible avec des restrictions (accès local, déviation, alternance)."
  ,"stats.info.parking": "Nombre d'entraves de type « Stationnement » (rose) : seul le stationnement est retiré. Comptées seulement si ce type est coché dans le panneau."
  ,"stats.colImpact.critical": "Fermetures"
  ,"stats.colImpact.major": "Voies touchées"
  ,"stats.colImpact.moderate": "Accès limité"
  ,"stats.colImpact.parking": "Stationnement"
  ,"stats.authorityGroup.public": "Secteur public"
  ,"stats.authorityGroup.companies": "Entreprises"
  ,"stats.authorityGroup.other": "Autres / non publié"
  ,"stats.colGroup": "Groupe"
  ,"stats.filterAll": "Tous"
  ,"stats.filterNone": "Aucun"
  ,"stats.filterSelectedCount": "{n} sélectionnés"
  ,"stats.filterCompany": "Entreprise"
  ,"stats.filterResponsible": "Responsable"
  ,"stats.directionExcluded": "{n} entraves sans direction publiée (surtout les autoroutes du flux de la Ville de Montréal) sont exclues de ce tableau."
  ,"stats.colStreetKm": "Km en entrave"
  ,"stats.info.streetKm": "Somme des longueurs des entraves de cette voie : tracés mesurés et zones allongées estimées. Deux entraves sur le même tronçon (ex. une voie et le stationnement) sont comptées deux fois. « — » : aucune longueur mesurable (points ou zones compactes). La longueur totale de la voie n'est pas affichée : elle demanderait de charger le réseau routier complet de chaque municipalité."
  ,"stats.streetExcluded": "{n} entraves ne sont pas comptées parce que leur source ne publie pas de nom de rue reconnaissable. Principales : {list}."
  ,"stats.colReceived": "Entraves reçues"
  ,"stats.receivedValue": "{total} entraves, dont {closures} fermetures complètes"
  ,"stats.info.received": "Tout ce que cette source a envoyé au chargement de la page, toutes dates et tous types d'impact confondus (entraves futures et stationnement inclus). Les colonnes suivantes donnent la longueur estimée et le détail par type d'impact. Ce total ne dépend pas des filtres du panneau."
  ,"stats.unit.yearOne": "{n} an"
  ,"stats.unit.yearOther": "{n} ans"
  ,"stats.unit.monthOne": "{n} mois"
  ,"stats.unit.monthOther": "{n} mois"
  ,"stats.unit.dayOne": "{n} jour"
  ,"stats.unit.dayOther": "{n} jours"
  ,"stats.info.filtered": "Nombre d'entraves de cette source qui correspondent aux filtres du panneau de gauche (dates, moment des travaux, types d'impact). Ce sont celles utilisées dans les statistiques."
  ,"stats.info.loaded": "Nombre total d'entraves reçues de cette source au chargement de la page, toutes dates et tous types d'impact confondus (entraves futures et stationnement inclus). Rien n'est inventé : l'écart avec la colonne précédente vient seulement des filtres."
  ,"stats.infoLabel": "Plus d'information : {title}"
  ,"stats.tabsLabel": "Sections des statistiques"
  ,"stats.tab.general": "Général"
  ,"stats.tab.roads": "Autoroutes et routes numérotées"
  ,"stats.tab.private": "Public & Privé"
  ,"stats.tab.custom": "Personnalisé"
  ,"stats.tab.places": "Classements"
  ,"stats.tab.territory": "Par municipalité"
  ,"stats.authority.city": "Ville / municipalité (en régie)"
  ,"stats.authority.cityContractor": "Entrepreneur mandaté par la Ville"
  ,"stats.authority.private": "Entreprise privée"
  ,"stats.authority.utility": "Réseaux techniques (Hydro, Bell, Énergir, CSEM…)"
  ,"stats.authority.publicOrg": "Organisme public (MTMD, STM, PJCCI…)"
  ,"stats.authority.citizen": "Citoyen (permis Montréal)"
  ,"stats.authority.event": "Événement (UCI)"
  ,"stats.authority.citizenReport": "Signalement citoyen (responsable inconnu)"
  ,"stats.authority.unknown": "Non publié"
  ,"stats.companyTitle": "Entreprises avec le plus d'entraves"
  ,"stats.companyUnnamed": "{n} entraves privées ou de réseaux techniques n'ont pas de nom d'entreprise publié."
  ,"stats.forAccount.private": "Pour son propre compte"
  ,"stats.forAccount.cityContractor": "Mandaté par la Ville"
  ,"stats.forAccount.utility": "Réseau technique"
  ,"stats.routeTitle": "Autoroutes et routes numérotées"
  ,"stats.routeNote": "Numéro publié par le MTMD, sinon lu dans le titre ou la localisation (A-xx, R-xxx, autoroute Décarie, etc.).<br><strong>Total</strong> : toutes les entraves de la route. Puis une colonne par type d'impact : fermetures (rouge), voies touchées (orange), accès limité (jaune) et stationnement (rose, si coché dans le panneau).<br>Exemple : la Ville de Montréal ne publie jamais la direction touchée sur une autoroute. Ses entraves sont comptées ici, mais pas dans le tableau par direction, qui ne garde que les entraves dont la direction est publiée."
  ,"stats.streetTitle": "Rues et routes avec le plus d'entraves"
  ,"stats.streetNote": "Nom de rue publié, regroupé par municipalité. Les autoroutes sont dans l'onglet « Autoroutes et routes numérotées »."
  ,"stats.upperTitle": "Fermetures complètes sur autoroutes, ponts et tunnels"
  ,"stats.municipalityTitle": "Par municipalité"
  ,"stats.boroughTitle": "Par arrondissement de Montréal"
  ,"stats.boroughNote": "Entraves du flux officiel de la Ville de Montréal seulement."
  ,"stats.durationTitle": "Durées prévues"
  ,"stats.durationNote": "Calculées entre les dates de début et de fin publiées. Les événements sans date de fin et les signalements citoyens sont exclus."
  ,"stats.durationMedian": "Durée prévue médiane : {n} jours ({count} entraves datées)"
  ,"stats.durationMedianOne": "Durée prévue médiane : 1 jour ({count} entraves datées)"
  ,"stats.durationOne": "{n} jour"
  ,"stats.durationRange": "{min} à {max} jours"
  ,"stats.durationOver": "Plus de {n} jours"
  ,"stats.longestTitle": "Les plus longues encore actives"
  ,"stats.lengthTitle": "Longueur de voies touchées"
  ,"stats.lengthNote": "Les tracés publiés sont mesurés. Les zones (polygones) allongées sont ESTIMÉES par la longueur de leur rectangle englobant minimal. Les zones compactes et les points n'ont pas de longueur. Les tracés superposés sont comptés chacun."
  ,"stats.lengthMeasured": "Tracés (mesurés)"
  ,"stats.lengthEstimated": "Zones allongées (estimées)"
  ,"stats.lengthNone": "Points et zones compactes (sans longueur)"
  ,"stats.upcomingTitle": "Débuts et fins de travaux prévus d'ici 7 jours"
  ,"stats.upcomingNote": "Indépendant du filtre de dates ; les filtres de moment et d'impact s'appliquent."
  ,"stats.startingTitle": "Nouveaux travaux qui débuteront d'ici 7 jours"
  ,"stats.endingTitle": "Travaux en cours qui se termineront d'ici 7 jours"
  ,"stats.sourceTitle": "Couverture par source"
  ,"stats.sourceNote": "Toutes les entraves reçues de chaque source au chargement, toutes dates confondues, sans tenir compte des filtres du panneau. Les snapshots reflètent leur date d'extraction."
  ,"stats.sourceLive": "En direct"
  ,"stats.sourceSnapshot": "Snapshot"
  ,"stats.sourceSnapshotDate": "Snapshot du {date}"
  ,"stats.sourceCurated": "Liste vérifiée intégrée"
  ,"stats.colType": "Type"
  ,"stats.colCount": "Entraves"
  ,"stats.colShare": "Part"
  ,"stats.colCritical": "Fermetures"
  ,"stats.colMajor": "Voies touchées"
  ,"stats.colOther": "Autres"
  ,"stats.colCompany": "Entreprise"
  ,"stats.colRoute": "Route"
  ,"stats.colStreet": "Rue"
  ,"stats.colClosure": "Entrave"
  ,"stats.colStart": "Début"
  ,"stats.colEnd": "Fin"
  ,"stats.colSource": "Source"
  ,"stats.colPeriod": "Période"
  ,"stats.colDays": "Jours"
  ,"stats.colGeometry": "Géométrie"
  ,"stats.colLength": "Longueur"
  ,"stats.colFiltered": "Dans vos filtres"
  ,"stats.colLoaded": "Reçues de la source"
  ,"stats.colRouteDirection": "Route et direction"
  ,"stats.longestLimited": "Les {shown} plus longues sur {total} entraves datées."
  ,"stats.dateMode.label": "Données utilisées par les statistiques"
  ,"stats.dateMode.all": "Toutes les données"
  ,"stats.dateMode.period": "Actives durant la période choisie"
  ,"stats.dateSectionTitle": "Période des données"
  ,"stats.detail.othersOf.companies": "{n} autres entreprises"
  ,"stats.detail.othersOf.networks": "{n} autres réseaux"
  ,"stats.detail.othersOf.municipalities": "{n} autres municipalités"
  ,"stats.detail.othersOf.bodies": "{n} autres organismes"
  ,"stats.detail.othersOf.sources": "{n} autres sources"
  ,"stats.dateMode.helpLabel": "À propos de l'option des entraves actives pendant la période"
  ,"stats.dateMode.help": "Avec cette option, les statistiques n'utilisent que les entraves actives pendant la période choisie dans les champs Début et Fin, avec la même règle que la carte. Les entraves déjà terminées ou qui commencent après la période sont exclues de tous les tableaux, graphiques et calculs.<br>Avec « Toutes les données », toutes les entraves reçues sont utilisées, peu importe leurs dates."
  ,"stats.scopeAll": "Toutes les données reçues, toutes dates confondues (entraves terminées et à venir comprises)"
  ,"stats.kpiTotalAll": "entraves reçues"
  ,"stats.longestTitleAll": "Les plus longues"
  ,"stats.info.roadTypes": "<strong>Autoroute</strong> : voie rapide à chaussées séparées et à accès contrôlé : on y entre et on en sort par des bretelles, sans intersection ni feu de circulation. Numéros de 1 à 99, ou de 400 et plus pour les autoroutes secondaires (ex. A-15, A-40, A-440).<br><strong>Route numérotée</strong> : route du réseau supérieur du Québec, avec des intersections, des feux et des entrées privées; elle traverse souvent les villes sous un nom de rue (ex. la R-117 est le boulevard Curé-Labelle à Laval). Numéros de 100 à 199 pour les routes nationales et de 200 à 399 pour les routes régionales."
  ,"stats.filterAuthorityGroup": "Groupe de responsables"
  ,"stats.groupShare": "{n} entraves · {share} du total"
  ,"stats.ageTitle": "Âge des chantiers"
  ,"stats.ageOngoing": "En cours seulement"
  ,"stats.colDetail": "Détail"
  ,"stats.tab.how": "Comment ça marche"
  ,"stats.how.title": "Comment les statistiques sont calculées"
  ,"stats.how.intro": "Cette page explique d'où viennent les chiffres des statistiques, comment ils sont calculés et pourquoi ils bougent. Pour les sources, leur fraîcheur, les couleurs ou les filtres de la carte, voyez la <a href=\"faq.html\">FAQ</a>."
  ,"stats.how.group.data": "Les données derrière les chiffres"
  ,"stats.how.group.method": "Comment chaque chiffre est calculé"
  ,"stats.how.group.read": "Bien lire les statistiques"
  ,"stats.how.q.source": "D'où viennent les chiffres?"
  ,"stats.how.a.source": "<p>Ils sont calculés directement dans votre navigateur, au chargement de la page, à partir des mêmes entraves que celles que la carte reçoit. Aucune base de données ni aucun serveur ne les prépare à l'avance, et aucun fichier supplémentaire n'est téléchargé pour les statistiques.</p><p>Conséquence : les statistiques montrent exactement ce que les sources publient au moment de votre visite, avec leurs forces et leurs trous.</p>"
  ,"stats.how.q.history": "Pourquoi n'y a-t-il pas d'historique ni de tendances?"
  ,"stats.how.a.history": "<p>La plupart des sources sont des flux en direct : elles publient les entraves en cours et à venir, puis retirent celles qui sont terminées. Le site ne conserve pas d'archives de ces flux.</p><p>Il est donc impossible de comparer avec l'an dernier ou de suivre une évolution dans le temps. C'est la grande différence avec les statistiques des nids-de-poule, où la Ville publie un historique complet sur plusieurs années.</p>"
  ,"stats.how.q.changes": "Pourquoi les chiffres changent-ils d'une visite à l'autre?"
  ,"stats.how.a.changes": "<p>Parce que les données changent : de nouveaux permis sont publiés, des dates sont modifiées et les travaux terminés disparaissent des flux. Deux visites à quelques heures d'intervalle peuvent donc donner des totaux différents.</p><p>Pendant que la page reste ouverte, les statistiques sont aussi recalculées toutes les 30 secondes, pour retirer les entraves qui viennent de se terminer. Pour obtenir les dernières publications des sources, actualisez la page.</p>"
  ,"stats.how.q.modes": "Quelle différence entre « Actives durant la période choisie » et « Toutes les données »?"
  ,"stats.how.a.modes": "<p><strong>Actives durant la période choisie</strong> (par défaut) : seules les entraves actives entre les dates Début et Fin du panneau sont comptées, avec la même règle que la carte. Par défaut, la période est aujourd'hui.</p><p><strong>Toutes les données</strong> : toutes les entraves reçues sont comptées, peu importe leurs dates, y compris les travaux à venir et les snapshots conservés pour des événements terminés (comme les Championnats du monde UCI). Ce mode donne un portrait plus large, mais un gros événement terminé peut alors peser beaucoup dans les résultats.</p>"
  ,"stats.how.q.duplicates": "Une même entrave peut-elle être comptée plus d'une fois?"
  ,"stats.how.a.duplicates": "<p>Oui, dans certains cas :</p><ul><li>Un même chantier peut être publié par plus d'une source (par exemple une ville et le MTMD).</li><li>Une source peut découper un seul permis en plusieurs entraves, une par tronçon ou par type d'impact (une voie fermée et le stationnement retiré au même endroit comptent alors pour deux).</li></ul><p>Les doublons évidents déjà gérés par la carte (par exemple les fermetures complémentaires aux données UCI) ne sont pas recomptés. Les autres le sont, parce qu'il est impossible de prouver de façon fiable que deux publications décrivent le même chantier.</p>"
  ,"stats.how.q.count": "Qu'est-ce qui est compté comme « une entrave »?"
  ,"stats.how.a.count": "<p>Chaque entrée publiée par une source, telle qu'elle apparaît sur la carte : un tronçon, une zone ou un point avec ses dates et son type d'impact. Ce n'est donc pas un nombre de chantiers : un grand chantier peut produire plusieurs entraves.</p><p>Le type d'impact et le moment des travaux (jour, nuit) suivent les choix du panneau de gauche.</p>"
  ,"stats.how.q.km": "Comment les kilomètres sont-ils estimés?"
  ,"stats.how.a.km": "<ul><li><strong>Tracés publiés :</strong> leur longueur est mesurée.</li><li><strong>Zones allongées :</strong> la longueur est estimée par le grand côté du plus petit rectangle qui entoure la zone, quand celle-ci est au moins trois fois plus longue que large.</li><li><strong>Zones compactes et points :</strong> aucune longueur n'est comptée.</li></ul><p>Les entraves superposées sont comptées chacune. Les kilomètres donnent donc un ordre de grandeur des voies touchées, pas une mesure exacte du réseau fermé.</p>"
  ,"stats.how.q.duration": "Comment les durées sont-elles calculées?"
  ,"stats.how.a.duration": "<p>Ce sont des durées <strong>prévues</strong> : l'écart entre les dates de début et de fin publiées, les deux jours inclus. La durée réelle peut être plus courte ou plus longue si le chantier change.</p><p>Les entraves sans date de fin et les signalements citoyens sont exclus. La durée médiane est celle du milieu : la moitié des entraves dure moins, l'autre moitié dure plus. Elle résiste mieux qu'une moyenne aux quelques chantiers de plusieurs années.</p>"
  ,"stats.how.q.age": "Comment l'âge des chantiers est-il calculé?"
  ,"stats.how.a.age": "<p>C'est le temps écoulé depuis la date de début publiée : jusqu'à aujourd'hui pour un chantier en cours, ou jusqu'à sa date de fin s'il est terminé. Les chantiers qui n'ont pas encore commencé n'ont pas d'âge et ne sont pas comptés.</p>"
  ,"stats.how.q.responsible": "Comment sait-on si des travaux sont publics ou privés?"
  ,"stats.how.a.responsible": "<p>Seulement à partir de ce que les sources publient. Montréal indique le type de demandeur de chaque permis, Longueuil un code de responsable et Laval un responsable. Pour les autres sources, le responsable est déduit de l'organisme qui publie (par exemple le MTMD).</p><p>Deux questions différentes sont distinguées : <strong>qui réalise</strong> les travaux (par exemple un entrepreneur privé) et <strong>pour le compte de qui</strong> (par exemple la Ville qui l'a mandaté). Quand la source ne permet pas de répondre, l'entrave est classée « Non déterminé » plutôt que devinée.</p>"
  ,"stats.how.q.roads": "Comment les autoroutes et les routes numérotées sont-elles reconnues?"
  ,"stats.how.a.roads": "<p>Par le numéro publié par le MTMD, sinon par un numéro lu dans le titre ou la localisation (A-15, R-117, « autoroute Décarie », etc.). La numérotation du Québec permet ensuite de distinguer autoroutes et routes numérotées.</p><p>La direction touchée n'est comptée que si la source la publie. Le MTMD la donne pour chaque chantier; la Ville de Montréal ne la donne pas pour les autoroutes de son flux.</p>"
  ,"stats.how.q.places": "Comment les municipalités, arrondissements et rues sont-ils reconnus?"
  ,"stats.how.a.places": "<ul><li><strong>Municipalité :</strong> celle de la source, ou celle nommée dans la localisation pour le MTMD. Les ponts et grands axes qui relient plusieurs villes sont regroupés sous « Intermunicipal ».</li><li><strong>Arrondissement :</strong> seul le flux officiel de la Ville de Montréal le publie.</li><li><strong>Rue :</strong> le nom publié tel quel, ou repéré dans la phrase de localisation. Les entraves dont la source ne publie aucun nom de rue reconnaissable sont exclues des classements de rues, et leur nombre est indiqué.</li></ul>"
  ,"stats.how.q.totals": "Pourquoi les totaux ne sont-ils pas toujours identiques d'une section à l'autre?"
  ,"stats.how.a.totals": "<ul><li>Certaines sections ne gardent que ce qu'elles peuvent classer : une direction publiée, un nom de rue, un nom d'entreprise, une date de fin.</li><li>Les filtres propres à une section (recherche, menus, pastilles) ne changent que cette section.</li><li>« Couverture par source » ignore volontairement les filtres du panneau.</li><li>Les pourcentages sont arrondis et leur somme peut donner 99 % ou 101 %.</li></ul>"
  ,"stats.how.q.filters": "Quels filtres du panneau s'appliquent aux statistiques?"
  ,"stats.how.a.filters": "<p>La période des données, le moment des travaux et les types d'impact s'appliquent à toutes les statistiques. En revanche, la zone affichée sur la carte, le choix des sources et la recherche de la liste ne s'appliquent pas : les statistiques couvrent toujours toute la région.</p>"
  ,"stats.how.q.coverage": "Que mesure la « Couverture par source »?"
  ,"stats.how.a.coverage": "<p>Tout ce que chaque source a envoyé au chargement, peu importe les dates et les filtres. Elle sert à voir le poids de chaque source dans les chiffres et à repérer un snapshot d'événement terminé (statut « Terminée »). Une source très détaillée pèse naturellement plus lourd qu'une source qui publie peu, sans que cela veuille dire qu'il y a plus de travaux sur son territoire.</p>"
  ,"faq.statsHelp": "Pour comprendre le calcul des statistiques des entraves, consultez la page dédiée :"
  ,"faq.statsLink": "Statistiques des entraves routières"
  ,"stats.expand": "Agrandir la section « {title} »"
  ,"stats.collapse": "Réduire la section « {title} »"
  ,"stats.cityModeBoroughTitle": "Ville de Montréal : part à contrat par arrondissement"
  ,"stats.colContractShare": "Part à contrat"
  ,"stats.info.cityModeBorough": "Pour chaque arrondissement, les travaux municipaux faits par les équipes de la Ville (en régie) et ceux confiés à un entrepreneur (à contrat), selon le flux officiel de Montréal. Le graphique montre les 6 arrondissements avec le plus de travaux municipaux; « Voir les chiffres » les liste tous."
  ,"stats.sectorCompareTitle": "Public ou privé : comparaison"
  ,"stats.colMeasure": "Mesure"
  ,"stats.compare.count": "Entraves"
  ,"stats.compare.critical": "Fermetures complètes"
  ,"stats.compare.median": "Durée prévue médiane"
  ,"stats.compare.km": "Km moyens par entrave"
  ,"stats.compare.days": "{n} j"
  ,"stats.info.sectorCompare": "Compare les travaux faits pour le secteur public et pour le secteur privé (même règle que la barre « Pour le compte de qui »). <strong>Fermetures complètes</strong> : part des entraves de ce secteur qui ferment la rue. <strong>Durée prévue médiane</strong> : entre les dates de début et de fin publiées. <strong>Km moyens</strong> : longueur estimée moyenne des entraves qui ont une longueur mesurable."
  ,"stats.publicOwnerTitle": "Travaux pour le secteur public, par organisme"
  ,"stats.colPublicOwner": "Organisme ou municipalité"
  ,"stats.filterPublicOwner": "Organisme"
  ,"stats.info.publicOwner": "Entraves faites pour le compte du secteur public, même quand c'est un entrepreneur privé qui travaille : la municipalité (en régie ou par un entrepreneur mandaté), un organisme public (MTMD, PJCCI, STM…) ou un réseau public (CSEM, Hydro-Québec). Même règle que la barre « Pour le compte de qui ». Couleurs : type d'impact, comme sur la carte."
  ,"stats.cityModeTitle": "Ville de Montréal : en régie ou à contrat"
  ,"stats.cityMode.city": "En régie (équipes de la Ville)"
  ,"stats.cityMode.cityContractor": "À contrat (entrepreneur mandaté)"
  ,"stats.colMode": "Mode"
  ,"stats.info.cityMode": "Travaux municipaux de la Ville de Montréal : faits par ses propres équipes (« en régie ») ou confiés à un entrepreneur privé. Seul le flux de Montréal publie cette distinction pour chaque permis; les autres municipalités ne la publient pas."
  ,"stats.publicLongestTitle": "Chantiers publics les plus longs"
  ,"stats.info.publicLongest": "Chantiers faits pour le secteur public, de la plus longue durée prévue à la plus courte, avec l'organisme ou la municipalité pour qui ils sont faits et la longueur estimée de l'entrave."
  ,"stats.territoryPicker": "Choix du territoire"
  ,"stats.territoryMunicipality": "Municipalité"
  ,"stats.territoryBorough": "Arrondissement"
  ,"stats.territoryAllMontreal": "Tout Montréal"
  ,"stats.territoryBoroughNote": "Seul le flux officiel de la Ville de Montréal indique l'arrondissement : les autres données montréalaises (UCI, rues piétonnes) ne sont comptées que dans « Tout Montréal »."
  ,"stats.territoryFew": "Peu d'entraves publiées pour ce territoire avec les filtres actuels : les statistiques ci-dessous sont donc limitées."
  ,"stats.detail.severalNetworks": "Plusieurs réseaux nommés"
  ,"stats.detail.unnamedNetwork": "Réseau non précisé"
  ,"stats.detail.unnamedCompany": "Entreprise non nommée"
  ,"stats.detail.others": "Autres ({n})"
  ,"stats.age.lessMonth": "Moins d'un mois"
  ,"stats.age.months1to6": "1 à 6 mois"
  ,"stats.age.months6to12": "6 à 12 mois"
  ,"stats.age.overYear": "Plus d'un an"
  ,"stats.info.age": "Temps écoulé depuis la date de début publiée de chaque chantier retenu par les filtres du panneau : jusqu'à aujourd'hui, ou jusqu'à sa date de fin s'il est déjà terminé. Les chantiers pas encore commencés et les signalements citoyens ne sont pas comptés.<br><strong>En cours seulement</strong> (coché par défaut) : ne garde dans la barre que les chantiers en cours aujourd'hui. Décochez pour inclure aussi ceux déjà terminés. Cette coche ne touche que cette barre."
  ,"stats.colStatus": "Statut"
  ,"stats.filterStatus": "Statut"
  ,"stats.status.active": "Active"
  ,"stats.status.ended": "Terminée"
  ,"stats.info.sourceStatus": "<strong>Active</strong> : source en direct, liste vérifiée ou snapshot municipal, toujours considérés comme actifs.<br><strong>Terminée</strong> : snapshot conservé pour un événement terminé (ex. Championnats du monde UCI), dont plus aucune entrave n'est en cours ni à venir. Il compte encore dans le mode « Toutes les données », mais n'affiche plus rien sur la carte. Le filtre « Statut » permet de le retirer du tableau."
  ,"stats.info.sourceKm": "Somme estimée des longueurs de toutes les entraves reçues de cette source, toutes dates confondues : tracés mesurés et zones allongées estimées. « — » : aucune longueur mesurable (points ou zones compactes)."
  ,"stats.info.sectorBy": "Qui fait concrètement les travaux, selon le responsable publié.<br><strong>Secteur public</strong> : la Ville avec ses propres équipes, ou un organisme public (MTMD, STM, PJCCI, Hydro-Québec).<br><strong>Secteur privé</strong> : une entreprise, y compris un entrepreneur engagé par la Ville, ou un citoyen. À Montréal, les permis des réseaux techniques sont déposés par l'entrepreneur qui fait les travaux : ils comptent donc comme privés ici.<br><strong>Non déterminé</strong> : responsable non publié, événements (UCI) et signalements citoyens."
  ,"stats.info.sectorFor": "Pour qui les travaux sont faits, peu importe qui les réalise.<br><strong>Secteur public</strong> : pour la Ville ou un organisme public, même si c'est un entrepreneur privé qui travaille (entrepreneur mandaté par la Ville, CSEM, Hydro-Québec).<br><strong>Secteur privé</strong> : pour une entreprise privée (Bell, Énergir, Vidéotron, promoteur…) ou un citoyen.<br><strong>Non déterminé</strong> : on ne sait pas pour qui les travaux sont faits. C'est le cas quand la source ne publie pas le responsable, pour les événements (UCI) et les signalements citoyens, et pour les travaux de réseaux techniques dont le propriétaire n'est pas nommé : la source dit seulement qu'un entrepreneur privé les fait (ex. Telecon, Lanauco), sans dire si c'est pour Bell, Hydro-Québec ou un autre réseau."
  ,"stats.info.companyTable": "Entreprises nommées par la source : entreprises privées, entrepreneurs mandatés par la Ville et réseaux techniques. Sous le nom : le type de mandat.<br><strong>Total</strong> : toutes leurs entraves selon les filtres du panneau, puis la longueur estimée et le détail par type d'impact."
  ,"stats.kpiAutoroutes": "entraves sur autoroutes"
  ,"stats.kpiRoutes": "sur routes numérotées"
  ,"stats.kpiBridges": "sur ponts, tunnels et autres grands axes"
  ,"stats.kpiUpperCritical": "fermetures complètes sur autoroutes, ponts ou tunnels"
  ,"stats.kpiDirection": "des entraves sur autoroutes et routes numérotées ont une direction publiée"
  ,"stats.roadKindTitle": "Répartition par type de voie"
  ,"stats.roadKind.autoroute": "Autoroutes"
  ,"stats.roadKind.route": "Routes numérotées"
  ,"stats.roadKind.bridge": "Ponts, tunnels et autres grands axes"
  ,"stats.roadKind.street": "Rues et routes locales"
  ,"stats.info.roadKind": "Toutes les entraves retenues par les filtres du panneau, selon le type de voie.<br><strong>Autoroutes</strong> et <strong>routes numérotées</strong> : numéro publié ou lu dans la localisation (A-xx, R-xxx).<br><strong>Ponts, tunnels et autres grands axes</strong> : pont ou tunnel nommé, ou grand axe du MTMD sans numéro.<br><strong>Rues et routes locales</strong> : tout le reste."
  ,"stats.liveOnly": "<strong>Données actuelles seulement, pas d'historique.</strong> <span class=\"stats-live-detail\">Ces statistiques portent sur ce que les sources publient en ce moment, plus les snapshots conservés (ex. UCI). Les travaux terminés que les sources ne publient plus n'y figurent pas, contrairement aux statistiques des nids-de-poule.</span>"
  ,"stats.colTotal": "Total"
  ,"stats.info.total": "Toutes les entraves de cette ligne, tous types d'impact confondus, selon les filtres du panneau."
  ,"stats.colKm": "Kilomètres d'entraves (estimé)"
  ,"stats.info.companyKm": "Somme estimée des longueurs des entraves de cette entreprise : tracés mesurés et zones allongées estimées. Deux entraves sur le même tronçon sont comptées deux fois. « — » : aucune longueur mesurable (points ou zones compactes)."
  ,"stats.routeIntro": "Toutes les entraves reçues sur chaque autoroute ou route numérotée, direction publiée ou non."
  ,"stats.upcomingIntro": "Ces deux listes ne montrent pas toutes les entraves actives. À gauche : seulement les nouveaux travaux, pas encore commencés, qui débuteront d'ici 7 jours. À droite : seulement les travaux déjà en cours dont la fin est prévue d'ici 7 jours. Une entrave déjà active qui se termine dans plus de 7 jours n'apparaît dans aucune des deux."
  ,"stats.boroughNoModerate": "Aucune entrave « Accès limité » : le flux de la Ville de Montréal ne publie pas ce type. Ses seuls types sont fermeture complète, voie retranchée (avec ou sans stationnement) et stationnement seulement."
  ,"stats.sectorTitle": "Secteur public ou privé"
  ,"stats.sectorByTitle": "Qui réalise les travaux"
  ,"stats.sectorForTitle": "Pour le compte de qui"
  ,"stats.sector.public": "Secteur public"
  ,"stats.sector.private": "Secteur privé"
  ,"stats.sector.undetermined": "Non déterminé"
  ,"stats.info.sector": "<strong>Qui réalise les travaux</strong> : public = la Ville en régie ou un organisme public (MTMD, STM, PJCCI, Hydro-Québec…) ; privé = une entreprise, y compris un entrepreneur mandaté par la Ville, ou un citoyen. À Montréal, les permis des réseaux techniques (Bell, Énergir, CSEM…) sont déposés par l'entrepreneur qui fait les travaux : ils comptent comme privés.<br><strong>Pour le compte de qui</strong> : public = travaux pour la Ville ou un organisme public, même faits par un entrepreneur privé (entrepreneur mandaté par la Ville, CSEM, Hydro-Québec) ; privé = travaux pour une entreprise privée (Bell, Énergir, Vidéotron, promoteur…) ou un citoyen.<br><strong>Non déterminé</strong> : la source ne publie pas le responsable, événements (UCI), signalements citoyens, ou réseau technique dont le propriétaire n'est pas nommé."
  ,"stats.custom.choices": "Choix des données"
  ,"stats.custom.compare": "Comparer par"
  ,"stats.custom.split": "Répartir par"
  ,"stats.custom.measure": "Mesurer"
  ,"stats.custom.noSeries": "Sans répartition"
  ,"stats.custom.style": "Style de graphique"
  ,"stats.custom.chartType.bar": "Barres"
  ,"stats.custom.chartType.pie": "Camembert"
  ,"stats.custom.chartType.doughnut": "Anneau"
  ,"stats.custom.chartType.polarArea": "Aire polaire"
  ,"stats.custom.chartType.radar": "Radar"
  ,"stats.custom.chartType.line": "Courbe comparative"
  ,"stats.custom.chartType.scatter": "Nuage de points X/Y"
  ,"stats.custom.chartType.bubble": "Bulles X/Y"
  ,"stats.custom.xAxis": "Axe X"
  ,"stats.custom.yAxis": "Axe Y"
  ,"stats.custom.xCategory": "X - Catégories"
  ,"stats.custom.yCategory": "Axe Y - catégories"
  ,"stats.custom.xMeasure": "Axe X - mesure"
  ,"stats.custom.yMeasure": "Y - Mesure"
  ,"stats.custom.leftY": "Axe Y1 - barres (gauche)"
  ,"stats.custom.rightY": "Axe Y2 - courbe (droite)"
  ,"stats.custom.categories": "Catégories"
  ,"stats.custom.categoryAxes": "Axes du radar - catégories"
  ,"stats.custom.radialValue": "Valeur radiale - mesure"
  ,"stats.custom.valueMeasure": "Valeur - mesure"
  ,"stats.custom.validLeft": "Valeurs connues Y1"
  ,"stats.custom.missingLeft": "Valeurs manquantes Y1"
  ,"stats.custom.validRight": "Valeurs connues Y2"
  ,"stats.custom.missingRight": "Valeurs manquantes Y2"
  ,"stats.custom.mixedSummary": "{count} entraves retenues · valeurs manquantes : {barMissing} pour Y1, {missing} pour Y2."
  ,"stats.custom.colorBy": "Couleur par"
  ,"stats.custom.bubbleSize": "Taille des bulles"
  ,"stats.custom.axis.length": "Longueur totale (km)"
  ,"stats.custom.axis.duration": "Durée prévue médiane (mois)"
  ,"stats.custom.axis.age": "Ancienneté médiane (mois)"
  ,"stats.custom.observations": "Groupes d'entraves"
  ,"stats.custom.group": "Groupe"
  ,"stats.custom.allRecords": "Ensemble des entraves"
  ,"stats.custom.knownAxis": "Valeurs connues ({axis})"
  ,"stats.custom.knownBubble": "Valeurs connues (taille)"
  ,"stats.custom.knownValues": "valeurs connues"
  ,"stats.custom.pointSummary": "{count} groupes traçables sur {groups} · {records} entraves · {missing} groupes sans toutes les mesures requises."
  ,"stats.custom.xyNote": "Un point par groupe choisi dans Couleur par. Les longueurs sont additionnées; durées et ancienneté sont des médianes. Chaque mesure utilise ses valeurs connues. Le tableau conserve aussi les groupes impossibles à tracer."
  ,"stats.custom.bubbleNote": "L'aire des bulles suit la mesure choisie, avec un rayon minimal pour garder les petites valeurs visibles. Les valeurs exactes restent dans le tableau."
  ,"stats.custom.includeExtremes": "Inclure les valeurs extrêmes (X et Y)"
  ,"stats.custom.xyRangeFocused": "Bornes au 95e percentile : X = {xMaximum}, Y = {yMaximum}. {shown} points dans le cadre, {outside} au-delà d'au moins une borne. Le recadrage ne modifie ni les valeurs des groupes ni le tableau."
  ,"stats.custom.xyRangeFull": "Échelles X et Y complètes : {shown} points, valeurs extrêmes incluses."
  ,"stats.custom.xyRangeUnchanged": "Échelles X et Y complètes conservées : aucun recadrage applicable à ces {shown} points."
  ,"stats.custom.fullAxis": "échelle complète"
  ,"stats.custom.lineNote": "Comparaison des catégories sélectionnées, classées par nombre d'entraves. Cette courbe n'est pas une évolution historique."
  ,"stats.custom.chartType.mixed": "Mixte : barres et courbe"
  ,"stats.custom.lineMeasure": "Mesure de la courbe"
  ,"stats.custom.radarMinimum": "Le radar nécessite au moins trois groupes avec des entraves."
  ,"stats.custom.mixedNote": "Barres : {bars}, axe gauche. Courbe : {line}, axe droit. Les catégories ne constituent pas une évolution dans le temps."
  ,"stats.custom.orientation": "Orientation"
  ,"stats.custom.orientation.horizontal": "Horizontale"
  ,"stats.custom.orientation.vertical": "Verticale"
  ,"stats.custom.arrangement": "Agencement"
  ,"stats.custom.arrangement.grouped": "Regroupé"
  ,"stats.custom.arrangement.stacked": "Empilé"
  ,"stats.custom.arrangement.percent": "100 %"
  ,"stats.custom.groups": "Groupes affichés"
  ,"stats.custom.period": "Période des données"
  ,"stats.custom.activePeriod": "Actives durant la période choisie"
  ,"stats.custom.allDates": "Toutes les données disponibles"
  ,"stats.custom.start": "Début"
  ,"stats.custom.end": "Fin"
  ,"stats.custom.time": "Moment des travaux"
  ,"stats.custom.time.day": "Jour"
  ,"stats.custom.time.night": "Nuit"
  ,"stats.custom.field.municipality": "Municipalité"
  ,"stats.custom.field.borough": "Arrondissement"
  ,"stats.custom.montrealOnly": "Montréal seulement : la comparaison par arrondissement utilise uniquement les données de Montréal. Les autres municipalités sont exclues de ce graphique."
  ,"stats.custom.field.impact": "Type d'impact"
  ,"stats.custom.field.roadKind": "Type de voie"
  ,"stats.custom.field.route": "Autoroute ou route numérotée"
  ,"stats.custom.field.street": "Rue"
  ,"stats.custom.field.authority": "Type de responsable"
  ,"stats.custom.field.organization": "Organisation"
  ,"stats.custom.field.performer": "Secteur qui réalise les travaux"
  ,"stats.custom.field.beneficiary": "Secteur bénéficiaire"
  ,"stats.custom.field.direction": "Direction publiée"
  ,"stats.custom.field.source": "Source"
  ,"stats.custom.field.status": "État selon les dates"
  ,"stats.custom.field.timePeriod": "Jour / nuit"
  ,"stats.custom.field.lengthMethod": "Méthode de mesure"
  ,"stats.custom.metric.count": "Nombre d'entraves"
  ,"stats.custom.metric.share": "Part des entraves sélectionnées"
  ,"stats.custom.metric.length": "Longueur estimée touchée"
  ,"stats.custom.metric.duration": "Durée prévue médiane"
  ,"stats.custom.metric.age": "Ancienneté médiane"
  ,"stats.custom.style.horizontal": "Barres horizontales regroupées"
  ,"stats.custom.style.vertical": "Colonnes verticales regroupées"
  ,"stats.custom.style.stacked-horizontal": "Barres horizontales empilées"
  ,"stats.custom.style.stacked-vertical": "Colonnes verticales empilées"
  ,"stats.custom.style.percent-horizontal": "Barres empilées à 100 %"
  ,"stats.custom.style.percent-vertical": "Colonnes empilées à 100 %"
  ,"stats.custom.style.pie": "Camembert"
  ,"stats.custom.style.doughnut": "Anneau"
  ,"stats.custom.value.ongoing": "En cours selon les dates"
  ,"stats.custom.value.upcoming": "À venir"
  ,"stats.custom.value.ended": "Terminée selon les dates"
  ,"stats.custom.value.day": "Jour"
  ,"stats.custom.value.night": "Nuit"
  ,"stats.custom.value.both": "Jour et nuit"
  ,"stats.custom.value.line": "Tracé mesuré"
  ,"stats.custom.value.estimated": "Zone allongée estimée"
  ,"stats.custom.unknown": "Non renseigné"
  ,"stats.custom.unknown.directionCode": "Direction non publiée"
  ,"stats.custom.unknown.organizationKey": "Organisation non précisée"
  ,"stats.custom.unknown.routeNumber": "Sans numéro de route identifié"
  ,"stats.custom.unknown.boroughKey": "Arrondissement non publié"
  ,"stats.custom.unknown.streetKey": "Voie non identifiée"
  ,"stats.custom.unknown.lengthMethod": "Longueur non mesurable"
  ,"stats.custom.search": "Rechercher"
  ,"stats.custom.keepSelection": "Afficher seulement la sélection"
  ,"stats.custom.noMatches": "Aucun choix ne correspond à cette recherche."
  ,"stats.custom.noOptions": "Aucun choix disponible pour les données retenues."
  ,"stats.custom.selectAll": "Tout sélectionner"
  ,"stats.custom.all": "Tout"
  ,"stats.custom.resizeChoices": "Ajuster la largeur des choix de données"
  ,"stats.custom.selectNone": "Tout désélectionner"
  ,"stats.custom.reset": "Réinitialiser les choix"
  ,"stats.custom.summary": "{count} entraves retenues · {missing} valeurs manquantes pour cette mesure."
  ,"stats.custom.loading": "Sources en cours de chargement."
  ,"stats.custom.coverage": "{shown} groupes affichés sur {total}, classés par nombre d'entraves."
  ,"stats.custom.otherGroups": "Autres groupes"
  ,"stats.custom.otherSeries": "Autres séries"
  ,"stats.custom.seriesCollapsed": "Les sept séries les plus fréquentes sont distinguées; les autres sont regroupées et leurs valeurs recalculées. Le tableau conserve toutes les séries."
  ,"stats.custom.otherIncluded": "Les autres groupes sont réunis dans un secteur distinct."
  ,"stats.custom.values": "Voir les données"
  ,"stats.custom.value": "Valeur"
  ,"stats.custom.records": "Entraves"
  ,"stats.custom.valid": "Valeurs connues"
  ,"stats.custom.missing": "Valeurs manquantes"
  ,"stats.custom.denominator": "Base du pourcentage"
  ,"stats.custom.days": "jours"
  ,"stats.custom.months": "mois"
  ,"stats.custom.help.title": "Comprendre les statistiques personnalisées"
  ,"stats.custom.help.about": "À propos de {label}"
  ,"stats.custom.help.close": "Fermer les explications"
  ,"stats.custom.help.choice": "Choix"
  ,"stats.custom.help.type": "Type de donnée"
  ,"stats.custom.help.definition": "Définition et interprétation"
  ,"stats.custom.help.axis.category": "Choisit les groupes à comparer : par municipalité, par impact, par source, etc. Chaque groupe rassemble les entraves qui ont cette valeur en commun. X désigne ce premier choix; les barres horizontales tournent ensuite le dessin."
  ,"stats.custom.help.axis.measure": "Choisit le chiffre calculé pour chaque groupe : effectif, pourcentage, somme ou médiane. En mode Mixte, Y1 correspond aux barres et Y2 à la courbe; chacun possède sa propre unité. Le tableau ci-dessous présente uniquement les mesures compatibles avec le graphique choisi."
  ,"stats.custom.help.axis.series": "Divise chaque groupe en sous-groupes comparables, représentés par des couleurs ou des séries distinctes. Par exemple, Municipalité en X et Type d'impact dans Répartir par comparent les impacts à l'intérieur de chaque ville."
  ,"stats.custom.help.axis.x": "Choisit la mesure calculée pour chaque groupe et sa position horizontale. Couleur par définit les groupes : Municipalité donne un point par ville. Les longueurs sont additionnées, les durées et l'ancienneté utilisent la médiane de leurs valeurs connues. X et Y sont recadrés à leur 95e percentile; Inclure les valeurs extrêmes rétablit les deux échelles. Avec moins de 20 points ou une borne inutilisable, l'axe reste complet. Les groupes non traçables restent dans le tableau."
  ,"stats.custom.help.axis.y": "Choisit la deuxième mesure calculée pour chaque groupe et sa position verticale. Elle doit être différente de X. Comme X, Y utilise les valeurs connues du groupe et peut être recadré au 95e percentile. La même case Inclure les valeurs extrêmes commande les deux axes. Une relation entre groupes ne prouve pas une relation entre les entraves individuelles ni une causalité."
  ,"stats.custom.help.axis.bubble": "Choisit une mesure calculée pour chaque groupe pour déterminer la taille de sa bulle : somme des longueurs ou médiane des durées ou de l'ancienneté. L'aire varie avec la valeur, avec un rayon minimum pour les petites valeurs. Le tableau indique aussi combien de valeurs connues ont servi au calcul."
  ,"stats.custom.help.axis.color": "Définit à la fois les groupes et leurs couleurs. Municipalité donne un seul point par ville; Source donne un point par source. Les axes et la taille des bulles sont recalculés sur les entraves de chaque groupe. Ensemble des entraves produit un point global. Les couleurs des impacts restent celles de la carte."
  ,"stats.custom.help.axis.none": "Ne crée pas de sous-groupes : les valeurs sont représentées dans une seule série."
  ,"stats.custom.help.observation.lengthMeters": "Somme des longueurs connues ou estimées de toutes les entraves du groupe, en kilomètres. Les superpositions sont comptées séparément. Une longueur absente ne contribue pas au total et ne devient pas zéro."
  ,"stats.custom.help.observation.plannedDurationDays": "Médiane des durées prévues connues dans le groupe, en mois. La moitié est en dessous et l'autre au-dessus. Additionner des travaux qui se déroulent simultanément ne donnerait pas une durée représentative. Les dates estimées, indéterminées ou de fin ouverte sont exclues."
  ,"stats.custom.help.observation.ageDays": "Médiane de l'ancienneté connue des entraves du groupe, en mois, jusqu'à aujourd'hui ou leur fin connue. Les entraves à venir n'entrent pas dans ce calcul. Les effectifs connus sont indiqués dans le tableau."
  ,"stats.custom.help.intro": "Cette page permet de construire une comparaison à partir des entraves reçues par le site. Une entrave est une restriction publiée : un même chantier peut produire plusieurs entraves. Ce n'est ni un classement de performance des villes, ni un historique complet des travaux."
  ,"stats.custom.help.stepsTitle": "Construire une comparaison"
  ,"stats.custom.help.step1": "Choisissez le type de graphique : barres, courbe, camembert, anneau, aire polaire, radar ou mixte. Les choix proposés dépendent de la mesure sélectionnée."
  ,"stats.custom.help.step2": "Choisissez d'abord X, la catégorie à comparer, puis Y, ce que vous mesurez. L'orientation horizontale tourne le dessin, sans changer le sens de vos choix. Le mode Mixte propose une mesure Y1 et une mesure Y2 distinctes."
  ,"stats.custom.help.step3": "Précisez la période, les impacts et les valeurs à garder dans les filtres. Tout coché inclut toutes les valeurs; une sélection vide n'en inclut aucune. Une recherche seule ne change pas la sélection."
  ,"stats.custom.help.step4": "Consultez les axes, la légende et Voir les données. Les valeurs manquantes et la base des pourcentages permettent de comprendre ce qui a réellement été calculé."
  ,"stats.custom.help.fieldsTitle": "Catégories disponibles"
  ,"stats.custom.help.measuresTitle": "Mesures et unités"
  ,"stats.custom.help.controlsTitle": "Comment lire les choix"
  ,"stats.custom.help.unit.count": "Nombre entier"
  ,"stats.custom.help.unit.percent": "Pourcentage"
  ,"stats.custom.help.unit.meters": "Nombre décimal, kilomètres"
  ,"stats.custom.help.unit.days": "Nombre, mois"
  ,"stats.custom.help.metric.count": "Nombre d'entraves retenues. Ce n'est pas nécessairement le nombre de chantiers uniques."
  ,"stats.custom.help.metric.share": "Part d'un groupe dans toutes les entraves retenues après les filtres. Le tableau indique le dénominateur."
  ,"stats.custom.help.metric.length": "Somme des longueurs mesurables ou estimées. Les entraves superposées sont comptées séparément. Un point ou une zone compacte ne donne pas une longueur connue."
  ,"stats.custom.help.metric.duration": "Médiane des durées prévues entre les dates retenues. La moitié des durées est en dessous, l'autre au-dessus. Ce n'est pas le temps réellement travaillé."
  ,"stats.custom.help.metric.age": "Médiane du temps écoulé depuis le début publié, jusqu'à aujourd'hui ou jusqu'à la fin connue. Les entraves à venir ne participent pas à cette médiane."
  ,"stats.custom.help.months": "Les durées sont affichées en mois, avec au maximum une décimale et sans zéro final inutile. Un mois moyen vaut 365,25 / 12 jours. Une durée positive inférieure à 0,1 mois est indiquée par <0,1, jamais par un faux zéro. Les dates et les calculs sources restent inchangés."
  ,"stats.custom.help.dates": "Une durée prévue exige un début et une fin valides, retenus comme publiés. L'ancienneté exige un début publié déjà atteint. Les dates estimées ou de provenance indéterminée ne servent pas à ces médianes; une fin ouverte, comme 2099, n'est pas convertie en durée de plusieurs décennies."
  ,"stats.custom.help.field.municipality": "Ville associée à l'entrave. Les ponts et axes reliant plusieurs villes peuvent appartenir au groupe intermunicipal."
  ,"stats.custom.help.field.borough": "Arrondissement publié par Montréal. Choisir cette catégorie limite automatiquement le graphique aux données de Montréal."
  ,"stats.custom.help.field.impact": "Effet sur la circulation : fermeture complète, voie touchée, accès limité ou stationnement. Les couleurs sont celles de la carte."
  ,"stats.custom.help.field.roadKind": "Autoroute, route numérotée, pont/tunnel/grand axe ou voie locale, selon les informations disponibles."
  ,"stats.custom.help.field.route": "Numéro identifié d'autoroute ou de route, par exemple A-40. Une rue locale sans numéro n'est pas une route numérotée manquante."
  ,"stats.custom.help.field.street": "Nom de voie reconnu dans les données. Les noms ambigus ou absents ne sont pas inventés."
  ,"stats.custom.help.field.authority": "Type d'acteur responsable : ville, organisme public, entrepreneur, entreprise, réseau technique, événement ou signalement."
  ,"stats.custom.help.field.organization": "Nom identifiable de l'entreprise, de l'organisme public ou de l'organisation responsable. Un rôle générique n'est pas traité comme un nom d'entreprise."
  ,"stats.custom.help.field.performer": "Secteur public ou privé de l'acteur qui réalise les travaux, lorsqu'il peut être déterminé."
  ,"stats.custom.help.field.beneficiary": "Secteur pour lequel les travaux sont faits. Un entrepreneur privé peut travailler pour une ville publique."
  ,"stats.custom.help.field.direction": "Sens de circulation effectivement publié. Le tracé entre deux intersections ne prouve pas une direction de circulation."
  ,"stats.custom.help.field.source": "Fournisseur des données : municipalité, MTMD, snapshot ou complément. Les fournisseurs n'ont pas tous la même couverture."
  ,"stats.custom.help.field.status": "État calculé à partir des dates : en cours, à venir, terminé ou indéterminé. Ce n'est pas une vérification sur le terrain."
  ,"stats.custom.help.field.timePeriod": "Jour, nuit ou les deux selon les données. Certaines sources ne publient pas d'horaire précis et utilisent une valeur par défaut."
  ,"stats.custom.help.field.lengthMethod": "Origine de la longueur : tracé mesuré ou zone allongée estimée. Les points et zones compactes restent non mesurables."
  ,"stats.custom.help.control.axes": "X, Y, Y1 et Y2"
  ,"stats.custom.help.controlDefinition.axes": "X est le premier choix de catégorie dans les graphiques groupés, Y la mesure. Les barres horizontales inversent les positions visuelles. Y1 et Y2 du Mixte ont chacun leur unité et leur axe."
  ,"stats.custom.help.control.filters": "Filtres, recherche et Tout"
  ,"stats.custom.help.controlDefinition.filters": "Les cases choisissent les valeurs incluses. Tout possède trois états : complet, vide et partiel. Afficher seulement la sélection garde les résultats visibles cochés d'une recherche commencée avec tout sélectionné."
  ,"stats.custom.help.control.period": "Période des données"
  ,"stats.custom.help.controlDefinition.period": "Actives durant la période choisie garde les entraves qui recoupent les dates. Toutes les données disponibles inclut aussi les entraves conservées hors de cette période; cela ne constitue pas un historique complet."
  ,"stats.custom.help.control.xy": "Nuage de points et Bulles"
  ,"stats.custom.help.controlDefinition.xy": "Chaque point représente un groupe défini par Couleur par. X, Y et la taille des bulles utilisent la somme des longueurs ou la médiane des durées ou de l'ancienneté. Les valeurs connues sont prises séparément pour chaque mesure; les effectifs sont indiqués. Un groupe sans toutes les mesures nécessaires reste dans le tableau sans être tracé. Une association visuelle ne démontre pas une causalité."
  ,"stats.custom.help.missingTitle": "Pourquoi des valeurs non renseignées ?"
  ,"stats.custom.help.missing": "Le libellé dépend du champ : une direction non publiée, une voie non identifiée et une longueur non mesurable sont des situations différentes. Le compteur de valeurs absentes concerne la mesure choisie, pas les catégories inconnues. Le groupe inconnu reste visible pour ne pas cacher une partie des entraves. Une valeur inconnue n'est jamais un zéro."
  ,"stats.custom.help.comparison": "Les autres onglets ont parfois un périmètre plus restreint : le tableau des entreprises ne garde que les entreprises nommées, celui des arrondissements uniquement le flux de Montréal, et celui des routes par direction uniquement les directions publiées. Leurs faibles nombres de valeurs absentes ne décrivent donc pas toutes les entraves reçues."
  ,"stats.custom.help.organizationFix": "La dimension Organisation inclut les organismes publics et événements nommés, en plus des entreprises identifiées. Les directions de circulation réellement non publiées restent inconnues : nous ne les déduisons pas d'une couleur ou du sens d'un tracé."
  ,"stats.custom.help.styleIntro": "Le type de graphique change la représentation, pas la signification des données. Les choix incompatibles avec une mesure sont masqués."
  ,"stats.custom.help.style.bar": "Compare les valeurs par catégorie. Horizontal convient aux noms longs; vertical montre des colonnes. Les séries peuvent être regroupées ou empilées si leurs valeurs sont additionnables."
  ,"stats.custom.help.style.line": "Relie les valeurs des catégories classées par nombre d'entraves. La ligne compare des catégories; elle ne montre pas une histoire dans le temps."
  ,"stats.custom.help.style.pie": "Montre la part de chaque catégorie dans une répartition. Une seule catégorie de regroupement, sans médiane ni deuxième série."
  ,"stats.custom.help.style.doughnut": "Même lecture qu'un camembert, avec un centre vide. Les secteurs représentent des parts d'un total."
  ,"stats.custom.help.style.polarArea": "Compare les valeurs dans des secteurs circulaires de même angle. La taille du secteur varie avec la valeur; ce n'est pas un camembert."
  ,"stats.custom.help.style.radar": "Place les catégories autour d'un cercle et représente leur valeur radialement. Au moins trois catégories, avec la même mesure sur toutes les directions."
  ,"stats.custom.help.style.mixed": "Combine des barres sur l'axe gauche et une courbe sur l'axe droit. Les deux mesures sont choisies séparément; comparer leurs hauteurs sans lire les deux échelles serait trompeur."
  ,"stats.custom.help.style.scatter": "Positionne un point par groupe selon deux mesures X/Y : somme des longueurs ou médiane des durées ou de l'ancienneté. Couleur par détermine le regroupement."
  ,"stats.custom.help.style.bubble": "Nuage de points groupés dont la taille représente une troisième mesure du groupe. Un rayon minimum rend les petites valeurs visibles; les valeurs et effectifs sont dans le tableau."
  ,"stats.custom.help.orientationIntro": "L'orientation concerne les barres. X - Catégories reste le premier choix de données; l'orientation change seulement la position des éléments sur le dessin."
  ,"stats.custom.help.orientation.horizontal": "Les catégories sont inscrites verticalement à gauche; les valeurs se lisent horizontalement. Utile pour les noms longs."
  ,"stats.custom.help.orientation.vertical": "Les catégories sont en bas et les valeurs montent verticalement. Utile pour comparer des colonnes."
  ,"stats.custom.help.arrangementIntro": "L'agencement organise plusieurs séries d'une même mesure. Les médianes ne s'additionnent pas et ne peuvent donc pas être empilées."
  ,"stats.custom.help.arrangement.grouped": "Les séries sont côte à côte pour comparer leurs valeurs directement."
  ,"stats.custom.help.arrangement.stacked": "Les séries s'additionnent dans une barre; la hauteur ou la longueur totale est la somme connue du groupe."
  ,"stats.custom.help.arrangement.percent": "Chaque groupe ayant une somme positive est ramené à 100 %. Les couleurs indiquent sa composition, pas son volume absolu."
  ,"stats.custom.help.groups": "Limite le nombre de catégories dessinées, classées par nombre d'entraves. Par exemple, 10 montre les dix municipalités les plus présentes. Le tableau garde toutes les catégories. Les graphiques circulaires regroupent le reste dans Autres groupes; ce choix n'est pas un nombre de mesures."
  ,"stats.custom.legend": "Légende"
  ,"stats.custom.sort": "Changer le sens du tri"
  ,"stats.custom.sortOriginal": "Rétablir l'ordre initial de {column}"
  ,"stats.custom.constantStatus": "État selon les dates : {status} pour toute cette sélection."
  ,"stats.custom.previous": "Page précédente"
  ,"stats.custom.next": "Page suivante"
  ,"stats.custom.page": "Page {page} sur {total}"
  ,"stats.custom.groupDenominator": "Chaque groupe dont la somme est positive totalise 100 % des valeurs connues. La base du pourcentage est indiquée dans le tableau; pour les longueurs, elle est exprimée en mètres."
  ,"stats.custom.selectionDenominator": "Pourcentages calculés sur toutes les entraves retenues après les filtres, y compris les groupes non affichés dans le graphique."
  ,"stats.custom.note.length": "Somme des tracés mesurés et des zones allongées estimées. Les superpositions sont comptées; points et zones compactes n'ont pas de longueur connue."
  ,"stats.custom.note.duration": "Durées prévues entre les dates retenues, pas des durées réellement travaillées. Les dates estimées ou d'origine indéterminée et les signalements citoyens sont exclus de cette mesure."
  ,"stats.custom.note.age": "Temps écoulé depuis le début publié, jusqu'à aujourd'hui ou à la fin connue. Les débuts futurs, estimés ou d'origine indéterminée et les signalements citoyens sont exclus de cette mesure."
  ,"stats.custom.noValues": "Aucune valeur exploitable pour ce graphique. Les effectifs restent disponibles dans le tableau."
  ,"stats.custom.chartError": "Le graphique est indisponible. Les chiffres restent accessibles ci-dessous."
  ,"stats.custom.loadError": "La vue personnalisée n'a pas pu être chargée."
  ,"stats.custom.retry": "Réessayer"
};
