---
name: preparer-annonce
description: "Preparer une annonce datee en francais et en anglais couvrant les nouveautes importantes du site depuis la derniere annonce publiee, sans publication automatique."
argument-hint: "Date prevue AAAA-MM-JJ, revision cible ou sujet facultatifs; bilan complet par defaut."
agent: "Carte des entraves"
---

# Preparer une annonce bilingue

Prepare le fichier de la prochaine annonce de **C'est deja l'enfer**, selon les [regles des annonces](../../docs/annonces/README.md), la [documentation du site](../../docs/README.md) et les [regles de publication](./deployment-rules.md). L'annonce est publiee dans le depot lorsque son fichier est effectivement pousse sur la branche publique; une GitHub Discussion n'est pas requise.

## Perimetre et permissions

- Par defaut, couvrir toutes les nouveautes importantes pour les personnes qui utilisent le site depuis la derniere annonce effectivement publiee. Une selection explicite de sujets autorise seulement une annonce `targeted`, jamais une couverture complete implicite.
- Toujours produire le francais ET l'anglais dans le meme fichier, avec des informations, reserves et appels a l'action equivalents. Le message accompagnant la commande peut preciser le ton ou une date prevue, mais ne dispense pas de verifier les faits.
- Ecrire uniquement dans `docs/annonces/` et mettre a jour les liens documentaires necessaires. Ne pas modifier le code, l'interface, les traductions du site ou les snapshots. Ne pas ajouter de dependance ni de pipeline.
- Utiliser uniquement des operations Git de lecture. Aucun staging, commit, push, pull, rebase, reset, revert, changement de branche, tag, Release ou publication de Discussion. Une autorisation de publication precedente ne vaut pas pour cette commande.
- Ne rafraichir aucune source pour rediger une annonce. Ne pas consulter le tableur prive des signalements citoyens, ni publier des contacts, identifiants prives, secrets ou liens internes. Les controles temporaires restent hors depot.

## 1. Etablir la reference

1. Lire l'etat Git, la branche, les diffs indexes et non indexes, les fichiers non suivis pertinents et les editions de `docs/annonces/`. Preserver les preparations et changements de l'utilisateur.
2. Verifier la revision reelle de la branche distante de publication, `origin/main` pour ce projet, avec une lecture distante telle que `git ls-remote origin refs/heads/main`. Si son objet Git est disponible localement, lire l'arbre et les editions a cette revision, pas les seuls fichiers du repertoire de travail. Si la verification distante echoue ou si l'objet manque, signaler le blocage et demander une synchronisation ou une reference verifiee; ne pas utiliser silencieusement une reference en cache ni conclure qu'aucune annonce n'existe.
3. Une edition presente a cette revision distante est publiee dans le depot. Une edition uniquement locale, meme commitee, ne l'est pas encore. Retrouver dans l'historique de la branche publique le commit qui a introduit chaque edition et leur ordre de publication; ne pas deduire cet ordre du seul nom de fichier. Ne demander ni statut manuel ni URL de Discussion pour reconnaitre cette publication.
4. Pour la derniere edition `coverage: complete`, le commit qui l'a introduite fournit la base du prochain bilan, y compris les changements applicatifs publies dans ce meme commit. `reviewedCommit` est seulement la reference examinee lors de la redaction, pas cette borne de publication. Si la derniere edition est `targeted`, consulter aussi la derniere couverture complete et les annonces ciblees intermediaires pour ne pas oublier les autres sujets. Sans couverture complete precedente, preparer un premier bilan d'ensemble de l'existant avec `baseCommit: null`, en distinguant les sujets deja annonces des nouveautes; `previousAnnouncement` reste `null` seulement si aucune edition publiee n'existe. Ne pas se limiter arbitrairement aux deux derniers commits.
5. Resoudre la revision cible donnee par l'utilisateur, ou `HEAD` par defaut, en SHA complet. Verifier l'existence et l'ascendance de la base avec les commandes Git de lecture appropriees. En cas d'historique incomplet, de divergence ou de reference invalide, expliquer le blocage; ne pas inventer une plage de commits.
6. Examiner separement les modifications locales pertinentes hors du commit cible. Si elles sont annoncees, identifier les fichiers et les changements dans les notes editoriales et preciser qu'ils doivent accompagner l'annonce lors de la publication autorisee. Ne pas ajouter de booleen ou d'etat provisoire qui deviendrait faux une fois le fichier pousse. La publication du fichier Markdown ne prouve pas que le deploiement GitHub Pages des fonctionnalites a reussi.

## 2. Analyser les changements importants

1. Comparer les commits, les noms de fichiers et les diffs entre la base fiable et la cible. Lire les implementations et la documentation utiles; ne pas se fier uniquement aux messages de commits.
2. Reperer les nouveaux modes, les changements de navigation et d'installation, l'accessibilite, les nouvelles couvertures de donnees effectivement branchees, les filtres, les ameliorations de performance perceptibles, les corrections importantes et les limites nouvelles.
3. Pour chaque nouveaute candidate, verifier ce qu'elle fait, qui elle concerne et comment y acceder. Conserver une preuve lisible dans les notes : commit ou changement local, fichier/route/controle concerne, et statut de disponibilite.
4. Distinguer explicitement : disponible sur le site et verifie, present dans le code mais disponibilite publique non verifiee, prepare sans integration, modification locale non publiee, deja annonce, et changement interne sans effet utilisateur. Une ligne du catalogue, un generateur ou un snapshot seul ne prouve pas qu'une fonctionnalite est accessible dans l'interface. Par exemple, ne pas annoncer une carte de nids-de-poule a partir de fichiers de donnees non branches.
5. Inclure toutes les nouveautes significatives confirmees dans le perimetre. Regrouper les changements proches et les simples rafraichissements de donnees. Expliquer dans les notes les elements importants exclus, differes ou deja annonces, afin de ne pas les oublier lors d'une prochaine edition.
6. Distinguer version de l'application et fraicheur des sources. Ne pas annoncer une couverture exhaustive, du temps reel, un passage sur le terrain confirme, un itineraire accessible ou une certification d'accessibilite sans preuve. Ne pas transformer un retour d'une personne en appui officiel d'un organisme.
7. Si aucune nouveaute importante n'est identifiee, le signaler et proposer de reporter l'annonce plutot que de fabriquer un contenu. Ne pas creer un fichier vide pour satisfaire la commande.

