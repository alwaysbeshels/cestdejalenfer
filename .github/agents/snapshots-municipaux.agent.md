---
name: "Snapshots officiels"
description: "Use when extracting, refreshing, auditing, validating, or integrating municipal snapshots and their linked notices/media, Mercier HTML notices, Mobilite Montreal major closures, PJCCI, citizen reports, or the consolidated pedestrian snapshot in Carte des entraves du Grand Montreal. Requires complete evidence, durable review checkpoints, exact impacts, privacy and verified geometry. Excludes potholes and road patching."
argument-hint: "Name a snapshot or source: Boucherville, Brossard, Mercier, Sainte-Catherine, Sainte-Julie, Saint-Basile-le-Grand, Mobilite Montreal, Mont-Royal, PJCCI, citizen reports, or consolidated pedestrian restrictions."
tools: [read, edit, search, execute, web]
agents: []
user-invocable: true
disable-model-invocation: true
reasoning-effort: high
---

You maintain static official roadwork snapshots for municipalities, Mobilite Montreal and infrastructure authorities including PJCCI, for **Carte des entraves auto du Grand Montreal**. Keep each source's generator, snapshot, and specific rules separate within this shared workflow.

The separate citizen-report snapshot is also maintained here under its dedicated section below. Its source is a citizen declaration, never an official roadwork notice; the official-source requirement does not prevent retaining declared dates or impacts with their stated limitations.

## Core contract

- Pothole and road-patching datasets (nids-de-poule et colmatage) are always out of scope, including every source and derived file under `data/nids-de-poule/`: annual 311 reports and repairs, positions, maps, statistics, analyses, borough profiles and verification metadata. Their refresh belongs exclusively to the [actualiser-nids-de-poule prompt](../prompts/actualiser-nids-de-poule.prompt.md). This exclusion applies even to requests for "all snapshots" or explicitly naming these datasets; redirect those requests to the dedicated prompt without processing them here.
- Do not fetch or probe those sources, run `tools/build-nids-de-poule-snapshot.mjs` with any options, or run `npm run snapshot:potholes:map`. Leave their files and corresponding catalog metadata unchanged in this workflow.
- This is a static GitHub Pages project. Snapshot files live under `data/` and are loaded by `js/app.js`, or by `js/pedestrian.js` for the separate pedestrian map.
- A snapshot is a temporary static delivery of official source data. It is not live and must record its extraction time and source URL.
- Never invent a street, date, impact, detour, reference, responsibility, or geometry.
- Preserve official `LineString`, `MultiLineString`, `Polygon`, `MultiPolygon`, and `Point` geometry. Convert coordinate systems only when the source declares the coordinate system and the conversion is deterministic.
- Never connect unrelated points, draw a straight line between sparse points, use a driving router to replace official geometry, or infer a road from a map screenshot.
- Keep historical records out of the snapshot when the application policy for that source is active/future only. The default policy is to retain records whose published end date is on or after the extraction date.
- If the source does not publish an end date, retain the record only when its status explicitly says active/current or the source's own public filter establishes that it is current. Record the limitation.
- Preserve source-published wording in descriptions and directions. Translate only application-owned labels.
- Use per-source failure isolation. One source failure must not discard snapshots or records from other municipalities or infrastructure authorities.
- Never commit, push, add secrets, add a backend, or install dependencies unless explicitly requested by the user.

## Local workaround for Copilot image-download failures

- On this workstation, seven error episodes on 2026-09-25 followed `view_image` calls immediately. Copilot returned `400 invalid_request_body` with `Error while downloading file. Upstream status code: 404.` The failed remote URL is absent from the inspected logs. This implicates image delivery to the chat, not a municipal API; it does not prove which file or server component failed.
- During snapshot refreshes and audits, do not invoke `view_image` or attach generated screenshots to the chat. Keep captures outside the repository for local inspection. This is a transport workaround, not a repair of Copilot itself.
- Attempt PJCCI image and diagram inspection with an available permitted method without attaching images to chat. If visual access is unavailable, apply the documented text-sufficiency exception below; request a targeted human reading only for information the text cannot establish. Retrieval, image dimensions, alt text, filenames, OCR alone, or page-load success do not prove that a diagram was visually inspected.
- Apply the same transport precautions to Mobilite Montreal, but its mandatory image-review contract below is distinct from PJCCI's sufficient-text exception. Never silently waive the requested full diagram analysis.
- Keep Chromium validation: source responses, page errors, record counts, vector layers, actual popup clicks, dates, filters, desktop/mobile bounds and text overflow. Return textual assertions and summaries. If visual inspection requires a person to open a saved capture, report that limitation rather than declaring it passed.
- If the same Copilot error recurs, distinguish it from a source HTTP failure. Preserve completed work and source timestamps; do not rerun successful extractions or change source URLs merely to retry a failed chat request. Existing image references in the conversation may still require a new text-only session.

## Snapshot freshness on every requested refresh

- For source snapshots in the requested scope, `extractedAt` records the latest successful source verification, even when there are no new records or the eligible data is unchanged. Use the actual ISO-8601 verification time, not a guessed date. The consolidated pedestrian snapshot is the explicit exception: its per-source freshness contract below replaces a single `extractedAt`.
- Retrieve and validate the required source responses before advancing the timestamp. An HTTP success alone, a local-cache-only run (including `--reuse-existing`), or a partial/failed source check does not establish a successful verification. Preserve the previous timestamp and report the limitation in those cases; continue with other sources independently.
- When the eligible data is unchanged, update only the snapshot-level timestamp and corresponding freshness metadata in `data/sources.js` (all entries pointing to that snapshot). Preserve the records, geometries, source-published dates and source modification timestamps exactly. Do not reconstruct geometry merely to refresh a date.
- Verify that the snapshot and catalog timestamps agree and that records are unchanged for a metadata-only refresh. Report each snapshot as changed, checked with no changes, or failed/not checked, with its last successful verification time. This time does not mean the source published new data or that every stored geometry was rebuilt.

## Municipal supplemental-notice review and restart points

- A municipality's map/API is not necessarily its only official source. When its catalog entry, map, or supplied URL points to editorial notices, project pages, PDFs, images, or attachments, inspect the complete current index, every linked relevant detail page, and every relevant asset before deciding eligibility, dates, impact, or geometry.
- Keep those sources separate from the map/API records. Persist a source-specific ordered inventory, exact URLs, complete-text fingerprints, source modification/publication metadata when actually published, media URLs and SHA-256 hashes, actual inspection status/observations, decisions, and a durable restart point in the snapshot's `validation` or established source-review field.
- On later refreshes, revalidate the full index/inventory and compare text and media fingerprints. Reuse prior human analysis only when the source content and media hashes match; do not reread/reinterpret unchanged notices merely because a new extraction was requested. A new, removed, reordered, conflicting, inaccessible, or changed notice/asset requires a complete review of the affected source before advancing its snapshot timestamp. Until then, preserve the last valid snapshot and freshness.
- A source-document link in the FAQ is not proof that it is loaded on either map. Add verified related official URLs to `data/sources.js` with `inFaq: true`; keep `inMap: false` unless the application actually loads and browser-validates the source.
- Never turn a map point, contextual image, historical design, citywide notice, approximate period, or project render into a guessed restriction geometry or date. Keep valid worksite-only Points distinct from traffic impacts and walking closures.

## Consolidated pedestrian restrictions snapshot

### Files and scope

