# Guide utilisateur des prompts Copilot

Ce guide s'adresse aux personnes qui maintiennent la Carte des entraves auto du Grand Montreal dans VS Code. Les prompts sont des consignes reutilisables pour GitHub Copilot Chat, pas des commandes a lancer dans un terminal ni des fonctions du site public.

## Lancer un prompt

1. Ouvrez le dossier racine du projet dans VS Code, avec GitHub Copilot Chat disponible et votre compte connecte.
2. Ouvrez le panneau de chat et tapez `/`.
3. Selectionnez la commande voulue dans la liste.
4. Ajoutez au besoin une source, une rue, un identifiant ou un objectif apres la commande, puis envoyez le message.
5. Lisez le bilan et examinez les modifications proposees dans VS Code avant de poursuivre.

Vous pouvez aussi ouvrir un fichier de prompt et utiliser son bouton d'execution, ou chercher `Chat: Run Prompt...` dans la palette de commandes. Le libelle peut varier selon la langue de VS Code.

Chaque prompt selectionne son agent specialise. L'agent definit les regles du projet et les outils disponibles; le prompt lui donne une tache precise. Les permissions d'outils de VS Code restent applicables. Le resultat depend de l'acces aux sources et des outils disponibles : un prompt n'est pas une garantie de reussite ni une automatisation planifiee.

## Choisir la bonne commande

| Commande | A quoi elle sert | Modifications permises |
| --- | --- | --- |
| `/actualiser-snapshots` | Relire les sources et mettre a jour les copies locales apres verification. | Snapshots du perimetre, fraicheur du catalogue et documentation necessaire. |
| `/auditer-snapshots` | Verifier la coherence des fichiers locaux sans consulter les sources distantes. | Aucune. |
| `/examiner-signalements` | Revoir les declarations citoyennes en attente et leurs preuves. | Snapshot citoyen et documentation necessaire, seulement pour les corrections justifiees. |
| `/integrer-source` | Rechercher une source officielle et preparer son branchement. | Catalogue uniquement; aucun nouveau chargeur active. |
| `/valider-carte` | Tester le vrai site local dans Chromium. | Aucune modification du code ou des donnees. |
| `/preparer-publication` | Examiner les changements et verifier leur etat avant publication. | Aucune; pas de staging, commit ou push. |

Aucune de ces commandes ne publie automatiquement le site et aucune n'autorise l'installation de dependances sans votre accord. Les limites sont des instructions de travail; relisez toujours le diff et le bilan.

## Actualiser les snapshots

Utilisez cette commande lorsque vous voulez relire les sources et actualiser les donnees locales. Sans precision, elle couvre tous les snapshots existants, y compris les declarations citoyennes et les sources complementaires, sans les presenter comme des avis officiels.

```text
/actualiser-snapshots
/actualiser-snapshots PJCCI
/actualiser-snapshots Mont-Royal et Beaconsfield
/actualiser-snapshots signalements citoyens
```

Une verification complete reussie avance `extractedAt`, meme sans nouvelles donnees. Dans ce cas, les fiches et leurs geometries restent intactes. Une source inaccessible ou partiellement verifiee garde sa date precedente; les autres sources sont traitees independamment.

Le bilan distingue donnees modifiees, verification sans changement et echec. La date de verification ne confirme pas les conditions sur le terrain.

## Auditer les snapshots

Choisissez l'audit pour examiner ce qui est deja conserve : dates, comptes, identifiants, doublons possibles, references geometriques, confidentialite et accord avec le catalogue.

```text
/auditer-snapshots
/auditer-snapshots PJCCI et rues pietonnes
```

L'audit ne rafraichit rien, ne contacte pas les sources et ne corrige pas les fichiers. Un resultat coherent localement ne prouve pas que la source distante est a jour ni que la carte fonctionne dans un navigateur.

## Examiner les signalements citoyens

Sans precision, cette commande examine les fiches en attente. Vous pouvez cibler une rue ou un identifiant. Elle analyse les champs ensemble, notamment le commentaire integral, et conserve les incertitudes non resolues.

```text
/examiner-signalements
/examiner-signalements McArthur et Griffith
/examiner-signalements Foucher
```

Une preuve suffisante peut justifier une correction ou un changement d'admissibilite, avec validation de son effet sur la carte. Sans preuve, la fiche reste en attente : aucune date, fermeture ou geometrie n'est devinee. Personne n'est contacte et aucune reponse n'est fusionnee silencieusement.

