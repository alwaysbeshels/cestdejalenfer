import assert from "node:assert/strict";
import { chromium } from "playwright";

const baseUrl = process.env.NAVIGATION_VALIDATION_URL || "http://localhost:5000";
const browser = await chromium.launch({ headless: true });
const reports = [];

async function ready(page, pathname) {
  await page.waitForFunction(expected => location.pathname === expected
    && document.documentElement.hasAttribute("data-page-ready")
    && Boolean(document.querySelector("h1")?.textContent.trim()), pathname, { polling: 100 });
  return page.evaluate(async () => {
    const transition = window.testLocalViewTransition || window.staticPageTransition?.transition;
    const finished = transition ? await transition.finished.then(() => true, () => false) : null;
    return { pathname: location.pathname, search: location.search, language: document.documentElement.lang,
      visible: getComputedStyle(document.body).visibility, transition: finished, title: document.title };
  });
}

async function clickLink(page, selector, pathname) {
  const link = page.locator(selector).first();
  const menu = page.locator("#menuToggle");
  if (await menu.count() && await menu.isVisible() && await link.evaluate(element => Boolean(element.closest("#sidePanel")))
    && await menu.getAttribute("aria-expanded") !== "true") await menu.click();
  const expectedStats = new URL(await link.getAttribute("href"), page.url()).searchParams.get("view") === "stats";
  await link.click();
  await page.waitForFunction(({ pathname, expectedStats }) => location.pathname === pathname
    && document.body.classList.contains("view-stats") === expectedStats, { pathname, expectedStats }, { polling: 100 });
  const state = await ready(page, pathname);
  assert.equal(state.visible, "visible");
  return state;
}

