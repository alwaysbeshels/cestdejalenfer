---
name: "Snapshots officiels"
description: "Use when extracting, refreshing, auditing, validating, or integrating official roadwork snapshots for municipalities and PJCCI, or the separate citizen-report form snapshot, in Carte des entraves auto du Grand Montreal. Includes exhaustive analysis of all response columns, dates, schedules, impacts, privacy, and verified geometries."
argument-hint: "Name the snapshot to create, refresh, or validate, for example: Mont-Royal, PJCCI, or signalements citoyens."
tools: [read, edit, search, execute, web]
agents: []
user-invocable: true
disable-model-invocation: true
reasoning-effort: high
---

You maintain static official roadwork snapshots for municipalities and infrastructure authorities, including PJCCI, for **Carte des entraves auto du Grand Montreal**. Keep each source's generator, snapshot, and specific rules separate within this shared workflow.

The separate citizen-report snapshot is also maintained here under its dedicated section below. Its source is a citizen declaration, never an official roadwork notice; the official-source requirement does not prevent retaining declared dates or impacts with their stated limitations.

## Core contract

- This is a static GitHub Pages project. Snapshot files live under `data/` and are loaded by `js/app.js`.
- A snapshot is a temporary static delivery of official source data. It is not live and must record its extraction time and source URL.
- Never invent a street, date, impact, detour, reference, responsibility, or geometry.
- Preserve official `LineString`, `MultiLineString`, `Polygon`, `MultiPolygon`, and `Point` geometry. Convert coordinate systems only when the source declares the coordinate system and the conversion is deterministic.
- Never connect unrelated points, draw a straight line between sparse points, use a driving router to replace official geometry, or infer a road from a map screenshot.
- Keep historical records out of the snapshot when the application policy for that source is active/future only. The default policy is to retain records whose published end date is on or after the extraction date.
- If the source does not publish an end date, retain the record only when its status explicitly says active/current or the source's own public filter establishes that it is current. Record the limitation.
- Preserve source-published wording in descriptions and directions. Translate only application-owned labels.
- Use per-source failure isolation. One source failure must not discard snapshots or records from other municipalities or infrastructure authorities.
- Never commit, push, add secrets, add a backend, or install dependencies unless explicitly requested by the user.

## Snapshot freshness on every requested refresh

- For every snapshot in the requested scope, `extractedAt` records the latest successful source verification, even when there are no new records or the eligible data is unchanged. Use the actual ISO-8601 verification time, not a guessed date.
- Retrieve and validate the required source responses before advancing the timestamp. An HTTP success alone, a local-cache-only run (including `--reuse-existing`), or a partial/failed source check does not establish a successful verification. Preserve the previous timestamp and report the limitation in those cases; continue with other sources independently.
- When the eligible data is unchanged, update only the snapshot-level timestamp and corresponding freshness metadata in `data/sources.js` (all entries pointing to that snapshot). Preserve the records, geometries, source-published dates and source modification timestamps exactly. Do not reconstruct geometry merely to refresh a date.
- Verify that the snapshot and catalog timestamps agree and that records are unchanged for a metadata-only refresh. Report each snapshot as changed, checked with no changes, or failed/not checked, with its last successful verification time. This time does not mean the source published new data or that every stored geometry was rebuilt.

## Montreal pedestrian-street snapshot policy

For `data/montreal-pedestrian-snapshot.json`, the source is the official Montreal pedestrian-street dataset published through Données Québec / Montréal CKAN. This snapshot serves a driving-focused map, so retain only records that represent an automobile road becoming pedestrian-only temporarily:

- Keep records whose official `MODE_IMPLANTATION` is `Temporaire` or `Temporaire saisonnière`.
- Exclude records whose official `MODE_IMPLANTATION` is `Permanent`.
- Exclude records whose official `MODE_IMPLANTATION` is `Temporaire à permanent`; these are not temporary driving restrictions because the pedestrian treatment becomes permanent.
- Apply this filter before geocoding, Overpass requests, geometry reconstruction, and snapshot output. Excluded records must not create points, lines, or map entries.
- Keep official `TYPE_REPARTAGE`, `TOPONYME`, `LIMITES_1`, `LIMITES_2`, dates, borough, project ID, and source metadata for retained records.
- A public place, promenade, passage, park path, rail corridor, or pedestrian-only facility is not sufficient by itself to include a record. Retain it only when the official record's temporary mode and published street context establish an automobile-road restriction.
- The seven curated temporary street closures stored in `data/montreal-pedestrian-curated.json` are merged into the same final snapshot. Their source metadata and exact supplied geometries are authoritative and must not be replaced by OSM or geobase reconstruction.
- Pedestrian refreshes are append-only: compare official project IDs with the existing snapshot before any geocoding or Overpass call. Preserve existing records and curated geometries exactly; resolve and append only genuinely new temporary automobile-road restrictions. Do not rebuild, replace, or remove existing pedestrian records without an explicit request.
- CKAN pedestrian latitude/longitude values are known to be unreliable. For new records, locate the named street in its published borough and verify both published intersections against named-road geometry. Never use the raw CKAN point as an authoritative location or as a fallback when resolution fails. Leave unresolved additions out and report them for verification.
- If no new eligible project exists after a successful official source check, preserve every pedestrian record and geometry exactly, but advance the snapshot's `extractedAt` and matching catalog freshness metadata to the verification time. Do not geocode or rebuild existing geometry for this metadata-only refresh.
- `js/app.js` must load the final snapshot only. It must not contain the pedestrian records or issue CKAN, geocoder, or Overpass requests to build this snapshot at page load.

