import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import vm from "node:vm";
import { chromium } from "playwright";
import { validateSnapshot, verifyReview, verifyReviewedBindings, mtmdFingerprint, pjcciFingerprint } from "./build-mobilite-montreal-snapshot.mjs";

const snapshot = JSON.parse(await readFile(new URL("../data/mobilite-montreal-snapshot.json", import.meta.url), "utf8"));
const pjcciPath = new URL("../data/pjcci-work-advisories-snapshot.json", import.meta.url);
const pjcciBytes = await readFile(pjcciPath);
const pjcci = JSON.parse(pjcciBytes);
const app = await readFile(new URL("../js/app.js", import.meta.url), "utf8");
const recordById = new Map(snapshot.records.map((record) => [record.id, record]));
const now = Date.parse("2026-10-16T12:00:00-04:00");
const nativeFeatures = snapshot.duplicateBindings.filter((binding) => binding.sourceKind === "quebec511-mtmd-wfs").map((binding) => {
  const [id, routeAutoroute, localisation, direction, debut, fin, entrave, geometry] = JSON.parse(binding.fingerprint);
  return { type: "Feature", id, geometry, properties: { identifiant: id, routeAutoroute, localisation, direction, debut, fin, entrave } };
});

function unitChecks() {
  validateSnapshot(snapshot);
  assert.equal(snapshot.coverage.notices, 13);
  assert.equal(snapshot.coverage.images, 6);
  assert.equal(snapshot.coverage.roadImpacts, 29);
  assert.equal(snapshot.coverage.mappedImpacts, 24);
  assert.equal(snapshot.coverage.unmappedRecordIds.length, 5);
  assert.equal(snapshot.duplicateBindings.length, 21);
  for (const id of ["mercier-contresens", "bonaventure-est-voie", "champlain-nord-voie-gauche", "victoria-configuration"]) assert.equal(recordById.get(id).severity, "major");
  assert.equal(recordById.get("ile-charron-acces-canalise").severity, "moderate");
  assert.ok(snapshot.excluded.some((entry) => entry.noticeId === "section-9"));
  for (const id of snapshot.coverage.unmappedRecordIds) assert.equal(recordById.get(id).geometry, null);
  for (const feature of nativeFeatures) {
    const binding = snapshot.duplicateBindings.find((binding) => binding.sourceId === `q511-${feature.id}`);
    assert.equal(mtmdFingerprint(feature), binding.fingerprint);
    assert.deepEqual(recordById.get(binding.recordId).geometry, feature.geometry);
  }
  for (const binding of snapshot.duplicateBindings.filter((binding) => binding.sourceKind === "pjcci")) {
    const notice = pjcci.notices.find((notice) => `pjcci-${notice.url}-${notice.segmentId}` === binding.sourceId);
    assert.equal(pjcciFingerprint(notice), binding.fingerprint);
    assert.equal(binding.preferExisting, true);
  }
  assert.equal(recordById.get("a25-sud-tunnel").activeIntervals[0], "2026-10-16T23:00:00-04:00/2026-10-17T08:00:00-04:00");
  assert.equal(recordById.get("souligny-est").activeIntervals[0], "2026-10-16T22:30:00-04:00/2026-10-17T08:00:00-04:00");
  const south = recordById.get("a13-sud-nuits");
  const north = recordById.get("a13-nord-nuits");
  assert.ok(south.activeIntervals.includes("2026-10-16T22:30:00-04:00/2026-10-17T07:00:00-04:00"));
  assert.ok(north.activeIntervals.includes("2026-10-16T23:00:00-04:00/2026-10-17T07:00:00-04:00"));
  const timeChange = south.activeIntervals.find((interval) => interval.startsWith("2026-10-31"));
  const [start, end] = timeChange.split("/").map(Date.parse);
  assert.equal((end - start) / 3600000, 9);
  assert.ok(south.activeIntervals.every((interval) => Date.parse(interval.split("/")[1]) <= Date.parse("2026-11-02T05:00:00-05:00")));
  const evidence = { contentSha256: snapshot.bulletin.contentSha256, sections: snapshot.notices, images: snapshot.images, supplements: snapshot.supplements };
  verifyReview(snapshot, evidence);
  assert.throws(() => verifyReview(snapshot, { ...evidence, contentSha256: "changed" }), /Bulletin changed/);
  verifyReviewedBindings(snapshot, snapshot.duplicateBindings);
  const changedBindings = structuredClone(snapshot.duplicateBindings);
  changedBindings[0].fingerprint = "updated-source";
  assert.throws(() => verifyReviewedBindings(snapshot, changedBindings), /Compared source changed/);
  const changedImages = structuredClone(evidence);
  changedImages.images[0].sha256 = "0".repeat(64);
  assert.throws(() => verifyReview(snapshot, changedImages), /Image changed/);
  const badImpact = structuredClone(snapshot);
  badImpact.records.find((record) => record.id === "bonaventure-est-voie").severity = "critical";
  assert.throws(() => validateSnapshot(badImpact));
  const catalogContext = { window: {} };
  vm.runInNewContext(awaitedCatalog, catalogContext);
  const catalogEntries = catalogContext.window.SOURCE_CATALOG.filter((source) => [snapshot.sourceUrl, "data/mobilite-montreal-snapshot.json"].includes(source.url));
  assert.equal(catalogEntries.length, 3);
  assert.ok(catalogEntries.every((source) => source.extractedAt === snapshot.extractedAt));

  class FixedDate extends Date {
    constructor(...arguments_) { super(...(arguments_.length ? arguments_ : [now])); }
    static now() { return now; }
  }
  const owner = { ...recordById.get("a25-sud-tunnel"), id: "mobilite-owner", mobiliteRecordId: "a25-sud-tunnel" };
  const binding = snapshot.duplicateBindings.find((entry) => entry.recordId === owner.mobiliteRecordId);
  const source = { id: binding.sourceId, mobiliteSourceFingerprint: binding.fingerprint, geometry: owner.geometry };
  const range = { start: new Date("2026-10-16T00:00:00Z"), end: new Date("2026-10-16T00:00:00Z") };
  const context = vm.createContext({ Date: FixedDate, mobiliteSnapshot: snapshot,
    mobiliteDuplicateBindings: new Map([[binding.sourceId, binding]]), mobiliteOwnersCache: { source: null, length: -1 },
    allClosures: [owner, source], statsViewActive: false, statsAllDates: false,
    formatInputDate: (date) => date.toISOString().slice(0, 10), getDateRange: () => range,
    getActiveTimePeriods: () => new Set(["day"]), hasExpiredToday: (record) => Date.parse(record.activeIntervals.at(-1).split("/")[1]) <= now });
  vm.runInContext(app.slice(app.indexOf("function mobiliteScheduleOverlaps("), app.indexOf("function normalizeMobiliteClosures(")), context);
  assert.equal(context.mobiliteScheduleOverlaps(owner, range, new Set(["day"])), false);
  assert.equal(context.isCoveredByMobiliteClosure(source), true, "A coarse native period must not bypass the reviewed night-only interval");
  console.log("Unit checks: source coverage, impacts, geometries, image guards, DST and duplicate timing passed");
}