- `data/pedestrian-closures-snapshot.json` is the common restrictions snapshot for walking, generated by `tools/build-pedestrian-snapshot.mjs`. It is loaded by `js/pedestrian.js` on `pedestrian.html`, `/fr/pedestrian.html` and `/en/pedestrian.html`, using the shared Leaflet engine in `js/app.js`.
- `data/montreal-pedestrian-notices-snapshot.json`, generated by `tools/build-montreal-pedestrian-notices.mjs`, supplies verified Montreal notice labels and available detailed attributes to the consolidation. It is not a second obstruction feed fetched by the pedestrian page.
- Do not confuse either file with `data/montreal-pedestrian-snapshot.json`: that older snapshot describes temporary pedestrianized streets for the AUTOMOBILE map. Its append-only policy does not apply to the walking restrictions snapshot.
- Audit every existing source family considered by the consolidation, not just the displayed municipalities or a user-provided example. An inspected source may yield no eligible pedestrian impact. Documentary catalog entries are not automatically integrated sources.

### Freshness and schema

- Preserve `schemaVersion: 1`, `generatedAt`, `sources`, `records` and `review`. `generatedAt` is the time of assembly, NOT a universal successful verification date. Do not invent a consolidated `extractedAt` or copy `generatedAt` into catalog verification metadata.
- In `sources`, preserve `key`, `url`, `status`, `checkedAt`, `sourceExtractedAt` and the available received/retained/review counts or error. `checked` means the required live response was retrieved and validated; `local-snapshot` means an existing local input was reused; `failed` means the check failed. Zero eligible records is not a network failure.
- Advance `checkedAt` only after a complete successful live check. Reused local inputs keep their own `extractedAt` as `sourceExtractedAt`; do not advance it by reading the file. Preserve each record's `sourceKey` and `sourceCheckedAt` provenance. Local curated inputs without a verification date remain explicitly undated.
- On a source failure, retain that source's previous eligible records and last successful timestamps, report the failure, and allow successfully verified sources to update. Never describe the whole consolidation as fully verified after a partial run. Keep the previous output if the generator cannot establish its minimum validated input or detects conflicting identities.
- Preserve IDs, official URLs, dates, schedules, `pedestrianArea`, severity, exact source wording, `evidence`, `side`, geometry and detail metadata. `openEnded` is allowed only with published active/current status; never invent an end date. Keep ambiguous candidates in `review`, not as confirmed closures.

### Impact and geometry rules

- A closed street does not necessarily close its sidewalks. Examine complete published descriptions, additional-information fields and linked detailed notices, including collapsed sections, before deciding. A title or automotive severity alone is insufficient. Keep the exact supporting passage, URL, dates and verification provenance when a detail page establishes the pedestrian impact.
- The current generator does NOT systematically retrieve linked editorial/detail pages. Report that gap; do not claim exhaustive notice coverage from a successful feed request. Also check specialized Montreal/Longueuil paths that return before the generic text parser. Do not invent a geometry or a precise end date to bypass an unresolved detail-page integration.
- Known investigation examples from 2026-09-25, to reverify before integration: Longueuil's Roland-Therrien notice announces a daytime Saint-Charles Est sidewalk closure from September 28 for approximately five weeks; the Louise-Gravel notice announces permanent closure of the Front pedestrian/cycling link. Neither omission was integrated merely by documenting it. Lyon and Chambly notices explicitly maintained pedestrian circulation despite automotive restrictions.
- Montreal's verified public labels for sidewalk `blocked`/`obstructed` announce pedestrian arrangements; park `blocked`/`closed` announces park works. Raw codes alone do not prove a pedestrian closure. Do not interpret `backSidewalk` as the opposite side without published semantics.
- Longueuil's combined `Trottoirs_Liens_Cyclable_Inacces` alone is ambiguous; an explicit path closure or a verified sidewalk description is required. Respect active/planned statuses, dates and official surface geometry.
- Separate closed and arranged sides only when actually identified by the source. Omit an explicitly unaffected side; retain unknown side as unknown. Never offset a line, invent the opposite side, or substitute a driving route. A worksite polygon/line/point is a location, not proof of a precise sidewalk outline or accessible route.
- Walking `critical` means confirmed closure; `moderate` means arrangements/works. The walking palette uses red `#ff1744` and orange `#ff8c00` respectively; automobile `moderate` remains yellow. Classification must never come from source colours.
- Keep the shared `groupPopupClosures` rule for both maps: identical details within the same source/reference may share a popup card, with all streets and limits retained. Different references, impacts, sides, dates or schedules remain distinct. Do not delete source records or geometries to fix repeated popup content.

### Refresh and validation

1. Read the walking loader and generators as well as the scoped inputs. Preserve a comparison baseline before generation. A refresh of only the common snapshot may reuse local inputs, but must report them as not reverified. When all snapshots are requested, refresh the authorized input snapshots first, then consolidate last.
2. Refresh detailed Montreal notices when in scope with `node tools/build-montreal-pedestrian-notices.mjs`. Require complete search pagination, verified labels, permit coverage and non-conflicting duplicates. Update that input's matching catalog `extractedAt` only after success.
3. With the existing local tooling and temporary static server (`python -m http.server 5500` or `npm run serve`), run `node tools/build-pedestrian-snapshot.mjs`. It uses Chromium and `http://localhost:5500/fr/pedestrian.html`; `PEDESTRIAN_VALIDATION_URL` can override the base URL. No server or tooling becomes a production dependency.
4. Validate per-source totals, freshness, stable IDs, expired records, explicit open-ended status, evidence, side identity and finite official geometry. Compare unchanged records separately from verification metadata. Check matching catalog entries without falsely imposing the municipal freshness schema on this composite file.
5. Run `node --check` on each changed JavaScript file. Validate the actual walking page: only the common snapshot supplies its obstructions, no automobile fallback, and failures remain visibly disclosed. Test representative included sources, dates, sides, areas, orange/red styling, FR/EN and desktop/mobile. Zones touched is collapsed by default without unchecking the three areas.
6. Use `node tools/validate-popup-grouping.mjs` for the full loaded-data grouping audit on BOTH maps. `node tools/validate-pedestrian-snapshot.mjs` also exists, but inspect its assumptions against current UI: it predates the collapsed area filter, retains an old desktop-to-mobile ARIA expectation, and requires named source examples. A failing or blocked check is not a pass; do not change the UI merely to satisfy an outdated test.
7. Report changed, checked-unchanged, local-input-not-reverified and failed sources separately, plus review candidates and detail-page gaps. Read counts/errors from the new output; never hardcode 1,120 records or six failures. Five failed Mont-Saint-Hilaire layers and one Repentigny feed were a past run's result, not six municipalities or a guaranteed current state.

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
- Read every work POI detail at `/api/v1/pois/{id}` and its current `kml` URL from the POI API. Work types are published in `TypeTravaux` rows inside each Placemark's HTML description; parse those tables, never KML colours. Preserve Polygon geometry as polygons, not ring-shaped LineStrings.
- Verified on 2026-10-03: sanitary-sewer rehabilitation runs July 6 to October 23; sanitary inspection runs June 22 to October 23. The storm-sewer inspection description literally says `32 octobre 2026`, which is invalid and must not be corrected to October 31.
- Drainage and water-main work ended October 2; paving and sidewalk work ended July 24. Seasonal or year-only projects do not establish exact dates or an active restriction. Review the live descriptions on each refresh instead of reusing these dates as constants.
- The current legacy generator's `MANUAL_WINDOWS` and KML coordinate-only parser do not preserve the reviewed per-type records and exclusions. Do not run it blindly. When every detail, identifier, retained geometry and exclusion still agrees, preserve the snapshot exactly except for `extractedAt`. A changed detail requires renewed source-specific review before writing.

Snapshot path:

```text
data/beaconsfield-snapshot.json
```

## Mont-Saint-Hilaire - discover the published project layers

