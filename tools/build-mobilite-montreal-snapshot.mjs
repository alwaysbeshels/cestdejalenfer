import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { distanceMeters } from "./snapshot-geometry.mjs";

const SOURCE_URL = "https://mobilitemontreal.gouv.qc.ca/fermetures-majeures/";
const MTMD_URL = "https://ws.mapserver.transports.gouv.qc.ca/swtq?service=wfs&version=2.0.0&request=getfeature&typename=ms:chantiers_mtmdet&srsname=EPSG:4326&outputformat=geojson";
const OUTPUT = new URL("../data/mobilite-montreal-snapshot.json", import.meta.url);
const CATALOG = new URL("../data/sources.js", import.meta.url);
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const clean = (value) => String(value || "").replace(/\s+/g, " ").trim();

export const IMPACT_META = {
  road_closed: { severity: "critical", label: "Fermeture compl\u00e8te" },
  direction_closed: { severity: "critical", label: "Direction ferm\u00e9e" },
  ramp_closed: { severity: "critical", label: "Bretelle / acc\u00e8s ferm\u00e9" },
  lane_reduction: { severity: "major", label: "Voie retranch\u00e9e" },
  contraflow: { severity: "major", label: "Circulation \u00e0 contresens" },
  lane_configuration: { severity: "major", label: "Configuration des voies" },
  channelized_access: { severity: "moderate", label: "Acc\u00e8s canalis\u00e9" }
};

export function mtmdFingerprint(feature) {
  const properties = feature.properties;
  return JSON.stringify([String(properties.identifiant || feature.id), properties.routeAutoroute || "",
    clean(properties.localisation), properties.direction || "", properties.debut || "", properties.fin || "",
    properties.entrave || "", feature.geometry]);
}

export function pjcciFingerprint(notice) {
  return JSON.stringify([notice.url, notice.segmentId, notice.segmentTitle || notice.title,
    notice.segmentDateStart || notice.datedebut || null, notice.segmentTimeStart || null,
    notice.segmentDateEnd || notice.datefin || null, notice.segmentTimeEnd || null,
    notice.segmentImpact || notice.description || "", notice.segmentDirection || "",
    notice.segmentStreets || "", notice.openEnded === true, notice.geometry || null]);
}

function zonedInstant(date, time) {
  const offset = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto", timeZoneName: "longOffset" })
    .formatToParts(new Date(`${date}T12:00:00Z`)).find((part) => part.type === "timeZoneName").value.replace("GMT", "");
  return `${date}T${time}:00${offset}`;
}

export function activeIntervals(record, bulletin) {
  if (!record.weeklySchedule) {
    return [`${zonedInstant(record.startDate || record.observationStart || bulletin.startDate, record.startTime || "00:00")}/${zonedInstant(record.endDate || record.observationEnd || bulletin.endDate, record.endTime || "23:59")}`];
  }
  const intervals = [];
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const limit = Date.parse(zonedInstant(record.endDate, record.endTime));
  for (let date = new Date(`${record.startDate}T12:00:00Z`); date.toISOString().slice(0, 10) < record.endDate; date.setUTCDate(date.getUTCDate() + 1)) {
    const entry = record.weeklySchedule.find((entry) => entry.day === days[date.getUTCDay()]);
    if (!entry) continue;
    const startDate = date.toISOString().slice(0, 10);
    const nextDate = new Date(date);
    if (entry.end <= entry.start) nextDate.setUTCDate(nextDate.getUTCDate() + 1);
    const start = zonedInstant(startDate, entry.start);
    const end = zonedInstant(nextDate.toISOString().slice(0, 10), entry.end);
    assert.ok(Date.parse(end) <= limit, `${record.id}: recurring window exceeds published end`);
    intervals.push(`${start}/${end}`);
  }
  return intervals;
}

export function geometryFromOsm(source, elements) {
  const parts = (source.parts || [source]).map((part) => {
    const nodes = [];
    for (const id of part.wayIds) {
      const way = elements.get(`way${id}`);
      assert.ok(way, `Missing OSM way ${id}`);
      for (const [key, expected] of Object.entries(source.expectedTags)) assert.equal(way.tags?.[key], expected, `OSM ${id}: ${key} changed`);
      if (nodes.length) assert.equal(nodes.at(-1), way.nodes[0], `Disconnected OSM ways at ${id}`);
      nodes.push(...(nodes.length ? way.nodes.slice(1) : way.nodes));
    }
    const start = nodes.indexOf(part.startNode);
    const end = nodes.indexOf(part.endNode);
    assert.ok(start >= 0 && end > start, "Reviewed OSM boundary nodes missing or reversed");
    return nodes.slice(start, end + 1).map((id) => {
      const node = elements.get(`node${id}`);
      assert.ok(node, `Missing OSM node ${id}`);
      return [node.lon, node.lat];
    });
  });
  return { type: parts.length === 1 ? "LineString" : "MultiLineString", coordinates: parts.length === 1 ? parts[0] : parts };
}