const awaitedCatalog = await readFile(new URL("../data/sources.js", import.meta.url), "utf8");
unitChecks();

async function prepareContext(browser) {
  const context = await browser.newContext({ serviceWorkers: "block", timezoneId: "America/Toronto" });
  await context.addInitScript(() => localStorage.setItem("mapClickHintSeen", "1"));
  await context.route("https://**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.hostname === "ws.mapserver.transports.gouv.qc.ca" && url.searchParams.get("typename") === "ms:chantiers_mtmdet") {
      await route.fulfill({ contentType: "application/json", body: JSON.stringify({ type: "FeatureCollection", features: nativeFeatures }) });
    } else if (["cdn.jsdelivr.net", "unpkg.com"].includes(url.hostname)) {
      await route.continue();
    } else {
      await route.abort();
    }
  });
  return context;
}

async function selectRange(page, date, end = date, period = "both") {
  await page.evaluate(({ date, end, period }) => {
    dateStart.value = date;
    dateEnd.value = end;
    dateEndUsesOpenDefault = false;
    categoryFilters.forEach((input) => { input.checked = true; });
    impactFilters.forEach((input) => { input.checked = true; });
    timeFilters.forEach((input) => { input.checked = period === "both" || input.value === period; });
    searchFilter.value = "";
    updateView({ fit: false });
  }, { date, end, period });
}

