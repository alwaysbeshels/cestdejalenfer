#!/usr/bin/env node
// Convertit la capture live de la carte officielle de Mont-Royal (tools/mont-royal-raw-capture.json,
// reponse POST /public/get_projects capturee en Chromium reel) en snapshot statique.
// Aucune geometrie n'est inventee: les coordonnees viennent de entraves.entraves[].selected.path[].geometry.paths
// (EPSG:3857, converties en WGS84). Politique active/future: endDate >= date d'extraction.

import { readFile, writeFile } from "node:fs/promises";

const CAPTURE = "tools/mont-royal-raw-capture.json";
const OUT = "data/mont-royal-snapshot.json";
const SOURCE_URL = "https://montroyal.opatech.ca/#/public?city=montroyal&entraves=true&closing=true&detours=true&lang=fr";

function toWgs84([x, y]) {
  const longitude = (x / 6378137) * (180 / Math.PI);
  const latitude = (Math.atan(Math.exp(y / 6378137)) * 360) / Math.PI - 90;
  return [Number(longitude.toFixed(6)), Number(latitude.toFixed(6))];
}

function stripHtml(value) {
  return String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toDateOnly(ms) {
  if (!Number.isFinite(ms)) return null;
  return new Date(ms).toISOString().slice(0, 10);
}

function main() {
  return (async () => {
    const capture = JSON.parse(await readFile(CAPTURE, "utf8"));
    const projects = capture.data || [];
    const extractedAt = new Date().toISOString();
    const today = extractedAt.slice(0, 10);

    const records = [];
    for (const project of projects) {
      const info = project.data?.informations;
      const entravesBlock = project.data?.entraves;
      if (!info || !entravesBlock) continue;

      const [startMs, endMs] = entravesBlock.date || [];
      const startDate = toDateOnly(startMs);
      const endDate = toDateOnly(endMs);
      if (endDate && endDate < today) continue; // politique active/future uniquement

      const entraves = entravesBlock.entraves || [];
      const streets = entraves.map((e) => e.name).filter(Boolean).join(" / ") || "Rue non publiee";

      const lines = [];
      for (const entrave of entraves) {
        for (const segment of entrave.selected?.path || []) {
          const paths = segment.geometry?.paths;
          if (!paths) continue;
          for (const path of paths) {
            const converted = path.map(toWgs84);
            if (converted.length >= 2) lines.push(converted);
          }
        }
      }
      if (lines.length === 0) continue; // pas de geometrie publiee: on ne fabrique rien

      const trafficLabels = (info.trafficImpact?.value || [])
        .filter((v) => v.status)
        .map((v) => v.label_fr || v.label)
        .filter(Boolean);

      records.push({
        id: project.data.uuid,
        title: info.name || "",
        startDate,
        endDate,
        impact: stripHtml(info.comment) || stripHtml(info.notes) || "",
        trafficLabels,
        streets,
        direction: "Direction non publiée.",
        reference: info.reference || "",
        geometry: lines.length === 1
          ? { type: "LineString", coordinates: lines[0] }
          : { type: "MultiLineString", coordinates: lines },
        sourceUrl: SOURCE_URL
      });
    }

    const snapshot = {
      extractedAt,
      sourceUrl: SOURCE_URL,
      municipality: "Ville de Mont-Royal",
      records
    };
    await writeFile(OUT, JSON.stringify(snapshot, null, 2), "utf8");
    console.log(`Projets captures: ${projects.length} | retenus (actifs/futurs, geometrie publiee): ${records.length}`);
    console.log(`Saved ${OUT}`);
  })();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
