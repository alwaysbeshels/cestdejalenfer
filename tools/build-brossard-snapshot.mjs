import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { isDeepStrictEqual } from "node:util";
import { chromium } from "playwright";

const OUTPUT = "data/brossard-roadworks-snapshot.json";
const PAGE_URL = "https://brossard.ca/informations-travaux/";
const MAP_URL = "https://brossard.ca/informations-travaux/#carte";
const SUPPLEMENTAL_URL = "https://brossard.ca/sujets/travaux-et-entraves/";
const PTI_URL = "https://brossard.ca/app/uploads/2025/04/attach_cmsUpload_32cd2f38-f18d-4ed0-a468-396f1030dd26.pdf";
const OPATECH_ORIGIN = "https://brossard.opatech.ca";
const TIME_ZONE = "America/Toronto";
const WEB_MERCATOR_RADIUS = 6378137;
const previousSnapshot = JSON.parse(await readFile(OUTPUT, "utf8"));
const recordSupplementalReview = process.argv.includes("--review-supplemental-sources");

function localDateFromTimestamp(value) {
  const date = new Date(Number(value));
  if (Number.isNaN(date.valueOf())) return null;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit"
  }).format(date);
}

function mercatorToWgs84(x, y) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) throw new Error("Invalid Brossard Web Mercator coordinate");
  return [
    x / WEB_MERCATOR_RADIUS * 180 / Math.PI,
    Math.atan(Math.exp(y / WEB_MERCATOR_RADIUS)) * 360 / Math.PI - 90
  ];
}