export function validateSnapshot(snapshot, ready = snapshot.status === "reviewed") {
  assert.equal(snapshot.schemaVersion, 1);
  assert.equal(snapshot.timeZone, "America/Toronto");
  assert.equal(snapshot.sourceUrl, SOURCE_URL);
  assert.ok(snapshot.notices.length && snapshot.images.length && snapshot.records.length);
  assert.equal(new Set(snapshot.records.map((record) => record.id)).size, snapshot.records.length);
  for (const notice of snapshot.notices) {
    assert.ok(notice.analysis && Array.isArray(notice.imageIds));
    assert.ok(snapshot.records.some((record) => record.noticeId === notice.id) || snapshot.excluded.some((entry) => entry.noticeId === notice.id), `Unaccounted notice ${notice.id}`);
    for (const id of notice.imageIds) assert.ok(snapshot.images.some((image) => image.id === id));
  }
  for (const image of snapshot.images) assert.ok(/^[a-f0-9]{64}$/.test(image.sha256) && image.analysis);
  for (const record of snapshot.records) {
    const meta = IMPACT_META[record.impactType];
    assert.ok(meta, `${record.id}: unsupported impact type`);
    assert.ok(snapshot.notices.some((notice) => notice.id === record.noticeId));
    assert.ok(record.impact && record.direction && record.streets && record.geometrySource);
    for (const value of [record.startDate, record.endDate].filter(Boolean)) assert.match(value, /^\d{4}-\d{2}-\d{2}$/);
    for (const value of [record.startTime, record.endTime].filter(Boolean)) assert.match(value, /^(?:[01]\d|2[0-3]):[0-5]\d$/);
    const intervals = activeIntervals(record, snapshot.bulletin);
    assert.ok(intervals.length, `${record.id}: no temporal coverage`);
    for (const interval of intervals) {
      const [start, end] = interval.split("/").map(Date.parse);
      assert.ok(Number.isFinite(start) && end > start, `${record.id}: invalid interval`);
    }
    if (!ready) continue;
    assert.equal(record.severity, meta.severity);
    assert.deepEqual(record.activeIntervals, intervals);
    if (record.geometrySource.kind === "unresolved") {
      assert.equal(record.geometry, null);
      assert.equal(record.display, false);
      continue;
    }
    assert.equal(record.display, true);
    assert.ok(["LineString", "MultiLineString"].includes(record.geometry?.type));
    for (const line of record.geometry.type === "LineString" ? [record.geometry.coordinates] : record.geometry.coordinates) {
      assert.ok(line.length >= 2);
      for (const [index, coordinate] of line.entries()) {
        assert.ok(coordinate.length === 2 && coordinate.every(Number.isFinite));
        assert.ok(coordinate[0] >= -74.8 && coordinate[0] <= -72.8 && coordinate[1] >= 45 && coordinate[1] <= 46.3);
        if (index) assert.ok(distanceMeters(line[index - 1], coordinate) < 1500, `${record.id}: suspicious geometry jump`);
      }
    }
  }
  if (ready) {
    assert.ok(Number.isFinite(Date.parse(snapshot.extractedAt)));
    assert.equal(snapshot.coverage.mappedImpacts, snapshot.records.filter((record) => record.display).length);
    const keys = new Set();
    for (const binding of snapshot.duplicateBindings) {
      assert.ok(snapshot.records.some((record) => record.id === binding.recordId && record.display));
      assert.ok(binding.fingerprint && binding.sourceId && binding.sourceUrl);
      assert.ok(!keys.has(binding.sourceId), `Duplicate source binding ${binding.sourceId}`);
      keys.add(binding.sourceId);
    }
  }
}

async function download(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(60000) });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return Buffer.from(await response.arrayBuffer());
}

