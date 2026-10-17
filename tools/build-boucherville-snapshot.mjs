import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { isDeepStrictEqual } from "node:util";
import { chromium } from "playwright";

const OUTPUT = "data/boucherville-roadworks-snapshot.json";
const MAP_URL = "https://www.boucherville.ca/carte-interactive/?_poi_categories=avis-de-travaux";
const POSTS_URL = "https://www.boucherville.ca/wp-json/wp/v2/point_of_interest?per_page=100&point_of_interest_category=646&_fields=id,date,modified,slug,title,link,point_of_interest_category";
const PROJECTS_URL = "https://www.boucherville.ca/travaux-infrastructures/chantiers-projets/";
const SUPPLEMENTAL_URLS = [
  "https://www.boucherville.ca/travaux-infrastructures/chantiers-projets/avis-travaux/",
  "https://www.boucherville.ca/travaux-infrastructures/chantiers-projets/quoi-faire/",
  "https://www.boucherville.ca/travaux-infrastructures/chantiers-projets/construction-dun-complexe-multisport/",
  "https://www.boucherville.ca/travaux-infrastructures/chantiers-projets/travaux-prevus/"
];
const TIME_ZONE = "America/Toronto";
const previousSnapshot = JSON.parse(await readFile(OUTPUT, "utf8"));
const recordSupplementalReview = process.argv.includes("--review-supplemental-sources");
const BOUCHERVILLE_2026_PLAN_REVIEW = [
  { title: "Resurfaçage du Chemin d’Anjou", publishedPeriod: "27 avril au 2 juin 2026", decision: "excluded-expired", reason: "Le chantier est terminé avant la vérification." },
  { title: "Réaménagement de la rue de Normandie et du stationnement du parc de Normandie", publishedPeriod: "11 mai au 18 septembre 2026", decision: "excluded-expired", reason: "Le chantier est terminé avant la vérification." },
  { title: "Réfection des rues De Noyon, Père-Le Jeune et Jean-Plouf", publishedPeriod: "19 mai à la fin octobre 2026", decision: "review", reason: "La fin est approximative et la page ne publie pas l’impact routier ni une géométrie de restriction." },
  { title: "Ajout d’un sentier asphalté sur le chemin Du Tremblay (phase 1)", publishedPeriod: "25 mai à la fin juin 2026", decision: "excluded-expired", reason: "Le chantier est terminé avant la vérification." },
  { title: "Resurfaçage de diverses rues et du parc des Ateliers — secteur Le Laboureur", publishedPeriod: "6 jours entre le 31 août et le 30 octobre 2026", decision: "review", reason: "Les jours exacts et les impacts automobiles ne sont pas publiés." },
  { title: "Resurfaçage de diverses rues — secteur Claude-Dauzat", publishedPeriod: "6 jours en octobre 2026", decision: "review", reason: "Les jours exacts et les impacts automobiles ne sont pas publiés." },
  { title: "Resurfaçage de la rue des Vétérans", publishedPeriod: "4 jours en octobre 2026", decision: "review", reason: "Les jours exacts et les impacts automobiles ne sont pas publiés." },
  { title: "Resurfaçage de la rue Jacques-Viau", publishedPeriod: "4 jours d’ici le 28 août 2026", decision: "excluded-expired", reason: "La période publiée est passée." },
  { title: "Resurfaçage du boulevard du Fort-Saint-Louis", publishedPeriod: "6 nuits d’ici le 28 août 2026", decision: "excluded-expired", reason: "La période publiée est passée." },
  { title: "Ajout d’un sentier asphalté sur le chemin Du Tremblay (phase 2)", publishedPeriod: "Automne 2026", decision: "review", reason: "La période n’est publiée qu’à la saison et aucun impact routier n’est donné." },
  { title: "Piste cyclable du boulevard Fort-Saint-Louis", publishedPeriod: "Début des travaux : octobre 2026", decision: "review", reason: "Le plan ne donne ni fin ni impact. Ses limites (« stationnement des taxis ») ne concordent pas exactement avec le segment Cicot Sud du repère 69054; les sources ne sont pas fusionnées." },
  { title: "Terrain de baseball synthétique au parc Pierre-Laporte", publishedPeriod: "Fin des travaux : juillet 2026", decision: "excluded-expired", reason: "Le chantier est terminé avant la vérification." },
  { title: "Finition des travaux au parc des Ateliers", publishedPeriod: "Fin mai à fin juin 2026", decision: "excluded-expired", reason: "Le chantier est terminé avant la vérification." },
  { title: "Installation de bornes électriques pour vélos au Club d’aviron", publishedPeriod: "Été 2026", decision: "review", reason: "La période est saisonnière et aucun impact routier n’est publié." },
  { title: "Construction d’un complexe multisport", publishedPeriod: "Octobre 2024 à octobre 2026", decision: "review", reason: "La page projet confirme la durée, mais ne publie aucune entrave routière ou piétonne." },
  { title: "Mise en place d’une vanne modulante au bassin Vincent-D’Indy", publishedPeriod: "1er au 19 juin 2026", decision: "excluded-expired", reason: "Le chantier est terminé avant la vérification." },
  { title: "Réfection des postes de pompage Jean-Maneau, De Verrazano et Général-Vanier", publishedPeriod: "Début des travaux : automne 2026", decision: "review", reason: "Le plan ne donne pas de dates précises ni d’impact; ne pas fusionner avec le repère 68351 sur Jean-Maneau/Pierre-Piché." },
  { title: "Reprofilage des fossés du secteur Nobel", publishedPeriod: "Début des travaux : automne 2026", decision: "review", reason: "La période n’est publiée qu’à la saison et aucun impact routier n’est donné." },
  { title: "Amélioration du drainage de la rue Joseph-Huet", publishedPeriod: "Début des travaux : automne 2026", decision: "cross-check", reason: "Même intitulé que le repère 69062; le plan ne donne pas de limites ou d’impact additionnels. Conserver les dates et le texte détaillés publiés sur la carte." }
];
const MONTHS = {
  janvier: 1, fevrier: 2, mars: 3, avril: 4, mai: 5, juin: 6,
  juillet: 7, aout: 8, septembre: 9, octobre: 10, novembre: 11, decembre: 12
};

