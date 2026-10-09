import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { lineMeasures, sliceLine, pointInPolygon } from "./snapshot-geometry.mjs";

function longestSegment(geometry) {
  const lines = geometry.type === "LineString" ? [geometry.coordinates] : geometry.coordinates;
  const segments = lines.flatMap(line => line.slice(1).map((end, index) => ({ first: line[index], end, length: lineMeasures([line[index], end])[1] })));
  segments.sort((first, second) => second.length - first.length);
  return segments[0].first.map((value, axis) => (value + segments[0].end[axis]) / 2);
}

async function configureView(page, { date, search = "", point, zoom = 18 }) {
  if (await page.locator("#menuToggle").isVisible() && await page.locator("#menuToggle").getAttribute("aria-expanded") === "true"
    && await page.evaluate(() => compactLayoutQuery.matches)) await page.locator("#menuToggle").click();
  await page.evaluate(({ date, search, point, zoom }) => {
    dateStart.value = date;
    dateEnd.value = date;
    dateEndUsesOpenDefault = false;
    searchFilter.value = search;
    categoryFilters.forEach(input => { input.checked = true; });
    impactFilters.forEach(input => { input.checked = true; });
    timeFilters.forEach(input => { input.checked = true; });
    locationHasCentered = true;
    map.stop();
    map.setView([point[1], point[0]], zoom, { animate: false });
    updateView({ fit: false });
  }, { date, search, point, zoom });
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function samplePixel(page, point) {
  return page.evaluate(point => {
    const target = map.latLngToContainerPoint([point[1], point[0]]);
    const mapBounds = map.getContainer().getBoundingClientRect();
    const canvas = fastRenderer._container;
    const bounds = canvas.getBoundingClientRect();
    const x = Math.round((mapBounds.left + target.x - bounds.left) * canvas.width / bounds.width);
    const y = Math.round((mapBounds.top + target.y - bounds.top) * canvas.height / bounds.height);
    return [...canvas.getContext("2d").getImageData(x, y, 1, 1).data];
  }, point);
}

async function clickRecord(page, id, rawPoint = null) {
  const record = await page.evaluate(id => {
    const record = allClosures.find(record => record.id === id);
    if (!record) throw new Error(`Missing map record ${id}`);
    return { id, startDate: record.startDate, startTime: record.startTime, endTime: record.endTime, source: record.source, streets: record.streets, geometry: record.geometry };
  }, id);
  const point = rawPoint || longestSegment(record.geometry);
  await configureView(page, { date: record.startDate, search: record.streets, point });
  await page.waitForFunction(id => renderedClosureLayers.has(id), id);
  await page.waitForFunction(point => {
    const target = map.latLngToContainerPoint([point[1], point[0]]);
    const mapBounds = map.getContainer().getBoundingClientRect();
    const canvas = fastRenderer._container;
    const bounds = canvas.getBoundingClientRect();
    const x = Math.round((mapBounds.left + target.x - bounds.left) * canvas.width / bounds.width);
    const y = Math.round((mapBounds.top + target.y - bounds.top) * canvas.height / bounds.height);
    return canvas.getContext("2d").getImageData(x, y, 1, 1).data[3] > 0;
  }, point);
  const target = await page.evaluate(point => {
    const target = map.latLngToContainerPoint([point[1], point[0]]);
    const bounds = map.getContainer().getBoundingClientRect();
    return { x: bounds.left + target.x, y: bounds.top + target.y };
  }, point);
  assert.ok((await samplePixel(page, point))[3] > 0, "Closure canvas is blank");
  await page.mouse.click(target.x, target.y);
  await page.locator(".leaflet-popup-content").waitFor();
  const text = await page.locator(".leaflet-popup-content").innerText();
  assert.ok(text.includes(record.startTime) && text.includes(record.endTime) && text.includes(record.source), `Wrong popup for ${id}`);
  assert.doesNotMatch(text, /parcJeanDrapeau\.(?:lineGeometry|accessException|notice)/);
  await page.waitForFunction(() => {
    const element = document.querySelector(".leaflet-popup-content");
    const bounds = element.getBoundingClientRect();
    return bounds.left >= 0 && bounds.top >= 0 && bounds.right <= innerWidth && bounds.bottom <= innerHeight && element.scrollWidth <= element.clientWidth + 1;
  });
  await page.locator(".popup-close-button").click();
  return { id, start: record.startTime, end: record.endTime };
}

export async function validateParkAndMarathon(baseUrl = process.env.MARATHON_VALIDATION_URL || "http://localhost:5500") {
  const marathonFile = "data/Marathon-Beneva-Mtl-2026.json";
  const parkFile = "data/parc-jean-drapeau-snapshot.json";
  const hash = file => createHash("sha256").update(readFileSync(file)).digest("hex");
  const before = [hash(marathonFile), hash(parkFile)];
  const marathon = JSON.parse(readFileSync(marathonFile, "utf8"));
  const park = JSON.parse(readFileSync(parkFile, "utf8"));
  const pedestrian = JSON.parse(readFileSync("data/pedestrian-closures-snapshot.json", "utf8"));
  assert.equal(park.receivedCount, park.records.length + park.excluded.length);
  assert.equal(park.referenceArea.display, false);
  assert.ok(park.records.every(record => record.description && record.publishedModes.length));
  const openIds = new Set(park.accessExceptions.flatMap(exception => exception.roadFeatures.map(feature => feature.properties.id)));
  const roadFeatures = new Map(marathon.displayGeometryReference.roadFeatures.map(feature => [feature.properties.id, feature]));
  const intervals = new Map();
  for (const record of marathon.displayGeometryReference.records) {
    assert.ok(!openIds.has(record.geobaseId), "Marathon colour on authorized Casino access");
    const line = roadFeatures.get(record.geobaseId).geometry.coordinates;
    assert.deepEqual(record.geometry.coordinates, sliceLine(line, ...record.interval, lineMeasures(line)));
    const key = [record.geobaseId, record.startDate, record.endDate, record.severity].join("|");
    if (!intervals.has(key)) intervals.set(key, []);
    intervals.get(key).push(record.interval);
  }
  for (const group of intervals.values()) {
    group.sort((left, right) => left[0] - right[0]);
    for (let index = 1; index < group.length; index += 1) assert.ok(group[index][0] >= group[index - 1][1] - 0.000001, "Duplicate physical road interval");
  }
  for (const record of [...park.automobileRecords, ...park.pedestrianRecords]) {
    assert.ok(["LineString", "MultiLineString"].includes(record.geometry.type), "Park polygon painted as closure");
    if (record.geobaseId) assert.ok(!openIds.has(record.geobaseId));
    const lines = record.geometry.type === "LineString" ? [record.geometry.coordinates] : record.geometry.coordinates;
    for (const line of lines) for (let index = 1; index < line.length; index += 1) assert.ok(pointInPolygon(line[index].map((value, axis) => (value + line[index - 1][axis]) / 2), park.referenceArea.feature.geometry.coordinates));
  }
  assert.equal(pedestrian.records.filter(record => record.sourceKey === "parc-jean-drapeau").length, park.pedestrianRecords.length);
  assert.equal(pedestrian.records.some(record => record.sourceKind === "pedestrian-marathon-access"), false);
  assert.equal(pedestrian.sources.find(source => source.key === "parc-jean-drapeau").sourceExtractedAt, park.extractedAt);
  const browser = await chromium.launch({ headless: true });
  const results = [];
  const errors = [];
  const blockedSourceRequests = [];
  try {
    const context = await browser.newContext({ serviceWorkers: "block", timezoneId: "America/Toronto" });
    const page = await context.newPage();
    page.on("pageerror", error => errors.push(error.message));
    page.on("request", request => { if (/docs\.google\.com\/spreadsheets|forms\.gle/.test(request.url())) blockedSourceRequests.push(request.url()); });
    await page.route("https://**/*", route => /^https:\/\/(cdn\.jsdelivr\.net|unpkg\.com)\//.test(route.request().url()) ? route.continue() : route.abort());
    await page.addInitScript(() => localStorage.setItem("mapClickHintSeen", "1"));
    for (const language of ["fr", "en"]) for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
      await page.goto(`${baseUrl}/${language}/`, { waitUntil: "domcontentloaded" });
      await page.waitForFunction(() => document.documentElement.hasAttribute("data-page-ready"));
      await page.waitForFunction(expected => typeof allClosures !== "undefined"
        && allClosures.filter(record => record.sourceKind === "parc-jean-drapeau").length === expected.park
        && allClosures.filter(record => record.sourceKind?.startsWith("marathon-beneva-")).length === expected.marathon
        && !marathonSnapshotFailed && !parcJeanDrapeauSnapshotFailed,
      { park: park.automobileRecords.length, marathon: marathon.displayGeometryReference.records.length }, { timeout: 45000 });
      assert.equal(await page.evaluate(() => allClosures.filter(record => /marathon|parc-jean-drapeau/.test(record.sourceKind)).some(record => /Polygon/.test(record.geometry.type))), false);
      const clicks = [];
      const viau = marathon.displayGeometryReference.records.find(record => record.streetName === "rue Viau" && record.startDate === "2026-10-10" && record.severity === "critical" && record.geometry.coordinates.length > 2);
      const parking = marathon.displayGeometryReference.records.find(record => record.streetName === "rue Viau" && record.startDate === "2026-10-10" && record.severity === "parking" && record.geometry.coordinates.length > 2);
      clicks.push(await clickRecord(page, viau.id));
      clicks.push(await clickRecord(page, parking.id));
      const parkRoad = park.automobileRecords.find(record => record.geometry.type === "LineString" && lineMeasures(record.geometry.coordinates).at(-1) > 100);
      clicks.push(await clickRecord(page, parkRoad.id));
      const accessProbes = [];
      for (const id of [1622354, 1622352, 4008531, 1624947, 1624948, 4008723]) {
        const feature = park.accessExceptions[0].roadFeatures.find(feature => feature.properties.id === id);
        const point = longestSegment(feature.geometry);
        await configureView(page, { date: "2026-10-11", search: "marathon", point });
        assert.equal((await samplePixel(page, point))[3], 0, `Authorized access ${id} has a closure colour`);
        accessProbes.push(id);
      }
      await page.goto(`${baseUrl}/${language}/pedestrian.html`, { waitUntil: "domcontentloaded" });
      await page.waitForFunction(() => document.documentElement.hasAttribute("data-page-ready"));
      await page.waitForFunction(() => typeof allClosures !== "undefined" && allClosures.some(record => record.sourceKey === "parc-jean-drapeau"), null, { timeout: 45000 });
      const pathRecord = park.pedestrianRecords.find(record => record.geometry.type === "LineString" && lineMeasures(record.geometry.coordinates).at(-1) > 100);
      clicks.push(await clickRecord(page, pathRecord.id));
      const dateCases = await page.evaluate(id => {
        const record = allClosures.find(record => record.id === id);
        return ["2026-10-10", "2026-10-11", "2026-10-12"].map(date => {
          dateStart.value = date; dateEnd.value = date; dateEndUsesOpenDefault = false;
          return overlapsDateRange(record, getDateRange());
        });
      }, pathRecord.id);
      assert.deepEqual(dateCases, [false, true, false]);
      assert.equal(await page.evaluate(() => allClosures.some(record => record.sourceKind?.startsWith("marathon-beneva-") || record.sourceKind === "parc-jean-drapeau")), false);
      await page.goto(`${baseUrl}/${language}/faq.html`, { waitUntil: "domcontentloaded" });
      await page.waitForFunction(() => document.documentElement.hasAttribute("data-page-ready"));
      await page.waitForFunction(() => document.querySelector('#faqSourceList a[href*="parc-jean-drapeau-snapshot.json"]'));
      if (!await page.locator("#sources-utilisees").evaluate(element => element.open)) await page.locator("#sources-utilisees > summary").click();
      await page.locator("#faqSourceList").waitFor({ state: "visible" });
      const faq = await page.locator("#faqSourceList").innerText();
      assert.match(faq, /Société du parc Jean-Drapeau - Avis de mobilité/);
      assert.match(faq, /Société du parc Jean-Drapeau - Snapshot des avis de mobilité/);
      const dates = await page.evaluate(() => window.SOURCE_CATALOG.filter(source => source.inMap && source.name.startsWith("Société du parc Jean-Drapeau")).map(source => source.extractedAt));
      assert.deepEqual(dates, [park.extractedAt, park.extractedAt]);
      results.push({ language, width, clicks, accessProbes, pedestrianDates: dateCases, faqVerified: true });
    }
    await context.close();
    const failureContext = await browser.newContext({ serviceWorkers: "block" });
    const failedPage = await failureContext.newPage();
    await failedPage.route("https://**/*", route => /^https:\/\/(cdn\.jsdelivr\.net|unpkg\.com)\//.test(route.request().url()) ? route.continue() : route.abort());
    await failedPage.route("**/data/parc-jean-drapeau-snapshot.json", route => route.abort());
    await failedPage.goto(`${baseUrl}/fr/`, { waitUntil: "domcontentloaded" });
    await failedPage.waitForFunction(() => typeof parcJeanDrapeauSnapshotFailed !== "undefined" && parcJeanDrapeauSnapshotFailed && allClosures.some(record => record.sourceKind === "mont-royal-snapshot"), null, { timeout: 45000 });
    assert.equal(await failedPage.evaluate(() => allClosures.some(record => record.sourceKind === "parc-jean-drapeau")), false);
    await failureContext.close();
    assert.deepEqual(errors, []);
    assert.deepEqual(blockedSourceRequests, []);
  } finally { await browser.close(); }
  assert.deepEqual([hash(marathonFile), hash(parkFile)], before, "Validation mutated a snapshot");
  console.log(JSON.stringify({ displayPieces: marathon.displayGeometryReference.records.length, parkRoads: park.automobileRecords.length, parkPaths: park.pedestrianRecords.length,
    results, noDuplicateIntervals: true, noParkPolygon: true, sourceFailureIsolated: true, pageErrors: errors }, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await validateParkAndMarathon();