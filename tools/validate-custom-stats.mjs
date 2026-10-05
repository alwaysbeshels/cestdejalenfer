import assert from "node:assert/strict";
import { aggregateCustomRows, clampCustomPanelWidth, compatibleCustomStyles, composeCustomStyle, customAxisChoices, customAxisControls, customCategoryColor, customDisplayValue, customFields, customPointData, customPointXRange, customPointXYRange, customRecordsForSelection, customStyleParts, customTableDimensions, filterCustomClosures, OTHER_CUSTOM_SERIES, prepareCustomChartRows } from "../js/stats-custom.mjs";

const records = [
  { id: "one", municipalityKey: "laval", impactType: "critical", plannedDurationDays: 2, lengthMeters: 100 },
  { id: "two", municipalityKey: "laval", impactType: "critical", plannedDurationDays: 4, lengthMeters: null },
  { id: "three", municipalityKey: "laval", impactType: "major", plannedDurationDays: 100, lengthMeters: 0 },
  { id: "four", municipalityKey: "montreal", impactType: "major", plannedDurationDays: null, lengthMeters: null },
  { id: "five", municipalityKey: null, impactType: "major", plannedDurationDays: 6, lengthMeters: 50 }
];
const count = aggregateCustomRows(records);
assert.equal(count.reduce((total, row) => total + row.value, 0), records.length);
assert.equal(count.find(row => row.groupKey === null).recordCount, 1);
assert.equal(count.find(row => row.groupKey === "laval" && row.seriesKey === "critical").value, 2);
assert.deepEqual(filterCustomClosures(records, { municipalityKey: [] }), []);
assert.equal(filterCustomClosures(records, { municipalityKey: [null] }).length, 1);
assert.equal(filterCustomClosures(records, { municipalityKey: null }).length, 5);

const duration = aggregateCustomRows(records, { metricKey: "duration", seriesFieldKey: null });
assert.equal(duration.find(row => row.groupKey === "laval").value, 4);
assert.equal(duration.find(row => row.groupKey === "montreal").value, null);
const restricted = aggregateCustomRows(records, { metricKey: "duration", seriesFieldKey: null, filters: { impactType: ["critical"] } });
assert.equal(restricted[0].value, 3);

const length = aggregateCustomRows(records, { metricKey: "length" });
const partial = length.find(row => row.groupKey === "laval" && row.seriesKey === "critical");
assert.equal(partial.value, 100);
assert.equal(partial.validCount, 1);
assert.equal(partial.missingCount, 1);
assert.equal(length.find(row => row.groupKey === "laval" && row.seriesKey === "major").value, 0);
assert.equal(length.find(row => row.groupKey === "montreal").value, null);

const share = aggregateCustomRows(records, { metricKey: "share", filters: { municipalityKey: ["laval"] } });
assert.ok(Math.abs(share.reduce((total, row) => total + row.value, 0) - 100) < 1e-9);
assert.ok(share.every(row => row.denominator === 3));
const percent = aggregateCustomRows(records, { normalizeWithinGroup: true });
assert.equal(percent.find(row => row.groupKey === "montreal").value, 100);
assert.equal(percent.find(row => row.groupKey === "laval" && row.seriesKey === "critical").denominator, 3);
const zeroPercent = aggregateCustomRows(records.filter(record => record.id === "three"), { metricKey: "length", normalizeWithinGroup: true });
assert.equal(zeroPercent[0].value, null);
assert.equal(zeroPercent[0].denominator, 0);