function normalizeText(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u00a0\u202f]/g, " ").replace(/\s+/g, " ").trim();
}

function localDate(date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit"
  }).format(date);
}

function isoDate(dayText, monthText, yearText) {
  const month = MONTHS[normalizeText(monthText).toLowerCase()];
  const day = Number(dayText);
  const year = Number(yearText);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (!month || !Number.isInteger(day) || !Number.isInteger(year)
    || date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null;
  }
  return date.toISOString().slice(0, 10);
}

function parseDateRange(value) {
  const text = normalizeText(value).toLowerCase();
  const range = text.match(/\b(\d{1,2})(?:er)?\s+([a-z]+)\s+(?:au|a|jusqu'au)\s+(\d{1,2})(?:er)?\s+([a-z]+)\s+(20\d{2})\b/);
  if (range) {
    const startDate = isoDate(range[1], range[2], range[5]);
    const endDate = isoDate(range[3], range[4], range[5]);
    if (startDate && endDate && startDate <= endDate) return { startDate, endDate };
  }

  const sameMonth = text.match(/\b(\d{1,2})(?:er)?\s+([a-z]+)\s+et\s+(\d{1,2})(?:er)?\s+([a-z]+)\s+(20\d{2})\b/);
  if (sameMonth && sameMonth[2] === sameMonth[4]) {
    const startDate = isoDate(sameMonth[1], sameMonth[2], sameMonth[5]);
    const endDate = isoDate(sameMonth[3], sameMonth[4], sameMonth[5]);
    if (startDate && endDate && startDate <= endDate) return { startDate, endDate };
  }

  return null;
}

function parseTime(value) {
  const match = value.match(/(\d{1,2})(?::(\d{2})|[ \u00a0\u202f]*h(?:[ \u00a0\u202f]*(\d{2}))?)/i);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2] || match[3] || 0);
  if (hour > 23 || minute > 59) return null;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function parseSchedule(value) {
  const text = normalizeText(value).toLowerCase();
  const hours = [...text.matchAll(/(?:^|[^\d])(\d{1,2})(?::(\d{2})|[ \u00a0\u202f]*h(?:[ \u00a0\u202f]*(\d{2}))?)(?!\d)/gi)]
    .map((match) => parseTime(match[0]))
    .filter(Boolean);
  const days = /lundi\s+au\s+vendredi/.test(text) ? ["Mon", "Tue", "Wed", "Thu", "Fri"] : [];
  if (hours.length < 2) return { periods: [], schedule: [], startTime: null, endTime: null };
  const start = hours[0];
  const end = hours[1];
  return {
    periods: Number(end.slice(0, 2)) <= 22 && Number(start.slice(0, 2)) >= 5 ? ["day"] : ["day", "night"],
    schedule: days.map((day) => ({ day, start, end })),
    startTime: start,
    endTime: end
  };
}

function dateTimeInZone(date, time, timeZone) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const wallClockAsUtc = Date.UTC(year, month - 1, day, hour, minute);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone, timeZoneName: "shortOffset", hour: "2-digit"
  }).formatToParts(new Date(wallClockAsUtc));
  const offset = parts.find((part) => part.type === "timeZoneName")?.value.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/);
  if (!offset) return Number.NaN;
  const minutes = (Number(offset[2]) * 60 + Number(offset[3] || 0)) * (offset[1] === "+" ? 1 : -1);
  return wallClockAsUtc - minutes * 60000;
}