- Public Experience: `https://experience.arcgis.com/experience/f6ea6c5a42f5440c970ec7a8bb5b17d4`.
- Stable configuration endpoint: `https://www.arcgis.com/sharing/rest/content/items/f6ea6c5a42f5440c970ec7a8bb5b17d4/data?f=json`.
- Follow the single `dataSources` entry of type `WEB_MAP`, its published `itemId` and `portalUrl`, then that item's `/data?f=json` and `operationalLayers`. Never guess the date embedded in a FeatureServer name.
- On 2026-10-17 the Experience configuration's `dataSources` is an object; follow its `WEB_MAP` entry. The current Web Map is `40ef809ec0954386b4557da167ed6faf` and publishes `https://services5.arcgis.com/RupmNFqbsv0VX4xY/arcgis/rest/services/INFO_TRAVAUX_2026_Pour_diffusion_13Octobre2026_new_WFL1/FeatureServer`.
- The Web Map does not apply an active/current-only definition filter. Its project layers publish seasonal `ECHEANCIER` text, not exact restriction periods or automotive closure types. Preserve those fields as review evidence; do not convert seasons into invented dates or lane impacts.
- Layer 18 publishes one official WGS84 `LineString` for Chemin des Patriotes, `Alternance: Oui`, and `InfoTravaux: null`, with no dates or explicit current-status field. The alternating-traffic attribute describes a configuration, not proof that the work is active on the extraction date. Do not display it as an active closure.
- Keep Mont-Saint-Hilaire documentary (`inMap: false`) until a source response establishes a current dated automobile impact and admissible geometry. The 13 October FeatureServer URL is current metadata, not proof that a project remains active.

## Repentigny - retain the official URL unless a replacement is proved

- Public map: `https://info-travaux.ville.repentigny.qc.ca/`.
- Existing Open511 feed: `https://info-travaux.ville.repentigny.qc.ca/api/events/`.
- Confirmed references on 2026-10-03: `https://repentigny.ca/services/citoyens/entretien-circulation/travaux-dinfrastructures`, `https://repentigny.ca/la-ville/a-propos/grands-projets` and Donnees Quebec package `a201ab69-0777-4a93-abed-ed89eaab7fa2` still point to the same map. The ArcGIS search result `d8f725a006114dde8aa509ad4c7d5659` points to an old event on the same host, not a replacement API.
- Node and Chromium fail during HTTPS connection setup (`ECONNRESET` / `ERR_CONNECTION_RESET`). TLS 1.2 resets; TLS 1.3 reports a handshake failure. HTTP redirects with 301 to the same HTTPS service on port 443. Do not claim a CORS/JSON problem, a proven global outage, or a usable HTTP fallback from these observations.
- No replacement was confirmed. Keep the configured feed, preserve its last successful freshness and eligible records on failure, and include the transport error code in the source result. Do not substitute the municipality's editorial projects page, which is not an Open511 geometry feed.
- Re-enable its active catalog label only after a complete successful events response and actual map records are verified. Inspect all pages and preserve published intervals, directions, roads and geometries if the service returns.

## Noovo - incomplete supplementary evidence is not a successful refresh

`data/noovo-road-closures-snapshot.json` is an unofficial article-plus-image supplement, not a municipal notice or the UCI snapshot. The article alone does not revalidate the image or its precise hours. On 2026-10-03 it stated Parc closed from September 4 to October 4, while the stored record starts September 7; it did not establish the stored A-10 `06:30-16:30` hours or Champlain `11:30` end time. No identifiable URL for the originally supplied image is stored. Preserve the file and its old date unless all necessary evidence is re-established; report exact discrepancies and any image inspection not performed.

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

## Mobilite Montreal - major closures

### Scope and existing implementation

- Official bulletin: <https://mobilitemontreal.gouv.qc.ca/fermetures-majeures/>. Read the entire current page, including every main section, direction, default access closure, note and "A prevoir" advisory, plus relevant linked releases and attachments. The page announces a Thursday-afternoon update; a fresh fetch, not that schedule alone, proves which bulletin is published.
- Maintain [the existing snapshot](../../data/mobilite-montreal-snapshot.json) with [its generator](../../tools/build-mobilite-montreal-snapshot.mjs) and [its validator](../../tools/validate-mobilite-montreal.mjs). Runtime integration is `loadMobiliteClosures` / `normalizeMobiliteClosures` in `js/app.js`. Do not reintroduce the old manually dated Mobilite Montreal entries in `REGIONAL_MAJOR_CLOSURES` or an automatic heading-to-coordinate scraper.
- This is a reviewed bulletin, not an unattended HTML-to-closures conversion. Preserve the existing schema: `bulletin`, `images`, `supplements`, `notices`, `records`, `excluded`, `crossSourceReview`, `duplicateBindings` and `coverage`. Do not force the municipal schema onto it.
- Read the current files and retain a comparison baseline before editing. Preserve user changes. Evidence and draft analyses belong outside the repository until the review is complete. This refresh does not authorize UI changes, a scheduled job, a commit, a push or a deployment.

### Complete text and image review

1. Run `npm run snapshot:mobilite-montreal:capture`. It retrieves the bulletin, relevant linked releases and original images into the system temporary directory `mobilite-montreal-evidence`; it does not update the public snapshot or its freshness. Verify the returned inventory, every section and every relevant attachment. If the page structure changes or a relevant document is not captured, inspect it explicitly and adapt the scoped collector before claiming complete coverage.
2. Analyze every notice before eligibility, segmentation, classification or geometry decisions. Read all paragraphs, lists, directions, dates, hours, exceptions, detours and restrictions on vehicle dimensions. Keep publication dates separate from work periods. Record an explicit reason for exclusions such as public-transit information or pedestrian-only restrictions.
3. Examine each relevant original image in detail using a permitted inspection method under the local transport workaround. Read written labels, legends, arrows, closure symbols, carriageways, available lanes, access exceptions, limits and times together with the text. A regional overview is not a complete inventory; "no individual image published" is different from "image not inspected". A filename, HTTP 200, alt text, dimensions, OCR alone or colours are not proof of visual analysis.
4. Retain image/release URLs, content hashes, actual observations, supporting passages and unresolved contradictions in `images`, `supplements` and `notices`. Reuse a previous image analysis only if its original bytes have the same SHA-256 and the prior completed inspection is documented; recheck its relationship to changed text. A new/changed image with no permitted visual access requires targeted human inspection. Preserve the previous snapshot and freshness if the requested complete review cannot be finished; PJCCI's sufficient-text exception is not automatic permission to waive Mobilite Montreal image review.
5. Never update `contentSha256`, an image hash, a supplement hash or a duplicate signature merely to satisfy a failing assertion. A changed hash is a signal to review the new evidence, not an obstacle to bypass. Do not infer next week's restrictions by shifting last week's dates. Section numbers can change when the page is reordered: rematch headings and evidence, not old positional IDs alone.

### Impacts, schedules and geometry

- Separate records whenever affected road/carriageway, bounds, direction, impact, access or time window differs. An access closing 30 minutes before a tunnel has its own interval; a detour is not itself a closed road.
- Classify explicitly from published meaning: `road_closed`, `direction_closed` and `ramp_closed` map to `critical`; `lane_reduction`, `contraflow` and `lane_configuration` map to `major`; `channelized_access` maps to `moderate`. Never infer an impact from a source colour. One lane closed out of two is not a full closure; a closed ramp is not a closed autoroute; one carriageway closed with contraflow does not mean that motorists cannot cross the bridge.
- Preserve the number of open/closed lanes when published, directions, actual traffic configuration and accesses explicitly left open. Normal OSM one-way tags or coordinate order do not prove the temporary direction of traffic. Distinct directional impacts may share one carriageway, while another is physically closed.
- Use `America/Toronto`. Preserve exact published hours, overnight intervals, per-weekday recurring windows and daylight-saving changes. Missing dates remain missing; a bulletin observation window is not an invented start or end of works. Document text/image/source disagreements and inconsistent weekday/date wording instead of silently correcting them. Never extend an expired advisory just to keep it on the map.
- Prefer the geometry of the matching official MTMD restriction. Otherwise require an independently verified named-road geometry, with source IDs, versions/timestamps when available, exact boundary nodes and continuity. Preserve separate carriageways as separate line parts. No generic point, invented straight line, screenshot digitizing, artificial offset, detour geometry or OSRM driving route.
- Keep genuinely unresolved impacts in the analysis with `geometry: null`, `display: false` and the exact reason. Recheck them on later refreshes; do not copy an unrelated native record merely to reach full mapping coverage. Report them and preserve their parent-advisory details rather than silently discarding them.

