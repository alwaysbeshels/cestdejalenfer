#!/usr/bin/env node
import { writeFile } from "node:fs/promises";
import { chromium } from "playwright";

const SOURCE_URL = "https://info-travaux.ville.repentigny.qc.ca/api/events/";
const SOURCE_ORIGIN = new URL(SOURCE_URL).origin;
const OUT = "data/repentigny-roadworks-snapshot.json";

function hasValidCoordinates(value) {
  if (!Array.isArray(value)) return false;
  if (value.length >= 2 && value.every((coordinate) => typeof coordinate === "number")) {
    return value.every(Number.isFinite);
  }
  return value.length > 0 && value.every(hasValidCoordinates);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  let events;
  try {
    const page = await browser.newPage();
    await page.goto(SOURCE_ORIGIN, { waitUntil: "domcontentloaded" });
    events = await page.evaluate(async (startUrl) => {
      const received = [];
      const visited = new Set();
      let url = startUrl;
      while (url) {
        const parsed = new URL(url);
        if (parsed.protocol !== "https:" || parsed.origin !== location.origin
          || !parsed.pathname.startsWith("/api/events")) {
          throw new Error("Unexpected Open511 pagination URL");
        }
        if (visited.has(parsed.href)) throw new Error("Open511 pagination cycle");
        visited.add(parsed.href);

        const response = await fetch(parsed.href, { cache: "no-store" });
        if (!response.ok) throw new Error(`Open511 HTTP ${response.status}`);
        if (!response.headers.get("content-type")?.includes("application/json")) {
          throw new Error("Open511 returned a non-JSON response");
        }
        const data = await response.json();
        if (!Array.isArray(data.events)) throw new Error("Missing Open511 events");
        received.push(...data.events);
        url = data.pagination?.next_url ? new URL(data.pagination.next_url, parsed).href : null;
      }
      return received;
    }, SOURCE_URL);
  } finally {
    await browser.close();
  }

  const receivedIds = events.map((event) => event.id);
  if (receivedIds.some((id) => !id) || new Set(receivedIds).size !== receivedIds.length) {
    throw new Error("Open511 response contains missing or duplicate event IDs");
  }
  if (events.some((event) => event.status === "ACTIVE"
    && (!event.geography?.coordinates || !hasValidCoordinates(event.geography.coordinates)))) {
    throw new Error("An active Open511 event has missing or invalid published geometry");
  }
  const ids = events
    .filter((event) => event.status === "ACTIVE" && event.geography?.coordinates
      && hasValidCoordinates(event.geography.coordinates)
      && event.schedule?.intervals?.length
      && Array.isArray(event.roads) && event.roads.length > 0)
    .map((event) => event.id);
  if (ids.some((id) => !id) || new Set(ids).size !== ids.length) {
    throw new Error("Open511 response contains missing or duplicate event IDs");
  }
  const active = events.filter((event) => event.status === "ACTIVE");
  const records = active.filter((event) => event.geography?.coordinates
    && hasValidCoordinates(event.geography.coordinates)
    && event.schedule?.intervals?.length
    && Array.isArray(event.roads) && event.roads.length > 0);
  if (records.some((event) => !event.schedule.intervals.every((interval) => {
    const [start, end] = interval.split("/");
    const startTime = Date.parse(start);
    const endTime = Date.parse(end);
    return Number.isFinite(startTime) && Number.isFinite(endTime) && endTime >= startTime;
  }))) {
    throw new Error("Open511 response contains an invalid schedule interval");
  }
  if (records.some((event) => !["LineString", "MultiLineString", "Point", "MultiPoint", "Polygon", "MultiPolygon"].includes(event.geography.type))) {
    throw new Error("Open511 response contains an unsupported geometry type");
  }

  const snapshot = {
    extractedAt: new Date().toISOString(),
    sourceUrl: SOURCE_URL,
    municipality: "Repentigny",
    extractionMethod: "Open511 JSON API, retrieved with Chromium; all pagination pages validated.",
    receivedEventCount: events.length,
    activeEventCount: active.length,
    retainedRecordCount: records.length,
    limitations: [
      "Only active events with published schedule intervals, road references, and official geometry are retained for the automobile map.",
      "An ACTIVE event without a published schedule interval is not shown as a dated road restriction."
    ],
    records
  };
  await writeFile(OUT, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({
    output: OUT,
    extractedAt: snapshot.extractedAt,
    received: snapshot.receivedEventCount,
    active: snapshot.activeEventCount,
    retained: snapshot.retainedRecordCount,
    excludedActive: active.length - records.length
  }));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
