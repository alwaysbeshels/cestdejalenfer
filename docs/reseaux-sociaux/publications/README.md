# Publications Instagram et Facebook

Chaque numéro est une **publication indépendante**, avec ses visuels FR/EN et un seul **caption.txt bilingue**. Le dossier `lancement` a été renommé `publications`; le numéro 04 s'appelle maintenant `04-statistiques-entraves-routieres`.

Toutes les images de diffusion sont des **JPEG carrés 1080 × 1080**. Les neuf publications ont été entièrement recapturées depuis la version locale actuelle et tous les JPEG/PNG ont été régénérés, dans les deux langues. Le nom de marque **C'est déjà l'enfer** reste identique dans les deux langues.

- [Aperçu français](source.html?lang=fr)
- [English preview](source.html?lang=en)
- [Pack des publications](publications-fr-en.zip)

## Un dossier par publication

| Numéro | Sujet | Images | Caption unique |
| --- | --- | --- | --- |
| 01 | Bienvenue / Welcome | [FR](01-bienvenue/fr.jpg) · [EN](01-bienvenue/en.jpg) | [FR puis EN](01-bienvenue/caption.txt) |
| 02 | Auto et Piétons / Driving and walking | [FR](02-auto-et-pietons/fr.jpg) · [EN](02-auto-et-pietons/en.jpg) | [FR puis EN](02-auto-et-pietons/caption.txt) |
| 03 | Nids-de-poule / Potholes | [FR](03-nids-de-poule/fr.jpg) · [EN](03-nids-de-poule/en.jpg) | [FR puis EN](03-nids-de-poule/caption.txt) |
| 04 | Statistiques des entraves routières | 4 images FR + 4 EN; [première FR](04-statistiques-entraves-routieres/fr-01-general.jpg) · [première EN](04-statistiques-entraves-routieres/en-01-general.jpg) | [FR puis EN](04-statistiques-entraves-routieres/caption.txt) |
| 05 | VoiceOver / Screen reader mode | [FR](05-voiceover/fr.jpg) · [EN](05-voiceover/en.jpg) | [FR puis EN](05-voiceover/caption.txt) |
| 06 | Explorer son secteur / Explore your area | [FR](06-explore-ton-secteur/fr.jpg) · [EN](06-explore-ton-secteur/en.jpg) | [FR puis EN](06-explore-ton-secteur/caption.txt) |
| 07 | Statistiques des nids-de-poule | 3 images FR + 3 EN; [première FR](07-statistiques-nids-de-poule/fr-01-bilans.jpg) · [première EN](07-statistiques-nids-de-poule/en-01-bilans.jpg) · [les trois exemples](07-statistiques-nids-de-poule/README.md) | [FR puis EN](07-statistiques-nids-de-poule/caption.txt) |
| 08 | Statistiques routières : Personnalisé | 2 images FR + 2 EN; [première FR](08-statistiques-personnalisees/fr-01-comparer.jpg) · [première EN](08-statistiques-personnalisees/en-01-comparer.jpg) | [FR puis EN](08-statistiques-personnalisees/caption.txt) |
| 09 | Installation mobile | 2 images FR + 2 EN; [iPhone FR](09-installation-mobile/fr-01-iphone.jpg) · [iPhone EN](09-installation-mobile/en-01-iphone.jpg), puis Android | [FR puis EN](09-installation-mobile/caption.txt) |

Chaque `caption.txt` commence par **FR :**, puis un saut de paragraphe et **EN :**. La limite de **2 200 caractères s'applique au texte entier**, hashtags et emojis compris. Les neuf captions actuelles font entre 403 et 495 caractères. Elles ne contiennent ni présentation personnelle, ni nom de créatrice, ni URL, ni date de capture. Les textes alternatifs sont dans `textes-alternatifs.md`, séparément. Les anciennes légendes longues FR/EN sont archivées hors dépôt et ne sont plus dans le pack.

Pour une publication bilingue, les visuels FR et EN d'un même numéro peuvent être associés. Pour les séries 04, 07, 08 et 09, conserver l'ordre du numéro dans les noms d'images. Importer les **JPG**, pas le ZIP, la page HTML ou les captures longues PNG. Aucun numéro de page, bandeau d'en-tête ou pied de page n'est imprimé sur les visuels; les étapes numérotées du guide d'installation sont des instructions, pas une pagination.

Le ZIP conserve les dossiers numérotés avec leurs JPG, captions et textes alternatifs. Les quatorze captures longues des numéros 04 et 07 sont incluses séparément dans `_sources/current` comme compléments à consulter, pas comme images Instagram. Les liens vers l'aperçu HTML utilisent le dossier complet du projet; les fichiers de construction ne sont pas dans le pack.

## Statistiques et captures complètes

Le 04 contient quatre vues par langue : **Général**, **Autoroutes et routes numérotées**, **Public & Privé** et **Par municipalité**. L'onglet **Personnalisé n'y figure pas** : il a sa propre publication 08, avec un exemple de barres et un exemple en anneau, montrant les choix et le résultat dans le même écran.

Le 07 présente les **Bilans**, les **Analyses** et un **portrait d'arrondissement** du volet nids-de-poule. Les captures anglaises montrent les vraies pages anglaises, et non du texte superposé à une capture française. Le 03 présente lui aussi une nouvelle capture complète du volet Nids-de-poule dans chaque langue.

