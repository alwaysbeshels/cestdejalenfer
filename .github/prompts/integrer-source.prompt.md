---
name: integrer-source
description: "Rechercher et cataloguer une source officielle de travaux pour preparer son integration, sans activer de nouveau chargeur."
argument-hint: "Municipalite ou autorite et, si disponible, URL officielle a examiner."
agent: "Integration Ville"
---

# Preparer l'integration d'une source

Applique les regles de l'[agent Integration Ville](../agents/integration-ville.agent.md).
Cette commande couvre la recherche, la validation et le catalogage; elle n'autorise pas le branchement a la carte.
Le seul fichier modifiable est le [catalogue](../../data/sources.js). Aucun autre fichier, rapport, script ou cache ne doit etre cree dans le depot. Aucun serveur, commit, push, branche ou installation de dependances.

## Recherche et preparation

1. Identifie la municipalite ou l'autorite demandee. Si aucune cible exploitable n'est fournie, demande-la avant toute recherche ou modification. Distingue municipalite, arrondissement et autorite d'infrastructure; ne deduis pas une responsabilite du seul emplacement.
2. Lis le catalogue et les portions pertinentes du [chargeur](../../js/app.js) pour reperer les sources deja connues. Ne confonds pas un lien documentaire avec un flux effectivement utilise.
3. Recherche les pages, cartes et services officiels selon la procedure de l'agent. Examine les reponses et metadonnees reelles, la pagination et des exemples representatifs. Ni un HTTP 200 ni un resultat de recherche ne suffisent.
4. Verifie proprietaire, impact automobile, identifiants, dates/statut, directions, horaires, detours, geometries et systeme de coordonnees declare. Ne classe jamais l'impact a partir d'une couleur.
5. Etablis la faisabilite depuis un site statique : acces public, CORS, limites de debit, licence et fraicheur lorsqu'ils sont documentes. Une requete reussie dans Node ne prouve pas l'acces depuis GitHub Pages. Si CORS n'a pas ete teste dans le navigateur, indique-le.
6. Ajoute uniquement les URL directes verifiees au catalogue, sans doublons ni reformatage general. Une nouvelle source reste `inMap: false` tant qu'elle n'est pas reellement chargee et validee; respecte le mecanisme existant qui calcule ce drapeau.
7. Ne cree pas de snapshot et ne modifie aucun chargeur. Prepare dans la reponse les prochaines etapes : flux live si compatible, snapshot si necessaire, ou documentation seule si les donnees sont insuffisantes. Ne devine ni API alternative ni geometrie et ne contourne pas une authentification.
8. Apres une modification, lance `node --check data/sources.js`, verifie le chargement du catalogue et les doublons d'URL. Distingue les doublons preexistants de ceux introduits; controle que le diff ne touche que les entrees concernees.

## Resultat

Reponds en francais avec les URL validees, la methode et le schema observes, les comptes examines, les contraintes et la solution de branchement recommandee. Separe clairement `catalogue`, `charge par l'application` et `valide en navigateur`.
Si aucune source directe ne peut etre validee, n'ajoute rien et explique pourquoi. Le branchement effectif reste une demande distincte; ne l'annonce pas comme realise.