async function captureBulletin() {
  const html = (await download(SOURCE_URL)).toString("utf8");
  const browser = await chromium.launch({ headless: true });
  let bulletin;
  try {
    const page = await browser.newPage();
    await page.route("**/*", (route) => route.abort());
    await page.setContent(html, { waitUntil: "domcontentloaded" });
    bulletin = await page.evaluate((sourceUrl) => {
      const content = document.querySelector(".content--reseau");
      if (!content) throw new Error("Bulletin content container missing");
      const clean = (value) => String(value || "").replace(/\s+/g, " ").trim();
      const sections = [];
      const images = new Map();
      let section = null;
      let group = "weekend";
      for (const element of content.children) {
        const text = clean(element.textContent);
        if (element.tagName === "H3") {
          if (text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase() === "A PREVOIR") {
            group = "upcoming";
            section = null;
          } else {
            section = { id: `section-${sections.length + 1}`, title: text, group, blocks: [] };
            sections.push(section);
          }
        } else if (element.tagName === "H4" && group === "upcoming") {
          section = { id: `section-${sections.length + 1}`, title: text, group, blocks: [] };
          sections.push(section);
        }
        const links = [...element.querySelectorAll("a[href]")].map((anchor) => ({
          text: clean(anchor.textContent), url: new URL(anchor.getAttribute("href"), sourceUrl).href
        }));
        const imageUrls = [...element.querySelectorAll("img")].map((image) => {
          const url = new URL(image.closest("a[href]")?.getAttribute("href") || image.getAttribute("src"), sourceUrl).href;
          if (!images.has(url)) images.set(url, { url, alt: clean(image.alt), sectionIds: [] });
          if (section && !images.get(url).sectionIds.includes(section.id)) images.get(url).sectionIds.push(section.id);
          return url;
        });
        if (section && element.tagName !== "H3" && !(element.tagName === "H4" && group === "upcoming")) {
          if (text || imageUrls.length) section.blocks.push({ tag: element.tagName, text, links, imageUrls });
        }
      }
      return { title: clean(content.querySelector("h1")?.textContent), sections, images: [...images.values()], supplements: [] };
    }, SOURCE_URL);
    for (const section of bulletin.sections) {
      const documentLinks = section.blocks.flatMap((block) => block.links)
        .filter((link) => link.url.startsWith("https://www.quebec.ca/nouvelles/actualites/details/"));
      for (const link of documentLinks) {
        const documentHtml = (await download(link.url)).toString("utf8");
        await page.setContent(documentHtml, { waitUntil: "domcontentloaded" });
        const supplement = await page.evaluate((url) => {
          const content = document.querySelector(".news-text-wrap");
          if (!content) throw new Error("Supplement content container missing");
          return {
            url,
            text: content.textContent.replace(/\s+/g, " ").trim(),
            imageUrls: [...content.querySelectorAll("img[src]")].map((image) => new URL(image.getAttribute("src"), url).href)
          };
        }, link.url);
        supplement.sectionId = section.id;
        supplement.contentSha256 = sha256(supplement.text);
        bulletin.supplements.push(supplement);
        for (const url of supplement.imageUrls) {
          bulletin.images.push({ url, alt: "", sectionIds: [section.id], supplementUrl: link.url });
        }
      }
    }
  } finally {
    await browser.close();
  }
  if (!bulletin.title || !bulletin.sections.length || !bulletin.images.length) {
    throw new Error("Incomplete bulletin capture; no snapshot was written");
  }
  const directory = join(tmpdir(), "mobilite-montreal-evidence");
  await mkdir(directory, { recursive: true });
  for (const image of bulletin.images) {
    const bytes = await download(image.url);
    image.sha256 = sha256(bytes);
    image.localPath = join(directory, new URL(image.url).pathname.split("/").pop());
    await writeFile(image.localPath, bytes);
  }
  const evidence = {
    sourceUrl: SOURCE_URL,
    capturedAt: new Date().toISOString(),
    contentSha256: sha256(JSON.stringify({ title: bulletin.title, sections: bulletin.sections })),
    ...bulletin
  };
  await writeFile(join(directory, "bulletin.json"), `${JSON.stringify(evidence, null, 2)}\n`);
  return { directory, evidence };
}

export function verifyReview(review, evidence) {
  assert.equal(evidence.contentSha256, review.bulletin.contentSha256, "Bulletin changed: review every notice before refreshing");
  assert.equal(evidence.sections.length, review.notices.length, "Notice coverage changed");
  assert.equal(evidence.images.length, review.images.length, "Image coverage changed");
  assert.equal(evidence.supplements.length, review.supplements.length, "Supplement coverage changed");
  for (const image of review.images) assert.equal(evidence.images.find((item) => item.url === image.url)?.sha256, image.sha256, `Image changed: ${image.id}`);
  for (const supplement of review.supplements) assert.equal(evidence.supplements.find((item) => item.url === supplement.url)?.contentSha256, supplement.contentSha256, "Linked release changed");
}