Cette revue n'est pas un import de nouvelles reponses. Pour relire l'ensemble du formulaire, utilisez `/actualiser-snapshots signalements citoyens`. Une correction locale ne change pas l'heure de derniere extraction complete.

Ne collez jamais les contacts des declarants ni le lien du tableur prive dans les fichiers publics. L'acces memorise hors depot est gere selon les regles de l'agent.

## Preparer une nouvelle source

Malgre son nom, `/integrer-source` effectue la recherche et le catalogage, pas le branchement effectif a la carte. Donnez une municipalite ou une autorite; une URL officielle connue peut aider.

```text
/integrer-source Ville de Brossard
/integrer-source Ville de Mont-Royal : verifier les sources officielles deja connues
```

L'agent verifie les donnees, les geometries, les dates et les contraintes d'acces. Une source nouvellement cataloguee reste inactive tant que son chargement et son affichage ne sont pas valides. Le bilan recommande un flux live, un snapshot ou un lien documentaire. Le branchement demande une tache distincte.

## Valider la carte

Cette commande teste l'application locale : couches, popups, filtres, recherche, langues et affichage ordinateur/mobile. Sans precision, elle effectue une validation generale; un objectif permet de cibler les tests.

```text
/valider-carte
/valider-carte popups mobiles et fermeture du menu
/valider-carte horaires des signalements citoyens
```

Le projet utilise `http://localhost:5500/index.html` pour ces controles. Chromium/Playwright et le serveur statique local doivent etre disponibles; l'agent signale les prerequis manquants au lieu de les installer sans permission. Les instructions de configuration se trouvent dans la [documentation du projet](README.md).

L'agent fournit les tests reussis, echoues ou bloques, sans corriger l'interface. Une erreur peut donc mener a une demande de correction distincte. Un simple HTTP 200 ne vaut pas validation du site.

## Preparer la publication

Utilisez cette commande quand les changements locaux sont prets a etre examines. Elle inspecte le diff, controle les fichiers et execute les tests pertinents. Elle ne modifie ni les fichiers ni l'index Git.

```text
/preparer-publication
/preparer-publication uniquement les changements de documentation et de prompts
```

Le bilan indique `pret`, `bloque` ou `validation incomplete`, avec les risques et un message de commit propose. Des changements exclusivement documentaires appellent des controles de liens et de configuration, pas un rafraichissement des sources.

## Parcours recommande

1. Lancez `/actualiser-snapshots` pour mettre les donnees a jour, ou la commande adaptee a votre objectif.
2. Examinez le bilan, les sources non verifiees et les fichiers modifies. Demandez une correction distincte si necessaire.
3. Utilisez `/valider-carte` pour une validation ciblee supplementaire, ou `/auditer-snapshots` pour une inspection locale. Ne les relancez pas uniquement pour repeter des controles deja concluants sur les memes fichiers.
4. Lancez `/preparer-publication` pour le bilan final. Faites traiter les blocages avant d'autoriser la suite.
5. Pour publier, envoyez une demande distincte et explicite, par exemple : `Cree le commit et pousse les changements valides sur main.`

La branche `main` alimente GitHub Pages. Un push reussi n'est pas une confirmation du deploiement public : son resultat doit etre verifie separement. Une permission de publication donnee pour une ancienne mise a jour ne vaut pas pour la suivante.

## Si une commande n'apparait pas

- Verifiez que vous avez ouvert le dossier du projet contenant `.github`, et pas uniquement un fichier ou le dossier `docs`.
- Cherchez la commande dans la liste `/` de Copilot Chat, pas dans le terminal.
- Ouvrez directement son fichier ci-dessous et utilisez le bouton d'execution ou `Chat: Run Prompt...`.
- Verifiez que Copilot Chat et les fichiers de prompts sont disponibles dans votre configuration VS Code. Si necessaire, rechargez la fenetre et consultez les diagnostics du fichier.

## Fichiers de reference

Les prompts restent dans `.github/prompts/` pour etre decouverts par VS Code; seule leur documentation est regroupee ici.

- [Actualiser les snapshots](../.github/prompts/actualiser-snapshots.prompt.md)
- [Auditer les snapshots](../.github/prompts/auditer-snapshots.prompt.md)
- [Examiner les signalements](../.github/prompts/examiner-signalements.prompt.md)
- [Integrer une source](../.github/prompts/integrer-source.prompt.md)
- [Valider la carte](../.github/prompts/valider-carte.prompt.md)
- [Preparer la publication](../.github/prompts/preparer-publication.prompt.md)
- [Regles de publication](../.github/prompts/deployment-rules.md)
- [Documentation du projet](README.md)
- [README a la racine](../README.md)