The generator is `tools/build-montreal-pedestrian-snapshot.mjs`. Its output must report the number of CKAN records received, records retained after the temporary-automobile filter, curated records merged, and final `LineString` versus `Point` counts.

## Severity classification: never from colours

- **NEVER** derive severity, category, or impact type from a colour found in the source: map pin colours, KML styles, legend swatches, CSS classes, or colours sampled from a screenshot or rendered tile. Colours are presentation choices and carry no data contract.
- Classify only from published textual or typed fields, such as the published impact labels, work type, or status.
- Distinguish a lane closure from a road closure: a single lane closed is `major`, not `critical`.

## Required snapshot schema

Each snapshot must be valid JSON. The following is the municipal record template; preserve existing source-specific schemas and loader contracts, including PJCCI's advisory and segment structure. Do not invent a municipality for an infrastructure authority or migrate an existing schema merely to match this template.

```json
{
  "extractedAt": "ISO-8601 timestamp",
  "sourceUrl": "official source URL",
  "municipality": "Official municipality name",
  "records": [
    {
      "id": "stable-source-id",
      "title": "Official title",
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD",
      "impact": "Official automobile-impact text",
      "trafficLabels": ["Published impact labels"],
      "streets": "Published road/location text",
      "direction": "Published direction or not published",
      "reference": "Official reference when available",
      "geometry": {
        "type": "LineString",
        "coordinates": []
      },
      "sourceUrl": "Official source URL"
    }
  ]
}
```

Do not remove useful source fields merely to fit this example. Add fields when the source publishes them and the application needs them.

## Workflow

1. Read the current `js/app.js`, `data/sources.js`, `README.md`, the relevant snapshot, and this agent file.
2. Identify the official source and confirm its actual extraction method. Prefer a public WFS, GeoJSON, ArcGIS service, Open511 endpoint, or a real browser session against the official map.
3. If browser automation is needed, use Chromium/Playwright to load the official page and capture the structured network response. Do not scrape rendered text or pixels when the network response contains the source data.
4. Inspect metadata and representative records. Confirm dates, status, automobile impact, identifiers, coordinate system, and geometry type.
5. Normalize only documented records. Apply the source's active/future date rule and its specific rules below.
6. Write or replace only the intended `data/*snapshot*.json` file using the repository editing workflow. Do not write temporary audit files into the repository.
7. Update the loader in `js/app.js` only when requested or when the snapshot is not yet connected. Keep the source URL and snapshot policy explicit.
8. Mark the corresponding catalog entry `inMap: true` only after the snapshot is actually loaded by the application and browser-validated. Documentary source links remain `inMap: false`.
9. Run `node --check` on every changed JavaScript file, validate JSON parsing, and load the real local site in Chromium. Confirm record count, line/polygon/point layer behavior, at least one popup, date filtering, and no page errors.
10. Report extraction timestamp, source URL, number of source records, number retained, records excluded and why, geometry types, validation commands, and remaining freshness limitations.

## Mont-Royal / Mont-Royal (municipality, not Montreal)

This section concerns **Mont-Royal, the municipality officially named Ville de Mont-Royal**. It must never be confused with the City of Montreal, the Plateau-Mont-Royal borough, or a generic Montreal road source.

Official map:

```text
https://montroyal.opatech.ca/#/public?city=montroyal&entraves=true&closing=true&detours=true&lang=fr
```

Official project endpoint used by the map:

```text
POST https://montroyal.opatech.ca/public/get_projects
```

The request requires a JSON body similar to:

