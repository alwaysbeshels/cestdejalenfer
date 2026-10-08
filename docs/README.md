# Carte des entraves auto du Grand Montreal

Documentation complete du projet. Consultez aussi le [guide utilisateur des prompts Copilot](GUIDE_PROMPTS.md) ou revenez a l'[index du depot](../README.md).

L'[inventaire des données des entraves routières](INVENTAIRE_DONNEES_ENTRAVES_ROUTIERES.md) détaille les champs affichés, stockés ou reçus des sources, leurs types, les indicateurs calculés et leurs limites, hors nids-de-poule et colmatage.

Le [modèle des graphiques personnalisés](MODELE_GRAPHIQUES_PERSONNALISES.md) décrit l'onglet Personnalisé : 15 dimensions, 5 mesures agrégées, 7 familles de graphiques et 12 combinaisons. Les styles Nuage de points et Bulles ont été retirés; les durées restent affichées en mois avec au plus une décimale. Les filtres, structures de données, limites et commandes de validation y sont précisés.

Le [dossier de presse](presse/README.md) regroupe une edition francaise de huit pages, sa source HTML modifiable, les captures du site et les points a confirmer avant un envoi aux medias. Sa preparation locale ne constitue pas une publication.

Les [annonces GitHub](annonces/README.md) sont classees par date, avec une version francaise et anglaise dans chaque fichier et une proposition de versions et de tags. Elles deviennent consultables dans le depot lors de la publication autorisee qui les inclut, sans statut manuel dans leur tableau.

Les commandes et les chemins de fichiers mentionnes ci-dessous sont relatifs a la racine du projet, pas au dossier `docs/`. Les mises a jour de cette documentation doivent etre faites ici; le README a la racine reste un index.

Application statique pour visualiser les fermetures de rues, voies retranchees, autoroutes, ponts, viaducs et restrictions qui compliquent les déplacements en auto dans la region metropolitaine de Montreal, y compris Montreal, Laval, Longueuil, la Rive-Sud, la Rive-Nord et les grands axes de la grande region.

## Utilisation

La carte est une application statique. Depuis la racine du projet, démarrez le serveur local avec `python -m http.server 5500`, puis ouvrez `http://localhost:5500/index.html`. Vous pouvez aussi utiliser l'extension Live Server de VS Code en configurant son port sur `5500`. La commande standard du projet est donc `python -m http.server 5500`, et il faut tester sur `localhost:5500`, pas sur un autre port. Elle utilise Leaflet avec le fond OpenStreetMap standard et des données GeoJSON officielles.

### Application installable (PWA)

Les cartes et la FAQ partagent un manifeste et un service worker sous la racine du site, y compris depuis `/fr/` et `/en/`. Sur GitHub Pages (HTTPS) ou `localhost`, le site peut etre ajoute a l'ecran d'accueil. Cette premiere version reste **en ligne uniquement** : le service worker ne conserve ni entraves ni fond de carte, afin de ne pas afficher des informations perimees hors connexion.

Dans la PWA installee, le dernier mode Auto/Pietons est conserve localement et restaure au prochain lancement depuis l'icone. La carte demande la position au lancement et quand l'application revient au premier plan; le navigateur gere la permission a la premiere demande. En cas de refus ou d'indisponibilite, la carte reste utilisable et le bouton de localisation permet de reessayer. La position n'est pas enregistree. Un onglet de navigateur ordinaire ne declenche pas cette localisation automatique.

Pour tester sans Chrome sur Mac : installez Xcode depuis l'App Store, ouvrez Xcode > Settings > Components et installez un simulateur iOS si necessaire, puis lancez Xcode > Open Developer Tool > Simulator. Depuis le simulateur, ouvrez Safari sur `http://localhost:5500/index.html` apres avoir demarre le serveur local; utilisez Partager > Sur l'ecran d'accueil et ouvrez l'icone ajoutee. Le simulateur iOS requiert l'installation complete de Xcode; les seuls outils en ligne de commande ne suffisent pas. Testez egalement sur un vrai iPhone via l'URL HTTPS de GitHub Pages avant publication : le simulateur ne reproduit pas tous les comportements du materiel. L'application installee ne fonctionne pas hors ligne et ne remplace pas une application native App Store.

### Navigation entre les pages

Les en-tetes de la carte auto et de la FAQ affichent les icones Facebook et Instagram du site a droite du titre. Dans les statistiques des entraves, elles se trouvent sous le bouton de langue du menu gauche, meme sans titre, avec le meme ordre au clavier. Sur la page des nids-de-poule, elles precedent le lien Entraves routieres; sur petit ecran, cette navigation occupe une ligne sous le titre. Les liens ouvrent un nouvel onglet avec des libelles accessibles FR/EN; l'ouverture d'une application native depend du telephone et de ses reglages. La FAQ rassemble aussi les deux comptes dans la question sur les reseaux sociaux, separement du profil personnel de la creatrice. Leur presentation commune est dans [css/social.css](../css/social.css).

Les cartes auto, pietonne, nids-de-poule et la FAQ utilisent [un chargeur commun](../js/navigation.js) et [une transition commune](../css/navigation.css). Les routes FR/EN recuperent toujours le HTML racine et conservent une base vers la racine du projet, mais elles inserent maintenant le contenu et executent ses scripts dans l'ordre, sans reconstruire le document avec `document.write`.

Le survol ou le focus prepare la destination; un clic normal garde la page actuelle visible pendant la preparation. Un transfert HTML de session, valable 15 secondes et consomme une seule fois, evite une seconde requete du meme HTML dans la page de langue. Un rechargement explicite redemande le HTML. Seules les ressources statiques de la page sont preparees : les flux de circulation, snapshots de donnees et tuiles ne sont pas mis en cache par ce mecanisme, et le service worker reste reseau uniquement.

Les navigateurs compatibles conservent l'ancienne vue jusqu'a l'initialisation de la destination puis appliquent un fondu de 140 ms. La preference de mouvement reduit supprime le fondu; sans support des transitions, les liens restent fonctionnels. Les vues internes carte/statistiques et nids-de-poule gardent leurs gestionnaires existants. Les liens externes, ouvertures dans un nouvel onglet, telechargements, ancres et clics avec Ctrl/Cmd ne sont pas detournes. Le mode statistiques est applique avant le premier rendu pour ne pas afficher la carte transitoirement.

Les clics directs Auto vers Statistiques utilisent aussi une transition native dans le meme document. Depuis Pietons, le chargeur attend la fin du premier rendu des statistiques avant de reveler la destination. Le panneau gauche atteint sa largeur finale en une seule mise en page; son effet de retrecissement utilise une capture animee sur 160 ms, sans recalculer la grille, les tableaux et les graphiques a chaque image. Les mises a jour de contenu requises par une transition se terminent sans attendre `requestAnimationFrame`, car le navigateur peut suspendre ces callbacks pendant la capture. Le mouvement reduit conserve un changement direct sans animation.

Les routes de langue suivent la racine effective du script, y compris sous un sous-dossier de projet, et conservent les parametres et ancres au changement de langue. Validation : `node tools/validate-navigation.mjs`, sur le serveur local existant `http://localhost:5000`; definir `NAVIGATION_VALIDATION_URL` pour une autre origine. Le test couvre les clics reels, FR/EN, mobile, historique, ancres, rechargement, destination lente et absence de transition native. Safari et Firefox n'etaient pas installes lors de cette validation.

## Développement local (optionnel)

### Carte des nids-de-poule et du colmatage

Le selecteur propose quatre rubriques : Nids-de-poule, Colmatages, Comment ca marche (`?mode=how`) et Statistiques (`?mode=statistics`). Les deux dernieres sont des vues de lecture sans carte, sans filtres cartographiques ni panneau Dans la vue. Une ouverture directe ne cree pas de carte Leaflet et ne charge ni tuiles ni fichiers annuels volumineux; le Bilan utilise le catalogue, sa verification et la ventilation annuelle legere, tandis que Graphiques ajoute un fichier d'analyses agregees et Chart.js. Les filtres et le cadrage de la carte sont conserves lors des allers-retours, ainsi que la rubrique au changement FR/EN. Les liens du sommaire de la FAQ restent dans la route linguistique courante.

Comment ca marche contient une FAQ bilingue de 28 questions : sources, signalement au 311, collecte par snapshots, fraicheur, coordonnees publiques, statuts 311 et estimes, distance de comparaison, reactivation, periodes actives, colmatages historiques et manuels, et limites d'interpretation. Le sommaire suit directement la date de modification des donnees. L'ancien bandeau Corpus charge est retire : il utilisait le catalogue, pas une verification en direct de la Ville. L'exemple chronologique reste explicitement fictif. Les explications signalent la configuration actuelle des ressources 2016-2025 et la correction d'import des coordonnees 2021, qui retablit les 50 320 interventions a leurs positions WGS84 publiees; ces paragraphes doivent etre revises si la collecte evolue. La date de modification et le rayon affiche restent lus dans le catalogue. La FAQ reste lisible si celui-ci est indisponible.

