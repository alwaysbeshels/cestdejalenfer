# Marathon Beneva de Montreal 2026 : analyse des fermetures

Analyse locale du 5 octobre 2026. Guide recoupe a `2026-10-05T14:39:33.446Z`; six parcours RTRT verifies a `2026-10-05T15:09:35.472Z`; PDF recharge et verifie a `2026-10-05T15:59:03.349Z`. Aucune publication effectuee par cette integration.

## Conclusion

Les collections originales du [fichier fourni](../data/Marathon-Beneva-Mtl-2026.json) contiennent **88 fermetures directionnelles, sur 76 segments et 11 voies**, toutes le **samedi 10 octobre 2026**. Elles restent identiques, ainsi que les six parcours conserves dans `officialCourseReference`.

Le complement `officialClosureReference` rapproche maintenant les **20 plages horaires du PDF** des geometries RTRT. Il ajoute **69 groupes routiers** a la carte automobile : **15 le samedi 10 et 54 le dimanche 11**. Il ajoute aussi **3 groupes de chemins** au snapshot pieton consolide : deux le samedi, un le dimanche. Un groupe rassemble une voie et une plage horaire, parfois plusieurs parties disjointes ou plusieurs courses; ce ne sont pas 69 rues distinctes.

**La couverture geometrique reste partielle : 297 aretes RTRT sont reservees a la verification**, dont 66 transitions horaires ambigues et 231 identifications de rue/chemin non confirmees. Les heures ne manquent plus pour les deux pages du PDF; ce sont ces rattachements precis qui restent incomplets. Le 9 octobre est exclu des fermetures a ajouter selon la clarification de l'utilisatrice : exposition interieure, sans fermeture. Aucune fermeture generale du parc ou du jardin n'est deduite.

## Fichier fourni

| Controle | Resultat |
| --- | --- |
| Taille originale | 1 017 823 octets |
| Taille apres ajout des references RTRT, avant le complement PDF | 1 110 147 octets |
| Taille avec le complement PDF | 1 443 240 octets |
| Fermetures Waze originales | 88 identifiants distincts; 88 `LineString` valides |
| Segments | 76 identifiants, tous retrouves par `segID` |
| Noms de rues | Jointure `segID` → `segments.id` → `primaryStreetID` → `streets.id` |
| Municipalite | `streets.cityID` → `cities.id` : Montreal |
| Dictionnaire de rues | 12 entrees, dont l'alias secondaire Rte 138; 11 noms primaires utilises |
| Directions | 51 `forward: true`, 37 `forward: false` |
| Noeuds | Les extremites des 88 lignes concordent avec les noeuds de reference; 8 enregistrements portent `fromNodeClosed: true` |
| Type | `closureType: SEGMENT` pour les 88 fermetures |
| Statut | `closureStatus: NOT_STARTED` pour les 88 fermetures |
| Attribution | `WME_COMMUNITY_EDITOR`; pas de fournisseur externe identifie |
| Extraction | Pas de date d'extraction ni de fuseau horaire explicites |

Une fermeture directionnelle n'est pas une rue distincte. Un meme segment peut porter deux fermetures de sens differents; ces enregistrements ne sont pas supprimes comme doublons.

L'objet `majorTrafficEvents` porte un intervalle du 10 octobre a 02:00 au 11 octobre a 16:25, mais cela ne cree aucune fermeture routiere du 11 dans `roadClosures.objects`. Ses indicateurs sont `published: false`, `ready: false`, `active: false`. Ce sont les indicateurs du conteneur d'evenement dans cet export, pas une preuve d'annulation du marathon ni une verification de la publication courante des fermetures.

SHA-256 du fichier original avant ajout de la section RTRT :

```text
754cb10a6ff8f61d8a4f76074fa389abb2fcdeccdc9988498db08aa036b075c7
```

## Inventaire routier importe

Toutes les dates ci-dessous sont le **10 octobre 2026**. Les ensembles d'heures resumes ne remplacent pas les horaires propres a chaque identifiant; ils ne signifient pas que toutes les combinaisons debut/fin existent.