## 3. Rediger l'edition datee

1. Utiliser `docs/annonces/AAAA-MM-JJ.md` avec la date d'edition fournie; a defaut, employer la date du jour dans le fuseau `America/Toronto`. Ce n'est pas un horodatage technique de deploiement.
2. Si une edition uniquement locale existe pour cette date, la relire et l'enrichir sans effacer les passages deja valides. Si elle existe sur la branche publique, demander si la demande vise une correction explicite ou une nouvelle edition; ne pas l'ecraser ni inventer une autre date.
3. Renseigner le schema de l'[index des annonces](../../docs/annonces/README.md) : `date`, `coverage`, `languages`, `previousAnnouncement`, `baseCommit` et `reviewedCommit`. `reviewedCommit` est le SHA complet cible examine lors de cette preparation. Ne pas ajouter de statut `draft`/`published`, de champ `publishedAt`, de `publicationUrls` requis ou de SHA autoreferent : l'historique distant donne la preuve de publication.
4. `previousAnnouncement` designe la derniere edition publiee consultee; `baseCommit` peut remonter a une edition complete anterieure si la derniere etait ciblee. Expliquer ce choix dans les notes. L'absence de base doit rester explicite.
5. Separer clairement le suivi editorial des textes destines aux lecteurs. Y placer la plage de comparaison, les preuves de disponibilite, les changements a inclure dans la meme publication, les sujets exclus et les controles non effectues. Privilegier des faits historiques plutot que des phrases transitoires comme « toujours non publie ». Les textes FR/EN ne doivent pas reprendre ce suivi technique.
6. Ajouter un mini-menu `[Français](#français) | [English](#english)` juste sous le titre principal, apres le frontmatter et avant le suivi editorial. Rediger les sections de niveau 2 `## Français` et `## English`, chacune avec un titre, une introduction, les nouveautes regroupees, la facon de les trouver, les limites utiles, les liens et une invitation aux retours. Conserver ces titres pour stabiliser les ancres de langue. Pour plusieurs textes thematiques, donner la traduction de chacun. Le nom de marque reste inchange.
7. Employer les libelles reels de `languages/fr.js` et `languages/en.js`, sans traductions devinees. L'anglais doit etre naturel et complet, pas un resume raccourci qui perd une reserve. Les dates et chiffres doivent porter la meme signification dans les deux versions.
8. Utiliser des liens applicatifs `/fr/` pour le francais et `/en/` pour l'anglais lorsque ces routes existent. Ne pas fabriquer une URL anglaise de source externe. Conserver les formulations officielles des avis dans leur langue source si elles sont citees.
9. Utiliser le Markdown GitHub, des paragraphes lisibles, des listes courtes et des emojis ponctuels. Les emojis sont decoratifs : aucun emoji seul ne remplace un titre ou une information indispensable. Eviter les annonces en une seule ligne, les promesses excessives et les listes de commits brutes.
10. Mettre a jour la liste des editions dans `docs/annonces/README.md`, avec la date, les sujets, les langues et le lien, sans colonne d'etat. Dans la colonne Langues, rendre `Français` et `English` cliquables vers les sections correspondantes du fichier date : `AAAA-MM-JJ.md#français` et `AAAA-MM-JJ.md#english`. Verifier que ces ancres existent. Ne pas creer une version/tag ni effectuer la publication a cette etape.

## 4. Validation

- Verifier les liens Markdown locaux, la correspondance date/nom du fichier, les valeurs et types du frontmatter, les SHA et le nom d'agent de ce prompt.
- Verifier l'absence de doublon de date, de publication pretendue et de lien prive. Comparer les deux langues sujet par sujet : fonctionnalites, dates, chiffres, etats de disponibilite, libelles, reserves et appels a l'action.
- Confirmer chaque affirmation importante par le code, les preuves de validation disponibles ou le site lorsqu'une verification de disponibilite est necessaire. Un HTTP 200 ne prouve pas le fonctionnement d'un mode. Ne pas presenter un test anterieur comme un nouveau test ni une traduction comme une certification.
- Pour une modification documentaire seule, effectuer les controles documentaires et de frontmatter sans relancer les extractions ni les tests generaux de carte. Si une affirmation exige une verification comportementale manquante, la controler de facon ciblee avec les outils existants ou la marquer non verifiee.
- Terminer par le controle du diff : seuls les fichiers autorises doivent avoir change, et les editions publiees doivent etre preservees.

## Bilan attendu

Repondre en francais avec le fichier date cree ou enrichi, la reference de comparaison, les sujets inclus dans les deux langues et les exclusions motivees. Distinguer preparation, validation locale et disponibilite publique. Signaler les prerequis ou preuves manquants et rappeler qu'aucune annonce, Release, tag, commit ou publication du site n'a ete effectuee.