function endedByExtraction(dates, schedule, extractedAt) {
  if (!dates) return false;
  const today = localDate(new Date(extractedAt));
  if (dates.endDate < today) return true;
  if (dates.endDate === today && schedule.endTime) {
    return dateTimeInZone(dates.endDate, schedule.endTime, TIME_ZONE) < Date.parse(extractedAt);
  }
  return false;
}

function assertPoint(marker, id) {
  const latitude = Number(marker.location?.lat);
  const longitude = Number(marker.location?.lng);
  if (marker.coordinateType !== "point" || !Number.isFinite(latitude) || !Number.isFinite(longitude)
    || latitude < 45 || latitude > 47 || longitude < -75 || longitude > -72) {
    throw new Error(`Boucherville marker ${id} has no valid published point`);
  }
  return [longitude, latitude];
}

async function captureSupplementalReview(browser, extractedAt) {
  const page = await browser.newPage();
  try {
    const urls = [PROJECTS_URL, ...SUPPLEMENTAL_URLS];
    const pages = [];
    let projectIndexLinks = [];
    for (const url of urls) {
      const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
      if (!response || response.status() !== 200 || new URL(page.url()).origin !== "https://www.boucherville.ca") {
        throw new Error(`Boucherville supplemental source failed validation: ${url}`);
      }
      const content = await page.evaluate(() => {
        const root = document.querySelector("main") || document.body;
        const text = [root.innerText, ...[...root.querySelectorAll(".collapse,details")].map((element) => element.textContent)]
          .filter(Boolean).join("\n").replace(/\s+/g, " ").trim();
        const links = [...root.querySelectorAll("a[href]")].map((anchor) => ({
          title: (anchor.innerText || anchor.parentElement?.innerText || "").replace(/\s+/g, " ").trim(),
          url: anchor.href
        })).filter((item) => item.url.startsWith(location.origin));
        const imageReferences = [...root.querySelectorAll("img")].map((image) => ({
          title: image.alt || image.title || "",
          url: image.currentSrc || image.src
        })).filter((image) => image.url && !image.url.startsWith("data:"));
        return {
          title: document.title,
          text,
          links,
          imageReferences,
          modifiedAt: document.querySelector('meta[property="article:modified_time"]')?.content || null
        };
      });
      if (!content.title || content.text.length < 40) {
        throw new Error(`Boucherville supplemental page has no complete published text: ${url}`);
      }
      if (url === PROJECTS_URL) {
        projectIndexLinks = content.links
          .filter((item) => item.url.startsWith(`${PROJECTS_URL}`) && item.url !== PROJECTS_URL && !item.url.includes("#"))
          .map((item) => item.url);
        if (!isDeepStrictEqual(projectIndexLinks, SUPPLEMENTAL_URLS)) {
          throw new Error("Boucherville projects index changed its linked-page inventory; review the new pages before refreshing");
        }
      }
      pages.push({
        url,
        title: content.title,
        sourceModifiedAt: content.modifiedAt,
        contentSha256: createHash("sha256").update(content.text).digest("hex"),
        links: content.links.filter((item) => /travaux|avis|projet|chantier|fermet|circul|route|rue|quebec511/i.test(`${item.title} ${item.url}`)),
        imageReferences: content.imageReferences
      });
    }

    const review = {
      status: "complete",
      checkedAt: extractedAt,
      reviewedAt: previousSnapshot.validation?.bouchervilleReview?.reviewedAt || extractedAt,
      previousRestartPoint: previousSnapshot.validation?.bouchervilleReview?.restartPoint || null,
      restartPoint: {
        url: `${PROJECTS_URL}travaux-prevus/`,
        title: "Travaux prévus",
        period: "2026",
        contentSha256: pages.find((item) => item.url.endsWith("/travaux-prevus/")).contentSha256
      },
      indexUrl: PROJECTS_URL,
      noticeInventory: pages,
      decisions: [
        {
          url: PROJECTS_URL,
          decision: "reviewed-index",
          reason: "The index lists the current/future works pages; the individual traffic details are published separately."
        },
        {
          url: SUPPLEMENTAL_URLS[0],
          decision: "map-source-only",
          reason: "The page describes the official map and points users to it for current roadwork impacts; no separate restriction record is published in the page text."
        },
        {
          url: SUPPLEMENTAL_URLS[1],
          decision: "excluded-guidance",
          reason: "General resident guidance; it does not identify a dated road or pedestrian restriction."
        },
        {
          url: SUPPLEMENTAL_URLS[2],
          decision: "excluded-project",
          reason: "The multisport complex is published at 545 boulevard de Mortagne, with work from October 2024 for 24 months, but the page publishes no road closure, pedestrian closure, or detour."
        },
        {
          url: SUPPLEMENTAL_URLS[3],
          decision: "reviewed-project-index",
          reason: "The 2026 list gives work periods but no traffic impacts or restriction geometries; some entries are approximate or date-bounded only at month level. Details are published on the work-notice page 7–10 days before each work.",
          projects: BOUCHERVILLE_2026_PLAN_REVIEW
        }
      ]
    };
    const fingerprint = createHash("sha256").update(JSON.stringify({
      indexUrl: review.indexUrl,
      restartPoint: review.restartPoint,
      pages: pages.map(({ url: pageUrl, title, sourceModifiedAt, contentSha256, links, imageReferences }) => ({
        url: pageUrl, title, sourceModifiedAt, contentSha256, links, imageReferences
      }))
    })).digest("hex");
    review.fingerprint = fingerprint;

    const previousReview = previousSnapshot.validation?.bouchervilleReview;
    if (!previousReview && !recordSupplementalReview) {
      throw new Error("Boucherville has no saved review baseline for its supplemental work pages; inspect them before the first refresh.");
    }
    if (previousReview && previousReview.fingerprint !== fingerprint && !recordSupplementalReview) {
      throw new Error("Boucherville supplemental pages changed; preserve the previous snapshot and review the full changed inventory before refreshing.");
    }
    if (previousReview && previousReview.fingerprint === fingerprint && !recordSupplementalReview) {
      return { ...previousReview, checkedAt: extractedAt };
    }
    return review;
  } finally {
    await page.close();
  }
}

