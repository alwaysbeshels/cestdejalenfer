import assert from "node:assert/strict";
import { chromium } from "playwright";

const baseUrl = process.env.PEDESTRIAN_VALIDATION_URL || "http://localhost:5500";
const browser = await chromium.launch({ headless: true });
try {
  for (const route of ["fr/pedestrian.html", "fr/index.html"]) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    const unavailable = new Set();
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (/source failed|Failed to load|API|Invalid URL/i.test(message.text())) unavailable.add(message.text().slice(0, 400));
    });
    await page.goto(`${baseUrl}/${route}`, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => typeof allClosures !== "undefined" && allClosures.length > 0);
    if (route.endsWith("index.html")) {
      await page.waitForFunction(() => document.querySelector("#mapStatus").dataset.mode === "ready", {}, { timeout: 180000 });
    }
    const report = await page.evaluate(() => {
      const check = (condition, message) => { if (!condition) throw new Error(message); };
      const original = JSON.stringify(allClosures);
      const mobilityGeometry = { paths: [[[-73.65, 45.69], [-73.651, 45.691]]] };
      const terrebonneBase = { globalid: "mobility-test", statut_avis: "Actif", date_fin: Date.UTC(2099, 11, 31), type_entrave: "Fermeture complete" };
      const terrebonneCases = [
        [{ localisation: "Piste cyclable située entre le chemin Comtois et le chemin Martin", type_circulation: "Autre" }, false],
        [{ localisation: "Tunnel reliant le Vieux-Terrebonne au terminus sous l'autoroute 25", type_circulation: "Chemin de detour - Pietons et cyclistes" }, false],
        [{ localisation: "Pierre-Dansereau", description: "Travaux de piste cyclable et réfection de chaussée", type_circulation: "Chemin de detour - Circulation automobile" }, true],
        [{ localisation: "Piste cyclable et rue", type_circulation: "Circulation automobile, pietons et cyclistes" }, true]
      ];
      for (const [attributes, expected] of terrebonneCases) {
        const record = normalizeTerrebonneFeature({ attributes: { ...terrebonneBase, ...attributes }, geometry: mobilityGeometry });
        check(record.automobileImpact === expected, `Wrong Terrebonne travel mode: ${attributes.localisation}`);
        check(dedupeClosures([record]).length === Number(PEDESTRIAN_MODE || expected), "Travel-mode gate affected the wrong map");
      }
      for (const [entrave, expected] of [["Voie cyclable", false], ["Trottoir", false], ["Partielle", true], ["Fermeture complète", true]]) {
        const record = normalizeLavalIdentifyResult({ layerId: 0, attributes: { OBJECTID: "mobility-test", ENTRAVE: entrave, LOCALISATION: "Piste cyclable et trottoir" }, geometry: { paths: [[[-8200000, 5700000], [-8200010, 5700010]]] } });
        check(record.automobileImpact === expected, `Wrong Laval travel mode: ${entrave}`);
      }
      const sidewalkWorks = "Travaux de réfection permanent de Trottoir";
      for (const [description, expected] of [[sidewalkWorks, false], ["Fermeture de la voie de droite sur l'avenue Cardinal et fermeture du trottoir", true]]) {
        const record = normalizeDorvalFeature({ attributes: { FID: "mobility-test", REMARQUE: description, StatusEntr: "Actif", DateFin: Date.UTC(2099, 11, 31) }, geometry: { x: -73.74, y: 45.448 } });
        check(record.automobileImpact === expected, `Wrong Dorval travel mode: ${description}`);
      }
      check(LINKED_CITY_WORKS.find((record) => record.id === "linked-baie-durfe-clark-graham-exo").automobileImpact === false, "Unverified automobile impact on Clark-Graham");
      if (PEDESTRIAN_MODE) {
        const impacts = window.PEDESTRIAN_MAP.publishedPedestrianImpacts(sidewalkWorks);
        check(impacts.length === 1 && impacts[0].severity === "moderate", "Sidewalk works became a closure or disappeared");
        check(window.PEDESTRIAN_MAP.publishedPedestrianImpacts("Fermeture complète de la piste cyclable").length === 0, "Cycle-only closure became a pedestrian closure");
        const cycling = window.PEDESTRIAN_MAP.publishedCyclingImpacts("Fermeture complète de la piste cyclable");
        check(cycling.length === 1 && cycling[0].affectedUsers[0] === "cyclists" && cycling[0].severity === "critical", "Explicit cycling closure missing");
        check(window.PEDESTRIAN_MAP.publishedCyclingImpacts("Aucune fermeture de la piste cyclable").length === 0, "Negated cycling closure retained");
      } else {
        check(allClosures.every((record) => record.automobileImpact !== false), "Non-automobile restriction leaked onto the auto map");
      }
      check(JSON.stringify(allClosures) === original, "Travel-mode tests mutated the loaded records");
      const groups = groupPopupClosures(allClosures);
      const byId = new Map(allClosures.map((record) => [record.id, record]));
      const groupedIds = groups.flatMap((group) => group.popupRecordIds);
      check(groupedIds.length === allClosures.length, "A source record was lost");
      check(new Set(groupedIds).size === allClosures.length, "A source record was duplicated");
      const summary = {};
      for (const record of allClosures) {
        const source = summary[record.sourceKind] ||= { records: 0, cards: 0, mergedGroups: 0, repeatedCardsRemoved: 0 };
        source.records++;
      }
      for (const group of groups) {
        const source = summary[group.sourceKind];
        source.cards++;
        if (group.popupRecordIds.length > 1) {
          source.mergedGroups++;
          source.repeatedCardsRemoved += group.popupRecordIds.length - 1;
        }
        const identities = new Set();
        for (const id of group.popupRecordIds) {
          const member = byId.get(id);
          identities.add(JSON.stringify([member.sourceKind, member.sourceUrl, popupReference(member)]));
          check(group.streets.includes(String(member.streets || "").trim()), `Lost street: ${id}`);
          check(group.title.includes(String(member.title || "").trim()), `Lost title: ${id}`);
          check(!member.direction || group.direction.includes(member.direction), `Lost direction: ${id}`);
          for (const field of ["severity", "side", "startDate", "endDate", "schedule", "scheduleText", "impact", "details", "recurringSchedule"]) {
            check(JSON.stringify(member[field]) === JSON.stringify(group[field]), `Merged different ${field}: ${id}`);
          }
        }
        check(identities.size === 1, "Merged different sources or references");
      }
      check(JSON.stringify(allClosures) === original, "Grouping mutated source records or geometry");
      const html = groups.map(popupContent);
      check(new Set(html).size === html.length, "Identical cards remain after grouping");
      const sample = allClosures.find((record) => popupReference(record).value && record.title);
      const base = { ...sample, details: [], evidence: null, reference: "test-permit", directionIsSegmentDescription: false };
      const second = { ...base, id: "second-segment", title: "Other street", streets: "Other published limits" };
      check(groupPopupClosures([base, second]).length === 1, "Same permit not grouped");
      const differences = [
        { reference: "other-permit" }, { sourceKind: "other-source" }, { sourceUrl: "https://example.invalid/other" },
        { severity: base.severity === "critical" ? "moderate" : "critical" }, { side: { code: "north" } },
        { startDate: "2050-01-01" }, { endDate: "2050-12-31" }, { startTime: "23:59" },
        { scheduleText: "Different hours" }, { recurringSchedule: { days: ["Mon"] } },
        { direction: "Different published direction" }, { impact: "Different published impact" },
        { affectedUsers: ["cyclists"] }
      ];
      for (const difference of differences) check(groupPopupClosures([base, { ...second, ...difference }]).length === 2, `Unsafe merge: ${JSON.stringify(difference)}`);
      const activeGroups = groupPopupClosures(getFilteredClosures());
      const clickSamples = [];
      const sampledSources = new Set();
      for (const group of activeGroups.filter((group) => group.popupRecordIds.length > 1)) {
        if (sampledSources.has(group.sourceKind)) continue;
        sampledSources.add(group.sourceKind);
        clickSamples.push(group.popupRecordIds[0]);
      }
      return { mode: PEDESTRIAN_MODE ? "pedestrian" : "auto", records: allClosures.length, cards: groups.length,
        mergedGroups: groups.filter((group) => group.popupRecordIds.length > 1).length,
        sources: summary, clickSamples };
    });
    for (const id of report.clickSamples) {
      const result = await page.evaluate((id) => {
        const record = allClosures.find((item) => item.id === id);
        map.stop();
        map.setView([record.point[1], record.point[0]], 18, { animate: false });
        updateView({ fit: false });
        const layer = renderedClosureLayers.get(id)?.closures.getLayers()[0];
        if (!layer) throw new Error(`No rendered layer for ${id}`);
        layer.fire("click", { latlng: L.latLng(record.point[1], record.point[0]) });
        const popup = document.querySelector(".leaflet-popup-content");
        if (!popup) throw new Error(`No popup for ${id}`);
        const cards = [...popup.querySelectorAll(".popup-card")].map((card) => card.innerHTML);
        const expected = groupPopupClosures(closuresNearLatLng(L.latLng(record.point[1], record.point[0]), record)).length;
        return { source: record.sourceKind, cards: cards.length, distinct: new Set(cards).size, expected, header: popup.querySelector(".popup-group-header").textContent };
      }, id);
      assert.equal(result.cards, Math.min(8, result.expected));
      assert.equal(result.cards, result.distinct);
      assert(result.header.startsWith(String(result.expected)));
      await page.locator(".popup-close-button").click();
      console.log("Vector click", JSON.stringify(result));
    }
    assert.equal(errors.length, 0, errors.join("\n"));
    const selectedId = report.clickSamples.at(-1);
    if (selectedId) {
      await page.locator("#languageToggle").click();
      await page.waitForFunction(() => document.documentElement.lang === "en");
      await page.evaluate((id) => {
        const record = allClosures.find((item) => item.id === id);
        openGroupedPopup(record, L.latLng(record.point[1], record.point[0]));
      }, selectedId);
      assert((await page.locator(".popup-group-header").innerText()).includes("restriction"));
      assert(!(await page.locator(".leaflet-popup-content").innerText()).includes("popup.reference"));
      await page.locator(".popup-close-button").click();
      await page.evaluate(() => {
        window.popupTestMobileLayoutReady = new Promise((resolve) => {
          compactLayoutQuery.addEventListener("change", () => requestAnimationFrame(resolve), { once: true });
        });
      });
      await page.setViewportSize({ width: 390, height: 844 });
      await page.evaluate(() => window.popupTestMobileLayoutReady);
      if (await page.locator("#sidePanel").evaluate((panel) => panel.classList.contains("is-open"))) await page.locator("#menuToggle").click();
      await page.evaluate((id) => {
        const record = allClosures.find((item) => item.id === id);
        openGroupedPopup(record, L.latLng(record.point[1], record.point[0]));
      }, selectedId);
      await page.waitForFunction(() => {
        const element = document.querySelector(".leaflet-popup-content");
        if (!element) return false;
        const popup = element.getBoundingClientRect();
        return popup.left >= 0 && popup.right <= innerWidth && popup.top >= 0 && popup.bottom <= innerHeight;
      });
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.locator(".popup-close-button").click();
      console.log(`Language switch and mobile popup: ${report.mode}`);
    }
    assert.equal(errors.length, 0, errors.join("\n"));
    console.log(JSON.stringify({ ...report, unavailable: [...unavailable], pageErrors: errors }));
    await page.evaluate(() => map.setView([45.6967, -73.6517], 16.25, { animate: false }));
    const savedView = await page.evaluate(() => ({ center: map.getCenter(), zoom: map.getZoom() }));
    if (await page.locator("#sidePanel").evaluate((panel) => !panel.classList.contains("is-open"))) await page.locator("#menuToggle").click();
    await page.locator(".map-mode-nav a[data-language-page]:not([aria-current]):not([data-view])").click();
    await page.waitForFunction(() => document.querySelector("#mapStatus")?.dataset.mode === "ready", {}, { timeout: 180000 });
    const restoredView = await page.evaluate((view) => ({ zoom: map.getZoom(),
      pixelDrift: map.project(map.getCenter(), view.zoom).distanceTo(map.project(L.latLng(view.center.lat, view.center.lng), view.zoom)) }), savedView);
    assert.equal(restoredView.zoom, savedView.zoom);
    assert(restoredView.pixelDrift <= 1, `Map moved ${restoredView.pixelDrift} pixels during navigation`);
    assert.equal(errors.length, 0, errors.join("\n"));
    console.log(`Center and zoom preserved when leaving ${report.mode}`);
    await page.close();
  }
  console.log("PASS: all loaded records audited on both maps; identities, geometries and distinct impacts preserved.");
} finally {
  await browser.close();
}