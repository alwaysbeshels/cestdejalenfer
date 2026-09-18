#!/usr/bin/env node
// Aucune geometrie n'est inventee: les coordonnees viennent de entraves.entraves[].selected.path[].geometry.paths
// (EPSG:3857, converties en WGS84). Politique active/future: endDate >= date d'extraction.

import { readFile, writeFile } from "node:fs/promises";
import { isDeepStrictEqual } from "node:util";
import assert from "node:assert/strict";
import { chromium } from "playwright";

const OUT = "data/mont-royal-snapshot.json";
const SOURCE_URL = "https://montroyal.opatech.ca/#/public?city=montroyal&entraves=true&closing=true&detours=true&lang=fr";

function toWgs84([x, y]) {
  const longitude = (x / 6378137) * (180 / Math.PI);
  const latitude = (Math.atan(Math.exp(y / 6378137)) * 360) / Math.PI - 90;
  return [longitude, latitude];
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
    const previous = JSON.parse(await readFile(OUT, "utf8"));
    const browser = await chromium.launch({ headless: true });
    let capture;
    let request;
    try {
      const page = await browser.newPage();
      const pending = page.waitForResponse((response) =>
        response.url() === "https://montroyal.opatech.ca/public/get_projects"
        && response.request().method() === "POST" && response.ok(), { timeout: 90000 });
      const responses = await Promise.all([
        pending,
        page.goto(SOURCE_URL, { waitUntil: "domcontentloaded", timeout: 90000 })
      ]);
      capture = await responses[0].json();
      request = responses[0].request().postDataJSON();
      assert(capture.success);
      assert(Array.isArray(capture.data));
      assert.equal(request.city, "montroyal");
    } finally {
      await browser.close();
    }
    const projects = capture.data;
    const extractedAt = new Date().toISOString();
    const today = extractedAt.slice(0, 10);

    const records = [];
    const excluded = [];
    for (const project of projects) {
      const info = project.data?.informations;
      const entravesBlock = project.data?.entraves;
      assert(info && entravesBlock && project.data.uuid);

      const [startMs, endMs] = entravesBlock.date || [];
      const startDate = toDateOnly(startMs);
      const endDate = toDateOnly(endMs);
      if (!endDate || endDate < today) {
        excluded.push({ id: project.data.uuid, reason: endDate ? "expired" : "no-published-end-date-or-current-status" });
        continue;
      }

      const existing = previous.records.find((record) => record.id === project.data.uuid);
      if (existing && isDeepStrictEqual(existing.publishedProject, project)) {
        records.push(existing);
        continue;
      }

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
      if (lines.length === 0) {
        excluded.push({ id: project.data.uuid, reason: "no-published-geometry" });
        continue;
      }

      const trafficLabels = (info.trafficImpact?.value || [])
        .filter((v) => v.status)
        .map((v) => v.label_fr || v.label)
        .filter(Boolean);

      records.push({
        id: project.data.uuid,
        title: info.name || "",
        startDate,
        endDate,
        impact: [stripHtml(info.comment), stripHtml(info.notes)].filter(Boolean).join("\n"),
        trafficLabels,
        streets,
        direction: "Direction non publiée.",
        reference: info.reference || "",
        geometry: lines.length === 1
          ? { type: "LineString", coordinates: lines[0] }
          : { type: "MultiLineString", coordinates: lines },
        sourceUrl: SOURCE_URL,
        publishedProject: project,
        geometrySource: {
          crs: "EPSG:3857",
          field: "data.entraves.entraves[].selected.path[].geometry.paths",
          outputCrs: "EPSG:4326"
        }
      });
    }

    const snapshot = {
      extractedAt,
      sourceUrl: SOURCE_URL,
      municipality: "Ville de Mont-Royal",
      records,
      extraction: {
        ...previous.extraction,
        method: "Chromium: successful same-origin POST emitted by the official public map",
        endpoint: "https://montroyal.opatech.ca/public/get_projects",
        request,
        sourceRecordCount: projects.length,
        retainedRecordCount: records.length,
        excluded
      }
    };
    const previousById = new Map(previous.records.map((record) => [record.id, record]));
    const unchanged = previous.records.length === records.length
      && records.every((record) => isDeepStrictEqual(record, previousById.get(record.id)));
    await writeFile(OUT, JSON.stringify(unchanged ? { ...previous, extractedAt } : snapshot, null, 2), "utf8");
    console.log(`Projets captures: ${projects.length} | retenus (actifs/futurs, geometrie publiee): ${records.length}`);
    console.log(`Saved ${OUT}`);
  })();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
