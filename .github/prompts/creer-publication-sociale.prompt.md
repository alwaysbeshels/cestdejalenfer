---
name: creer-publication-sociale
description: "Creer ou revoir des publications Instagram/Facebook bilingues de C'est deja l'enfer, avec vrais visuels du site, captions FR puis EN et un dossier par numero."
argument-hint: "Sujet, numero a revoir ou nouvelle publication; exemples : statistiques routieres, Personnalise, installation mobile, mode VoiceOver."
agent: agent
---

# Creer une publication sociale bilingue

Prepare les fichiers d'une publication de **C'est deja l'enfer**, sans publier sur les reseaux ni sur le site. Lis le [guide des publications](../../docs/reseaux-sociaux/publications/README.md), le [modele approuve](../../docs/reseaux-sociaux/publications/source.html) et le dossier du sujet concerne. Preserve le travail deja present.

## Organisation

- Un numero represente une publication independante. Utiliser `docs/reseaux-sociaux/publications/NN-sujet/`, pas un dossier `lancement`.
- Pour une nouvelle publication, choisir le prochain numero libre; ne pas reutiliser un numero reserve. Une publication peut contenir plusieurs images si chaque exemple apporte une information utile.
- Produire des JPEG carres **1080 x 1080**, avec versions FR et EN : `fr.jpg` / `en.jpg` pour un visuel unique, ou `fr-01-sujet.jpg` / `en-01-topic.jpg` pour plusieurs images. Conserver les PNG de travail si utiles, mais les exclure du ZIP de diffusion.
- Fournir un seul `caption.txt` bilingue par publication. Separer les textes alternatifs et les notes de provenance du texte a publier.
- Mettre a jour le guide et le pack ZIP avec une liste explicite de fichiers. Ne pas laisser d'anciens JPEG concurrents dans le pack. Archiver hors depot les versions remplacees plutot que supprimer un travail utilisateur non identifie.

## Direction visuelle

- Reprendre le style approuve : fond clair, vert profond, accent corail, typographie lisible et espace pour l'image. Garder la marque **C'est deja l'enfer** identique dans les deux langues.
- Aucun en-tete repetitif, pied de page, numero de page ou mention « sans compte ». « Gratuit » suffit.
- Une accroche courte par image. Pas de mise en page de rapport ou de diapositive de presse miniature.
- Pour une couverture de presentation, montrer le site sur ordinateur et telephone avec leurs vrais ecrans. Le telephone peut passer devant l'ordinateur sans cacher l'information principale. Ne pas reutiliser une photo de stock non autorisee ni retirer un filigrane.
- Conserver les credits requis, dont OpenStreetMap, discrets et lisibles pres des captures. Les dates de captures et les limites techniques restent dans les notes, pas dans les captions par defaut.

## Captures reelles et bilingues

- Ouvrir les vraies pages du site local avec les outils deja installes. Utiliser `/fr/` pour FR et `/en/` pour EN, et verifier la langue effectivement rendue. Traduire l'accroche ne suffit pas : l'interface visible doit aussi etre dans la bonne langue.
- Garder les ecrans reconnaissables et complets, avec leur navigation et leur contexte. Pas de grossissement arbitraire, coordonnees negatives, `object-fit: cover`, decoupe qui cache le bas ou retouche des chiffres, marqueurs ou geometries. Utiliser le ratio original avec `object-fit: contain`.
- Pour des statistiques, privilegier des captures de vues completes du tableau de bord plutot qu'un seul graphique isole. Distinguer un ecran complet du contenu total defilant; conserver les captures longues en complement si necessaire, sans les rendre minuscules dans un carre. Ne jamais pretendre avoir montre toute une page si seule sa partie visible a ete capturee.
- Distinguer statistiques des entraves routieres, statistiques des nids-de-poule et onglet Personnalise. Ce sont des publications differentes. Ne pas integrer Personnalise a une publication qui l'exclut.
- Pour VoiceOver, montrer le mode lecteur d'ecran de la carte Pietons effectivement active. Ne pas annoncer de certification, de test VoiceOver sur appareil ou de guidage accessible sans preuve.
- Pour l'installation mobile, verifier les instructions du site et les controles disponibles. Distinguer Safari/iPhone et Chrome/Android; les libelles peuvent varier. Une capture emulee n'est pas un test d'installation sur appareil reel. Ne pas dessiner un faux dialogue natif en le presentant comme une capture.
- Ne rafraichir aucune source ni snapshot pour fabriquer un post. Ne pas modifier l'application ou ses traductions, installer de dependances, consulter de tableur prive ou ajouter des secrets.
- Respecter toutes les restrictions de l'agent actif. Si un jeu de donnees ou une source est exclu, ne pas le lire ou le sonder pour contourner cette exclusion : signaler exactement ce qui manque et laisser la publication en attente. L'actualisation des nids-de-poule et colmatages releve du [prompt dedie](./actualiser-nids-de-poule.prompt.md), pas de cette preparation editoriale.

## Caption unique, courte et bilingue

Le contenu de `caption.txt` doit commencer exactement par `FR : `, puis contenir un saut de paragraphe suivi de `EN : `. L'anglais vient apres le francais. Les deux langues expriment le meme message et les memes reserves.

```text
FR : 📊 Une question courte sur les donnees, une utilite concrete et une invitation a explorer.

EN : 📊 The same concise message in natural English, with the same scope and caveats.

#CestDejaLenfer #Montreal #OpenData
```

- **2 200 caracteres maximum pour l'ensemble**, langues, espaces, sauts de ligne, emojis et hashtags compris. Viser environ 300 a 700 caracteres, pas deux longs textes de 2 200 caracteres chacun.
- Ne pas presenter la creatrice, donner son nom, inclure l'adresse du site, une URL ou la date des captures. La marque peut rester mentionnee si utile.
- Emojis autorises avec moderation. Quelques hashtags pertinents communs en fin de texte, cinq au maximum. Aucun emoji ne remplace une information essentielle.
- Pas de chiffre invente, de promesse de temps reel, de couverture exhaustive ou de condition terrain confirmee. Une entree n'est pas automatiquement un chantier; un dossier 311 ferme n'est pas automatiquement une reparation.
- Ajouter un texte alternatif FR et EN par image dans `textes-alternatifs.md`, sans le melanger au texte a publier.

## Validation et livraison

1. Verifier les pages dans Chromium : sources chargees, graphiques dessines, langue, filtres et controles reels. Ne pas transformer un echec en donnees de demonstration.
2. Verifier les compositions a 1080 x 1080 : images entieres, ratios, titres, marges, aucune superposition incoherente. Verifier aussi l'apercu mobile.
3. Decoder les fichiers finaux pour confirmer largeur/hauteur, absence d'image vide et contenu visible. Controler la correspondance FR/EN et l'activation du mode VoiceOver lorsqu'il est montre.
4. Compter la longueur de chaque `caption.txt`; verifier les prefixes, l'ordre, les langues, et l'absence de nom personnel, URL et date de capture. Controler les liens du guide, le frontmatter et le contenu exact du ZIP.
5. Sur ce poste, ne pas appeler `view_image` ni joindre automatiquement les captures au chat, en raison du probleme de transport connu. Garder les apercus accessibles localement et distinguer les mesures automatisees d'une inspection visuelle humaine.
6. Livrer les chemins du dossier et du ZIP, le nombre de publications et visuels, les blocages exacts et le nom du prompt. Ne pas dire que tous les sujets sont termines si un numero manque. Aucun commit, push, installation ou publication sociale sans demande distincte.