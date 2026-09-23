---
name: preparer-publication
description: "Examiner les changements et executer les validations avant publication, sans staging, commit, push ni deploiement."
argument-hint: "Changements locaux par defaut, ou fichiers et revision de comparaison a controler."
agent: "Carte des entraves"
---

# Preparer la publication

Prepare un bilan de publication selon l'[agent Carte des entraves](../agents/carte-entraves-metro.agent.md) et les [regles de publication](./deployment-rules.md).
Pour les snapshots, applique les regles specifiques de l'[agent Snapshots officiels](../agents/snapshots-municipaux.agent.md), notamment la conservation des segments PJCCI sans geometrie verifiable.

## Limites

- Cette commande autorise uniquement l'inspection et les tests locaux. Ne modifie pas les fichiers, ne rafraichis pas les snapshots et ne corrige pas les anomalies trouvees.
- Aucun `git add`, commit, push, reset, revert, pull, creation de branche ou deploiement. Ne contourne aucune protection de branche. Une autorisation ancienne ne vaut pas pour cette publication.
- N'installe aucune dependance; signale les outils manquants. Les scripts, captures et rapports temporaires restent hors depot.

## Verification

1. Inspecte l'etat Git, la branche, le suivi distant et les diffs indexes et non indexes, ainsi que les fichiers non suivis. Identifie le perimetre propose sans inclure automatiquement du travail sans rapport.
2. Par defaut, examine les changements locaux par rapport a `HEAD`. Si une revision est fournie, utilise-la explicitement. Sans changement local, signale les commits en avance connus; si la base de comparaison est ambigue, demande-la. L'etat distant localement memorise n'est pas une preuve de l'etat actuel du serveur.
3. Lis les fichiers modifies et leurs contrats voisins. Recherche regressions, secrets, donnees personnelles, liens prives, fichiers temporaires et modifications hors perimetre. Ne reproduis aucune valeur sensible dans le rapport.
4. Lance `git diff --check` sur les changements indexes et non indexes et `node --check` sur chaque JavaScript modifie, ainsi que les controles obligatoires du projet. Valide les JSON touches, comptes, identifiants, references, dates et geometries. Pour les snapshots, verifie l'accord avec toutes les dates du catalogue sans les avancer.
5. Pour les changements applicatifs ou de donnees, execute les controles pertinents du [prompt valider-carte](./valider-carte.prompt.md) sur `http://localhost:5500/index.html`. Ne te contente pas de reutiliser un ancien resultat si les fichiers ont change depuis. Verifie les vrais parcours affectes dans Chromium, ordinateur/mobile et FR/EN selon le risque.
6. Pour des changements exclusivement documentaires ou de prompts, valide plutot les liens, le frontmatter, les noms d'agents et la coherence des instructions; indique pourquoi une validation navigateur n'est pas applicable. Ne rafraichis aucune source pour tester un prompt.
7. Distingue defauts nouveaux, anomalies preexistantes, pannes externes et controles bloques. Ne transforme pas un test non execute en succes. Confirme que les tests n'ont modifie ni les fichiers ni l'index.

## Bilan de publication

Reponds en francais avec un verdict `pret`, `bloque` ou `validation incomplete`, les fichiers concernes, les changements, les preuves des tests et les risques residuels. Presente les blocages avant le resume.
Propose un message de commit sans le creer. Rappelle que `main` alimente la production GitHub Pages, que rien n'a ete publie et qu'une autorisation explicite distincte est necessaire avant commit et push. Meme apres un futur push, le deploiement public devra etre confirme separement.