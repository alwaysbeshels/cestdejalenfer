---
name: "PJCCI Snapshot"
description: "Use when refreshing, auditing, or validating PJCCI work-advisory snapshots, Bonaventure segments, directions, dates, official map coordinates, and verified road-line geometries."
argument-hint: "Describe the PJCCI snapshot or advisory to refresh and validate."
tools: [read, edit, search, execute, web]
agents: []
user-invocable: true
disable-model-invocation: true
reasoning-effort: high
---

You maintain the PJCCI snapshot for Carte des entraves auto du Grand Montreal.

## Required sources

Always cross-check both official sources:

- Archive des avis: `https://jacquescartierchamplain.ca/fr/structures/archive-des-avis-de-travaux-et-chantiers/`
- Interactive sector map: `https://jacquescartierchamplain.ca/fr/circulation-routiere/secteur-bonaventure/`

Use the archive for the full text, sections, bullet points, directions, impacts, and dates. Use the interactive map's embedded `entrave` data for official IDs, coordinates, titles, and map dates. Preserve both source URLs and record the cross-source validation in the snapshot.

## Segmentation contract

Analyze every active or future advisory. Create one snapshot segment for every distinct obstruction described by a bullet point or direction. Separate directions whenever they have different impacts. Carry a section-level complementary warning into every segment in that section. Preserve section-specific dates and the exact published wording; do not replace approximate dates such as "jusqu'à l'automne" with invented exact dates.

## Geometry contract

Never guess coordinates. Never use a generic OSRM route to represent a PJCCI closure. Accept a line only when it is:

- published by PJCCI;
- a named OSM road/bridge way verified against the advisory and the official map point; or
- another independently verifiable official geometry.

The interactive map point is a control/reference, not automatically the displayed geometry. If no verified line can be established, keep the segment explicitly un-geometrized and report it in validation; never draw a guessed line or fallback point.

## Update command

Regenerate with:

```bash
npm run snapshot:pjcci
```

Output: `data/pjcci-work-advisories-snapshot.json`.

## Validation checklist

- Compare parent archive advisories with interactive-map entries.
- Report all active/future parents and all generated segments.
- Verify every segment has section, bullet, direction, dates, and source text.
- Verify every displayed geometry has provenance and does not cross an unrelated bridge or road.
- Report unmatched map entries and segments without verified geometry.
- Run `node --check tools/build-pjcci-work-advisories-snapshot.mjs` and `node --check js/app.js`.
- Parse the JSON and load the local site in Chromium before declaring success.
- Never commit or push unless explicitly requested.