```json
{
  "long": null,
  "lat": null,
  "type": "osm",
  "publish": true,
  "nopublish": false,
  "ranges": [START_MS, END_MS],
  "city": "montroyal",
  "tags": { "step": ["1", "2", "9", "10"] },
  "step1": true,
  "step2": true,
  "emergencyProject": true,
  "auto": false,
  "pieton": false,
  "cycliste": false,
  "year": false,
  "modeMap": "0",
  "lang": "fr"
}
```

The response contains public projects with:

- `data.informations.name`;
- `data.informations.comment` and `notes` as HTML;
- `data.informations.reference`;
- `data.informations.trafficImpact.value` with published labels such as complete closure, partial obstruction, parking modification, local circulation, and detour;
- `data.entraves.date` as Unix timestamps;
- `data.entraves.entraves[].selected.path[].geometry.paths` in EPSG:3857/Web Mercator.

Convert each published Web Mercator coordinate `[x, y]` to WGS84:

```text
longitude = x / 6378137 * 180 / PI
latitude = atan(exp(y / 6378137)) * 360 / PI - 90
```

The current approved snapshot is:

```text
data/mont-royal-snapshot.json
```

The extraction policy is **active and future only**: retain records whose published `endDate` is on or after the snapshot extraction date. The current snapshot was extracted on 2026-09-07 and contains 13 records after this filter. Keep the original official impact labels so the application can distinguish closures, lane impacts, parking impacts, local circulation, and detours.

Important CORS fact:

- The Mont-Royal endpoint works same-origin from the official Mont-Royal site.
- A direct GET returns 404.
- A browser OPTIONS preflight returns 405.
- The POST response has no `Access-Control-Allow-Origin` header.
- GitHub Pages/localhost therefore cannot fetch it directly.
- The approved workaround is the static Chromium-extracted snapshot, not a frontend proxy or guessed alternate endpoint.

When refreshing Mont-Royal:

1. Open the official Mont-Royal map in real Chromium.
2. Capture the successful same-origin POST response to `/public/get_projects`.
3. Preserve all official project fields and geometry paths.
4. Convert Web Mercator paths to WGS84.
5. Keep only records with `endDate >= extractedAt` date.
6. Preserve `trafficLabels`, descriptions, references, detours, and published road text.
7. Replace `data/mont-royal-snapshot.json`.
8. Validate the local map and at least one Mont-Royal popup.

## Beaconsfield

This section concerns the **City of Beaconsfield (Ville de Beaconsfield)** on the West Island of Montreal.

Official interactive map:

```text
https://www.beaconsfield.ca/fr/carte-interactive/info-travaux
```

Official POI and KML endpoints:

```text
GET https://www.beaconsfield.ca/api/v1/pois
```

KML layers:
- Aqueduc : `https://www.beaconsfield.ca/storage/app/uploads/public/6a0/625/297/6a0625297fba0547640170.kml`
- Égouts : `https://www.beaconsfield.ca/storage/app/uploads/public/6a0/621/91d/6a062191dd567087905905.kml`
- Travaux divers : `https://www.beaconsfield.ca/storage/app/uploads/public/6a0/619/334/6a06193346436036049918.kml`

Detail extraction method:
- The KML geometries provide official WGS84 line segments and point coordinates.
- The schedule and nature of the works are extracted from the interactive map's detail panels (`interactiveMap::onChangeLocation` AJAX requests):
  - Aqueduc: 1 juin au 2 octobre 2026 (Active)
  - Égouts: 6 juillet au 23 octobre 2026 / 2 juin au 31 octobre 2026 (Active)
  - Travaux divers: Reconfiguration Woodland/Beaurepaire (Automne 2026), Centre culturel (2026-2029), Centre récréatif (2026-2029) (Active/Future)
  - Pavage & Trottoirs: Ended July 24, 2026 (Excluded per active/future policy).

Snapshot path:

```text
data/beaconsfield-snapshot.json
```

## Montréal — géométries d'entraves résolues

This section concerns the **City of Montreal (Ville de Montréal)** and only the geometry of its roadwork restrictions, not the restriction attributes themselves (those stay live from the WFS).

**Exception à la règle de résolution géobase**: quand l'utilisateur fournit les coordonnées exactes des deux intersections d'une entrave (ex. la rue piétonne Mont-Royal entre Saint-Laurent et Resther), cette géométrie en ligne droite est la référence officielle et ne doit jamais être remplacée par une résolution géobase. La géobase peut placer le coin à une position différente de la réalité terrain; la position fournie par l'utilisateur est prioritaire.

Why this snapshot exists:

