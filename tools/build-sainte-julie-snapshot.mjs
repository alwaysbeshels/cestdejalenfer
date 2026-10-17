import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { chromium } from "playwright";

const OUTPUT = "data/sainte-julie-worksites-snapshot.json";
const MAP_URL = "https://saintejulie.ca/fr/carte/travaux";
const API_URL = "https://saintejulie.ca/action.stejulie.location.json?category=travaux&lang=fr";
const TRAVAUX_URL = "https://saintejulie.ca/travaux";
const TIME_ZONE = "America/Toronto";
const previousSnapshot = JSON.parse(await readFile(OUTPUT, "utf8"));
const recordSupplementalReview = process.argv.includes("--review-supplemental-sources");
const MONTHS = {
  janvier: 1, fevrier: 2, mars: 3, avril: 4, mai: 5, juin: 6,
  juillet: 7, aout: 8, septembre: 9, octobre: 10, novembre: 11, decembre: 12
};

function localDate(date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit"
  }).format(date);
}

function decodeHtml(value) {
  const named = {
    amp: "&", apos: "'", nbsp: " ", quot: "\"", lt: "<", gt: ">",
    rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", ndash: "–", mdash: "—",
    eacute: "é", egrave: "è", ecirc: "ê", agrave: "à", acirc: "â",
    icirc: "î", ocirc: "ô", ugrave: "ù", ucirc: "û", ccedil: "ç"
  };
  return String(value || "").replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, key) => {
    if (key[0] === "#") {
      const code = key[1].toLowerCase() === "x" ? Number.parseInt(key.slice(2), 16) : Number(key.slice(1));
      return Number.isFinite(code) ? String.fromCodePoint(code) : entity;
    }
    return named[key.toLowerCase()] ?? entity;
  });
}

function htmlToText(value) {
  return decodeHtml(String(value || "").replace(/<br\s*\/?>/gi, "\n").replace(/<\/p\s*>/gi, "\n"))
    .replace(/<[^>]*>/g, " ").replace(/[\u00a0\u202f]/g, " ")
    .split(/\r?\n/).map((line) => line.replace(/\s+/g, " ").trim()).filter(Boolean).join("\n");
}

function sourceName(record) {
  return record.name?.fr || record.title?.fr || record.id;
}

function sourceDescription(record) {
  return record.description?.fr || "";
}

function validPoint(record) {
  if (!Array.isArray(record.position) || record.position.length < 2) return null;
  const latitude = Number(record.position[0]);
  const longitude = Number(record.position[1]);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)
    || latitude < 45 || latitude > 47 || longitude < -75 || longitude > -72) return null;
  return [longitude, latitude];
}