function sourceReference(project) {
  const info = project.data?.informations || {};
  return String(info.reference || project.id || info.name || "").replace(/^#/, "").trim();
}

function htmlText(value) {
  return String(value || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p\s*>/gi, "\n")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&rsquo;|&#8217;/gi, "’")
    .replace(/&ndash;|&#8211;/gi, "–")
    .replace(/&eacute;/gi, "é")
    .replace(/&agrave;/gi, "à")
    .replace(/[\u00a0\u202f]/g, " ")
    .split(/\r?\n/).map((line) => line.replace(/\s+/g, " ").trim()).filter(Boolean).join("\n");
}

function projectText(project) {
  const info = project.data?.informations || {};
  const typedImpacts = (Array.isArray(info.trafficImpact?.value) ? info.trafficImpact.value : [])
    .filter((entry) => entry?.status === true)
    .map((entry) => [entry.label_fr || entry.label, entry.content].filter(Boolean).join(": "));
  return [info.comment, info.notes, ...typedImpacts]
    .filter((value) => typeof value === "string" && value.trim())
    .map(htmlText)
    .filter(Boolean)
    .join("\n")
    .trim();
}

function selectedImpactLabels(project) {
  const values = project.data?.informations?.trafficImpact?.value;
  if (!Array.isArray(values)) return [];
  return values.filter((entry) => entry?.status === true)
    .map((entry) => String(entry.label_fr || entry.label || entry.name || "").trim())
    .filter(Boolean);
}

function sourceDates(project) {
  const dates = project.data?.entraves?.date;
  if (!Array.isArray(dates) || dates.length < 2) return null;
  const startDate = localDateFromTimestamp(dates[0]);
  const endDate = localDateFromTimestamp(dates[1]);
  const startTimestamp = Number(dates[0]);
  const endTimestamp = Number(dates[1]);
  return startDate && endDate && startDate <= endDate && Number.isFinite(startTimestamp) && Number.isFinite(endTimestamp)
    ? { startDate, endDate, startTimestamp, endTimestamp }
    : null;
}

function projectGeometries(project) {
  const entries = project.data?.entraves?.entraves;
  if (!Array.isArray(entries)) return [];
  return entries.flatMap((entry) => entry.selected?.path || []);
}

function pathGeometry(project) {
  const paths = projectGeometries(project);
  const lines = [];
  for (const path of paths) {
    const geometry = path.geometry;
    const wkid = Number(geometry?.spatialReference?.latestWkid || geometry?.spatialReference?.wkid);
    if (![3857, 102100].includes(wkid)) throw new Error(`Brossard project ${sourceReference(project)} has an undeclared projection`);
    if (geometry.type === "polyline" && Array.isArray(geometry.paths)) {
      geometry.paths.forEach((line) => {
        if (!Array.isArray(line) || line.length < 2) throw new Error(`Brossard project ${sourceReference(project)} has an invalid line`);
        lines.push(line.map(([x, y]) => mercatorToWgs84(Number(x), Number(y))));
      });
    }
  }
  return lines;
}

function pointGeometry(project) {
  const path = projectGeometries(project).find((entry) => entry.geometry?.type === "point");
  if (!path) return null;
  const geometry = path.geometry;
  const wkid = Number(geometry.spatialReference?.latestWkid || geometry.spatialReference?.wkid);
  if (![3857, 102100].includes(wkid)) throw new Error(`Brossard project ${sourceReference(project)} has an undeclared point projection`);
  return mercatorToWgs84(Number(geometry.x), Number(geometry.y));
}

function assertCoordinates(coordinates, id) {
  const points = coordinates.flat(Infinity);
  if (!points.length || !points.every(Number.isFinite)) throw new Error(`Brossard project ${id} has invalid WGS84 geometry`);
  for (let index = 0; index < points.length; index += 2) {
    if (points[index] < -75 || points[index] > -72 || points[index + 1] < 45 || points[index + 1] > 47) {
      throw new Error(`Brossard project ${id} geometry falls outside the expected source area`);
    }
  }
}

async function captureSupplementalReview(browser, extractedAt) {
  const page = await browser.newPage();
  try {
    const response = await page.goto(SUPPLEMENTAL_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
    if (!response || response.status() !== 200 || new URL(page.url()).origin !== "https://brossard.ca") {
      throw new Error("Brossard work-and-restrictions page failed validation");
    }
    const sourcePage = await page.evaluate(() => {
      const root = document.querySelector("main") || document.body;
      const links = [...root.querySelectorAll("a[href]")].map((anchor) => ({
        title: (anchor.innerText || anchor.parentElement?.innerText || "").replace(/\s+/g, " ").trim(),
        url: anchor.href
      })).filter((item) => item.url.startsWith(location.origin));
      const ptiLinks = links.filter((item) => /\.pdf(?:$|\?)/i.test(item.url));
      if (ptiLinks.length !== 1) throw new Error(`Expected exactly one published PTI PDF, found ${ptiLinks.length}`);
      return {
        url: location.href,
        title: document.title,
        text: root.innerText.replace(/\n{3,}/g, "\n\n").trim(),
        links,
        ptiUrl: ptiLinks[0].url
      };
    });
    if (sourcePage.ptiUrl !== PTI_URL) throw new Error("Brossard PTI link changed; review the newly published document");
    const pdfResponse = await page.request.get(PTI_URL, { timeout: 90000 });
    if (pdfResponse.status() !== 200 || !/application\/pdf/i.test(pdfResponse.headers()["content-type"] || "")) {
      throw new Error(`Brossard PTI PDF failed validation (HTTP ${pdfResponse.status()})`);
    }
    const pdfBytes = await pdfResponse.body();
    const current = {
      page: {
        url: sourcePage.url,
        title: sourcePage.title,
        contentSha256: createHash("sha256").update(sourcePage.text).digest("hex"),
        links: sourcePage.links.filter((item) => /travaux|carte|PTI|immobilisation/i.test(`${item.title} ${item.url}`))
      },
      pti: {
        url: PTI_URL,
        contentType: pdfResponse.headers()["content-type"].split(";")[0],
        byteLength: pdfBytes.length,
        sha256: createHash("sha256").update(pdfBytes).digest("hex")
      }
    };
    const fingerprint = createHash("sha256").update(JSON.stringify(current)).digest("hex");
    const previousReview = previousSnapshot.validation?.brossardSupplementalReview;
    if (!previousReview && !recordSupplementalReview) {
      throw new Error("Brossard has no saved review baseline for its extra page/PTI; inspect both before refreshing.");
    }
    if (previousReview && previousReview.fingerprint !== fingerprint && !recordSupplementalReview) {
      throw new Error("Brossard supplemental page or PTI changed; preserve the snapshot and review the changed source first.");
    }
    if (previousReview && previousReview.fingerprint === fingerprint && !recordSupplementalReview) {
      return { ...previousReview, checkedAt: extractedAt };
    }
    return {
      status: "complete",
      reviewedAt: extractedAt,
      checkedAt: extractedAt,
      previousRestartPoint: previousReview?.restartPoint || null,
      restartPoint: { url: PTI_URL, title: "Programme triennal d’immobilisation 2024-2025-2026", sha256: current.pti.sha256 },
      ...current,
      fingerprint,
      decisions: [
        {
          url: SUPPLEMENTAL_URL,
          decision: "context-only",
          reason: "La page dirige les usagers vers la carte pour les travaux courants; son texte général ne constitue pas un avis d’entrave distinct."
        },
        {
          url: PTI_URL,
          decision: "reviewed-no-traffic-record",
          reason: "Le plan cartographique 2024–2026 situe des projets d’immobilisation, mais ne publie pas d’intervalle d’entrave, de fermeture ou de configuration temporaire. Les traits et couleurs du plan ne sont pas numérisés ni utilisés pour classer un impact."
        }
      ],
      mediaReview: [{
        url: PTI_URL,
        sha256: current.pti.sha256,
        inspectionStatus: "visually-inspected",
        pageCount: 1,
        observations: ["La page unique est un plan de projets d’immobilisation 2024–2026; aucun intervalle de fermeture ou impact routier propre à un avis n’est publié."]
      }]
    };
  } finally {
    await page.close();
  }
}

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  const initialPost = page.waitForResponse((response) => response.url() === `${OPATECH_ORIGIN}/public/get_projects`
    && response.request().method() === "POST", { timeout: 60000 });
  await page.goto(PAGE_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  const initialResponse = await initialPost;
  if (!initialResponse.ok()) throw new Error(`Brossard's official map POST returned ${initialResponse.status()}`);
  const requestBody = JSON.parse(initialResponse.request().postData() || "{}");
  if (requestBody.city !== "brossard") throw new Error("Brossard map request did not identify the expected city");

  const frame = page.frames().find((candidate) => candidate.url().startsWith(`${OPATECH_ORIGIN}/`));
  if (!frame) throw new Error("The official Brossard OpaTech map frame was not found");
  const response = await frame.evaluate(async (body) => {
    const result = await fetch("/public/get_projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, auto: true, pieton: false, cycliste: false }),
      cache: "no-store"
    });
    return {
      status: result.status,
      contentType: result.headers.get("content-type"),
      payload: await result.json()
    };
  }, requestBody);

  if (response.status !== 200 || !/json/i.test(response.contentType || "")
    || !Array.isArray(response.payload?.data)) {
    throw new Error(`Brossard auto-mode response is invalid (${response.status})`);
  }

  const projects = response.payload.data;
  const ids = projects.map(sourceReference);
  if (!projects.length || ids.some((id) => !id) || new Set(ids).size !== ids.length) {
    throw new Error("Brossard auto-mode project identities are missing or conflicting");
  }

  const extractedAt = new Date().toISOString();
  const retained = [];
  const review = [];
  const excluded = [];

  for (const project of projects) {
    const info = project.data?.informations || {};
    const reference = sourceReference(project);
    const dates = sourceDates(project);
    const text = projectText(project);
    const labels = selectedImpactLabels(project);
    if (dates?.endTimestamp && dates.endTimestamp < Date.parse(extractedAt)) {
      excluded.push({ id: reference, title: info.name || "", publishedPeriod: dates, reason: "Published end date is before the extraction date.", sourceDescription: text });
      continue;
    }

    if (reference === "2026-GEN-206") {
      if (!dates || !/Grande All[eé]e/i.test(info.name || "")
        || !/entre Arthur et Anthony/i.test(text)
        || !/Fermeture des voies du côté Brossard/i.test(text)
        || !/d[eé]viation de la circulation du côté Longueuil/i.test(text)) {
        throw new Error("Brossard Grande Allée notice changed; inspect its new text and dates before updating");
      }
      const coordinates = pathGeometry(project);
      if (coordinates.length !== 6) throw new Error("Brossard Grande Allée no longer publishes the six reviewed line parts");
      assertCoordinates(coordinates, reference);
      retained.push({
        id: "brossard-2026-GEN-206",
        sourceId: reference,
        title: info.name,
        streets: "Grande Allée, entre Arthur et Anthony.",
        startDate: dates.startDate,
        endDate: dates.endDate,
        impact: text,
        trafficLabels: ["Fermeture des voies du côté Brossard", "Déviation de la circulation du côté Longueuil"],
        trafficLabel: "Voies touchées",
        severity: "major",
        direction: "La source nomme les côtés Brossard et Longueuil, mais ne publie pas la direction de déplacement.",
        reference,
        geometry: { type: "MultiLineString", coordinates },
        suppressDirectionArrows: true,
        geometryNote: "Six chemins officiels sont conservés séparément. La source ne relie pas ces chemins à une direction temporaire précise.",
        sourceDescription: text,
        sourceModifiedAt: info.modifiedAt || null,
        sourceStartTimestamp: project.data.entraves.date[0],
        sourceEndTimestamp: project.data.entraves.date[1],
        sourceStatus: info.status || null,
        sourceUrl: MAP_URL,
        sourceMapUrl: MAP_URL,
        periods: [],
        schedule: []
      });
      continue;
    }

    if (reference === "2026-12018") {
      if (!dates || !labels.some((label) => /entrave partielle/i.test(label))
        || !/Largeur de rue r[eé]duite/i.test(text)) {
        throw new Error("Brossard permit 2026-12018 changed; inspect its new traffic-impact fields before updating");
      }
      const point = pointGeometry(project);
      if (!point) throw new Error("Brossard permit 2026-12018 no longer publishes a point");
      assertCoordinates(point, reference);
      retained.push({
        id: "brossard-2026-12018",
        sourceId: reference,
        title: info.name,
        streets: "Localisation indiquée par le point officiel du permis.",
        startDate: dates.startDate,
        endDate: dates.endDate,
        impact: labels.join("; "),
        trafficLabels: labels,
        trafficLabel: labels[0],
        severity: "moderate",
        direction: "Direction non publiée.",
        reference,
        geometry: { type: "Point", coordinates: point },
        suppressDirectionArrows: true,
        geometryNote: "Point officiel du permis; la géométrie ne délimite pas l'emprise routière réduite.",
        sourceDescription: text,
        sourceModifiedAt: info.modifiedAt || null,
        sourceStartTimestamp: project.data.entraves.date[0],
        sourceEndTimestamp: project.data.entraves.date[1],
        sourceStatus: info.status || null,
        sourceUrl: MAP_URL,
        sourceMapUrl: MAP_URL,
        periods: [],
        schedule: []
      });
      continue;
    }

    const candidate = {
      id: reference,
      title: info.name || "",
      publishedPeriod: dates,
      trafficLabels: labels,
      sourceDescription: text,
      planAvailable: info.documents?.plan === true,
      decision: "review",
      reason: "No distinct automobile impact and geometry combination was established from the published fields."
    };
    if (candidate.planAvailable) {
      candidate.reason = "A plan is flagged by the map, but no public plan URL is exposed in the official response; traffic impact remains unverified.";
    }
    review.push(candidate);
  }

  if (retained.length !== 2
    || !retained.some((record) => record.geometry.type === "MultiLineString")
    || !retained.some((record) => record.geometry.type === "Point")) {
    throw new Error("Brossard's reviewed snapshot does not contain the two admissible official records");
  }
  const supplementalReview = await captureSupplementalReview(browser, extractedAt);

  const snapshot = {
    schemaVersion: 1,
    extractedAt,
    sourceUrl: MAP_URL,
    municipality: "Ville de Brossard",
    timeZone: TIME_ZONE,
    validation: { ...(previousSnapshot.validation || {}), brossardSupplementalReview: supplementalReview },
    captureMethod: "The official OpaTech iframe's successful same-origin POST, repeated with its published auto=true filter; no frontend proxy.",
    request: { city: "brossard", auto: true, pieton: false, cycliste: false },
    sourceReview: {
      received: projects.length,
      retained: retained.length,
      reviewCount: review.length,
      excluded: excluded.length,
      review,
      exclusions: excluded
    },
    records: retained
  };

  await writeFile(OUTPUT, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({
    output: OUTPUT,
    extractedAt,
    received: projects.length,
    retained: retained.length,
    review: review.length,
    excluded: excluded.length,
    geometryTypes: retained.reduce((counts, record) => {
      counts[record.geometry.type] = (counts[record.geometry.type] || 0) + 1;
      return counts;
    }, {})
  }, null, 2));
} finally {
  await browser.close();
}