assert.deepEqual(aggregateCustomRows([], { metricKey: "share" }), []);
assert.throws(() => aggregateCustomRows(records, { metricKey: "duration", normalizeWithinGroup: true }));
assert.throws(() => aggregateCustomRows(records, { groupFieldKey: "invalid" }));
assert.deepEqual(compatibleCustomStyles("duration", "impactType"), ["horizontal", "vertical", "line", "radar"]);
assert.ok(customFields.every(field => !field.compatibleChartTypes.includes("scatter") && !field.compatibleChartTypes.includes("bubble")));
for (const type of ["scatter", "bubble"]) assert.equal(composeCustomStyle({ type, orientation: "horizontal", arrangement: "grouped" }, "count", "impactType"), "horizontal");
assert.ok(compatibleCustomStyles("count", null).includes("doughnut"));
assert.ok(!compatibleCustomStyles("count", "impactType").includes("doughnut"));
assert.equal(new Set(customFields.map(field => field.key)).size, customFields.length);
assert.ok(records.every(record => !Object.hasOwn(record, "recordCount")));
const manySeries = [
  ...Array.from({ length: 20 }, (_, index) => ({ id: `a-${index}`, municipalityKey: "laval", impactType: "A", plannedDurationDays: 10 })),
  ...[1, 2, 3].map((days, index) => ({ id: `b-${index}`, municipalityKey: "laval", impactType: "B", plannedDurationDays: days })),
  ...Array.from({ length: 4 }, (_, index) => ({ id: `c-${index}`, municipalityKey: "laval", impactType: "C", plannedDurationDays: 100 })),
  ...[1, 1].map((days, index) => ({ id: `d-${index}`, municipalityKey: "laval", impactType: "D", plannedDurationDays: days }))
];
const compact = prepareCustomChartRows(manySeries, { metricKey: "duration", groupFieldKey: "municipalityKey", seriesFieldKey: "impactType" }, undefined, 3);
assert.equal(compact.rows.length, 4);
assert.equal(compact.displayRows.length, 3);
assert.equal(compact.displayRows.find(row => row.seriesKey === OTHER_CUSTOM_SERIES).value, 1);
assert.equal(compact.displayRows.reduce((total, row) => total + row.recordCount, 0), manySeries.length);
assert.equal(clampCustomPanelWidth(100, 1200), 250);
assert.equal(clampCustomPanelWidth(400, 1200), 400);
assert.equal(clampCustomPanelWidth(900, 1200), 520);
assert.equal(clampCustomPanelWidth(500, 800), 396);
assert.equal(clampCustomPanelWidth(NaN, 1200), 250);
for (const series of [null, "impactType"]) {
  for (const style of compatibleCustomStyles("count", series)) assert.equal(composeCustomStyle(customStyleParts(style), "count", series), style);
}
assert.equal(composeCustomStyle({ type: "bar", orientation: "vertical", arrangement: "percent" }, "duration", "impactType"), "vertical");
const datedRows = [{ groupKey: "laval", groupLabel: "Laval", seriesKey: "ongoing", seriesLabel: "Ongoing" }, { groupKey: "montreal", groupLabel: "Montreal", seriesKey: "ongoing", seriesLabel: "Ongoing" }];
assert.deepEqual(customTableDimensions(datedRows, "municipalityKey", "temporalStatus"), { group: true, series: false, constantStatus: "Ongoing" });
assert.equal(customTableDimensions([...datedRows, { ...datedRows[0], seriesKey: "ended" }], "municipalityKey", "temporalStatus").series, true);
assert.equal(customTableDimensions([{ groupKey: "ongoing", groupLabel: "Ongoing" }], "temporalStatus", null).group, true);
const boroughRecords = [{ municipalityKey: "montreal", boroughKey: "montreal:VM", impactType: "major" }, { municipalityKey: "laval", boroughKey: "other", impactType: "major" }];
const boroughChoice = { groupFieldKey: "boroughKey", seriesFieldKey: null, metricKey: "share", filters: { municipalityKey: ["laval"] } };
assert.equal(customRecordsForSelection(boroughRecords, boroughChoice).length, 1);
assert.equal(aggregateCustomRows(boroughRecords, boroughChoice)[0].denominator, 1);
assert.equal(aggregateCustomRows(boroughRecords, { ...boroughChoice, groupFieldKey: "impactType", seriesFieldKey: "boroughKey" })[0].seriesKey, "montreal:VM");
assert.deepEqual(boroughChoice.filters.municipalityKey, ["laval"]);
const pointSelection = { style: "scatter", xField: "lengthMeters", yField: "plannedDurationDays", xyColorField: "impactType" };
const pointResult = customPointData(records, pointSelection);
assert.equal(pointResult.recordCount, 5);
assert.equal(pointResult.points.length, 2);
assert.equal(pointResult.missingCount, 0);
assert.equal(pointResult.points.find(point => point.groupKey === "critical").x, 100);
assert.equal(pointResult.points.find(point => point.groupKey === "critical").y, 3);
assert.equal(pointResult.points.find(point => point.groupKey === "major").x, 50);
assert.equal(pointResult.points.find(point => point.groupKey === "major").y, 53);
assert.equal(pointResult.points.find(point => point.groupKey === "major").recordCount, 3);
assert.equal(pointResult.points.find(point => point.groupKey === "major").xMissingCount, 1);
const bubbles = customPointData(records, { ...pointSelection, style: "bubble", bubbleField: "lengthMeters" });
assert.equal(bubbles.points.find(point => point.groupKey === "major").bubbleValue, 50);
assert.equal(customPointData(records.filter(record => record.id === "three"), { ...pointSelection, style: "bubble", bubbleField: "lengthMeters" }).points[0].bubbleValue, 0);
const cityPoints = customPointData(records, { ...pointSelection, xyColorField: "municipalityKey" });
assert.equal(cityPoints.rows.length, 3);
assert.equal(cityPoints.points.length, 2);
assert.equal(cityPoints.missingCount, 1);
assert.equal(new Set(cityPoints.points.map(point => point.groupKey)).size, cityPoints.points.length);
assert.equal(cityPoints.points.find(point => point.groupKey === "laval").x, 100);
assert.equal(cityPoints.points.find(point => point.groupKey === "laval").y, 4);
assert.equal(cityPoints.points.find(point => point.groupKey === "laval").yValidCount, 3);
assert.equal(cityPoints.rows.find(point => point.groupKey === "montreal").x, null);
assert.equal(cityPoints.rows.find(point => point.groupKey === "montreal").recordCount, 1);
const allPoint = customPointData(records, { ...pointSelection, xyColorField: null });
assert.equal(allPoint.points.length, 1);
assert.equal(allPoint.points[0].x, 150);
assert.equal(allPoint.points[0].y, 5);
assert.equal(allPoint.points[0].recordCount, 5);
const boroughPoints = customPointData(boroughRecords.map(record => ({ ...record, lengthMeters: 10, plannedDurationDays: 30 })), { ...pointSelection, xyColorField: "boroughKey", filters: { municipalityKey: ["laval"] } });
assert.equal(boroughPoints.recordCount, 1);
assert.equal(boroughPoints.points[0].groupKey, "montreal:VM");
assert.equal(records[0].sourceKind, undefined);
assert.equal(customPointData(records, { ...pointSelection, style: "bubble", bubbleField: "ageDays" }).rows.length, 2);
assert.equal(customPointData(records, { ...pointSelection, style: "bubble", bubbleField: "ageDays" }).points.length, 0);
assert.equal(customPointData(records, { ...pointSelection, filters: { municipalityKey: ["laval"] } }).recordCount, 3);
assert.throws(() => customPointData(records, { ...pointSelection, yField: "lengthMeters" }));
assert.throws(() => customPointData(records, { ...pointSelection, xField: "municipalityKey" }));
assert.equal(customPointData([], pointSelection).points.length, 0);
const outlierPoints = [...Array.from({ length: 20 }, (_, index) => ({ x: index + 1 })), { x: 1000 }];
assert.deepEqual(customPointXRange(outlierPoints), { maximum: 20, shownCount: 20, outsideCount: 1 });
assert.deepEqual(customPointXRange(outlierPoints, true), { maximum: null, shownCount: 21, outsideCount: 0 });
assert.deepEqual(outlierPoints.at(-1), { x: 1000 });
assert.deepEqual(customPointXRange([]), { maximum: null, shownCount: 0, outsideCount: 0 });
assert.equal(customPointXRange([{ x: 1 }, { x: 1000 }]).maximum, null);
assert.equal(customPointXRange(Array.from({ length: 20 }, () => ({ x: 2 }))).maximum, null);
assert.equal(customPointXRange([...Array.from({ length: 20 }, () => ({ x: 0 })), { x: 1000 }]).maximum, null);
assert.equal(customPointXRange(outlierPoints.map(point => ({ x: point.x * 365.25 }))).maximum / 365.25, 20);
const tiedPoints = [...Array.from({ length: 95 }, () => ({ x: 2 })), ...Array.from({ length: 5 }, () => ({ x: 100 }))];
assert.deepEqual(customPointXRange(tiedPoints), { maximum: 2, shownCount: 95, outsideCount: 5 });
const jointPoints = [...Array.from({ length: 100 }, () => ({ x: 2, y: 3 })), { x: 1000, y: 3 }, { x: 2, y: 1000 }, { x: 1000, y: 1000 }];
assert.deepEqual(customPointXYRange(jointPoints), { xMaximum: 2, yMaximum: 3, shownCount: 100, outsideCount: 3 });
assert.deepEqual(customPointXYRange(jointPoints, true), { xMaximum: null, yMaximum: null, shownCount: 103, outsideCount: 0 });
assert.deepEqual(customPointXYRange(jointPoints.map(point => ({ ...point, x: 2 }))), { xMaximum: null, yMaximum: 3, shownCount: 101, outsideCount: 2 });
assert.deepEqual(customPointXYRange([{ x: 2, y: 3 }]), { xMaximum: null, yMaximum: null, shownCount: 1, outsideCount: 0 });
assert.equal(customPointXYRange(jointPoints.map(point => ({ x: point.x, y: point.y * 365.25 }))).yMaximum / 365.25, 3);
assert.deepEqual(customAxisControls("stacked-horizontal").map(control => [control.key, control.labelKey]), [["groupFieldKey", "stats.custom.xCategory"], ["metricKey", "stats.custom.yMeasure"]]);
assert.deepEqual(customAxisControls("vertical").map(control => control.key), ["groupFieldKey", "metricKey"]);
assert.deepEqual(customAxisControls("line"), customAxisControls("vertical"));
assert.deepEqual(customAxisControls("mixed").map(control => control.key), ["groupFieldKey", "barMetricKey", "metricKey"]);
assert.equal(customAxisControls("radar")[1].labelKey, "stats.custom.radialValue");
for (const style of ["pie", "doughnut", "polarArea"]) assert.equal(customAxisControls(style)[0].labelKey, "stats.custom.categories");
for (const style of ["scatter", "bubble"]) assert.deepEqual(customAxisControls(style).map(control => control.key), ["xField", "yField"]);
for (const style of ["pie", "doughnut", "polarArea", "stacked-horizontal", "percent-vertical"]) assert.deepEqual(customAxisChoices(style, "metricKey").map(field => field.key), ["count", "share", "length"]);
assert.deepEqual(customAxisChoices("horizontal", "metricKey").map(field => field.key), ["count", "share", "length", "duration", "age"]);
assert.equal(customAxisChoices("pie", "groupFieldKey").length, 15);
assert.deepEqual(customAxisChoices("mixed", "metricKey", { barMetricKey: "length" }).map(field => field.key), ["count", "share", "duration", "age"]);
assert.deepEqual(customAxisChoices("bubble", "xField").map(field => field.key), ["lengthMeters", "plannedDurationDays", "ageDays"]);
assert.deepEqual(customAxisChoices("scatter", "yField", { xField: "plannedDurationDays" }).map(field => field.key), ["lengthMeters", "ageDays"]);
assert.deepEqual(customAxisChoices("scatter", "groupFieldKey"), []);
const mixedRows = prepareCustomChartRows(records, { style: "mixed", groupFieldKey: "municipalityKey", seriesFieldKey: null, barMetricKey: "length", metricKey: "duration" }).rows;
const mixedLaval = mixedRows.find(row => row.groupKey === "laval");
assert.equal(mixedLaval.barValue, 100);
assert.equal(mixedLaval.barUnit, "meters");
assert.equal(mixedLaval.barMissingCount, 1);
assert.equal(mixedLaval.value, 4);
assert.equal(mixedRows.find(row => row.groupKey === "montreal").barValue, null);
assert.equal(mixedRows.find(row => row.groupKey === "montreal").value, null);
const mixedShares = prepareCustomChartRows(records, { style: "mixed", groupFieldKey: "municipalityKey", seriesFieldKey: null, barMetricKey: "share", metricKey: "length", filters: { municipalityKey: ["laval"] } }).rows;
assert.equal(mixedShares[0].barValue, 100);
assert.equal(mixedShares[0].barDenominator, 3);
assert.equal(customDisplayValue(365.25, "days"), 12);
assert.equal(customDisplayValue(30.4375, "days"), 1);
assert.equal(customDisplayValue(1000, "meters"), 1);
assert.equal(customDisplayValue(null, "days"), null);
assert.ok(customDisplayValue(1, "days") > 0);
assert.equal(new Set([0, 1, 2].map(index => customCategoryColor("sourceKind", `source-${index}`, index))).size, 3);
assert.equal(customCategoryColor("impactType", "critical", 0, () => "#ff1744"), "#ff1744");
console.log("Custom statistics: grouping, filtering, nulls, medians, denominators and chart compatibility passed.");