async function captureSupplementalReview() {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.route("**/*", (route) => ["font", "media"].includes(route.request().resourceType())
      ? route.abort()
      : route.continue());
    const response = await page.goto(TRAVAUX_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
    if (!response || response.status() !== 200 || new URL(page.url()).origin !== "https://saintejulie.ca") {
      throw new Error("Sainte-Julie's editorial works page failed validation");
    }
    const content = await page.evaluate(() => {
      const root = document.querySelector("main") || document.body;
      return {
        title: document.title,
        text: root.innerText.replace(/\n{3,}/g, "\n\n").trim(),
        links: [...root.querySelectorAll("a[href]")].map((anchor) => ({
          title: (anchor.innerText || "").replace(/\s+/g, " ").trim(),
          url: anchor.href
        })).filter((item) => item.url.startsWith(location.origin) && item.url !== location.href && !item.url.includes("#")),
        images: [...root.querySelectorAll("img[src]")].map((image) => ({
          url: image.currentSrc || image.src,
          alt: image.alt || ""
        })).filter((image) => image.url.startsWith("https://"))
      };
    });
    if (!content.title || !/Seuls les travaux pr[eé]vus sont indiqu[eé]s/i.test(content.text)) {
      throw new Error("Sainte-Julie works page changed its published-scope disclaimer; review before updating");
    }
    const reviewedImages = new Map([
      ["Banniere_Travaux-1440w.jpg", {
        sha256: "c6726fb414971dee97d663c206650736c77cdeda607ab991e2568469c1b439c4",
        observations: ["Generic decorative city-map banner with no named road or restriction geometry."]
      }],
      ["parcArthurGatuhier_18-5.png", {
        sha256: "46655587165938e8c9f0ced0c862ed19831725a5225a2874f7d8bedbb8da38ec",
        observations: ["Architectural rendering of the Arthur-Gauthier park playground and courts; not a georeferenced traffic or pedestrian-closure plan."]
      }],
      ["parcArthurGatuhier_5-12.png", {
        sha256: "9413e67b01a808134cce3b8f0505d808e1a33774d3a1df62906f23262dae44bd",
        observations: ["Architectural rendering of playground equipment and park paths; it does not publish a closure, side, date, or georeferenced route."]
      }]
    ]);
    const mediaReview = [];
    for (const image of content.images) {
      const address = new URL(image.url);
      if (address.origin !== "https://saintejulie.ca") throw new Error(`Unexpected Sainte-Julie image host ${address.href}`);
      const expected = reviewedImages.get(address.pathname.split("/").at(-1));
      if (!expected) throw new Error(`Sainte-Julie page published an unreviewed image: ${address.href}`);
      const mediaResponse = await fetch(address, { signal: AbortSignal.timeout(45000) });
      if (!mediaResponse.ok) throw new Error(`Sainte-Julie image request failed (${mediaResponse.status}): ${address.href}`);
      const contentType = (mediaResponse.headers.get("content-type") || "").split(";")[0].toLowerCase();
      if (!contentType.startsWith("image/")) throw new Error(`Sainte-Julie media is not an image: ${address.href}`);
      const bytes = Buffer.from(await mediaResponse.arrayBuffer());
      const sha256 = createHash("sha256").update(bytes).digest("hex");
      if (sha256 !== expected.sha256) throw new Error(`Sainte-Julie image changed; re-inspect before updating: ${address.href}`);
      mediaReview.push({
        url: address.href,
        alt: image.alt,
        contentType,
        byteLength: bytes.length,
        sha256,
        inspectionStatus: "visually-inspected",
        observations: expected.observations
      });
    }
    if (mediaReview.length !== reviewedImages.size) throw new Error("Sainte-Julie page image inventory changed");
    const current = {
      url: TRAVAUX_URL,
      title: content.title,
      contentSha256: createHash("sha256").update(content.text).digest("hex"),
      links: content.links,
      mediaReview,
      conclusion: "The page lists planned works and says dates are approximate; emergency work is announced on the municipality's social media or alert service. The park images are 2025 concept renderings, not traffic restrictions."
    };
    const fingerprint = createHash("sha256").update(JSON.stringify(current)).digest("hex");
    const previousReview = previousSnapshot.validation?.sainteJulieSupplementalReview;
    if (!previousReview && !recordSupplementalReview) {
      throw new Error("Sainte-Julie has no saved supplemental-page review baseline; inspect the page before the first refresh.");
    }
    if (previousReview && previousReview.fingerprint !== fingerprint && !recordSupplementalReview) {
      throw new Error("Sainte-Julie works page or media changed; preserve the snapshot and review the new source before refreshing.");
    }
    if (previousReview && previousReview.fingerprint === fingerprint && !recordSupplementalReview) {
      return { ...previousReview, checkedAt: new Date().toISOString() };
    }
    return {
      status: "complete",
      reviewedAt: new Date().toISOString(),
      checkedAt: new Date().toISOString(),
      previousRestartPoint: previousReview?.restartPoint || null,
      restartPoint: { url: TRAVAUX_URL, title: content.title, contentSha256: current.contentSha256 },
      ...current,
      fingerprint
    };
  } finally {
    await browser.close();
  }
}

const response = await fetch(API_URL, { headers: { Accept: "application/json" }, cache: "no-store" });
if (!response.ok) throw new Error(`Sainte-Julie source returned ${response.status} ${response.statusText}`);
if (!/json/i.test(response.headers.get("content-type") || "")) throw new Error("Sainte-Julie response is not JSON");
const payload = await response.json();
if (!payload.places || typeof payload.places !== "object" || Array.isArray(payload.places)) {
  throw new Error("Sainte-Julie response does not contain the expected places dictionary");
}

const places = Object.entries(payload.places).map(([key, value]) => ({ ...value, id: String(value.id || key) }));
if (!places.length || new Set(places.map((place) => place.id)).size !== places.length) {
  throw new Error("Sainte-Julie source inventory is empty or has conflicting IDs");
}
const supplementalReview = await captureSupplementalReview();

const extractedAt = new Date().toISOString();
const currentOnlyDate = localDate(new Date());
const record = places.find((place) => place.id === "7021");
if (!record) throw new Error("Sainte-Julie current Fer-à-Cheval project 7021 is missing");

const paragraphs = String(sourceDescription(record)).match(/<p\b[^>]*>[\s\S]*?<\/p>/gi) || [];
const paragraphText = paragraphs.map(htmlToText).filter(Boolean);
const locationText = paragraphText.find((text) => /Travaux de r[eé]fection de l’intersection/i.test(text)) || "";
const dateText = paragraphText.find((text) => /Fin des travaux sur le chemin du Fer-à-Cheval\s*:/i.test(text)) || "";
const detourIndex = paragraphText.findIndex((text) => /^D[eé]tours pr[eé]vus/i.test(text));
const detourText = detourIndex >= 0
  ? [paragraphText[detourIndex], paragraphText[detourIndex + 1]].filter(Boolean).join("\n")
  : "";