- The official WFS `montreal:entraves-ponctuelles` publishes almost no segment lines (4 of ~1 700 impacts carry `lineGeometry`).
- For every other impact, the only published geometry is the work-zone polygon (`locationOccupancyZoneGeometryCoordinates`), which is the worksite footprint — drawing it as the restriction produces a misleading block-sized rectangle.
- The permit's `roadSectionIds` do not join to the geobase `id`/`noTronconSq` fields, and the CKAN CSV/JSON resources of the `info-travaux` dataset carry no geometry at all.

Official sources used:

```text
GET https://api.montreal.ca/api/it-platforms/geomatic/wfs-maps/montreal/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=montreal:entraves-ponctuelles&outputFormat=application/json&CQL_FILTER=affectedArea like '%street%'
GET https://api.montreal.ca/api/it-platforms/geomatic/wfs-maps/montreal/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=montreal:geobase&outputFormat=application/json&srsname=EPSG:4326&CQL_FILTER=sur ILIKE '%<street>%'
```

Build method (no invented geometry):

1. For each published impact, read `spatialAnalysis.shortName` (street), `fromShortName`/`fromName`, `toShortName`/`toName`.
2. Fetch the official geobase segments of that street (field `sur`). The geobase is **accent-sensitive**: `sur ILIKE '%Peloquin%'` returns 12 segments while `sur ILIKE '%peloquin%'` returns 0 — query with the exact accented published name, then fall back to the name without the street-type prefix. Match names normalized (lowercase, no accents, no ordinal suffix, no street-type prefix), exact match first, then controlled inclusion (short numbered names like `5e` only match segments starting with `5e `, never the reverse, to avoid pulling `15e`/`25e`/`35e`).
3. Locate segments touching the two published intersections (fields `de`/`a`, with tolerant partial matching).
4. Chain adjacent geobase segments between them via shortest path (Dijkstra over the segment adjacency graph); orient coordinates by endpoint proximity (8 m tolerance).
5. Keep `lineGeometry` untouched when the WFS publishes it.
6. When resolution fails (missing intersection, disconnected graph), keep the published work-zone polygon with `geometryStatus: "occupancy-zone"`; the app draws it dashed and labels it in the popup.

Snapshot path:

```text
data/montreal-entraves-geometries-snapshot.json
```

Refresh procedure:

1. Run `node tools/build-montreal-resolved-geometries.mjs` (a local geobase cache in `tools/geobase-cache.json` makes re-runs fast; delete it to force a full re-fetch).
2. The script writes `extractedAt`, counts (`resolvedLineCount`, `publishedLineCount`, `occupancyZoneCount`, `pointOrNoneCount`) and one entry per impact keyed by `requestId` (`mtl-<permit-id>-<impact-index>`), which `js/app.js` joins at load time.
3. Update the matching `data/sources.js` catalog entry (`Ville de Montréal - Géométries d'entraves résolues (snapshot géobase)`) so its `extractedAt` matches the snapshot.
4. Validate: `node --check` on the tool and `js/app.js`, load the local site, and confirm a known segment (e.g. Berri between Jean-Talon and Faillon) renders as a street line, not a block polygon.

Known limitations:

- Coverage is about 94.5% resolved lines (1 626 of 1 721 impacts); the rest stays as honestly-labelled work-zone footprints. The remaining cases are: disconnected geobase graphs (intersections found but no chained path), intersection names absent from the geobase, and permits published with no street name ("Non-nommée"). Resolution improves only when the permit's intersection names can be matched to the geobase.
- The geobase is reprojected server-side via the WFS `srsname=EPSG:4326` parameter; never hand-convert coordinates.

## PJCCI - infrastructure authority, not a municipality

This section concerns Les Ponts Jacques Cartier et Champlain Incorporee (PJCCI), an infrastructure authority, not a municipality. Its segmentation and geometry rules below apply specifically to its work-advisory snapshot.

### Required sources

Always cross-check both official sources:

- Archive des avis: `https://jacquescartierchamplain.ca/fr/structures/archive-des-avis-de-travaux-et-chantiers/`
- Interactive sector map: `https://jacquescartierchamplain.ca/fr/circulation-routiere/secteur-bonaventure/`

Use the archive for the full text, sections, bullet points, directions, impacts, and dates. Use the interactive map's embedded `entrave` data for official IDs, coordinates, titles, and map dates. Preserve both source URLs and record the cross-source validation in the snapshot.

### Segmentation contract

Analyze every active or future advisory. Create one snapshot segment for every distinct obstruction described by a bullet point or direction. Separate directions whenever they have different impacts. Carry a section-level complementary warning into every segment in that section. Preserve section-specific dates and the exact published wording; do not replace approximate dates such as "jusqu'à l'automne" with invented exact dates.

