import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { isDeepStrictEqual } from "node:util";
import { chromium } from "playwright";

const OUTPUT = "data/pedestrian-closures-snapshot.json";
const baseUrl = process.env.PEDESTRIAN_VALIDATION_URL || "http://localhost:5500";
const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto" }).format(new Date());
const SAINTE_CATHERINE_URL = "https://www.ville.sainte-catherine.qc.ca/carte-interactive/?q=S04sSU3PL8pMLVY1dTJQNXWxNTY1VCtOzUlNLklNsQUA";
const SAINTE_CATHERINE_ORIGIN = "https://www.ville.sainte-catherine.qc.ca";
const SAINTE_CATHERINE_ENDPOINT = `${SAINTE_CATHERINE_ORIGIN}/index.php/actions/villeSainteCatherine/maps/getMarker/`;
const SAINTE_CATHERINE_NOTICE_INDEX_URL = "https://www.ville.sainte-catherine.qc.ca/citoyens/informations-pratiques/avis-et-info-travaux/";
const SAINTE_CATHERINE_NOTICE_URLS = [
  `${SAINTE_CATHERINE_NOTICE_INDEX_URL}20261013-it-bds-1720ruecentrale/`,
  `${SAINTE_CATHERINE_NOTICE_INDEX_URL}operation-de-vaccination-contre-la-rage-du-raton-laveur/`,
  `${SAINTE_CATHERINE_NOTICE_INDEX_URL}avis-abritempo/`,
  `${SAINTE_CATHERINE_NOTICE_INDEX_URL}20260921-it-bordures/`,
  `${SAINTE_CATHERINE_NOTICE_INDEX_URL}2026-it-rincage-aqueduc/`,
  `${SAINTE_CATHERINE_NOTICE_INDEX_URL}fermeture-de-piscine-reglement/`
];
const SAINTE_CATHERINE_REVIEWED_AT = "2026-10-17T00:55:14Z";
const SAINTE_CATHERINE_EXPECTED_INVENTORY = [
  {
    indexPosition: 1,
    id: "1040837351",
    title: "Avis préventif d'ébullition de l'eau  - 1720-1724, rue Centrale",
    address: "1724 rue Centrale, Sainte-Catherine",
    categoryId: "351",
    latitude: "45.3943763",
    longitude: "-73.57987059999999",
    descriptionSha256: "02d6d330c7d95ae0f61955c0ee58119aea9baaf6370cba8c6c6220f3466fcaf9",
    media: [{
      url: `${SAINTE_CATHERINE_ORIGIN}/medias/images/alerts/Ved_aqueducs-3.jpg`,
      contentType: "image/jpeg",
      byteLength: 261488,
      sha256: "8b80258ca47a4b4db7f3a6468a7a2aca5c63cdb24ffe243b2ad47e254949bcd8"
    }]
  },
  {
    indexPosition: 2,
    id: "1040499351",
    title: "Travaux de bordures et de trottoirs - Multiples rues",
    address: "5465, boul.Marie-Victorin, Sainte-Catherine",
    categoryId: "351",
    latitude: "45.4053171",
    longitude: "-73.5717217",
    descriptionSha256: "3e910b8b45cffc62b4aeef964c00cac794358dd63b069a0641056e23410a84b4",
    media: [{
      url: `${SAINTE_CATHERINE_ORIGIN}/medias/images/alerts/MU_alerte.jpg`,
      contentType: "image/jpeg",
      byteLength: 89207,
      sha256: "de9a40161fbea5cec6c0a02f6a405d1545231f393d6a97dc07814f5358a20dfd"
    }]
  },
  {
    indexPosition: 3,
    id: "612269351",
    title: "Opération rinçage d'aqueduc à partir de mi-septembre ",
    address: "",
    categoryId: "351",
    latitude: "45.395820",
    longitude: "-73.565743",
    descriptionSha256: "06cb5bb81b60a96c12d0b580f1bb9014410d77a7eaa62ad575b41f51e67b7b29",
    media: [{
      url: `${SAINTE_CATHERINE_ORIGIN}/medias/images/alerts/MU_eau1.jpg`,
      contentType: "image/jpeg",
      byteLength: 80703,
      sha256: "898c2a274d3846b7f93a67ca59a1bb5c41a2e404e2bdf68bf76f139b27b90e1e"
    }]
  }
];
const SAINTE_CATHERINE_MEDIA_REVIEW = [
  {
    url: `${SAINTE_CATHERINE_ORIGIN}/medias/images/alerts/Ved_aqueducs-3.jpg`,
    sha256: "8b80258ca47a4b4db7f3a6468a7a2aca5c63cdb24ffe243b2ad47e254949bcd8",
    inspectionStatus: "visually-inspected",
    inspectedAt: SAINTE_CATHERINE_REVIEWED_AT,
    observations: ["Photo of a damaged water-service pipe; it shows no road, route, or pedestrian geometry."]
  },
  {
    url: `${SAINTE_CATHERINE_ORIGIN}/medias/images/alerts/MU_alerte.jpg`,
    sha256: "de9a40161fbea5cec6c0a02f6a405d1545231f393d6a97dc07814f5358a20dfd",
    inspectionStatus: "visually-inspected",
    inspectedAt: SAINTE_CATHERINE_REVIEWED_AT,
    observations: ["Generic traffic-cone photograph; it contains no site, route, or impact details and its colors are not used for classification."]
  },
  {
    url: `${SAINTE_CATHERINE_ORIGIN}/medias/images/alerts/MU_eau1.jpg`,
    sha256: "898c2a274d3846b7f93a67ca59a1bb5c41a2e404e2bdf68bf76f139b27b90e1e",
    inspectionStatus: "visually-inspected",
    inspectedAt: SAINTE_CATHERINE_REVIEWED_AT,
    observations: ["Photo of water flowing from a tap into a glass; it shows no road or pedestrian geometry."]
  }
];
const SAINTE_CATHERINE_NOTICE_MEDIA_REVIEW = {
  "Ved_travaux-3.jpg": {
    sha256: "07ea33aa223ad4f3cd562f45cf30ac229fd9c0770df6c61f21d9a1fcc553c779",
    observations: ["Generic close-up photograph of traffic cones and a work sign; it identifies no street, side, limit, or route geometry."]
  },
  "ratonlaveur_ved.jpg": {
    sha256: "1443ea6e4b49b05c9717963b9032b06643f4dcacc48dc779075bcabb3f433fce",
    observations: ["Photograph of a raccoon; it contains no roadwork or pedestrian-route information."]
  },
  "ved-abris-auto.jpg": {
    sha256: "62c6b1e7454d4939fad50936ff4706866f63fba194124a3169f4aae7662ba8c4",
    observations: ["Photograph of a snow-covered temporary car shelter on private property; it is not a public-road restriction diagram."]
  },
  "MU_alerte.jpg": {
    sha256: "dbed32d74486f3c7a21716856f7716351391bfb1fa27b0aacafa4a61100e02e6",
    observations: ["Generic photograph of stacked traffic cones; it contains no location, road limits, or closure configuration."]
  },
  "MU_eau1.jpg": {
    sha256: "cd6261ecf326f89790025b9241b3b784067f34edb707537cfa461a4d1b9d8220",
    observations: ["Photograph of water flowing from a tap into a glass; it contains no road or pedestrian geometry."]
  },
  "Ved-securite_piscine.jpg": {
    sha256: "bc379939ca301415b4cf5ac1ba60c0b9a209ab33038ca96bcbcde79140c01ade",
    observations: ["Photograph of a swimming-pool ladder and water; it contains no roadwork information."]
  }
};
const SAINTE_CATHERINE_NOTICE_DECISIONS = new Map([
  [`${SAINTE_CATHERINE_NOTICE_INDEX_URL}20261013-it-bds-1720ruecentrale/`, {
    decision: "excluded",
    reason: "Boil-water advisory for a few addresses; no automobile, sidewalk, or cycling restriction is published."
  }],
  [`${SAINTE_CATHERINE_NOTICE_INDEX_URL}operation-de-vaccination-contre-la-rage-du-raton-laveur/`, {
    decision: "excluded",
    reason: "Wildlife vaccination operation; no road or pedestrian obstruction is published."
  }],
  [`${SAINTE_CATHERINE_NOTICE_INDEX_URL}avis-abritempo/`, {
    decision: "excluded",
    reason: "The published shelter rules concern private driveways and setbacks; they do not announce a public-road closure."
  }],
  [`${SAINTE_CATHERINE_NOTICE_INDEX_URL}20260921-it-bordures/`, {
    decision: "retained-pedestrian-point; automobile-impact-review",
    reason: "The official map's Point confirms sidewalk/curb work on multiple streets. The detail page also announces one-lane closures and alternating traffic, but names no streets or limits; do not create an automobile line or attach that citywide effect to the map Point."
  }],
  [`${SAINTE_CATHERINE_NOTICE_INDEX_URL}2026-it-rincage-aqueduc/`, {
    decision: "excluded",
    reason: "Water-main flushing and possible water-pressure/color changes only; no road or pedestrian closure is published."
  }],
  [`${SAINTE_CATHERINE_NOTICE_INDEX_URL}fermeture-de-piscine-reglement/`, {
    decision: "excluded",
    reason: "The notice concerns residential-pool draining rules; it is not a temporary mobility restriction."
  }]
]);

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function parseSainteCatherinePeriod(text) {
  const normalized = String(text || "").replace(/[\u00a0\u202f]/g, " ");
  const match = normalized.match(/P[ée]riode\s*\|\s*Du\s+(\d{1,2})\s+([A-Za-zÀ-ÿ.]+)\s+au\s+(\d{1,2})\s+([A-Za-zÀ-ÿ.]+)\s+(\d{4})/i);
  if (!match) return null;
  const monthNumber = (value) => {
    const month = value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\.$/, "").toLowerCase();
    return ({
      janvier: 1, janv: 1, fevrier: 2, fevr: 2, mars: 3, avril: 4, avr: 4, mai: 5, juin: 6,
      juillet: 7, juil: 7, aout: 8, septembre: 9, sept: 9, octobre: 10, oct: 10,
      novembre: 11, nov: 11, decembre: 12, dec: 12
    })[month] || null;
  };
  const [, startDayText, startMonthText, endDayText, endMonthText, yearText] = match;
  const year = Number(yearText);
  const startMonth = monthNumber(startMonthText);
  const endMonth = monthNumber(endMonthText);
  const startDay = Number(startDayText);
  const endDay = Number(endDayText);
  if (!startMonth || !endMonth || startMonth > endMonth) return null;
  const start = new Date(Date.UTC(year, startMonth - 1, startDay));
  const end = new Date(Date.UTC(year, endMonth - 1, endDay));
  if (start.getUTCFullYear() !== year || start.getUTCMonth() !== startMonth - 1 || start.getUTCDate() !== startDay
    || end.getUTCFullYear() !== year || end.getUTCMonth() !== endMonth - 1 || end.getUTCDate() !== endDay) return null;
  return {
    startDate: `${yearText}-${String(startMonth).padStart(2, "0")}-${String(startDay).padStart(2, "0")}`,
    endDate: `${yearText}-${String(endMonth).padStart(2, "0")}-${String(endDay).padStart(2, "0")}`,
    text: match[0]
  };
}