export function verifyReviewedBindings(review, bindings) {
  const approved = new Map((review.duplicateBindings || []).map((binding) => [binding.sourceId, binding]));
  for (const binding of bindings) {
    const previous = approved.get(binding.sourceId);
    if (previous) assert.equal(binding.fingerprint, previous.fingerprint, `Compared source changed: ${binding.sourceId}; review before renewing duplicate suppression`);
  }
}

async function fetchReviewedOsm(records) {
  const ids = [...new Set(records.filter((record) => record.geometrySource.kind === "osm")
    .flatMap((record) => (record.geometrySource.parts || [record.geometrySource]).flatMap((part) => part.wayIds)))];
  if (!ids.length) return new Map();
  const ways = JSON.parse((await download(`https://api.openstreetmap.org/api/0.6/ways.json?ways=${ids.join(",")}`)).toString("utf8"));
  const elements = new Map(ways.elements.map((way) => [`way${way.id}`, way]));
  const nodeIds = [...new Set(ways.elements.flatMap((way) => way.nodes))];
  for (let offset = 0; offset < nodeIds.length; offset += 200) {
    const data = JSON.parse((await download(`https://api.openstreetmap.org/api/0.6/nodes.json?nodes=${nodeIds.slice(offset, offset + 200).join(",")}`)).toString("utf8"));
    data.elements.forEach((node) => elements.set(`node${node.id}`, node));
  }
  return elements;
}

export function compileSnapshot(review, evidence, mtmd, osm, pjcci, verifiedAt) {
  verifyReview(review, evidence);
  validateSnapshot(review, false);
  const snapshot = structuredClone(review);
  snapshot.duplicateBindings = [];
  const features = new Map(mtmd.features.map((feature) => [Number(feature.properties.identifiant || feature.id), feature]));
  for (const notice of snapshot.notices) {
    const section = evidence.sections.find((section) => section.id === notice.id);
    assert.equal(section.title, notice.title, `Notice changed: ${notice.id}`);
    notice.sourceBlocks = section.blocks;
    notice.group = section.group;
  }
  for (const record of snapshot.records) {
    record.severity = IMPACT_META[record.impactType].severity;
    record.trafficLabel = IMPACT_META[record.impactType].label;
    record.activeIntervals = activeIntervals(record, snapshot.bulletin);
    record.periods = record.activeIntervals.some((interval) => interval.split("/")[0].slice(0, 10) !== interval.split("/")[1].slice(0, 10)) ? ["day", "night"] : ["day"];
    const source = record.geometrySource;
    record.display = source.kind !== "unresolved";
    if (source.kind === "unresolved") {
      record.geometry = null;
    } else if (source.kind === "osm") {
      record.geometry = geometryFromOsm(source, osm);
      record.geometryProvenance = { provider: "OpenStreetMap", verifiedAt, ways: (source.parts || [source]).flatMap((part) => part.wayIds).map((id) => {
        const way = osm.get(`way${id}`);
        return { id, version: way.version, timestamp: way.timestamp, tags: way.tags, nodes: way.nodes, sourceUrl: `https://www.openstreetmap.org/way/${id}` };
      }) };
    } else {
      assert.equal(source.kind, "mtmd");
      const feature = features.get(source.featureId);
      assert.ok(feature, `MTMD ${source.featureId} missing: re-review the record`);
      const properties = feature.properties;
      assert.equal(clean(properties.localisation), source.expectedLocation, `${record.id}: MTMD location changed`);
      assert.equal(properties.routeAutoroute || "", source.expectedRoute, `${record.id}: MTMD route changed`);
      assert.equal(properties.direction, source.expectedDirection, `${record.id}: MTMD direction changed`);
      record.geometry = feature.geometry;
      record.geometryProvenance = { provider: "MTMD / Quebec 511", verifiedAt, featureId: source.featureId, sourceUrl: MTMD_URL,
        geometrySha256: sha256(JSON.stringify(feature.geometry)), published: {
          location: properties.localisation, direction: properties.direction, start: properties.debut,
          end: properties.fin, updatedAt: properties.miseAJour, impact: properties.entrave
        } };
      if (record.matchingMtmdId) {
        assert.equal(record.matchingMtmdId, source.featureId);
        if (record.preferExistingMtmd) {
          const first = record.activeIntervals[0].split("/")[0].slice(0, 16).replace("T", " ");
          const last = record.activeIntervals.at(-1).split("/")[1].slice(0, 16).replace("T", " ");
          assert.ok(properties.debut.replaceAll("/", "-").slice(0, 16) <= first && properties.fin.replaceAll("/", "-").slice(0, 16) >= last,
            `${record.id}: preferred native period no longer covers the bulletin`);
        }
        snapshot.duplicateBindings.push({ sourceKind: "quebec511-mtmd-wfs", sourceId: `q511-${source.featureId}`,
          recordId: record.id, fingerprint: mtmdFingerprint(feature), sourceUrl: properties.urlFrancais || "https://www.quebec511.info/fr/Carte/Default.aspx",
          preferExisting: record.preferExistingMtmd === true,
          impactType: record.impactType,
          relation: record.uncertainties?.length ? "same-event-with-published-differences" : "same-event",
          published: record.geometryProvenance.published });
      }
    }
    if (record.matchingPjcci) {
      for (const segmentId of record.matchingPjcci.segmentIds) {
        const notice = pjcci.notices.find((notice) => notice.url === record.matchingPjcci.url && notice.segmentId === segmentId);
        assert.ok(notice, `PJCCI component missing: ${segmentId}`);
        assert.equal(notice.segmentDateStart, record.startDate);
        assert.equal(notice.segmentDateEnd, record.endDate);
        assert.equal(notice.segmentTimeStart, record.startTime);
        assert.equal(notice.segmentTimeEnd, record.endTime);
        snapshot.duplicateBindings.push({ sourceKind: "pjcci", sourceId: `pjcci-${notice.url}-${segmentId}`,
          recordId: record.id, fingerprint: pjcciFingerprint(notice), sourceUrl: `https://jacquescartierchamplain.ca${notice.url}`,
          preferExisting: record.matchingPjcci.preferExisting === true,
          relation: "same-event-component", published: { title: notice.segmentTitle, direction: notice.segmentDirection, impact: notice.segmentImpact,
            start: `${notice.segmentDateStart} ${notice.segmentTimeStart}`, end: `${notice.segmentDateEnd} ${notice.segmentTimeEnd}` } });
      }
    }
  }
  verifyReviewedBindings(review, snapshot.duplicateBindings);
  snapshot.status = "reviewed";
  snapshot.extractedAt = verifiedAt;
  snapshot.crossSourceReview.pjcciSnapshotExtractedAt = pjcci.extractedAt;
  snapshot.coverage = { notices: snapshot.notices.length, images: snapshot.images.length, roadImpacts: snapshot.records.length,
    mappedImpacts: snapshot.records.filter((record) => record.display).length,
    unmappedRecordIds: snapshot.records.filter((record) => !record.display).map((record) => record.id),
    duplicateBindings: snapshot.duplicateBindings.length };
  validateSnapshot(snapshot);
  return snapshot;
}