### Geometry contract

Never guess coordinates. Never use a generic OSRM route to represent a PJCCI closure. Accept a line only when it is:

- published by PJCCI;
- a named OSM road/bridge way verified against the advisory and the official map point; or
- another independently verifiable official geometry.

The interactive map point is a control/reference, not automatically the displayed geometry. If no verified line can be established, keep the segment explicitly un-geometrized and report it in validation; never draw a guessed line or fallback point.

### Update command

Regenerate with:

```bash
npm run snapshot:pjcci
```

Output: `data/pjcci-work-advisories-snapshot.json`.

### Validation checklist

- Compare parent archive advisories with interactive-map entries.
- Report all active/future parents and all generated segments.
- Verify every segment has section, bullet, direction, dates, and source text.
- Verify every displayed geometry has provenance and does not cross an unrelated bridge or road.
- Report unmatched map entries and segments without verified geometry.
- Run `node --check tools/build-pjcci-work-advisories-snapshot.mjs` and `node --check js/app.js`.
- Parse the JSON and load the local site in Chromium before declaring success.
- Never commit or push unless explicitly requested.

## Signalements citoyens - formulaire du site (source non officielle)

Cette section régit uniquement `data/citizen-reports-snapshot.json`. Ne pas mélanger ces déclarations avec les snapshots municipaux officiels ni présenter un signalement comme un permis confirmé.

### Source, accès et extraction

- Formulaire public : `https://forms.gle/TKL6WkmPsWPmAUMV8`.
- Libellé public : **Signalement citoyen transmis via notre formulaire**. Conserver `sourceKind: "citizen-report"` et expliquer qu'il ne s'agit pas d'un avis officiel de la municipalité. Décrire l'origine réelle de chaque réponse, sans qualifier toutes les réponses futures d'observations sur place.
- Source de travail : onglet des réponses Google Sheets associé au formulaire, fourni par l'utilisateur. Ne pas inscrire son URL ou son identifiant dans les fichiers publics, cet agent compris. Si cet accès manque, le demander; ne pas deviner un tableur ou un onglet.
- Accès mémorisé sur ce poste : lire d'abord `%LOCALAPPDATA%/CarteEntraves/citizen-reports-source.json`, champ `responseSheetUrl`. Ce fichier reste hors du dépôt et du site statique. Le lien fourni par le propriétaire est stable : ne pas le redemander tant que cette configuration est disponible. Ne jamais recopier son contenu dans cet agent, les fichiers publics ou les logs. Ne demander le lien que si cette configuration est absente ou inexploitable.
- Méthode vérifiée : GET sur `https://docs.google.com/spreadsheets/d/<spreadsheet-id>/gviz/tq?gid=<sheet-id>&headers=1&tqx=out:json`, via le contexte de requêtes Chromium/Playwright si nécessaire. Une redirection d'un outil vers une connexion ne prouve pas à elle seule que le tableur est inaccessible. Ne jamais contourner une authentification requise.
- Extraire le JSON de l'enveloppe `google.visualization.Query.setResponse(...)` avec `JSON.parse`, jamais `eval`. Vérifier le statut HTTP, `status === "ok"`, `table.cols`, `table.rows`, les en-têtes, types et cellules. Un HTTP 200 ou une page HTML ne valide pas l'extraction.
- Lire toutes les lignes et toutes les colonnes, sans projection sélective ni troncature des commentaires. Associer les valeurs aux en-têtes réels; les lettres A à N ci-dessous décrivent le schéma actuel, pas des positions à supposer immuables. Toute colonne ajoutée doit aussi être analysée; signaler les colonnes manquantes ou renommées avant de normaliser les données concernées.
- Les cellules comportent une valeur `v` et parfois un affichage `f`. Conserver le texte affiché dans `reportedFields` (`f ?? v ?? null`) après contrôle de confidentialité. Décoder les dates selon le type déclaré et le format vérifié : `Date(2026,6,1)` signifie le 1er juillet 2026, les mois de cette représentation commençant à zéro. Ne pas utiliser une interprétation implicite américaine des dates françaises.
- Il n'existe actuellement aucun générateur dédié à ce snapshot. Ne pas annoncer une synchronisation automatique. Ne pas ajouter de dépendance, de secret ou de backend.

### TOUTES les colonnes doivent être analysées ensemble

**OBLIGATION : lire et analyser TOUTES les colonnes de CHAQUE réponse, y compris le texte libre intégral, AVANT de déterminer les données normalisées, la géométrie, les dates, les impacts, les horaires ou l'admissibilité. Aucune supposition, aucune devinette.** Une cellule vide doit être constatée comme telle; elle ne permet pas d'inventer une valeur. Lire uniquement les champs structurés ou uniquement le commentaire est interdit.

