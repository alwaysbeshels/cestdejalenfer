import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { chromium } from "playwright";
import { validateParkAndMarathon } from "./validate-parc-jean-drapeau.mjs";

const snapshotPath = "data/Marathon-Beneva-Mtl-2026.json";
const snapshot = JSON.parse(readFileSync(snapshotPath, "utf8"));
const courseReference = snapshot.officialCourseReference;
assert.ok(courseReference, "RTRT course reference missing");
assert.equal(courseReference.timeZone, "America/Montreal");
assert.deepEqual(courseReference.courses.map(course => course.id).sort(), ["10k", "1k", "1mile", "5k", "halfmarathon", "marathon"]);
assert.equal(courseReference.courses.filter(course => course.date === "2026-10-11").length, 2);
for (const course of courseReference.courses) {
  assert.equal(course.geometryRole, "race-course");
  assert.equal(course.geometry.type, "LineString");
  assert.ok(course.geometry.coordinates.length > 1 && course.geometry.coordinates.every(pair => pair.length === 2 && pair.every(Number.isFinite)));
  assert.equal(course.routeDistancesKm.length, course.geometry.coordinates.length);
  assert.equal(Object.hasOwn(course, "startTime") || Object.hasOwn(course, "endTime"), false, "Race start cannot masquerade as closure hours");
}
const fingerprint = () => createHash("sha256").update(readFileSync(snapshotPath)).digest("hex");
const originalHash = fingerprint();
assert.equal(createHash("sha256").update(JSON.stringify(snapshot.roadClosures)).digest("hex"), "ac219030e2b89775fd827c377c2571d0be68aa547b79e40f783b3bf78ed0c3e1", "Original Waze closures changed");
const pdfReference = snapshot.officialClosureReference;
assert.equal(pdfReference.schedule.reduce((count, page) => count + page.rows.length, 0), 20);
for (const record of pdfReference.records) {
  const lines = record.geometry.type === "LineString" ? [record.geometry.coordinates] : record.geometry.coordinates;
  const sourceLines = record.sections.map(section => courseReference.courses.find(course => course.id === section.courseId).geometry.coordinates.slice(section.firstCoordinateIndex, section.lastCoordinateIndex + 1));
  assert.ok(lines.every(line => line.length > 1 && sourceLines.some(source => JSON.stringify(source) === JSON.stringify(line))), "Geometry not copied from consecutive source vertices");
  assert.ok(record.sections.every(section => section.maximumGapPdfPoints <= 3.5));
}
const baseUrl = process.env.MARATHON_VALIDATION_URL || "http://localhost:5500";
async function clickRecord(page, id) {
  await page.evaluate(selectedId => {
    const record = allClosures.find(entry => entry.id === selectedId);
    if (!record) throw new Error(`Missing selected record: ${selectedId}`);
    dateStart.value = record.startDate;
    dateEnd.value = record.endDate;
    dateEndUsesOpenDefault = false;
    categoryFilters.forEach(input => { input.checked = true; });
    impactFilters.forEach(input => { input.checked = true; });
    timeFilters.forEach(input => { input.checked = true; });
    searchFilter.value = record.streets;
    const line = record.geometry.type === "LineString" ? record.geometry.coordinates : record.geometry.type === "MultiLineString" ? record.geometry.coordinates.reduce((first, second) => first.length >= second.length ? first : second) : null;
    window.marathonClickPosition = line ? line[Math.floor(line.length / 2)] : record.point;
    map.stop();
    map.setView([marathonClickPosition[1], marathonClickPosition[0]], 17, { animate: false });
    updateView({ fit: false });
  }, id);
  await page.waitForFunction(selectedId => renderedClosureLayers.has(selectedId), id);
  const target = await page.evaluate(async selectedId => {
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const record = allClosures.find(entry => entry.id === selectedId);
    const point = map.latLngToContainerPoint([marathonClickPosition[1], marathonClickPosition[0]]);
    const bounds = map.getContainer().getBoundingClientRect();
    return { id: selectedId, x: bounds.left + point.x, y: bounds.top + point.y, start: record.startTime, end: record.endTime, street: record.streets, source: record.source };
  }, id);
  await page.mouse.click(target.x, target.y);
  await page.locator(".leaflet-popup-content").waitFor();
  await page.waitForFunction(() => {
    const popup = document.querySelector(".leaflet-popup-content");
    const bounds = popup.getBoundingClientRect();
    return bounds.left >= 0 && bounds.right <= innerWidth && bounds.top >= 0 && bounds.bottom <= innerHeight;
  });
  const text = await page.locator(".leaflet-popup-content").innerText();
  assert.ok(text.includes(target.start) && text.includes(target.end) && text.includes(target.source), `Wrong popup for ${id}: ${text.slice(0, 250)}`);
  assert.equal(await page.locator(".leaflet-popup-content").evaluate(element => element.scrollWidth <= element.clientWidth + 1), true, "Popup text overflows");
  await page.locator(".popup-close-button").click();
  return { id, start: target.start, end: target.end, source: target.source };
}