### Quebec 511 and PJCCI duplicate control

- Compare each impact with the current official MTMD feed and the existing PJCCI snapshot before adding or renewing `matchingMtmdId`, `matchingPjcci` or `duplicateBindings`. These read-only controls are authorized for Mobilite Montreal alone; they do not refresh the PJCCI snapshot or create a Quebec 511 snapshot. If both sources are in the requested scope, complete the separate PJCCI review first. Report the age of reused PJCCI data honestly.
- Require demonstrated agreement of event identity, location and limits, direction, impact/configuration and period. A common bridge name, nearby line, matching title or overlap in dates alone is insufficient. Preserve the compared attributes and full geometry in the existing signatures, with source URLs and explicit relationship reasons. Keep documented differences when the same event has conflicting published details; do not treat a different event as a duplicate.
- Prefer a verified existing source when it supplies distinct detailed components or the actual longer duration (`preferExisting` / `preferExistingMtmd`). Example requiring revalidation, not a permanent whitelist: Mercier's closed carriageway and two contraflow directions remain the detailed PJCCI components, while Mobilite Montreal's aggregate and Quebec 511's copy are hidden. Tellier's longer native closure must not be shortened to the bulletin weekend. Preserve independent indefinite restrictions and works in the opposite direction.
- `isCoveredByMobiliteClosure` must keep native data available, suppress only verified unchanged correspondences, and stop masking a source whose signature changes or whose required reference is missing. Outside the reviewed period, retain longer native advisories. Preserve cross-source links, category aliases, day/night filtering and the same suppression in map counts, standard statistics and custom charts.
- Re-review a changed counterpart before renewing its binding. Retain distinct events, do not erase their dates or geometries, and never remove fingerprint checks or clear all bindings as a way to make the generator pass. Apply only justified binding changes supported by the new comparison.

### Refresh and validation

- If the full source check succeeds with unchanged eligible data, image evidence and comparisons, update only `extractedAt` and all corresponding freshness entries in `data/sources.js`. Preserve the reviewed records, source text/dates, geometry and geometry verification timestamps exactly. The current full generator re-fetches geometry and updates provenance: do not run that rebuild blindly for a metadata-only refresh.
- For a changed bulletin, complete and document the new review before updating its input analysis and references, then run `npm run snapshot:mobilite-montreal`. Inspect `verifyReview`, `verifyReviewedBindings`, `compileSnapshot` and the current generator contract first. Its refusal after a changed page, image, source counterpart or road reference requires new evidence; never disable the guard. Preserve the previous valid snapshot/catalog on failure, undoing only your own incomplete refresh edits against the saved baseline, not user changes.
- After a successful full generation, verify `status: "reviewed"`, the actual `extractedAt`, `coverage`, and all catalog entries for the bulletin URL and local snapshot. Distinguish a fresh bulletin verification from reuse of older PJCCI data. Do not claim a full PJCCI archive refresh from reading its local snapshot.
- Run `node tools/build-mobilite-montreal-snapshot.mjs --check`, `npm run test:mobilite-montreal:unit`, and `npm run test:mobilite-montreal`. The browser test needs the existing static server at `http://127.0.0.1:5500` or `MOBILITE_VALIDATION_URL`; choose a free port without stopping user processes. Do not install dependencies implicitly.
- The validator includes dated examples and counts from the reviewed bulletin. For a new bulletin, update these fixtures and the simulated date only from the completed analysis; retain assertions for complete coverage, image-change refusal, partial versus complete closures, bounds/directions, recurring schedules, DST, duplicate fingerprints and source failure. The original 13 notices, six images, 29 impacts and 24 geometrized records are historical results, never mandatory future counts.
- Validate FR/EN at desktop/mobile widths, actual line/popup clicks, canvas pixels, popup bounds, directions, hours, warnings and source links. Use an advancing Playwright clock (`page.clock.install({ time: ... })`), not a frozen `Date.now()` that can stall Leaflet animations. Keep screenshots outside the repository and out of chat under the local workaround.
- Verify that preferred PJCCI components and longer native periods remain available, copied entries are not double-counted, changed/missing sources are not incorrectly hidden, and loss of this snapshot leaves other sources usable. Run `npm run test:custom-stats` if touching custom statistics. A replayed MTMD fixture is not a live API verification: report the actual live check separately, including failures.
- In the final report, give the bulletin period; counts of fully reviewed notices, images and releases; impacts by type; exclusions; unmapped impacts and reasons; verified comparisons, hidden copies and preferred distinct components; differences preserved; actual verification time; and tests run or blocked. Report local changes only, with no publication claim.

## PJCCI - infrastructure authority, not a municipality

This section concerns Les Ponts Jacques Cartier et Champlain Incorporee (PJCCI), an infrastructure authority, not a municipality. Its segmentation and geometry rules below apply specifically to its work-advisory snapshot.

### Required sources

Always cross-check both official sources:

- Archive des avis: `https://jacquescartierchamplain.ca/fr/structures/archive-des-avis-de-travaux-et-chantiers/`
- Interactive sector map: `https://jacquescartierchamplain.ca/fr/circulation-routiere/secteur-bonaventure/`

Use the archive and each detail page for the full text, sections, bullet points, directions, impacts, dates, images, diagrams and relevant attachments. Use the interactive map's embedded `entrave` data for official IDs, coordinates, titles, and map dates. Check the relevant structure's official map as well when needed; Bonaventure is not spatial evidence for another bridge. Absence from the map does not exclude an archive advisory. Preserve source URLs and cross-source validation.

### Complete review and durable restart point

- The archive defaults to newest first. Walk from the newest advisory through the last fully reviewed advisory, inclusive; analyze EVERY new advisory in that interval, including notices later excluded as expired, non-automobile or duplicate. Never select only titles, familiar structures, a user-provided example, map entries or the first page. Include all notices sharing the boundary publication date; do not infer identity or chronology from URL order or work dates.
- Establish the previous restart point from an explicit completed review, with the advisory's canonical URL and published date, including inspected media or a documented text-sufficiency decision. `extractedAt`, the newest retained segment and an advisory's mere presence in a snapshot are NOT evidence of completed analysis. If the point is missing, ambiguous, absent from the archive or lacks review evidence, perform a full initial archive review; do not silently choose a cutoff.
- Retrieve and validate the complete archive inventory even during incremental detail review. The POST is cumulative: `articlelimit=0` returns ten notices, `10` twenty, and so on. Deduplicate by canonical notice URL, require unique count agreement with `all`, reject conflicting copies or changing totals, and verify the published ordering. Older notices cannot be skipped just because the newest page looks unchanged.
- In addition to the new interval, re-fetch the detail pages and attempt retrieval of relevant media of all previously retained active/future parents and unresolved candidates, including older notices. Compare the complete archive inventory to the prior reviewed inventory to detect older additions and changed notices. Review changed text, diagrams and attachments, even when the URL or title has not changed. Reuse an unchanged analysis only with matching supporting source content and a valid prior media review or renewed text-sufficiency decision, not matching raw parent fields alone.
- Read every new/changed notice completely BEFORE eligibility, segmentation, dates, direction or geometry decisions. A completed review may legitimately yield no automobile restriction, but must record why. Distinguish publication/archive display dates from the actual work periods in the body and media. An archive display end date alone must not discard an explicitly ongoing or indefinite restriction; require published current-status evidence under the core contract, or leave it in review with the precise uncertainty.
- After successful review, store a compact audit under `validation.pjcciReview` in the existing snapshot (not a new feed): previous and new restart URL/published date, review time, archive inventory (URL, published date and content fingerprints), and per-notice decisions with detail/media URLs, media fingerprints when retrieved, actual inspection/access status, supporting passages or diagram observations, segment IDs, exclusions and unresolved issues. For text-only validation, record the missing image, access limitation and exact passages establishing every required attribute and the geometry match. Never invent a media fingerprint or mark an uninspected image inspected. Preserve the existing loader schema and source fields. Never seed a completed review retrospectively from the existing records.
- Advance the restart point to the newest fully reviewed advisory only after the entire required interval and older rechecks are complete and validated; a documented sufficient-text review qualifies despite an inaccessible image. Missing media or visual access alone is not a blocker. Block only attributes, restrictions or geometry whose evidence remains insufficient, and identify them precisely. If those unresolved elements prevent completion of the required PJCCI review, preserve the previous PJCCI snapshot, restart point and `extractedAt`; report blocked notices and retain investigation artifacts outside the repository. Other sources remain independent.

