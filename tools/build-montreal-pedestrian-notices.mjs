import { readFile, writeFile } from "node:fs/promises";
import { isDeepStrictEqual } from "node:util";
import { chromium } from "playwright";

const API = "https://montreal.ca/entraves-travaux/api/recherche";
const SOURCE = "https://montreal.ca/entraves-travaux/entraves";
const OUTPUT = "data/montreal-pedestrian-notices-snapshot.json";
const WFS = "https://api.montreal.ca/api/it-platforms/geomatic/wfs-maps/montreal/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=montreal:entraves-ponctuelles&outputFormat=application/json";

async function fetchPage(page) {
  const response = await fetch(`${API}?page=${page}`, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`Page ${page}: HTTP ${response.status}`);
  const data = await response.json();
  if (data.code !== "success" || !Array.isArray(data.entries) || !Number.isInteger(data.total)
    || !Number.isInteger(data.limit) || data.limit <= 0 || data.offset !== (page - 1) * data.limit) {
    throw new Error(`Page ${page}: invalid pagination`);
  }
  return data;
}

async function main() {
  let previous;
  try { previous = JSON.parse(await readFile(OUTPUT, "utf8")); } catch (error) { if (error.code !== "ENOENT") throw error; }
  const first = await fetchPage(1);
  const pages = [first];
  const pageCount = Math.ceil(first.total / first.limit);
  for (let page = 2; page <= pageCount; page += 3) {
    const batch = await Promise.all(Array.from({ length: Math.min(3, pageCount - page + 1) }, (_, index) => fetchPage(page + index)));
    pages.push(...batch);
    if (page % 15 === 2 || page + 3 > pageCount) console.log(`Pages verified: ${pages.length}/${pageCount}`);
  }
  if (pages.some((page) => page.total !== first.total || page.limit !== first.limit)) {
    throw new Error("Source changed during extraction; snapshot not written");
  }
  const entries = pages.flatMap((page) => page.entries);
  const ids = entries.map((entry) => entry.mtl_content?.obstruction?.permitId);
  if (entries.length !== first.total || ids.some((id) => !id)) {
    throw new Error("Incomplete notices; snapshot not written");
  }
  const byPermit = new Map();
  for (const entry of entries) {
    const permit = entry.mtl_content.obstruction.permitId;
    const previous = byPermit.get(permit);
    if (previous && JSON.stringify(previous.mtl_content) !== JSON.stringify(entry.mtl_content)) {
      throw new Error(`Conflicting duplicate notice ${permit}; snapshot not written`);
    }
    byPermit.set(permit, entry);
  }
  const response = await fetch(WFS, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`WFS: HTTP ${response.status}`);
  const geojson = await response.json();
  if (!Array.isArray(geojson.features) || Number(geojson.totalFeatures) !== geojson.features.length) {
    throw new Error("Incomplete WFS verification; snapshot not written");
  }
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto" }).format(new Date());
  const expected = geojson.features.filter((feature) => {
    const properties = feature.properties;
    const areas = JSON.parse(properties.affectedArea || "[]");
    return areas.some((area) => area === "sidewalk" || area === "park")
      && properties.durationEndDate && properties.durationEndDate.slice(0, 10) >= today;
  });
  const browser = await chromium.launch({ headless: true });
  let labels;
  let recovered = 0;
  try {
    const page = await browser.newPage();
    for (const feature of expected) {
      const permit = feature.properties.permitPermitId;
      if (byPermit.has(permit)) continue;
      await page.goto(`${SOURCE}/${encodeURIComponent(permit)}`, { waitUntil: "domcontentloaded" });
      const entry = await page.locator("#__NEXT_DATA__").evaluate((element) => JSON.parse(element.textContent).props.pageProps.content);
      if (entry.mtl_content?.obstruction?.permitId !== permit || entry.dc_provenance?.identifier !== feature.properties.id) {
        throw new Error(`Missing or mismatched notice ${permit}; snapshot not written`);
      }
      byPermit.set(permit, entry);
      recovered += 1;
    }
    const sample = expected[0]?.properties.permitPermitId;
    if (!sample) throw new Error("No pedestrian notices available to verify labels");
    await page.goto(`${SOURCE}/${encodeURIComponent(sample)}`, { waitUntil: "domcontentloaded" });
    labels = await page.locator("#__NEXT_DATA__").evaluate((element) => {
      const messages = JSON.parse(element.textContent).props.pageProps.messages.default;
      return {
        sidewalk: messages.Impacts.zones.types.sidewalk.action,
        park: messages.Impacts.zones.types.park.action,
        reasons: messages.ContentHeader.reasons,
        dailyLife: messages.Impacts.impacts.types
      };
    });
    if (!labels.sidewalk?.blocked || !labels.sidewalk?.obstructed || !labels.park?.blocked || !labels.park?.closed) {
      throw new Error("Official impact labels missing; snapshot not written");
    }
  } finally {
    await browser.close();
  }
  const eligible = [...byPermit.values()].filter((entry) => {
    const areas = entry.mtl_content.obstruction.occupancyImpact?.affectedArea || [];
    const end = entry.dc_temporal?.end?.slice(0, 10);
    return areas.some((area) => area === "sidewalk" || area === "park") && end && end >= today;
  });
  const records = eligible.map((entry) => {
    const obstruction = entry.mtl_content.obstruction;
    return {
      permitId: obstruction.permitId,
      sourceUrl: `${SOURCE}/${encodeURIComponent(obstruction.permitId)}`,
      title: entry.dc_title,
      startDate: entry.dc_temporal.start.slice(0, 10),
      endDate: entry.dc_temporal.end.slice(0, 10),
      reasonCategory: obstruction.reasonCategory,
      occupancyImpact: obstruction.occupancyImpact,
      workImpact: entry.mtl_content.workImpact || null
    };
  }).sort((first, second) => first.permitId.localeCompare(second.permitId));
  const snapshot = {
    extractedAt: new Date().toISOString(),
    sourceUrl: SOURCE,
    apiUrl: API,
    sourceRecordCount: entries.length,
    pageCount,
    verification: { wfsUrl: WFS, expectedPedestrianNotices: expected.length, duplicateSearchResults: ids.length - new Set(ids).size, recoveredDirectly: recovered },
    retainedRecordCount: records.length,
    note: "Official notice attributes only. Joined to live WFS by permit ID; never used to invent geometry or seed stale closures. Source labels remain in French.",
    labels,
    records
  };
  const unchanged = previous && ["sourceUrl", "apiUrl", "note", "labels", "records"]
    .every((key) => isDeepStrictEqual(previous[key], snapshot[key]));
  await writeFile(OUTPUT, `${JSON.stringify(unchanged ? { ...previous, extractedAt: snapshot.extractedAt } : snapshot, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ extractedAt: snapshot.extractedAt, sourceRecords: entries.length, retained: records.length,
    customDescriptions: records.filter((record) => record.workImpact).length, output: OUTPUT }));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});