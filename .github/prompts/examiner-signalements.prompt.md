---
name: examiner-signalements
description: "Revoir les declarations citoyennes en attente, leurs dates, horaires et localisation, sans inventer de renseignements ni contacter les personnes."
argument-hint: "Toutes les fiches en attente par defaut, ou un identifiant, une rue ou une municipalite."
agent: "Snapshots officiels"
---

# Examiner les signalements citoyens

Applique integralement la section citoyenne de l'[agent Snapshots officiels](../agents/snapshots-municipaux.agent.md).
Il s'agit d'une revue des declarations deja conservees, pas d'une synchronisation automatique du formulaire ni d'une confirmation municipale.

## Perimetre

- Sans precision, examine toutes les fiches en attente du [snapshot citoyen](../../data/citizen-reports-snapshot.json). Si une selection est fournie, limite la revue a ces fiches et aux rapprochements necessaires.
- Les modifications permises concernent uniquement ce snapshot et, si necessaire, sa documentation dans le [README](../../README.md). Ne modifie pas le chargeur, le catalogue ou les autres sources et ne change pas `inMap` dans cette revue.
- Aucun contact avec un declarant, publication de coordonnees personnelles, commit, push, installation ou backend. Les preuves temporaires restent hors depot.

## Revue

1. Lis le schema, les comptes et le contrat citoyen du [chargeur](../../js/app.js). Preserve une base de comparaison et les modifications deja presentes.
2. Analyse ensemble toutes les colonnes exportables de chaque reponse, les cellules vides, le commentaire integral et les reserves existantes avant toute decision. Une information de fin de commentaire a autant de poids qu'un champ structure.
3. Pour chaque incertitude, distingue lieu, municipalite/arrondissement, limites, dates, direction, impact, horaire, origine et maintien declare. Ne transforme pas l'observation en debut de travaux, une heure absente en 24/24 ou une date estimee valide en date nulle.
4. Verifie les lieux ou liens justificatifs utiles avec les sources autorisees par l'agent. Preserve une geometrie deja verifiee si le lieu n'a pas change. Une voie officielle confirme le lieu, pas l'entrave. Sans limites verifiables, ne dessine rien et ne prolonge pas le trace a partir d'une autre declaration.
5. Compare les doublons possibles par limites, effets et periodes; ne fusionne ni ne supprime silencieusement. Conserve les formulations contradictoires et precise ce qui manque pour les resoudre.
6. Si une relecture de la reponse originale est indispensable, suis l'acces prive memorise de l'agent, sans afficher le lien ni les contacts. Ne demande ce lien que si la configuration est absente ou inexploitable. Une lecture partielle ne constitue pas un rafraichissement complet; oriente vers `/actualiser-snapshots signalements citoyens` pour cette operation distincte.
7. Corrige uniquement les elements dont les preuves permettent une conclusion, avec provenance et avertissements. Conserve chaque fiche non concernee exactement. N'avance pas `extractedAt` pour une correction locale; une verification geographique reelle peut seule avancer la provenance geographique concernee.
8. Une fiche reste hors carte tant que son admissibilite n'est pas etablie. Si tu changes `review.mapEligible`, mesure l'effet sur le chargeur deja actif et valide la fiche dans Chromium avant de declarer l'integration reussie. L'admissibilite ne signifie jamais une verification officielle de la restriction.
9. Valide les JSON, comptes, identifiants, references, dates, horaires et l'absence de donnees personnelles. Pour toute modification fonctionnelle, applique les tests Chromium citoyens de l'agent sur le site local : couches, popup, bornes de dates, semaine/week-end, heures et stationnement separe. Preserve les cellules source exportables sauf retrait de donnees personnelles.

## Resultat

Reponds en francais avec les fiches examinees, les preuves obtenues, les corrections, les impacts admissibles et ceux restant en attente avec une raison precise. Distingue derniere extraction et verification geographique. Signale les questions a clarifier sans contacter qui que ce soit; indique les tests executes et les limites restantes.