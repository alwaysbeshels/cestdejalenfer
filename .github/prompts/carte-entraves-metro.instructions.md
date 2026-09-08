---
description: Carte des entraves auto du Grand Montreal - Mode production strict
tools:
  disabled: []
---

# Carte des entraves metro - Instructions Agent

## 🚨 RÈGLES DE DÉPLOIEMENT ABSOLUES

### Jamais déployer sans permission explicite
- **JAMAIS** faire `git push` sans demande directe: "ok deploy" ou "pousse main"
- **JAMAIS** faire `git commit` sans validation complète
- Les commits locaux seulement pour tests internes, jamais en production

### Avant TOUT déploiement:
1. ✓ Valider: `node --check js/app.js`
2. ✓ Tester RÉELLEMENT sur `http://localhost:5500` (pas de suppositions)
3. ✓ **ATTENDRE** confirmation explicite de l'utilisateur
4. ✓ Rappeler: "main = production directe, visible en ~2-3 min"

### Si code bugué s'échappe en production:
1. Signaler immédiatement
2. Proposer `git revert` avec hash spécifique
3. Attendre permission avant pousher
4. Dire utilisateur: hard-refresh (Cmd+Shift+R) pour voir changement

---

## 📋 Branches & Déploiement

**main** → Production directe (GitHub Pages)
- Chaque commit visible publiquement en ~2-3 minutes
- Aucun staging, aucune validation automatique
- **C'est une branche HOT** ⚠️

---

## 🔧 Processus de Correction

### 1. Lire le problème COMPLÈTEMENT
   - Ne pas deviner
   - Reproduire avec test réel (Playwright sur localhost)

### 2. Analyser le CODE
   - Tracer la logique de bout en bout
   - Trouver la vraie cause, pas une correction hasardeuse

### 3. Faire UNE correction à la fois
   - Éviter les changements en cascade
   - Valider après CHAQUE changement avec `node --check`

### 4. Tester RÉELLEMENT
   - Browser Playwright ou Safari/Chrome manuel
   - `localhost:5500/index.html`
   - Pas d'URL de production avant confirmation

### 5. Rapport honnête
   - Dire ce qui a été prouvé
   - Dire ce qui est assumé
   - Dire ce qui reste à vérifier côté utilisateur

---

## 🗺️ Domaine: Carte Routière Grand Montreal

Cette app est un **cockpit de trafic** pour le Grand Montreal (métro + villes liées):
- Couvre: Montreal, Laval, Longueuil, Dorval, Saint-Eustache, Boisbriand, Terrebonne, etc.
- Routes: Autoroutes, ponts, viaducs, rues municipales
- Data: Officielle (MTMD/Quebec 511, Mobilité Montreal, ArcGIS municipal)
- Pas: Pages marketing, contenu externe, API tier-3

### Sources Officielles Actuelles
- Montreal WFS
- Quebec 511 / MTMD GeoJSON
- UCI restrictions
- Longueuil surfaces
- Laval MapServer
- Repentigny Open511
- ArcGIS municipal: Dorval, Boisbriand, Saint-Eustache, Chateauguay, Terrebonne, etc.

### Données de Fallback
- Closures.js (dernier recours, marqué "fallback")
- Snapshots JSON (Beaconsfield, Mont-Royal, pedestrian streets)

---

## 🎯 Points d'Attention Connus

### Flicker Panning/Zoom
**Cause**: Canvas renderer padding trop bas clipe geometry aux bordures de viewport
**Fix**: `L.canvas({ padding: 2.0 })` ligne 3278
**Validation**: Layers stables avant/après pan/zoom

### Points → Lines Enrichissement
**Processus**: Point municipal + Nominatim query → MultiLineString
**Vitesse**: 50ms throttle entre requêtes (10 Points ≈ 2-3 sec)
**Problèmes connus**:
- Nominatim cherche noms de rue, pas descriptions ("Reconstruction de l'A-520" fail)
- 19/29 Points non-enrichissables (pas noms extractibles)
- 10 Points réussis (Assomption, Saint-Eustache, Dorval, Terrebonne, Boisbriand)

**Re-render Logic**:
- Track `_geometryType` sur chaque couche rendue
- Re-render SEULEMENT si type change (Point→MultiLineString)
- Sinon SKIP = pas de flicker

### Parking Filter
**Comportement**: Doit être UNCHECKED par défaut
**Vérification**: Aucun attribut `checked` sur l'input

---

## 📝 Session Récente (2026-09-08)

**Problèmes résolus**:
1. ✅ Flicker panning/zoom → Canvas padding + geometry type tracking
2. ✅ Parking checked by default → Attribut `checked` retiré
3. ✅ Points non enrichis → Nominatim with query variations (rue/avenue/montée)

**Temps réduit**:
- 1100ms throttle → 50ms
- 10 Points: 11 sec → 2-3 sec

**Fichiers changés**:
- `js/app.js`: Canvas, fetchNamedStreetGeometry improvements, renderMap logic
- `index.html`: Parking checkbox fix

**Fichiers de test supprimés** (37× .cjs):
- Tous nettoyés, aucun artifact de debug

---

## ✅ Checklist Avant Déploiement

- [ ] `node --check js/app.js` passe
- [ ] Tests locaux sur `localhost:5500` réussis
- [ ] Pas de "suppositions" ou "probablement ça marche"
- [ ] Utilisateur a dit "ok" ou "deploy" explicitement
- [ ] README.md à jour (changements/sources)
- [ ] Hard-refresh expliqué si cache possible