const relevantText = [locationText, dateText, detourText].filter(Boolean);
const fullText = htmlToText(sourceDescription(record));
const periodLine = dateText;
const startDate = fullText.match(/D[eé]but des travaux\s*:\s*(\d{1,2})\s+juin\s+(20\d{2})/i);
const startDateJuly = fullText.match(/D[eé]but des travaux\s*:\s*(\d{1,2})\s+juillet\s+(20\d{2})/i);
const startMatch = startDate || startDateJuly;
const startMonth = startDate ? MONTHS.juin : MONTHS.juillet;
const startIso = startMatch
  ? `${startMatch[2]}-${String(startMonth).padStart(2, "0")}-${String(Number(startMatch[1])).padStart(2, "0")}`
  : null;
const approximateEnd = periodLine.match(/fin\s+([a-zà-ÿ]+)\s+(20\d{2})/i);
const monthKey = approximateEnd
  ? approximateEnd[1].normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
  : null;
const endMonth = approximateEnd ? MONTHS[monthKey] : null;
const endMonthKey = approximateEnd && endMonth
  ? `${approximateEnd[2]}-${String(endMonth).padStart(2, "0")}`
  : null;
const currentMonthKey = currentOnlyDate.slice(0, 7);
if (!startIso || !periodLine || !endMonthKey || startIso > currentOnlyDate || currentMonthKey > endMonthKey) {
  throw new Error("Sainte-Julie project 7021 no longer has a published period covering the check date");
}

const point = validPoint(record);
if (!point) throw new Error("Sainte-Julie project 7021 has no valid official point");
if (!/Fin des travaux dans l'intersection\s*:\s*29 ao[uû]t 2026/i.test(fullText)) {
  throw new Error("Sainte-Julie project 7021's published intersection end date changed; inspect before updating");
}

const records = [{
  id: "sainte-julie-7021",
  sourceId: "7021",
  title: sourceName(record),
  streets: relevantText[0],
  startDate: startIso,
  endDate: null,
  currentOnlyDate,
  worksiteOnly: true,
  sourceStatus: "published-period-covers-check-date",
  reportedPeriod: periodLine,
  impact: "La source publie des travaux et des détours, mais ne précise pas de fermeture, de voie touchée ni d’impact automobile.",
  trafficLabel: "Chantier — impact routier non publié",
  severity: "worksite",
  direction: "Direction non publiée.",
  reference: "7021",
  geometry: { type: "Point", coordinates: point },
  point,
  geometryNote: "Point officiel de la carte; il localise les travaux sans tracer la section touchée ni les détours.",
  sourceDescription: relevantText.join("\n"),
  detourText,
  sourceUrl: MAP_URL,
  sourceApiUrl: API_URL,
  periods: [],
  schedule: []
}];

const review = places.filter((place) => place.id !== "7021").map((place) => {
  const title = sourceName(place);
  const text = htmlToText(sourceDescription(place));
  const parkOnly = /\bparc\b/i.test(title);
  const noPublishedStart = /d[eé]but des travaux\s*:\s*(?:à déterminer|avril\b(?!\s+20\d{2}))/i.test(text);
  return {
    id: place.id,
    title,
    sourceStatus: place.categories?.join(", ") || null,
    decision: parkOnly ? "excluded" : "review",
    reason: parkOnly ? "Park construction is not a road restriction."
      : noPublishedStart ? "The source does not publish a usable start date or explicit current status."
        : "The published dates are expired or incomplete for an active automobile impact.",
    sourceDescription: text
  };
});

const snapshot = {
  schemaVersion: 1,
  extractedAt,
  sourceUrl: MAP_URL,
  sourceApiUrl: API_URL,
  municipality: "Ville de Sainte-Julie",
  timeZone: TIME_ZONE,
  validation: { ...(previousSnapshot.validation || {}), sainteJulieSupplementalReview: supplementalReview },
  policy: "The sole retained record is a worksite-only official point. Its approximate end wording is preserved verbatim; it is shown only on the successful check date and is not classified as a road closure.",
  sourceReview: {
    received: places.length,
    retained: records.length,
    reviewCount: review.filter((entry) => entry.decision === "review").length,
    excluded: review.filter((entry) => entry.decision === "excluded").length,
    review
  },
  records
};

await writeFile(OUTPUT, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
console.log(JSON.stringify({
  output: OUTPUT,
  extractedAt,
  received: places.length,
  retained: records.length,
  review: snapshot.sourceReview.reviewCount,
  excluded: snapshot.sourceReview.excluded
}, null, 2));