if (process.argv.includes("--browser")) {
  const { chromium } = await import("playwright");
  const baseUrl = process.env.CUSTOM_STATS_URL || "http://localhost:5000";
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: "fr-CA", serviceWorkers: "block" });
    const page = await context.newPage();
    const errors = [];
    let failChart = false;
    await page.addInitScript(() => {
      const animate = Element.prototype.animate;
      Element.prototype.animate = function (keyframes, options) {
        if (this.classList.contains("custom-help-panel")) window.customHelpAnimation = { duration: options.duration, properties: Object.keys(keyframes[0]) };
        return animate.call(this, keyframes, options);
      };
    });
    page.on("pageerror", error => errors.push(error.message));
    await page.route("https://**/*", route => {
      const url = route.request().url();
      if (/chart\.js.*chart\.umd/.test(url) && failChart) return route.abort();
      return /^https:\/\/(cdn\.jsdelivr\.net|unpkg\.com)\//.test(url) ? route.continue() : route.abort();
    });
    const chartReady = async () => {
      await page.waitForFunction(() => {
        const canvas = document.querySelector("#customStatsHost canvas");
        const chart = window.Chart?.getChart(canvas);
        if (!canvas || !chart || !canvas.width || !canvas.height) return false;
        const pixels = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
        let colored = 0;
        for (let offset = 0; offset < pixels.length; offset += 4) {
          const missingColor = pixels[offset] === 124 && pixels[offset + 1] === 135 && pixels[offset + 2] === 129;
          if (pixels[offset + 3] > 100 && (missingColor || Math.max(pixels[offset], pixels[offset + 1], pixels[offset + 2]) - Math.min(pixels[offset], pixels[offset + 1], pixels[offset + 2]) > 30)) colored++;
        }
        return colored > 30;
      }, null, { polling: 100, timeout: 20000 });
    };
    const openFacet = async key => {
      const facet = page.locator(`[data-custom-facet="${key}"]`);
      if (await facet.evaluate(element => !element.open)) await facet.locator(":scope > summary").click();
    };
    const checkAxisControls = async style => {
      const labels = await page.evaluate(controls => controls.map(control => {
        const select = document.querySelector(`[data-custom-select="${control.key}"]`);
        return { key: control.key, actual: select?.previousElementSibling?.textContent, expected: window.t(control.labelKey), options: select?.options.length };
      }), customAxisControls(style));
      for (const label of labels) {
        assert.equal(label.actual, label.expected, JSON.stringify(label));
        assert.ok(label.options >= 2, JSON.stringify(label));
      }
    };
    const checkHelp = async (topic, closeWith = "escape", rerender = false) => {
      const trigger = page.locator(`[data-custom-help="${topic}"]`);
      if (await trigger.evaluate(element => { const controls = element.closest(".custom-controls"); return controls?.tagName === "DETAILS" && !controls.open; })) await page.locator(".custom-controls > summary").click();
      const expectedChoices = await page.locator(`[data-custom-select="${topic}"] option`).allTextContents();
      await page.evaluate(() => { window.customHelpAnimation = null; });
      await trigger.click();
      const dialog = page.getByRole("dialog");
      await dialog.waitFor({ state: "visible" });
      const motion = await dialog.evaluate(() => ({
        reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
        animations: window.customHelpAnimation ? [window.customHelpAnimation] : []
      }));
      if (motion.reduced) assert.equal(motion.animations.length, 0);
      else assert.ok(motion.animations.some(animation => animation.duration === 240 && animation.properties.includes("opacity") && animation.properties.includes("transform")), JSON.stringify(motion));
      await page.waitForFunction(() => !document.querySelector(".custom-help-dialog").getAnimations({ subtree: true }).some(animation => animation.playState === "running"), null, { polling: 100 });
      await page.waitForFunction(() => [...document.querySelectorAll(".custom-help-icon img, .custom-help-dialog img")].every(image => image.complete && image.naturalWidth > 0), null, { polling: 100, timeout: 10000 });
      const content = await dialog.evaluate(element => {
        const panel = element.querySelector(".custom-help-panel").getBoundingClientRect();
        const body = element.querySelector(".custom-help-body");
        return { title: element.querySelector("h2").innerText, text: body.innerText,
          rows: element.querySelectorAll("tbody tr").length,
          fits: panel.left >= 0 && panel.right <= innerWidth && panel.top >= 0 && panel.bottom <= innerHeight,
          overflow: body.scrollWidth > body.clientWidth + 1 || [...element.querySelectorAll("td")].some(cell => cell.scrollWidth > cell.clientWidth + 1),
          mobileDefinitions: innerWidth > 600 || [...element.querySelectorAll("tbody tr")].every(row => row.lastElementChild.clientWidth >= body.clientWidth - 30),
          focused: element.contains(document.activeElement) };
      });
      assert.ok(content.title && content.text, JSON.stringify(content));
      const fixedRows = { page: 30, style: 7, orientation: 2, arrangement: 3, limit: 0 };
      assert.equal(content.rows, fixedRows[topic] ?? expectedChoices.length);
      assert.doesNotMatch(content.text, /\b(?:nuage|bulles|scatter|bubbles)\b/i, "Help must not advertise removed styles");
      if (!Object.hasOwn(fixedRows, topic)) assert.deepEqual(await dialog.locator("tbody tr > td:first-child").allTextContents(), expectedChoices);
      if (topic === "page") assert.equal(await dialog.locator("table").first().locator("thead th").count(), 2, "Categories must not include a data-type column");
      assert.equal(content.text.includes("stats.custom."), false, content.text);
      assert.ok(content.fits && !content.overflow && content.focused, JSON.stringify({ ...content, text: undefined }));
      assert.equal(content.mobileDefinitions, true, "Mobile definitions should use the available width");
      assert.equal(await trigger.getAttribute("aria-expanded"), "true");
      await page.keyboard.press("Shift+Tab");
      assert.equal(await dialog.evaluate(element => element.contains(document.activeElement)), true, "Focus must remain in the modal");
      if (rerender) {
        const previousTrigger = await trigger.elementHandle();
        await page.evaluate(() => document.querySelector('[data-custom-select="limit"]').dispatchEvent(new Event("change", { bubbles: true })));
        assert.equal(await previousTrigger.evaluate(element => element.isConnected), false, "The test must exercise a rebuilt controls panel");
        assert.equal(await dialog.evaluate(element => element.open), true, "Help must survive a controls rerender");
        assert.equal(await trigger.getAttribute("aria-expanded"), "true");
        await previousTrigger.dispose();
      }
      if (closeWith === "button") await dialog.locator("[data-custom-help-close]").click();
      else if (closeWith === "backdrop") await page.mouse.click(1, 1);
      else await page.keyboard.press("Escape");
      await page.waitForFunction(() => !document.querySelector(".custom-help-dialog")?.open, null, { polling: 100 });
      assert.equal(await trigger.getAttribute("aria-expanded"), "false");
      assert.equal(await page.evaluate(() => document.activeElement?.dataset.customHelp), topic, "Closing help must restore focus to the current trigger");
    };
    const scopeAll = async () => {
      const controls = page.locator(".custom-controls");
      if (await controls.evaluate(element => element.tagName === "DETAILS" && !element.open)) await controls.locator(":scope > summary").click();
      if (await page.locator(".custom-period").evaluate(element => !element.open)) await page.locator(".custom-period > summary").click();
      await page.locator('[data-custom-select="dateMode"]').selectOption("all");
      await page.waitForFunction(() => document.querySelector('[data-custom-select="dateMode"]')?.value === "all", null, { polling: 100 });
    };
    await page.goto(`${baseUrl}/fr/?view=stats&tab=custom&dates=all`, { waitUntil: "domcontentloaded" });
    await chartReady();
    await page.waitForFunction(() => allClosures.some(record => record.sourceKind === "uci-wfs") && allClosures.some(record => record.sourceKind === "mont-royal-snapshot"), null, { polling: 100, timeout: 15000 });
    await page.waitForFunction(() => Math.abs(document.querySelector("#sidePanel").getBoundingClientRect().width - 96) < 1, null, { polling: 100, timeout: 5000 });
    assert.equal(await page.locator('[data-custom-facet="municipalityKey"]').evaluate(element => element.open), false, "Municipality should be collapsed after initial data loading");
    assert.equal(await page.locator(".custom-controls details[open]").count(), 0, "All data-choice sections must start collapsed");
    await checkAxisControls("stacked-horizontal");
    const initial = await page.evaluate(() => ({
      summary: document.querySelector(".custom-summary").innerText,
      sidebar: document.querySelector("#sidePanel").getBoundingClientRect().width,
      controls: document.querySelector(".custom-controls").tagName === "SECTION",
      modes: [...document.querySelectorAll("#sidePanel > .map-mode-nav a")].map(link => ({ top: link.getBoundingClientRect().top, left: link.getBoundingClientRect().left, width: link.clientWidth, scrollWidth: link.scrollWidth })),
      handleVisible: document.querySelector("#panelResizeHandle").getClientRects().length > 0
    }));
    assert.ok(initial.sidebar <= 97, "Custom view should use a narrow navigation rail");
    assert.equal(initial.modes.length, 3);
    assert.ok(initial.modes.every((mode, index, modes) => Math.abs(mode.left - modes[0].left) < 1 && mode.scrollWidth <= mode.width + 1 && (index === 0 || mode.top > modes[index - 1].top)), "Travel modes must stack vertically without clipped labels");
    assert.equal(initial.handleVisible, false, "Compact rail must not show a misleading resize handle");
    assert.ok(initial.controls, "Desktop controls should be open");
    const controlsState = await page.evaluate(() => ({
      tag: document.querySelector(".custom-controls").tagName,
      summary: Boolean(document.querySelector(".custom-controls > summary")),
      resetFirst: document.querySelector(".custom-control-body").firstElementChild.hasAttribute("data-custom-reset"),
      dates: document.querySelectorAll("[data-custom-date]").length,
      timeTag: document.querySelector(".custom-time").tagName,
      sourceLast: [...document.querySelectorAll("[data-custom-facet]")].at(-1).dataset.customFacet,
      impactsInMenu: Boolean(document.querySelector(".custom-controls .custom-impacts")),
      impactsClosed: !document.querySelector(".custom-impacts").open,
      impactsDisplay: getComputedStyle(document.querySelector(".custom-impact-checks")).display
    }));
    assert.deepEqual(controlsState, { tag: "SECTION", summary: false, resetFirst: true, dates: 0, timeTag: "DETAILS", sourceLast: "sourceKind", impactsInMenu: true, impactsClosed: true, impactsDisplay: "flex" });
    const compactLayout = await page.evaluate(() => {
      const time = document.querySelector(".custom-time").getBoundingClientRect();
      const next = document.querySelector(".custom-time").nextElementSibling.getBoundingClientRect();
      const title = document.querySelector(".custom-page-title").getBoundingClientRect();
      const toolbar = document.querySelector(".custom-chart-toolbar").getBoundingClientRect();
      const period = document.querySelector(".custom-period").getBoundingClientRect();
      const impacts = document.querySelector(".custom-impacts").getBoundingClientRect();
      const view = document.querySelector("#statsView");
      return { gap: next.top - time.bottom, periodGap: impacts.top - period.bottom, sideBySide: toolbar.left >= title.right, pageOverflow: view.scrollHeight - view.clientHeight };
    });
    assert.ok(Math.abs(compactLayout.gap) <= 1, JSON.stringify(compactLayout));
    assert.ok(Math.abs(compactLayout.periodGap) < 1 && compactLayout.sideBySide && compactLayout.pageOverflow <= 2, JSON.stringify(compactLayout));
    const seriesColors = await page.evaluate(() => {
      const chart = Chart.getChart(document.querySelector("#customStatsHost canvas"));
      const palette = Object.fromEntries([...document.querySelectorAll("[data-custom-impact]")].map(input => [input.parentElement.textContent.trim(), SEVERITY_META[input.dataset.customImpact].color]));
      return chart.data.datasets.every(dataset => dataset.backgroundColor === palette[dataset.label]);
    });
    assert.ok(seriesColors, "Impact series must use the site palette");
    await checkHelp("page", "escape", true);
    await checkHelp("style", "button");
    await checkHelp("orientation", "backdrop");
    await checkHelp("arrangement");
    await checkHelp("limit");
    await checkHelp("groupFieldKey");
    await checkHelp("metricKey");
    await checkHelp("seriesFieldKey");
    const publicOrganization = await page.evaluate(() => allClosures.find(record => record.sourceKind === "uci-wfs" && record.responsible)?.responsible.trim());
    assert.ok(publicOrganization, "The local snapshot must provide a named public organization for this regression");
    await page.locator('[data-custom-select="groupFieldKey"]').selectOption("organizationKey");
    await chartReady();
    const organizationLabels = await page.locator(".custom-table-scroll tbody tr > td:first-child").allTextContents();
    const organizationCollator = new Intl.Collator("fr-CA", { sensitivity: "base" });
    assert.ok(organizationLabels.some(label => organizationCollator.compare(label.trim(), publicOrganization) === 0), "Named public organizations must not become missing companies");
    await page.locator('[data-custom-select="groupFieldKey"]').selectOption("directionCode");
    await chartReady();
    assert.ok((await page.locator(".custom-table-scroll tbody").textContent()).includes("Direction non publiée"), "Unpublished traffic directions must remain explicit");
    await page.locator('[data-custom-select="groupFieldKey"]').selectOption("municipalityKey");
    await chartReady();
    assert.equal(await page.locator(".custom-period").evaluate(element => element.open), false);
    await page.locator(".custom-period > summary").click();
    await page.locator('[data-custom-select="dateMode"]').selectOption("period");
    await page.waitForSelector('[data-custom-date="start"]');
    const dateFits = await page.locator('[data-custom-select="dateMode"]').evaluate(select => {
      const style = getComputedStyle(select);
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      context.font = style.font;
      return { text: select.selectedOptions[0].textContent, textWidth: context.measureText(select.selectedOptions[0].textContent).width,
        available: select.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight) - 24 };
    });
    assert.ok(dateFits.textWidth <= dateFits.available, JSON.stringify(dateFits));
    await page.locator('[data-custom-select="dateMode"]').selectOption("all");
    await page.waitForFunction(() => !document.querySelector("[data-custom-date]"), null, { polling: 100 });
    await page.locator(".custom-time > summary").click();
    await page.locator('[data-custom-time="night"]').uncheck();
    await page.waitForFunction(() => !timeFilters.find(input => input.value === "night").checked, null, { polling: 100 });
    assert.ok(await page.locator(".custom-time").evaluate(element => element.open));
    await page.locator('[data-custom-time="night"]').check();
    await page.locator(".custom-time > summary").click();
    assert.equal(await page.locator(".custom-time").evaluate(element => element.open), false);
    const resizeHandle = page.locator("[data-custom-resize]");
    assert.equal(await resizeHandle.getAttribute("aria-valuenow"), "360");
    await resizeHandle.focus();
    await resizeHandle.press("ArrowRight");
    assert.equal(await resizeHandle.getAttribute("aria-valuenow"), "380");
    const handleBox = await resizeHandle.boundingBox();
    await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(handleBox.x + handleBox.width / 2 + 120, handleBox.y + handleBox.height / 2, { steps: 6 });
    await page.mouse.up();
    assert.ok(Number(await resizeHandle.getAttribute("aria-valuenow")) >= 380);
    await resizeHandle.press("Home");
    await resizeHandle.press("ArrowLeft");
    assert.equal(await resizeHandle.getAttribute("aria-valuenow"), "250");
    assert.equal(await page.locator(".custom-controls").evaluate(element => Math.round(element.getBoundingClientRect().width)), 250);
    await page.emulateMedia({ reducedMotion: "reduce" });
    const reduced = await page.evaluate(() => ({ transition: getComputedStyle(document.querySelector(".app-shell")).transitionDuration, animation: getComputedStyle(document.querySelector("#sidePanel > .map-mode-nav")).animationName }));
    assert.equal(reduced.transition, "0s");
    assert.equal(reduced.animation, "none");
    await checkHelp("page");
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.setViewportSize({ width: 1100, height: 1000 });
    const sampleTransition = async tab => page.evaluate(async target => {
      const widths = [document.querySelector("#sidePanel").getBoundingClientRect().width];
      const link = target === "auto" ? document.querySelector('#sidePanel > .map-mode-nav a[data-language-page="map"]:not([data-view])') : target === "stats" ? document.querySelector('#sidePanel > .map-mode-nav a[data-view="stats"]') : document.querySelector(`[data-stats-tab="${target}"]`);
      const startTransition = document.startViewTransition.bind(document);
      let transition;
      document.startViewTransition = callback => { transition = startTransition(callback); return transition; };
      link.click();
      document.startViewTransition = startTransition;
      const start = performance.now();
      await new Promise(resolve => {
        const frame = () => {
          widths.push(document.querySelector("#sidePanel").getBoundingClientRect().width);
          if (performance.now() - start < 550) requestAnimationFrame(frame);
          else resolve();
        };
        requestAnimationFrame(frame);
      });
      return { widths, finished: transition ? await transition.finished.then(() => true, () => false) : false };
    }, tab);
    await page.locator('[data-stats-tab="general"]').click();
    await page.waitForSelector(".stats-common-filters");
    assert.equal(await page.locator("#sidePanel").evaluate(element => Math.round(element.getBoundingClientRect().width)), 96);
    assert.equal(await page.locator("#menuToggle").isVisible(), false);
    assert.equal(await page.locator('[data-stats-scope="allDates"]').inputValue(), "all");
    for (const tab of ["roads", "private", "territory", "places", "how"]) {
      await page.locator(`[data-stats-tab="${tab}"]`).click();
      await page.waitForFunction(expected => document.querySelector('.stats-tabs [aria-current="page"]')?.dataset.statsTab === expected, tab, { polling: 100, timeout: 10000 });
      assert.equal(await page.locator("#sidePanel").evaluate(element => Math.round(element.getBoundingClientRect().width)), 96);
      assert.equal(await page.locator("#menuToggle").isVisible(), false);
      assert.equal(await page.locator(".stats-common-filters").count(), tab === "how" ? 0 : 1);
    }
    await page.locator('[data-stats-tab="general"]').click();
    await page.locator('[data-stats-scope="allDates"]').selectOption("period");
    await page.waitForSelector('[data-stats-scope="start"]');
    await page.locator('[data-stats-scope="time:night"]').uncheck();
    await page.waitForFunction(() => !timeFilters.find(input => input.value === "night").checked, null, { polling: 100 });
    await page.locator('[data-stats-scope="time:night"]').check();
    await page.locator('[data-stats-scope="impact:major"]').uncheck();
    await page.waitForFunction(() => !impactFilters.find(input => input.value === "major").checked, null, { polling: 100 });
    await page.locator('[data-stats-scope="impact:major"]').check();
    await page.locator('[data-stats-scope="allDates"]').selectOption("all");
    await page.waitForFunction(() => !document.querySelector('[data-stats-scope="start"]'), null, { polling: 100 });
    await page.locator('[data-stats-tab="custom"]').click();
    await chartReady();
    const widening = await sampleTransition("auto");
    const normalWidth = widening.widths.at(-1);
    assert.ok(normalWidth > 100 && widening.finished, "Sidebar snapshot transition should finish at its normal width");
    assert.ok(widening.widths.every(width => Math.abs(width - 96) < 1 || Math.abs(width - normalWidth) < 1), "Sidebar layout must not resize every animation frame");
    assert.ok(await page.locator("#sidePanel .intro").isVisible());
    const shrinking = await sampleTransition("stats");
    assert.ok(shrinking.finished && Math.abs(shrinking.widths.at(-1) - 96) < 1, "Sidebar snapshot transition should finish at compact width");
    assert.ok(shrinking.widths.every(width => Math.abs(width - 96) < 1 || Math.abs(width - normalWidth) < 1), "Compact transition must not resize charts every animation frame");
    await page.waitForFunction(() => Math.abs(document.querySelector("#sidePanel").getBoundingClientRect().width - 96) < 1, null, { polling: 100, timeout: 5000 });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await chartReady();
    assert.equal(await page.locator('[data-custom-facet="municipalityKey"]').evaluate(element => element.open), false);
    await openFacet("municipalityKey");
    await page.locator('[data-custom-all="municipalityKey"]').uncheck();
    await page.waitForSelector(".custom-empty");
    assert.match(await page.locator(".custom-summary").innerText(), /^0 /);
    assert.equal(await page.locator('[data-custom-facet="boroughKey"]').count(), 0);
    assert.deepEqual(await page.locator('[data-custom-all="municipalityKey"]').evaluate(input => ({ checked: input.checked, mixed: input.indeterminate })), { checked: false, mixed: false });
    const city = await page.locator('[data-custom-options="municipalityKey"] label span').first().innerText();
    await page.locator('[data-custom-search="municipalityKey"]').focus();
    const searchPosition = await page.evaluate(() => ({ panel: document.querySelector(".custom-control-body").scrollTop, outer: document.querySelector("#statsView").scrollTop, height: document.querySelector('[data-custom-options="municipalityKey"]').getBoundingClientRect().height, facetHeight: document.querySelector('[data-custom-facet="municipalityKey"]').getBoundingClientRect().height }));
    await page.locator('[data-custom-search="municipalityKey"]').fill("not-a-municipality-zz");
    assert.equal(await page.locator('[data-custom-options="municipalityKey"] label:not([hidden])').count(), 0);
    assert.ok(await page.locator('[data-custom-facet="municipalityKey"] [data-custom-no-results]').isVisible());
    const afterSearch = await page.evaluate(() => ({ panel: document.querySelector(".custom-control-body").scrollTop, outer: document.querySelector("#statsView").scrollTop, height: document.querySelector('[data-custom-options="municipalityKey"]').getBoundingClientRect().height, facetHeight: document.querySelector('[data-custom-facet="municipalityKey"]').getBoundingClientRect().height }));
    for (const key of Object.keys(searchPosition)) assert.ok(Math.abs(searchPosition[key] - afterSearch[key]) < 2, JSON.stringify({ searchPosition, afterSearch }));
    assert.equal(await page.locator('[data-custom-search-only="municipalityKey"]').isVisible(), false);
    await page.locator('[data-custom-search="municipalityKey"]').fill(city);
    await page.locator('[data-custom-options="municipalityKey"] label:not([hidden]) input').first().check();
    await chartReady();
    assert.deepEqual(await page.locator('[data-custom-all="municipalityKey"]').evaluate(input => ({ checked: input.checked, mixed: input.indeterminate })), { checked: false, mixed: true });
    assert.deepEqual(await page.evaluate(() => Chart.getChart(document.querySelector("#customStatsHost canvas")).data.labels), [city]);
    await page.locator('[data-custom-search="municipalityKey"]').fill("");
    await page.locator('[data-custom-search="municipalityKey"]').fill(city);
    assert.equal(await page.locator('[data-custom-search-only="municipalityKey"]').isVisible(), false, "A search starting with a partial selection must not expose the shortcut");
    await page.locator('[data-custom-all="municipalityKey"]').click();
    assert.deepEqual(await page.locator('[data-custom-all="municipalityKey"]').evaluate(input => ({ checked: input.checked, mixed: input.indeterminate })), { checked: true, mixed: false });
    assert.equal(await page.locator('[data-custom-search-only="municipalityKey"]').isVisible(), false, "Selecting all after a search starts must not enable the shortcut");
    await page.locator('[data-custom-search="municipalityKey"]').fill("");
    await page.locator('[data-custom-search="municipalityKey"]').fill("not-a-municipality-zz");
    assert.ok(await page.locator('[data-custom-search-only="municipalityKey"]').isVisible());
    assert.ok(await page.locator('[data-custom-search-only="municipalityKey"]').isDisabled());
    await page.locator('[data-custom-search="municipalityKey"]').fill(city);
    await page.locator('[data-custom-search-only="municipalityKey"]').click();
    await chartReady();
    assert.deepEqual(await page.evaluate(() => Chart.getChart(document.querySelector("#customStatsHost canvas")).data.labels), [city]);
    assert.equal(await page.locator('[data-custom-search-only="municipalityKey"]').isVisible(), false);
    await page.locator('[data-custom-search="municipalityKey"]').fill("");
    await page.locator('[data-custom-all="municipalityKey"]').click();
    assert.equal(await page.locator('[data-custom-facet="boroughKey"]').count(), 1);
    await page.locator('[data-custom-facet="boroughKey"] > summary').click();
    await page.locator('[data-custom-all="boroughKey"]').uncheck();
    await page.waitForSelector(".custom-empty");
    await page.locator('[data-custom-search="municipalityKey"]').fill("Montréal");
    await page.locator('[data-custom-options="municipalityKey"] label:not([hidden]) input').first().uncheck();
    assert.equal(await page.locator('[data-custom-facet="boroughKey"]').count(), 0);
    assert.equal(await page.evaluate(() => Object.hasOwn(JSON.parse(localStorage.getItem("entraves-custom-chart-v1")).filters, "boroughKey")), false);
    await page.locator('[data-custom-options="municipalityKey"] label:not([hidden]) input').first().check();
    assert.equal(await page.locator('[data-custom-facet="boroughKey"]').count(), 1);
    await page.locator('[data-custom-search="municipalityKey"]').fill("");

    for (const style of ["horizontal", "vertical", "stacked-horizontal", "stacked-vertical", "percent-horizontal", "percent-vertical"]) {
      const parts = customStyleParts(style);
      await page.locator('[data-custom-select="style"]').selectOption(parts.type);
      await page.locator('[data-custom-select="orientation"]').selectOption(parts.orientation);
      await page.locator('[data-custom-select="arrangement"]').selectOption(parts.arrangement);
      await chartReady();
      await checkAxisControls(style);
      const result = await page.evaluate(() => {
        const chart = Chart.getChart(document.querySelector("#customStatsHost canvas"));
        const group = document.querySelector('[data-custom-select="groupFieldKey"]').selectedOptions[0].textContent;
        const metric = document.querySelector('[data-custom-select="metricKey"]').selectedOptions[0].textContent;
        const categoryAxis = chart.options.indexAxis;
        const valueAxis = categoryAxis === "x" ? "y" : "x";
        return { type: chart.config.type, axis: categoryAxis, group, metric, categoryTitle: chart.options.scales[categoryAxis].title.text, valueTitle: chart.options.scales[valueAxis].title.text, sums: chart.data.labels.map((label, index) => chart.data.datasets.reduce((total, dataset) => total + (dataset.data[index] || 0), 0)) };
      });
      assert.equal(result.type, "bar");
      assert.equal(result.axis, style.includes("horizontal") ? "y" : "x");
      assert.equal(result.categoryTitle, result.group);
      assert.ok(result.valueTitle.startsWith(result.metric), JSON.stringify(result));
      if (style.startsWith("percent")) assert.ok(result.sums.every(value => Math.abs(value - 100) < 1e-7));
      assert.deepEqual(await page.locator('[data-custom-select="metricKey"] option').evaluateAll(options => options.map(option => option.value)), customAxisChoices(style, "metricKey").map(field => field.key));
    }
    await page.locator('[data-custom-select="arrangement"]').selectOption("grouped");
    await page.locator('[data-custom-select="metricKey"]').selectOption("duration");
    assert.equal(await page.locator('[data-custom-select="orientation"]').inputValue(), "vertical");
    assert.deepEqual(await page.locator('[data-custom-select="style"] option').evaluateAll(options => options.map(option => option.value).sort()), ["bar", "line", "mixed", "radar"]);
    assert.equal(await page.locator('[data-custom-select="arrangement"]').count(), 0);
    await chartReady();
    await page.locator('[data-custom-select="metricKey"]').selectOption("count");
    await page.locator('[data-custom-select="seriesFieldKey"]').selectOption("");
    for (const style of ["pie", "doughnut", "polarArea", "radar", "line"]) {
      await page.locator('[data-custom-select="style"]').selectOption(style);
      await chartReady();
      await checkAxisControls(style);
      assert.equal(await page.evaluate(() => Chart.getChart(document.querySelector("#customStatsHost canvas")).config.type), style);
      assert.deepEqual(await page.locator('[data-custom-select="metricKey"] option').evaluateAll(options => options.map(option => option.value)), customAxisChoices(style, "metricKey").map(field => field.key));
      if (style === "pie") await checkHelp("metricKey");
    }
    await page.locator('[data-custom-select="style"]').selectOption("mixed");
    await chartReady();
    const mixedChart = await page.evaluate(() => {
      const chart = Chart.getChart(document.querySelector("#customStatsHost canvas"));
      return { types: chart.data.datasets.map(dataset => dataset.type), axes: chart.data.datasets.map(dataset => dataset.yAxisID), measure: document.querySelector('[data-custom-select="metricKey"]').value, seriesVisible: Boolean(document.querySelector('[data-custom-select="seriesFieldKey"]')) };
    });
    assert.deepEqual(mixedChart, { types: ["bar", "line"], axes: ["y", "measure"], measure: "duration", seriesVisible: false });
    await checkAxisControls("mixed");
    await checkHelp("barMetricKey");
    await checkHelp("metricKey");
    await page.locator('[data-custom-select="barMetricKey"]').selectOption("length");
    await chartReady();
    const selectedMixed = await page.evaluate(() => {
      const chart = Chart.getChart(document.querySelector("#customStatsHost canvas"));
      return { units: chart.data.datasets.map(dataset => dataset.customUnit), titles: [chart.options.scales.y.title.text, chart.options.scales.measure.title.text],
        barValues: chart.data.datasets[0].data, measureValues: chart.data.datasets[1].data,
        leftColumn: Boolean(document.querySelector('[data-custom-sort="barValue"]')), leftMissingColumn: Boolean(document.querySelector('[data-custom-sort="barMissingCount"]')) };
    });
    assert.deepEqual(selectedMixed.units, ["meters", "days"]);
    assert.ok(selectedMixed.titles[0].includes("km") && selectedMixed.titles[1].includes("mois"));
    assert.ok(selectedMixed.barValues.some(value => value > 0) && selectedMixed.measureValues.some(value => value > 0));
    assert.ok(selectedMixed.leftColumn && selectedMixed.leftMissingColumn);
    await page.locator('[data-custom-select="metricKey"]').selectOption("share");
    await chartReady();
    assert.equal(await page.evaluate(() => Chart.getChart(document.querySelector("#customStatsHost canvas")).data.datasets[1].customUnit), "percent");
    await page.locator('[data-custom-select="barMetricKey"]').selectOption("share");
    assert.notEqual(await page.locator('[data-custom-select="metricKey"]').inputValue(), "share");
    await page.locator('[data-custom-select="barMetricKey"]').selectOption("count");
    await page.locator('[data-custom-select="metricKey"]').selectOption("duration");
    await page.locator('[data-custom-select="style"]').selectOption("bar");
    await page.locator('[data-custom-select="metricKey"]').selectOption("count");
    await page.locator('[data-custom-select="groupFieldKey"]').selectOption("impactType");
    for (const style of ["bar", "line", "radar", "pie", "doughnut", "polarArea", "mixed"]) {
      await page.locator('[data-custom-select="style"]').selectOption(style);
      await chartReady();
      const coloring = await page.evaluate(() => {
        const chart = Chart.getChart(document.querySelector("#customStatsHost canvas"));
        const palette = Object.fromEntries([...document.querySelectorAll("[data-custom-impact]")].map(input => [input.parentElement.textContent.trim(), SEVERITY_META[input.dataset.customImpact].color]));
        const expected = chart.data.labels.map(label => palette[label]);
        const dataset = chart.data.datasets[0];
        return { expected, actual: dataset.pointBackgroundColor || dataset.backgroundColor };
      });
      assert.deepEqual(coloring.actual, coloring.expected, `Impact group colors for ${style}`);
    }
    await page.locator('[data-custom-select="style"]').selectOption("bar");
    await page.locator('[data-custom-select="metricKey"]').selectOption("count");
    await page.locator('[data-custom-select="groupFieldKey"]').selectOption("authorityType");
    await page.locator('[data-custom-all="authorityType"]').uncheck();
    await page.locator('[data-custom-options="authorityType"] input').first().check();
    await page.locator('[data-custom-select="groupFieldKey"]').selectOption("municipalityKey");
    assert.equal(await page.locator('[data-custom-facet="authorityType"]').count(), 1, "An active filter must remain visible after changing dimensions");
    await page.locator("[data-custom-reset]").click();
    await scopeAll();
    await chartReady();
    assert.equal(await page.locator('[data-custom-facet="municipalityKey"]').evaluate(element => element.open), false, "Reset should collapse Municipality");
    await openFacet("municipalityKey");
    const geographicOrder = await page.locator("[data-custom-facet]").evaluateAll(facets => facets.map(facet => facet.dataset.customFacet));
    assert.ok(geographicOrder.indexOf("municipalityKey") < geographicOrder.indexOf("boroughKey"));
    await page.locator('[data-custom-all="municipalityKey"]').uncheck();
    await page.locator('[data-custom-options="municipalityKey"] input').first().check();
    const previousCity = await page.evaluate(() => Chart.getChart(document.querySelector("#customStatsHost canvas"))?.data.labels[0]);
    await page.locator('[data-custom-select="groupFieldKey"]').selectOption("boroughKey");
    await chartReady();
    assert.equal(await page.locator('[data-custom-facet="municipalityKey"]').count(), 0);
    assert.equal(await page.locator('[data-custom-facet="boroughKey"]').count(), 1);
    assert.match(await page.locator(".custom-warning").innerText(), /Montréal seulement/);
    await page.locator('[data-custom-select="groupFieldKey"]').selectOption("municipalityKey");
    await chartReady();
    assert.deepEqual(await page.evaluate(() => Chart.getChart(document.querySelector("#customStatsHost canvas")).data.labels), [previousCity]);
    await page.locator('[data-custom-select="seriesFieldKey"]').selectOption("boroughKey");
    await chartReady();
    assert.equal(await page.locator('[data-custom-facet="municipalityKey"]').count(), 0);
    assert.ok(await page.locator(".custom-warning").isVisible());
    await page.locator('[data-custom-select="seriesFieldKey"]').selectOption("impactType");
    await page.locator('[data-custom-all="municipalityKey"]').click();
    await page.locator(".custom-values > summary").click();
    assert.ok(await page.locator(".custom-table-scroll tbody tr").count() > 0);
    await page.locator('[data-custom-sort="value"]').click();
    assert.equal(await page.locator('th:has([data-custom-sort="value"])').getAttribute("aria-sort"), "ascending");
    await page.locator('[data-custom-sort="value"]').click();
    assert.equal(await page.locator('th:has([data-custom-sort="value"])').getAttribute("aria-sort"), "descending");
    await page.locator('[data-custom-sort="value"]').click();
    assert.equal(await page.locator('th:has([data-custom-sort="value"])').getAttribute("aria-sort"), "none");
    assert.equal(await page.locator(".custom-pagination").count(), 0);
    const scrolling = await page.locator(".custom-table-scroll").evaluate(wrap => {
      const table = wrap.querySelector("table");
      const rows = [...table.tBodies[0].rows];
      const bottom = rows[9]?.getBoundingClientRect().bottom - table.getBoundingClientRect().top;
      return { rows: rows.length, scrollable: wrap.classList.contains("is-scrollable"), maximum: parseFloat(wrap.style.maxHeight), expected: bottom === undefined ? null : Math.ceil(bottom + wrap.offsetHeight - wrap.clientHeight), sticky: getComputedStyle(table.querySelector("th")).position };
    });
    assert.ok(scrolling.rows > 10, JSON.stringify(scrolling));
    assert.ok(scrolling.scrollable, JSON.stringify(scrolling));
    assert.ok(Math.abs(scrolling.maximum - scrolling.expected) <= 1, JSON.stringify(scrolling));
    assert.equal(scrolling.sticky, "sticky");
    await page.locator('[data-custom-select="seriesFieldKey"]').selectOption("temporalStatus");
    await page.locator('[data-custom-all="temporalStatus"]').uncheck();
    await page.locator('[data-custom-options="temporalStatus"] input').first().check();
    await chartReady();
    assert.ok(await page.locator(".custom-constant-status").isVisible());
    assert.equal(await page.locator('[data-custom-sort="seriesLabel"]').count(), 0);
    assert.equal(await page.locator('[data-custom-sort="groupLabel"]').count(), 1);
    await page.locator('[data-custom-all="temporalStatus"]').click();
    if (await page.locator('[data-custom-options="temporalStatus"] input').count() > 1) {
      assert.equal(await page.locator(".custom-constant-status").count(), 0);
      assert.equal(await page.locator('[data-custom-sort="seriesLabel"]').count(), 1);
    }
    await page.locator('[data-custom-select="seriesFieldKey"]').selectOption("impactType");

    for (const language of ["fr", "en"]) {
      if (language === "en") await page.getByRole("button", { name: "Passer à l'anglais", exact: true }).click();
      await page.waitForFunction(expected => document.documentElement.lang.startsWith(expected), language, { polling: 100, timeout: 10000 });
      for (const width of [320, 768, 1440]) {
        await page.setViewportSize({ width, height: 1000 });
        await chartReady();
        if (width < 881) {
          await page.locator("#menuToggle").click();
          await page.waitForFunction(() => document.querySelector("#sidePanel").classList.contains("is-open") && document.querySelector("#sidePanel").getBoundingClientRect().left >= -0.5, null, { polling: 100 });
          const rail = await page.evaluate(() => {
            const close = document.querySelector("#menuToggle").getBoundingClientRect();
            const buttons = [...document.querySelectorAll("#sidePanel .site-nav a, #sidePanel .site-nav button, #sidePanel > .map-mode-nav a")].filter(element => element.getClientRects().length);
            return { width: document.querySelector("#sidePanel").getBoundingClientRect().width, belowClose: buttons.every(button => button.getBoundingClientRect().top >= close.bottom + 5), vertical: getComputedStyle(document.querySelector("#sidePanel > .map-mode-nav")).gridAutoFlow, controlsTag: document.querySelector(".custom-controls").tagName };
          });
          assert.equal(rail.width, 96);
          assert.equal(rail.belowClose, true, JSON.stringify(rail));
          assert.equal(rail.vertical, "row");
          assert.equal(rail.controlsTag, "DETAILS");
          await page.locator("#menuToggle").click();
          assert.equal(await page.locator("#menuToggle").getAttribute("aria-expanded"), "false");
        }
        const layout = await page.evaluate(() => {
          const frame = document.querySelector(".custom-canvas-scroll").getBoundingClientRect();
          const controls = document.querySelector(".custom-controls").getBoundingClientRect();
          const overlapping = Math.min(frame.right, controls.right) - Math.max(frame.left, controls.left) > 1 && Math.min(frame.bottom, controls.bottom) - Math.max(frame.top, controls.top) > 1;
          return { width: innerWidth, overflow: document.documentElement.scrollWidth > innerWidth + 1, overlapping, chartWidth: frame.width, untranslated: document.querySelector("#customStatsHost").innerText.includes("stats.custom.") };
        });
        assert.equal(layout.overflow, false, JSON.stringify(layout));
        assert.equal(layout.overlapping, false, JSON.stringify(layout));
        assert.equal(layout.untranslated, false, JSON.stringify(layout));
        assert.ok(layout.chartWidth > 200, JSON.stringify(layout));
        await checkHelp("page");
        await checkHelp("style", "button");
        await checkHelp("orientation", "backdrop");
        await checkHelp("arrangement");
        await checkHelp("limit");
        await checkHelp("groupFieldKey");
        await checkHelp("metricKey");
        await checkHelp("seriesFieldKey");
        const controls = page.locator(".custom-controls");
        if (await controls.evaluate(element => element.tagName === "DETAILS" && !element.open)) await controls.locator(":scope > summary").click();
        if (width === 320) {
          const municipality = page.locator('[data-custom-facet="municipalityKey"]');
          if (await municipality.evaluate(element => !element.open)) await municipality.locator(":scope > summary").click();
          const search = page.locator('[data-custom-search="municipalityKey"]');
          await search.fill("");
          await search.focus();
          const beforeTyping = await page.evaluate(() => ({ outer: document.querySelector("#statsView").scrollTop, panel: document.querySelector(".custom-control-body").scrollTop, height: document.querySelector('[data-custom-options="municipalityKey"]').getBoundingClientRect().height }));
          await search.pressSequentially("zzzz-no-match", { delay: 15 });
          const afterTyping = await page.evaluate(() => ({ outer: document.querySelector("#statsView").scrollTop, panel: document.querySelector(".custom-control-body").scrollTop, height: document.querySelector('[data-custom-options="municipalityKey"]').getBoundingClientRect().height }));
          for (const key of Object.keys(beforeTyping)) assert.ok(Math.abs(beforeTyping[key] - afterTyping[key]) < 2, JSON.stringify({ beforeTyping, afterTyping }));
          assert.ok(await municipality.locator("[data-custom-no-results]").isVisible());
          await search.fill("");
        }
        await page.locator('[data-custom-select="groupFieldKey"]').selectOption("sourceKind");
        for (const style of ["pie", "doughnut", "polarArea", "radar", "line", "mixed"]) {
          await page.locator('[data-custom-select="style"]').selectOption(style);
          await chartReady();
          await checkAxisControls(style);
          assert.equal(await page.locator('[data-custom-select="arrangement"]').count(), 0);
          assert.equal(await page.locator('[data-custom-select="orientation"]').count(), 0);
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
          assert.equal(await page.locator("[data-custom-extremes], [data-custom-select=xyColorField], [data-custom-select=xField], [data-custom-select=yField]").count(), 0);
          assert.equal(await page.locator('[data-custom-select="style"] option[value="scatter"], [data-custom-select="style"] option[value="bubble"]').count(), 0);
        }
        await page.locator('[data-custom-select="style"]').selectOption("bar");
        await page.locator('[data-custom-select="metricKey"]').selectOption("count");
        await page.locator('[data-custom-select="seriesFieldKey"]').selectOption("impactType");
        for (const orientation of ["horizontal", "vertical"]) {
          await page.locator('[data-custom-select="orientation"]').selectOption(orientation);
          await chartReady();
          await checkAxisControls(orientation);
        }
      }
    }
    await page.locator('[data-custom-select="style"]').selectOption("mixed");
    await page.locator('[data-custom-select="barMetricKey"]').selectOption("length");
    await page.locator('[data-custom-select="metricKey"]').selectOption("duration");
    await page.reload({ waitUntil: "domcontentloaded" });
    await chartReady();
    assert.equal(await page.locator('[data-custom-select="barMetricKey"]').inputValue(), "length");
    assert.equal(await page.locator('[data-custom-select="metricKey"]').inputValue(), "duration");
    assert.deepEqual(await page.evaluate(() => Chart.getChart(document.querySelector("#customStatsHost canvas")).data.datasets.map(dataset => dataset.customUnit)), ["meters", "days"]);
    assert.equal(await page.locator('[data-custom-facet="municipalityKey"]').evaluate(element => element.open), false);
    for (const measure of ["duration", "age"]) {
      await page.locator('[data-custom-select="metricKey"]').selectOption(measure);
      await chartReady();
      const displayed = await page.evaluate(() => {
        const chart = Chart.getChart(document.querySelector("#customStatsHost canvas"));
        const dataset = chart.data.datasets[1];
        const index = dataset.data.findIndex(value => value > 0);
        const column = document.querySelector('[data-custom-sort="value"]').closest("th").cellIndex;
        const row = [...document.querySelector(".custom-table-scroll tbody").rows].find(entry => entry.cells[0].textContent === chart.data.labels[index]);
        return { months: dataset.data[index], table: row.cells[column].textContent,
          tooltip: chart.options.plugins.tooltip.callbacks.label({ raw: dataset.data[index], dataset }), unit: window.t("stats.custom.months") };
      });
      const valueText = displayed.months < 0.1 ? "<0.1" : new Intl.NumberFormat("en-CA", { maximumFractionDigits: 1 }).format(displayed.months);
      assert.equal(displayed.table, `${valueText} ${displayed.unit}`);
      assert.ok(displayed.tooltip.includes(`${valueText} ${displayed.unit}`), JSON.stringify(displayed));
    }
    for (const removedStyle of ["scatter", "bubble"]) {
      await page.evaluate(style => {
        const selection = JSON.parse(localStorage.getItem("entraves-custom-chart-v1"));
        localStorage.setItem("entraves-custom-chart-v1", JSON.stringify({ ...selection, style, metricKey: "count", filters: { sourceKind: ["uci-wfs"] } }));
      }, removedStyle);
      await page.reload({ waitUntil: "domcontentloaded" });
      await chartReady();
      assert.equal(await page.locator('[data-custom-select="style"]').inputValue(), "bar");
      assert.equal(await page.locator('[data-custom-select="metricKey"]').inputValue(), "count");
      assert.equal(await page.locator('[data-custom-select="groupFieldKey"]').inputValue(), "sourceKind");
      assert.equal(await page.locator("[data-custom-extremes], [data-custom-select=xyColorField]").count(), 0);
      assert.equal(await page.locator('[data-custom-options="sourceKind"] input:checked').count(), 1);
      assert.equal(await page.locator('[data-custom-options="sourceKind"] input:checked').inputValue(), JSON.stringify("uci-wfs"));
    }
    await page.locator("[data-custom-reset]").click();
    await scopeAll();
    await chartReady();
    await page.locator('[data-custom-select="style"]').selectOption("bar");
    await page.locator('[data-custom-select="groupFieldKey"]').selectOption("sourceKind");
    await page.locator('[data-custom-select="metricKey"]').selectOption("share");
    await page.locator("[data-custom-resize]").press("ArrowRight");
    await page.reload({ waitUntil: "domcontentloaded" });
    await chartReady();
    assert.equal(await page.locator('[data-custom-select="groupFieldKey"]').inputValue(), "sourceKind");
    assert.equal(await page.locator('[data-custom-select="metricKey"]').inputValue(), "share");
    assert.equal(await page.locator(".custom-controls details[open]").count(), 0, "Saved grouping and filters must not reopen sections on load");
    assert.equal(await page.locator("[data-custom-resize]").getAttribute("aria-valuenow"), "270");
    await page.setViewportSize({ width: 320, height: 1000 });
    await page.reload({ waitUntil: "domcontentloaded" });
    await chartReady();
    assert.equal(await page.locator(".custom-controls").evaluate(element => element.open), false);
    assert.equal(await page.locator(".custom-controls details[open]").count(), 0, "All sections must also start collapsed on mobile");
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.locator("[data-custom-resize]").press("Home");
    await page.locator('[data-stats-tab="how"]').click();
    await page.waitForSelector('.stats-card[data-card="how"]');
    await page.locator('[data-stats-tab="custom"]').click();
    await chartReady();
    assert.equal(await page.locator('[data-custom-select="groupFieldKey"]').inputValue(), "sourceKind");

    failChart = true;
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForSelector(".custom-chart-error:not([hidden])", { timeout: 25000 });
    assert.ok(await page.locator(".custom-values").evaluate(element => element.open));
    assert.ok(await page.locator(".custom-table-scroll tbody tr").count() > 0);
    failChart = false;
    await page.locator("[data-custom-retry]").click();
    await chartReady();
    assert.ok(await page.locator(".custom-chart-error").evaluate(element => element.hidden));
    assert.deepEqual(errors, []);
    console.log("Custom browser: seven chart families, removed scatter/bubble absent from controls and help, legacy preferences fall back to bars, months with at most one decimal, collapsed filters, responsive FR/EN at 320/768/1440, persistence, tables and Chart.js retry passed.");
    await context.close();
  } finally {
    await browser.close();
  }
}