function recordBase(marker, post, id, fields, extractedAt) {
  const sourceText = marker.sourceDescription;
  const dates = parseDateRange(`${marker.title}\n${sourceText}`);
  const schedule = parseSchedule(sourceText);
  const point = assertPoint(marker, post.id);
  if (!dates || dates.endDate < localDate(new Date())) throw new Error(`Boucherville notice ${post.id} has no eligible published period`);
  if (marker.imageCount > 0) throw new Error(`Boucherville notice ${post.id} publishes media requiring review`);
  return {
    id,
    sourceId: String(post.id),
    sourceTitle: marker.title,
    title: marker.title,
    startDate: dates.startDate,
    endDate: dates.endDate,
    ...fields,
    periods: schedule.periods,
    schedule: schedule.schedule,
    direction: "Direction non publiée.",
    responsible: "Ville de Boucherville",
    borough: "Boucherville",
    reference: String(post.id),
    geometry: { type: "Point", coordinates: point },
    point,
    sourceDescription: sourceText,
    sourceModified: post.modified,
    sourceUrl: MAP_URL,
    detailUrl: post.link,
    sourceMapUrl: MAP_URL,
    sourceCheckedAt: extractedAt
  };
}

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  await page.goto(MAP_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForFunction(() => Array.isArray(window.FWP_MAP?.markersArray)
    && window.FWP_MAP.markersArray.length > 0, { timeout: 60000 });

  const markers = await page.evaluate(() => {
    const plainText = (value) => new DOMParser().parseFromString(String(value || ""), "text/html")
      .body.textContent.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
    return window.FWP_MAP.markersArray.map((marker) => {
      const post = marker.postdata || {};
      return {
        id: Number(post.ID || marker.post_id),
        title: plainText(post.post_title),
        sourceDescription: plainText(post.particularity),
        sourceModified: post.post_modified || null,
        location: post.location || null,
        coordinateType: post.coordinate_type || null,
        imageCount: Array.isArray(post.images) ? post.images.length : 0
      };
    });
  });

  const rest = await page.evaluate(async (endpoint) => {
    const posts = [];
    let expectedTotal = null;
    let expectedPages = null;
    for (let pageNumber = 1; pageNumber <= 20; pageNumber += 1) {
      const url = new URL(endpoint);
      url.searchParams.set("page", String(pageNumber));
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) throw new Error(`Boucherville WordPress REST returned ${response.status}`);
      const result = await response.json();
      if (!Array.isArray(result)) throw new Error("Boucherville WordPress REST response is not an array");
      expectedTotal ??= Number(response.headers.get("X-WP-Total"));
      expectedPages ??= Number(response.headers.get("X-WP-TotalPages"));
      result.forEach((post) => {
        const title = new DOMParser().parseFromString(post.title?.rendered || "", "text/html").body.textContent.trim();
        posts.push({
          id: Number(post.id),
          title,
          date: post.date || null,
          modified: post.modified || null,
          link: post.link || null,
          categories: post.point_of_interest_category || []
        });
      });
      if (Number.isFinite(expectedPages) && expectedPages > 0 && pageNumber >= expectedPages) break;
      if (result.length < 100) break;
    }
    return { posts, expectedTotal, expectedPages };
  }, POSTS_URL);

  if (!markers.length || !rest.posts.length || (Number.isFinite(rest.expectedTotal) && rest.posts.length !== rest.expectedTotal)) {
    throw new Error("Boucherville source inventory is incomplete");
  }
  const markerIds = new Set(markers.map((marker) => marker.id));
  const postIds = new Set(rest.posts.map((post) => post.id));
  if (markerIds.size !== markers.length || postIds.size !== rest.posts.length
    || [...markerIds].some((id) => !postIds.has(id))) {
    throw new Error("Boucherville map markers and complete REST inventory conflict");
  }

  const markerById = new Map(markers.map((marker) => [marker.id, marker]));
  const postById = new Map(rest.posts.map((post) => [post.id, post]));
  const extractedAt = new Date().toISOString();
  const supplementalReview = await captureSupplementalReview(browser, extractedAt);
  const josephHuet = markerById.get(69062);
  const fortSaintLouis = markerById.get(69054);
  const jeanManeau = markerById.get(68351);
  if (!josephHuet || !fortSaintLouis || !jeanManeau) throw new Error("Expected Boucherville notices are missing from the official map");

  const josephText = normalizeText(josephHuet.sourceDescription);
  const fortText = normalizeText(fortSaintLouis.sourceDescription);
  const jeanTitle = normalizeText(jeanManeau.title);
  if (!/totale.*section.*joseph.?huet/i.test(josephText)
    || !/entrave partielle.*pierre.?larriv[eé].*jean.?d[eé]sy/i.test(josephText)
    || !/piste multifonctionnelle/i.test(fortText)
    || !/fermeture d.?une voie/i.test(fortText)
    || !/maintien d.?au minimum une voie.*par direction/i.test(fortText)
    || !/fermeture compl[eè]te.*intersection.*jean.?maneau.*pierre.?pich[eé]/i.test(jeanTitle)) {
    throw new Error("Boucherville's reviewed impact wording has changed; inspect the new notice before updating");
  }

  const records = [
    recordBase(josephHuet, postById.get(69062), "boucherville-69062-joseph-huet", {
      streets: "Rue Joseph-Huet, section autour du parc.",
      impact: "Entrave totale sur une section de la rue Joseph-Huet autour du parc; détour occasionnel.",
      trafficLabels: ["Entrave totale"],
      trafficLabel: "Fermeture complète",
      severity: "critical",
      geometryNote: "Point officiel de l'avis; il ne délimite pas la section fermée."
    }, extractedAt),
    recordBase(josephHuet, postById.get(69062), "boucherville-69062-pierre-larrive-jean-desy", {
      streets: "Rues Pierre-Larrivé et Jean-Désy.",
      impact: "Entrave partielle sur les rues Pierre-Larrivé et Jean-Désy.",
      trafficLabels: ["Entrave partielle"],
      trafficLabel: "Accès limité",
      severity: "moderate",
      geometryNote: "Point officiel du projet; il ne localise pas précisément les entraves partielles sur ces deux rues."
    }, extractedAt),
    recordBase(fortSaintLouis, postById.get(69054), "boucherville-69054-fort-saint-louis", {
      streets: "Boulevard du Fort-Saint-Louis, entre le boulevard De Montarville et la rue Cicot Sud.",
      impact: "Fermeture d’une voie de circulation pour l’aménagement d’une piste multifonctionnelle temporaire. Maintien d’au minimum une voie de circulation par direction.",
      trafficLabels: ["Fermeture d’une voie de circulation", "Maintien d’au minimum une voie par direction"],
      trafficLabel: "Voie touchée",
      severity: "major",
      geometryNote: "Point officiel du projet; il ne délimite pas la voie automobile ni la piste multifonctionnelle."
    }, extractedAt),
    recordBase(jeanManeau, postById.get(68351), "boucherville-68351-jean-maneau-pierre-piche", {
      streets: "Intersection des rues Jean-Maneau et Pierre-Piché.",
      impact: "Fermeture complète de l’intersection des rues Jean-Maneau et Pierre-Piché.",
      trafficLabels: ["Fermeture complète"],
      trafficLabel: "Fermeture complète",
      severity: "critical",
      geometryNote: "Point officiel de l'avis; il ne délimite pas l'intersection ni les détours annoncés."
    }, extractedAt)
  ];

  for (const record of records) {
    if (!postById.has(Number(record.sourceId)) || record.endDate < localDate(new Date())
      || record.geometry.type !== "Point" || !record.geometry.coordinates.every(Number.isFinite)) {
      throw new Error(`Invalid Boucherville snapshot record ${record.id}`);
    }
  }

  const pedestrianPassage = "Fermeture de la piste multifonctionnelle.";
  const pedestrianRecord = {
    id: "boucherville-69054-shared-path",
    sourceId: "69054",
    title: fortSaintLouis.title,
    streets: "Boulevard du Fort-Saint-Louis, entre le boulevard De Montarville et la rue Cicot Sud.",
    startDate: records[2].startDate,
    endDate: records[2].endDate,
    periods: records[2].periods,
    schedule: records[2].schedule,
    scheduleText: null,
    pedestrianArea: "path",
    affectedUsers: ["pedestrians", "cyclists"],
    severity: "critical",
    impact: pedestrianPassage,
    evidence: { kind: "published-text", text: pedestrianPassage },
    side: { code: "not-applicable", published: null, geometryStatus: "published" },
    geometry: records[2].geometry,
    point: records[2].point,
    geometryNote: "Point officiel du projet; aucun tracé précis de la piste n'est publié.",
    sourceDescription: fortSaintLouis.sourceDescription,
    sourceUrl: MAP_URL,
    detailUrl: postById.get(69054).link,
    sourceModified: postById.get(69054).modified,
    sourceCheckedAt: extractedAt
  };

  const retainedProjectIds = new Set([69062, 69054, 68351]);
  const audit = markers.map((marker) => {
    const post = postById.get(marker.id);
    const dates = parseDateRange(`${marker.title}\n${marker.sourceDescription}`);
    const schedule = parseSchedule(marker.sourceDescription);
    const isRetained = retainedProjectIds.has(marker.id);
    let decision = isRetained ? "retained" : "review";
    let reason = isRetained ? "Published automobile impact and active/future dates; official point retained without inventing a line."
      : "No separately mappable, dated automobile restriction established by the reviewed map fields.";
    if (!isRetained && endedByExtraction(dates, schedule, extractedAt)) {
      decision = "excluded";
      reason = "The published period, including its published end time when available, is over at extraction.";
    }
    if (marker.id === 69018) {
      decision = "excluded";
      reason = "The notice assigns responsibility to Ville de Longueuil, not Ville de Boucherville.";
    } else if (marker.id === 48811) {
      decision = "excluded";
      reason = "The published notice explicitly states there is no traffic obstruction.";
    }
    return {
      id: marker.id,
      title: marker.title,
      modified: post.modified,
      sourceUrl: MAP_URL,
      detailUrl: post.link,
      publishedPeriod: dates,
      decision,
      reason,
      sourceText: marker.sourceDescription
    };
  });

  const markerlessPosts = rest.posts.filter((post) => !markerIds.has(post.id)).map((post) => {
    const dates = parseDateRange(post.title);
    const expired = dates?.endDate && dates.endDate < localDate(new Date(extractedAt));
    return {
      id: post.id,
      title: post.title,
      modified: post.modified,
      sourceUrl: MAP_URL,
      detailUrl: post.link,
      publishedPeriod: dates,
      decision: expired ? "excluded" : "review",
      reason: expired
        ? "The official map publishes no point and the published end date is before extraction."
        : "The official map publishes no point for this notice."
    };
  });

  const snapshot = {
    schemaVersion: 1,
    extractedAt,
    sourceUrl: MAP_URL,
    sourceApiUrl: POSTS_URL,
    municipality: "Ville de Boucherville",
    timeZone: TIME_ZONE,
    validation: { ...(previousSnapshot.validation || {}), bouchervilleReview: supplementalReview },
    sourceReview: {
      method: "Chromium same-origin FacetWP map payload plus complete paginated WordPress REST category inventory.",
      counts: {
        restRecordsReceived: rest.posts.length,
        mapMarkersReceived: markers.length,
        retainedAutomobileImpacts: records.length,
        retainedPedestrianImpacts: 1,
        reviewCandidates: audit.filter((entry) => entry.decision === "review").length,
        excludedMarkers: audit.filter((entry) => entry.decision === "excluded").length,
        markerlessRecords: markerlessPosts.length
      },
      inventory: [...audit, ...markerlessPosts]
    },
    records,
    pedestrianRecords: [pedestrianRecord]
  };

  await writeFile(OUTPUT, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({
    output: OUTPUT,
    extractedAt,
    restRecords: rest.posts.length,
    mapMarkers: markers.length,
    retainedAutomobileImpacts: records.length,
    retainedPedestrianImpacts: snapshot.pedestrianRecords.length,
    reviewCandidates: snapshot.sourceReview.counts.reviewCandidates,
    excludedMarkers: snapshot.sourceReview.counts.excludedMarkers,
    markerlessRecords: markerlessPosts.length
  }, null, 2));
} finally {
  await browser.close();
}
