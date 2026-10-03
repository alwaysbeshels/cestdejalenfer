# Annonces du site

## Organisation

Un fichier `AAAA-MM-JJ.md` correspond à une édition datée d'annonce, avec ses versions française et anglaise. Une édition peut regrouper plusieurs nouveautés ou plusieurs textes thématiques. Ne pas créer un fichier séparé pour chaque langue.

Le nom représente la date de l'édition. Avant publication, une date qui change entraîne un renommage et la mise à jour des liens. Une édition déjà publiée reste conservée; aucune réécriture silencieuse de son historique.

Pour plusieurs sujets le même jour, compléter l'édition en préparation plutôt que l'écraser. S'il existe déjà une édition publiée pour cette date, demander si la demande vise une correction identifiée ou une nouvelle édition à dater; ne pas choisir une date fictive ni remplacer le texte publié.

## Éditions

| Date | Sujets | Langues | Fichier |
| --- | --- | --- | --- |
| 2026-10-03 | Statistiques des entraves routières, onglet Comment ça marche et menu en icônes | [Français](2026-10-03.md#français) · [English](2026-10-03.md#english) | [Édition du 3 octobre](2026-10-03.md) |
| 2026-10-02 | Bilan du site, nids-de-poule et colmatages; graphiques, arrondissements et améliorations mobiles prévus | [Français](2026-10-02.md#français) · [English](2026-10-02.md#english) | [Édition du 2 octobre](2026-10-02.md) |
| 2026-09-30 | Modes Piétons et lecteur d'écran | [Français](2026-09-30.md#français) · [English](2026-09-30.md#english) | [Édition du 30 septembre](2026-09-30.md) |

## Publication

Les annonces sont les fichiers Markdown de ce dossier. Lorsqu'une demande explicite de publication inclut ces fichiers, leur push réussi vers la branche publique du dépôt les rend consultables sur GitHub. Le tableau n'affiche donc aucun état saisi manuellement qui risquerait de rester périmé après ce push.

La préparation locale ne publie rien. Pour déterminer ce qui a déjà été annoncé, vérifier les fichiers et les commits réellement présents sur la branche distante de publication (`origin/main` dans ce projet), pas seulement les fichiers locaux ni une référence distante mise en cache. La disponibilité des fonctionnalités sur le site GitHub Pages se vérifie séparément du succès du push.

Une GitHub Discussion ou une Release peut relayer ces textes sur demande explicite, mais n'est pas nécessaire pour que l'annonce du dépôt soit publique. Cette convention n'autorise aucun commit ou push sans demande de publication.

## Métadonnées

Chaque édition commence par un en-tête YAML de traçabilité. Les notes éditoriales et cet en-tête ne font pas partie des textes destinés aux lecteurs.

| Champ | Signification |
| --- | --- |
| `date` | Date de l'édition, identique au nom du fichier. |
| `coverage` | `complete` pour un bilan des nouveautés importantes depuis la référence indiquée; `targeted` pour une sélection de sujets. |
| `languages` | Toujours `["fr", "en"]`, avec des contenus équivalents. |
| `previousAnnouncement` | Nom de la dernière édition publiée consultée, ou `null` si aucune n'est connue. |
| `baseCommit` | SHA complet servant à la comparaison, ou `null` pour un premier bilan ou une sélection sans base globale. |
| `reviewedCommit` | SHA complet examiné lors de la préparation. C'est une référence historique, pas un indicateur de publication ni la preuve que toutes ses fonctionnalités ont été annoncées. |

L'historique Git fournit le commit qui a introduit l'édition sur la branche publique, y compris les changements applicatifs publiés avec elle. Ne pas stocker un faux statut, une heure de publication devinée ou le SHA du commit qui doit contenir son propre fichier. Les sujets effectivement couverts et les exclusions restent décrits dans les notes éditoriales.

## Préparer une nouvelle annonce

Utiliser `/preparer-annonce` dans Copilot Chat. Le [prompt dédié](../../.github/prompts/preparer-annonce.prompt.md) inspecte l'historique, les fichiers concernés et les éditions existantes avant de rédiger les deux langues.

Par défaut, il couvre toutes les nouveautés importantes pour les personnes qui utilisent le site depuis la dernière annonce présente dans la branche publiée. Une annonce `targeted` ne permet pas de considérer tous les changements de son commit comme déjà annoncés : repartir de la dernière couverture complète fiable et tenir compte des sujets déjà présentés. Sans couverture complète précédente, préparer un premier bilan d'ensemble de l'existant, en distinguant les sujets déjà annoncés des nouveautés.

Une fonctionnalité préparée dans le dépôt mais non branchée au site ne doit pas être annoncée comme disponible. Les simples rafraîchissements de données sont regroupés et distingués des nouveautés de l'application. Les limites de couverture et d'accessibilité restent présentes dans les deux langues.

## Proposition de versions

Cette section est une recommandation à valider, pas une annonce de version publiée.

### Une première référence, sans recréer l'historique

Commencer avec un tag annoté **`v1.0.0`** sur la prochaine version validée et explicitement autorisée à la publication. Ce serait la première référence de version du site, pas sa première mise en ligne. Les fonctions déjà disponibles y seraient regroupées, sans leur attribuer artificiellement des versions antérieures.

Le `1.0.0` présent dans [package.json](../../package.json) décrit actuellement les outils locaux; il ne signifie pas qu'un tag ou une Release GitHub existe déjà.

### Une convention simple

| Exemple | Usage proposé |
| --- | --- |
| `v1.0.0` | Première version de référence, après validation. |
| `v1.0.1` | Corrections, ajustements de libellés ou améliorations mineures. |
| `v1.1.0` | Nouvelle fonctionnalité sans rupture des usages existants. |
| `v2.0.0` | Évolution majeure introduisant une rupture de comportement ou de compatibilité. |

- **Tag** : repère immuable sur un commit précis. Ne pas déplacer un tag publié.
- **Release GitHub** : notes liées au tag, avec les nouveautés, corrections et limites connues.
- **Annonce** : présentation d'une fonctionnalité et échange avec les personnes qui l'utilisent. Plusieurs annonces peuvent renvoyer à la même Release.
- **Actualisation des données** : conserver les dates de vérification des snapshots et la provenance par source. Ne pas créer une version du site à chaque rafraîchissement de données seul.

La version de l'application ne doit jamais être présentée comme la date de fraîcheur des entraves. Les commits, tags, Releases et annonces publiques nécessitent chacun une autorisation de publication correspondant à l'opération.