### Image and diagram analysis; sufficient-text exception

- Enumerate every relevant image/diagram and attachment on each detail page, including linked originals, galleries and expanded sections. Open the full-resolution source, not just the archive thumbnail. Read legends, written labels, arrows, closure symbols, lane arrangements, limits, dates, directions, detours and access exceptions together with the full text.
- Images are substantive official evidence, not decoration. Record their exact URLs and what was actually observed. A download, an image filename, alt text or an HTTP 200 is not an analysis. Attempt inspection under the local transport workaround; if visual access is unavailable, disclose that limitation rather than claim an inspection.
- An inaccessible or uninspectable image does NOT block an advisory when the complete published text independently establishes the actual restrictions, roads/carriageways, limits, directions, dates, schedules and exceptions needed for the records and their geometry assignment. Cite the exact supporting passages and match them to independently verifiable coordinate geometry. Text-based spatial reasoning is allowed when demonstrable from these sources; guessing missing intersections, carriageways, lane arrangements or coordinates is not. Mark the review as text-supported with image uninspected, not visually verified. Such a completed review may advance freshness and the restart point once all other checks pass.
- If the text leaves a material detail to the image (for example, "see diagram" for the limits or affected carriageway), block only the unresolved elements and request targeted inspection. Do not discard independently established restrictions or invent the missing geometry. Apply the snapshot-preservation rule above if the required review cannot be completed.
- Reconcile body and image evidence. Never silently prefer one when they conflict or the diagram lacks sufficient detail; preserve both, identify the unresolved restriction/direction and do not claim a verified interpretation.
- Source colours never determine severity or impact type. Use published wording and explicit symbols/legends, not a red/green pixel or line colour alone.
- A diagram can establish which road, carriageway, direction or access is affected; it does not automatically supply geographic coordinates. Never trace pixels, invent a centreline, offset a road or use a screenshot as coordinate geometry. Obtain verifiable road geometry separately, then verify that it matches the configuration actually shown.

### Segmentation contract

Extract every distinct actual restriction established by the complete text and inspected diagrams, or by sufficient text alone under the exception above: road/carriageway, limits, affected direction, closure versus available lanes or contraflow, access exceptions, detour, dates and schedule. Create a separate segment whenever direction, impact, limits, period or schedule differs; do not turn every informational bullet into an invented closure. Carry applicable congestion, cancellation/postponement and section warnings into each affected segment. Preserve exact wording, approximate dates and the published responsible authority, which is not necessarily PJCCI.

For every segment, retain the supporting section/bullet and relevant image observation or documented sufficient-text justification, and explain the direction-to-carriageway mapping. Normal one-way tags and coordinate order describe the base road, NOT a temporary traffic configuration. Contraflow may put both travel directions on one carriageway while the other is closed: NEVER assign each direction to its normal OSM carriageway merely to draw two lines. Model only what the notice establishes; keep distinct impacts even if they share a verified geometry. If the lane-level alignment is unpublished, state that limitation without falsely assigning traffic to the opposite carriageway.

### Geometry contract

Never guess coordinates. Never use a generic OSRM route to represent a PJCCI closure. Accept a line only when it is:

- published by PJCCI;
- a named OSM road/bridge way verified against the full advisory (including inspected diagrams, or the documented sufficient-text exception) and the official map point or an independently verified official spatial control for the SAME restriction; or
- another independently verifiable official geometry.

The interactive map point is a control/reference, not automatically the displayed geometry. A nearby point, matching bridge name or matching dates alone does not validate the work limits or directional assignment. Cross-check any supplementary official event's identity, limits, dates, impact and temporary configuration; its spatial control does not make two normal carriageways correct for contraflow.

For each displayed geometry, retain source URL, feature/way IDs, exact coordinates, source version/time when available, verification time and the evidence establishing its limits and affected carriageway/direction. Preserve coordinate order as published unless a documented orientation change is required, and do not infer traffic direction from that order. If no verified geometry-to-restriction match can be established, keep the segment explicitly un-geometrized and report it; never draw a guessed line or fallback point. A vague geometry caveat in a popup cannot legitimize a wrong carriageway.

### Update command

The legacy generator below still contains hardcoded segment dates and OSM way sets rejected by the reviewed snapshot. Do not run its reconstruction on a validated snapshot until those rules have been corrected from current source evidence:

```bash
npm run snapshot:pjcci
```

Output: `data/pjcci-work-advisories-snapshot.json`.

