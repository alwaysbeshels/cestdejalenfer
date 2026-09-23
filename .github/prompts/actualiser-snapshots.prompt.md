---
name: actualiser-snapshots
description: "Actualiser les snapshots de la carte, verifier leurs sources et leur affichage, sans publication automatique."
argument-hint: "Toutes les sources par defaut, ou une selection : PJCCI, Mont-Royal, signalements citoyens..."
agent: "Snapshots officiels"
---

# Actualiser les snapshots

Effectue la mise a jour des snapshots de ce projet jusqu'a leur validation locale.
Applique integralement les regles de l'[agent Snapshots officiels](../agents/snapshots-municipaux.agent.md), qui reste la reference pour les schemas, les politiques et les procedures propres a chaque source.
Respecte aussi les [regles de publication](./deployment-rules.md).

## Perimetre

- Si le message accompagnant cette commande nomme des sources, ne traite que celles-ci.
- Sans precision, inventorie et traite tous les snapshots existants dans `data/`, y compris les signalements citoyens et les sources complementaires comme Noovo. Ne presente pas ces deux dernieres comme des avis officiels.
- Ne cree pas de nouvelle source, ne modifie pas l'interface et ne rafraichis pas les flux uniquement live dans le cadre de cette demande. Leur consultation pour valider une jointure existante reste permise.
- Ne fais aucun commit, push, deploiement ou installation de dependances sans demande explicite distincte. Une autorisation de publication d'une session precedente ne vaut pas pour cette execution.

## Execution

1. Verifie l'etat du depot et preserve les modifications deja presentes. Lis le [README](../../README.md), le [catalogue](../../data/sources.js), les portions utiles du [chargeur](../../js/app.js), les snapshots du perimetre et leurs generateurs. Conserve une base de comparaison avant toute ecriture; les fichiers temporaires restent hors depot.
2. Pour chaque source, confirme la methode d'extraction et les regles de l'agent. Verifie qu'un generateur les respecte avant de l'executer : ne remplace pas une interpretation validee par des dates codees en dur, une reconstruction inutile ou une sortie partielle. Garde les traitements separes par source.
3. Recupere et valide les reponses sources completes : statut, schema, pagination, identifiants, dates, impacts et geometries. Utilise Chromium/Playwright lorsque la procedure l'exige. Un HTTP 200, une reponse HTML inattendue ou un cache local ne suffisent pas.
4. Compare les donnees admissibles aux donnees existantes avant tout calcul geographique. Preserve les identifiants, textes et geometries inchanges. Applique les exceptions propres a chaque source, notamment le mode ajout seulement des rues pietonnes et la conservation exacte de leurs fiches manuelles.
5. Pour les citoyens, lis d'abord la configuration privee hors depot decrite dans l'agent. Analyse toutes les lignes et toutes les colonnes, avec le texte libre integral et le controle de confidentialite, avant de normaliser une reponse nouvelle ou modifiee. Conserve les reponses inchangees exactement; ne fusionne ni ne supprime silencieusement. Ne publie jamais les contacts, le lien ou l'identifiant du tableur, meme dans les logs.
6. Pour PJCCI, croise obligatoirement l'archive et la carte, distingue les restrictions et leurs horaires, et laisse sans trace les segments sans geometrie verifiable. Pour toute autre source composite, verifie toutes les pieces necessaires; un article seul ne revalide pas une image indisponible.
7. Apres une verification complete reussie, inscris l'heure ISO-8601 reelle de verification dans `extractedAt` et dans toutes les entrees correspondantes du catalogue. Si les donnees sont inchangees, ne modifie que ces metadonnees de fraicheur. N'avance pas les dates de provenance geographique sans nouvelle verification de la geometrie.
8. En cas d'echec, de verification partielle ou d'acces manquant, conserve le snapshot precedent et son horodatage, explique le blocage et continue avec les autres sources. Ne presente jamais une source non verifiee comme actualisee.

## Validation

- Apres chaque mise a jour, valide le JSON, les comptes, les identifiants et references, les dates et la provenance des geometries. Pour un rafraichissement de metadonnees seul, prouve que tout le reste du snapshot est identique a la base de comparaison.
- Verifie l'accord des horodatages avec toutes les entrees du catalogue et l'absence de donnees privees dans les fichiers publics. Lance `node --check` sur les JavaScript modifies et les controles supplementaires requis par l'agent.
- Charge le vrai site local dans Chromium sur `http://localhost:5500/index.html`, avec les outils deja disponibles. Verifie les snapshots charges, les comptes attendus, les lignes, polygones et points pertinents, les popups et les filtres. Pour les citoyens, controle les horaires distincts et l'absence de requetes au tableur.
- Verifie le rendu ordinateur et mobile selon les controles de l'agent. Tiens compte du moteur Leaflet reel : un rendu canvas n'a pas necessairement de chemins SVG. Attends la fin des animations avant de mesurer un popup.
- Termine par le controle du diff. Signale les echecs et les anomalies preexistantes sans corriger des problemes d'interface hors perimetre ni annoncer des tests non realises comme reussis.

## Bilan attendu

Reponds en francais avec un tableau par snapshot : source publique, etat (`modifie`, `verifie sans changement`, `echec / non verifie`), derniere verification reussie avec fuseau, nombres recus et retenus, exclusions motivees et types de geometries.
Resume les changements importants, les segments sans trace, les declarations en attente de revue, les limites de fraicheur et les validations executees ou bloquees.
Precise les fichiers modifies et rappelle que les changements restent locaux, sans commit ni push. Cette verification des sources ne confirme pas les conditions sur le terrain.