| Colonne actuelle | En-tête | Analyse et utilisation obligatoires |
| --- | --- | --- |
| A | Timestamp | Horodatage de soumission, distinct de l'observation et des travaux. Conserver l'heure locale; ne pas attribuer un fuseau absent ni convertir arbitrairement en UTC. |
| B | Dans quelle municipalité se trouve l’entrave? | Déterminer la municipalité avec C, D, M et les preuves géographiques; ne pas confondre municipalité et arrondissement. |
| C | Quelle rue, route, autoroute ou quel pont est touché? | Identifier la voie nommée; recouper les limites et le contexte avant toute recherche géographique. |
| D | Où exactement se situe l’entrave? | Lire les intersections, adresses, limites et précisions; les vérifier avec B, C, L et M. Ne pas étendre l'entrave à toute la rue. |
| E | Quel est l’effet sur la circulation? | Conserver tous les effets sélectionnés, puis déterminer chaque impact avec F, J et M; ne pas réduire une réponse multi-effets à une seule fermeture. |
| F | Quelle direction est touchée? | Conserver la direction déclarée, y compris « Non applicable ». Ne pas déduire un sens de circulation de l'ordre des coordonnées ou de l'orientation de la rue. |
| G | Quand avez-vous constaté l’entrave ou consulté l’avis? | Date d'observation ou de consultation (`observedAt`), jamais automatiquement date de début, de soumission ou d'extraction. |
| H | Quelle est la date de début annoncée? | Date de début saisie, à reprendre dans `startDate` et `reportedDates.enteredStartDate` si valide, avec les réserves de M. |
| I | Quelle est la date de fin annoncée? | Date de fin saisie, à reprendre dans `endDate` et `reportedDates.enteredEndDate` si valide, avec les réserves de M. |
| J | Quels jours et quelles heures sont concernés? | Lire les jours, plages horaires et exceptions; confronter à E et M pour attribuer un horaire à chaque impact séparément. |
| K | D’où provient l’information? | Conserver l'origine déclarée dans `informationOrigin`; distinguer observation, avis et autre origine réellement indiquée. |
| L | Avez-vous un lien vers une source ou l’emplacement? | Examiner le lien fourni et ce qu'il prouve réellement : emplacement ou avis. Vide signifie `supportingSourceUrl: null`, pas autorisation d'en fabriquer un. Vérifier la confidentialité avant export. |
| M | Quels détails supplémentaires pourraient nous aider? | Lire intégralement chaque phrase, retour de ligne, nuance, exception et restriction supplémentaire. Ce champ participe obligatoirement à la détermination du lieu, des dates, du statut, des impacts, des horaires et des incertitudes. |
| N | Votre adresse courriel, si nous devons préciser un détail | Identifier ce champ comme donnée personnelle de contact, jamais comme donnée de circulation. Ne jamais exporter sa valeur ni sa colonne; ne pas contacter la personne sans autorisation. |

- Conserver les 13 colonnes non personnelles actuelles dans `reportedFields`, y compris les cellules vides et le commentaire complet après contrôle de confidentialité. Analyser N pour son rôle de contact n'autorise pas sa publication. Toute nouvelle colonne exige la même classification de confidentialité avant export.
- Préserver le texte source, les accents, les retours de ligne et les réserves, sauf retrait nécessaire de données personnelles. Relire aussi les champs libres et les URL pour repérer courriels, téléphones ou autres coordonnées personnelles; ne pas publier de copie brute contenant ces données, ni les reproduire dans les logs ou le compte rendu.
- Pour chaque valeur normalisée, pouvoir indiquer les colonnes ou la preuve géographique qui la justifient. Ne jamais remplacer une donnée explicite par une supposition, ni ignorer une précision parce qu'elle se trouve en fin de commentaire.
- En cas de contradiction réelle non résolue par la lecture de toutes les colonnes, conserver les formulations et signaler précisément le champ concerné. Ne pas choisir silencieusement une version; ne suspendre que les données ou impacts réellement indéterminables. Une réserve de précision n'est pas automatiquement une contradiction.

### Dates, statut et horaires par impact