function updateCatalog(content, extractedAt) {
  let count = 0;
  const updated = content.replace(/\{ name: "(?:Mobilite Montreal - Fermetures majeures|Mobilit\u00e9 Montr\u00e9al - fermetures majeures|Mobilit\u00e9 Montr\u00e9al - Snapshot des fermetures majeures)"[^\n]+? \}/g, (entry) => {
    count += 1;
    return /extractedAt: "/.test(entry) ? entry.replace(/extractedAt: "[^"]*"/, `extractedAt: "${extractedAt}"`)
      : entry.replace(/ \}$/, `, extractedAt: "${extractedAt}" }`);
  });
  assert.equal(count, 3, "Missing Mobilite Montreal freshness entries in source catalog");
  return updated;
}

async function main() {
  const review = JSON.parse(await readFile(OUTPUT, "utf8"));
  if (process.argv.includes("--check")) {
    validateSnapshot(review);
    console.log(JSON.stringify({ status: review.status, ...review.coverage }, null, 2));
    return;
  }
  const capture = await captureBulletin();
  if (process.argv.includes("--capture")) {
    console.log(JSON.stringify({ directory: capture.directory, title: capture.evidence.title, sections: capture.evidence.sections.length, images: capture.evidence.images.length }, null, 2));
    return;
  }
  verifyReview(review, capture.evidence);
  const mtmd = JSON.parse((await download(MTMD_URL)).toString("utf8"));
  const osm = await fetchReviewedOsm(review.records);
  const pjcci = JSON.parse(await readFile(new URL("../data/pjcci-work-advisories-snapshot.json", import.meta.url), "utf8"));
  const snapshot = compileSnapshot(review, capture.evidence, mtmd, osm, pjcci, new Date().toISOString());
  const catalog = updateCatalog(await readFile(CATALOG, "utf8"), snapshot.extractedAt);
  const temporary = new URL("../data/mobilite-montreal-snapshot.json.tmp", import.meta.url);
  await writeFile(temporary, `${JSON.stringify(snapshot, null, 2)}\n`);
  await rename(temporary, OUTPUT);
  await writeFile(CATALOG, catalog);
  console.log(JSON.stringify({ extractedAt: snapshot.extractedAt, ...snapshot.coverage }, null, 2));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();