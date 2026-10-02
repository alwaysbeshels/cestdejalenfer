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
const today = snapshot.generatedAt.slice(0, 10);
for (const record of snapshot.records) {
  assert(record.startDate && (record.endDate >= today || record.openEnded));
  assert(record.geometry && record.sourceUrl && record.evidence && record.side);
  assert(["critical", "moderate"].includes(record.severity));
  assert(snapshot.sources.some((source) => source.key === record.sourceKey));
  if (record.side.code === "unknown") assert.equal(record.side.published, null);
  if (record.sourceKey === "montreal") assert.equal(record.severity, "moderate");
}
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
  assert.equal(requests.filter((url) => /snapshot\.json/.test(url)).length, 1);
  const areas = page.locator("details").filter({ has: page.locator(".pedestrian-area-filters") });
  assert.equal(await areas.getAttribute("open"), null);
  assert.equal(await areas.locator("input:checked").count(), 3);
  const sourceKeys = [...new Set(snapshot.records.map((record) => record.sourceKey))];
  for (const key of sourceKeys) {
    const record = snapshot.records.find((item) => item.sourceKey === key);
    await page.evaluate((record) => {
      document.querySelector("#dateStart").value = record.startDate;
      document.querySelector("#dateEnd").value = record.endDate || record.startDate;
      document.querySelector("#searchFilter").value = record.streets;
      map.setView([record.point[1], record.point[0]], 17, { animate: false });
      updateView({ fit: false });
    }, record);
    await page.locator("#closureList .closure-card[tabindex]").filter({ has: page.locator(`a[href="${record.sourceUrl}"]`) }).first().click();
    await page.locator(".leaflet-popup-content").waitFor();
    assert(comparable(await page.locator(".leaflet-popup-content").innerText()).includes(comparable(record.impact)));
    assert((await page.locator(".leaflet-popup-content").innerText()).includes(record.sourceCheckedAt));
    assert(await page.evaluate((id) => renderedClosureLayers.has(id), record.id));
    console.log(`Popup and geometry: ${key}`);
    await page.locator(".popup-close-button").click();
  }
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
  console.log(`PASS: ${snapshot.records.length} records, ${sourceKeys.length} displayed sources, sides, popups, FR/EN, filters, mobile, snapshot failure; no page errors.`);
} finally {
  await browser.close();
}