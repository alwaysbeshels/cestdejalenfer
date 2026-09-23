---
name: valider-carte
description: "Tester la carte locale dans Chromium, ses filtres, popups et versions FR/EN sur ordinateur et mobile, sans modifier les fichiers."
argument-hint: "Validation generale par defaut, ou un parcours precis : filtres, popups mobiles, sources..."
agent: "Carte des entraves"
---

# Valider la carte

Execute une validation reelle, sans corriger le code ni modifier les donnees.
Applique les contrats de l'[agent Carte des entraves](../agents/carte-entraves-metro.agent.md). Pour les snapshots, les regles specifiques de l'[agent Snapshots officiels](../agents/snapshots-municipaux.agent.md) font reference, notamment les segments PJCCI sans geometrie verifiable.
Respecte les [regles de publication](./deployment-rules.md). Aucun commit, push, deploiement, rafraichissement de snapshot ou ajout de dependance n'est autorise par cette commande.

## Execution

1. Lis le [README](../../README.md), les scripts et les contrats pertinents du [chargeur](../../js/app.js). Verifie l'etat du depot pour distinguer les anomalies existantes des changements en cours.
2. Si un parcours accompagne la commande, cible-le et teste ses regressions proches. Sinon, couvre les parcours ci-dessous. Utilise les outils deja installes; signale un prerequis manquant sans l'installer.
3. Reutilise le serveur de ce projet sur `http://localhost:5500/index.html` ou demarre le serveur statique prescrit. Ne termine pas un processus existant et ne teste pas un autre projet servi sur ce port. Garde captures et scripts temporaires hors depot.
4. Ouvre le site reel dans Chromium. Collecte les erreurs JavaScript, les echecs reseau et les reponses des snapshots; distingue une panne externe d'un defaut du site. Un HTTP 200 ou `node --check` ne prouve pas le fonctionnement de la carte.
5. Controle le chargement des sources et leurs comptes, la distinction entre donnees live, snapshots et secours, puis les geometries effectivement presentes : lignes, multilignes, polygones et points. Un jeu de donnees vide ne suffit pas a valider un type de couche.
6. Teste la recherche avec et sans accents, les sources, les impacts, les periodes jour/nuit, les bornes inclusives de dates et la remise a zero. Le stationnement reste decoche par defaut. Verifie la coherence entre compteurs, liste et viewport apres deplacement et zoom.
7. Ouvre des popups en cliquant les vraies couches Leaflet. Controle textes, liens, horaires et reserves. Pour les citoyens, teste jours ouvrables/week-end, heures internes/externes a la fermeture et stationnement distinct; aucune requete au tableur prive ne doit partir du site.
8. Teste les routes `/fr/` et `/en/`, la bascule de langue et les liens vers la FAQ. Les textes publies par les sources ne doivent pas etre traduits arbitrairement.
9. Verifie ordinateur et mobile : menu ouvert/ferme, fermeture du popup, zoom, deplacement et absence de chevauchement ou de texte tronque. Controle le canevas Leaflet et ses pixels, pas seulement des chemins SVG. Mesure les popups apres stabilisation des animations et du viewport.
10. Lance les controles de syntaxe pertinents sur les fichiers reellement testes et confirme qu'aucun fichier du depot n'a ete modifie par les tests.

## Resultat

Reponds en francais. Presente d'abord les anomalies avec gravite, reproduction, attendu, observe et fichier concerne lorsqu'il est identifie. Puis liste les controles reussis, echoues, bloques ou non applicables avec leurs preuves et les viewports testes.
Ne corrige rien dans cette execution. Ne declare pas la carte validee si un controle requis echoue ou reste bloque. Fournis l'URL locale utilisee.