try {
  for (const { language, width, reducedMotion } of [
    { language: "fr", width: 1440, reducedMotion: "no-preference" },
    { language: "en", width: 390, reducedMotion: "reduce" }
  ]) {
    const context = await browser.newContext({ serviceWorkers: "block", viewport: { width, height: 950 }, reducedMotion });
    const page = await context.newPage();
    const errors = [];
    const wrongFrames = [];
    const documents = [];
    const htmlRequests = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("request", request => {
      const url = new URL(request.url());
      if (request.isNavigationRequest()) documents.push(url.pathname + url.search);
      if (request.resourceType() === "fetch" && /^\/(?:index|faq|pedestrian|potholes)\.html$/.test(url.pathname)) htmlRequests.push(url.pathname);
    });
    await page.route("https://**/*", route => /^https:\/\/(unpkg\.com|cdn\.jsdelivr\.net)\//.test(route.request().url()) ? route.continue() : route.abort());
    await page.exposeFunction("recordWrongNavigationFrame", frame => wrongFrames.push(frame));
    await page.addInitScript(() => {
      if (document.startViewTransition) {
        const startTransition = document.startViewTransition.bind(document);
        document.startViewTransition = callback => {
          const transition = startTransition(callback);
          window.testLocalViewTransition = transition;
          return transition;
        };
      }
      const sample = () => {
        const body = document.body;
        const mapElement = document.querySelector("#map");
        if (body && getComputedStyle(body).visibility === "visible" && new URLSearchParams(location.search).get("view") === "stats"
          && mapElement?.getBoundingClientRect().width > 0 && getComputedStyle(mapElement).display !== "none") {
          window.recordWrongNavigationFrame({ url: location.href, className: body.className });
        }
        const stats = document.querySelector("#statsView");
        if (body && getComputedStyle(body).visibility === "visible" && stats && !stats.hidden) {
          const panelWidth = document.querySelector("#sidePanel").getBoundingClientRect().width;
          if (!stats.querySelector(".stats-inner") || (innerWidth > 880 && Math.abs(panelWidth - 96) > 1)) {
            window.recordWrongNavigationFrame({ url: location.href, emptyStats: !stats.querySelector(".stats-inner"), panelWidth });
          }
        }
        requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
    await page.goto(`${baseUrl}/${language}/faq.html`, { waitUntil: "domcontentloaded" });
    await ready(page, `/${language}/faq.html`);
    const states = [];
    states.push(await clickLink(page, '#statsHowFaqLink', `/${language}/`));
    assert.equal(new URL(page.url()).searchParams.get("view"), "stats");
    const beforeLocalSwitch = documents.length;
    states.push(await clickLink(page, '[data-language-page="map"]:not([data-view])', `/${language}/`));
    assert.equal(documents.length, beforeLocalSwitch, "Map/statistics switch reloaded the document");
    states.push(await clickLink(page, '[data-language-page="pedestrian"]', `/${language}/pedestrian.html`));
    states.push(await clickLink(page, '[data-language-page="potholes"]', `/${language}/potholes.html`));
    states.push(await clickLink(page, '[data-language-page="faq"]', `/${language}/faq.html`));
    assert.equal(htmlRequests.filter(pathname => pathname === "/potholes.html").length, 1, "Prepared HTML was fetched twice");
    assert.equal(htmlRequests.filter(pathname => pathname === "/pedestrian.html").length, 1, "Prepared HTML was fetched twice");
    await page.goBack({ waitUntil: "domcontentloaded" });
    await ready(page, `/${language}/potholes.html`);
    await page.goForward({ waitUntil: "domcontentloaded" });
    await ready(page, `/${language}/faq.html`);
    const beforeHash = documents.length;
    await page.locator('.faq-section-link[data-section-hash="#data-title"]').click();
    assert.equal(new URL(page.url()).hash, "#data-title");
    assert.equal(documents.length, beforeHash, "Section link reloaded the FAQ");
    const countBeforeReload = htmlRequests.length;
    await page.reload({ waitUntil: "domcontentloaded" });
    await ready(page, `/${language}/faq.html`);
    assert.equal(htmlRequests.length, countBeforeReload + 1, "Reload reused the one-use HTML handoff");
    assert.deepEqual(wrongFrames, [], "Map flashed before statistics");
    assert.deepEqual(errors, []);
    assert.ok(states.every(state => state.language === language));
    if (reducedMotion === "no-preference") assert.ok(states.every(state => state.transition === true), "Native transition did not finish");
    for (const entry of [`/${language}/`, `/${language}/pedestrian.html`]) {
      await page.goto(`${baseUrl}${entry}`, { waitUntil: "domcontentloaded" });
      await ready(page, entry);
      await page.waitForFunction(() => typeof allClosures !== "undefined" && allClosures.length > 1000, null, { polling: 100 });
      const documentCount = documents.length;
      const state = await clickLink(page, '[data-view="stats"]', `/${language}/`);
      await page.evaluate(() => window.STATS_VIEW.whenReady());
      assert.equal(documents.length - documentCount, entry.endsWith("pedestrian.html") ? 1 : 0, "Unexpected statistics document reload");
      assert.equal(await page.locator('[data-stats-tab="general"]').getAttribute("aria-current"), "page");
      assert.equal(await page.evaluate(() => Math.round(document.querySelector("#sidePanel").getBoundingClientRect().width)), 96);
      if (reducedMotion === "no-preference") assert.equal(state.transition, true, "Map to statistics transition did not finish");
      states.push({ entry, ...state });
    }
    assert.deepEqual(wrongFrames, [], "Empty statistics or animated layout width was displayed");
    assert.deepEqual(errors, []);
    reports.push({ language, width, reducedMotion, states, wrongFrames: wrongFrames.length, documents: documents.length });
    await context.close();
  }

  const context = await browser.newContext({ serviceWorkers: "block" });
  const page = await context.newPage();
  await page.route("https://**/*", route => /^https:\/\/(unpkg\.com|cdn\.jsdelivr\.net)\//.test(route.request().url()) ? route.continue() : route.abort());
  await page.goto(`${baseUrl}/fr/`, { waitUntil: "domcontentloaded" });
  await ready(page, "/fr/");
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  await page.route(`${baseUrl}/faq.html`, async route => { await gate; await route.continue(); });
  const clicking = page.locator('[data-language-page="faq"]').click();
  await page.waitForFunction(() => document.documentElement.hasAttribute("data-navigation-pending"), null, { polling: 100 });
  assert.equal(new URL(page.url()).pathname, "/fr/", "Source page disappeared while destination was loading");
  assert.equal(await page.evaluate(() => getComputedStyle(document.body).visibility), "visible");
  release();
  await clicking;
  await ready(page, "/fr/faq.html");
  await page.unroute(`${baseUrl}/faq.html`);
  await page.addInitScript(() => { ViewTransition.prototype.waitUntil = undefined; });
  await clickLink(page, '[data-language-page="map"]', "/fr/");
  assert.equal(await page.evaluate(() => getComputedStyle(document.body).visibility), "visible", "Unsupported transition left the destination hidden");
  await context.close();
  const raceContext = await browser.newContext({ serviceWorkers: "block" });
  const racePage = await raceContext.newPage();
  let releaseAnalytics;
  let releaseHtml;
  const analyticsGate = new Promise(resolve => { releaseAnalytics = resolve; });
  const htmlGate = new Promise(resolve => { releaseHtml = resolve; });
  await racePage.route("https://**/*", route => /^https:\/\/(unpkg\.com|cdn\.jsdelivr\.net)\//.test(route.request().url()) ? route.continue() : route.abort());
  await racePage.route("https://www.googletagmanager.com/gtag/js*", async route => {
    await analyticsGate;
    await route.fulfill({ contentType: "application/javascript", body: "" });
  });
  await racePage.goto(`${baseUrl}/faq.html`, { waitUntil: "domcontentloaded" });
  await ready(racePage, "/faq.html");
  await racePage.route(`${baseUrl}/index.html`, async route => { await htmlGate; await route.continue(); });
  const earlyClick = racePage.locator('[data-language-page="map"]').first().click();
  await racePage.waitForFunction(() => document.documentElement.hasAttribute("data-navigation-pending"), null, { polling: 100 });
  releaseAnalytics();
  await racePage.waitForFunction(() => document.readyState === "complete", null, { polling: 100 });
  assert.equal(await racePage.evaluate(() => document.documentElement.hasAttribute("data-navigation-pending")), true, "Initial pageshow cancelled the user's click");
  releaseHtml();
  await earlyClick;
  await ready(racePage, "/fr/");
  await raceContext.close();
  console.log(JSON.stringify({ reports, checks: "real cross-page clicks, same-document views, single HTML handoff, fresh reload, back/forward, FAQ anchors, FR/EN, mobile, reduced motion, slow destination, initial-load click race and unsupported-transition fallback passed" }, null, 2));
} finally {
  await browser.close();
}