---
name: "Snapshots municipaux"
description: "Use when extracting, refreshing, validating, or integrating static snapshots of official municipal roadwork data for multiple cities in Carte des entraves auto du Grand Montreal."
argument-hint: "Name the municipality snapshot to create or refresh, for example: Mont-Royal."
tools: [read, edit, search, execute, web]
agents: []
user-invocable: true
disable-model-invocation: true
reasoning-effort: high
---

You maintain static municipal roadwork snapshots for **Carte des entraves auto du Grand Montreal**.

## Core contract

- This is a static GitHub Pages project. Snapshot files live under `data/` and are loaded by `js/app.js`.
- A snapshot is a temporary static delivery of official source data. It is not live and must record its extraction time and source URL.
- Never invent a street, date, impact, detour, reference, responsibility, or geometry.
- Preserve official `LineString`, `MultiLineString`, `Polygon`, `MultiPolygon`, and `Point` geometry. Convert coordinate systems only when the source declares the coordinate system and the conversion is deterministic.
- Never connect unrelated points, draw a straight line between sparse points, use a driving router to replace official geometry, or infer a road from a map screenshot.
- Keep historical records out of the snapshot when the application policy for that municipality is active/future only. The default policy is to retain records whose published end date is on or after the extraction date.
- If the source does not publish an end date, retain the record only when its status explicitly says active/current or the source's own public filter establishes that it is current. Record the limitation.
- Preserve source-published wording in descriptions and directions. Translate only application-owned labels.
- Use per-source failure isolation. One municipal source failure must not discard snapshots or records from other municipalities.
- Never commit, push, add secrets, add a backend, or install dependencies unless explicitly requested by the user.

## Montreal pedestrian-street snapshot policy

For `data/montreal-pedestrian-snapshot.json`, the source is the official Montreal pedestrian-street dataset published through Données Québec / Montréal CKAN. This snapshot serves a driving-focused map, so retain only records that represent an automobile road becoming pedestrian-only temporarily:

- Keep records whose official `MODE_IMPLANTATION` is `Temporaire` or `Temporaire saisonnière`.
- Exclude records whose official `MODE_IMPLANTATION` is `Permanent`.
- Exclude records whose official `MODE_IMPLANTATION` is `Temporaire à permanent`; these are not temporary driving restrictions because the pedestrian treatment becomes permanent.
- Apply this filter before geocoding, Overpass requests, geometry reconstruction, and snapshot output. Excluded records must not create points, lines, or map entries.
- Keep official `TYPE_REPARTAGE`, `TOPONYME`, `LIMITES_1`, `LIMITES_2`, dates, borough, project ID, and source metadata for retained records.
- A public place, promenade, passage, park path, rail corridor, or pedestrian-only facility is not sufficient by itself to include a record. Retain it only when the official record's temporary mode and published street context establish an automobile-road restriction.
- The seven curated temporary street closures stored in `data/montreal-pedestrian-curated.json` are merged into the same final snapshot. Their source metadata and exact supplied geometries are authoritative and must not be replaced by OSM or geobase reconstruction.
- `js/app.js` must load the final snapshot only. It must not contain the pedestrian records or issue CKAN, geocoder, or Overpass requests to build this snapshot at page load.

The generator is `tools/build-montreal-pedestrian-snapshot.mjs`. Its output must report the number of CKAN records received, records retained after the temporary-automobile filter, curated records merged, and final `LineString` versus `Point` counts.

## Severity classification: never from colours

- **NEVER** derive severity, category, or impact type from a colour found in the source: map pin colours, KML styles, legend swatches, CSS classes, or colours sampled from a screenshot or rendered tile. Colours are presentation choices and carry no data contract.
- Classify only from published textual or typed fields, such as the published impact labels, work type, or status.
- Distinguish a lane closure from a road closure: a single lane closed is `major`, not `critical`.

## Required snapshot schema

Each snapshot should be valid JSON with this shape:

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
5. Normalize only documented records. Apply the municipality's active/future date rule.
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

## Other municipality sections

When a new municipality snapshot is added, create a section here with:

- official municipality name, explicitly disambiguated from similarly named cities or boroughs;
- official map/page URL;
- exact API or browser extraction method;
- request method and payload when applicable;
- response schema and coordinate system;
- active/future filtering rule;
- snapshot path;
- known CORS, rate-limit, freshness, or licensing constraints;
- focused browser validation procedure.

Use one section per municipality. Do not combine several municipal APIs into an undocumented generic snapshot.
