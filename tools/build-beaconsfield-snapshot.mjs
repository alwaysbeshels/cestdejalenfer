#!/usr/bin/env node
// Construit le snapshot Beaconsfield a partir des KML officiels et des descriptions
// live de la carte interactive (GET /api/v1/pois puis /api/v1/pois/{id} pour le detail).
// Aucune geometrie n'est inventee: chaque tronçon vient d'un Placemark KML officiel.
// Politique active/future: les dates sont lues manuellement dans le texte publie
// (blocs libres, non structures) et un enregistrement est exclu si sa periode est
// entierement terminee a la date d'extraction.

import { readFile, writeFile } from "node:fs/promises";

const POIS_URL = "https://www.beaconsfield.ca/api/v1/pois";
const DETAIL_URL = (id) => `https://www.beaconsfield.ca/api/v1/pois/${id}`;
const OUT = "data/beaconsfield-snapshot.json";
const SOURCE_URL = "https://www.beaconsfield.ca/fr/carte-interactive/info-travaux";
const WORK_CATEGORIES = ["aqueduc", "egout", "pavage", "info-travaux", "travaux-divers", "troittoir"];

function stripHtml(value) {
  return String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseKmlLines(xml) {
  const lines = [];
  const points = [];
  const matches = xml.matchAll(/<coordinates>\s*([^<]+?)\s*<\/coordinates>/g);
  for (const match of matches) {
    const coords = match[1]
      .trim()
      .split(/\s+/)
      .map((triplet) => triplet.split(",").map(Number).slice(0, 2))
      .filter((pt) => Number.isFinite(pt[0]) && Number.isFinite(pt[1]));
    if (coords.length >= 2) lines.push(coords);
    else if (coords.length === 1) points.push(coords[0]);
  }
  return { lines, points };
}

// Dates lues manuellement dans le texte publie par chaque panneau de detail (voir
// .github/agents/snapshots-municipaux.agent.md, section Beaconsfield). endDate null
// signifie un projet pluriannuel toujours actif a la date d'extraction.
const MANUAL_WINDOWS = {
  2184: { startDate: "2025-01-01", endDate: "2029-12-31" }, // Travaux divers (plusieurs projets, jusqu'a 2029)
  2186: { startDate: "2026-06-02", endDate: "2026-10-23" }, // Travaux sur les egouts
  2188: { startDate: "2026-06-22", endDate: "2026-10-02" }, // Travaux drainage
  2189: { startDate: "2026-06-01", endDate: "2026-10-02" }, // Rehabilitation aqueduc
  2185: { startDate: "2026-05-01", endDate: "2026-07-24" }, // Refection des trottoirs (terminee)
  2187: { startDate: "2026-05-04", endDate: "2026-07-24" }  // Travaux de pavage (terminee)
};

async function main() {
  const poisResponse = await fetch(POIS_URL, { headers: { "User-Agent": "Mozilla/5.0" } });
  const pois = (await poisResponse.json()).data.pois;
  const workPois = pois.filter((p) => (p.categoriesSlug || []).some((c) => WORK_CATEGORIES.includes(c)) && p.kml);

  const today = new Date().toISOString().slice(0, 10);
  const records = [];
  for (const poi of workPois) {
    const window = MANUAL_WINDOWS[poi.id];
    if (!window || (window.endDate && window.endDate < today)) continue; // politique active/future

    const detailResponse = await fetch(DETAIL_URL(poi.id), { headers: { "User-Agent": "Mozilla/5.0" } });
    const detail = (await detailResponse.json()).data.poi[0];
    if (!detail?.loc_is_published_fr) continue;

    const kmlResponse = await fetch(poi.kml, { headers: { "User-Agent": "Mozilla/5.0" } });
    const kml = await kmlResponse.text();
    const { lines, points } = parseKmlLines(kml);
    if (lines.length === 0 && points.length === 0) continue; // pas de geometrie publiee: on ne fabrique rien

    const geometry = lines.length > 0
      ? { type: "MultiLineString", coordinates: lines }
      : { type: "MultiPoint", coordinates: points }; // reperes ponctuels seulement, jamais une ligne inventee

    records.push({
      id: `beaconsfield-${poi.slug}`,
      title: detail.loc_title_fr,
      startDate: window.startDate,
      endDate: window.endDate,
      impact: stripHtml(detail.loc_description_fr),
      trafficLabels: [poi.title],
      streets: lines.length > 0
        ? `Réseau ${detail.loc_title_fr.toLowerCase()} (${lines.length} tronçons)`
        : `${detail.loc_title_fr} (${points.length} repères, aucune ligne publiée)`,
      direction: "Direction non précisée.",
      reference: String(poi.id),
      geometry,
      sourceUrl: SOURCE_URL
    });
  }

  const snapshot = {
    extractedAt: new Date().toISOString(),
    sourceUrl: SOURCE_URL,
    records
  };
  await writeFile(OUT, JSON.stringify(snapshot, null, 2), "utf8");
  console.log(`POIs travaux trouves: ${workPois.length} | retenus (actifs/futurs, publies, geometrie KML): ${records.length}`);
  console.log(`Saved ${OUT}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