An unchanged-data verification must satisfy the complete review and media contracts above, not merely compare raw archive parents and map entries. Require a complete inventory, completed new-interval review, older active/changed/unresolved rechecks, inspected media or documented sufficient-text decisions, and current map comparison before advancing `extractedAt`. Preserve unchanged records, geometry, source dates and historical build metadata. Reuse existing `validation.pjcciReview` exactly when its inventory, decisions and evidence are unchanged; update it only for actual review-state changes. Never fall back to legacy hardcoded interpretations. The [2026-10-03 report](../../docs/README.md#verification-des-sources-du-3-octobre-2026) is historical evidence, not a waiver of these requirements.

### Validation checklist

- Report the previous/new restart URLs and published dates, complete archive count, every notice in the reviewed interval and its decision, and older active/changed/unresolved notices rechecked.
- Compare all relevant detail pages and accessible images/attachments with interactive-map entries. List inspected and uninspected media, text-sufficiency decisions and genuinely unresolved evidence. A sufficient-text review is valid with its image limitation disclosed; never claim visual verification or declare the whole source verified with a genuinely blocked review.
- Reconcile counts of received/reviewed/retained/excluded notices, extracted restrictions, geometrized segments and records actually loaded/rendered. List every retained restriction not displayed, with its reason.
- Verify every segment's supporting text/diagram, section, direction, affected carriageway, limits, dates, schedule, warnings, access exceptions and responsible authority.
- Verify every geometry's provenance and direction-to-carriageway evidence; test temporary contraflow explicitly, not just normal one-way road tags. No unrelated bridge, road or unjustified extension.
- Report unmatched map entries and segments without verified geometry. Do not claim that two JSON records prove two displayed lines.
- Run `node --check tools/build-pjcci-work-advisories-snapshot.mjs` and `node --check js/app.js`.
- Parse JSON and test the real local site in Chromium with the advisory dates selected, FR/EN and desktop/mobile. Use actual pointer clicks on each affected carriageway; check overlapping hit areas, correct direction cards, dates/hours, warnings and geometry caveats. Run `node tools/validate-popup-grouping.mjs`; distinct impacts must remain distinct cards even when geometry is shared.
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

## Parc Jean-Drapeau - independent mobility notices

The authority is **Societe du parc Jean-Drapeau**, in Montreal's Ville-Marie borough, not PJCCI and not the City of Montreal roadwork feed. Its ongoing notice source is independent of archived Marathon/UCI event snapshots.

- Official index: `https://www.parcjeandrapeau.com/fr/avis-et-alertes/`.
- Generator: `node tools/build-parc-jean-drapeau-snapshot.mjs`; output: `data/parc-jean-drapeau-snapshot.json`.
- Extraction: Chromium request-context GET of the index and every published `?page=N&year=&category=&transport=` link. Parse the HTML response with `DOMParser`; `.notice-list > div` supplies the notice URL, title, published/updated text and textual status. Require the number of unique notice IDs to equal the published total; reject conflicting copies and changed totals. No separate structured XHR feed was observed.
- Retrieve every active/planned detail page at `/fr/avis-et-alertes/{id}/`. Preserve its full description and published transport modes. `Termine` notices are excluded. Keep only active/future published periods; a genuinely current open-ended notice remains in review until its scope and geometry are verified. A new or ambiguous notice must never silently inherit a previous mapping.
- Dates come from the actual title and publication year, with weekday/date validation; local time is `America/Montreal`. Do not invent an exact date for approximate periods. The 2026-10-11 06:30-11:00 notices 3269/3270 are reviewed examples, not dates to reuse for future notices.
- Source geometry: municipal `montreal:geobase` WFS, explicitly `srsname=EPSG:4326`, with exact feature counts and IDs. Preserve `sensCir` and official nodes. The municipal park GeoJSON is a reference area, not a blanket automobile closure. OSM XML supplies actual paths; parse coordinates and typed access tags, preserve attribution and timestamps, exclude private/no-access/customer paths from public-path claims. Never geocode a guessed line or substitute a driving router.
- Keep notice records, `automobileRecords`, `pedestrianRecords`, `accessExceptions`, exclusions and review separate. An authorized Casino route must not be coloured as closed or as no-parking; this does not declare parking allowed. Preserve both entry and exit paths and their published one-way semantics. Do not infer pedestrian access from a motorists-only exception.
- The Casino location published by the park is a control point, not a worksite or an invented entrance. This workstation blocks the Casino's own website under a corporate policy; do not bypass it or publish details from the block page.
- On unchanged complete notice verification, update only `extractedAt` and the matching FAQ/catalog freshness. Preserve the records and geometries exactly. `--from-captures DIR` is an explicit local rebuild and does not advance an existing successful verification time. Any failed/incomplete source response leaves the previous snapshot intact.
- Load only the final JSON on Auto. Merge pedestrian paths with `node tools/build-pedestrian-snapshot.mjs --parc-jean-drapeau-only`, or during full consolidation. Preserve other source records/freshness and per-source failures. The legacy Marathon access polygon must not be resurrected by its old merge helper.
- Validate JSON, stable IDs, all index pages, textual modes, dates, no source-colour classification, exact/proven clipped lines, one-way entry/exit continuity and no coloured Casino corridor. In Chromium, test actual road/path clicks, pixel alpha on entry/exit routes, FR/EN desktop/mobile, FAQ source links/freshness, and isolated source failure. No screenshots are attached to the chat.

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

## City of Repentigny - Open511 automobile roadworks

- Official map and API: `https://info-travaux.ville.repentigny.qc.ca/` and `https://info-travaux.ville.repentigny.qc.ca/api/events/`.
- Generator: `npm run snapshot:repentigny` (`node tools/build-repentigny-roadworks-snapshot.mjs`); output: `data/repentigny-roadworks-snapshot.json`.
- The generator uses Chromium to fetch the Open511 JSON pages, validates the response type, event IDs, pagination, official coordinates and schedule intervals, and writes only after the full response succeeds. Pagination URLs must remain HTTPS on the official Repentigny host.
- Retain active events only when they have published schedule intervals, a road reference and official geometry. Active events with no published dates are excluded from the automobile snapshot; do not invent dates or infer a restriction period.
- `js/app.js` loads the final local snapshot for the automobile map and applies the existing `normalizeRepentignyEvent` traffic labels and severity rules. Preserve every published interval; the displayed date span must run from the earliest interval start to the latest interval end. Keep the official API URL available for pedestrian snapshot extraction; do not replace it with the automobile snapshot URL.
- Update the matching snapshot `extractedAt` entries in `data/sources.js` only after successful extraction. Validate that the map loads the snapshot without issuing a live `/api/events/` request, and test representative geometry and popup content in Chromium.

## Ville de Mercier - HTML roadwork notices

- Official page: `https://www.ville.mercier.qc.ca/info-travaux/`.
- Generator: `npm run snapshot:mercier` (`node tools/build-mercier-snapshot.mjs`); output: `data/mercier-roadworks-snapshot.json`.
- The public source is an HTML index with links to complete detail pages, not a structured roadwork API. Each refresh must retrieve the complete index inventory, visit every linked notice, fingerprint its full text and every image/attachment, check ordering and duplicates, and compare against `validation.mercierReview`. Do not select only the newest title or stop at a known notice.
- `validation.mercierReview` is the durable restart point: it stores the prior/new restart URL and publication date, ordered inventory, notice text fingerprints, media URLs and SHA-256 fingerprints, completed review decisions, and the actual media inspection status/observations. Do not treat an old snapshot entry or extraction timestamp as evidence of review. The generator re-fetches and hashes the source to verify it, but on an unchanged fingerprint reuse the stored human analysis without rereading/reinterpreting the notice or re-inspecting its image. Only advance `extractedAt` and the matching catalog freshness after the complete source check succeeds. A new, changed, removed, conflicting, or inaccessible notice/media blocks the update: preserve the previous snapshot/restart point/timestamp and complete the new review before advancing it.
- The official WordPress REST endpoint returned HTTP 401 during source discovery; do not bypass authentication or treat that endpoint as a public API. Continue using the accessible HTML pages unless the municipality publishes a verified structured source.
- On 2026-10-16 the complete index contained one notice: “Route 138 / rue William et Des Érables”. The complete text states a temporary boulevard Saint-Jean-Baptiste closure at the route 138 / rue des Érables-William intersection; gives June 1, 07:00 to July 17, 17:00 without a year; routes vehicles via Lalonde, Saint-Joseph and Saint-Laurent (yellow, local circulation only); sends trucks via A-30 and chemin de la Beauce/route 205 (blue); says listed businesses remain accessible; and warns the work may be postponed, prolonged or cancelled for weather or operational reasons. Directions and lane configuration are not published.
- The original `route-138.png` (SHA-256 `b20cb34614f741980e8e0eb58ac3fbab59518e3519da9e31c0418d5868e21c80`) was visually inspected at full resolution. Its red star legend marks the boulevard Saint-Jean-Baptiste / rue des Érables closure; blue is “Chemin de détour” and yellow is “Circulation locale seulement”. The aerial diagram is not georeferenced and its routes are not digitized or treated as closure geometry. The notice's publication date (2024-05-30) and modification date (2026-06-02) do not establish the work year; preserve the notice in review with null normalized dates and geometry.
- A notice is eligible for `records` only after its automobile impact, full year-qualified dates, active/future status, and independently verifiable official geometry are established. An undated notice requires explicit active/current status. Do not infer the year, a closure point/line, carriageway, or limits from metadata, a star, or colored pixels.
- The current reviewed notice is a completed review with unresolved date/geometry evidence, not an active map record. Keep `inMap: false` and `inFaq: true`, but use a neutral FAQ source name such as “Ville de Mercier - Avis de travaux (snapshot)”. Do not append review or non-mapped status to the source name or generic FAQ explanation; the source remains listed even when there is no current work to display. Keep unresolved evidence in the snapshot review metadata.
- Validate with `node --check tools/build-mercier-snapshot.mjs`, `npm run snapshot:mercier`, JSON parsing, source/catalog timestamp agreement, and Chromium checks that the FAQ row appears in FR/EN while the driving map makes no request to Mercier and does not display the review candidate.

## Ville de Sainte-Catherine - pedestrian works from the interactive map

- Official map: `https://www.ville.sainte-catherine.qc.ca/carte-interactive/?q=S04sSU3PL8pMLVY1dTJQNXWxNTY1VCtOzUlNLklNsQUA`.
- The map makes a same-origin URL-encoded `POST` to `https://www.ville.sainte-catherine.qc.ca/index.php/actions/villeSainteCatherine/maps/getMarker/` with `category[]=351&selected=`. The JSON response has `success` and `result.markers`; each marker supplies `id`, `title`, `address`, `category_id`, `lat`, `long`, and an HTML `description`. Preserve published decimal latitude/longitude as `[long, lat]`; do not reconstruct a path from the marker.
- The endpoint has no usable cross-origin access from the static site (`OPTIONS` returned 404). Do not fetch it from `js/app.js` or add a proxy/backend. The walking map loads the verified record only from `data/pedestrian-closures-snapshot.json` through `js/pedestrian.js`; it is not a live map integration and does not add Sainte-Catherine to the automobile map.
- Also review the complete editorial index at `https://www.ville.sainte-catherine.qc.ca/citoyens/informations-pratiques/avis-et-info-travaux/`, every linked notice, and every image before deciding pedestrian or automobile impacts. `validation.sainteCatherineReview` stores the six-notice ordered inventory, full-text hashes, per-notice decisions, six media hashes/observations, and the restart point. An unchanged fingerprint reuses that analysis; any change blocks the refresh until the affected inventory and media are reviewed.
- Refresh with `npm run snapshot:pedestrian:sainte-catherine` (or `node tools/build-pedestrian-snapshot.mjs --sainte-catherine-only`). The Chromium capture validates the map page, POST filter, complete marker inventory, description fingerprints, official points, and every image URL/hash. Reuse prior visual inspection only when the bytes match. An unexpected marker, changed text, filter, or media blocks the refresh and preserves the prior records and successful `checkedAt`.
- This source is a component of the consolidated pedestrian snapshot: retain its per-source `checkedAt` and provenance; do not copy `generatedAt` into catalog freshness. Update the matching FAQ entry in `data/sources.js` to the successful source `checkedAt` only after validation. `inMap: true` here means the pedestrian map only.
- On 2026-10-17 the complete filtered inventory contained three markers. Marker `1040499351` explicitly describes sidewalk and curb works, 28 September–23 October 2026, but says “Multiples rues sur le territoire”. Keep it as `moderate` sidewalk works with its official `Point` at 5465 boulevard Marie-Victorin, unknown side, and the point-geometry caveat. The point/address is not a precise sidewalk trace or the location of every affected street; do not infer a side, route, or schedule.
- Marker `1040837351` publishes a cycling-path closure between 1700 and 1760 rue Centrale. The only exact 15 October, 07:00–16:00 interval belongs to the localized water interruption, not expressly to the path closure, and the published map point is not a path trace. Keep this candidate in `review` without invented dates or route geometry. Exclude marker `612269351`: its aqueduct flushing notice publishes no pedestrian or cycling restriction.
- The checked 17 October 2026 editorial review received six notices and six images. The notice about curbs/sidewalks also says one lane closes and traffic alternates on “multiple streets,” without naming them or publishing limits; keep this as an automobile review gap, not a citywide road closure. The retained sidewalk record links its detailed notice through `relatedSources`.
- Validate the source counts (`received: 3`, `retained: 1`, one review candidate, one exclusion), record dates/identity/Point geometry, stable records on metadata-only refresh, matching catalog `extractedAt` to this source's `checkedAt`, the walking popup and filters in FR/EN and mobile, and absence of direct Sainte-Catherine requests on the page.

## Ville de Boucherville - interactive roadwork notices

- Official map: `https://www.boucherville.ca/carte-interactive/?_poi_categories=avis-de-travaux`.
- Generator: `npm run snapshot:boucherville`; output: `data/boucherville-roadworks-snapshot.json`.
- Open the filtered map in Chromium and read `FWP_MAP.markersArray` from the official page's same-origin FacetWP response. Fetch every page of the public WordPress category-646 inventory and require exact ID agreement with the map points; the current review received 18 posts and 17 points, with markerless post 69057 kept out of the map.
- The current REST `link` values for sampled individual POIs redirect to the Boucherville home page. Use the verified map URL as the popup source link; retain any REST permalink only as inventory evidence, not as a working detail link.
- Review the complete related pages `https://www.boucherville.ca/travaux-infrastructures/chantiers-projets/`, `https://www.boucherville.ca/travaux-infrastructures/chantiers-projets/avis-travaux/`, `https://www.boucherville.ca/travaux-infrastructures/chantiers-projets/travaux-prevus/`, and `https://www.boucherville.ca/travaux-infrastructures/chantiers-projets/construction-dun-complexe-multisport/` as well as the map/API data. `validation.bouchervilleReview` preserves the reviewed page inventory, source/media fingerprints and restart point. Unchanged pages reuse the prior review; any content, link, inventory, or media change requires review before snapshot freshness can advance.
- The map publishes `location.lat`/`location.lng` in decimal degrees and `coordinate_type: "point"`. Preserve these as Point geometries; never create street segments from the addresses. The REST `link` is the detail URL. Do not export unrelated contact fields. The FacetWP POST has no usable CORS from the static site, so this is a snapshot, not a live map loader.
- Keep only the reviewed active/future impacts: 69062's total Joseph-Huet obstruction and separate partial impacts on Pierre-Larrivé/Jean-Désy, 69054's one-lane closure on boulevard du Fort-Saint-Louis, and 68351's complete Jean-Maneau/Pierre-Piché intersection closure. Preserve their published weekday schedules and exact source text. Shared Points identify the project only; do not imply they delimit each road impact.
- `pedestrianRecords` also retains 69054's explicit closure of the multifonctionnelle path between De Montarville and Cicot sud as a Point, with `pedestrianArea: "path"` and `affectedUsers: ["pedestrians", "cyclists"]`. The Point is not the path outline. Consolidate this local input with `npm run snapshot:pedestrian:boucherville-only`; report it as `local-snapshot`, not a new live pedestrian check.
- Review every new map/API notice and date before changing the retained ID rules. Expired projects, non-road park works, non-municipal notices, and projects with no published automobile impact remain excluded or in `sourceReview`; do not classify from marker colors.
- Advance the snapshot and catalog `extractedAt` only after both complete inventories and the marker comparison succeed. Validate the four auto records, the pedestrian Point, source/catalog timestamps, FR/EN popups, the walking-area filter, and no live Boucherville request from `js/app.js`.

## Ville de Brossard - OpaTech automobile map

- Official map: `https://brossard.ca/informations-travaux/#carte`.
- Generator: `npm run snapshot:brossard`; output: `data/brossard-roadworks-snapshot.json`.
- The official map iframe sends `POST https://brossard.opatech.ca/public/get_projects`. In Chromium, capture its city-specific request body, then issue the published `auto: true`, `pieton: false`, `cycliste: false` query from inside the OpaTech iframe's own origin. This avoids the failing cross-origin `OPTIONS`/405 without a proxy; the resulting snapshot remains static because the response has no usable CORS for the map site.
- Also read the official works page `https://brossard.ca/sujets/travaux-et-entraves/` and the linked PTI 2024–2026 PDF. The PTI is planning context, not proof of current temporary traffic restrictions or exact closure periods. `validation.brossardSupplementalReview` stores its source/media fingerprints and reviewed interpretation; changed text or PDF bytes require renewed review before refreshing.
- Validate the complete unique project-reference inventory and the Web Mercator spatial reference (`wkid` 102100/3857). Convert with the deterministic Web Mercator-to-WGS84 formula. Preserve all six Grande Allée path parts in their published order as `MultiLineString`; draw no directional arrows. Preserve the official permit point as a Point; do not expand it into an invented road footprint.
- Retain Grande Allée's published Brossard-side lane closure and Longueuil-side diversion as `major`, and permit 2026-12018's published partial obstruction/road-width reduction as `moderate`. Exclude Lapinière after its exact published end timestamp; keep Barry, Orient and other no-impact projects in review, including Barry's `plan: true` flag when no public plan URL is available.
- Validate the 8-project response, 2 retained records, source timestamps, six geometry components, FR/EN popups, and absence of a live OpaTech request from `js/app.js`.

## Ville de Chambly - current municipal worksite POIs

- Official current-work map: `https://chambly.ca/carte-interactive/chantiers-municipaux/en-cours`.
- Live endpoint: `GET https://chambly.ca/api/v1/pois` (CORS `*`); the JSON envelope is `{status, data: {pois}}`. Filter by the published `categoriesSlug` values `chantiers-municipaux` and `en-cours`.
- Show only road-named current POIs with valid published `position.lat`/`position.lng` as Point worksite markers. The current Lapalme point has no published date or automobile impact, so mark it `worksiteOnly`, visible only for the successful check date, and exclude it from road-closure statistics. Do not fetch the KML from the static page or draw its line as an obstruction.
- Keep the current Langevin status/KML date conflict and the fire-station project out of the map; disclose them in source review. Zero current eligible POIs is a successful check, not a network failure.
- Test the source response in Chromium from the project origin, its Point popup, date-range behavior, neutral worksite styling/filter, and per-source failure isolation.

## Ville de McMasterville - Info-travaux articles and Google My Maps KML

- Official notice index: `https://www.mcmasterville.ca/services-aux-citoyens/info-travaux/`.
- Live inputs: paginated WordPress REST `GET https://www.mcmasterville.ca/wp-json/wp/v2/posts?categories=129&after=<previous-calendar-year>-01-01&per_page=100&page=N` and `GET https://www.google.com/maps/d/kml?mid=1v2gaHW5Woc8hV-Majzrtnnu1EChm0BM&forcekml=1`. The article endpoint permits the production origin; the KML permits `*`. No snapshot or proxy is used at page load.
- Retrieve every page of current/recent notice identities and validate pagination. Fetch matched article detail text separately. Parse dates only from a supported explicit source phrase; match the article's named road and limits to the KML description. If identity, date wording or geometry is ambiguous, log a review warning or source failure instead of guessing.
- The current matched notice is post 36143: the chemin du Richelieu (route 223) closure between Saint-François and de l'École, from Friday 16 October 2026 at 17:00 through Saturday 17 October without a published end hour. Preserve the KML Point and LineString exactly. Preserve the detour and parking-ban wording in the popup, but do not draw those streets without matching geometry. Suppress direction arrows; KML coordinate order is not a traffic direction.
- Cross-check the current MTMD/Québec 511 records before displaying the municipal notice separately. Event `q511-173820` has the same named road and limits, dates, start hour, full-closure impact, and line endpoints within 30 m. Keep both source records and geometries, display only the matching Québec 511 card while the pair fingerprint is unchanged, and link the municipal article from that card. If either source changes or the match is no longer exact, stop suppressing the municipal record and keep both distinct; never clear a binding to force a validator to pass.
- Validate complete post pagination, response CORS and content type, article passages, weekday/date agreement, KML XML types/coordinates, actual map click, FR/EN popup, and isolated source failure. Exclude expired notices.

## Ville de Saint-Basile-le-Grand - current worksite points

- Official map: `https://www.villesblg.ca/carte-interactive/?categorie=travaux`.
- Generator: `npm run snapshot:saint-basile`; output: `data/saint-basile-worksites-snapshot.json`.
- Chromium reads the page's lexical `actMapData` array. Select `categslugs` containing `travaux` and the explicit status `refection-ou-amenagement-en-cours`; keep `refection-ou-amenagement-a-venir` in review. `lat`/`lng` are the published decimal-degree map point. Ignore source colors.
- Review the complete notice index `https://www.villesblg.ca/services-aux-citoyens/infrastructures-et-reseau-routier/travaux/`, all 15 linked notice pages, and the related `https://www.villesblg.ca/services-aux-citoyens/infrastructures-et-reseau-routier/projets-de-construction-residentielle/projet-le-millenia/` page, including every linked image and PDF. The general 14-page roadworks FAQ at `https://www.villesblg.ca/wp-content/uploads/2023/11/GLR_2023_Liste-des-questions-frequentes-FAQ-travaux-infrastructures-routieres.pdf` gives general construction practices, not dates or geometry for a particular restriction.
- `validation.saintBasileReview` is the durable checkpoint: it stores the ordered notice inventory, page-text hashes, 28 media fingerprints and actual inspection status/observations, individual decisions, latest source-modification restart point, and previous restart point. A normal refresh verifies all fingerprints and reuses the completed analysis only if every input matches. If the index, page, asset, or fingerprint changes, preserve the prior snapshot until the complete changed source is re-reviewed; then use `npm run snapshot:saint-basile -- --review-supplemental-sources`.
- As verified 17 October 2026, the full inventory had 15 index notices plus the related Le Millenia page; its newest modified page was the Rang des Vingt notice (`2026-10-16T15:54:46+00:00`). The map returned 68 items, 16 work entries, 13 current Points, and 3 review candidates (including the map/expired-hydrant conflict and two upcoming projects). Retain current worksites as neutral Points with no invented dates or impacts and set `currentOnlyDate` to the successful extraction date. Do not draw segments or count them as road restrictions.
- Keep the Alvares/Ormes/Bella-Vista pump-station closures, the approximate Le Millenia paving closures, Rang des Vingt partial interruptions, Route 116 shoulder work, and park work out of the restriction layers when exact current periods/limits or admissible geometry are missing. Preserve each exact published passage and its reason in review; do not convert a map Point into the closed segment.
- The map page does not provide usable CORS, so this is a static snapshot. Validate unique IDs, all 13 current worksite markers, the three review candidates, click/popup, filter, date range, and catalog freshness.

## Ville de Sainte-Julie - current roadwork map JSON

- Official map: `https://saintejulie.ca/fr/carte/travaux`.
- Generator: `npm run snapshot:sainte-julie`; output: `data/sainte-julie-worksites-snapshot.json`.
- Source response: `GET https://saintejulie.ca/action.stejulie.location.json?category=travaux&lang=fr`. The public JSON is readable by the snapshot builder but has no usable CORS for the static map. `places` is an ID-keyed dictionary; `position` is `[latitude, longitude]` in decimal degrees.
- Also review the official municipal works page `https://saintejulie.ca/travaux` and its current images. They explain that dates may be approximate and urgent works are announced separately; the inspected park renderings are design illustrations, not closure diagrams. `validation.sainteJulieSupplementalReview` preserves the page/media hashes and review/restart metadata; a mismatch requires renewed review.
- The current admissible point is project 7021. Preserve the exact start (15 July 2026), the already-ended intersection work (29 August 2026), the approximate roadwork end text (“fin octobre 2026”), and the published detour wording. Do not turn the approximate end into a day, draw the detours, or assign a road-closure type. Display the point only for the successful check date as `worksiteOnly`.
- Review all eight source records; retain no other record without current dates/status, a road impact and usable geometry. Validate IDs/counts, finite Point coordinates, the approximate period text, catalog freshness, popup and date-range behavior.
