import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { chromium } from "playwright";

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
const baseUrl = process.env.MARATHON_VALIDATION_URL || "http://localhost:5000";
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
  await page.waitForFunction(() => typeof allClosures !== "undefined" && allClosures.some(record => record.sourceKind === "marathon-beneva-waze"), null, { polling: 100 });
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
    const loaded = allClosures.filter(record => record.sourceKind === "marathon-beneva-waze");
    check(loaded.length === raw.roadClosures.objects.length, "Not all closures loaded");
    check(new Set(loaded.map(record => record.id)).size === loaded.length, "Duplicate closures");
    check(loaded.every(record => record.geometry.type === "LineString"), "Line reduced to a point");
    const sources = [...new Map(loaded.map(record => [record.source, record.sourceUrl])).entries()];
    check(sources.length === 1, "Unexpected provenance");
    check(window.SOURCE_CATALOG.some(source => source.name === sources[0][0] && source.url === sources[0][1] && source.inMap === true), "Loaded source absent from catalog");
    const pdf = allClosures.filter(record => record.sourceKind === "marathon-beneva-pdf");
    check(pdf.length === raw.officialClosureReference.records.filter(record => record.kind === "road").length, "PDF road closures not loaded");
    check(pdf.every(record => record.suppressDirectionArrows && record.automobileImpact), "Race direction used as traffic direction");
    check(window.SOURCE_CATALOG.some(source => source.name === pdf[0].source && source.url === pdf[0].sourceUrl && source.inMap), "PDF source missing from active catalog");
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
    const visible = getFilteredClosures().filter(record => record.sourceKind === "marathon-beneva-waze");
    check(visible.length === loaded.length, `October 10 coverage lost: ${JSON.stringify({ loaded: loaded.length, visible: visible.length, categories: [...getActiveCategories()], impacts: [...getActiveImpacts()], periods: [...getActiveTimePeriods()], range: getDateRange(), dateMatches: loaded.filter(record => overlapsDateRange(record, getDateRange())).length, periodMatches: loaded.filter(record => matchesTimePeriod(record, getActiveTimePeriods())).length, now: new Date().toISOString() })}`);
    dateStart.value = "2026-10-11";
    dateEnd.value = "2026-10-11";
    updateView({ fit: false });
    check(getFilteredClosures().every(record => record.sourceKind !== "marathon-beneva-waze"), "Invented Sunday closure");
    const sunday = getFilteredClosures().filter(record => record.sourceKind === "marathon-beneva-pdf");
    check(sunday.length > 0 && sunday.length === pdf.filter(record => record.startDate === "2026-10-11").length, "Sunday PDF coverage missing");
    dateStart.value = "2026-10-10";
    dateEnd.value = "2026-10-10";
    updateView({ fit: false });
    return { count: loaded.length, pdfCount: pdf.length, sundayCount: sunday.length, pdfSampleId: sunday.find(record => record.streets === "rue Notre-Dame Est").id, sources, sampleIds: [loaded.find(record => record.sourceDirection.forward).id, loaded.find(record => !record.sourceDirection.forward).id] };
  }, snapshot);
  for (const id of report.sampleIds) {
    const details = await page.evaluate(selectedId => {
      const record = allClosures.find(entry => entry.id === selectedId);
      map.stop();
      map.setView([record.point[1], record.point[0]], 18, { animate: false });
      updateView({ fit: false });
      const layer = renderedClosureLayers.get(selectedId)?.closures.getLayers()[0];
      if (!layer) throw new Error("Marathon line not rendered");
      layer.fire("click", { latlng: L.latLng(record.point[1], record.point[0]) });
      return { text: document.querySelector(".leaflet-popup-content")?.innerText, start: record.startTime, end: record.endTime, street: record.streets };
    }, id);
    assert.ok(details.text.includes(details.start) && details.text.includes(details.end) && details.text.includes(details.street));
    assert.match(details.text, /Waze/);
    assert.match(details.text, /communautaire/);
    await page.locator(".popup-close-button").click();
  }
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
    layers.closures.getLayers()[0].fire("click", { latlng: L.latLng(record.point[1], record.point[0]) });
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
    const layer = renderedClosureLayers.get(record.id)?.closures.getLayers()[0];
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
  console.log(JSON.stringify({ ...report, hostsObserved: [...hosts].sort(), sourceFileSha256: originalHash, checks: "source integrity, geometry direction, hours, invalid input, dates, catalog, vector popups, FR/EN, mobile and isolated source failure passed" }, null, 2));
} finally {
  await browser.close();
}