La reponse sur les signalements precise qu'aucun formulaire propre a cette carte n'existe pour recevoir directement des nids-de-poule. Elle propose le [formulaire officiel](https://montreal.ca/requetes311/signaler-nid-poule/emplacement), l'[application 311 Montreal](https://montreal.ca/application-mobile-311-montreal) et le telephone 311. Un signalement ne devient pas immediatement un point ici : publication municipale, collecte et publication du site restent necessaires. La FAQ generale contient un lien bilingue vers `?mode=how` avant A propos. Son titre et son introduction occupent leur propre rangee, sans etre comprimes par les boutons de navigation; le pied de page s'empile sur mobile.

Le seuil de 25 m n'est pas modifie. Les textes publics parlent de colmatages enregistres a proximite ou dans un rayon de 25 m, pas de rapprochements. Ce seuil est un choix technique non valide sur le terrain : la [methodologie 311](https://donnees.montreal.ca/dataset/requete-311) deplace les positions au milieu d'un troncon de plus de 45 m, et la [methodologie du colmatage mecanise](https://donnees.montreal.ca/dataset/refection-de-chaussee-par-remplissage-mecanise-de-nid-de-poule) signale une precision GPS variable, parfois de quelques dizaines de metres. Un seuil de 10 m est possible, mais peut manquer davantage de travaux; 25 m peut inclure ceux d'un autre trou. Aucun des deux seuils ne confirme la reparation du trou signale.

Verification documentaire du 1er octobre 2026, sans actualisation des snapshots : recherches par mots-cles distincts colmatage, nid, manuel et chaussee dans le catalogue Montreal, puis colmatage et nids-de-poule dans Donnees Quebec (197 resultats de cette derniere recherche large, deux pages completes). Le seul jeu de colmatage trouve pour Montreal est le jeu mecanise deja utilise, egalement reference par Donnees Quebec. Sa fiche exclut explicitement les reparations manuelles et les interventions des arrondissements. Les jeux de condition des chaussees ou ruelles ne constituent pas un historique de ces reparations. Aucun jeu public donnant dates et lieux des colmatages manuels a Montreal n'a ete identifie dans ces recherches; ce constat ne prouve pas l'absence de donnees internes. La prochaine piste est une demande a l'[equipe des donnees ouvertes](https://donnees.montreal.ca/fr/nous-joindre), portant sur les positions, dates, types d'intervention et identifiants disponibles. Aucun formulaire n'a ete soumis, aucune source de remplacement n'a ete inventee et un dossier 311 termine n'est pas converti en reparation.

Statistiques separe les signalements au 311 (requetes, plaintes et commentaires) des demandes d'information, dans deux colonnes et deux indicateurs distincts. Aucun total combinant ces categories n'est affiche. Les dossiers ouverts constituent un sous-ensemble des signalements; les interventions de colmatage ont leur propre section. Les chiffres sont calcules depuis le catalogue et `data/nids-de-poule/statistiques.json`, independamment des filtres des cartes, et ne sont pas saisis dans le HTML. La ventilation est produite par l'outil de collecte a partir de la nature des demandes de chaque annee, puis validee contre les totaux et dates du catalogue avant affichage. En cas de fichier absent, incoherent ou obsolete, les statistiques sont masquees et une nouvelle tentative est proposee; les cartes et la FAQ ne sont pas bloquees. Les demandes sans coordonnees exploitables restent dans leur categorie : les chiffres ne mesurent ni des trous uniques, ni un taux de reparation, ni la performance des arrondissements. La page explique qu'une actualisation des donnees doit etre collectee puis publiee, sans flux en temps reel depuis la Ville. Les termes techniques comme snapshot sont remplaces par donnees, fichiers de donnees ou copies datees dans les textes publics de cette section.

Les bilans annuels sont suivis de cinq sections de deux tableaux, alignees sur ordinateur et empilees sur petit ecran. Chaque paire se termine par une seule ligne pleine largeur. Les classements contiennent au plus cinq resultats; les deux tableaux de colmateuses affichent cinq lignes avec defilement et en-tetes fixes pour acceder au reste.

Les douze tableaux du Bilan ont des en-tetes interactifs : ordre croissant, decroissant, puis ordre initial. Les nombres sont tries numeriquement, les dates selon leur valeur source et les noms avec la collation de la langue. Les annees, noms d'emplacements, rues et appareils disposent de selections de valeurs combinables. Les filtres conservent leur choix au changement de langue; les valeurs disparues d'une nouvelle source sont effacees. Les lignes et tableaux vides restent explicites. Ces commandes agissent seulement sur les lignes disponibles de chaque tableau, y compris les cinq resultats des classements limites, sans changer les totaux globaux ni telecharger d'autres donnees. Les icones de tri ont des infobulles et les en-tetes publient `aria-sort`.

- Emplacements : cinq plus signales et cinq avec le plus de colmatages proches apres le premier signalement.
- Rues : plus d'emplacements publics distincts et plus d'emplacements signales de nouveau apres un colmatage presume. Une reapparition exige des dates strictement successives; les colmatages associes aux emplacements revenus sont dedupliques par rue.
- Colmatages : rues avec le plus d'interventions GPS distinctes, meme sans demande 311; emplacements les plus signales sans colmatage rapproche apres leur premier signalement.
- Comparaisons : rues avec les plus anciens emplacements sans colmatage recense, puis rues classees par `colmatages / max(1, signalements localisables)` avec les deux volumes affiches. Les signalements comparables doivent appartenir a la periode des colmatages; ceux posterieurs au dernier colmatage publie ne rendent pas un emplacement artificiellement non repare.
- Colmateuses : toutes les traces par identifiant publie, y compris celles sans GPS utilisable; appareils absents du dernier fichier annuel et derniere annee d'utilisation connue. Des changements d'identifiant ne sont pas fusionnes sans preuve. Absence du fichier ne signifie ni inutilisation reelle ni mise hors service.

Les classements sont calcules dans [tools/potholes-rankings.mjs](../tools/potholes-rankings.mjs), pas dans le navigateur. Les traces GPS et les emplacements sont rapproches d'une seule rue de Montreal dans la geobase officielle complete : distance maximale 25 m, exclusion si deux identites de rue distinctes sont a moins de 3 m d'ecart de distance. RBush indexe les geometries et Turf calcule les distances. Les rues locales restent distinguees par leur nom complet, y compris Est/Ouest. La geobase actuelle ne constitue pas un historique des noms ou traces. La couverture, les exclusions, les dates des referentiels et les limites sont consultables dans la note de methode. Aucune absence de trace n'est presentee comme une preuve de non-reparation ou d'intervention due.

Les libelles generiques comme voie Non-nommee ne constituent jamais une cle de regroupement : chaque troncon garde une identite separee. Le reseau officiel MTMD RTSS fournit les numeros publics des routes et leurs traces. L'enrichissement echantillonne chaque troncon entre 5 % et 95 % de sa longueur, controle une distance maximale de 25 m, une moyenne maximale de 12 m et un ecart d'orientation maximal de 30 degres. Deux numeros candidats dont les distances moyennes different de 5 m ou moins restent ambigus. Les classes incompatibles, voies projetees et numeros techniques non publics sont rejetes. Les bretelles et voies de desserte publiees dans le RTSS peuvent contribuer au numero de leur axe; un croisement perpendiculaire ne suffit pas. Un numero deja explicite dans la geobase, dont les troncons communs comme autoroute 15-20, n'est jamais remplace par ce rapprochement. Le numero retenu et les references RTSS sont conserves pendant le calcul; les sources, empreintes, seuils et decompte des identifications sont publies dans les statistiques.

Les troncons non resolus restent dans les donnees et les totaux par appareil, mais pas dans les classements par nom de rue. Ils ne sont pas reaffectes a la rue nommee voisine. Les compteurs `colmatagesSansIdentification` et `emplacementsSansIdentification` les rendent explicites : le premier est une categorie d'exclusion distincte, le second un sous-ensemble des emplacements non attribues. Le bilan des exclusions conserve exactement le total des interventions brutes.

Le fichier statistique contient aussi les dix classements (schema de classements 2, environ 30 Ko au total actuellement). Leur provenance doit correspondre aux fichiers de signalements et de reparations du catalogue. Un classement absent, obsolete ou issu de l'ancien schema sans correction des libelles generiques affiche une erreur avec reessai sans masquer les bilans annuels. Aucun index de carte, fichier annuel volumineux ni appel geographique n'est necessaire pour afficher cette page.

La barre secondaire Bilan / Graphiques / Par Arrondissements est centree, limitee a la largeur de ses choix et situee au-dessus du titre du bilan. Les trois choix tiennent sur une ligne sur petit ecran. Le filtre de periode est centre juste dessous dans la vue Graphiques. Les deux restent fixes sous l'en-tete lors du defilement; le filtre utilise un selecteur natif accessible avec icones de calendrier et de liste. Bilan (`?mode=statistics`) reste le contenu existant par defaut; Graphiques (`?mode=statistics&tab=charts`) et Par Arrondissements (`?mode=statistics&tab=boroughs`) sont des vues independantes. Les liens conservent langue, historique precedent/suivant et cadrage. La navigation est pilotee par les liens `data-statistics-tab`, leur cible `aria-controls` et leur titre `data-statistics-heading`, afin de pouvoir ajouter d'autres vues. Aucun filtre du bilan ou des cartes n'est modifie par le choix de periode des graphiques.

Le bandeau est compact : libelle de periode et selecteur sur la meme ligne, puis deux dates de modification des fichiers, calculees separement depuis la provenance 311 et colmatages. Ces dates restent visibles au defilement. L'introduction precise une seule fois la couverture territoriale, les sources, leurs dates de derniers evenements et l'exclusion des demandes d'information. Une modification de fichier ne signifie pas qu'un nouvel evenement de colmatage a eu lieu a cette date. Le focus du selecteur utilise `preventScroll`, et le rendu conserve `scrollTop` lors d'un changement de periode, afin d'eviter un deplacement intempestif du contenu.

Les six analyses sont calculees dans [tools/potholes-analysis.mjs](../tools/potholes-analysis.mjs) et publiees dans [data/nids-de-poule/analyses.json](../data/nids-de-poule/analyses.json) (schema 4, environ 7,5 Ko). Deux periodes sont proposees : les cinq dernieres annees et tout l'historique. Le graphique annuel utilise tous les signalements disponibles pour chaque annee, sans tronquer les annees precedentes a la date courante; l'annee la plus recente est signalee comme partielle, et le chiffre principal est son total, pas un pourcentage de croissance entre periodes inegales. La persistance compte les annees distinctes par emplacement dans cinq classes : 1, 2, 3, 4, 5 ou plus. La concentration compare la moyenne de signalements par emplacement des 10 % d'emplacements les plus signales (arrondis au nombre entier superieur) a celle des emplacements restants. Le chiffre principal est le rapport entre ces deux moyennes; les effectifs, volumes et parts restent dans le tableau complementaire. Le retour apres colmatage utilise un seul premier colmatage strictement posterieur au premier signalement de la periode, avec douze mois calendaires complets de suivi. Le graphique sans colmatage demande au moins deux signalements dans la periode commune et aucun colmatage rapproche entre le tout premier signalement historique, meme anterieur a la periode choisie, et la fin des donnees de colmatage. Ses quatre groupes sont 2, 3, 4 et 5 signalements ou plus. Une absence de trace ne prouve pas l'absence d'une reparation manuelle, temporaire ou d'une solution de contournement absente de la source. La recurrence par arrondissement utilise les emplacements signales de cet arrondissement comme denominateur : 40 % veut dire 40 emplacements sur 100 signales dans plusieurs annees, pas une part de tous les trous de Montreal ni un taux de reparation. Le pourcentage est dessine au-dessus de chaque barre; une largeur minimale avec defilement interne evite les chevauchements sur petit ecran. Les rattachements multiples ou non reconnus sont exclus explicitement, et un effectif nul reste indisponible, pas un taux zero.

Le Polar Area conserve un conteneur de 300 px de hauteur. Apres placement de la legende, son diametre occupe 100 % du petit cote de la zone de trace, sans rogner le cercle ni agrandir la section. Les nombres dans les secteurs sont masques uniquement pour ce graphique; les valeurs restent dans la legende et les infobulles. Le cercle exterieur vaut `(floor(maximum / 250) + 1) * 250`, soit le prochain multiple de 250 strictement superieur au plus grand groupe, y compris lorsque ce maximum est deja un multiple de 250.

[js/potholes-charts.mjs](../js/potholes-charts.mjs) charge Chart.js 4.5.1 a la demande depuis un CDN, avec version fixe et empreinte SRI. Les graphiques sont presentes par deux au-dessus de 1000 px, puis empiles; leurs zones de trace commencent au meme niveau dans chaque paire. L'ordre est : evolution annuelle / persistance, demandes repetees sans colmatage / retours apres colmatage, signalements par emplacement / arrondissements. Les retours apres colmatage utilisent un diagramme en anneau. Les demandes repetees sans colmatage utilisent un Polar Area avec effectifs dans la legende. Sur la derniere rangee, le graphique des arrondissements occupe deux fois plus de colonnes que la comparaison des signalements par emplacement, avec des noms sur l'axe horizontal, inclines, et une couleur stable distincte par arrondissement. Un defilement horizontal local preserve les noms sur petit ecran sans debordement de la page. Les graphiques sont animes lorsqu'ils deviennent visibles ou changent de periode; `prefers-reduced-motion` desactive les animations. Chaque analyse dispose de ses chiffres en tableau HTML et d'un libelle accessible. Seuls les tableaux apportant des informations supplementaires sont visibles sous le libelle Informations complementaires : evolution annuelle, volumes de concentration et retours, effectifs par arrondissement. Les tableaux redondants de persistance et de demandes sans colmatage sont reserves aux technologies d'assistance; ils redeviennent visibles en cas d'echec de Chart.js. Les periodes manquantes restent nulles; les libelles sont espaces sur petit ecran sans retirer les barres. Les graphiques et leurs donnees ne sont pas charges dans Bilan ou les cartes.

Les reparations manuelles ne sont pas retirees par notre traitement : elles ne sont pas fournies dans ce corpus. La [methodologie officielle du jeu de colmatage mecanise](https://donnees.montreal.ca/dataset/refection-de-chaussee-par-remplissage-mecanise-de-nid-de-poule) precise que les donnees proviennent des positions GPS declenchees par les operateurs d'equipements mecanises du SIRR, ne comptabilisent pas les reparations manuelles et n'incluent pas les interventions des arrondissements. Cette limite figure dans les graphiques comparant signalements et colmatages.

La vue Graphiques revalide `analyses.json` et `index.json` toutes les 60 secondes tant qu'elle est active et que la page est visible, et au retour sur la page. Une nouvelle version coherente avec les empreintes de toutes les sources met les graphiques a jour sans rechargement. Les requetes sont annulees en quittant la vue et limitees a 20 secondes. En cas d'echec d'actualisation, les derniers chiffres restent affiches avec un avertissement et un reessai. Une premiere reponse obsolete n'est pas affichee; une panne de Chart.js laisse les tableaux accessibles. Les donnees suivent les publications du site, pas un flux municipal en temps reel.

Par Arrondissements propose les 19 territoires de Montreal, le premier de la liste par defaut (actuellement Ahuntsic-Cartierville), avec sa propre periode recente ou historique. Un arrondissement valide indique dans l'adresse reste prioritaire. Les choix sont conserves dans les parametres `borough` et `period` de l'adresse, y compris au changement de langue et au retour de navigation. Quatre indicateurs separent les signalements recus, les emplacements distincts, les emplacements signales dans plusieurs annees et ceux revenus dans les douze mois suivant un colmatage presume. Quatre graphiques montrent les volumes annuels, la persistance, les retours et la recurrence de l'arrondissement contre le reste de Montreal, en excluant le territoire choisi du second denominateur. Ces comparaisons utilisent des emplacements signales, pas l'ensemble de la voirie ni un indice de performance municipale.

Deux tableaux triables et pagines par dix lignes donnent toutes les rues identifiees avec confiance et les emplacements. Une recherche commune porte sur les noms publies. Les emplacements peuvent etre filtres : persistants, demandes repetees sans colmatage connu dans la periode comparable, retour dans les douze mois, ou tous. Un lien recentre la carte existante au zoom 18; cette ouverture explicite active toutes les annees pour rendre les emplacements historiques visibles, sans changer le choix de l'annee courante lors d'une ouverture ordinaire de la carte.

[tools/potholes-boroughs.mjs](../tools/potholes-boroughs.mjs) reutilise les regles des analyses globales et le meme terme d'observation pour les suivis de douze mois. Les demandes sans position exploitable restent dans les volumes lorsqu'un arrondissement reconnu est publie. Les demandes sans attribution reconnue sont comptees dans l'index, pas reparties arbitrairement. Un emplacement doit avoir une attribution unique; les positions ambigues sont exclues des portraits. Une rue non identifiee n'exclut pas l'emplacement de sa fiche territoriale, seulement du tableau par rue. Les traces de colmatage restent limitees au corpus mecanise central : aucune absence ne prouve qu'un arrondissement n'est pas intervenu.

La generation ajoute [data/nids-de-poule/arrondissements.json](../data/nids-de-poule/arrondissements.json), un index d'environ 6 Ko, et 19 profils sous `data/nids-de-poule/arrondissements/`, avec empreintes de contenu et provenance des sources et referentiels. [js/potholes-boroughs.mjs](../js/potholes-boroughs.mjs) charge uniquement le profil choisi et garde au maximum deux profils en cache. Il partage Chart.js avec Graphiques, sans charger de carte ni de fichiers annuels. Index et profil sont revalides toutes les 60 secondes lorsque la vue est active et visible; les changements obsoletes sont annules. Un profil perime ou invalide est masque avec reessai, sans afficher les chiffres d'un autre territoire. Une panne du CDN laisse les tableaux des graphiques lisibles.

Le choix d'un arrondissement recadre la carte sur ses positions connues dans l'index, independamment des filtres d'annees, de statut ou de recherche. Ce cadrage n'est pas un trace de frontiere administrative. Les autres filtres ne declenchent pas de nouveau recentrage. Sur ordinateur, une poignee entre « Dans la vue » et la carte permet de reduire la liste de 340 px a 220 px, sans depasser la largeur initiale; la largeur reste conservee entre les modes et la carte occupe l'espace libere. La poignee est aussi utilisable avec les fleches du clavier, Home et End. Sur petit ecran, la liste reste un panneau repliable de largeur adaptee.

L'en-tete, le selecteur de mode et les filtres occupent une barre pleine largeur en haut de l'ecran. La carte et le panneau lateral « Dans la vue » commencent sous cette barre; les resultats et les sources defilent independamment, sans masquer les filtres. La hauteur est mesuree au changement de mode, de langue ou de taille pour ajuster Leaflet en conservant son centre. Sur petit ecran, le bouton de liste ouvre uniquement les resultats sous la barre; celle-ci reste accessible. Sur les ecrans courts, son contenu peut defiler pour conserver une hauteur utile a la carte. Le bloc de synthese des signalements precedemment masque reste masque.

Le haut du panneau Dans la vue reste fixe pendant le defilement des positions et des sources. Deux rectangles affichent les volumes des points et groupes representes dans le cadrage courant : positions de nids-de-poule et signalements connus, ou interventions de colmatage et positions GPS selon le mode. Un groupe peut depasser le bord du cadrage; ses positions restent comptees comme dans la liste. Les chiffres sont recalcules au deplacement termine, au zoom et aux changements de filtres, independamment du nombre de lignes actuellement chargees dans la liste. Le bouton d'information encercle pres de Signalements connus explique le total historique des demandes 311, ouvertes ou fermees, et sa distinction avec l'annee d'activite choisie. Sa bulle FR/EN s'ouvre au clic ou au clavier et se ferme avec Echap ou un clic exterieur.

La bascule Sans colmatage dans l'historique reste dans cet en-tete, uniquement en mode Nids-de-poule. Elle retient les positions dont le nombre de colmatages historiques rapproches est exactement zero; elle exclut aussi une position actuellement active qui a deja connu un colmatage. Elle se combine avec les autres filtres et conserve son etat entre les modes et les langues. L'historique couvre les traces mecanisees dans le rayon de 25 m apres le premier signalement, pas toutes les reparations possibles : une absence ne prouve pas qu'un trou n'a jamais ete repare, notamment manuellement. Aucun snapshot n'est regenere pour ce filtre.

Jusqu'a 880 px, les filtres des deux cartes sont dans une section native repliable Filtres, fermee par defaut. Les choix eux-memes ne sont pas effaces en la fermant. Les quatre modes restent sur une seule rangee, avec des boutons compacts et des libelles pouvant occuper deux lignes. Sur ordinateur, les filtres restent ouverts et le titre repliable est masque. Le passage vers une largeur mobile referme la section; le changement de hauteur ajuste Leaflet. Le filtre d'appareil porte le libelle Appareil de colmatage, egalement utilise dans les details.

La page [potholes.html](../potholes.html), egalement disponible sous `/fr/potholes.html` et `/en/potholes.html`, est independante des cartes Auto et Pietons. Un bouton Nids-de-poule avec icone figure dans le menu de la carte routiere et dans la FAQ. La FAQ et la page des nids-de-poule utilisent le meme libelle Entraves routieres pour revenir a la carte principale; ces liens conservent la langue et le cadrage. Le selecteur Nids-de-poule / Colmatages reprend la presentation Auto/Pietons, mais change la couche et le panneau dans la meme page. Une seule couche est visible a la fois; les filtres de chaque mode et le cadrage restent conserves pendant les allers-retours. `?mode=repairs` ouvre directement les colmatages, y compris apres un changement de langue ou un rechargement.

Dans le mode Colmatages, le fichier annuel le plus recent est selectionne par defaut (2025 actuellement), avec filtres de mois et d'appareil. L'annee designe un fichier source, pas une periode d'activite : les mois sont ceux des dates effectivement presentes, meme si certaines appartiennent a une autre annee. La couverture publiee et les exclusions de coordonnees sont affichees. Les positions GPS et leurs groupes sont verts; les chiffres des groupes comptent les coordonnees distinctes. Les compteurs separent interventions et positions, avec leur propre aide. Les fiches affichent l'heure, l'appareil, les coordonnees, le nombre de passages retenus et leurs premiere/derniere dates; plusieurs interventions a une position se parcourent individuellement. Aucun statut 311, rue non publiee, itineraire ni reparation future n'est deduit. Depuis la correction d'import du 5 octobre 2026, les 50 320 colmatages de 2021 utilisent leurs coordonnees WGS84 publiees et sont cartographiables, sans points de repli.

Dans le mode Nids-de-poule, seule l'annee courante, a l'heure de Montreal, est selectionnee au demarrage et a la reinitialisation; tous les statuts administratifs 311 restent admissibles. Le filtre Annee est un multichoix : Tout reste une commande explicite, jamais le choix par defaut. Une selection vide n'affiche aucun resultat. L'annee correspond a une periode pendant laquelle la position etait active, pas a l'annee de creation d'une demande : chaque signalement ouvre ou prolonge une periode, le prochain colmatage rapproche la ferme, et un signalement ulterieur en ouvre une autre. Une periode sans fin connue continue les annees suivantes. La fin est exclusive : un colmatage a minuit le 1er janvier ne rend pas la position active dans cette nouvelle annee. Une annee entierement situee dans un intervalle inactif est exclue.

Le filtre de mois est retire. La recherche porte sur la rue, l'intersection ou l'identifiant 311; un filtre d'arrondissement et un filtre de statut actuel restent disponibles. Les positions proches sont regroupees jusqu'au zoom 16; le chiffre de chaque groupe compte les positions distinctes, jamais les demandes 311. Un clic zoome vers les positions individuelles. Les points non regroupes restent sans nombre, avec un rayon progressif non lineaire de 1 pixel au zoom 10 a 7 pixels au zoom 19. Les groupes de statuts mixtes sont neutres et leur infobulle conserve la repartition exacte; ils ne donnent pas de statut supplementaire aux positions.

Le filtre Signalements par position (total) accepte un minimum, un maximum ou les deux, bornes incluses. Une borne vide ne pose aucune limite; deux bornes identiques selectionnent un nombre exact. Il compte tous les signalements connus de chaque position publique, toutes annees confondues, avant la recherche par dossier et le regroupement. Il se combine avec les annees d'activite, le statut et l'arrondissement sans changer les donnees ni le statut actuel. Les valeurs restent conservees au changement de langue ou de mode; le bouton de remise a zero efface seulement ces deux bornes. Une plage inversee ou une valeur autre qu'un entier positif ou nul est signalee et ne conserve aucun resultat trompeur.

Dans les deux modes de carte, le diametre des groupes augmente progressivement avec leur nombre de positions distinctes, jamais avec leur total de signalements ou d'interventions. La progression logarithmique est bornee de 30 a 84 pixels pour garder les nombres lisibles et limiter l'emprise sur la carte; les couleurs et le zoom au clic sont inchanges. Les points individuels conservent leur taille liee au niveau de zoom.

Dans le mode Nids-de-poule, la couche Signalements 311 est active sans case a cocher. La reinitialisation est situee a cote de ce titre, au-dessus des filtres. Le bouton d'information pres des compteurs ouvre une courte definition de Signalements connus (dossiers historiques des positions retenues) et de Positions (coordonnees publiques distinctes). Plusieurs signalements, voire plusieurs trous, peuvent partager une position obfusquee. Les compteurs de la vue couvrent les points et groupes representes, meme lorsqu'un groupe s'etend au-dela du bord visible. L'aide se ferme au clic exterieur ou avec Echap.

Les demandes partageant un `positionId` sont regroupees, sans fusion de leurs dossiers. Chaque position possede exactement un statut actuel, independant du 311 et des annees selectionnees : **Actif** (rouge) par defaut; **Reparation presumee** (gris legerement vert, `#7a8b80`) si le dernier colmatage rapproche est strictement posterieur au dernier signalement connu; **Statut inconnu** (point blanc a contour noir) si la date du dernier signalement est inexploitable. Un nouveau signalement apres le dernier colmatage remet la position uniquement a Actif, meme lorsqu'une ancienne annee est selectionnee. Les reparations passees restent des evenements de l'historique, pas des statuts supplementaires. La selection de plusieurs periodes ou annees ne duplique pas la position. Deux dates identiques ne suffisent pas a griser un point. Le calcul porte sur tous les signalements disponibles, pas uniquement sur le dossier consulte.

La fiche affiche le nombre total de signalements, le nombre depuis le dernier colmatage rapproche, les dernieres dates de signalement et de colmatage rapproche, puis le statut du dossier 311 sur une ligne ordinaire. Le delai jusqu'au dernier statut reste distinct d'un delai de reparation. L'historique mele les signalements individuels et toutes les traces GPS valides dans le rayon configure (25 m actuellement), apres le premier signalement a cette position. Les evenements sont affiches du plus recent au plus ancien, par lots de 40; Voir la suite ajoute les evenements plus anciens sans modifier la chronologie interne des calculs. Les doubles traces identiques (date, appareil, coordonnees) sont dedupliquees. Les rapprochements ne constituent pas des confirmations de reparation d'un trou unique. Aucun itineraire, niveau de gravite ou travail futur n'est deduit.

Signalements depuis le dernier colmatage compte les demandes de toute la position dont la date de creation est posterieure ou egale au dernier colmatage connu, tous statuts 311 confondus. Un horodatage identique est inclus comme dans la chronologie d'activite existante. Sans colmatage connu, seule la mention Aucun colmatage connu est affichee, sans nombre; si les dates ne permettent pas le calcul, la fiche indique Non calculable. Ce compteur ne depend ni du dossier consulte ni des filtres de recherche ou d'annees, et ne modifie pas la pagination des dossiers selectionnes.

Inventaire local du 7 octobre 2026 :

| Corpus | Enregistrements | Limites observees |
| --- | --- | --- |
| Demandes 311, 2014-2026 | 134 516 | 21 002 demandes d'information; 90 077 demandes avec position cartographiable; 27 975 positions publiques historiques |
| Colmatage mecanise, 2016-2025 | 1 027 267 | Periodes annuelles souvent partielles; certaines dates appartiennent a une autre annee que le nom du fichier |
| Dernier fichier de colmatage, 2025 | 74 159 | Dates presentes du 18 janvier au 20 mai 2025; aucune donnee de colmatage 2026 dans ce corpus |

**Limites geographiques :** les positions 311 sont obfusquees au milieu de troncons, pas a l'emplacement exact des trous. Les informations, positions administratives et coordonnees non exploitables sont exclues des marqueurs mais leur presence reste explicite dans les compteurs et les sources. Les fichiers 311 de 2014 a 2016 ne contiennent aucune position marquee fiable par le generateur actuel. Le garde-fou de coordonnees est une enveloppe de plausibilite autour de Montreal, pas une frontiere municipale precise.

**Correction GeoPackage du 5 octobre 2026 :** le fichier officiel 2021 declare des coordonnees geographiques WGS84, sous la reference locale `srs_id: 100000` et `organization: NONE`. La conversion systematique EPSG:2950 etait une erreur de notre import, pas une anomalie municipale : elle transformait longitude `-73.70349884033203`, latitude `45.583255767822266` en longitude `-76.237951`, latitude `0.000412`. Les 50 320 points ont ete reimportes sans reprojection, compares au fichier officiel et reintegres aux rapprochements et a la chronologie. Les donnees des autres millesimes et les champs publies 311 sont restes identiques; les appariements plausibles passent de 34 236 a 34 501, sans modification du rayon de 25 m.

Le generateur lit desormais `gpkg_geometry_columns` et `gpkg_spatial_ref_sys`, verifie la reference inscrite dans chaque geometrie et refuse une reference inconnue. Les GeoPackage 2022-2025 declarent EPSG:2950 (NAD83(CSRS) / MTM zone 8) et conservent la conversion validee. Chaque snapshot importe porte `referenceSpatiale` et `versionGeometrieGeoPackage`; une ancienne version est relue meme si CKAN ne signale aucun changement. Une correction de conversion requiert `node tools/build-nids-de-poule-snapshot.mjs` pour recalculer les appariements annuels et tous les derives. `--carte-locale` ne corrige pas les snapshots annuels. Le test cible `node tools/validate-potholes.mjs --geopackage` couvre WGS84, EPSG:2950 et les references inconnues ou incoherentes; le validateur complet exige aussi zero exclusion pour le corpus 2021 corrige.

**Interpretation :** dossier ferme ne signifie pas trou repare; une trace GPS n'est pas un decompte certifie de trous; un rapprochement spatio-temporel n'est pas une confirmation officielle; aucune correspondance ne prouve pas l'absence de reparation. Les reparations manuelles ne sont pas couvertes. La comparaison « au plus tard au dernier statut » utilise la date de dernier statut, y compris pour un dossier encore ouvert. Les horodatages sans fuseau sont affiches tels que publies; les dates UTC de verification sont affichees a l'heure de Montreal.

Le generateur existant construit quatre fichiers derives : `data/nids-de-poule/carte.json` (positions, references compactes des dossiers, dates extremes, dernier colmatage et `periodesActives`), `historique-colmatages.json` (evenements rapproches), `statistiques.json` (ventilation annuelle et classements) et `analyses.json` (six analyses et leurs periodes). Les periodes actives utilisent toutes les dates de signalements et de colmatages rapproches; le dernier colmatage seul ne suffit pas a retrouver les interruptions historiques. Installer les dependances de developpement avec `npm install`, puis lancer `npm run snapshot:potholes:map` pour recompiler les fichiers locaux. Le premier lancement telecharge la geobase en pages triees de 30 000 troncons et le RTSS regional dans une reponse bornee a 20 000 elements; les totaux annonces et l'absence de doublons sont controles, sinon la generation echoue. Le service RTSS ne supporte pas le tri serveur demande par la geobase : ses resultats sont tries localement. Les caches `tools/cache-nids-de-poule/rues-statistiques.json` (schema 2) et `rtss-statistiques.json` (schema 1) permettent ensuite le calcul sans reseau. `npm run snapshot:potholes:map -- --actualiser-rues` renouvelle les deux referentiels; `--actualiser-rtss` renouvelle seulement le reseau provincial. Une compilation identique ne reecrit pas les fichiers derives et ne fait pas avancer la date de verification des sources. Les fichiers de carte et de bilan portent une version commune derivee du catalogue et du schema de carte (version 2); les analyses ont leur propre empreinte de contenu et la meme provenance des sources. Le worker refuse une carte ou un detail de dossier obsolete.

Le Web Worker charge a la demande l'index compact des nids-de-poule, puis l'historique des colmatages a la premiere fiche et le fichier annuel du dossier consulte. Deux fichiers de dossiers 311 au maximum restent dans son cache. Le mode Colmatages dispose de son propre index et d'un seul fichier annuel d'interventions en cache; il ne charge pas l'index des nids-de-poule lors d'une ouverture directe. Les requetes annuelles obsoletees sont annulees et les reponses d'anciens filtres ignorees. Un echec de colmatage ne desactive pas le mode Nids-de-poule. Les filtres ne changent pas la chronologie globale servant au statut actuel. Supercluster 8.0.1, charge depuis un CDN avec version fixe, indexe les positions dans le worker. Les groupes et points de la vue sont transmis au fil principal; les marqueurs communs sont conserves au deplacement. La page reutilise Leaflet 1.9.4, OpenStreetMap et Lucide 0.468.0 et reste en ligne uniquement. Les routes FR/EN revalident le HTML commun a chaque ouverture pour eviter une ancienne interface en cache.

Le catalogue, la verification et le bilan statistique sont relus sans cache HTTP (`no-store`). Les URL des fichiers charges par le Worker portent la revision attendue : date de contenu du catalogue pour la carte, date annuelle pour les dossiers et colmatages, version de carte pour l'historique. Cela evite qu'une reponse HTTP 304 fondee sur une ancienne date systeme conserve une carte perimee et provoque `Report index is stale` au clic sur un dossier actualise. Les controles d'identite, de dates et de version restent actifs; aucun snapshot n'est modifie pour contourner ces controles.

Les positions actives sont affichees en rouge vif `#ff1744`; les chiffres des groupes rouges sont fonces pour rester lisibles. Les autres statuts et leurs couleurs ne changent pas. Le validateur navigateur ouvre aussi de vraies fiches par clic Canvas en FR/EN, verifie leurs donnees et leur historique, les revisions demandees et les pixels du rouge actif.

Validation des regles, des snapshots et des index derives : `npm run test:potholes` (ou `node tools/validate-potholes.mjs`). Elle controle notamment la reactivation apres colmatage, l'unicite du statut actuel, les annees actives sans nouvelle demande, les interruptions completes, la borne du 1er janvier, la chronologie, la selection vide et les rayons aux differents zooms. Aucun acces aux API municipales n'est necessaire. Pour la validation interactive, servir le depot puis ouvrir `http://localhost:5500/fr/potholes.html` ou `http://localhost:5500/en/potholes.html`; verifier annee courante par defaut, multichoix d'annees d'activite, taille des points, details, langues, petit ecran et echecs de chargement avant publication.

Les tests verifient aussi les intersections ambigues, les doublons GPS, les periodes comparables, les classements d'emplacements, les totaux par appareil et la derniere utilisation contre les fichiers annuels. Avec le serveur local sur le port 5500 et Chromium installe pour Playwright (`npx playwright install chromium` si necessaire), `npm run test:potholes -- --browser` controle les dix tableaux en FR/EN a six largeurs, les cinq lignes visibles, le defilement jusqu'au dernier appareil, les en-tetes fixes, les listes vides et la reprise apres donnees manquantes ou perimees.

Cette commande teste egalement les six graphiques : periodes et chiffres verifies contre les fichiers sources, rendu Canvas non vide, absence de chevauchement des annees, navigation et FR/EN, mouvement reduit, actualisation simulee sans rechargement, erreurs reseau/CDN, donnees perimees et conservation des chiffres lors d'une panne d'actualisation.

Les tests couvrent les nouveaux tris a trois etats, les filtres combines, les resultats vides, la restauration et le changement de langue. Ils verifient aussi le repli des filtres des deux cartes, leur commande au clavier, le passage mobile/ordinateur, les quatre modes sur une ligne, ainsi que le titre de la FAQ generale de 320 a 1440 px, son lien bilingue vers Comment ca marche, l'ordre du sommaire et les liens de signalement.

Les 19 profils d'arrondissement sont controles contre les demandes sources, les emplacements de la carte, leurs historiques de colmatage et les denominateurs de la ville. Les tests navigateur couvrent aussi les quatre graphiques locaux aux largeurs 320, 768 et 1440 px, les deux langues, le chargement differe, les indicateurs, tris, recherches, filtres, pagination, historique, actualisation, refus d'un profil perime, reessai et ouverture effective d'un emplacement sur la carte.

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

### Marathon Beneva 2026

La carte automobile charge [l'export Waze fourni](../data/Marathon-Beneva-Mtl-2026.json) : 88 fermetures directionnelles du 10 octobre sur 76 segments et 11 voies, conservees sans modification. Le meme fichier ajoute maintenant 69 groupes routiers issus du PDF officiel rapproche des parcours RTRT : 15 le samedi 10 et 54 le dimanche 11 octobre. Les horaires Waze et PDF restent distincts, avec leur provenance dans les popups.

`officialCourseReference` conserve les six parcours geographiques et les jours/departs de course publies. `officialClosureReference` contient les 20 plages horaires du PDF, les portions verifiees, les references des objets PDF et les indices des coordonnees RTRT utilisees. Trois groupes de chemins sont integres au snapshot pieton consolide, sans y recopier les fermetures automobiles. Le sens de course n'est jamais affiche comme sens de circulation automobile.

L'[analyse detaillee du marathon](ANALYSE_MARATHON_BENEVA_2026.md) donne les horaires, la methode et les limites : 297 aretes du parcours restent exclues, faute d'identification de voie ou de rattachement horaire suffisamment sur. Selon la clarification de l'utilisatrice, le 9 octobre est une exposition interieure sans fermeture a ajouter; ce n'est plus une question en attente. Les interdictions de stationnement restent distinctes des fermetures routieres. Aucune fermeture generale du parc ou du jardin n'est deduite. Les autres sources pietonnes et leurs dates de verification restent inchangees.

Regeneration locale : `node tools/build-marathon-closures.mjs`, puis `node tools/build-pedestrian-snapshot.mjs --marathon-only`. Le premier recharge le PDF et OSM, utilise PyMuPDF et la geobase locale existante, et synchronise le catalogue. Ces outils ne sont pas des dependances de production.

Validation locale : `node tools/validate-marathon.mjs`, avec le serveur sur `http://localhost:5000` ou `MARATHON_VALIDATION_URL` pour une autre origine. Le filtre de dates commun inclut maintenant toute la journee choisie, y compris les fermetures se terminant avant midi.

### Statistiques

Le bouton Statistiques, a cote de Auto / Pietons, remplace la carte par un tableau de bord dans la meme page (`index.html?view=stats`, aussi `/fr/?view=stats` et `/en/?view=stats`). Le lien Auto revient a la carte sans recharger les donnees. `js/stats.js` calcule tout dans le navigateur a partir de `allClosures` deja charge par `js/app.js` : aucun snapshot ni appel supplementaire.

Les statistiques couvrent toutes les sources chargees et toute la region, peu importe le cadrage de la carte. Seuls les filtres Dates, Moment des travaux et Type d'impact s'appliquent; la recherche et le filtre Responsable / Source sont masques et ignores. Ce n'est pas un historique : les chantiers termines ne sont plus publies, donc aucune tendance n'est calculee. Les durees sont les durees prevues publiees.

Indicateurs : repartition par impact; types de responsables (champ `siteAuthority` de Montreal, domaine officiel `RESPONSABLE` de Longueuil, libelle Laval, sinon organisme publiant); entreprises (nom publie, surtout Montreal et Longueuil); autoroutes et routes numerotees (`routeAutoroute` MTMD, numero nu de la geobase Montreal, sinon `A-xx`/`R-xxx` en debut de localisation, hors voies de desserte); rues; fermetures completes sur autoroutes, ponts et tunnels; municipalites et arrondissements; durees prevues (sans les evenements MTMD sans fin ni les signalements citoyens); 7 prochains jours (independant du filtre de dates); couverture par source. Les kilometres sont mesures sur les traces publies et estimes pour les zones allongees (rectangle englobant minimal, rapport longueur/largeur d'au moins 3); les points et zones compactes n'ont pas de longueur.

Les graphiques (impact, municipalites, arrondissements, durees) utilisent Chart.js 4.5.1 charge a la demande depuis jsDelivr avec le meme hash SRI et le meme style que les statistiques nids-de-poule. Chaque graphique a un resume lisible par lecteur d'ecran et un tableau « Voir les chiffres »; si Chart.js ne se charge pas, ces tableaux s'ouvrent a la place. Les tableaux affichent au plus 10 lignes, puis une barre de defilement visible et une indication du nombre total de lignes.

La vue a quatre onglets (`?view=stats&tab=roads|private|places`, General par defaut) : General, Autoroutes et routes numerotees, Secteur prive, Municipalites et arrondissements. Les cartes sont placees dans deux colonnes independantes (chaque carte va sous la colonne la plus courte). Un bouton « i » sur les cartes et certaines colonnes ouvre une definition accessible au clavier (Echap la ferme).

Chaque en-tete de colonne se trie (croissant ou decroissant), avec la fleche toujours a cote du titre; l'ordre par defaut de chaque tableau est indique par sa fleche des le chargement. Les menus de filtre sont a choix multiples avec une case « Tous » a trois etats (tout, aucun, partiel). Les bulles « i » s'ouvrent au survol avec une souris et au toucher sur mobile, au-dessus du bouton. En mode statistiques sur ordinateur, les trois filtres du panneau sont ouverts (etat precedent restaure en revenant a la carte), et un popup de chargement s'affiche comme sur la carte. Certaines cartes ont leurs propres filtres, qui ne touchent que cette carte : recherche texte, types d'impact (pastilles : un premier clic ne garde que ce type, les clics suivants ajoutent ou retirent, le dernier type retire reaffiche tout), mandat des entreprises, type de route, direction, municipalite des rues, type d'axe et source des fermetures du reseau superieur, type de source. Les colonnes Source ouvrent l'avis (`sourceUrl`), comme les popups de la carte. Les filtres et tris sont conserves lors des mises a jour des donnees et du changement de langue. Le tableau des fermetures sur autoroutes, ponts et tunnels regroupe les entraves identiques; pour les autoroutes de Montreal, la Ville ne publie que le numero (« 13, entre 13 et 13 »), donc la localisation affichee indique que le troncon precis n'est pas publie, avec l'arrondissement et le responsable.

Les tableaux par source, entreprise, rue, municipalite et arrondissement ont une colonne Total juste apres la premiere colonne (puis les kilometres estimes pour sources, entreprises et rues), puis une colonne par type d'impact (les quatre, meme a zero); dans les tableaux en demi-largeur, ces colonnes ont pour en-tete la pastille de couleur de la carte (libelle complet pour les lecteurs d'ecran). La couverture par source a une colonne Statut (« Active » si au moins une entrave est en cours ou a venir, sinon « Terminee », ex. snapshot UCI) filtrable. Le tableau des plus longues affiche 5 lignes visibles. L'onglet Autoroutes commence par des chiffres cles et une barre de repartition par type de voie. Survoler une entree de legende des graphiques en anneau fait ressortir la portion correspondante. En mode statistiques, la section Dates du panneau propose « Toutes les donnees » (defaut : aucun filtre de dates, snapshots d'evenements termines compris; `statsAllDates` dans js/app.js) ou « Actives pendant la periode » (meme regle que la carte, `?dates=period`). Seuls les snapshots d'evenement (UCI, Noovo) peuvent avoir le statut « Terminee ». Le graphique des responsables a un selecteur Tous / Secteur public / Entreprises / Autres qui affiche les sous-types du groupe choisi. L'onglet General a une barre « Age des chantiers » (coche « En cours seulement », cochee par defaut).

Onglets : General, Autoroutes et routes numerotees, Public & Prive (barres public/prive, travaux pour le secteur public par organisme, Ville de Montreal en regie ou a contrat, chantiers publics les plus longs, responsables, mandats, entreprises), Par municipalite (menus Municipalite puis, pour Montreal, Arrondissement, places dans la bande collante des onglets comme pour les nids-de-poule; `?territory=` et `?borough=`), Comparaison des territoires (renomme « Classements »), puis « Comment ca marche » (`?tab=how`, toujours en dernier : questions-reponses repliables sur le calcul des statistiques, sans repeter la FAQ; pas de periode ni de statut de chargement, le HTML ne depend pas des donnees pour que les questions ouvertes le restent). La FAQ y renvoie sous le lien des nids-de-poule (`#statsHowFaqLink`, mis a jour par `js/faq.js` selon la langue). Public & Prive inclut aussi « part a contrat par arrondissement » (Montreal) et « Public ou prive : comparaison » (fermetures, duree mediane, km moyens) sous les mandats. Pendant le chargement, la vue des statistiques se recalcule au plus toutes les 700 ms et Chart.js est precharge des l'ouverture. Quand deux colonnes sont cote a cote, le dernier graphique de la colonne la plus courte s'allonge (jusqu'a +60 %) pour que les deux bas s'alignent (`balanceColumns`). Les sections avec « Voir les chiffres » ou un tableau d'au moins 20 lignes ont un bouton d'agrandissement en haut a droite : la carte s'anime en grand panneau par-dessus la page (animation FLIP par `transform` seulement, graphiques redessines avant l'animation; voile, Echap ou clic a l'exterieur pour fermer, focus garde dans le panneau), « Voir les chiffres » s'ouvre, les tableaux gardent 10 lignes visibles avec defilement dans le tableau (sauf les sections faites seulement de tableaux : le tableau prend toute la hauteur du panneau, en-tete et filtres restant visibles), et sur grand ecran le graphique (puis au besoin le tableau) se reduit pour que le panneau tienne sans defilement. A la fermeture, la carte reprend d'abord sa place dans la page, puis seule une transformation est animee. Sur grand ecran, un graphique avec « Voir les chiffres » s'affiche a gauche et ses chiffres a droite; un graphique a barres ne descend jamais sous 22 px par etiquette. Dans « Responsables », les lignes « N autres entreprises » sont detaillees une par une dans « Voir les chiffres » en mode agrandi seulement (`data-only` sur les lignes). En statistiques, la section du panneau s'appelle « Periode des donnees » et le mode par defaut est « Actives durant la periode choisie » (aujourd'hui); `?dates=all` donne toutes les donnees. Les deux tableaux de routes passent en pleine largeur quand la zone fait moins de 1000 px, pour garder leurs titres en texte. En choisissant un groupe de responsables, l'anneau exterieur detaille les sous-types (reseau, entreprise, municipalite, organisme ou source; 6 details par type, le reste dans « Autres »). Le tableau des plus longues est limite aux 200 premieres lignes pour garder le changement de filtre fluide; la longueur des geometries est mise en cache et la recherche de la fermeture complementaire UCI (js/app.js) ne se fait plus pour chaque entrave. Sur les trois pages, la date de debut ne peut pas etre avant aujourd'hui et la date de fin pas avant le debut (`enforceDateBounds` dans js/app.js). Le flux de Montreal ne publie pas de type « Acces limite » (types `blocked`, `trafficLane`, `trafficLaneAndParkingLane`, `parkingLane`), d'ou une note dans la carte des arrondissements. L'onglet Secteur prive commence par deux barres : qui realise les travaux (public / prive) et pour le compte de qui (un entrepreneur mandate par la Ville travaille pour le public; CSEM et Hydro-Quebec sont publics; Bell, Energir, Videotron prives; proprietaire non nomme = non determine). Le graphique des responsables (70 %) a sa legende en liste a cote, et partage la ligne avec celui des mandats (30 %).

Directions : le champ `direction` du flux MTMD (« Ouest », « Sud et nord », « Dans une direction a la fois ») est conserve tel que publie par `cleanQuebec511Direction`; auparavant, seul le texte « En direction X » etait reconnu et les chantiers MTMD affichaient « Direction non precisee ». Le flux de Montreal ne publie aucune direction pour ses autoroutes.

Mobile (880 px et moins) : `.stats-card` a une colonne `minmax(0, 1fr)`, sinon un tableau large de « Voir les chiffres » elargissait la carte et son graphique. Les filtres d'une section s'empilent pleine largeur sous le titre. Les tableaux a largeurs fixes (plus longues, fermetures sur autoroutes, chantiers publics) passent en mise en page automatique pour que les colonnes ne se chevauchent pas; les dates se coupent avant l'annee (`dateLabel`).

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

### Snapshots routiers : actualisation du 7 octobre 2026

Exécution du prompt d'actualisation à partir d'une copie de comparaison conservée hors dépôt à `2026-10-07T21:35:08.746Z`. Les données de nids-de-poule et de colmatage sont exclues. Aucun commit, push, déploiement, ajout de dépendance ou changement d'interface. Le serveur existant sur <http://localhost:5500/index.html> est réutilisé. Les réponses de revue, sondes et captures restent hors dépôt.

#### Bilan des onze snapshots

Toutes les heures du 7 octobre ci-dessous sont en UTC (`Z`); Montréal est à UTC moins quatre heures. Une vérification sans changement avance seulement `extractedAt`, pas les dates des travaux ni la provenance géographique. Pour les sources incomplètement vérifiées, la date antérieure est conservée.

| Snapshot / source publique | État | Dernière vérification réussie ou date conservée | Reçus / retenus et exclusions | Géométries |
| --- | --- | --- | --- | --- |
| [Mont-Royal](https://montroyal.opatech.ca/#/public?city=montroyal&entraves=true&closing=true&detours=true&lang=fr) | Modifié | `2026-10-07T21:35:43.575Z` | 13 projets / 13; 2 ajouts, 11 identiques, 2 anciennes fiches absentes de la réponse; aucune exclusion dans la réponse reçue | 9 LineString, 4 MultiLineString |
| [Avis piétons Montréal](https://montreal.ca/entraves-travaux/entraves) | Modifié | `2026-10-07T21:37:00.749Z` | 206 pages, 2 058 résultats / 1 013 avis; 1 doublon identique, filtrage dates/zones; 208 ajouts, 3 modifications, 174 retraits, 802 identiques | Attributs et libellés, sans géométrie propre |
| [Géométries Montréal](https://donnees.montreal.ca/dataset/info-travaux) | Modifié | `2026-10-07T21:38:19.327Z` | 1 735 permis / 2 021 impacts; 418 ajouts, 204 anciens identifiants absents, 1 603 fiches identiques | 1 741 LineString, 3 MultiLineString, 277 emprises Polygon |
| [UCI Montréal](https://services.montreal.ca/cartes/uci) | Vérifié sans changement | `2026-10-07T21:39:08.753Z` | 5 305 restrictions et 17 parcours / tous conservés selon la politique d'événement complet; aucun objet sans date | 5 322 LineString |
| [Rues piétonnisées Montréal](https://donnees.montreal.ca/api/3/action/datastore_search?resource_id=ef2a8162-0644-47e7-bd03-bea33f14a5d2&limit=100) | Vérifié sans changement | `2026-10-07T21:39:24.978Z` | 53 projets / 10 temporaires existants; 34 permanents et 9 temporaires à permanents exclus; 7 fiches manuelles conservées | 7 LineString, 3 Point; 7 lignes manuelles |
| [Citoyens, non officiel](https://forms.gle/TKL6WkmPsWPmAUMV8) | Vérifié sans changement | `2026-10-07T21:40:46.416Z` | 9 réponses, 14 colonnes / 10 fiches et 11 impacts; aucune réponse retirée; 3 fiches admissibles donnant 4 impacts, 7 fiches en attente | 3 LineString, 1 MultiLineString, 6 sans tracé |
| [Beaconsfield](https://www.beaconsfield.ca/fr/carte-interactive/info-travaux) | Vérifié sans changement après revue des textes | `2026-10-07T21:45:59.432Z` | 78 POI, 6 couches KML, 494 repères / 103 repères dans 2 fiches; 391 exclusions vérifiées; Devon, sans KML, décrit des travaux de 2025 | 2 MultiLineString |
| [PJCCI archive](https://jacquescartierchamplain.ca/fr/structures/archive-des-avis-de-travaux-et-chantiers/) et [carte](https://jacquescartierchamplain.ca/fr/circulation-routiere/secteur-bonaventure/) | Vérifié sans changement | `2026-10-07T21:43:20.352Z` | 138 avis uniques / 2 parents actifs, 9 segments; 136 historiques exclus; 4 entrées de carte identiques | 1 LineString, 1 MultiLineString, 7 sans tracé |
| [Noovo, supplément non officiel](https://www.noovomoi.ca/tendances/infos-pratiques/article/cyclisme-a-montreal-voici-les-rues-et-secteurs-a-eviter-en-septembre/) | Échec / non vérifié intégralement | `2026-09-08`, heure et fuseau absents | Article relu / 3 fiches conservées; image d'origine et heures précises non revalidées | 2 LineString, 1 sans géométrie stockée |
| [Marathon : PDF officiel](https://couronsmtl.com/wp-content/uploads/2026/09/Depliant-Fermetures-de-rues-2026-web.pdf), [RTRT](https://track.rtrt.me/map/CM-BENEVA-MONTREAL-2026) et export Waze fourni | Échec / non vérifié intégralement | PDF : `2026-10-05T15:59:03.349Z`; parcours : `2026-10-05T15:09:35.472Z`; dates conservées | PDF identique, 6 parcours comparés; 88 fermetures Waze et 72 groupes officiels conservés, dont 69 routiers et 3 chemins; 297 arêtes restent en revue | Groupes officiels : 29 LineString, 43 MultiLineString; 6 parcours LineString |
| [Consolidé piéton](../data/pedestrian-closures-snapshot.json) | Modifié, un flux en échec | Assemblage `2026-10-07T21:53:03.613Z`; vérifications par source ci-dessous | 30 entrées sources / 1 233 fiches; 231 ajouts, 192 retraits, 1 002 fiches communes identiques hors fraîcheur; 187 candidats en revue | 1 220 Polygon, 9 LineString, 4 MultiLineString |

Mont-Royal : les nouveaux projets concernent Côte-de-Liesse, du 17 au 25 octobre pour la fermeture de fin de semaine publiée par Ville Saint-Laurent, et du 8 au 12 octobre pour Telecon/Bell entre Lucerne et Graham. Laird/Revere, terminé le 6 octobre selon sa date précédente, et Graham Ouest entre Appin et Brookfield ne figurent plus dans la réponse officielle. Graham avait une fin annoncée au 9 octobre : son retrait du flux ne prouve pas la fin des travaux sur le terrain.

Montréal : les trois avis modifiés concernent Bordeaux, de Bonsecours et George-V; seul leur bloc `occupancyImpact` change. Parmi les 174 retraits, 140 anciennes fiches sont expirées et 34 avaient encore une fin au 7 octobre ou après; leur absence du nouveau jeu admissible ne constitue pas une confirmation de fin sur place. La recherche couvre les 1 117 avis piétons attendus du WFS avant le filtrage final; aucun avis manquant n'a nécessité de récupération directe et aucun `workImpact` personnalisé n'est publié. Les géométries comptent 1 740 lignes résolues, 4 lignes directement publiées et 277 emprises honnêtement conservées. Les 1 603 fiches communes et leurs tracés restent exacts; le cache géobase est réutilisé sans nouvelle vérification générale de tous ses segments.

Rues piétonnisées : tous les identifiants et champs sources comparables des dix projets temporaires concordent, avant tout appel géographique. Aucun géocodage, Overpass ou remplacement de géométrie. Les trois anciens points et les sept fiches manuelles restent inchangés conformément à la politique d'ajout seulement. La divergence préexistante de `endDate` entre la fiche manuelle Wellington et sa copie intégrée demeure; les dates saisonnières de repli du chargeur ne sont pas modifiées.

Citoyens : les neuf réponses ont été lues avec toutes leurs colonnes, cellules vides et textes libres. Les 13 colonnes exportables concordent exactement; la colonne de contact est exclue, sans publication de ses valeurs ni du lien du tableur. Les dates déclarées, horaires, réserves, identifiants, géométries et dates de vérification géographique ne changent pas. Les sept fiches en attente ne sont pas rendues admissibles par cette simple relecture.

Beaconsfield : les 13 repères de réhabilitation sanitaire et les 90 d'inspection sanitaire concordent avec les lignes KML et le détail complet. Les 391 exclusions comprennent 4 échéanciers insuffisants, 107 travaux terminés en juillet, 142 repères portant « 32 octobre 2026 » et 138 travaux terminés le 2 octobre. Deux textes d'exclusion diffèrent seulement par un espace de séparation avant le lien « Consultez la carte des chantiers » : leurs dates et motifs concordent après revue, sans réécriture des fiches. Le détail Devon, classé aussi dans « info-travaux », annonce une fin vers la mi-juillet 2025; il n'établit aucune restriction automobile actuelle. Le générateur aux dates fixes n'est pas exécuté.

PJCCI : 14 réponses cumulatives représentent 1 048 occurrences mais exactement 138 URL uniques, sans doublon contradictoire. Tous les champs publiés des deux parents actifs et toutes les entrées brutes de carte concordent. Les segments et les métadonnées historiques de construction, dont `asOf` et les anciens comptes d'archive, restent inchangés. Les sept segments sans tracé sont `pepsc-local`, `pepsc-access-bonaventure`, `sortie-3-vers-sud`, `gaetan-laberge-vers-sud`, `gaetan-laberge-vers-centre-ville`, `voies-victoria-clement-vers-sud` et `voies-victoria-clement-vers-centre-ville`. Aucun point de repli ni trajet de routeur n'est ajouté.

Noovo : l'article indique toujours Parc du 4 septembre au 4 octobre, contre un début au 7 septembre dans le fichier. Il ne justifie pas les heures A-10 `06:30-16:30` ni la fin Champlain `11:30`. L'image initialement fournie n'a pas d'URL identifiable et n'a pas été inspectée. Le fichier et sa date sont préservés exactement.

Marathon : le PDF reçu à `2026-10-07T21:49:12.615Z` a la même empreinte `07303c423b638b5b5b858e0d4b12515139acb39a8827bf7a9a8567324d156269`. La carte et la configuration RTRT sont reçues dans Chromium à `2026-10-07T21:49:18.641Z`; les noms, clés, distances et coordonnées des six parcours sont identiques, avec une modification source toujours datée du 2 octobre. L'export Waze fourni n'a pas de source live de vérification enregistrée; les pages d'horaires et références de classification ne sont pas intégralement revérifiées. Le générateur de fermetures lit un cache lié aux données exclues et n'est pas exécuté. Aucune date imbriquée ni date du catalogue Marathon n'avance.

#### Consolidation : détail par source

`checkedAt` date la vérification live; `sourceExtractedAt` reprend la date de l'entrée locale, sans la renouveler par sa lecture. Sept entrées locales datées sont vérifiées en amont dans cette exécution. Noovo et Marathon restent partiellement vérifiés; les deux listes manuelles sont non datées. Les URL exactes sont dans `sources` du JSON. Les heures suivantes sont en UTC le 7 octobre sauf mention contraire.

| Source | État | Heure de vérification ou date de l'entrée locale | Reçus / retenus / revue |
| --- | --- | --- | --- |
| Montréal | checked | `21:52:41.911Z` | 2 058 / 1 220 / 0 |
| Longueuil | checked | `21:52:50.103Z` | 355 / 0 / 95 |
| Dorval | checked | `21:52:51.765Z` | 593 / 0 / 13 |
| Boisbriand | checked | `21:52:52.271Z` | 69 / 0 / 10 |
| Saint-Eustache lignes | checked | `21:52:53.039Z` | 165 / 0 / 20 |
| Saint-Eustache points | checked | `21:52:53.915Z` | 320 / 0 / 22 |
| Châteauguay | checked | `21:52:54.480Z` | 38 / 0 / 0 |
| L'Assomption | checked | `21:52:54.870Z` | 9 / 0 / 0 |
| Terrebonne lignes | checked | `21:52:55.485Z` | 7 / 2 / 1 |
| Terrebonne points | checked | `21:52:56.265Z` | 2 / 0 / 0 |
| Mont-Saint-Hilaire 3 | checked | `21:52:57.498Z` | 1 / 0 / 1 |
| Mont-Saint-Hilaire 4 | checked | `21:52:57.836Z` | 1 / 0 / 1 |
| Mont-Saint-Hilaire 5 | checked | `21:52:58.257Z` | 1 / 0 / 1 |
| Mont-Saint-Hilaire 6 | checked | `21:52:58.627Z` | 1 / 0 / 1 |
| Mont-Saint-Hilaire 15 | checked | `21:52:58.946Z` | 1 / 0 / 1 |
| MTMD chantiers | checked | `21:52:59.846Z` | 571 / 0 / 2 |
| MTMD événements | checked | `21:53:00.371Z` | 22 / 0 / 0 |
| Repentigny | failed, `ECONNRESET` | Aucune vérification réussie enregistrée | Non reçu / 0 / sans objet |
| Laval | checked | `21:53:01.868Z` | 161 / 4 / 6 |
| Mont-Royal | local-snapshot, vérifié en amont | `21:35:43.575Z` | 13 / 4 / 0 |
| Beaconsfield | local-snapshot, vérifié en amont | `21:45:59.432Z` | 2 / 0 / 0 |
| PJCCI | local-snapshot, vérifié en amont | `21:43:20.352Z` | 9 / 0 / 0 |
| Citoyens | local-snapshot, vérifié en amont | `21:40:46.416Z` | 10 / 0 / 1 |
| Noovo | local-snapshot, vérification incomplète | `2026-09-08`, sans fuseau | 3 / 0 / 0 |
| Rues piétonnisées | local-snapshot, vérifié en amont | `21:39:24.978Z` | 17 / 0 / 8 |
| UCI | local-snapshot, vérifié en amont | `21:39:08.753Z` | 5 305 / 0 / 0 |
| Listes régionales | local-snapshot, non revérifié | Non datées | 7 / 0 / 0 |
| Villes liées | local-snapshot, non revérifié | Non datées | 25 / 0 / 4 |
| Détails Montréal | local-snapshot, vérifié en amont | `21:37:00.749Z` | 1 013 / 0 / sans compte de revue |
| Marathon, chemins | local-snapshot, composite incomplet | `2026-10-05T15:59:03.349Z` conservé | 72 / 3 / 0 |

Bilan : **18 flux vérifiés, 11 entrées locales et un flux en échec**, pas trente municipalités. Les cinq familles affichées sont Montréal (1 220), Mont-Royal (4), Laval (4), Terrebonne (2) et Marathon (3). Les nouvelles fiches Laval publient une fermeture du trottoir nord de Curé-Labelle et une fermeture du trottoir de l'Avenir avec passage de contournement maintenu. Le côté de cette dernière reste inconnu. Le tunnel Terrebonne conserve sa fermeture explicitement active de durée indéterminée, sans fin inventée.

Les cinq couches Mont-Saint-Hilaire sont retrouvées via la configuration publiée de l'Experience; leurs échéanciers saisonniers restent dans `review`, sans fermeture datée inventée. Repentigny échoue pendant la connexion HTTPS avec `ECONNRESET`; aucun ancien enregistrement admissible n'est disponible, aucune URL de remplacement n'est supposée. L'instrumentation temporaire contrôle 37 requêtes sources et l'identité exacte des 16 lots ArcGIS.

#### Validations et limites

- JSON, comptes, identifiants, dates admissibles, preuves, côtés, coordonnées finies et fraîcheur par source sont vérifiés. Les 1 002 fiches communes du consolidé sont identiques hors métadonnées de vérification, géométries comprises. Aucun `extractedAt` global n'est ajouté au consolidé.
- Les cinq changements de fraîcheur seule sont identiques octet pour octet à la base après restitution du seul ancien horodatage. Les onze entrées de catalogue modifiées concordent; tous les autres champs, dont les entrées de nids-de-poule, sont identiques. Noovo, Marathon et les fiches manuelles restent exacts. Aucun lien ou identifiant de tableur privé n'est introduit dans les JSON publics.
- `node tools/validate-pedestrian-snapshot.mjs` passe sur les 1 233 fiches et les cinq familles affichées : popups, géométries présentes, preuves, côtés, FR/EN, filtres, panneau Zones touchées initialement replié avec trois cases cochées, mobile et panne du snapshot commun sans repli automobile. Aucune erreur JavaScript.
- `node tools/validate-popup-grouping.mjs` passe sur les deux cartes : Piétons, 1 233 entrées / 1 107 cartes / 108 groupes fusionnés; Auto, 8 173 entrées / 8 026 cartes / 121 groupes fusionnés. Identités, géométries, impacts, directions, horaires et limites restent distincts quand nécessaire. Clics de couches, langues, popup mobile et maintien du centre/zoom sont vérifiés. Le chargement auto signale `ERR_CONNECTION_RESET` pour une ressource, sans erreur JavaScript. Les totaux chargés ne sont pas des comptes de fermetures actives aujourd'hui.
- Une sonde Chromium complémentaire valide les dix instants Foucher et six états des filtres de dates : limites du 1er juillet/31 octobre, jours ouvrables/week-end, fermeture de 07:00 à 19:00 et stationnement permanent sur la période déclarée. Dix-huit vrais clics souris auto et quatre piétons (ligne, multiline, point et emprise) passent à 1 400 et 390 px; leurs canvas ont des pixels, les liens attendus du popup sont présents, le texte ne déborde pas et les popups restent dans les limites de la carte. Les couleurs piétonnes rouge `#ff1744` / orange `#ff8c00`, l'emprise pointillée, 16 états temporels des impacts citoyens, l'absence de requêtes au tableur et la divulgation de l'échec sont contrôlés. Aucune erreur JavaScript.
- La sonde a révélé une limite préexistante des liens en français : `escapeHtml` applique aussi `correctFrenchText` à la valeur du `href`. L'URL Mont-Royal publiée `detours=true` devient ainsi `détours=true` dans le lien du popup. Le contrôle valide que l'URL rendue correspond au comportement de l'application, mais sa cible n'est pas byte-à-byte l'URL du snapshot. Aucune modification d'interface n'est faite dans ce périmètre; cette correction relève d'une demande distincte.
- Le consolidateur ne consulte toujours pas systématiquement les pages éditoriales et sections détaillées liées. Les cas Longueuil Roland-Therrien et Louise-Gravel ne sont pas nouvellement examinés ni intégrés. Les descriptions complémentaires peuvent donc contenir des restrictions absentes du consolidé; un succès de flux n'établit pas une couverture exhaustive des avis.
- Aucun `view_image`, aucune capture jointe au chat et aucune inspection visuelle humaine. Les captures du validateur restent hors dépôt; les résultats de rendu rapportés sont les assertions Chromium effectivement exécutées.
- Les contrôles `node --check` passent sur le catalogue, les deux chargeurs et les générateurs Montréal (géométries et avis), PJCCI et de consolidation. Le diff ciblé ne contient pas d'erreur d'espacement; Git avertit seulement d'une éventuelle conversion LF vers CRLF lors d'une future opération Git. Les diagnostics JSON et catalogue sont sans erreur. Treize avertissements Markdown préexistants demeurent dans les anciennes sections de couverture, d'endpoints et de limitations, hors du présent bilan; ils ne sont pas corrigés ici.
- Des changements concurrents sont apparus dans le dossier exclu des nids-de-poule et dans la documentation pendant cette exécution. Ils sont laissés intacts, sans lecture de leurs données, sans annulation et sans attribution à cette actualisation routière.

Fichiers modifiés par cette actualisation : `data/mont-royal-snapshot.json`, `data/montreal-pedestrian-notices-snapshot.json`, `data/montreal-entraves-geometries-snapshot.json`, `data/montreal-uci-closures-snapshot.json`, `data/montreal-pedestrian-snapshot.json`, `data/citizen-reports-snapshot.json`, `data/beaconsfield-snapshot.json`, `data/pjcci-work-advisories-snapshot.json`, `data/pedestrian-closures-snapshot.json`, `data/sources.js` et ce bilan dans `docs/README.md`. Les changements restent locaux, sans commit ni push. **La vérification des sources ne confirme pas les conditions sur le terrain.**

### Reverification des sources du 5 octobre 2026, 20 h 55 UTC

Nouvelle execution du prompt d'actualisation, a partir des fichiers locaux de `2026-10-05T20:55:20.516Z`. Les modifications deja presentes dans le site, ses traductions, sa documentation et les publications sociales sont preservees. Onze fichiers composites ou snapshots sont examines, hors nids-de-poule et colmatage. Les entrees sont verifiees avant la consolidation pietonne. Aucun commit, push, deploiement, ajout de dependance ou changement d'interface. Les baselines, reponses de revue et sondes sont conservees hors depot.

#### Bilan des onze fichiers

Toutes les heures ci-dessous sont en UTC le 5 octobre 2026, sauf la date historique Noovo. A Montreal, UTC moins quatre heures. « Verifie sans changement » signifie que seul `extractedAt` a change; ce n'est ni une publication recente de la source ni une verification terrain.

| Snapshot / source publique | Etat | Derniere verification reussie ou date conservee | Recus / retenus et exclusions | Geometries |
| --- | --- | --- | --- | --- |
| [Mont-Royal](https://montroyal.opatech.ca/#/public?city=montroyal&entraves=true&closing=true&detours=true&lang=fr) | Modifie | `2026-10-05T20:55:48.351Z` | 13 projets / 13; 2 ajouts, 11 fiches identiques, aucune exclusion | 9 LineString, 4 MultiLineString |
| [Avis pietons Montreal](https://montreal.ca/entraves-travaux/entraves) | Modifie | `2026-10-05T20:57:34.244Z` | 183 pages, 1 823 resultats / 979 avis; 25 ajouts, 11 avis expires retires, 954 fiches identiques; filtrage dates/zones | Attributs et libelles, sans geometrie propre |
| [Geometries Montreal](https://donnees.montreal.ca/dataset/info-travaux) | Modifie | `2026-10-05T20:58:49.501Z` | 1 530 permis / 1 807 impacts; 52 ajouts, 51 anciens identifiants absents du flux, 1 755 fiches identiques | 1 551 LineString, 3 MultiLineString, 253 emprises Polygon |
| [UCI Montreal](https://services.montreal.ca/cartes/uci) | Verifie sans changement | `2026-10-05T20:58:52.077Z` | 5 305 restrictions + 17 parcours / tous conserves; aucune exclusion pour date absente | 5 322 LineString |
| [Rues pietonnisees Montreal](https://donnees.montreal.ca/api/3/action/datastore_search?resource_id=ef2a8162-0644-47e7-bd03-bea33f14a5d2&limit=100) | Verifie sans changement | `2026-10-05T20:58:53.822Z` | 53 projets / 10 temporaires existants; 34 permanents + 9 temporaires a permanents exclus; 7 fiches manuelles preservees | 7 LineString, 3 Point; 7 lignes manuelles |
| [Citoyens, non officiel](https://forms.gle/TKL6WkmPsWPmAUMV8) | Verifie sans changement | `2026-10-05T21:00:12.499Z` | 9 reponses, 14 colonnes / 10 fiches, 11 impacts; aucune reponse retiree; 7 fiches en attente, 3 admissibles donnant 4 impacts | 3 LineString, 1 MultiLineString, 6 sans trace |
| [Beaconsfield](https://www.beaconsfield.ca/fr/carte-interactive/info-travaux) | Verifie sans changement | `2026-10-05T21:00:20.445Z` | 78 POI, 6 couches, 494 reperes / 103 reperes dans 2 fiches; 391 exclusions relues | 2 MultiLineString |
| [PJCCI archive](https://jacquescartierchamplain.ca/fr/structures/archive-des-avis-de-travaux-et-chantiers/) et [carte](https://jacquescartierchamplain.ca/fr/circulation-routiere/secteur-bonaventure/) | Verifie sans changement | `2026-10-05T21:00:53.184Z` | 139 parents uniques / 2 actifs, 9 segments; 137 historiques exclus; 4 entrees carte identiques | 1 LineString, 1 MultiLineString, 7 sans trace |
| [Noovo, supplement non officiel](https://www.noovomoi.ca/tendances/infos-pratiques/article/cyclisme-a-montreal-voici-les-rues-et-secteurs-a-eviter-en-septembre/) | Verification incomplete, fichier preserve | `2026-09-08`, heure et fuseau absents | Article relu / 3 fiches conservees; image et horaires non revalides | 2 LineString, 1 sans geometrie stockee |
| [Marathon : PDF officiel](https://couronsmtl.com/wp-content/uploads/2026/09/Depliant-Fermetures-de-rues-2026-web.pdf), [RTRT](https://track.rtrt.me/map/CM-BENEVA-MONTREAL-2026) et export Waze fourni | Verification partielle, composite preserve | PDF : `2026-10-05T15:59:03.349Z`; parcours : `2026-10-05T15:09:35.472Z`, dates conservees | PDF identique et 6 parcours compares; 88 fermetures Waze sur 76 segments et 72 groupes officiels conserves (69 routes, 3 chemins); 297 aretes restent en revue | Groupes officiels : 29 LineString, 43 MultiLineString; 6 parcours LineString |
| [Consolide pieton](../data/pedestrian-closures-snapshot.json) | Modifie, un flux en echec | Assemblage `2026-10-05T21:06:17.779Z`; dates par source ci-dessous | 30 entrees sources / 1 194 fiches; 27 ajouts, 0 retrait; 186 candidats en revue | 1 181 Polygon, 7 LineString, 6 MultiLineString |

Les cinq mises a jour de fraicheur seule sont identiques octet pour octet a la base hors `extractedAt`. Les onze dates modifiees du catalogue concordent avec les huit snapshots verifies en amont. Aucun `extractedAt` global n'est ajoute au consolide. Les fiches manuelles des rues pietonnisees, Noovo et le fichier Marathon sont preserves exactement.

Montreal : la verification des avis couvre les 990 notices attendues du WFS avant filtrage final des attributs de recherche, un doublon non conflictuel et aucun avis a recuperer directement. Aucune description personnalisee `workImpact` n'est presente; la date de fin minimale retenue est le 5 octobre. Les 11 avis retires etaient expires. Pour les geometries, 1 751 geometries non directement publiees sont reprises, plus les 4 lignes publiees; les 52 nouveaux impacts passent par la resolution. Les comptes sont 1 550 lignes resolues, 4 lignes publiees et 253 emprises. Le cache geobase est reutilise sans verification generale de toutes les geometries stockees.

UCI conserve sa politique d'evenement complet et `selectedDate: null`; les filtres du chargeur decident de l'affichage. Les 5 305 restrictions chargees ne sont pas un nombre de fermetures actuellement actives. Pour les rues pietonnisees, les pages CKAN, les champs sources comparables et tous les identifiants temporaires ont ete compares avant tout calcul; aucun nouvel identifiant admissible, aucun appel geographique, aucune reconstruction des dix fiches ni des sept fiches manuelles.

Beaconsfield : les six descriptions completes, tableaux `TypeTravaux`, identifiants, geometries retenues et exclusions concordent. Sont exclus 4 echeanciers approximatifs sans statut/date actuelle etabli, 107 travaux termines en juillet, 142 reperes portant la date source invalide « 32 octobre 2026 » et 138 travaux termines le 2 octobre. Les 103 reperes retenus couvrent 13 rehabilitations sanitaires et 90 inspections sanitaires. Le generateur historique aux dates fixes n'est pas utilise.

PJCCI : 14 reponses cumulatives, 1 049 occurrences et exactement 139 URL uniques; pas de somme trompeuse des pages repetees. Les deux avis parents actifs et les quatre entrees brutes de la carte concordent. Les neuf segments, leurs dates, leur geometrie et les metadonnees historiques `asOf` sont preserves. Les sept segments sans trace restent `pepsc-local`, `pepsc-access-bonaventure`, `sortie-3-vers-sud`, `gaetan-laberge-vers-sud`, `gaetan-laberge-vers-centre-ville`, `voies-victoria-clement-vers-sud` et `voies-victoria-clement-vers-centre-ville`. La reconstruction historique rejetee n'est pas executee.

Citoyens : les neuf reponses et toutes leurs 14 colonnes ont ete examinees ensemble, textes libres compris. Les 13 colonnes exportables concordent avec les fiches existantes. Les contacts ne sont ni exportes ni journalises; aucune nouvelle resolution geographique et aucune modification des dates, horaires, reserves, identifiants ou provenances. Les trois fiches admissibles produisent quatre impacts dans le chargeur; les sept autres restent en attente. Une verification de reponses ne confirme pas la fermeture sur place.

Noovo : l'article relu annonce toujours Parc du 4 septembre au 4 octobre, contre le 7 septembre dans le fichier. Il n'etablit pas les horaires A-10 `06:30-16:30` ni la fin Champlain `11:30`. L'image initialement fournie n'a pas d'URL identifiable et n'a pas ete inspectee. La verification partielle est consignée a `2026-10-05T21:05:08.022Z`, sans avancer la date du snapshot ni du catalogue.

Marathon : le PDF est recu a `2026-10-05T21:05:09.239Z`, avec la meme empreinte SHA-256 `07303c423b638b5b5b858e0d4b12515139acb39a8827bf7a9a8567324d156269` que la version revue. La carte et la configuration RTRT sont recues dans Chromium a `2026-10-05T21:05:14.881Z`; six parcours publics, noms, cles, distances et coordonnees identiques, mise a jour source toujours au 2 octobre. L'export Waze fourni n'a pas de source live enregistree; les pages d'horaires et references de classification ne sont pas reverifiees integralement. Le generateur de fermetures lit un cache lie aux nids-de-poule, exclu ici, et n'est pas execute. Le fichier composite et toutes ses dates imbriquees restent donc inchanges, tout comme les deux dates du catalogue correspondantes.

#### Consolidation : trente entrees sources

`checkedAt` date la verification live; `sourceExtractedAt` garde la date de l'entree locale. Sept entrees locales datees ont ete reverifiees en amont dans cette execution. Noovo et Marathon restent partiellement verifies; les deux listes manuelles sont non datees. Les URL completes sont dans `sources` du JSON. Les heures suivantes sont en UTC le 5 octobre, sauf Noovo.

| Source | Etat | Heure UTC ou date de l'entree locale | Recus / retenus / revue |
| --- | --- | --- | --- |
| Montreal | checked | `21:05:51.937Z` | 1 823 / 1 181 / 0 |
| Longueuil | checked | `21:05:55.547Z` | 354 / 0 / 94 |
| Dorval | checked | `21:05:58.298Z` | 589 / 0 / 13 |
| Boisbriand | checked | `21:05:58.950Z` | 69 / 0 / 10 |
| Saint-Eustache lignes | checked | `21:06:00.935Z` | 165 / 0 / 20 |
| Saint-Eustache points | checked | `21:06:04.006Z` | 318 / 0 / 22 |
| Chateauguay | checked | `21:06:04.751Z` | 38 / 0 / 0 |
| L'Assomption | checked | `21:06:05.502Z` | 9 / 0 / 0 |
| Terrebonne lignes | checked | `21:06:06.122Z` | 6 / 2 / 1 |
| Terrebonne points | checked | `21:06:06.511Z` | 2 / 0 / 0 |
| Mont-Saint-Hilaire 3 | checked | `21:06:10.827Z` | 1 / 0 / 1 |
| Mont-Saint-Hilaire 4 | checked | `21:06:11.228Z` | 1 / 0 / 1 |
| Mont-Saint-Hilaire 5 | checked | `21:06:11.743Z` | 1 / 0 / 1 |
| Mont-Saint-Hilaire 6 | checked | `21:06:12.121Z` | 1 / 0 / 1 |
| Mont-Saint-Hilaire 15 | checked | `21:06:12.621Z` | 1 / 0 / 1 |
| MTMD chantiers | checked | `21:06:13.516Z` | 601 / 0 / 2 |
| MTMD evenements | checked | `21:06:14.103Z` | 22 / 0 / 0 |
| Repentigny | failed, `ECONNRESET` | Aucune verification reussie enregistree | Non recu / 0 / sans objet |
| Laval | checked | `21:06:15.388Z` | 150 / 2 / 6 |
| Mont-Royal | local-snapshot | `20:55:48.351Z` | 13 / 6 / 0 |
| Beaconsfield | local-snapshot | `21:00:20.445Z` | 2 / 0 / 0 |
| PJCCI | local-snapshot | `21:00:53.184Z` | 9 / 0 / 0 |
| Citoyens | local-snapshot | `21:00:12.499Z` | 10 / 0 / 1 |
| Noovo | local-snapshot, incomplet | `2026-09-08` | 3 / 0 / 0 |
| Rues pietonnisees | local-snapshot | `20:58:53.822Z` | 17 / 0 / 8 |
| UCI | local-snapshot | `20:58:52.077Z` | 5 305 / 0 / 0 |
| Listes regionales | local-snapshot | Non datees | 7 / 0 / 0 |
| Villes liees | local-snapshot | Non datees | 25 / 0 / 4 |
| Details Montreal, libelles et attributs | local-snapshot | `20:57:34.244Z` | 979 / 0 / sans compte de revue |
| Marathon, groupes de chemins | local-snapshot, composite incomplet | `15:59:03.349Z` conserve | 72 / 3 / 0 |

Bilan : **18 flux verifies, 11 entrees locales et un flux en echec**. Ce ne sont pas trente municipalites. Les 1 167 fiches communes sont identiques hors metadonnees de verification, avec toutes leurs geometries conservees; 27 nouvelles fiches et aucun retrait. Les sources affichees sont Montreal (1 181), Mont-Royal (6), Laval (2), Terrebonne (2) et Marathon (3). Les cinq couches Mont-Saint-Hilaire sont retrouvees depuis la configuration publiee, mais leurs echeanciers saisonniers restent en revue; aucune date precise ni fermeture n'est fabriquee. Repentigny echoue encore pendant la connexion HTTPS, pas sur un diagnostic CORS ou JSON. Aucune ancienne fiche admissible n'etait disponible pour cette source.

#### Controles et limites de cette execution

- Le consolidateur ne recupere toujours pas systematiquement toutes les pages editoriales et sections detaillees liees. Les cas Longueuil Roland-Therrien et Louise-Gravel ne sont pas nouvellement verifies ou integres. Un succes des flux ne certifie pas une couverture exhaustive des trottoirs.
- L'ancienne divergence Wellington entre la fiche manuelle et sa copie integree, et les dates saisonnieres de repli du chargeur, restent hors des changements. Aucun tracé n'est reconstruit pour seulement changer une date.
- JSON, identifiants stables, dates admissibles, preuves, cotes, provenance et geometries finies verifies. Les cinq sorties de fraicheur seule sont identiques octet pour octet hors horodatage; onze dates de catalogue concordent. Noovo et Marathon restent identiques octet pour octet. Les chargeurs, fichiers manuels et dix fichiers proteges concordent avec la base.
- Confidentialite : aucune adresse de contact ni URL/identifiant du tableur prive introduits dans les snapshots ou le catalogue. Aucun appel au tableur ou au formulaire pendant les tests des cartes.
- Les commandes originales `node tools/validate-pedestrian-snapshot.mjs` et `node tools/validate-popup-grouping.mjs` ont ete executees, mais **ne sont pas declarees reussies** : la premiere compare le texte brut `HORAIRE RUES FERMÉES` au libelle traduit du popup Marathon; la seconde clique la premiere ligne decorative d'un MultiLineString Laval sans gestionnaire de clic. Des sondes ont confirme le libelle charge et le succes du clic de la couche interactive.
- Des copies temporaires externes corrigent uniquement ces deux hypotheses de test, puis passent integralement : carte Pietons (1 194 fiches, cinq sources affichees, evidence/cotes, FR/EN, filtres, panneau Zones touchees replie avec trois cases selectionnees, mobile et panne simulee sans repli Auto) et regroupement des deux cartes. Aucun test ou code d'interface du depot n'est modifie pour obtenir ce resultat.
- Regroupement audite : Pietons, 1 194 entrees / 1 069 cartes de popup / 108 groupes fusionnes; Auto, 7 946 entrees chargees / 7 803 cartes / 118 groupes fusionnes. Identites, geometries et impacts distincts preserves, clics vectoriels, langues, mobile et centre/zoom de navigation verifies. Les totaux charges ne sont pas des nombres de fermetures actuelles. Auto signale un `ERR_CONNECTION_RESET` de ressource, sans erreur JavaScript.
- Controle Auto complementaire : neuf exemples a 1 400 et 390 pixels (Mont-Royal, Beaconsfield, PJCCI, Foucher, ligne et emprise Montreal, rue pietonnisee, point officiel et Marathon), avec clics interactifs, contenu/liens, canvas non vide et bornes de popup apres animation. Dix cas des horaires Foucher valident ouverture hors plage, fermeture en semaine de 7 h a 19 h, stationnement permanent sur la periode declaree et bornes du 1er juillet/31 octobre. Aucune erreur JavaScript.
- `node --check` passe sur le catalogue, le chargeur, les generateurs de geometries Montreal, PJCCI et de consolidation. Serveur local existant sur le port 5500; aucune installation ni nouveau serveur. Aucun `view_image`, capture jointe ou inspection visuelle humaine : les controles de rendu sont des assertions Chromium textuelles.
- En parallele de cette execution, 28 fichiers du dossier exclu des nids-de-poule ont change de statut Git par rapport a la base. Ils ne sont ni lus ni modifies ni annules ici; leurs metadonnees de catalogue restent identiques. Les modifications de l'utilisateur sont conservees et ne sont pas attribuees a ce travail.

Fichiers modifies par cette actualisation : les neuf snapshots du tableau autres que Noovo et Marathon, [data/sources.js](../data/sources.js) et le present bilan. Les changements restent locaux. **Verifier une source ne confirme pas les conditions sur le terrain.**

### Verification des sources du 5 octobre 2026, UTC

Actualisation locale des dix snapshots autorises, entrees avant consolidation, sans commit, push, deploiement, installation ni changement d'interface. La base de comparaison et les controles temporaires sont conserves hors depot. Les heures ci-dessous sont en UTC (`Z`); le traitement commence le 4 octobre au soir a Montreal (UTC-4) et traverse minuit local. `extractedAt` date la verification reussie, pas une nouvelle publication de la source ni une confirmation des conditions sur le terrain.

#### Bilan par snapshot

| Snapshot / source publique | Etat | Derniere verification reussie | Recus / retenus et exclusions | Geometries |
| --- | --- | --- | --- | --- |
| [Mont-Royal](https://montroyal.opatech.ca/#/public?city=montroyal&entraves=true&closing=true&detours=true&lang=fr) | Verifie sans changement | `2026-10-05T03:49:21.773Z` | 11 projets / 11; aucun exclu dans la reponse recue | 7 LineString, 4 MultiLineString |
| [Geometries Montreal](https://donnees.montreal.ca/dataset/info-travaux) | Modifie | `2026-10-05T03:53:21.589Z` | 1 524 permis / 1 806 impacts; 76 ajouts, 350 anciens identifiants absents du flux courant, 1 730 fiches preservees | 1 540 LineString, 3 MultiLineString, 263 emprises Polygon |
| [Avis pietons Montreal](https://montreal.ca/entraves-travaux/entraves) | Modifie | `2026-10-05T03:51:53.404Z` | 182 pages, 1 815 resultats / 965 avis; filtrage dates/zones et dedoublonnage; 48 ajouts, 94 modifications, 18 retraits, 823 identiques | Attributs et libelles, sans geometrie propre |
| [Rues pietonnisees Montreal](https://donnees.montreal.ca/api/3/action/datastore_search?resource_id=ef2a8162-0644-47e7-bd03-bea33f14a5d2&limit=100) | Verifie sans changement | `2026-10-05T03:55:55.374Z` | 53 projets / 10 temporaires existants; 34 permanents et 9 temporaires a permanents exclus; 7 fiches manuelles preservees | 7 LineString, 3 Point; 7 lignes manuelles |
| [UCI Montreal](https://services.montreal.ca/cartes/uci) | Verifie sans changement | `2026-10-05T03:55:53.660Z` | 5 305 restrictions et 17 parcours / tous conserves; aucune exclusion pour date absente | 5 322 LineString |
| [Declarations citoyennes, non officielles](https://forms.gle/TKL6WkmPsWPmAUMV8) | Verifie sans changement | `2026-10-05T04:00:15.436Z` | 9 reponses, 14 colonnes / 10 fiches, 11 impacts; aucune reponse retiree; 7 fiches en attente, 3 admissibles donnant 4 impacts | 3 LineString, 1 MultiLineString, 6 sans trace |
| [Beaconsfield](https://www.beaconsfield.ca/fr/carte-interactive/info-travaux) | Verifie sans changement | `2026-10-05T04:06:28.625Z` | 78 POI, 6 couches, 494 reperes KML / 103 reperes dans 2 fiches; 391 exclusions relues | 2 MultiLineString |
| [PJCCI archive](https://jacquescartierchamplain.ca/fr/structures/archive-des-avis-de-travaux-et-chantiers/) et [carte](https://jacquescartierchamplain.ca/fr/circulation-routiere/secteur-bonaventure/) | Verifie sans changement | `2026-10-05T04:05:26.350Z` | 139 parents uniques / 2 actifs, 9 segments; 137 historiques exclus; 4 entrees carte concordantes | 1 LineString, 1 MultiLineString, 7 sans trace |
| [Noovo, supplement non officiel](https://www.noovomoi.ca/tendances/infos-pratiques/article/cyclisme-a-montreal-voici-les-rues-et-secteurs-a-eviter-en-septembre/) | Verification incomplete, fichier preserve | `2026-09-08`, heure et fuseau non publies | Article relu / 3 fiches conservees; image et horaires non revalides | 2 LineString, 1 sans geometrie stockee |
| [Consolide pieton](../data/pedestrian-closures-snapshot.json) | Modifie, verification partielle | Assemblage `2026-10-05T04:09:30.675Z`; verifications par source ci-dessous | 29 entrees sources / 1 164 fiches; 49 ajouts, 34 retraits, 1 115 identiques hors fraicheur; 186 candidats en revue | 1 155 Polygon, 6 LineString, 3 MultiLineString |

Les six sorties de fraicheur seule sont identiques octet pour octet a la base apres remplacement du seul `extractedAt`. Leurs fiches, textes, dates publiees, geometries et provenances restent intacts. Les onze entrees de fraicheur du catalogue concordent avec les huit snapshots verifies en amont. La consolidation n'a pas de faux `extractedAt` global et ne fait pas avancer une date commune dans le catalogue.

Montreal : les avis verifies couvrent 983 notices pietonnes attendues du WFS, avec trois doublons de recherche controles et un avis recupere directement. Aucun texte personnalise `workImpact` n'est present. La verification ayant eu lieu avant minuit a Montreal, sa date de fin minimale conservee est le 4 octobre; la consolidation, assemblee apres minuit, applique son propre filtre au 5 octobre. Pour les geometries auto, les 1 730 impacts deja connus sont preserves exactement; seuls 76 nouveaux impacts passent par la resolution. Le cache geobase existant est reutilise, sans reverification generale de toutes les geometries. Les comptes de resolution sont 1 539 resolues, 4 lignes publiees et 263 emprises.

Rues pietonnisees : aucune recherche geographique, aucun nouvel identifiant admissible et aucune reconstruction. Le snapshot UCI reste volontairement celui de l'evenement complet, `selectedDate: null`; le chargeur filtre les dates, et 5 305 restrictions chargees ne signifient pas 5 305 restrictions actuelles. Les generateurs historiques inadaptes a ces verifications sans changement n'ont pas ete relances.

Beaconsfield : les six descriptions completes, identifiants, tableaux `TypeTravaux`, 103 geometries retenues et 391 exclusions concordent. Les exclusions sont 4 echeanciers approximatifs sans statut/date actuelle etabli, 107 travaux termines en juillet, 142 reperes avec la date invalide publiee « 32 octobre 2026 » et 138 travaux termines le 2 octobre. Les 103 reperes retenus couvrent 13 rehabilitations sanitaires et 90 inspections sanitaires. Aucune correction inventee de la date invalide; aucun usage du generateur historique a fenetres fixes.

PJCCI : les 14 reponses POST cumulatives totalisent 1 049 occurrences, dedoublonnees en 139 URL uniques, sans conflit. Les champs des deux parents actifs et les quatre entrees carte sont compares integralement. Les segments, `asOf`, comptes historiques de construction et provenances geometriques restent intacts; les comptes recus de cette verification sont ceux du tableau. Les sept segments sans trace sont `pepsc-local`, `pepsc-access-bonaventure`, `sortie-3-vers-sud`, `gaetan-laberge-vers-sud`, `gaetan-laberge-vers-centre-ville`, `voies-victoria-clement-vers-sud` et `voies-victoria-clement-vers-centre-ville`. Le generateur historique aux dates et ensembles OSM rejetes n'a pas ete execute.

Citoyens : toutes les lignes et les 14 colonnes sont analysees ensemble, dont le texte libre integral et les neuf cellules de contact. Les 13 colonnes exportables concordent avec les fiches existantes. Aucun contact, lien ou identifiant du tableur n'est exporte ni journalise; aucune recherche geographique n'est refaite. Les dates, reserves, horaires, revue et geometries des dix fiches restent identiques. La source reste une declaration, pas un permis municipal confirme.

#### Consolidation du 5 octobre : chaque source

`checked` signifie une reponse live validee, `local-snapshot` une lecture locale et `failed` un echec. Les heures suivantes sont en UTC le 5 octobre, sauf Noovo. Les sept entrees locales datees autres que Noovo ont ete reverifiees en amont dans cette execution, pas par leur simple lecture dans le consolidateur. Les deux listes manuelles restent non datees. Les URL exactes sont conservees dans `sources` du [JSON consolide](../data/pedestrian-closures-snapshot.json).

| Source | Etat | `checkedAt` ou `sourceExtractedAt` | Recus / retenus / revue |
| --- | --- | --- | --- |
| Montreal | checked | `04:09:10.017Z` | 1 815 / 1 155 / 0 |
| Longueuil | checked | `04:09:17.068Z` | 352 / 0 / 93 |
| Dorval | checked | `04:09:18.391Z` | 589 / 0 / 13 |
| Boisbriand | checked | `04:09:19.374Z` | 68 / 0 / 10 |
| Saint-Eustache lignes | checked | `04:09:20.192Z` | 166 / 0 / 20 |
| Saint-Eustache points | checked | `04:09:21.260Z` | 318 / 0 / 22 |
| Chateauguay | checked | `04:09:22.090Z` | 40 / 0 / 0 |
| L'Assomption | checked | `04:09:22.711Z` | 8 / 0 / 0 |
| Terrebonne lignes | checked | `04:09:23.195Z` | 7 / 2 / 2 |
| Terrebonne points | checked | `04:09:23.585Z` | 2 / 0 / 0 |
| Mont-Saint-Hilaire 3 | checked | `04:09:24.753Z` | 1 / 0 / 1 |
| Mont-Saint-Hilaire 4 | checked | `04:09:25.183Z` | 1 / 0 / 1 |
| Mont-Saint-Hilaire 5 | checked | `04:09:25.585Z` | 1 / 0 / 1 |
| Mont-Saint-Hilaire 6 | checked | `04:09:25.892Z` | 1 / 0 / 1 |
| Mont-Saint-Hilaire 15 | checked | `04:09:26.339Z` | 1 / 0 / 1 |
| MTMD chantiers | checked | `04:09:27.135Z` | 553 / 0 / 2 |
| MTMD evenements | checked | `04:09:27.642Z` | 20 / 0 / 0 |
| Repentigny | failed, `ECONNRESET` | Aucune verification reussie enregistree | Non recu / 0 / sans objet |
| Laval | checked | `04:09:28.617Z` | 147 / 2 / 6 |
| Mont-Royal | local-snapshot | `03:49:21.773Z` | 11 / 5 / 0 |
| Beaconsfield | local-snapshot | `04:06:28.625Z` | 2 / 0 / 0 |
| PJCCI | local-snapshot | `04:05:26.350Z` | 9 / 0 / 0 |
| Citoyens | local-snapshot | `04:00:15.436Z` | 10 / 0 / 1 |
| Noovo, verification incomplete | local-snapshot | `2026-09-08` | 3 / 0 / 0 |
| Rues pietonnisees | local-snapshot | `03:55:55.374Z` | 17 / 0 / 8 |
| UCI | local-snapshot | `03:55:53.660Z` | 5 305 / 0 / 0 |
| Listes regionales | local-snapshot | Non datees | 7 / 0 / 0 |
| Villes liees | local-snapshot | Non datees | 25 / 0 / 4 |
| Details Montreal, libelles et attributs | local-snapshot | `03:51:53.404Z` | 965 / 0 / sans compte de revue |

Bilan : 18 flux verifies, 10 entrees locales et un flux en echec, pas 29 municipalites. Les 1 115 geometries deja presentes sont identiques. Les 1 164 fiches affichees viennent de Montreal (1 155), Mont-Royal (5), Laval (2) et Terrebonne (2). Les cinq couches Mont-Saint-Hilaire ont ete retrouvees depuis la configuration publiee de l'Experience; leurs projets saisonniers restent dans `review`, sans dates precises ni fermetures inventees. Mont-Saint-Hilaire et Repentigny restent documentaires au catalogue.

#### Limites, controles et fichiers

- Repentigny : `fetch failed (ECONNRESET)` pendant la connexion HTTPS. L'URL officielle est conservee; aucune reponse JSON complete ni remplacement confirme. Aucune ancienne fiche admissible ni verification reussie n'etait disponible dans la base de consolidation. Cet echec ne fait pas perdre les autres sources et ne prouve pas une panne mondiale ou un probleme CORS.
- Noovo : article relu a `2026-10-05T04:07:33.322Z`, mais il annonce Parc du 4 septembre au 4 octobre, contre un debut au 7 septembre dans le snapshot. Il n'etablit pas les heures A-10 `06:30-16:30` ni la fin Champlain `11:30`. L'URL de l'image initialement fournie manque; aucune inspection de cette image. Le fichier et sa date du 8 septembre restent exactement identiques.
- La consolidation ne recupere pas systematiquement toutes les pages editoriales et sections detaillees liees. Les cas Longueuil Roland-Therrien et Louise-Gravel cites dans l'audit precedent n'ont pas ete reverifies ni integres par cette execution. Un flux recu ne garantit donc pas une couverture exhaustive des restrictions pietonnes.
- Les sept fiches manuelles pietonnes restent exactement preservees. L'ancienne divergence Wellington (14 septembre dans le fichier manuel, 21 septembre dans la copie integree) et les dates saisonnieres de repli du chargeur restent signalees, sans correction hors perimetre.
- JSON, identifiants, comptes, dates, provenance par source et geometries finies controles apres generation; egalite exacte hors horodatage pour les six sorties de fraicheur seule; onze dates de catalogue concordantes; absence du tableur prive et des contacts dans les fichiers publics controles. `node --check` execute sur le catalogue, le chargeur partage et les generateurs PJCCI et geometries Montreal requis par l'agent.
- [Validation pietonne](../tools/validate-pedestrian-snapshot.mjs) reussie : unique snapshot d'obstructions, quatre sources affichees, preuves/cotes, zones cochees dans le panneau replie, filtres, FR/EN, ordinateur/mobile et panne simulee sans repli automobile. Aucune erreur JavaScript.
- [Audit commun des popups](../tools/validate-popup-grouping.mjs) reussi : 1 164 fiches pietonnes / 1 040 cartes / 107 groupes fusionnes; 7 761 entrees auto chargees / 7 618 cartes / 118 groupes fusionnes. Clics de couches, identites distinctes, geometries preservees, FR/EN, mobile et centre/zoom de navigation controles. Un echec reseau `ERR_CONNECTION_RESET` est constate sur Auto, sans erreur JavaScript; les totaux charges ne sont pas des nombres d'entraves actuelles visibles.
- Controle Chromium Auto complementaire : sept exemples a 1 400 et 390 px (Mont-Royal, Beaconsfield, PJCCI, Foucher, rue pietonnisee, ligne et emprise Montreal), avec vrais gestionnaires de clic de couches, liens et contenu de popup, bornes d'ecran apres animation et canvas vectoriels non vides. Le controle temporaire initial cliquait une ligne decorative d'un MultiLineString; seule cette sonde hors depot a ete corrigee pour viser la couche interactive. L'interface n'a pas ete modifiee.
- Dix cas du filtre d'horaires citoyen sont testes sur les fiches effectivement chargees : `06:59`, `07:00`, `18:59`, `19:00`, samedi, avant et au debut declare, apres la fin, 31 octobre `23:59` et 1er novembre `00:00`. Fermeture du lundi au vendredi de 7 h a 19 h et stationnement permanent sur la periode declaree restent distincts. Aucune requete au tableur ou au formulaire depuis les cartes.
- Les validations utilisent temporairement `http://127.0.0.1:5501` avec `PEDESTRIAN_VALIDATION_URL`; l'adresse habituelle sur le port 5500 renvoie `UND_ERR_SOCKET` sur ce poste. Aucun `view_image`, capture jointe ni inspection visuelle humaine : les resultats graphiques sont des assertions textuelles Chromium, pas une certification visuelle.
- Le depot etait propre au debut. Lors du controle final, 28 fichiers sous le dossier exclu des nids-de-poule et son generateur portent des changements concurrents, non effectues ni annules par cette actualisation. Sur les 54 empreintes de protection initiales, 26 restent identiques et les 28 differences sont toutes dans ce dossier exclu; seuls leurs octets ont ete compares, sans analyse de donnees ni appel a leurs sources. Leur catalogue est inchange. Les chargeurs Auto/Pietons, les sept fiches manuelles et la liste manuelle regionale sont preserves exactement.

Fichiers modifies par cette execution : les neuf snapshots du tableau autres que Noovo, [le catalogue](../data/sources.js) et le present bilan. Aucun generateur, chargeur ou fichier d'interface modifie par cette execution. Les changements restent locaux; les limites de source, d'acces et de couverture ci-dessus ne sont pas levees par une validation du site.

### Verification des sources du 3 octobre 2026

Cette verification prend pour base les fichiers locaux apres les actualisations precedentes, pas `HEAD`. Les modifications deja presentes sont preservees. Les nids-de-poule, le colmatage, le snapshot UCI et leurs metadonnees sont exclus de cette execution. Le consolidateur reutilise seulement le fichier UCI existant, sans interroger sa source. Aucun commit, push, deploiement ni installation de dependance.

#### Mont-Saint-Hilaire : cinq URL remplacees et verifiees

Les cinq anciennes requetes ci-dessous repondent en HTTP 200 avec un corps JSON d'erreur ArcGIS `{"error":{"code":400,"message":"Invalid URL","details":["Invalid URL"]}}`. Le succes HTTP ne signifie donc pas que la couche existe.

Ancienne base commune :

```text
https://services5.arcgis.com/RupmNFqbsv0VX4xY/arcgis/rest/services/INFO_TRAVAUX_2026_Pour_diffusion_4Septembre2026_WFL1/FeatureServer
```

La [configuration de l'Experience officielle](https://www.arcgis.com/sharing/rest/content/items/f6ea6c5a42f5440c970ec7a8bb5b17d4/data?f=json), intitulee `INFO-TRAVAUX 2026`, reference desormais la Web Map `45659cdda2284bd28228cff888a5be30`. Les [donnees de cette Web Map](https://MontSaintHilaire.maps.arcgis.com/sharing/rest/content/items/45659cdda2284bd28228cff888a5be30/data?f=json) publient les URL suivantes; elles n'ont pas ete obtenues en remplacant une date au hasard dans un nom de service.

| Couche / projet | Ancienne requete, a ajouter a l'ancienne base | Nouvelle URL publiee | Resultat de la lecture complete |
| --- | --- | --- | --- |
| 3, Poste Huard | `/3/query?f=json&where=1%3D1&returnIdsOnly=true` | [FeatureServer/3](https://services5.arcgis.com/RupmNFqbsv0VX4xY/arcgis/rest/services/INFO_TRAVAUX_2026_Pour_diffusion_10Septembre2026_WFL1/FeatureServer/3) | 1 objet, Point, `Automne 2026` |
| 4, rue du Parc | `/4/query?f=json&where=1%3D1&returnIdsOnly=true` | [FeatureServer/4](https://services5.arcgis.com/RupmNFqbsv0VX4xY/arcgis/rest/services/INFO_TRAVAUX_2026_Pour_diffusion_10Septembre2026_WFL1/FeatureServer/4) | 1 objet, Polyline, `Automne 2026` |
| 5, rue Fortier | `/5/query?f=json&where=1%3D1&returnIdsOnly=true` | [FeatureServer/5](https://services5.arcgis.com/RupmNFqbsv0VX4xY/arcgis/rest/services/INFO_TRAVAUX_2026_Pour_diffusion_10Septembre2026_WFL1/FeatureServer/5) | 1 objet, Polyline, `Été 2026` |
| 6, rue Chénier | `/6/query?f=json&where=1%3D1&returnIdsOnly=true` | [FeatureServer/6](https://services5.arcgis.com/RupmNFqbsv0VX4xY/arcgis/rest/services/INFO_TRAVAUX_2026_Pour_diffusion_10Septembre2026_WFL1/FeatureServer/6) | 1 objet, Polyline, `Été 2026` |
| 15, Flanc nord | `/15/query?f=json&where=1%3D1&returnIdsOnly=true` | [FeatureServer/15](https://services5.arcgis.com/RupmNFqbsv0VX4xY/arcgis/rest/services/INFO_TRAVAUX_2026_Pour_diffusion_10Septembre2026_WFL1/FeatureServer/15) | 1 objet, Polygon, `Été-Automne 2026` |

Pour chaque couche : liste complete d'identifiants, attributs complets, absence de troncature, geometrie presente, sortie `outSR=4326` et en-tete CORS `*` verifies. La carte publie aussi la limite municipale (9, pas un chantier) et une ligne Chemin des Patriotes (18, `InfoTravaux: null`, `Alternance: Oui`, sans dates); ces couches ne sont pas substituees aux cinq flux recherches.

`montSaintHilaireLayers()` dans [le consolidateur](../tools/build-pedestrian-snapshot.mjs) suit maintenant l'Experience puis sa Web Map a chaque execution, controle le portail et l'organisation ArcGIS, retrouve les cinq identifiants attendus et utilise leurs URL publiees. Une couche absente, ambigue ou un portail inattendu provoque un echec explicite, sans URL devinee. [Le catalogue](../data/sources.js) et `LIVE_SOURCES.montSaintHilaireWorks` dans [le chargeur](../js/app.js) portent la derniere base effectivement verifiee.

Les cinq objets ne publient pas de dates precises ni de restriction pietonne explicite. Ils sont donc conserves dans `review` avec leur projet, echeancier, texte et URL, mais ne deviennent pas des fermetures. L'ancien normalisateur automobile qui transformait les saisons en dates precises et attribuait systematiquement une voie touchee a ete retire. Mont-Saint-Hilaire reste documentaire (`inMap: false`) tant qu'une restriction admissible n'est pas etablie.

#### Repentigny : adresse officielle retrouvee, connexion securisee en echec

Liens exacts utiles pour poursuivre la recherche :

- [API Open511 en echec](https://info-travaux.ville.repentigny.qc.ca/api/events/).
- [Carte Info-travaux en echec](https://info-travaux.ville.repentigny.qc.ca/).
- [Page municipale Travaux d'infrastructures](https://repentigny.ca/services/citoyens/entretien-circulation/travaux-dinfrastructures) et [Grands projets](https://repentigny.ca/la-ville/a-propos/grands-projets) : elles renvoient encore vers cette meme carte.
- [Jeu officiel Info-travaux (API) sur Donnees Quebec](https://www.donneesquebec.ca/recherche/api/3/action/package_show?id=a201ab69-0777-4a93-abed-ed89eaab7fa2) : meme adresse, ressource HTML de la carte Open511. La recherche ArcGIS publique a aussi retourne l'element `d8f725a006114dde8aa509ad4c7d5659`, qui renvoie vers un ancien avis du meme hote, pas vers une nouvelle API.

Constats de transport : le nom se resout en IPv4 `206.162.182.85`; Node renvoie `ECONNRESET` et Chromium `ERR_CONNECTION_RESET` avant une reponse HTTP sur HTTPS. Le test TLS 1.2 echoue par reinitialisation; TLS 1.3 renvoie une alerte de negociation. Une requete HTTP non securisee recoit un `301` de nginx vers `https://info-travaux.ville.repentigny.qc.ca:443/api/events/`, qui est le meme service HTTPS en echec. Passer en HTTP n'est donc pas un remplacement fonctionnel.

Le stade de l'echec est identifie : connexion HTTPS/TLS, pas JSON invalide, pagination ou erreur CORS du navigateur. Ces controles ne permettent pas d'attribuer avec certitude l'interruption au serveur municipal ou a un intermediaire reseau. Aucun nouvel endpoint n'est confirme. L'URL existante reste dans l'extraction pour permettre une reprise du service; l'erreur conserve maintenant sa cause reseau dans le snapshot. Le catalogue ne presente pas Repentigny comme une source actuellement affichee. Avant de le reactiver, verifier une reponse Open511 complete et des fiches effectivement chargees, pas seulement la page municipale.

#### Snapshots du perimetre

Les heures suivantes sont en UTC le 3 octobre 2026 (`Z`), soit UTC moins quatre heures a Montreal. Les sept snapshots verifies sans changement sont identiques octet pour octet a la base de cette intervention apres exclusion du seul `extractedAt`. Leurs dix entrees de fraicheur du catalogue concordent. Les modifications de contenu des actualisations precedentes restent presentes.

| Snapshot / source publique | Etat de cette verification | Derniere verification reussie | Recus / retenus et exclusions | Geometries conservees |
| --- | --- | --- | --- | --- |
| [Mont-Royal](https://montroyal.opatech.ca/#/public?city=montroyal) | Verifie sans changement | `2026-10-03T07:47:32.886Z` | 14 projets / 11; 3 expires | 7 LineString, 4 MultiLineString |
| [Geometries Montreal](https://donnees.montreal.ca/dataset/info-travaux) | Verifie sans changement | `2026-10-03T07:47:55.172Z` | 1 762 permis / 2 080 impacts; 0 nouvelle resolution | 1 770 LineString, 3 MultiLineString, 307 emprises Polygon |
| [Avis pietons Montreal](https://montreal.ca/entraves-travaux/entraves) | Verifie sans changement | `2026-10-03T07:49:18.409Z` | 209 pages, 2 087 resultats / 935 avis; filtrage zones et dates | Attributs et libelles, pas de geometrie propre |
| [Declarations citoyennes, non officielles](https://forms.gle/TKL6WkmPsWPmAUMV8) | Verifie sans changement | `2026-10-03T07:52:10.462Z` | 9 reponses, 14 colonnes / 10 fiches, 11 impacts; 7 fiches en attente, 4 impacts admissibles | 3 LineString, 1 MultiLineString, 6 sans trace |
| [Rues pietonnisees Montreal](https://donnees.montreal.ca/api/3/action/datastore_search?resource_id=ef2a8162-0644-47e7-bd03-bea33f14a5d2&limit=100) | Verifie sans ajout | `2026-10-03T07:54:10.685Z` | 53 projets / 10 temporaires; 43 modes exclus, 0 nouvel identifiant; 7 fiches manuelles preservees | 7 LineString, 3 Point; 7 lignes manuelles |
| [Beaconsfield](https://www.beaconsfield.ca/fr/carte-interactive/info-travaux) | Verifie sans changement | `2026-10-03T07:54:40.180Z` | 78 POI, 6 couches, 494 reperes KML / 103 reperes dans 2 fiches; 391 exclusions relues | 2 MultiLineString |
| [PJCCI archive](https://jacquescartierchamplain.ca/fr/structures/archive-des-avis-de-travaux-et-chantiers/) et [carte](https://jacquescartierchamplain.ca/fr/circulation-routiere/secteur-bonaventure/) | Verifie sans changement | `2026-10-03T07:56:40.222Z` | 141 parents uniques / 2 actifs, 9 segments; 139 historiques exclus; 4 entrees carte identiques | 1 LineString, 1 MultiLineString, 7 sans trace |
| [Noovo, non officiel](https://www.noovomoi.ca/tendances/infos-pratiques/article/cyclisme-a-montreal-voici-les-rues-et-secteurs-a-eviter-en-septembre/) | Verification incomplete, fichier preserve | `2026-09-08`, heure et fuseau absents | Article relu / 3 fiches conservees; preuve image et certains horaires non verifies | 2 LineString, 1 sans geometrie stockee |
| [Consolide pieton](../data/pedestrian-closures-snapshot.json) | Modifie, un flux encore en echec | Assemblage `2026-10-03T08:00:58.037Z` | 29 entrees sources / 1 149 fiches; 186 candidats en revue | 1 140 Polygon, 6 LineString, 3 MultiLineString |

Beaconsfield : les six descriptions completes, les identifiants et les champs `TypeTravaux` des tableaux HTML integres aux KML, les 103 geometries retenues et les 391 exclusions ont ete compares. La date source invalide « 32 octobre 2026 » reste exclue. Les periodes terminees le 2 octobre restent exclues. Le generateur historique a dates fixes n'a pas ete execute.

PJCCI : le POST `request=loadmore&articlelimit=...&all=...` renvoie des listes cumulatives (10, 20, puis jusqu'a 141 avis), pas des pages disjointes. Les 15 reponses contiennent 1 191 occurrences et 141 URL uniques, sans conflit d'attributs. Les deux parents actifs et les quatre objets `interactiveMapEntraves[].raw` concordent avec le snapshot. Son `asOf` et ses compteurs historiques d'extraction restent ceux du contenu conserve; les comptes de la presente verification sont ceux de ce tableau. Les sept segments sans trace restent `pepsc-local`, `pepsc-access-bonaventure`, `sortie-3-vers-sud`, `gaetan-laberge-vers-sud`, `gaetan-laberge-vers-centre-ville`, `voies-victoria-clement-vers-sud` et `voies-victoria-clement-vers-centre-ville`. Aucun nouvel appel geometrique ni nouvelle date de provenance geographique.

Le generateur PJCCI historique contient encore des dates de segments codees en dur et des ensembles OSM deja rejetes dans `validation.rejectedPreviousGeometry`. Il n'a pas ete relance. Une prochaine execution doit suivre la comparaison complete archive/carte de [l'agent de snapshots](../.github/agents/snapshots-municipaux.agent.md), et ne pas remplacer les segments valides par sa reconstruction actuelle. Les avis Montreal disposent maintenant d'une protection de conservation : [leur generateur](../tools/build-montreal-pedestrian-notices.mjs) ne reecrit que l'horodatage si les fiches et les libelles n'ont pas change, meme si les compteurs techniques de collecte different.

#### Consolidation : detail par source

`checkedAt` date une verification live; `sourceExtractedAt` est la date de l'entree locale reutilisee. Les six entrees locales reverifiees dans cette intervention le sont en amont, jamais par la simple lecture du consolidateur; le snapshot de geometries Montreal est utilise par la carte auto, pas comme entree de cette consolidation. Les URL completes figurent dans `sources` du JSON.

| Source | Etat | Heure UTC ou date de l'entree | Recus / retenus / revue |
| --- | --- | --- | --- |
| Montreal | checked | `08:00:41.504Z` | 2 087 / 1 140 / 0 |
| Longueuil | checked | `08:00:44.000Z` | 352 / 0 / 93 |
| Dorval | checked | `08:00:45.634Z` | 589 / 0 / 13 |
| Boisbriand | checked | `08:00:46.478Z` | 68 / 0 / 10 |
| Saint-Eustache lignes | checked | `08:00:47.328Z` | 166 / 0 / 20 |
| Saint-Eustache points | checked | `08:00:48.538Z` | 318 / 0 / 22 |
| Chateauguay | checked | `08:00:49.167Z` | 40 / 0 / 0 |
| L'Assomption | checked | `08:00:49.766Z` | 8 / 0 / 0 |
| Terrebonne lignes | checked | `08:00:50.306Z` | 7 / 2 / 2 |
| Terrebonne points | checked | `08:00:50.687Z` | 2 / 0 / 0 |
| Mont-Saint-Hilaire 3 | checked | `08:00:52.566Z` | 1 / 0 / 1 |
| Mont-Saint-Hilaire 4 | checked | `08:00:52.789Z` | 1 / 0 / 1 |
| Mont-Saint-Hilaire 5 | checked | `08:00:53.059Z` | 1 / 0 / 1 |
| Mont-Saint-Hilaire 6 | checked | `08:00:53.327Z` | 1 / 0 / 1 |
| Mont-Saint-Hilaire 15 | checked | `08:00:53.590Z` | 1 / 0 / 1 |
| MTMD chantiers | checked | `08:00:54.364Z` | 567 / 0 / 2 |
| MTMD evenements | checked | `08:00:54.844Z` | 25 / 0 / 0 |
| Repentigny | failed, `ECONNRESET` | Aucune verification reussie enregistree | Non recu / 0 ancienne fiche conservee |
| Laval | checked | `08:00:55.782Z` | 153 / 2 / 6 |
| Mont-Royal | local-snapshot | `07:47:32.886Z` | 11 / 5 / 0 |
| Beaconsfield | local-snapshot | `07:54:40.180Z` | 2 / 0 / 0 |
| PJCCI | local-snapshot | `07:56:40.222Z` | 9 / 0 / 0 |
| Citoyens | local-snapshot | `07:52:10.462Z` | 10 / 0 / 1 |
| Noovo | local-snapshot, non reverifie entierement | `2026-09-08` | 3 / 0 / 0 |
| Rues pietonnisees | local-snapshot | `07:54:10.685Z` | 17 / 0 / 8 |
| UCI | local-snapshot, exclu de la verification | `07:11:00.630Z`, date precedente preservee | 5 305 / 0 / 0 |
| Listes regionales | local-snapshot, non date | Aucune | 7 / 0 / 0 |
| Villes liees | local-snapshot, non date | Aucune | 25 / 0 / 4 |
| Details Montreal | local-snapshot, libelles | `07:49:18.409Z` | 935 / 0 / sans objet |

Bilan : 18 verifications live reussies, 10 entrees locales reutilisees et un echec. Les cinq nouveaux candidats Mont-Saint-Hilaire expliquent le passage de 181 a 186 entrees en revue; aucun n'est affiche comme une fermeture. La collecte ne consulte toujours pas systematiquement toutes les pages editoriales liees, notamment les avis Longueuil cites dans les bilans anterieurs. Ce n'est pas une verification exhaustive des conditions pietonnes sur le terrain.

#### Limites et controles executes

- Noovo : le texte obtenu a `2026-10-03T07:58:53.859Z` annonce Parc du 4 septembre au 4 octobre, alors que le snapshot commence au 7 septembre. Le texte ne justifie pas les horaires A-10 `06:30-16:30` ni la fin Champlain `11:30`. Le snapshot mentionne une image fournie sans en conserver une URL identifiable. Ses trois fiches et sa date restent donc intactes; l'article seul ne constitue pas une reverification complete. Aucune inspection visuelle des images n'a ete effectuee.
- Les sept fiches manuelles pietonnes et leurs geometries sont preservees exactement. Une divergence preexistante reste explicite : Wellington finit le 14 septembre dans le fichier manuel et le 21 septembre dans sa copie integree. Aucune date n'a ete choisie silencieusement. Le chargeur des dix projets CKAN contient aussi des dates saisonnieres de repli preexistantes; cette verification des fichiers ne certifie pas ces dates comme publiees.
- JSON, identifiants uniques, dates, geometries finies et comptes de consolidation controles. Les sept mises a jour de fraicheur seule sont identiques octet pour octet hors horodatage. Les fichiers UCI, nids-de-poule, manuels et `.gitignore` proteges sont identiques aux empreintes prises au debut de cette intervention.
- Les 14 colonnes citoyennes ont ete lues; les 13 colonnes publiques de chaque reponse concordent avec `reportedFields`. Les contacts et l'identifiant du tableur ne sont ni exportes ni journalises. Les trois fiches admissibles donnent quatre impacts charges, soumis aux filtres de la carte; les sept autres restent en attente.
- [L'audit de regroupement](../tools/validate-popup-grouping.mjs) passe sur les deux cartes : 1 149 fiches pietonnes / 1 022 cartes / 109 groupes fusionnes, et 8 068 entrees auto / 7 907 cartes / 134 groupes fusionnes. La navigation choisit maintenant l'autre carte sans confondre le bouton Statistiques; le test attend aussi la transition responsive avant de rouvrir un popup.
- Chromium : sept popups auto par largeur, a 1 400 et 390 px, pour Mont-Royal, Beaconsfield, PJCCI, citoyens, rues pietonnisees et les lignes/polygones Montreal. Contenu present, canvas vectoriels non vides, popups contenus dans la carte, aucune erreur JavaScript. Les horaires Foucher sont testes a `06:59`, `07:00`, `18:59`, `19:00`, le samedi et apres la fin declaree; fermeture et stationnement restent distincts.
- Les quatre parcours `/fr/pedestrian.html` et `/en/pedestrian.html`, a 1 400 et 390 px, chargent uniquement le snapshot commun, affichent 1 149 impacts et un flux en echec. Aucune requete au tableur ou au formulaire citoyen.
- FAQ FR/EN : textes, liens et catalogue controles. Un debordement mobile preexistant de 688 px sur un ecran de 390 px est reproduit avant et apres ces modifications, dans les deux langues; il n'est pas corrige dans cette intervention de sources. Aucune nouvelle erreur JavaScript. Aucun `view_image` ni capture jointe au chat; les controles graphiques sont des mesures Chromium, pas une inspection visuelle humaine.

### Reprise du 2 octobre 2026, UTC

Reprise locale de l'actualisation interrompue par la fermeture de VS Code. Aucun commit, push, deploiement, ajout de dependance ni changement d'interface. Les heures ci-dessous sont en UTC le 2 octobre, sauf Noovo. Les trois sorties deja generees avant la coupure (Mont-Royal, avis Montreal et geometries Montreal) sont conservees octet pour octet; leurs dates sont synchronisees au catalogue sans nouvelle extraction. Les verifications completes deja reussies pour UCI, les rues pietonnisees et PJCCI sont reprises avec leurs heures originales, sans reconstruction.

**Nids-de-poule et colmatage : traitement anterieur termine.** Le generateur avait fini a 03:55:35.683Z (1er octobre, 23 h 55 a Montreal), en 165,3 secondes, puis le validateur avait termine avec succes a 03:55:42.838Z. Les signalements 2026 comptent 24 015 lignes; les 10 annees de colmatage sont inchangees. Les analyses et les 19 fiches d'arrondissements avaient aussi ete generees et validees. Le validateur comptait 134 407 signalements et 1 027 267 interventions; 50 320 coordonnees de colmatage 2021 invalides restent explicitement exclues des calculs geographiques. Aucun traitement de ce dossier n'est relance pendant la reprise : son empreinte complete est identique avant/apres. Son actualisation reste reservee au prompt dedie.

| Snapshot / source publique | Etat | Derniere verification reussie | Recus / retenus et exclusions | Geometries |
| --- | --- | --- | --- | --- |
| [Mont-Royal](https://montroyal.opatech.ca/#/public?city=montroyal) | Modifie avant coupure; sortie preservee | 03:48:29.581Z | 15 projets / 14; 1 expire | 10 LineString, 4 MultiLineString |
| [Avis pietons Montreal](https://montreal.ca/entraves-travaux/entraves) | Modifie avant coupure; sortie preservee | 03:49:15.037Z | 210 pages, 2 093 resultats / 989 avis selon zone/date; 1 123 permis candidats WFS, aucun doublon de recherche | Sans geometrie propre |
| [Geometries Montreal](https://donnees.montreal.ca/dataset/info-travaux) | Modifie avant coupure; sortie preservee | 03:49:38.793Z | 1 767 permis / 2 059 impacts; 19 impacts de moins que la base precedente, 1 708 identites actuelles inchangees | 1 762 LineString, 3 MultiLineString; 294 emprises officielles |
| [UCI Montreal](https://services.montreal.ca/cartes/uci) | Verifie sans changement de contenu | 03:56:41.993Z | 5 305 restrictions et 17 parcours; deux couches completes et identiques | 5 322 LineString |
| [Rues pietonnisees Montreal, CKAN](https://donnees.montreal.ca/api/3/action/datastore_search?resource_id=ef2a8162-0644-47e7-bd03-bea33f14a5d2&limit=100) | Verifie sans changement de contenu | 03:56:40.171Z | 53 projets / 10 temporaires + 7 fiches manuelles; aucun nouvel identifiant admissible, 43 modes exclus | 7 LineString, 3 Point; 7 lignes manuelles |
| [PJCCI archive](https://jacquescartierchamplain.ca/fr/structures/archive-des-avis-de-travaux-et-chantiers/) et [carte](https://jacquescartierchamplain.ca/fr/circulation-routiere/secteur-bonaventure/) | Verifie sans changement de contenu | 03:52:27.251Z | 143 parents uniques / 2 actifs ou futurs, 9 segments; 141 historiques exclus; 4 entrees carte identiques | 1 LineString, 1 MultiLineString, 7 sans trace |
| [Beaconsfield](https://www.beaconsfield.ca/fr/carte-interactive/info-travaux) | Verifie sans changement de contenu | 04:54:09.199Z | 78 POI / 6 couches, 494 objets KML / 241 objets dans 119 fiches; 253 exclusions confirmees | 3 MultiLineString, 116 Polygon |
| [Citoyens, formulaire non officiel](https://forms.gle/TKL6WkmPsWPmAUMV8) | Modifie | 04:46:21.836Z | 9 reponses, 14 colonnes lues dont 13 publiques / 10 fiches, 11 impacts; 7 fiches en attente, 4 impacts admissibles | 3 LineString, 1 MultiLineString, 6 sans trace |
| [Noovo, non officiel](https://www.noovomoi.ca/tendances/infos-pratiques/article/cyclisme-a-montreal-voici-les-rues-et-secteurs-a-eviter-en-septembre/) | Conserve, non reverifie pendant la reprise | 2026-09-08, heure et fuseau absents | 3 fiches conservees; lien deja traite, aucune nouvelle extraction ni nouvelle date | 2 LineString, 1 sans geometrie stockee |
| [Consolidation pietonne](../data/pedestrian-closures-snapshot.json) | Modifie, verification partielle | Assemblage 04:55:48.649Z; dates par source ci-dessous | 29 entrees sources / 1 070 fiches, 181 candidats en revue | 1 061 Polygon, 6 LineString, 3 MultiLineString |

Beaconsfield : les six fiches detaillees, les 494 identifiants KML, leurs types textuels, les descriptions, les periodes, les 241 geometries retenues et les 253 exclusions concordent avec le snapshot. Les echeanciers approximatifs, les travaux termines et la date source invalide « 32 octobre 2026 » ne sont pas corriges ou reintegres arbitrairement. Le generateur aux dates fixes n'est pas utilise. Les quatre snapshots de fraicheur seule (Beaconsfield, UCI, rues pietonnisees, PJCCI) conservent exactement leur contenu hors `extractedAt`.

Citoyens : les huit reponses precedentes et leurs neuf fiches sont strictement conservees. La neuvieme reponse decrit une circulation locale seulement vers le sud sur la rue Chambly, « entre Rouen et Ontatio », observee le 21 septembre, avec un horaire 24/24 mais sans dates de travaux, lien ni commentaire. Elle est conservee pour revue, sans date ni geometrie inventee et sans correction silencieuse de la seconde limite. Aucune reponse n'est supprimee ou fusionnee. La colonne de contact, le lien et l'identifiant du tableur ne sont pas exportes.

#### Consolidation par source

`checkedAt` date une verification live reussie; la colonne de date des entrees locales est leur propre `sourceExtractedAt`, pas une reverification par le consolidateur. Les dix entrees locales comprennent sept snapshots verifies en amont, Noovo conserve et deux listes manuelles non datees. `generatedAt` date uniquement l'assemblage.

| Source | Etat | Verification live ou date de l'entree locale | Recus / retenus / revue |
| --- | --- | --- | --- |
| Montreal | checked | 04:55:35.094Z | 2 093 / 1 061 / 0 |
| Longueuil | checked | 04:55:37.815Z | 352 / 0 / 93 |
| Dorval | checked | 04:55:38.966Z | 589 / 0 / 13 |
| Boisbriand | checked | 04:55:39.518Z | 68 / 0 / 10 |
| Saint-Eustache lignes | checked | 04:55:40.529Z | 164 / 0 / 20 |
| Saint-Eustache points | checked | 04:55:41.648Z | 317 / 0 / 22 |
| Chateauguay | checked | 04:55:42.312Z | 40 / 0 / 0 |
| L'Assomption | checked | 04:55:42.834Z | 8 / 0 / 0 |
| Terrebonne lignes | checked | 04:55:43.172Z | 7 / 2 / 2 |
| Terrebonne points | checked | 04:55:43.476Z | 2 / 0 / 0 |
| MTMD chantiers | checked | 04:55:45.057Z | 589 / 0 / 2 |
| MTMD evenements | checked | 04:55:45.696Z | 24 / 0 / 0 |
| Laval | checked | 04:55:46.627Z | 140 / 2 / 6 |
| Mont-Saint-Hilaire, couches 3, 4, 5, 6 et 15 | failed, cinq flux | Aucune verification reussie conservee | 0 fiche precedente admissible par flux; erreur ArcGIS 400 « Invalid URL » |
| Repentigny | failed | Aucune verification reussie conservee | 0 fiche precedente admissible; connexion reinitialisee (ECONNRESET) |
| Mont-Royal | local-snapshot | 03:48:29.581Z | 14 / 5 / 0 |
| Beaconsfield | local-snapshot | 04:54:09.199Z | 119 / 0 / 0 |
| PJCCI | local-snapshot | 03:52:27.251Z | 9 / 0 / 0 |
| Citoyens | local-snapshot | 04:46:21.836Z | 10 / 0 / 1 |
| Noovo | local-snapshot | 2026-09-08 | 3 / 0 / 0 |
| Rues pietonnisees | local-snapshot | 03:56:40.171Z | 17 / 0 / 8 |
| UCI | local-snapshot | 03:56:41.993Z | 5 305 / 0 / 0 |
| Liste regionale manuelle | local-snapshot | Non datee | 7 / 0 / 0 |
| Liste municipale manuelle | local-snapshot | Non datee | 25 / 0 / 4 |
| Details Montreal | local-snapshot, etiquettes et attributs | 03:49:15.037Z | 989 / 0 / sans compte de revue |

Bilan : 13 flux verifies en direct, 10 entrees locales reutilisees et 6 echecs correspondant a deux municipalites, pas six. L'erreur Mont-Saint-Hilaire est renvoyee par le service ArcGIS distant dans une reponse JSON HTTP 200; une reponse HTTP reussie seule n'est pas une verification reussie. La reprise n'avance pas les dates des sources echouees. Le consolidateur ne visite toujours pas systematiquement les pages d'avis liees : aucune exhaustivite des descriptions detaillees ni nouvelle verification des exemples Longueuil Roland-Therrien et Louise-Gravel n'est revendiquee. Les 181 candidats ne sont pas des fermetures confirmees.

#### Validations de la reprise

- JSON, comptes, identifiants uniques, references, dates admissibles, geometries finies et provenance par source controles. Onze entrees de fraicheur au catalogue sont synchronisees; les autres entrees, notamment les nids-de-poule, restent intactes.
- `PEDESTRIAN_VALIDATION_URL=http://localhost:5501 node tools/validate-popup-grouping.mjs` : reussite sur 1 070 fiches pietonnes et 8 161 entrees auto chargees; aucune perte d'identite, de geometrie ou d'impact distinct. Popups cliques, FR/EN, mobile et cadrage au changement de carte controles; aucune erreur JavaScript. Un avertissement reseau auto de connexion reinitialisee subsiste.
- `PEDESTRIAN_VALIDATION_URL=http://localhost:5501 node tools/validate-pedestrian-snapshot.mjs` : reussite sur les quatre sources affichees; snapshot unique sans requetes municipales directes, cotes publies, popups, FR/EN, filtres, mobile et panne simulee sans repli automobile. Le validateur est adapte au panneau « Zones touchees » replie et a un vrai chargement mobile; l'interface n'est pas modifiee.
- Citoyens : quatre impacts charges, nouvelle fiche Chambly hors carte, sept cas d'horaires de fermeture et quatre de stationnement verifies, fuseau local confirme, popup Foucher avec texte et reserves, aucune requete au tableur depuis le navigateur.
- Noovo, les sept geometries manuelles pietonnes et tout `data/nids-de-poule/` sont identiques avant/apres la reprise. Les captures de test restent hors depot, sans piece jointe ni inspection visuelle dans le chat.
- Limite d'interface preexistante constatee, non corrigee dans cette actualisation : l'attribut ARIA du menu desktop peut persister lors d'un simple passage au viewport mobile sans rechargement. Le chargement mobile reel et l'ouverture/fermeture du menu passent les tests.

Fichiers de donnees modifies pendant cette reprise : `data/sources.js`, `data/beaconsfield-snapshot.json`, `data/citizen-reports-snapshot.json`, `data/montreal-pedestrian-snapshot.json`, `data/montreal-uci-closures-snapshot.json`, `data/pjcci-work-advisories-snapshot.json` et `data/pedestrian-closures-snapshot.json`. Les deux validateurs ci-dessus et ce bilan sont aussi ajustes. Les modifications deja presentes avant la reprise sont preservees. Ces verifications des sources ne confirment pas les conditions sur le terrain; rien n'est publie.

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

Ce snapshot est chargé par `js/app.js` et son entrée au catalogue est active (`inMap: true`), sous le filtre distinct « Signalements citoyens ». Le chargeur lit seulement le JSON local, jamais Google Sheets ni le formulaire, et isole les échecs des autres sources. Chaque impact admissible ayant une géométrie vérifiée produit une entrée distincte sans reconstruire son tracé. Depuis le 5 octobre 2026, le filtre « Stationnement impacté » est coché par défaut, comme pour les autres sources.

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
- Integration Open511 de Repentigny : l'adresse officielle reste configuree, mais sa connexion HTTPS est en echec lors du controle du 3 octobre 2026. Aucun remplacement n'est confirme; voir le diagnostic detaille ci-dessus.
- Chargement en direct des entraves ArcGIS de Saint-Eustache (lignes et points), de Châteauguay (polygones) et de L'Assomption (incidents ponctuels), avec filtrage des travaux termines, expires ou sans impact automobile.
- Chargement en direct des entraves actives de Dorval et des travaux dates de Boisbriand depuis leurs couches ArcGIS officielles, avec geometries ponctuelles et filtrage des enregistrements historiques ou de test.
- Chargement en direct des entraves Terrebonne depuis ses couches ArcGIS publiques de lignes et points, avec statut actif, dates, types d'entrave, horaires, circulation et détours publiés.
- Mont-Saint-Hilaire : les cinq couches ArcGIS de projets sont retrouvees par l'Experience officielle lors de la consolidation. Elles restent documentaires et en revue tant que les dates et les impacts necessaires ne sont pas publies; les saisons ne sont plus converties en dates automobiles inventees.
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