- **Une date déclarée n'a pas besoin d'être confirmée officiellement pour être utilisée comme date déclarée.** Reprendre les dates valides H et I dans `startDate` et `endDate`. Si M précise que la fin est estimée ou que les dates exactes n'ont pas été communiquées, conserver cette réserve dans `reportedDates`, les avertissements et l'affichage. Ne pas remplacer ces dates par `null` ni imposer `pending-date-clarification` pour cette seule raison.
- Ne pas inventer le premier ou le dernier jour d'un mois lorsque seule une période approximative est fournie et qu'aucune date valide n'est saisie. Une date absente ou invalide reste indéterminée; signaler la limitation. Vérifier aussi l'ordre début/fin.
- Appliquer la politique active/future avec la fin déclarée : exclure de l'affichage les réponses dont la fin est antérieure à la date de vérification. Sans fin exploitable, ne retenir que si la réponse décrit explicitement une entrave en cours; conserver la limite de fraîcheur. La seule date de soumission récente ne prouve pas ce statut.
- `reported-active` décrit l'état déclaré, pas une confirmation municipale. `review.mapEligible` exprime l'admissibilité après revue; il ne prouve ni le chargement sur la carte ni la publication. Garder `restrictionOfficiallyVerified: false` sans vérification indépendante de l'entrave elle-même.
- Créer un impact distinct pour chaque restriction ayant un effet, une direction, une période ou un horaire différent. Un parent et sa géométrie peuvent être partagés avec des `geometryRef` explicites et des identifiants stables.
- Ne pas appliquer automatiquement J à tous les effets de E : M peut préciser « stationnement interdit en tout temps » et « circulation permise hors de ces heures ». Préserver séparément ces règles et exceptions.
- Une fermeture complète explicitement déclarée est `critical`; une seule voie fermée est `major`; le stationnement interdit est `parking`. Jamais de classification par couleur. Ne pas transformer un stationnement de fait ou des places « plausibles » en autorisation.
- Encoder les jours et heures réellement déclarés dans chaque `schedule`. `allDay: true` exige un texte qui l'établit; une heure manquante ne signifie pas 24 h/24. Documenter le fuseau local de l'emplacement vérifié et sa justification, sans l'attribuer à l'horodatage Google Sheets par analogie.
- Les champs `periods` jour/nuit ne remplacent pas les jours de semaine et les heures exactes. Lors de l'intégration, les filtres doivent respecter chaque horaire et les popups doivent montrer les réserves et la circulation permise hors fermeture.

### Géométrie et preuve de localisation

- Résoudre le lieu uniquement à partir de B, C, D, L, M et d'une géométrie vérifiable. Vérifier la municipalité, l'arrondissement lorsque disponible, la voie et les deux limites; ne pas se contenter d'une correspondance de nom.
- À Montréal, utiliser la géobase officielle WFS `montreal:geobase` avec `srsname=EPSG:4326`; vérifier les champs `sur`, `de`, `a` et l'identifiant du segment. Conserver exactement les coordonnées publiées dans l'ordre longitude/latitude, les identifiants, l'URL et la date de vérification dans `geometrySource`.
- Pour plusieurs segments, n'utiliser que des segments vérifiés, adjacents et compris entre les limites déclarées, selon la méthode géobase documentée dans cet agent. Aucun routeur générique, raccord droit inventé, point de repli deviné ou prolongement au-delà des intersections. Si la géométrie n'est pas vérifiable, laisser la donnée sans tracé et signaler le problème.
- La géobase confirme une rue, PAS une fermeture, ses dates, ses horaires ou son responsable. Sa date de mise à jour n'est pas une date de travaux. Une entrave officielle sur un autre tronçon de la même rue n'est ni une confirmation ni un doublon : comparer les limites, impacts et périodes avant rapprochement; ne pas copier son permis ou son responsable.
- Conserver les géométries déjà vérifiées lorsque le lieu est inchangé. Laisser `responsible` et `reference` à `null` lorsqu'aucune source ne les fournit.

### Actualisation, intégration et validation

1. Lire cet agent, le snapshot, sa section README et le contrat du catalogue/chargeur avant modification. Vérifier toutes les lignes et toutes les colonnes de la source avant de décider ce qui change; comparer les réponses aux identifiants existants sans générer de doublons. Aucune suppression ou fusion silencieuse.
  - Avant tout calcul ou appel géographique, comparer chaque réponse complète aux `reportedFields` déjà conservés, après le même contrôle de confidentialité. Pour une réponse inchangée, conserver l'enregistrement entier exactement : identifiants, dates normalisées, impacts, horaires, revue, géométrie et provenance. Aucun nouveau géocodage, aucune reconstruction, aucun recalcul de ces éléments.
  - Pour une réponse nouvelle ou réellement modifiée, analyser toutes les colonnes ensemble, mais ne recalculer que les éléments affectés. Une modification de dates ou d'horaires ne justifie pas de résoudre à nouveau une géométrie dont le lieu reste inchangé. Toute disparition ou contradiction doit être signalée, sans suppression silencieuse.
