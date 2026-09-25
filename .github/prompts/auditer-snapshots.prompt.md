---
name: auditer-snapshots
description: "Auditer les snapshots locaux auto et pietons consolides, leur coherence et leur confidentialite sans consulter les sources ni modifier les fichiers."
argument-hint: "Tous les snapshots par defaut, ou une selection : PJCCI, citoyens, rues pietonnisees, entraves pietonnes consolidees..."
agent: "Snapshots officiels"
---

# Auditer les snapshots locaux

Effectue un audit en lecture seule selon l'[agent Snapshots officiels](../agents/snapshots-municipaux.agent.md).
Cette commande ne rafraichit aucune source, ne lance aucun generateur et ne modifie aucun fichier ni horodatage. Aucun acces au tableur prive, commit, push ou installation de dependances.

## Controles

1. Inventorie les snapshots existants dans `data/`, ou seulement les sources nommees dans le message. Lis leurs contrats dans le [README](../../README.md), le [catalogue](../../data/sources.js) et les portions pertinentes du [chargeur](../../js/app.js).
2. Valide le JSON et les schemas propres a chaque source sans imposer un schema municipal a PJCCI. Verifie les comptes, identifiants stables, references partagees et doublons possibles. Des impacts distincts au meme endroit ne sont pas automatiquement des doublons.
3. Controle `extractedAt`, son format et sa concordance avec toutes les entrees du catalogue. Calcule l'age a partir de l'heure reelle. N'invente pas de seuil de peremption et distingue une date de verification d'une modification publiee ou d'une verification geographique.
4. Controle les dates, leur ordre, les horaires et la politique active/future propre a chaque source. Distingue un enregistrement devenu expire depuis l'extraction d'une erreur de filtrage a l'extraction. Respecte les exceptions UCI et le mode ajout seulement des rues pietonnes; ne recommande pas une suppression automatique de ces dernieres.
5. Verifie les types, coordonnees finies, ordre et systeme declares, provenance et limites documentees des geometries. Preserve les geometries manuelles. Signale une preuve absente sans inventer un trace et sans assimiler une emprise de chantier a une ligne de circulation.
6. Controle les sections, bullets, directions, avertissements, dates et rapprochements archive/carte de PJCCI. Les segments explicitement sans geometrie sont une limitation admissible, pas une invitation a produire un point ou un itineraire de repli.
7. Pour les citoyens, analyse ensemble tous les `reportedFields` disponibles et le commentaire integral. Verifie dates declarees, reserves, horaires distincts, `geometryRef`, statut de revue et comptes. Controle la confidentialite sans reproduire de donnees personnelles dans le rapport. Une comparaison locale ne prouve pas la fidelite a des reponses distantes non consultees.
8. Compare le catalogue et le code de chargement pour reperer les incoherences de `inMap`. Indique explicitement que la lecture du chargeur ne prouve pas son fonctionnement en navigateur; ne certifie pas l'integration reelle sans le test correspondant.

## Snapshot pieton consolide

- Inclus `data/pedestrian-closures-snapshot.json` et son entree de details `data/montreal-pedestrian-notices-snapshot.json` dans l'inventaire global. Distingue-les du snapshot de rues pietonnisees de la carte auto.
- Pour le fichier consolide, controle `schemaVersion`, `generatedAt`, `sources`, `records` et `review`, sans exiger un `extractedAt` global. Calcule la fraicheur source par source : `checkedAt` pour le live, `sourceExtractedAt` pour les entrees locales. L'heure d'assemblage ne reverifie aucune source.
- Verifie le rattachement `sourceKey`, les preuves, URLs, dates, horaires, statuts `openEnded`, cotes explicites/inconnus et geometries. Une fermeture de rue seule ne prouve pas celle du trottoir; la pietonnisation n'est pas une entrave a la marche.
- Controle les references et les criteres de regroupement partages des popups sans supprimer les troncons ni confondre les impacts distincts. Une reference commune ne suffit pas a etablir un doublon.
- Signale les mentions en `review`, echecs, donnees locales non reverifiees et lacunes de descriptions/pages detaillees. Ne lance aucun des generateurs ou validateurs navigateur pendant cet audit en lecture seule : certains contactent les flux live et ecrivent des captures. Propose une validation distincte si necessaire.

## Resultat

Reponds en francais avec les anomalies classees par gravite et leurs fichiers, puis un tableau par snapshot : derniere verification enregistree, age, comptes, geometries, exclusions ou incoherences et limites.
Precise que les sources distantes et les conditions sur le terrain n'ont pas ete reverifiees. Propose `/actualiser-snapshots` pour un rafraichissement ou `/valider-carte` pour la validation navigateur, sans les executer automatiquement.