async function clickClosure(page, id, screenshotPath = null) {
  const record = await page.evaluate((id) => allClosures.find((record) => record.id === id), id);
  assert.ok(record, `Missing ${id}`);
  const lines = record.geometry.type === "LineString" ? [record.geometry.coordinates] : record.geometry.coordinates;
  const line = lines.reduce((longest, candidate) => candidate.length > longest.length ? candidate : longest);
  const middle = Math.max(1, Math.floor(line.length / 2));
  const point = line[middle].map((value, axis) => (value + line[middle - 1][axis]) / 2);
  await selectRange(page, record.startDate || snapshot.bulletin.startDate, record.endDate || snapshot.bulletin.endDate);
  await page.evaluate(({ title, point }) => {
    searchFilter.value = title;
    locationHasCentered = true;
    map.stop();
    map.setView([point[1], point[0]], 16, { animate: false });
    updateView({ fit: false });
  }, { title: record.title, point });
  if (await page.locator("#menuToggle").isVisible() && await page.evaluate(() => compactLayoutQuery.matches && menuToggle.classList.contains("is-open"))) await page.locator("#menuToggle").click();
  await page.waitForFunction((id) => renderedClosureLayers.has(id), id);
  await page.waitForFunction((point) => {
    const target = map.latLngToContainerPoint([point[1], point[0]]);
    const mapBounds = map.getContainer().getBoundingClientRect();
    const canvas = fastRenderer._container;
    const bounds = canvas.getBoundingClientRect();
    const pixelX = Math.round((mapBounds.left + target.x - bounds.left) * canvas.width / bounds.width);
    const pixelY = Math.round((mapBounds.top + target.y - bounds.top) * canvas.height / bounds.height);
    return canvas.getContext("2d").getImageData(pixelX, pixelY, 1, 1).data[3] > 0;
  }, point);
  const target = await page.evaluate((point) => {
    const target = map.latLngToContainerPoint([point[1], point[0]]);
    const bounds = map.getContainer().getBoundingClientRect();
    return { x: bounds.left + target.x, y: bounds.top + target.y };
  }, point);
  await page.mouse.click(target.x, target.y);
  await page.locator(".leaflet-popup-content").waitFor();
  const text = await page.locator(".leaflet-popup-content").innerText();
  assert.ok(text.includes(record.title) && text.includes(record.startTime) && text.includes(record.endTime), `Wrong popup ${id}`);
  assert.doesNotMatch(text, /mobilite\.(?:impact|analysis|otherSources)/);
  try {
    await page.waitForFunction(() => {
      const element = document.querySelector(".leaflet-popup-content");
      const bounds = element.getBoundingClientRect();
      return bounds.left >= 0 && bounds.right <= innerWidth + 1 && element.scrollWidth <= element.clientWidth + 1;
    }, null, { timeout: 10000 });
  } catch (error) {
    const layout = await page.evaluate(() => {
      const element = document.querySelector(".leaflet-popup-content");
      return { language: document.documentElement.lang, width: innerWidth, height: innerHeight,
        bounds: element.getBoundingClientRect().toJSON(), scrollWidth: element.scrollWidth, clientWidth: element.clientWidth,
        text: element.innerText };
    });
    await page.screenshot({ path: join(tmpdir(), "mobilite-popup-layout.png") });
    throw new Error(`Popup layout ${id}: ${JSON.stringify(layout)}`, { cause: error });
  }
  if (screenshotPath) await page.screenshot({ path: screenshotPath });
  await page.locator(".popup-close-button").click();
  return { id, popupVerified: true };
}