| Voie dans le JSON | Fermetures | Segments | Debuts | Fins |
| --- | ---: | ---: | --- | --- |
| Boul Rosemont | 36 | 36 | 07:45, 08:45 | 12:19 |
| Rue Viau | 18 | 16 | 07:45 | 12:19, 12:29 |
| Rue Beaubien Est | 12 | 6 | 08:45 | 11:34, 12:09 |
| Rue de Bellechasse | 4 | 4 | 08:45 | 11:29 |
| Rue St-Zotique Est | 4 | 2 | 08:45 | 12:04 |
| 44e Av | 4 | 3 | 08:45 | 12:14 |
| Rue Sherbrooke Est | 3 | 3 | 04:00, 06:45 | 12:29, 12:34 |
| 43e Av | 3 | 3 | 08:45 | 12:04 |
| 31e Av | 2 | 1 | 08:45 | 11:29 |
| 41e Av | 1 | 1 | 08:45 | 11:59 |
| 35e Av | 1 | 1 | 08:45 | 11:39 |

Le normalisateur ne cree aucun trajet entre ces segments. Il conserve leurs sommets et inverse seulement leur ordre quand `forward` est faux, afin que les fleches correspondent au sens de fermeture. Aucune direction cardinale n'est inventee : le popup fournit les noeuds de reference et indique que la direction cardinale n'est pas publiee.

## Depliant officiel