if (snapshot.displayGeometryReference) {
  await validateParkAndMarathon(baseUrl);
} else {
const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ serviceWorkers: "block", timezoneId: "America/Toronto", viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const errors = [];
  const hosts = new Set();
  page.on("pageerror", error => errors.push(error.message));
  page.on("request", request => hosts.add(new URL(request.url()).host));
  await page.route("https://**/*", route => /^https:\/\/(cdn\.jsdelivr\.net|unpkg\.com)\//.test(route.request().url()) ? route.continue() : route.abort());
  await page.addInitScript(() => {
    const NativeDate = Date;
    const offset = NativeDate.parse("2026-10-05T12:00:00-04:00") - NativeDate.now();
    window.Date = class extends NativeDate {
      constructor(...values) { super(...(values.length ? values : [NativeDate.now() + offset])); }
      static now() { return NativeDate.now() + offset; }
    };
    localStorage.setItem("mapClickHintSeen", "1");
  });
  await page.goto(`${baseUrl}/fr/`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => typeof allClosures !== "undefined" && allClosures.some(record => record.sourceKind === "marathon-beneva-article") && document.querySelector("#mapStatus")?.dataset.mode === "ready", null, { polling: 100, timeout: 90000 });
  const report = await page.evaluate(raw => {
    const check = (condition, message) => { if (!condition) throw new Error(message); };
    const original = JSON.stringify(raw);
    const normalized = normalizeMarathonBenevaSnapshot(raw);
    check(JSON.stringify(raw) === original, "Normalizer changed source records");
    const segments = new Map(raw.segments.objects.map(segment => [segment.id, segment]));
    const nodes = new Map(raw.nodes.objects.map(node => [node.id, node]));
    for (const source of raw.roadClosures.objects) {
      const record = normalized.find(entry => entry.sourceRecordId === source.id);
      const expected = source.forward ? source.geometry.coordinates : [...source.geometry.coordinates].reverse();
      check(JSON.stringify(record.geometry.coordinates) === JSON.stringify(expected), `Geometry changed: ${source.id}`);
      check(record.sourceStartDateTime === `${record.startDate} ${record.startTime}` && record.sourceEndDateTime === `${record.endDate} ${record.endTime}`, "Published hours lost");
      const segment = segments.get(source.segID);
      const expectedFrom = nodes.get(segment.fromNodeID).geometry.coordinates;
      check(source.geometry.coordinates[0].every((coordinate, index) => Math.abs(coordinate - expectedFrom[index]) < 1e-7), "Reference direction not verified");
      check(record.category === "event" && record.severity === "critical" && record.automobileImpact === true, "Wrong impact classification");
    }
    const malformed = [
      data => { data.roadClosures.objects.push(data.roadClosures.objects[0]); },
      data => { data.roadClosures.objects[0].segID = -1; },
      data => { data.roadClosures.objects[0].startDate = "2026-02-30 08:45"; },
      data => { data.roadClosures.objects[0].geometry.coordinates[0][0] = 999; },
      data => { data.roadClosures.objects[0].forward = "true"; }
    ];
    for (const damage of malformed) {
      const data = structuredClone(raw);
      damage(data);
      let rejected = false;
      try { normalizeMarathonBenevaSnapshot(data); } catch { rejected = true; }
      check(rejected, "Invalid source accepted");
    }
    const wazeIds = new Set(normalized.map(record => record.id));
    const loaded = allClosures.filter(record => wazeIds.has(record.id));
    check(loaded.length === raw.roadClosures.objects.length, "Not all closures loaded");
    check(new Set(loaded.map(record => record.id)).size === loaded.length, "Duplicate closures");
    check(loaded.every(record => record.geometry.type === "LineString"), "Line reduced to a point");
    const sources = [...new Map(loaded.map(record => {
      const original = record.originalPublishedSchedule || record;
      return [original.source, original.sourceUrl];
    })).entries()];
    check(sources.length === 1, "Unexpected provenance");
    check(window.SOURCE_CATALOG.some(source => source.name === sources[0][0] && source.url === sources[0][1] && source.inMap === true), "Loaded source absent from catalog");
    const pdfIds = new Set(raw.officialClosureReference.records.filter(record => record.kind === "road").map(record => record.id));
    const pdf = allClosures.filter(record => pdfIds.has(record.id));
    check(pdf.length === raw.officialClosureReference.records.filter(record => record.kind === "road").length, "PDF road closures not loaded");
    check(pdf.every(record => record.suppressDirectionArrows && record.automobileImpact), "Race direction used as traffic direction");
    check(window.SOURCE_CATALOG.some(source => source.name === raw.officialClosureReference.source && source.url === raw.officialClosureReference.sourceUrl && source.inMap), "PDF source missing from active catalog");
    for (const source of [raw.articleScheduleReference, raw.officialAccessNotices.records[0]]) {
      check(window.SOURCE_CATALOG.some(entry => entry.name === source.source && entry.url === source.sourceUrl && entry.inMap), "Supplement source missing from active catalog");
    }
    const unchangedGeometry = new Map([...normalized, ...normalizeMarathonPdfClosures(raw)].map(record => [record.id, record.geometry]));
    for (const adjustment of raw.articleScheduleReference.adjustments) for (const id of adjustment.targetIds) {
      const record = allClosures.find(record => record.id === id);
      check(record && record.startTime === adjustment.startTime && record.endTime === adjustment.endTime, `Article hours not applied: ${id}`);
      check(record.sourceKind === "marathon-beneva-article" && record.originalPublishedSchedule, "Article provenance lost");
      check(JSON.stringify(record.geometry) === JSON.stringify(unchangedGeometry.get(id)), "Article adjustment moved an existing geometry");
    }
    const supplements = normalizeMarathonSupplement(raw);
    check(supplements.every(record => allClosures.some(loaded => loaded.id === record.id)), "New geometry not loaded");
    const parking = allClosures.filter(record => record.sourceKind.startsWith("marathon-beneva-") && record.severity === "parking");
    check(parking.length === 81, "Parking restrictions missing");
    check(parking.filter(record => record.endDate === "2026-10-10").every(record => record.startTime === "00:00" && record.endTime === "12:00"), "Saturday article parking hours lost");
    const concorde = allClosures.find(record => record.id === "marathon-pdf-2026-10-11-5f22071439e4");
    check(concorde.endTime === "15:25" && concorde.originalPublishedSchedule.endTime === "11:15" && concorde.scheduleText.includes("Casino"), "Concorde schedule or exception lost");
    check(raw.officialClosureReference.records.filter(record => record.kind === "path").every(record => !allClosures.some(closure => closure.id === record.id)), "Park path leaked onto driving map");
    const damagedPdf = structuredClone(raw);
    damagedPdf.officialClosureReference.records.find(record => record.kind === "road").startTime = "07:01";
    let rejectedPdf = false;
    try { normalizeMarathonPdfClosures(damagedPdf); } catch { rejectedPdf = true; }
    check(rejectedPdf, "Closure hour not in the PDF accepted");
    dateStart.value = "2026-10-10";
    dateEnd.value = "2026-10-10";
    dateEndUsesOpenDefault = false;
    updateView({ fit: false });
    const visible = getFilteredClosures().filter(record => wazeIds.has(record.id));
    check(visible.length === loaded.length, `October 10 coverage lost: ${JSON.stringify({ loaded: loaded.length, visible: visible.length, categories: [...getActiveCategories()], impacts: [...getActiveImpacts()], periods: [...getActiveTimePeriods()], range: getDateRange(), dateMatches: loaded.filter(record => overlapsDateRange(record, getDateRange())).length, periodMatches: loaded.filter(record => matchesTimePeriod(record, getActiveTimePeriods())).length, now: new Date().toISOString() })}`);
    dateStart.value = "2026-10-11";
    dateEnd.value = "2026-10-11";
    updateView({ fit: false });
    check(getFilteredClosures().every(record => !wazeIds.has(record.id)), "Invented Sunday closure");
    const sunday = getFilteredClosures().filter(record => pdfIds.has(record.id));
    check(sunday.length > 0 && sunday.length === pdf.filter(record => record.startDate === "2026-10-11").length, "Sunday PDF coverage missing");
    dateStart.value = "2026-10-10";
    dateEnd.value = "2026-10-10";
    updateView({ fit: false });
    const sundayParking = parking.find(record => record.startTime === "22:00");
    check(!matchesTimePeriod(sundayParking, new Set(["day"])) && matchesTimePeriod(sundayParking, new Set(["night"])), "Saturday 22:00 parking appeared in day filter");
    dateStart.value = "2026-10-11"; dateEnd.value = "2026-10-11";
    check(matchesTimePeriod(sundayParking, new Set(["day"])) && matchesTimePeriod(sundayParking, new Set(["night"])), "Sunday parking period missing");
    dateStart.value = "2026-10-12"; dateEnd.value = "2026-10-12";
    check(!matchesTimePeriod(sundayParking, new Set(["day", "night"])), "Parking leaked after the event");
    dateStart.value = "2026-10-10"; dateEnd.value = "2026-10-10";
    updateView({ fit: false });
    return { count: loaded.length, pdfCount: pdf.length, sundayCount: sunday.length, parkingCount: parking.length, supplementCount: supplements.length,
      adjustedTargets: raw.articleScheduleReference.adjustments.reduce((count, adjustment) => count + adjustment.targetIds.length, 0),
      pdfSampleId: sunday.find(record => record.streets === "rue Notre-Dame Est").id, sources, sampleIds: [loaded.find(record => record.sourceDirection.forward).id, loaded.find(record => !record.sourceDirection.forward).id] };
  }, snapshot);
  const actualClicks = [];
  for (const id of report.sampleIds) {
    actualClicks.push(await clickRecord(page, id));
  }
  for (const id of ["marathon-article-geobase-2026-10-10-viau", "marathon-article-geobase-2026-10-11-notre-dame", "marathon-parking-2026-10-10-10k-marathon-article-geobase-2026-10-10-viau", "marathon-parc-jean-drapeau-3269"]) {
    actualClicks.push(await clickRecord(page, id));
  }
  await page.evaluate(() => { searchFilter.value = ""; });
  await page.locator("#languageToggle").click();
  await page.waitForFunction(() => document.documentElement.lang === "en", null, { polling: 100 });
  assert.equal(await page.evaluate(() => allClosures.filter(record => record.sourceKind === "marathon-beneva-waze").every(record => record.impact.startsWith("Road segment closed"))), true);
  const pdfPopup = await page.evaluate(id => {
    dateStart.value = "2026-10-11";
    dateEnd.value = "2026-10-11";
    const record = allClosures.find(entry => entry.id === id);
    map.stop();
    map.setView([record.point[1], record.point[0]], 17, { animate: false });
    updateView({ fit: false });
    const layers = renderedClosureLayers.get(id);
    layers.closures.getLayers().find(layer => layer.listens("click")).fire("click", { latlng: L.latLng(record.point[1], record.point[0]) });
    return { text: document.querySelector(".leaflet-popup-content").innerText, arrows: layers.arrows.getLayers().length, start: record.startTime, end: record.endTime };
  }, report.pdfSampleId);
  assert.ok(pdfPopup.text.includes(pdfPopup.start) && pdfPopup.text.includes(pdfPopup.end));
  assert.match(pdfPopup.text, /Street closed|official leaflet/);
  assert.equal(pdfPopup.arrows, 0);
  await page.locator(".popup-close-button").click();
  await page.evaluate(() => { dateStart.value = "2026-10-10"; dateEnd.value = "2026-10-10"; updateView({ fit: false }); });
  await page.evaluate(() => {
    window.marathonMobileReady = new Promise(resolve => compactLayoutQuery.addEventListener("change", () => requestAnimationFrame(resolve), { once: true }));
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.marathonMobileReady);
  await page.evaluate(id => {
    const record = allClosures.find(entry => entry.id === id);
    openGroupedPopup(record, L.latLng(record.point[1], record.point[0]));
  }, report.sampleIds[0]);
  await page.waitForFunction(() => {
    const element = document.querySelector(".leaflet-popup-content");
    if (!element) return false;
    const bounds = element.getBoundingClientRect();
    return bounds.left >= 0 && bounds.right <= innerWidth && bounds.top >= 0 && bounds.bottom <= innerHeight;
  }, null, { polling: 100 });
  assert.doesNotMatch(await page.locator(".leaflet-popup-content").innerText(), /marathon\.(?:impact|direction|scope|geometry)/);
  await page.locator(".popup-close-button").click();
  for (const id of ["marathon-article-geobase-2026-10-10-viau", "marathon-parking-2026-10-10-10k-marathon-article-geobase-2026-10-10-viau", "marathon-parc-jean-drapeau-3269"]) {
    actualClicks.push(await clickRecord(page, id));
  }
  assert.deepEqual(errors, []);
  const pedestrianSnapshot = JSON.parse(readFileSync("data/pedestrian-closures-snapshot.json", "utf8"));
  const pedestrianRecords = pedestrianSnapshot.records.filter(record => record.sourceKey === "marathon-pdf");
  assert.equal(pedestrianRecords.length, 3);
  assert.ok(pedestrianRecords.every(record => record.automobileImpact === false && record.startTime && record.endTime));
  await page.goto(`${baseUrl}/fr/pedestrian.html`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => typeof allClosures !== "undefined" && allClosures.filter(record => record.sourceKind === "pedestrian-marathon-pdf").length === 3, null, { polling: 100 });
  const pathTarget = await page.evaluate(() => {
    dateStart.value = "2026-10-10";
    dateEnd.value = "2026-10-10";
    dateEndUsesOpenDefault = false;
    const record = allClosures.find(entry => entry.sourceKind === "pedestrian-marathon-pdf" && entry.startTime === "07:30");
    map.stop();
    map.setView([record.point[1], record.point[0]], 18, { animate: false });
    updateView({ fit: false });
    const layer = renderedClosureLayers.get(record.id)?.closures.getLayers().find(layer => layer.listens("click"));
    if (!layer) throw new Error("Garden course path not drawn");
    const point = map.latLngToContainerPoint([record.point[1], record.point[0]]);
    const bounds = map.getContainer().getBoundingClientRect();
    return { id: record.id, x: bounds.left + point.x, y: bounds.top + point.y, start: record.startTime, end: record.endTime, sourceCount: allClosures.filter(entry => entry.sourceKind === "pedestrian-marathon-pdf").length, hasRoad: allClosures.some(entry => entry.sourceKind === "marathon-beneva-pdf") };
  });
  await page.waitForFunction(({ x, y }) => {
    const canvas = fastRenderer._container;
    const bounds = canvas.getBoundingClientRect();
    const pixels = canvas.getContext("2d").getImageData(Math.round((x - bounds.left) * canvas.width / bounds.width) - 2, Math.round((y - bounds.top) * canvas.height / bounds.height) - 2, 5, 5).data;
    return Array.from({ length: pixels.length / 4 }, (_, index) => index * 4).some(index => pixels[index] > 200 && pixels[index + 1] < 90 && pixels[index + 3] > 100);
  }, pathTarget, { polling: 100 });
  await page.mouse.click(pathTarget.x, pathTarget.y);
  await page.locator(".leaflet-popup-content").waitFor();
  const pathPopup = { ...pathTarget, text: await page.locator(".leaflet-popup-content").innerText() };
  assert.equal(pathPopup.hasRoad, false);
  assert.ok(pathPopup.text.includes(pathPopup.start) && pathPopup.text.includes(pathPopup.end));
  assert.match(pathPopup.text, /RTRT/);
  assert.doesNotMatch(pathPopup.text, /marathon\./);
  await page.waitForFunction(() => {
    const bounds = document.querySelector(".leaflet-popup-content")?.getBoundingClientRect();
    return bounds && bounds.left >= 0 && bounds.right <= innerWidth && bounds.top >= 0 && bounds.bottom <= innerHeight;
  }, null, { polling: 100 });
  await page.locator(".popup-close-button").click();
  await page.locator("#menuToggle").click();
  await page.locator("#languageToggle").click();
  assert.equal(await page.evaluate(() => allClosures.filter(record => record.sourceKind === "pedestrian-marathon-pdf").every(record => record.impact === t("marathon.pathImpact") && record.geometryNote === t("marathon.pdfGeometry"))), true);
  if (await page.locator("#menuToggle").getAttribute("aria-expanded") === "true") await page.locator("#menuToggle").click();
  const accessId = "pedestrian-marathon-parc-jean-drapeau-3269";
  assert.equal(await page.evaluate(id => {
    const record = allClosures.find(record => record.id === id);
    return record && record.pedestrianArea === "park" && record.severity === "critical" && record.automobileImpact === false && record.geometry.coordinates.length === 4;
  }, accessId), true);
  actualClicks.push(await clickRecord(page, accessId));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.waitForFunction(() => !compactLayoutQuery.matches);
  actualClicks.push(await clickRecord(page, accessId));
  assert.deepEqual(errors, []);
  await context.close();
  const failureContext = await browser.newContext({ serviceWorkers: "block" });
  const failedPage = await failureContext.newPage();
  await failedPage.route("https://**/*", route => /^https:\/\/(cdn\.jsdelivr\.net|unpkg\.com)\//.test(route.request().url()) ? route.continue() : route.abort());
  await failedPage.route("**/data/Marathon-Beneva-Mtl-2026.json", route => route.abort());
  await failedPage.goto(`${baseUrl}/fr/`, { waitUntil: "domcontentloaded" });
  await failedPage.waitForFunction(() => typeof marathonSnapshotFailed !== "undefined" && marathonSnapshotFailed && typeof allClosures !== "undefined" && allClosures.some(record => record.sourceKind === "uci-wfs") && document.querySelector("#mapStatus").textContent.includes("marathon"), null, { polling: 100, timeout: 30000 });
  assert.equal(await failedPage.evaluate(() => allClosures.some(record => record.sourceKind === "marathon-beneva-waze")), false);
  await failureContext.close();
  assert.equal(fingerprint(), originalHash, "Original snapshot changed during validation");
  console.log(JSON.stringify({ ...report, actualClicks, hostsObserved: [...hosts].sort(), sourceFileSha256: originalHash, checks: "source integrity, geometry direction, article hours, parking, pedestrian access, invalid input, dates, catalog, actual clicks, FR/EN, mobile and isolated source failure passed" }, null, 2));
} finally {
  await browser.close();
}
}