async function browserChecks() {
  const baseUrl = process.env.MOBILITE_VALIDATION_URL || "http://127.0.0.1:5500";
  const browser = await chromium.launch({ headless: true });
  const results = [];
  const errors = [];
  try {
    for (const language of ["fr", "en"]) for (const width of [1440, 390]) {
      const context = await prepareContext(browser);
      const page = await context.newPage();
      await page.clock.install({ time: new Date(now) });
      page.on("pageerror", (error) => errors.push(error.message));
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
      await page.goto(`${baseUrl}/${language}/`, { waitUntil: "domcontentloaded" });
      await page.waitForFunction((count) => typeof allClosures !== "undefined" && allClosures.filter((record) => record.mobiliteRecordId).length === 24
        && allClosures.filter((record) => record.sourceKind === "quebec511-mtmd-wfs").length === count, nativeFeatures.length, { timeout: 45000 });
      await selectRange(page, "2026-10-16", "2026-10-19");
      const ownership = await page.evaluate(() => {
        const visible = new Set(getFilteredClosures().map((record) => record.id));
        return {
          bindings: mobiliteSnapshot.duplicateBindings.map((binding) => ({ kind: binding.sourceKind, visible: visible.has(binding.sourceId), preferred: binding.preferExisting === true })),
          aggregate: [...visible].some((id) => id.endsWith("-mercier-contresens") && id.startsWith("mobilite-montreal-")),
          distinct: allClosures.filter((record) => /honore-mercier-voie-gauche-montreal-indeterminee|pont-clement-vers-centre-ville/.test(record.id)).map((record) => ({ id: record.id, visible: visible.has(record.id) })),
          mapped: getFilteredClosures().filter((record) => record.mobiliteRecordId).length
        };
      });
      assert.ok(ownership.bindings.every((binding) => binding.visible === binding.preferred));
      assert.equal(ownership.aggregate, false);
      assert.equal(ownership.mapped, 22);
      assert.equal(await page.evaluate(() => getFilteredClosures().some((record) => record.id === "q511-165565")), true);
      assert.equal(await page.evaluate(() => closureImpactLabel(allClosures.find((record) => record.id === "q511-165565"))), language === "fr" ? "Bretelle / accès fermé" : "Ramp / access closed");
      assert.ok(ownership.distinct.length >= 2 && ownership.distinct.every((entry) => entry.visible));
      await selectRange(page, "2026-10-16", "2026-10-16", "day");
      assert.equal(await page.evaluate(() => getFilteredClosures().some((record) => record.id === "q511-164618" || record.mobiliteRecordId === "a25-sud-tunnel")), false);
      await selectRange(page, "2026-10-19", "2026-10-19", "day");
      assert.equal(await page.evaluate(() => getFilteredClosures().some((record) => record.mobiliteRecordId?.startsWith("a13-"))), false);
      await selectRange(page, "2026-11-12");
      assert.equal(await page.evaluate(() => getFilteredClosures().some((record) => record.id === "q511-170186")), true);
      await selectRange(page, "2026-10-17");
      const categoryResult = await page.evaluate(() => {
        categoryFilters.forEach((input) => { input.checked = input.value === "q511"; });
        return getFilteredClosures().filter((record) => record.id.includes("honore-mercier-contresens") || record.id.includes("honore-mercier-section-centrale-fermee")).length;
      });
      assert.equal(categoryResult, 3);
      const changedResult = await page.evaluate(() => {
        const binding = mobiliteSnapshot.duplicateBindings.find((binding) => binding.sourceId === "q511-164618");
        const native = allClosures.find((record) => record.id === binding.sourceId);
        return isCoveredByMobiliteClosure({ ...native, mobiliteSourceFingerprint: "updated-source" });
      });
      assert.equal(changedResult, false);
      const screenshot = language === "fr" ? join(tmpdir(), `mobilite-montreal-${width}.png`) : null;
      const clicks = [];
      clicks.push(await clickClosure(page, "mobilite-montreal-2026-10-16-bonaventure-est-voie", screenshot));
      clicks.push(await clickClosure(page, "mobilite-montreal-2026-10-16-laurentides-a15-sud-acces"));
      assert.equal(await page.evaluate(() => closureImpactLabel(allClosures.find((record) => record.mobiliteRecordId === "laurentides-a15-sud-acces"))), language === "fr" ? "Bretelle / accès fermé" : "Ramp / access closed");
      results.push({ language, width, mapped: ownership.mapped, nativeCopiesHidden: 17, pjcciComponentsPreserved: 3, clicks, screenshot });
      await context.close();
    }
    const context = await prepareContext(browser);
    const page = await context.newPage();
    await page.clock.install({ time: new Date(now) });
    await page.route("**/data/mobilite-montreal-snapshot.json", (route) => route.abort());
    await page.goto(`${baseUrl}/fr/`, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => typeof mobiliteSnapshotFailed !== "undefined" && mobiliteSnapshotFailed
      && allClosures.some((record) => record.id === "q511-169669") && allClosures.some((record) => record.sourceKind === "pjcci"), null, { timeout: 45000 });
    await selectRange(page, "2026-10-17");
    assert.equal(await page.evaluate(() => getFilteredClosures().some((record) => record.id === "q511-169669")), true);
    assert.equal(await page.evaluate(() => allClosures.some((record) => record.mobiliteRecordId)), false);
    await context.close();
    assert.deepEqual(errors, []);
    assert.equal(createHash("sha256").update(await readFile(pjcciPath)).digest("hex"), createHash("sha256").update(pjcciBytes).digest("hex"));
    console.log(JSON.stringify({ results, snapshotFailurePreservesOtherSources: true, pjcciSnapshotUnchanged: true, pageErrors: errors }, null, 2));
  } finally {
    await browser.close();
  }
}

if (!process.argv.includes("--unit")) await browserChecks();