Source : [Depliant des fermetures 2026](https://couronsmtl.com/wp-content/uploads/2026/09/Depliant-Fermetures-de-rues-2026-web.pdf), egalement lie depuis les pages de l'organisateur.

Le document comporte deux pages. Ses metadonnees indiquent une creation le 24 septembre 2026 a 15:59:50, decalage -04:00; ce n'est pas une date de verification des fermetures. SHA-256 du PDF consulte :

```text
07303c423b638b5b5b858e0d4b12515139acb39a8827bf7a9a8567324d156269
```

La lecture a combine `pdftotext` en modes disposition et brut, l'examen des objets PDF avec PyMuPDF, et l'OCR Windows francais sur les quatre demi-pages rendues a 288 ppp. Aucun logiciel supplementaire n'a ete installe. Les rendus et l'OCR sont des outils de lecture, pas des geometries geographiques.

| Information confirmee | Consequence |
| --- | --- |
| Page 1 : courses 1, 5 et 10 km du samedi 10 octobre | Coherent avec la journee des 88 fermetures fournies, sans garantir que l'export couvre tout le parcours |
| Page 2 : marathon et demi-marathon du dimanche 11 octobre | Absents de l'export Waze initial; 54 groupes routiers PDF sont maintenant integres |
| Stationnement interdit le samedi 10 octobre de 00:01 a 12:00 sur le parcours 10 km | Information absente des 88 fermetures routieres; ce n'est pas une fermeture automobile de 00:01 a 12:00 |
| Stationnement interdit du samedi 10 octobre a 22:00 au dimanche 11 octobre a 15:00 sur le parcours du marathon | Autre restriction absente du JSON; ne doit pas devenir une fermeture continue des rues par confusion avec le stationnement |
| Secteur colore du dimanche : entree et sortie en vehicule interdites pendant la fermeture du parcours | Avis automobile; aucune interdiction generale de passage a pied n'est etablie par ce texte |

La premiere extraction textuelle/OCR ne permettait pas d'associer chaque horaire a une section. L'extraction vectorielle resout maintenant ce lien : chaque trait de legende est relie aux objets dessines correspondants, en excluant les surimpressions blanches et l'encart du dimanche. La couleur sert uniquement a suivre une correspondance explicite du document, jamais a deviner la gravite; celle-ci vient du titre publie « HORAIRE RUES FERMEES ».

Les reperes kilometriques servent a caler les parcours RTRT sur les deux pages. Le calage affine robuste utilise 9 reperes le samedi et 24 le dimanche, puis les segments complets, courbes de Bezier comprises. Ecart median : 0,422 point PDF le samedi et 0,518 le dimanche; maxima : 1,910 et 2,733. Ce sont des erreurs dans le document, pas une precision geographique annoncee en metres.

Chaque arete RTRT est testee a cinq positions interieures. Elle n'est retenue que si les cinq positions correspondent a la meme ligne horaire, a moins de 3,5 points PDF et avec une marge d'au moins 0,6 point sur une autre ligne horaire. Une rue ou un chemin doit aussi etre reconnu sur au moins deux des trois echantillons du referentiel geographique, avec orientation compatible. Les coordonnees dessinees restent exclusivement des sommets RTRT consecutifs; aucun point geographique n'est calcule depuis les pixels du PDF et aucune lacune n'est reliee par une diagonale.

Les horaires de fin precis du JSON, par exemple 12:19 ou 12:29, sont conserves tels quels. Ils ne sont pas arrondis aux heures en :20 ou :30 visibles dans le depliant sans verification section par section.

### Horaires extraits

Heure locale de Montreal. Les cellules de debut fusionnees sont associees aux lignes de fin par leurs positions dans le tableau. Les deux lignes du dimanche 06:30-11:45 sont conservees separement car elles designent des sections differentes.

| Page / ligne | Date | Fermeture | Reouverture |
| --- | --- | --- | --- |
| 1 / 1 | 2026-10-10 | 06:45 | 12:35 |
| 1 / 2 | 2026-10-10 | 07:30 | 11:00 |
| 1 / 3 | 2026-10-10 | 07:45 | 12:20 |
| 1 / 4 | 2026-10-10 | 07:45 | 12:30 |
| 1 / 5 | 2026-10-10 | 08:45 | 12:20 |
| 1 / 6 | 2026-10-10 | 08:45 | 11:30 |
| 1 / 7 | 2026-10-10 | 08:45 | 12:15 |
| 2 / 1 | 2026-10-11 | 06:30 | 10:30 |
| 2 / 2 | 2026-10-11 | 06:30 | 11:15 |
| 2 / 3 | 2026-10-11 | 06:30 | 11:45 |
| 2 / 4 | 2026-10-11 | 06:30 | 12:40 |
| 2 / 5 | 2026-10-11 | 06:30 | 11:35 |
| 2 / 6 | 2026-10-11 | 06:30 | 14:30 |
| 2 / 7 | 2026-10-11 | 06:30 | 14:50 |
| 2 / 8 | 2026-10-11 | 06:30 | 15:25 |
| 2 / 9 | 2026-10-11 | 06:30 | 11:45 |
| 2 / 10 | 2026-10-11 | 07:15 | 13:45 |
| 2 / 11 | 2026-10-11 | 07:30 | 13:00 |
| 2 / 12 | 2026-10-11 | 07:30 | 13:35 |
| 2 / 13 | 2026-10-11 | 07:45 | 14:15 |

### Couverture mesuree

Les longueurs suivent les distances progressives publiees par RTRT. Les parcours se recoupent; ne pas additionner ces kilometres pour mesurer un reseau distinct. Une arete est l'intervalle entre deux sommets successifs, pas une fermeture supplementaire.

| Course | Aretes retenues / total | Longueur RTRT | Longueur non dessinee |
| --- | ---: | ---: | ---: |
| 10 km | 104 / 171 | 9,997 km | 1,842 km |
| 5 km | 53 / 104 | 5,000 km | 1,949 km |
| 1 km | 20 / 25 | 1,001 km | 0,017 km |
| Marathon | 465 / 571 | 42,243 km | 2,898 km |
| Demi-marathon | 290 / 358 | 21,081 km | 2,054 km |

Les objets `review` donnent pour chaque exclusion la course, les indices exacts des sommets, les lignes horaires candidates et la raison. Les objets `sections` des groupes retenus donnent les references de rue/chemin, les indices de coordonnees et les ecarts mesures.

## Parc Maisonneuve et Jardin botanique

| Source consultee | Fait observe | Ce que cela ne prouve pas |
| --- | --- | --- |
| [Planifier votre visite](https://couronsmtl.com/marathon-beneva/planifier-votre-visite/) | Depart pres du Jardin botanique et arrivee au parc Maisonneuve; lieux d'accueil et de stationnement indiques | Une fermeture generale du jardin ou de tous les sentiers |
| [Guide coureur](https://couronsmtl.com/marathon-beneva/guide-coureur/) | Acces automobile tres limite; courses et accueil au parc; horaires de fermeture des corrals et zones de recuperation | Les horaires des corrals ou du depot des sacs ne sont pas ceux d'une fermeture de chemin public |
| [Course 10 km](https://couronsmtl.com/courses/marathon/10km/) et [marathon](https://couronsmtl.com/courses/marathon/42km-2/) | Arrivee au parc Maisonneuve; les parcours peuvent etre modifies | Une liste exhaustive des acces pietons interdits |
| [FAQ de l'organisateur](https://couronsmtl.com/marathon-beneva/faq/) | Renvoi aux pages de parcours et contraintes de reouverture des rues | Une fermeture precise de sentier dans le parc ou le jardin |
| [Horaires Espace pour la vie, semaine du 5 octobre](https://espacepourlavie.ca/horaires/2026-W41) | Colonne Jardin botanique : **9 h a 22 h les 10 et 11 octobre**, verifiee dans le tableau rendu a `2026-10-05T14:35:41.430Z` | Que chaque entree et chaque chemin sont accessibles a toute heure |
| [Acces au Jardin botanique](https://espacepourlavie.ca/acces/comment-se-rendre-au-jardin-botanique) | Acces habituel par Pie-IX/Sherbrooke et adresses des entrees; aucun avis marathon precis releve | Une garantie de circulation libre pendant les epreuves |
| [Fiche municipale du parc Maisonneuve](https://montreal.ca/lieux/parc-maisonneuve) | Horaire habituel 6 h a minuit; les indications Ferme consultees concernent notamment ski, patinage et sentier hivernal, avec dates de mars/avril | Une fermeture du parc ou de sentiers estivaux pour le marathon d'octobre |

Les textes des sections repliees du guide ont aussi ete examines. Les fermetures de corrals ou de zones de recuperation des participants ne sont pas converties en entraves pietonnes. Une recherche dans les snapshots locaux d'avis existants ne remplace pas une nouvelle verification de chaque avis municipal; les rapprochements de mots comme le nom d'une entreprise ou le boulevard de Maisonneuve ne constituent pas une preuve concernant le parc.

Le rapprochement vectoriel apporte un complement aux textes ci-dessus : des portions horaires du parcours correspondent a des chemins OSM `footway`, ou a des voies partagees dont `foot=yes/designated` est publie. Les trois groupes ajoutes concernent 07:30-11:00 et 06:45-12:35 le samedi, puis 06:30-15:25 le dimanche. La popup parle des portions occupees par la course, pas de la fermeture de tous les acces ni de tout le parc.

Les services Overpass ont echoue lors du controle. L'API publique OSM a ensuite fourni les geometries, en quatre petites zones respectant sa limite de 50 000 noeuds par requete. La geobase municipale, utilisee pour les noms et types de rues, est une copie locale recuperee le 1er octobre, non reverifiee en reseau pendant cette integration. Une piste de Bellechasse sans acces pieton explicite n'est pas traitee comme chemin pieton; le passage proche de l'autoroute 10 ne suffit pas a annoncer une fermeture d'autoroute.

## Complement RTRT

La [carte fournie](https://track.rtrt.me/map/CM-BENEVA-MONTREAL-2026) charge les donnees dans une iframe sur `app.rtrt.me`. Les reponses utilisees par le widget sont :

- `https://api.rtrt.me/events/CM-BENEVA-MONTREAL-2026/map`
- `https://api.rtrt.me/events/CM-BENEVA-MONTREAL-2026/conf`

Les six objets `layers.courses` sont publics et appartiennent a l'evenement `CM-BENEVA-MONTREAL-2026`. Leurs tableaux `polymap` donnent directement les longitudes et latitudes, sans tracage manuel ni calcul d'itineraire. Le fuseau publie est `America/Montreal`; la version de carte `tsu` correspond a `2026-10-02T22:57:52.000Z`. Les cles internes de trois parcours contiennent encore 2025; elles sont preservees, sans en deduire une date differente de l'evenement 2026 qui les publie.

| Course | Date de course | Depart publie | Sommets RTRT |
| --- | --- | --- | ---: |
| Le Mile ON | 2026-10-09 | 18:00 | 59 |
| 1 km | 2026-10-10 | 11:15 | 26 |
| 5 km - Sports Experts | 2026-10-10 | 08:30 | 105 |
| 10 km - Fondation du cancer du sein du Quebec | 2026-10-10 | 09:45 | 172 |
| Demi-marathon Shop Sante | 2026-10-11 | 07:45 | 359 |
| Marathon | 2026-10-11 | 07:45 | 572 |

Les dates et departs ont ete recoupes sur les six [pages de courses de l'organisateur](https://couronsmtl.com/courses/marathon/42km-2/), respectivement `le-mile`, `1km`, `5km`, `10km`, `21km`, `42km-2`. Ce sont **des horaires de depart de course**, annonces comme sujets a changement, pas des heures de fermeture ni de reouverture des rues. Les autres couches RTRT consultees sont des ravitaillements, encouragements, transports, sites de depart et d'arrivee; aucune couche d'horaires de fermeture routiere n'y a ete identifiee.

Le [generateur de reference](../tools/build-marathon-course-reference.mjs) ajoute cette section au JSON, sans modifier les objets Waze. Il passe par les reponses du widget public : un appel direct ayant repondu HTTP 200 ne contenait pas les donnees attendues et a ete rejete avant toute ecriture. Aucune donnee d'authentification du widget n'est conservee dans le snapshot.

```bash
node tools/build-marathon-course-reference.mjs
```

Le JSON conserve les six `LineString`, leurs distances de progression publiees, leurs identifiants d'origine, la provenance et le role `race-course`. Les courses entieres ne sont pas chargees comme fermetures : seules les portions rapprochees du PDF sont utilisees par `officialClosureReference`. Toutes les collections presentes avant ce complement, y compris `officialCourseReference`, ont ete comparees en profondeur a la copie de reference : identiques.

## Complements non integres

Les 297 aretes reservees a la verification et les interdictions de stationnement restent des manques de couverture. Les fermetures du dimanche sont maintenant integrees sur les parties verifiees. Les departs a 07:45 ne sont pas substitues aux fermetures annoncees plus tot, ni etendus jusqu'a la derniere reouverture de tout le parcours.

Le controle complementaire des avis du parc Jean-Drapeau n'a pas apporte de nouvel avis horaire pour le 11 octobre dans la liste recente consultee. Les recherches de texte dans le WFS municipal peuvent retourner l'entreprise « Marathon Division Gaz » : ces chantiers ne constituent pas des fermetures de l'evenement Beneva.

Clarification de l'utilisatrice le 5 octobre : le 9 octobre concerne une exposition interieure, sans fermeture a ajouter. Cette journee est retiree des questions en attente et inscrite dans `excludedDates`, avec une provenance `user-clarification`. Les references RTRT brutes sont conservees pour la tracabilite, sans generer de fermeture pour le 9. Pour les entrees du parc ou du jardin, une restriction d'acces distincte des portions de parcours exige encore un avis specifique.

Un passage RTRT dans le parc permet d'identifier le chemin emprunte par une course, pas de conclure seul a son interdiction au public pendant tout un creneau. L'occupation par les coureurs, les traversees controlees, la fermeture de certains acces et une fermeture totale sont des situations distinctes. Aucun horaire de fermeture pietonne n'a ete cree par extrapolation du temps limite des coureurs.

Trois enregistrements ont ete ajoutes au [snapshot pieton consolide](../data/pedestrian-closures-snapshot.json), sous la cle `marathon-pdf`. Les autres enregistrements, avis en verification et dates de verification des sources restent intacts. Les 88 fermetures Waze et les 69 groupes routiers PDF ne sont pas dupliques sur la carte pietonne.

## Integration et validation

- Chargement local dans [js/app.js](../js/app.js), via les normalisateurs Waze et PDF. La carte pietonne utilise uniquement son snapshot consolide.
- Sources `marathon-beneva-waze`, `marathon-beneva-pdf` et `pedestrian-marathon-pdf`, categorie evenement et style d'impact commun. La page pietonne propose maintenant le filtre evenement.
- Le [catalogue](../data/sources.js) marque l'export, le PDF cite et la geometrie RTRT `inMap: true`. Le PDF reste une extraction locale, pas un flux PDF charge en direct dans le navigateur; aucune date d'extraction Waze n'est inventee.
- Identifiants, rues, heures, indicateurs d'evenement, statut et sens de segment sont conserves. Les noms d'editeurs et les autres metadonnees administratives ne sont pas ajoutes aux popups.
- Les [statistiques](../js/stats.js) classent ces sources comme evenements montrealais; les dates Waze restent declarees, celles du complement viennent du PDF.
- Un echec de ce snapshot laisse les autres sources disponibles et affiche une erreur explicite.

Le test a egalement revele un defaut du filtre de dates commun : une journee etait representee par midi seulement. Quatorze fermetures matinales disparaissaient donc du 10 octobre. Le filtre couvre maintenant la journee complete, de 00:00 a 23:59:59.999.

### Regeneration

Outils locaux seulement : Node avec les dependances de developpement existantes, Python avec PyMuPDF, et la copie de geobase dans `tools/cache-nids-de-poule/rues-statistiques.json`. Aucun de ces outils n'est requis pour servir le site. Le [producteur](../tools/build-marathon-closures.mjs) recharge le PDF et les chemins OSM, appelle l'[extracteur PDF](../tools/extract-marathon-pdf.py), puis synchronise la date PDF du catalogue. Un PDF dont l'empreinte change exige une nouvelle revue au lieu de reutiliser silencieusement le calage. Un argument optionnel permet de reutiliser une capture OSM deja verifiee en conservant sa date d'origine.

```bash
node tools/build-marathon-closures.mjs
node tools/build-pedestrian-snapshot.mjs --marathon-only
node tools/validate-marathon.mjs
```

La fusion ciblee n'interroge pas les autres sources pietonnes. Le producteur pieton complet reutilise lui aussi ce complement lors de ses prochaines regenerations.

Commandes executees :

```bash
node --check js/app.js
node --check js/stats.js
node --check data/sources.js
node --check languages/fr.js
node --check languages/en.js
node tools/validate-marathon.mjs
npm run test:custom-stats -- --browser
```

Le [validateur marathon](../tools/validate-marathon.mjs) execute les vrais scripts dans Chromium : 88 identifiants Waze uniques et horaires inchanges; 69 groupes routiers PDF dont 54 le dimanche; trois groupes de chemins sans fuite vers la carte automobile; rejet d'une heure absente du tableau; conservation des coordonnees RTRT consecutives; absence de fleches automobiles deduites du sens de course; popups FR/EN et mobiles; panne isolee du snapshot. Le test pieton controle les pixels rouges du canevas et clique reellement sur le chemin. Le navigateur affiche les heures 07:30 et 11:00 pour le groupe du jardin.

Les six references RTRT restent distinctes des heures de fermeture. Le test ne modifie pas le JSON. Les autres flux externes sont bloques, sauf les bibliotheques CDN; les noms d'hotes observes incluent donc des requetes tentees et ne prouvent pas une verification de ces flux. Les tests des statistiques personnalisees passent aussi, dont les controles FR/EN a 320, 768 et 1440 pixels.

Le centrage mobile est teste apres la fin du changement de disposition. L'horloge de reference du test avance normalement pour ne pas bloquer les animations Leaflet.

Cette integration est locale. Elle n'est ni une publication sur GitHub Pages ni une confirmation terrain des fermetures.