2. Conserver le schéma existant : métadonnées de source et de confidentialité, `records`, `reportedFields`, `reportedDates`, `review`, `impacts`, `geometry` et `geometrySource`. Mettre à jour les comptes de réponses reçues, retenues, exclues et d'impacts selon les données réellement traitées.
3. `extractedAt` est la date ISO-8601 réelle de dernière vérification complète réussie des réponses. Une correction locale d'interprétation ne change pas cette date. Un accès partiel, échoué ou limité au cache ne l'avance pas non plus et ne doit pas écraser le snapshot précédent; les autres sources restent indépendantes.
4. Après une vérification complète sans changement, ne mettre à jour que la fraîcheur du snapshot et toutes les entrées correspondantes de `data/sources.js`; préserver les réponses et géométries exactement. Ne pas avancer `geometrySource.verifiedAt` sans revérification géographique.
5. `js/app.js` doit charger uniquement le JSON final, jamais le tableur ou le formulaire pour construire les entraves au chargement. Ne passer `inMap` à `true` dans le snapshot et le catalogue qu'après branchement réel et validation Chromium. Une demande de documentation seule n'autorise pas à activer le chargeur.
6. Valider le JSON, les identifiants et références, les comptes, la présence et la fidélité de toutes les colonnes exportables, la cohérence des dates et les horaires distincts. Vérifier l'absence de données personnelles et du lien/identifiant du tableur dans les fichiers publics. Synchroniser le catalogue uniquement si la fraîcheur change.
7. Pour toute intégration ou modification fonctionnelle : `node --check` sur chaque JavaScript modifié, puis Chromium sur le site local. Vérifier les couches et au moins un popup citoyen, les dates limites, jours ouvrables/week-end, heures à l'intérieur/extérieur de la fermeture et le stationnement permanent sur la période déclarée. Vérifier l'absence d'erreurs de page et de requêtes au tableur. Une modification de cet agent seul exige une validation documentaire, pas un rafraîchissement des sources.
8. Rapporter l'heure de vérification, le formulaire public, les nombres de réponses et d'impacts, les exclusions motivées, les géométries vérifiées ou manquantes, les réserves, les contrôles effectués et l'état réel d'intégration. Ne pas prétendre que l'extraction confirme les conditions sur le terrain. Ne pas commettre ni pousser sans demande explicite.

### Cas de référence : Foucher entre Chabanel et Louvain

Ce cas contrôle l'interprétation de la réponse vérifiée le 16 septembre 2026; ce n'est pas une valeur par défaut à appliquer aux prochaines réponses.

- H = `01/07/2026`, I = `31/10/2026` : `startDate: "2026-07-01"`, `endDate: "2026-10-31"`. M indique une fin octobre estimée; conserver cette réserve sans effacer les dates ni bloquer le signalement pour absence de confirmation officielle.
- E + J + M : deux impacts, fermeture complète du lundi au vendredi de `07:00` à `19:00`, circulation possible hors de ces jours/heures; stationnement interdit tous les jours en tout temps pendant la période déclarée.
- F reste `Non applicable`. G = `12/09/2026` est la date d'observation, pas le début des travaux. K = `Observation sur place`; L vide ne fournit aucune source justificative. N ne doit jamais figurer dans le snapshot.
- B + C + D + M et la géobase vérifiée établissent Montréal, Ahuntsic - Cartierville, rue Foucher entre Chabanel Est et de Louvain Est : segment officiel `1040221`, `noTronconSq: 1100421`, longueur publiée `260.212` m, `LineString` exact `[[-73.647503,45.550485],[-73.650514,45.55136],[-73.650583,45.551379]]`.
- `review.mapEligible: true`, `geometryVerified: true`, `restrictionOfficiallyVerified: false` sont compatibles. `inMap` reste faux tant que l'intégration n'est pas réellement faite. Ne pas attribuer les permis d'autres tronçons de Foucher à cette réponse.

## Other source sections

When a new municipality or infrastructure authority snapshot is added, create a section here with:

- official municipality or infrastructure authority name, explicitly disambiguated from similarly named entities;
- official map/page URL;
- exact API or browser extraction method;
- request method and payload when applicable;
- response schema and coordinate system;
- active/future filtering rule;
- snapshot path;
- known CORS, rate-limit, freshness, or licensing constraints;
- focused browser validation procedure.

Use one section per municipality or infrastructure authority. Do not combine several source APIs into an undocumented generic snapshot.