async function fetchSainteCatherineMarkers(browser) {
  const sourcePage = await browser.newPage();
  try {
    await sourcePage.route("**/*", (route) => route.request().resourceType() === "image"
      ? route.abort()
      : route.continue());
    const responsePromise = sourcePage.waitForResponse((response) =>
      response.url() === SAINTE_CATHERINE_ENDPOINT
      && response.request().method() === "POST", { timeout: 60000 });
    const pageResponse = await sourcePage.goto(SAINTE_CATHERINE_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
    if (!pageResponse || pageResponse.status() !== 200 || new URL(sourcePage.url()).origin !== SAINTE_CATHERINE_ORIGIN) {
      throw new Error("Sainte-Catherine map page failed validation");
    }
    const response = await responsePromise;
    if (response.status() !== 200 || !/application\/json/i.test(response.headers()["content-type"] || "")) {
      throw new Error(`Sainte-Catherine marker request returned HTTP ${response.status()} or a non-JSON response`);
    }
    const request = new URLSearchParams(response.request().postData() || "");
    if (request.getAll("category[]").join(",") !== "351" || request.get("selected") !== "") {
      throw new Error("Sainte-Catherine map filter changed; review the new map scope before refreshing");
    }
    const payload = await response.json();
    const rawMarkers = payload.result?.markers;
    if (!(payload.success === 1 || payload.success === true) || !Array.isArray(rawMarkers)) {
      throw new Error("Sainte-Catherine map response has no validated marker array");
    }
    const markers = await sourcePage.evaluate((items) => items.map((marker) => {
      const document = new DOMParser().parseFromString(String(marker.description || ""), "text/html");
      return {
        ...marker,
        descriptionText: [...document.body.querySelectorAll("h1,h2,h3,h4,h5,h6,p,li")]
          .map((element) => element.textContent.replace(/[\u00a0\u202f]/g, " ").trim()).filter(Boolean).join("\n"),
        descriptionLinks: [...document.body.querySelectorAll("a[href]")].map((anchor) => ({
          text: anchor.textContent.trim(),
          url: anchor.href
        })),
        descriptionImages: [...document.body.querySelectorAll("img[src]")].map((image) => image.src)
      };
    }), rawMarkers);
    const ids = markers.map((marker) => String(marker.id || ""));
    if (ids.some((id) => !id) || new Set(ids).size !== ids.length) {
      throw new Error("Sainte-Catherine map response has missing or duplicate marker IDs");
    }
    for (const marker of markers) {
      if (!Number.isFinite(Number(marker.lat)) || !Number.isFinite(Number(marker.long))) {
        throw new Error(`Sainte-Catherine marker ${marker.id} has invalid published coordinates`);
      }
    }
    const inventory = [];
    const mediaReview = [];
    for (const [index, marker] of markers.entries()) {
      const mediaUrls = [...new Set([marker.image, ...marker.descriptionImages].filter(Boolean))];
      const media = [];
      for (const mediaUrl of mediaUrls) {
        const mediaAddress = new URL(mediaUrl, SAINTE_CATHERINE_ORIGIN);
        if (mediaAddress.protocol !== "https:" || mediaAddress.origin !== SAINTE_CATHERINE_ORIGIN) {
          throw new Error(`Unexpected Sainte-Catherine media URL ${mediaAddress.href}`);
        }
        const imageResponse = await fetch(mediaAddress, {
          headers: { "Cache-Control": "no-cache" },
          signal: AbortSignal.timeout(45000)
        });
        if (imageResponse.status !== 200 || new URL(imageResponse.url).origin !== SAINTE_CATHERINE_ORIGIN) {
          throw new Error(`Sainte-Catherine media request failed for ${mediaAddress.href}`);
        }
        const contentType = (imageResponse.headers.get("content-type") || "").split(";")[0].toLowerCase();
        if (!contentType.startsWith("image/")) throw new Error(`Sainte-Catherine media is not an image: ${mediaAddress.href}`);
        const bytes = Buffer.from(await imageResponse.arrayBuffer());
        const fingerprint = { url: mediaAddress.href, contentType, byteLength: bytes.length, sha256: sha256(bytes) };
        const reviewed = SAINTE_CATHERINE_MEDIA_REVIEW.find((item) => item.url === fingerprint.url);
        if (!reviewed || reviewed.sha256 !== fingerprint.sha256) {
          throw new Error(`Sainte-Catherine media is new or changed and requires visual review: ${fingerprint.url}`);
        }
        media.push(fingerprint);
        mediaReview.push(reviewed);
      }
      inventory.push({
        indexPosition: index + 1,
        id: String(marker.id),
        title: String(marker.title || ""),
        address: String(marker.address || ""),
        categoryId: String(marker.category_id || ""),
        latitude: String(marker.lat),
        longitude: String(marker.long),
        descriptionSha256: sha256(String(marker.description || "")),
        media
      });
    }
    return { markers, inventory, mediaReview, requestFilter: response.request().postData() || "" };
  } finally {
    await sourcePage.close();
  }
}

async function fetchSainteCatherineNoticeReview(browser, previousReview, recordReviewedReview) {
  const sourcePage = await browser.newPage();
  try {
    await sourcePage.route("**/*", (route) => route.request().resourceType() === "image"
      ? route.abort()
      : route.continue());
    const indexResponse = await sourcePage.goto(SAINTE_CATHERINE_NOTICE_INDEX_URL, {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });
    if (!indexResponse || indexResponse.status() !== 200
      || new URL(sourcePage.url()).origin !== SAINTE_CATHERINE_ORIGIN) {
      throw new Error("Sainte-Catherine notice index failed validation");
    }
    const index = await sourcePage.evaluate(() => {
      const root = document.querySelector("main") || document.body;
      const links = [...root.querySelectorAll("a[href]")].map((anchor) => ({
        title: (anchor.innerText || "").replace(/\s+/g, " ").trim(),
        url: anchor.href
      })).filter((item) => item.url.startsWith(location.origin)
        && item.url.includes("/citoyens/informations-pratiques/avis-et-info-travaux/")
        && !item.url.endsWith("/avis-et-info-travaux/")
        && !item.url.includes("#"));
      const images = [...root.querySelectorAll("img[src]")].map((image) => ({
        url: image.currentSrc || image.src,
        alt: image.alt || ""
      })).filter((image) => image.url.startsWith("https://"));
      return {
        title: document.title,
        text: root.textContent.replace(/\s+/g, " ").trim(),
        links,
        images,
        paginationLinks: [...root.querySelectorAll('a[rel="next"],.pagination a,[aria-label*="page" i]')]
          .map((anchor) => anchor.href)
      };
    });
    const noticeUrls = index.links.map((item) => item.url);
    if (new Set(noticeUrls).size !== noticeUrls.length
      || !isDeepStrictEqual(noticeUrls, SAINTE_CATHERINE_NOTICE_URLS)
      || index.paginationLinks.length > 0) {
      throw new Error("Sainte-Catherine notice index inventory or pagination changed; review the complete current index");
    }
    if (index.images.length !== Object.keys(SAINTE_CATHERINE_NOTICE_MEDIA_REVIEW).length) {
      throw new Error("Sainte-Catherine notice-index media inventory changed; inspect every new image");
    }
    const notices = [];
    for (const link of index.links) {
      const response = await sourcePage.goto(link.url, { waitUntil: "domcontentloaded", timeout: 45000 });
      if (!response || response.status() !== 200 || new URL(sourcePage.url()).origin !== SAINTE_CATHERINE_ORIGIN) {
        throw new Error(`Sainte-Catherine notice request failed: ${link.url}`);
      }
      const notice = await sourcePage.evaluate(() => {
        const root = document.querySelector("main") || document.body;
        return {
          url: location.href,
          title: document.title,
          text: root.textContent.replace(/\s+/g, " ").trim(),
          modifiedAt: document.querySelector('meta[property="article:modified_time"]')?.content || null,
          attachments: [...root.querySelectorAll("a[href]")].map((anchor) => ({
            title: (anchor.innerText || "").replace(/\s+/g, " ").trim(),
            url: anchor.href
          })).filter((item) => /\.(pdf|docx?|pptx?)(?:$|\?)/i.test(item.url)),
          images: [...root.querySelectorAll("img[src]")].map((image) => ({
            url: image.currentSrc || image.src,
            alt: image.alt || ""
          })).filter((image) => image.url.startsWith("https://")),
        };
      });
      const decision = SAINTE_CATHERINE_NOTICE_DECISIONS.get(notice.url);
      if (!decision || !notice.text || notice.text.length < 40) {
        throw new Error(`Sainte-Catherine notice is unreviewed or has no complete text: ${notice.url}`);
      }
      if (notice.attachments.length > 0) {
        throw new Error(`Sainte-Catherine notice published a new attachment requiring review: ${notice.url}`);
      }
      notices.push({
        ...notice,
        contentSha256: sha256(notice.text),
        decision: decision.decision,
        reason: decision.reason
      });
    }
    const mediaReview = [];
    const noticeMedia = [...new Map([
      ...index.images.map((image) => [image.url, image]),
      ...notices.flatMap((notice) => notice.images.map((image) => [image.url, image]))
    ]).values()];
    for (const image of noticeMedia) {
      const address = new URL(image.url);
      if (address.protocol !== "https:" || address.origin !== SAINTE_CATHERINE_ORIGIN) {
        throw new Error(`Unexpected Sainte-Catherine notice media URL: ${address.href}`);
      }
      const response = await fetch(address, {
        headers: { "Cache-Control": "no-cache" },
        signal: AbortSignal.timeout(45000)
      });
      if (response.status !== 200 || new URL(response.url).origin !== SAINTE_CATHERINE_ORIGIN) {
        throw new Error(`Sainte-Catherine notice image request failed: ${address.href}`);
      }
      const contentType = (response.headers.get("content-type") || "").split(";")[0].toLowerCase();
      if (!contentType.startsWith("image/")) {
        throw new Error(`Sainte-Catherine notice attachment requires source-specific inspection: ${address.href}`);
      }
      const bytes = Buffer.from(await response.arrayBuffer());
      const expected = SAINTE_CATHERINE_NOTICE_MEDIA_REVIEW[address.pathname.split("/").at(-1)];
      if (!expected) throw new Error(`Sainte-Catherine notice image has no visual-review record: ${address.href}`);
      const media = {
        url: address.href,
        contentType,
        byteLength: bytes.length,
        sha256: sha256(bytes),
        inspectionStatus: "visually-inspected",
        observations: expected.observations
      };
      if (media.sha256 !== expected.sha256) {
        throw new Error(`Sainte-Catherine notice image changed; re-inspect before refreshing: ${address.href}`);
      }
      mediaReview.push(media);
    }
    const current = {
      index: {
        url: SAINTE_CATHERINE_NOTICE_INDEX_URL,
        title: index.title,
        noticeCount: notices.length,
        contentSha256: sha256(index.text),
        orderedNoticeUrls: noticeUrls
      },
      notices,
      mediaReview
    };
    const currentFingerprint = sha256(JSON.stringify({
      index: current.index,
      notices: notices.map(({ url, title, contentSha256, modifiedAt, attachments }) => ({
        url, title, contentSha256, modifiedAt, attachments
      })),
      mediaReview: mediaReview.map(({ url, contentType, byteLength, sha256: hash }) => ({
        url, contentType, byteLength, sha256: hash
      }))
    }));
    if (!previousReview && !recordReviewedReview) {
      throw new Error("Sainte-Catherine has no completed editorial-notice review baseline; review all notices and images before seeding it.");
    }
    if (previousReview && previousReview.fingerprint !== currentFingerprint && !recordReviewedReview) {
      throw new Error("Sainte-Catherine notice text, order, or media changed; preserve the previous pedestrian snapshot and review the full updated inventory first.");
    }
    return {
      ...(previousReview && previousReview.fingerprint === currentFingerprint ? previousReview : {
        status: "complete",
        reviewedAt: new Date().toISOString(),
        previousRestartPoint: previousReview?.restartPoint || null,
        restartPoint: {
          url: notices[0].url,
          title: notices[0].title,
          publishedPeriod: "15–16 octobre 2026, selon le titre et le corps du premier avis"
        },
        index: current.index,
        inventory: notices,
        mediaReview,
        fingerprint: currentFingerprint
      }),
      checkedAt: new Date().toISOString()
    };
  } finally {
    await sourcePage.close();
  }
}

function buildSainteCatherineInput(markers, noticeReview) {
  const markerById = new Map(markers.map((marker) => [String(marker.id), marker]));
  const sidewalkMarker = markerById.get("1040499351");
  const cyclingMarker = markerById.get("1040837351");
  const rinseMarker = markerById.get("612269351");
  if (!sidewalkMarker || !cyclingMarker || !rinseMarker || markers.length !== 3) {
    throw new Error("Sainte-Catherine marker inventory changed; review every notice before consolidation");
  }

  const lines = String(sidewalkMarker.descriptionText || "").split("\n");
  const nature = lines.find((line) => /^Nature des travaux\s*\|/i.test(line));
  const location = lines.find((line) => /^Localisation\s*\|/i.test(line));
  const period = parseSainteCatherinePeriod(sidewalkMarker.descriptionText);
  if (!nature || !/bordures et trottoirs/i.test(nature) || !location || !period) {
    throw new Error("Sainte-Catherine sidewalk notice no longer publishes the reviewed work, location, and dates");
  }
  const sidewalkNoticeUrl = `${SAINTE_CATHERINE_NOTICE_INDEX_URL}20260921-it-bordures/`;
  const sidewalkNotice = noticeReview.inventory.find((item) => item.url === sidewalkNoticeUrl);
  if (!sidewalkNotice || !/fermeture d'une voie/i.test(sidewalkNotice.text)
    || !/circulation en alternance/i.test(sidewalkNotice.text)
    || !/multiples rues sur le territoire/i.test(sidewalkNotice.text)) {
    throw new Error("Sainte-Catherine sidewalk detail no longer supports the reviewed date and mobility limitations");
  }

  const reviewItems = [{
    id: `sainte-catherine-${cyclingMarker.id}`,
    title: cyclingMarker.title,
    sourceUrl: SAINTE_CATHERINE_URL,
    reason: "cycling-closure-period-and-path-geometry-unresolved",
    text: cyclingMarker.descriptionText,
    publishedPoint: {
      type: "Point",
      coordinates: [Number(cyclingMarker.long), Number(cyclingMarker.lat)]
    },
    geometry: null
  }];
  const exclusions = [{
    id: `sainte-catherine-${rinseMarker.id}`,
    title: rinseMarker.title,
    sourceUrl: SAINTE_CATHERINE_URL,
    reason: "water-main-flushing-with-no-pedestrian-or-cycling-restriction"
  }];
  const sidewalkRecord = {
    id: String(sidewalkMarker.id),
    title: sidewalkMarker.title,
    streets: location.replace(/^Localisation\s*\|\s*/i, "").trim(),
    description: sidewalkMarker.descriptionText,
    sourceSpecificPedestrianWork: true,
    pedestrianEvidence: nature.trim(),
    sourceUrl: sidewalkNotice.url,
    startDate: period.startDate,
    endDate: period.endDate,
    geometry: {
      type: "Point",
      coordinates: [Number(sidewalkMarker.long), Number(sidewalkMarker.lat)]
    },
    supplementalDescription: sidewalkNotice.text,
    relatedSources: [{ url: SAINTE_CATHERINE_URL, label: "Carte interactive des travaux" }],
    details: [["Adresse associée au repère municipal (pas l’emplacement de toutes les rues touchées)", String(sidewalkMarker.address || "")]]
  };
  return { records: [sidewalkRecord], reviewItems, exclusions };
}

async function json(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(45000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  if (data.error) throw new Error(data.error.message || "Source error");
  return data;
}

async function arcgis(endpoint) {
  const ids = await json(`${endpoint}/query?f=json&where=1%3D1&returnIdsOnly=true`);
  if (!Array.isArray(ids.objectIds)) throw new Error("Missing ArcGIS object IDs");
  const features = [];
  for (let offset = 0; offset < ids.objectIds.length; offset += 200) {
    const selected = ids.objectIds.slice(offset, offset + 200);
    const query = new URLSearchParams({ f: "json", objectIds: selected.join(","), outFields: "*", returnGeometry: "true", outSR: "4326" });
    const data = await json(`${endpoint}/query?${query}`);
    if (!Array.isArray(data.features) || data.exceededTransferLimit || data.features.length !== selected.length) throw new Error("Incomplete ArcGIS response");
    features.push(...data.features);
  }
  if (new Set(features.map((feature) => feature.attributes[ids.objectIdFieldName])).size !== ids.objectIds.length) throw new Error("Duplicate ArcGIS features");
  return features;
}

function geojsonFeatures(data) {
  if (!Array.isArray(data.features) || data.exceededTransferLimit || data.properties?.exceededTransferLimit
    || (Number.isFinite(Number(data.totalFeatures)) && Number(data.totalFeatures) > data.features.length)) throw new Error("Incomplete GeoJSON response");
  return data.features;
}

async function fetchRepentignyEvents(page, endpoint) {
  return page.evaluate(async (startUrl) => {
    const events = [];
    const seen = new Set();
    let url = startUrl;
    while (url) {
      const parsedUrl = new URL(url);
      if (parsedUrl.protocol !== "https:" || parsedUrl.hostname !== "info-travaux.ville.repentigny.qc.ca") {
        throw new Error("Unexpected Open511 pagination URL");
      }
      if (seen.has(parsedUrl.href)) throw new Error("Open511 pagination cycle");
      seen.add(parsedUrl.href);
      const response = await fetch(parsedUrl.href);
      if (!response.ok) throw new Error(`Open511 HTTP ${response.status}`);
      const data = await response.json();
      if (!Array.isArray(data.events)) throw new Error("Missing Open511 events");
      events.push(...data.events.filter((event) => event.status === "ACTIVE"));
      url = data.pagination?.next_url ? new URL(data.pagination.next_url, parsedUrl).href : null;
    }
    return events;
  }, endpoint);
}

async function montSaintHilaireLayers() {
  const experienceUrl = "https://www.arcgis.com/sharing/rest/content/items/f6ea6c5a42f5440c970ec7a8bb5b17d4/data?f=json";
  const experience = await json(experienceUrl);
  const maps = Object.values(experience.dataSources || {}).filter((source) => source.type === "WEB_MAP");
  if (maps.length !== 1 || !/^[a-f0-9]{32}$/i.test(maps[0].itemId)) throw new Error("Mont-Saint-Hilaire: expected one published web map");
  const portal = new URL(maps[0].portalUrl);
  if (portal.protocol !== "https:" || portal.hostname.toLowerCase() !== "montsainthilaire.maps.arcgis.com") throw new Error("Mont-Saint-Hilaire: unexpected portal");
  const webMapUrl = `${portal.origin}/sharing/rest/content/items/${maps[0].itemId}/data?f=json`;
  const webMap = await json(webMapUrl);
  if (!Array.isArray(webMap.operationalLayers)) throw new Error("Mont-Saint-Hilaire: missing operational layers");
  return [3, 4, 5, 6, 15].map((id) => {
    const matches = webMap.operationalLayers.filter((layer) => layer.layerType === "ArcGISFeatureLayer"
      && typeof layer.url === "string" && layer.url.endsWith(`/FeatureServer/${id}`));
    if (matches.length !== 1) throw new Error(`Mont-Saint-Hilaire: missing or ambiguous layer ${id}`);
    const endpoint = new URL(matches[0].url);
    if (endpoint.protocol !== "https:" || endpoint.hostname !== "services5.arcgis.com"
      || !endpoint.pathname.startsWith("/RupmNFqbsv0VX4xY/arcgis/rest/services/")) throw new Error(`Mont-Saint-Hilaire: unexpected layer ${id} URL`);
    return { id, url: endpoint.href, title: matches[0].title, experienceUrl, webMapUrl };
  });
}

async function main() {
  const REPENTIGNY_ONLY = process.argv.includes("--repentigny-only");
  const MONTREAL_ONLY = process.argv.includes("--montreal-only");
  const SAINTE_CATHERINE_ONLY = process.argv.includes("--sainte-catherine-only");
  const BOUCHERVILLE_ONLY = process.argv.includes("--boucherville-only");
  const RECORD_SAINTE_CATHERINE_NOTICE_REVIEW = process.argv.includes("--record-sainte-catherine-notice-review");
  if ([REPENTIGNY_ONLY, MONTREAL_ONLY, SAINTE_CATHERINE_ONLY, BOUCHERVILLE_ONLY].filter(Boolean).length > 1) {
    throw new Error("Choose only one source-specific refresh mode");
  }
  if (RECORD_SAINTE_CATHERINE_NOTICE_REVIEW && !SAINTE_CATHERINE_ONLY) {
    throw new Error("--record-sainte-catherine-notice-review requires --sainte-catherine-only");
  }
  let previous = { records: [], sources: [] };
  try { previous = JSON.parse(await readFile(OUTPUT, "utf8")); } catch (error) { if (error.code !== "ENOENT") throw error; }
  if (process.argv.includes("--parc-jean-drapeau-only")) {
    if (previous.schemaVersion !== 1) throw new Error("Existing pedestrian snapshot required");
    const { mergeParkPedestrianSnapshot } = await import("./build-parc-jean-drapeau-snapshot.mjs");
    const park = JSON.parse(await readFile("data/parc-jean-drapeau-snapshot.json", "utf8"));
    const result = mergeParkPedestrianSnapshot(previous, park);
    await writeFile(OUTPUT, `${JSON.stringify(result, null, 2)}\n`, "utf8");
    console.log(JSON.stringify({ output: OUTPUT, parkPaths: park.pedestrianRecords.length, otherSources: "unchanged, not reverified", generatedAt: result.generatedAt }));
    return;
  }
  if (process.argv.includes("--marathon-only")) {
    if (previous.schemaVersion !== 1) throw new Error("Existing pedestrian snapshot required");
    const { mergeMarathonPedestrianSnapshot } = await import("./build-marathon-closures.mjs");
    const marathon = JSON.parse(await readFile("data/Marathon-Beneva-Mtl-2026.json", "utf8"));
    const result = mergeMarathonPedestrianSnapshot(previous, marathon);
    await writeFile(OUTPUT, `${JSON.stringify(result, null, 2)}\n`, "utf8");
    console.log(JSON.stringify({ output: OUTPUT, marathonPaths: result.records.filter(record => record.sourceKey === "marathon-pdf").length, otherSources: "unchanged, not reverified", generatedAt: result.generatedAt }));
    return;
  }
  const browser = await chromium.launch({ headless: true });
  const records = [];
  const sources = [];
  const review = [];
  try {
    const page = await browser.newPage();
    await page.route("**/data/pedestrian-closures-snapshot.json*", (route) => route.fulfill({ json: { schemaVersion: 1, generatedAt: new Date().toISOString(), records: [], sources: [] } }));
    await page.goto(`${baseUrl}/fr/pedestrian.html`, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => typeof LIVE_SOURCES !== "undefined" && window.PEDESTRIAN_MAP);
    const urls = await page.evaluate(() => LIVE_SOURCES);
    const notices = JSON.parse(await readFile("data/montreal-pedestrian-notices-snapshot.json", "utf8"));
    await page.evaluate((snapshot) => window.PEDESTRIAN_MAP.useNoticeSnapshot(snapshot), notices);

    async function collect(key, url, fetchRecords, normalize, options = {}) {
      try {
        const raw = await fetchRecords();
        const checkedAt = options.local ? null : new Date().toISOString();
        const sourceExtractedAt = options.extractedAt || null;
        const result = await page.evaluate(({ raw, normalize, key, today, options }) => {
          const retained = [];
          const pending = [];
          const api = window.PEDESTRIAN_MAP;
          const publicFields = ["REMARQUE", "Description", "Impact", "InfoSup", "TITRE", "TypeTravaux", "Localisation", "ImpactCirculation", "Alternative", "NoteExterne", "NOM", "Comment", "adresse", "type_de_travaux", "entrave_la_circulation", "d_tour_de_la_circulation", "informations_suppl_mentaires", "localisation", "description", "type_entrave", "note_type_entrave", "type_circulation", "note_type_circulation", "PROJET", "Nature", "TRONÇON", "entrave", "detoursEtItinerairesFacultatifs", "headline", "title", "impact", "streets", "segmentImpact", "segmentTitle", "type", "ENTRAVE", "CIRCULATION", "NATURE", "Entrave :", "Circulation :", "Remarques :", "Nature :"];
          raw.forEach((item, index) => {
            const attributes = item.attributes || item.properties || item;
            const fields = publicFields.map((field) => attributes[field]).filter((value) => typeof value === "string");
            if (Array.isArray(attributes.trafficLabels)) fields.push(...attributes.trafficLabels);
            if (key === "citizen") fields.push(JSON.stringify(attributes.reportedFields || {}));
            const location = attributes.LOCALISATION ?? attributes["Localisation :"];
            if (typeof location === "string") fields.push(location);
            if (key === "repentigny" && typeof attributes.detour === "string") fields.push(attributes.detour);
            const text = fields.join("\n");
            if (normalize === "normalizeRepentignyEvent"
              && (!attributes.schedule?.intervals?.length || !attributes.geography?.coordinates?.length)) {
              pending.push({ id: String(attributes.id || attributes.url || index), reason: "missing-dates-or-geometry",
                title: attributes.headline || attributes.description, sourceUrl: options.sourceUrl,
                publishedSchedule: attributes.schedule?.intervals || null, text });
              return;
            }
            if (key.startsWith("montSaintHilaire-")) {
              pending.push({ id: String(attributes.OBJECTID ?? attributes.FID ?? index),
                reason: "project-without-dated-pedestrian-impact", title: attributes.PROJET,
                sourceUrl: options.sourceUrl, publishedSchedule: attributes.ECHEANCIER || null, text });
              return;
            }
            if (normalize === "review" && attributes.displayOnPedestrianPage === true) {
              pending.push({ id: attributes.id, reason: "approximate-period-unverified-geometry", displayOnPedestrianPage: true,
                title: attributes.title, sourceUrl: attributes.sourceUrl, publishedPeriod: attributes.publishedPeriod,
                text: attributes.description, affectedUsers: ["pedestrians", "cyclists"] });
              return;
            }
            if (normalize === "montreal" || normalize === "longueuil") {
              const output = normalize === "montreal" ? api.normalizeMontreal(item, index) : api.normalizeLongueuil(item);
              output.forEach((record) => {
                const impacts = normalize === "montreal" ? parseJson(attributes.occupancyImpactImpactsOfSection, []) : [];
                const impactIndex = Number(record.id.split("-").at(-1));
                record.evidence = { kind: "structured", reference: attributes.permitPermitId || String(attributes.OBJECTID),
                  publishedType: normalize === "montreal" ? (record.pedestrianArea === "park" ? attributes.occupancyImpactParkImpactBlockedType
                    : record.pedestrianArea === "path" ? impacts[impactIndex]?.bikePath?.blockedType : impacts[impactIndex]?.sidewalk?.blockedType) : "Sentier_Ferme",
                  backSidewalk: impacts[impactIndex]?.backSidewalk || null };
                retained.push(record);
              });
              if (!output.length && /Trottoirs_Liens_Cyclable/i.test(attributes.REPERCUSSIONS_ENTRAVE || "")) pending.push({ id: String(attributes.OBJECTID), reason: "combined-sidewalk-cycle-impact", text: attributes.REPERCUSSIONS_ENTRAVE });
              return;
            }
            const cyclingImpacts = api.publishedCyclingImpacts(text);
            if (key === "boucherville" && attributes.sourceSpecificPedestrianWork === true) {
              cyclingImpacts.push({ index: 0, text: attributes.pedestrianEvidence, pedestrianArea: "path",
                affectedUsers: ["pedestrians", "cyclists"], severity: "critical",
                side: { code: "not-applicable", published: null, geometryStatus: "published" } });
            }
            if (normalize === "normalizeLavalIdentifyResult" && /^(?:voie|piste|bande) cyclable$/i.test(attributes.ENTRAVE || attributes["Entrave :"] || "")) {
              cyclingImpacts.push({ index: 0, text, pedestrianArea: "path", affectedUsers: ["cyclists"], severity: "moderate",
                side: { code: "not-applicable", published: null, geometryStatus: "worksite-only" } });
            }
            if (!cyclingImpacts.length && !/pi[ée]ton|trottoir|sidewalk|pedestrian|sentier|footpath/i.test(text)) {
              const explicitlyOpenRepentignyCycleway = key === "repentigny" && /\bpiste cyclable ouverte\b/i.test(text);
              if (!explicitlyOpenRepentignyCycleway
                && /\b(?:cyclab\w*|cyclist\w*|v[ée]los?|bicycle\w*|bikes?|cycling)\b/i.test(text)) {
                pending.push({ id: String(attributes.globalid || attributes.OBJECTID || attributes.FID || attributes.id || index), reason: "cycling-mention-without-pedestrian-evidence", text });
              }
              return;
            }
            let impacts = [...api.publishedPedestrianImpacts(text), ...cyclingImpacts];
            if (key === "sainte-catherine" && attributes.sourceSpecificPedestrianWork === true) {
              impacts = [{
                index: 0,
                text: attributes.pedestrianEvidence,
                pedestrianArea: "sidewalk",
                severity: "moderate",
                side: { code: "unknown", published: null, geometryStatus: "published" }
              }];
            }
            if (key === "boucherville" && attributes.sourceSpecificPedestrianWork === true) {
              impacts = [{
                index: 0,
                text: attributes.pedestrianEvidence,
                pedestrianArea: "path",
                affectedUsers: ["pedestrians", "cyclists"],
                severity: "critical",
                side: { code: "not-applicable", published: null, geometryStatus: "published" }
              }];
            }
            if (normalize === "normalizeTerrebonneFeature" && attributes.statut_avis === "Actif"
              && attributes.type_entrave === "Fermeture complete" && /tunnel/i.test(attributes.localisation)
              && /s[ée]curit[ée] des pi[ée]tons/i.test(attributes.description)) {
              impacts = [{ index: 0, text: [attributes.description, attributes.note_type_circulation].filter(Boolean).join("\n"), pedestrianArea: "path", severity: "critical", side: { code: "not-applicable", published: null, geometryStatus: "published" } }];
            }
            if (!impacts.length) { pending.push({ id: String(attributes.OBJECTID || attributes.FID || attributes.id || index), reason: "pedestrian-mention-without-explicit-restriction", text }); return; }
            let base;
            if (normalize === "local") {
              base = { ...item, category: "municipal", source: options.name, sourceKind: key, borough: options.municipality,
                responsible: options.responsible || options.name, periods: options.periods || ["day", "night"], sourceUrl: item.sourceUrl || options.sourceUrl };
            } else if (normalize === "review") {
              pending.push({ id: String(attributes.id || index), reason: "requires-source-specific-pedestrian-review", text }); return;
            } else {
              if (key.startsWith("quebec511") && !intersectsGreaterMontreal(item)) return;
              base = window[normalize](item);
            }
            if (!base) { pending.push({ id: String(attributes.OBJECTID || attributes.id || index), reason: "missing-dates-geometry-or-inactive-source-record", text }); return; }
            const grouped = new Map();
            for (const impact of impacts) {
              const identity = `${impact.pedestrianArea}-${impact.side.code}-${impact.severity}${impact.affectedUsers ? "-cyclists" : ""}`;
              const current = grouped.get(identity);
              if (current) current.text = [...new Set([current.text, impact.text])].join("\n");
              else grouped.set(identity, { ...impact });
            }
            grouped.forEach((impact, identity) => retained.push({ ...base, id: `pedestrian-${key}-${base.id}-${identity}`,
              sourceKind: `pedestrian-${key}`, pedestrianArea: impact.pedestrianArea, severity: impact.severity, impact: impact.text,
              ...(impact.affectedUsers ? { affectedUsers: impact.affectedUsers } : {}),
              direction: impact.side.published || t("pedestrian.directionUnknown"), side: impact.side,
              geometryNote: t(base.geometry?.type === "Point" ? "pedestrian.pointNote" : "pedestrian.geometryNote"),
              evidence: { kind: "published-text", text: impact.text },
              openEnded: attributes.statut_avis === "Actif" && !base.endDate }));
          });
          const dictionary = window.TRANSLATIONS.fr;
          const labelKey = (text) => Object.keys(dictionary).find((key) => dictionary[key] === text && !key.startsWith("faq."));
          return { review: pending, records: retained.filter((record) => record.startDate && Number.isFinite(Date.parse(record.startDate))
            && ((record.endDate && Number.isFinite(Date.parse(record.endDate)) && record.endDate >= today) || record.openEnded)
            && record.geometry && ["Point", "LineString", "MultiLineString", "Polygon"].includes(record.geometry.type))
            .map((record) => ({
              id: record.id, title: record.title, streets: record.streets, category: record.category,
              sourceKind: record.sourceKind, source: record.source, sourceUrl: record.sourceUrl,
              ...(record.affectedUsers ? { affectedUsers: record.affectedUsers } : {}),
              responsible: record.responsible, borough: record.borough, pedestrianArea: record.pedestrianArea,
              startDate: record.startDate, endDate: record.endDate || null, openEnded: Boolean(record.openEnded),
              periods: record.periods, schedule: record.schedule || null, scheduleText: record.scheduleText || null,
              publishedIntervals: record.publishedIntervals || null, publishedDirection: record.side?.published || null,
              sourceDescription: [record.description, record.supplementalDescription].filter(Boolean).join("\n\n") || record.impact,
              severity: record.severity, impact: record.impact, geometry: record.geometry, point: record.point || representativePoint(record.geometry),
              relatedSources: record.relatedSources || [],
              side: record.side || { code: "unknown", published: null, geometryStatus: "worksite-only" },
              evidence: record.evidence,
              details: (record.details || []).filter(([, value]) => value !== null && value !== undefined && value !== "").map(([label, value]) => ({ labelKey: labelKey(label) || null, label, value, valueKey: labelKey(value) || null }))
            })) };
        }, { raw, normalize, key, today, options });
        const unique = new Map();
        const previousById = new Map(previous.records
          .filter((record) => record.sourceKey === key)
          .map((record) => [record.id, record]));
        for (const record of result.records) {
          const stored = { ...record, sourceKey: key };
          const previousRecord = previousById.get(stored.id);
          const withoutProvenance = (value) => {
            const { sourceKey: _sourceKey, sourceCheckedAt: _sourceCheckedAt, ...data } = value;
            return data;
          };
          stored.sourceCheckedAt = options.preserveRecordProvenance && previousRecord
            ? previousRecord.sourceCheckedAt
            : options.local && previousRecord
            && isDeepStrictEqual(withoutProvenance(previousRecord), withoutProvenance(stored))
            ? previousRecord.sourceCheckedAt
            : checkedAt || sourceExtractedAt || record.sourceCheckedAt || null;
          if (unique.has(stored.id) && JSON.stringify(unique.get(stored.id)) !== JSON.stringify(stored)) throw new Error(`Conflicting duplicate ${stored.id}`);
          unique.set(stored.id, stored);
        }
        records.push(...unique.values());
        const sourceReviewItems = options.reviewItems || [];
        const reviewCount = result.review.length + sourceReviewItems.length;
        review.push(...result.review.map((item) => ({ ...item, sourceKey: key })),
          ...sourceReviewItems.map((item) => ({ ...item, sourceKey: key })));
        const sourceSummary = {
          key,
          url,
          status: options.local ? "local-snapshot" : "checked",
          checkedAt,
          sourceExtractedAt,
          received: options.receivedCount ?? raw.length,
          retained: unique.size,
          reviewCount
        };
        if (options.excludedCount !== undefined) sourceSummary.excluded = options.excludedCount;
        if (options.exclusions) sourceSummary.exclusions = options.exclusions;
        if (options.inventory) sourceSummary.inventory = options.inventory;
        if (options.mediaReview) sourceSummary.mediaReview = options.mediaReview;
        if (options.requestFilter) sourceSummary.requestFilter = options.requestFilter;
        if (options.noticeReview) sourceSummary.noticeReview = { ...options.noticeReview, checkedAt };
        sources.push(sourceSummary);
        console.log(`${key}: ${sourceSummary.received} received, ${unique.size} retained, ${reviewCount} review (${options.local ? "local snapshot" : "verified live"})`);
      } catch (error) {
        const old = previous.sources.find((source) => source.key === key);
        const retained = previous.records.filter((record) => record.sourceKey === key && (!record.endDate || record.endDate >= today));
        records.push(...retained);
        const message = error.cause?.code ? `${error.message} (${error.cause.code})` : error.message;
        sources.push({ ...old, key, url, status: "failed", checkedAt: old?.checkedAt || null, sourceExtractedAt: old?.sourceExtractedAt || null, retained: retained.length, error: message });
        console.log(`${key}: FAILED (${message}), ${retained.length} previous records retained`);
      }
    }

    async function collectSainteCatherine() {
      const existingSource = previous.sources.find((source) => source.key === "sainte-catherine");
      const existingNoticeReview = previous.validation?.sainteCatherineReview || null;
      const options = {
        name: "Ville de Sainte-Catherine - Carte interactive des travaux",
        responsible: "Ville de Sainte-Catherine",
        municipality: "Sainte-Catherine",
        sourceUrl: SAINTE_CATHERINE_URL,
        periods: [],
        preserveRecordProvenance: true
      };
      await collect("sainte-catherine", SAINTE_CATHERINE_URL, async () => {
        const capture = await fetchSainteCatherineMarkers(browser);
        const noticeReview = await fetchSainteCatherineNoticeReview(
          browser,
          existingNoticeReview,
          RECORD_SAINTE_CATHERINE_NOTICE_REVIEW
        );
        const expectedInventory = existingSource?.inventory || SAINTE_CATHERINE_EXPECTED_INVENTORY;
        if (!isDeepStrictEqual(capture.inventory, expectedInventory)) {
          throw new Error("Sainte-Catherine source inventory changed; review every notice and image before updating the snapshot");
        }
        const input = buildSainteCatherineInput(capture.markers, noticeReview);
        if (existingSource) {
          const savedReview = previous.review.filter((item) => item.sourceKey === "sainte-catherine");
          if (capture.requestFilter !== existingSource.requestFilter
            || !Array.isArray(existingSource.exclusions) || existingSource.excluded !== existingSource.exclusions.length
            || !Array.isArray(existingSource.mediaReview) || existingSource.mediaReview.length !== capture.mediaReview.length
            || savedReview.length !== 1 || savedReview[0].id !== input.reviewItems[0].id) {
            throw new Error("Sainte-Catherine saved notice review is incomplete; preserve the snapshot pending review");
          }
          options.reviewItems = savedReview.map(({ sourceKey, ...item }) => item);
          options.exclusions = existingSource.exclusions;
          options.excludedCount = existingSource.excluded;
          options.mediaReview = existingSource.mediaReview;
        } else {
          if (!isDeepStrictEqual(capture.inventory, SAINTE_CATHERINE_EXPECTED_INVENTORY)) {
            throw new Error("Sainte-Catherine has no reviewed baseline for the current source inventory");
          }
          options.reviewItems = input.reviewItems;
          options.exclusions = input.exclusions;
          options.excludedCount = input.exclusions.length;
          options.mediaReview = capture.mediaReview;
        }
        options.noticeReview = noticeReview;
        options.inventory = capture.inventory;
        options.requestFilter = capture.requestFilter;
        options.receivedCount = capture.markers.length;
        return input.records;
      }, "local", options);
    }

    async function collectBoucherville() {
      const snapshot = JSON.parse(await readFile("data/boucherville-roadworks-snapshot.json", "utf8"));
      if (snapshot.schemaVersion !== 1 || !Array.isArray(snapshot.pedestrianRecords) || !snapshot.pedestrianRecords.length
        || !snapshot.extractedAt || snapshot.sourceReview?.counts?.retainedPedestrianImpacts !== snapshot.pedestrianRecords.length) {
        throw new Error("Boucherville input snapshot has no fully reviewed pedestrian record");
      }
      const raw = snapshot.pedestrianRecords.map((record) => ({
        ...record,
        description: record.sourceDescription || "",
        sourceSpecificPedestrianWork: true,
        pedestrianEvidence: record.evidence?.text
      }));
      await collect("boucherville", snapshot.sourceUrl, async () => raw, "local", {
        local: true,
        extractedAt: snapshot.extractedAt,
        sourceUrl: snapshot.sourceUrl,
        name: "Ville de Boucherville - Snapshot des entraves auto et piétonnes",
        responsible: "Ville de Boucherville",
        municipality: "Boucherville",
        receivedCount: snapshot.sourceReview.counts.restRecordsReceived,
        requestFilter: "avis-de-travaux; input reused from the validated local automobile snapshot",
        inventory: snapshot.sourceReview.inventory
      });
    }

    if (REPENTIGNY_ONLY) {
      await collect("repentigny", urls.repentignyOpen511,
        () => fetchRepentignyEvents(page, urls.repentignyOpen511), "normalizeRepentignyEvent",
        { sourceUrl: urls.repentignyOpen511 });
    } else if (MONTREAL_ONLY) {
      const montrealUrl = new URL(urls.montreal);
      montrealUrl.searchParams.delete("CQL_FILTER");
      await collect("montreal", montrealUrl.href, async () => geojsonFeatures(await json(montrealUrl)), "montreal");
    } else if (SAINTE_CATHERINE_ONLY) {
      await collectSainteCatherine();
    } else if (BOUCHERVILLE_ONLY) {
      await collectBoucherville();
    } else {
      const montrealUrl = new URL(urls.montreal);
      montrealUrl.searchParams.delete("CQL_FILTER");
      await collect("montreal", montrealUrl.href, async () => geojsonFeatures(await json(montrealUrl)), "montreal");
      await collect("longueuil", urls.longueuilSurfaces, async () => geojsonFeatures(await json(urls.longueuilSurfaces)), "longueuil");
      const municipal = [
        ["dorvalEntraves", "normalizeDorvalFeature"], ["boisbriandWorks", "normalizeBoisbriandFeature"],
        ["saintEustacheLines", "normalizeSaintEustacheFeature"], ["saintEustachePoints", "normalizeSaintEustacheFeature"],
        ["chateauguayWorks", "normalizeChateauguayFeature"], ["assomptionIncidents", "normalizeAssomptionFeature"],
        ["terrebonneEntraveLines", "normalizeTerrebonneFeature"], ["terrebonneEntravePoints", "normalizeTerrebonneFeature"]
      ];
      for (const [key, normalize] of municipal) await collect(key, urls[key], () => arcgis(urls[key]), normalize);
      let montSaintHilaire;
      try {
        montSaintHilaire = await montSaintHilaireLayers();
      } catch (error) {
        for (const layer of [3, 4, 5, 6, 15]) {
          await collect(`montSaintHilaire-${layer}`, `${urls.montSaintHilaireWorks}/${layer}`, async () => { throw error; }, "review");
        }
      }
      for (const layer of montSaintHilaire || []) {
        await collect(`montSaintHilaire-${layer.id}`, layer.url, () => arcgis(layer.url), "review", { sourceUrl: layer.url });
      }
      for (const [key, normalize] of [["quebec511", "normalizeQuebec511Feature"], ["quebec511Events", "normalizeQuebec511Event"]]) {
        await collect(key, urls[key], async () => geojsonFeatures(await json(urls[key])), normalize);
      }
      await collect("repentigny", urls.repentignyOpen511,
        () => fetchRepentignyEvents(page, urls.repentignyOpen511), "normalizeRepentignyEvent",
        { sourceUrl: urls.repentignyOpen511 });
      const lavalUrl = await page.evaluate(() => {
        const west = map.options.crs.project(L.latLng(LAVAL_OFFICIAL_BOUNDS.south, LAVAL_OFFICIAL_BOUNDS.west));
        const east = map.options.crs.project(L.latLng(LAVAL_OFFICIAL_BOUNDS.north, LAVAL_OFFICIAL_BOUNDS.east));
        const envelope = { xmin: west.x, ymin: west.y, xmax: east.x, ymax: east.y, spatialReference: { wkid: 102100 } };
        return `${LIVE_SOURCES.lavalMapService}/identify?${new URLSearchParams({ f: "json", geometry: JSON.stringify(envelope), geometryType: "esriGeometryEnvelope", sr: "3857", mapExtent: `${west.x},${west.y},${east.x},${east.y}`, imageDisplay: "2000,1400,96", tolerance: "1", layers: "all:0,2,3", returnGeometry: "true", maxAllowableOffset: "1" })}`;
      });
      await collect("laval", lavalUrl, async () => {
        const data = await json(lavalUrl);
        if (!Array.isArray(data.results)) throw new Error("Missing Laval identify results");
        return data.results;
      }, "normalizeLavalIdentifyResult");
      await collectSainteCatherine();
      await collectBoucherville();

      const localSources = [
        ["mont-royal", "data/mont-royal-snapshot.json", "Ville de Mont-Royal", "Mont-Royal"],
        ["beaconsfield", "data/beaconsfield-snapshot.json", "Ville de Beaconsfield", "Beaconsfield"],
        ["pjcci", "data/pjcci-work-advisories-snapshot.json", "PJCCI", "Grand Montreal"],
        ["citizen", "data/citizen-reports-snapshot.json", "Signalements citoyens", "Grand Montreal"],
        ["noovo", "data/noovo-road-closures-snapshot.json", "Noovo", "Grand Montreal"],
        ["pedestrian-streets", "data/montreal-pedestrian-snapshot.json", "Rues pietonnisees", "Montreal"],
        ["uci", "data/montreal-uci-closures-snapshot.json", "UCI", "Montreal"]
      ];
      for (const [key, file, name, municipality] of localSources) {
        let snapshot;
        try { snapshot = JSON.parse(await readFile(file, "utf8")); } catch (error) {
          await collect(key, file, async () => { throw error; }, "review", { local: true });
          continue;
        }
        const raw = [...(snapshot.records || snapshot.notices || snapshot.layers?.restrictions?.geojson?.features || []), ...(snapshot.curatedRecords || [])];
        await collect(key, file, async () => raw, ["mont-royal", "beaconsfield"].includes(key) ? "local" : "review",
          { local: true, extractedAt: snapshot.extractedAt, name, municipality, sourceUrl: snapshot.sourceUrl });
      }
      const curated = await page.evaluate(() => ({ regional: REGIONAL_MAJOR_CLOSURES, linkedCities: LINKED_CITY_WORKS }));
      for (const [key, entries] of Object.entries(curated)) await collect(key, "js/app.js", async () => entries, "review", { local: true });
      sources.push({ key: "montreal-notice-details", url: "data/montreal-pedestrian-notices-snapshot.json", status: "local-snapshot", checkedAt: null, sourceExtractedAt: notices.extractedAt, received: notices.records.length, retained: 0, role: "labels-and-notice-details" });
    }
  } finally {
    await browser.close();
  }
  const requestedLocalInputVerified = BOUCHERVILLE_ONLY && sources.some((source) => source.key === "boucherville"
    && source.status === "local-snapshot" && source.retained > 0 && source.sourceExtractedAt);
  if (!requestedLocalInputVerified && !sources.some((source) => source.status === "checked"
    && (REPENTIGNY_ONLY || MONTREAL_ONLY || SAINTE_CATHERINE_ONLY || source.retained > 0))) {
    throw new Error("No live pedestrian source verified; output unchanged");
  }
  const uniqueIds = new Set(records.map((record) => record.id));
  if (uniqueIds.size !== records.length) throw new Error("Duplicate consolidated IDs; output unchanged");
  let result;
  if (REPENTIGNY_ONLY) {
    const updatedSource = sources.find((source) => source.key === "repentigny");
    const updatedRecords = [...previous.records.filter((record) => record.sourceKey !== "repentigny"), ...records]
      .sort((first, second) => first.id.localeCompare(second.id));
    const sourceList = previous.sources.map((source) => source.key === "repentigny" ? updatedSource : source);
    if (!sourceList.some((source) => source.key === "repentigny")) sourceList.push(updatedSource);
    const retainedReview = updatedSource.status === "failed"
      ? previous.review.filter((item) => item.sourceKey === "repentigny")
      : [];
    result = {
      ...previous,
      generatedAt: new Date().toISOString(),
      sources: sourceList,
      records: updatedRecords,
      review: [...previous.review.filter((item) => item.sourceKey !== "repentigny"), ...retainedReview, ...review]
    };
    await writeFile(OUTPUT, `${JSON.stringify(result, null, 2)}\n`, "utf8");
    console.log(JSON.stringify({
      output: OUTPUT,
      generatedAt: result.generatedAt,
      source: updatedSource,
      otherSources: "unchanged, not reverified",
      records: result.records.length,
      review: result.review.length
    }));
    return;
  }
  if (MONTREAL_ONLY) {
    const updatedSource = sources.find((source) => source.key === "montreal");
    const updatedRecords = [...previous.records.filter((record) => record.sourceKey !== "montreal"), ...records]
      .sort((first, second) => first.id.localeCompare(second.id));
    const sourceList = previous.sources.map((source) => source.key === "montreal" ? updatedSource : source);
    if (!sourceList.some((source) => source.key === "montreal")) sourceList.push(updatedSource);
    const retainedReview = updatedSource.status === "failed"
      ? previous.review.filter((item) => item.sourceKey === "montreal")
      : [];
    result = {
      ...previous,
      generatedAt: new Date().toISOString(),
      sources: sourceList,
      records: updatedRecords,
      review: [...previous.review.filter((item) => item.sourceKey !== "montreal"), ...retainedReview, ...review]
    };
    await writeFile(OUTPUT, `${JSON.stringify(result, null, 2)}\n`, "utf8");
    console.log(JSON.stringify({
      output: OUTPUT,
      generatedAt: result.generatedAt,
      source: updatedSource,
      otherSources: "unchanged, not reverified",
      records: result.records.length,
      review: result.review.length
    }));
    return;
  }
  if (SAINTE_CATHERINE_ONLY) {
    const updatedSource = sources.find((source) => source.key === "sainte-catherine");
    const updatedRecords = [...previous.records.filter((record) => record.sourceKey !== "sainte-catherine"), ...records]
      .sort((first, second) => first.id.localeCompare(second.id));
    const sourceList = previous.sources.map((source) => source.key === "sainte-catherine" ? updatedSource : source);
    if (!sourceList.some((source) => source.key === "sainte-catherine")) sourceList.push(updatedSource);
    const retainedReview = updatedSource.status === "failed"
      ? previous.review.filter((item) => item.sourceKey === "sainte-catherine")
      : [];
    result = {
      ...previous,
      generatedAt: new Date().toISOString(),
      sources: sourceList,
      records: updatedRecords,
      validation: updatedSource.status === "checked" && updatedSource.noticeReview
        ? { ...previous.validation, sainteCatherineReview: updatedSource.noticeReview }
        : previous.validation,
      review: [...previous.review.filter((item) => item.sourceKey !== "sainte-catherine"), ...retainedReview, ...review]
    };
    await writeFile(OUTPUT, `${JSON.stringify(result, null, 2)}\n`, "utf8");
    console.log(JSON.stringify({
      output: OUTPUT,
      generatedAt: result.generatedAt,
      source: updatedSource,
      otherSources: "unchanged, not reverified",
      records: result.records.length,
      review: result.review.length
    }));
    return;
  }
  if (BOUCHERVILLE_ONLY) {
    const updatedSource = sources.find((source) => source.key === "boucherville");
    const updatedRecords = [...previous.records.filter((record) => record.sourceKey !== "boucherville"), ...records]
      .sort((first, second) => first.id.localeCompare(second.id));
    const sourceList = previous.sources.map((source) => source.key === "boucherville" ? updatedSource : source);
    if (!sourceList.some((source) => source.key === "boucherville")) sourceList.push(updatedSource);
    const retainedReview = updatedSource.status === "failed"
      ? previous.review.filter((item) => item.sourceKey === "boucherville")
      : [];
    result = {
      ...previous,
      generatedAt: new Date().toISOString(),
      sources: sourceList,
      records: updatedRecords,
      review: [...previous.review.filter((item) => item.sourceKey !== "boucherville"), ...retainedReview, ...review]
    };
    await writeFile(OUTPUT, `${JSON.stringify(result, null, 2)}\n`, "utf8");
    console.log(JSON.stringify({
      output: OUTPUT,
      generatedAt: result.generatedAt,
      source: updatedSource,
      otherSources: "unchanged, not reverified",
      records: result.records.length,
      review: result.review.length
    }));
    return;
  }
  const snapshot = { schemaVersion: 1, generatedAt: new Date().toISOString(),
    policy: "Pedestrian and cycling impacts. Cycling-only records identify affectedUsers explicitly and do not confirm pedestrian restrictions. Per-source checkedAt is authoritative; local snapshots are not reverified. Unknown sidewalk sides are never inferred. Geometry is the published worksite unless explicitly identified otherwise. Selected documentary review notices are displayed separately without geometry or inferred dates.",
    sources, records: records.sort((first, second) => first.id.localeCompare(second.id)), review };
  const { mergeMarathonPedestrianSnapshot } = await import("./build-marathon-closures.mjs");
  const { mergeParkPedestrianSnapshot } = await import("./build-parc-jean-drapeau-snapshot.mjs");
  const marathon = JSON.parse(await readFile("data/Marathon-Beneva-Mtl-2026.json", "utf8"));
  result = mergeMarathonPedestrianSnapshot(snapshot, marathon);
  try {
    result = mergeParkPedestrianSnapshot(result, JSON.parse(await readFile("data/parc-jean-drapeau-snapshot.json", "utf8")));
  } catch (error) {
    const key = "parc-jean-drapeau";
    const previousSource = previous.sources?.find(source => source.key === key);
    result.records.push(...previous.records.filter(record => record.sourceKey === key && (!record.endDate || record.endDate >= today)));
    result.review.push(...(previous.review || []).filter(record => record.sourceKey === key));
    result.sources.push({ ...previousSource, key, url: "data/parc-jean-drapeau-snapshot.json", status: "failed", error: error.message });
  }
  await writeFile(OUTPUT, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ output: OUTPUT, generatedAt: result.generatedAt, records: result.records.length, sources: result.sources.length, failed: result.sources.filter((source) => source.status === "failed").map((source) => source.key), review: review.length }));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });