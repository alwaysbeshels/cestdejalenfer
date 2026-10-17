import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";

const baseUrl = process.env.PEDESTRIAN_VALIDATION_URL || "http://localhost:5500";
const context = vm.createContext({ window: {} });
vm.runInContext(await readFile("js/pedestrian.js", "utf8"), context);
const parse = context.window.PEDESTRIAN_MAP.publishedPedestrianImpacts;
const comparable = (text) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ");
assert.equal(parse("Trottoir cote nord ferme; Trottoir cote sud ouvert").length, 1);
const sides = parse("Trottoir cote nord ferme; Amenagement temporaire du trottoir cote sud");
assert.equal(sides.length, 2);
assert.equal(sides[0].side.code, "north");
assert.equal(sides[0].severity, "critical");
assert.equal(sides[1].side.code, "south");
assert.equal(sides[1].severity, "moderate");
for (const text of ["Aucune fermeture de trottoir", "Rue fermee pour refection du trottoir", "Rue en deviation pour refection du trottoir", "Trottoir nord ouvert et trottoir sud ferme"]) assert.equal(parse(text).length, 0, text);
assert.equal(parse("Fermeture de trottoir")[0].side.code, "unknown");

const snapshot = JSON.parse(await readFile("data/pedestrian-closures-snapshot.json", "utf8"));
assert.equal(snapshot.schemaVersion, 1);
assert.equal(new Set(snapshot.records.map((record) => record.id)).size, snapshot.records.length);
const sourceVerificationDate = (value) => {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp)
    ? new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto" }).format(new Date(timestamp))
    : null;
};
for (const record of snapshot.records) {
  assert(record.startDate);
  const source = snapshot.sources.find((item) => item.key === record.sourceKey);
  const verifiedOn = sourceVerificationDate(source.checkedAt || source.sourceExtractedAt || record.sourceCheckedAt);
  if (verifiedOn) assert(record.endDate >= verifiedOn || record.openEnded);
  assert(record.geometry && record.sourceUrl && record.evidence && record.side);
  assert(["critical", "moderate"].includes(record.severity));
  assert(snapshot.sources.some((source) => source.key === record.sourceKey));
  if (record.side.code === "unknown") assert.equal(record.side.published, null);
  if (record.sourceKey === "montreal") assert.equal(record.severity, "moderate");
}
const sainteCatherineSource = snapshot.sources.find((source) => source.key === "sainte-catherine");
assert(sainteCatherineSource);
assert.equal(sainteCatherineSource.status, "checked");
assert.equal(sainteCatherineSource.received, 3);
assert.equal(sainteCatherineSource.retained, 1);
assert.equal(sainteCatherineSource.reviewCount, 1);
assert.equal(sainteCatherineSource.excluded, 1);
assert(Number.isFinite(Date.parse(sainteCatherineSource.checkedAt)));
assert.equal(sainteCatherineSource.inventory.length, 3);
assert.equal(sainteCatherineSource.mediaReview.length, 3);
const sourceCatalogContext = vm.createContext({ window: {} });
vm.runInContext(await readFile("data/sources.js", "utf8"), sourceCatalogContext);
const catalogEntry = sourceCatalogContext.window.SOURCE_CATALOG
  .find((source) => source.name === "Ville de Sainte-Catherine - Travaux de trottoirs (snapshot piéton)");
assert(catalogEntry);
assert.equal(catalogEntry.inMap, true);
assert.equal(catalogEntry.inFaq, true);
assert.equal(catalogEntry.dataType, "snapshot");
assert.equal(catalogEntry.extractedAt, sainteCatherineSource.checkedAt);
const sainteCatherineRecord = snapshot.records.find((record) => record.sourceKey === "sainte-catherine");
assert(sainteCatherineRecord);
assert.equal(sainteCatherineRecord.pedestrianArea, "sidewalk");
assert.equal(sainteCatherineRecord.severity, "moderate");
assert.equal(sainteCatherineRecord.startDate, "2026-09-28");
assert.equal(sainteCatherineRecord.endDate, "2026-10-23");
assert.equal(sainteCatherineRecord.streets, "Multiples rues sur le territoire");
assert.deepEqual(sainteCatherineRecord.periods, []);
assert.equal(sainteCatherineRecord.side.code, "unknown");
assert.equal(sainteCatherineRecord.geometry.type, "Point");
assert.deepEqual(sainteCatherineRecord.geometry.coordinates, [-73.5717217, 45.4053171]);
assert(sainteCatherineRecord.evidence.text.includes("Sciage et démolition des bordures et trottoirs"));
assert(sainteCatherineRecord.sourceDescription.includes("Fermeture d'une voie durant les travaux"));
assert(sainteCatherineRecord.details.some((detail) => detail.labelKey === "pedestrian.mapMarkerAddress"
  && detail.value === "5465, boul.Marie-Victorin, Sainte-Catherine"));
const sainteCatherineCyclingReview = snapshot.review.find((item) => item.sourceKey === "sainte-catherine");
assert(sainteCatherineCyclingReview);
assert.equal(sainteCatherineCyclingReview.reason, "cycling-closure-period-and-path-geometry-unresolved");
assert.equal(sainteCatherineCyclingReview.geometry, null);
assert(sainteCatherineCyclingReview.text.includes("Fermeture du tronçon entre le 1700 et le 1760, rue Centrale"));
assert(sainteCatherineSource.exclusions.some((item) => item.reason === "water-main-flushing-with-no-pedestrian-or-cycling-restriction"));
const royal = JSON.parse(await readFile("data/mont-royal-snapshot.json", "utf8"));
assert.equal(snapshot.sources.find((source) => source.key === "mont-royal").sourceExtractedAt, royal.extractedAt);
assert.equal(snapshot.sources.find((source) => source.key === "mont-royal").checkedAt, null);

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  const requests = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => requests.push(request.url()));
  await page.goto(`${baseUrl}/fr/pedestrian.html`);
  await page.waitForFunction((count) => typeof allClosures !== "undefined" && allClosures.length === count, snapshot.records.length);
  assert.equal(requests.filter((url) => /arcgis.*query|wfs-maps|swtq|api\/events/.test(url)).length, 0);
  assert.equal(requests.filter((url) => /ville\.sainte-catherine\.qc\.ca|villeSainteCatherine\/maps\/getMarker/.test(url)).length, 0);
  assert.equal(requests.filter((url) => /snapshot\.json/.test(url)).length, 1);
  const areas = page.locator("details").filter({ has: page.locator(".pedestrian-area-filters") });
  assert.equal(await areas.getAttribute("open"), null);
  assert.equal(await areas.locator("input:checked").count(), 3);
  const uiToday = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto" }).format(new Date());
  const visibleSourceKeys = [...new Set(snapshot.records
    .filter((record) => record.startDate <= uiToday && ((record.endDate && record.endDate >= uiToday) || record.openEnded))
    .map((record) => record.sourceKey))];
  for (const key of visibleSourceKeys) {
    const record = snapshot.records.find((item) => item.sourceKey === key
      && item.startDate <= uiToday && ((item.endDate && item.endDate >= uiToday) || item.openEnded));
    await page.evaluate((record) => {
      document.querySelector("#dateStart").value = record.startDate;
      document.querySelector("#dateEnd").value = record.endDate || record.startDate;
      document.querySelector("#searchFilter").value = record.streets;
      map.setView([record.point[1], record.point[0]], 17, { animate: false });
      updateView({ fit: false });
    }, record);
    await page.locator("#closureList .closure-card[tabindex]").filter({ has: page.locator(`a[href="${record.sourceUrl}"]`) }).first().click();
    await page.locator(".leaflet-popup-content").waitFor();
    const expectedImpact = await page.evaluate((record) => record.impactKey ? t(record.impactKey) : record.impact, record);
    assert(expectedImpact && expectedImpact !== record.impactKey);
    assert(comparable(await page.locator(".leaflet-popup-content").innerText()).includes(comparable(expectedImpact)));
    assert((await page.locator(".leaflet-popup-content").innerText()).includes(record.sourceCheckedAt));
    assert(await page.evaluate((id) => renderedClosureLayers.has(id), record.id));
    console.log(`Popup and geometry: ${key}`);
    await page.locator(".popup-close-button").click();
  }
  const sainteCatherineEndNextDay = new Date(`${sainteCatherineRecord.endDate}T00:00:00Z`);
  sainteCatherineEndNextDay.setUTCDate(sainteCatherineEndNextDay.getUTCDate() + 1);
  const sainteCatherineDayAfter = sainteCatherineEndNextDay.toISOString().slice(0, 10);
  for (const date of [sainteCatherineRecord.startDate, sainteCatherineRecord.endDate]) {
    const included = await page.evaluate(({ record, date }) => {
      dateStart.value = date;
      dateEnd.value = date;
      searchFilter.value = record.streets;
      updateView({ fit: false });
      return getFilteredClosures().some((item) => item.id === record.id);
    }, { record: sainteCatherineRecord, date });
    assert(included, `Sainte-Catherine record should be visible on ${date}`);
  }
  const includedAfterEnd = await page.evaluate(({ record, date }) => {
    dateStart.value = date;
    dateEnd.value = date;
    searchFilter.value = record.streets;
    updateView({ fit: false });
    return getFilteredClosures().some((item) => item.id === record.id);
  }, { record: sainteCatherineRecord, date: sainteCatherineDayAfter });
  assert.equal(includedAfterEnd, false);
  const periodFilterVisibility = await page.evaluate((record) => {
    dateStart.value = record.startDate;
    dateEnd.value = record.endDate;
    searchFilter.value = record.streets;
    const controls = [...document.querySelectorAll(".time-filters input[type='checkbox']")];
    const visibleFor = (selected) => {
      controls.forEach((control) => { control.checked = selected.includes(control.value); });
      updateView({ fit: false });
      return getFilteredClosures().some((item) => item.id === record.id);
    };
    const result = {
      day: visibleFor(["day"]),
      night: visibleFor(["night"]),
      none: visibleFor([])
    };
    controls.forEach((control) => { control.checked = true; });
    updateView({ fit: false });
    return result;
  }, sainteCatherineRecord);
  assert.deepEqual(periodFilterVisibility, { day: true, night: true, none: false });
  const markerPosition = await page.evaluate((record) => {
    dateStart.value = record.startDate;
    dateEnd.value = record.endDate;
    searchFilter.value = record.streets;
    updateView({ fit: false });
    map.setView([record.point[1], record.point[0]], 18, { animate: false });
    const pixel = map.latLngToContainerPoint([record.point[1], record.point[0]]);
    const bounds = map.getContainer().getBoundingClientRect();
    return {
      x: bounds.left + pixel.x,
      y: bounds.top + pixel.y,
      color: allClosures.find((item) => item.id === record.id).color
    };
  }, sainteCatherineRecord);
  assert.equal(markerPosition.color.toLowerCase(), "#ff8c00");
  await page.mouse.click(markerPosition.x, markerPosition.y);
  await page.locator(".leaflet-popup-content").waitFor();
  const sainteCatherinePopup = await page.locator(".leaflet-popup-content").innerText();
  assert(sainteCatherinePopup.includes(sainteCatherineRecord.title));
  assert(sainteCatherinePopup.includes(sainteCatherineRecord.sourceCheckedAt));
  assert(sainteCatherinePopup.includes("Point de localisation officiel"));
  assert(sainteCatherinePopup.includes("Adresse associée au repère municipal"));
  assert(sainteCatherinePopup.includes("Horaire non publié"));
  await page.locator("#languageToggle").click();
  await page.waitForURL("**/en/pedestrian.html");
  await page.waitForFunction(() => document.documentElement.lang === "en");
  const englishSainteCatherinePopup = await page.locator(".leaflet-popup-content").innerText();
  assert(englishSainteCatherinePopup.includes("Official location point"));
  assert(englishSainteCatherinePopup.includes("Address associated with the municipal map marker"));
  assert(englishSainteCatherinePopup.includes("Schedule not published"));
  await page.locator("#languageToggle").click();
  await page.waitForURL("**/fr/pedestrian.html");
  await page.waitForFunction(() => document.documentElement.lang === "fr");
  await page.locator(".popup-close-button").click();
  const laval = snapshot.records.find((record) => record.sourceKey === "laval");
  assert(laval && laval.side.code === "east");
  await page.evaluate((record) => {
    dateStart.value = record.startDate;
    dateEnd.value = record.endDate;
    searchFilter.value = record.streets;
    updateView({ fit: false });
    focusClosure(allClosures.find((item) => item.id === record.id), { openPopup: true });
  }, laval);
  await page.locator("#languageToggle").click();
  await page.waitForURL("**/en/pedestrian.html");
  await page.waitForFunction(() => document.documentElement.lang === "en");
  assert((await page.locator(".leaflet-popup-content").innerText()).includes("Published side"));
  assert((await page.locator(".leaflet-popup-content").innerText()).includes("East"));
  assert((await page.locator(".leaflet-popup-content").innerText()).includes(laval.impact));
  await page.locator(".popup-close-button").click();
  await page.locator("#searchFilter").fill("");
  await page.locator("#resetView").click();
  await areas.locator("summary").click();
  assert.notEqual(await areas.getAttribute("open"), null);
  await page.locator(".pedestrian-area-filters input[value=sidewalk]").uncheck();
  assert(await page.evaluate(() => getFilteredClosures().every((record) => record.pedestrianArea !== "sidewalk")));
  await page.locator(".pedestrian-area-filters input[value=sidewalk]").check();
  await page.locator("#sourcesToggle").click();
  assert((await page.locator("#pedestrianSnapshotInfo").innerText()).includes(snapshot.generatedAt));
  await page.locator("#sourcesClose").click();
  await page.screenshot({ path: join(tmpdir(), "pedestrian-consolidated-desktop.png") });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForFunction((count) => typeof allClosures !== "undefined" && allClosures.length === count, snapshot.records.length);
  assert.equal(await page.locator("#menuToggle").getAttribute("aria-expanded"), "false");
  await page.locator("#menuToggle").click();
  assert.equal(await page.locator("#menuToggle").getAttribute("aria-expanded"), "true");
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
  await page.screenshot({ path: join(tmpdir(), "pedestrian-consolidated-mobile.png") });
  await page.locator("#menuToggle").click();
  await page.locator("#sourcesToggle").click();
  const bounds = await page.locator("#sourceCard").boundingBox();
  assert(bounds.x >= 0 && bounds.x + bounds.width <= 390);
  assert(bounds.y >= 0 && bounds.y + bounds.height <= 844);
  assert.equal(errors.length, 0, errors.join("\n"));

  const failure = await browser.newPage();
  await failure.route("**/data/pedestrian-closures-snapshot.json*", (route) => route.abort());
  await failure.goto(`${baseUrl}/fr/pedestrian.html`);
  await failure.waitForFunction(() => /impossible/i.test(document.querySelector("#mapStatus")?.textContent || ""));
  assert.equal(await failure.evaluate(() => allClosures.length), 0);

  const faqPage = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const faqErrors = [];
  faqPage.on("pageerror", (error) => faqErrors.push(error.message));
  await faqPage.goto(`${baseUrl}/faq.html`);
  await faqPage.locator("#sources-utilisees > summary").click();
  const sourceRow = faqPage.locator("#faqSourceList tr")
    .filter({ hasText: "Ville de Sainte-Catherine - Travaux de trottoirs (snapshot piéton)" });
  await sourceRow.waitFor();
  assert.equal(await sourceRow.locator("a").getAttribute("href"), catalogEntry.faqUrl);
  assert(await sourceRow.locator(".snapshot-indicator").count());
  await faqPage.locator("#languageToggle").click();
  await faqPage.waitForFunction(() => document.documentElement.lang === "en");
  const englishSourceRow = faqPage.locator("#faqSourceList tr")
    .filter({ hasText: "City of Sainte-Catherine - Sidewalk works (pedestrian snapshot)" });
  await englishSourceRow.waitFor();
  assert.equal(await englishSourceRow.locator("a").getAttribute("href"), catalogEntry.faqUrl);
  assert.equal(faqErrors.length, 0, faqErrors.join("\n"));
  console.log(`PASS: ${snapshot.records.length} records, ${visibleSourceKeys.length} sources active today, Sainte-Catherine FAQ FR/EN, sides, popups, filters, mobile, snapshot failure; no page errors.`);
} finally {
  await browser.close();
}