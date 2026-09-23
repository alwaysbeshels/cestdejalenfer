---
name: auditer-snapshots
description: "Auditer les snapshots locaux, leur coherence et leur confidentialite sans consulter les sources ni modifier les fichiers."
argument-hint: "Tous les snapshots par defaut, ou une selection : PJCCI, citoyens, rues pietonnes..."
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

## Resultat

Reponds en francais avec les anomalies classees par gravite et leurs fichiers, puis un tableau par snapshot : derniere verification enregistree, age, comptes, geometries, exclusions ou incoherences et limites.
Precise que les sources distantes et les conditions sur le terrain n'ont pas ete reverifiees. Propose `/actualiser-snapshots` pour un rafraichissement ou `/valider-carte` pour la validation navigateur, sans les executer automatiquement.