Les JPG montrent des **écrans complets du tableau de bord**, avec navigation, filtres et plusieurs résultats, et non un graphique isolé. Un écran n'est pas toute une page défilante. Les versions longues ci-dessous ont donc aussi été capturées avec toute la hauteur de la vue, sans changer les données ni rogner les images. Les tableaux et panneaux internes conservent leurs propres limites d'affichage.

| Vue du 04 | Capture défilante FR | Capture défilante EN |
| --- | --- | --- |
| Général | [FR](_sources/current/04-fr-general-complete.png) | [EN](_sources/current/04-en-general-complete.png) |
| Autoroutes | [FR](_sources/current/04-fr-roads-complete.png) | [EN](_sources/current/04-en-roads-complete.png) |
| Public & Privé | [FR](_sources/current/04-fr-private-complete.png) | [EN](_sources/current/04-en-private-complete.png) |
| Municipalité | [FR](_sources/current/04-fr-territory-complete.png) | [EN](_sources/current/04-en-territory-complete.png) |

Les [notes de la nouvelle session de capture](_sources/current/provenance.json) enregistrent les 48 captures, leur langue, les dimensions, les onglets, les contrôles et les empreintes des fichiers applicatifs. La période des vues routières est le 5 octobre 2026; les filtres de la version actuelle sont conservés. Ces métadonnées restent hors des captions. Aucun générateur de données ni rafraîchissement de snapshot n'a été lancé.

## Installation mobile

Le 09 distingue **Safari sur iPhone** et **Chrome sur Android**. Les étapes reprennent les instructions présentes dans le site : Partager puis Sur l'écran d'accueil sur Safari; menu puis Installer ou Ajouter à l'écran d'accueil sur Chrome. Les libellés peuvent varier et le bouton du site peut ouvrir directement l'installation lorsque le navigateur le permet.

Les téléphones montrent l'aide du site réellement ouverte dans des contextes Chromium avec émulation mobile. Ce ne sont ni des captures de dialogues natifs Safari/Android, ni des preuves qu'une installation a été exécutée sur appareil réel. Aucun faux dialogue de système n'a été dessiné. Les instructions restent une aide à l'installation, pas une certification multi-appareil.

## Captures et traductions

- Toutes les images affichées par le modèle proviennent exclusivement de `_sources/current`, donc de cette session de capture. Les anciennes images du dossier de presse ne sont plus réutilisées dans les visuels.
- Les captures ont été prises depuis `http://127.0.0.1:5500`, avec les modifications locales actuelles. Les scripts, styles et données du site n'ont pas été modifiés par la préparation des publications.
- Le mode lecteur d'écran a été activé sur la vraie carte Piétons avant chacune de ses captures FR/EN. Aucun nouveau test VoiceOver sur appareil ni certification d'accessibilité n'est revendiqué.
- Les textes des commandes du site sont en anglais. Les noms de rues et les textes publiés par les sources officielles peuvent conserver leur langue d'origine; ils ne sont pas réécrits dans les images.
- Les captures françaises et anglaises ne sont pas des extractions simultanées. Les données visibles peuvent différer; aucun chiffre ou tracé n'a été modifié pour faire correspondre les versions.
- Les écrans restent complets, sans recadrage ni déformation. Le téléphone passe devant l'ordinateur sur la couverture. Les crédits OpenStreetMap sont conservés près des images, sans bandeaux, pagination ou pied de page.
- Les légendes n'ajoutent ni données d'audience, ni garantie de circulation, ni promesse d'accessibilité sur place.

## Sources modifiables et contrôles

[source.html](source.html) est le modèle graphique commun. [english.js](english.js) traduit les visuels initiaux et [series.js](series.js) compose les séries 04, 07, 08 et 09 dans la langue choisie. `_sources/current` contient les nouvelles captures et leur provenance; seules les images JPG des dossiers numérotés sont destinées à être importées comme visuels sociaux.

Les neuf captions combinées ont été validées : ordre FR/EN, longueur totale, absence de nom personnel, URL, date de capture ou commentaire de statut de publication. Les 32 compositions ont été vérifiées dans Chromium : 1080 × 1080, images entières, marges, proportions et absence de texte superposé. Chaque image utilisée est rattachée à une nouvelle capture de cette session dans la langue correspondante. Les JPEG sont décodés et leurs zones d'images contrôlées par pixels; les aperçus sont vérifiés à 390, 768 et 1 440 pixels. Les empreintes de 17 fichiers applicatifs et de métadonnées locales sont inchangées. Les scripts JavaScript modifiés passent `node --check`.

Le bilan est **neuf publications bilingues finalisées, 32 JPEG, neuf captions et quatorze captures longues complémentaires**. Les textes alternatifs ont été régénérés pour les nouvelles images. Aucun test d'import sur les comptes sociaux ni inspection visuelle humaine n'est revendiqué. Les versions remplacées sont conservées hors dépôt.

## Pour les prochaines publications

Utiliser **/creer-publication-sociale**, défini dans [le prompt du projet](../../../.github/prompts/creer-publication-sociale.prompt.md). Il conserve les règles validées : dossier par numéro, versions visuelles FR/EN, JPEG carrés, captures complètes non retouchées, captions courtes FR puis EN, pas de nom personnel, d'URL ou de date de capture, et aucune publication automatique.