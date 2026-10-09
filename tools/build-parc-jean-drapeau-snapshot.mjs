import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { clipLineToPolygon, directedRoadPath, directedRoadCorridor, distanceMeters, pointInPolygon } from "./snapshot-geometry.mjs";

export const SOURCE_URL = "https://www.parcjeandrapeau.com/fr/avis-et-alertes/";
export const SNAPSHOT_PATH = "data/parc-jean-drapeau-snapshot.json";

export function parseNoticeIndex({ html, url }) {
  const document = new DOMParser().parseFromString(html, "text/html");
  const count = document.body.textContent.match(/Résultat\s*:\s*(\d+)\s*avis/);
  const list = document.querySelector(".notice-list");
  if (!count || !list) throw new Error("Parc Jean-Drapeau: missing notice index");
  const records = [...list.children].map(row => {
    const link = row.querySelector("h5 a[href]");
    if (!link) throw new Error("Parc Jean-Drapeau: notice link missing");
    const sourceUrl = new URL(link.getAttribute("href"), url);
    const identity = /^\/fr\/avis-et-alertes\/(\d+)\/$/.exec(sourceUrl.pathname);
    const paragraphs = [...row.querySelectorAll("p")].map(element => element.textContent.trim());
    const status = paragraphs.find(text => /^(En cours|Terminé|À venir|A venir|Planifié)$/.test(text.replace(/\s+/g, " ")));
    if (sourceUrl.origin !== new URL(url).origin || !identity || !status) throw new Error("Parc Jean-Drapeau: unknown notice identity or status");
    return { id: identity[1], sourceUrl: sourceUrl.href, title: link.textContent.trim(), status,
      publishedText: paragraphs.find(text => /^Publié le/.test(text)) || null,
      updatedText: paragraphs.find(text => /^Mis à jour/.test(text)) || null };
  });
  const pages = [...document.querySelectorAll("a[href]")].map(link => new URL(link.getAttribute("href"), url))
    .filter(link => link.origin === new URL(url).origin && link.pathname === new URL(url).pathname && /^\d+$/.test(link.searchParams.get("page") || ""))
    .map(link => { link.hash = ""; return link.href; });
  if (new Set(records.map(record => record.id)).size !== records.length) throw new Error("Parc Jean-Drapeau: duplicate index identities");
  return { total: Number(count[1]), pages: [...new Set(pages)], records };
}

export async function collectNoticeIndex(page) {
  const pending = [SOURCE_URL];
  const checked = new Set();
  const records = new Map();
  let total = null;
  while (pending.length) {
    const url = pending.shift();
    if (checked.has(url)) continue;
    const response = await page.request.get(url, { timeout: 45000 });
    assert.equal(response.status(), 200, `Parc Jean-Drapeau index HTTP ${response.status()}`);
    const parsed = await page.evaluate(parseNoticeIndex, { html: await response.text(), url });
    if (total !== null) assert.equal(parsed.total, total, "Parc Jean-Drapeau: index changed during pagination");
    total = parsed.total;
    checked.add(url);
    for (const record of parsed.records) {
      if (records.has(record.id)) assert.deepEqual(records.get(record.id), record, `Parc Jean-Drapeau: conflicting notice ${record.id}`);
      else records.set(record.id, record);
    }
    for (const next of parsed.pages) if (new URL(next).searchParams.get("page") !== "1" && !checked.has(next) && !pending.includes(next)) pending.push(next);
  }
  assert.equal(records.size, total, "Parc Jean-Drapeau: incomplete pagination");
  return { received: total, pages: [...checked], records: [...records.values()], checkedAt: new Date().toISOString() };
}

export function parseNoticeDetail({ html, expectedTitle }) {
  const document = new DOMParser().parseFromString(html, "text/html");
  const clean = value => value.replace(/\s+/g, " ").trim();
  const elements = [...document.querySelectorAll("h2,h3,h4,h5,p,img")];
  const start = elements.findIndex(element => /^H[23]$/.test(element.tagName) && clean(element.textContent) === clean(expectedTitle));
  if (start < 0) throw new Error("Parc Jean-Drapeau: detail title does not match index");
  const paragraphs = [];
  const modes = [];
  for (const element of elements.slice(start + 1)) {
    if (/^H[23]$/.test(element.tagName) && /^Service à la clientèle|^Sujets associés/.test(clean(element.textContent))) break;
    if (element.tagName === "P") {
      const text = element.textContent.trim();
      if (text && !/^(Avis en cours|Publié le|Mis à jour le|Mobilité)$/.test(clean(text)) && !/^(Publié le|Mis à jour le)/.test(clean(text))) paragraphs.push(text);
    }
    if (element.tagName === "IMG" && /notices-ico-/.test(element.getAttribute("src") || "")) modes.push(element.getAttribute("alt"));
  }
  if (!paragraphs.length || !modes.length) throw new Error("Parc Jean-Drapeau: detail text or transport modes missing");
  return { description: paragraphs.join("\n\n"), publishedModes: [...new Set(modes)] };
}

export function publishedDate(text) {
  const months = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  const match = String(text || "").match(/\b(\d{1,2})\s+([a-zéûô]+)\s+(20\d{2})\b/i);
  if (!match || !months.includes(match[2].toLowerCase())) return null;
  const value = `${match[3]}-${String(months.indexOf(match[2].toLowerCase()) + 1).padStart(2, "0")}-${match[1].padStart(2, "0")}`;
  return new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value ? value : null;
}

export function noticePeriod(record) {
  const text = record.title.replace(/\s+/g, " ");
  const match = text.match(/\ble (dimanche|lundi|mardi|mercredi|jeudi|vendredi|samedi) (\d{1,2}) ([a-zéûô]+)(?: (20\d{2}))?, de (\d{1,2}) h(?: (\d{2}))? à (\d{1,2}) h(?: (\d{2}))?/i);
  const published = publishedDate(record.publishedText);
  if (!match || !published) return null;
  const year = match[4] || published.slice(0, 4);
  const date = publishedDate(`${match[2]} ${match[3]} ${year}`);
  if (!date || date < published) return null;
  const weekday = new Intl.DateTimeFormat("fr-CA", { timeZone: "UTC", weekday: "long" }).format(new Date(`${date}T12:00:00Z`));
  if (weekday !== match[1].toLowerCase()) return null;
  const startTime = `${match[5].padStart(2, "0")}:${match[6] || "00"}`;
  const endTime = `${match[7].padStart(2, "0")}:${match[8] || "00"}`;
  if (Number(match[5]) > 23 || Number(match[7]) > 23 || Number(match[6] || 0) > 59 || Number(match[8] || 0) > 59 || startTime >= endTime) return null;
  return { startDate: date, endDate: date, startTime, endTime, timeZone: "America/Montreal",
    dateBasis: match[4] ? "Year, date and hours published in title" : "Year from publication date; title weekday/date cross-checked" };
}

export async function collectNotices(page) {
  const index = await collectNoticeIndex(page);
  const records = [];
  const excluded = [];
  const review = [];
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto" }).format(new Date());
  for (const entry of index.records) {
    if (entry.status === "Terminé") { excluded.push({ ...entry, reason: "published-finished-status" }); continue; }
    const response = await page.request.get(entry.sourceUrl, { timeout: 45000 });
    assert.equal(response.status(), 200, `Parc Jean-Drapeau notice ${entry.id}: HTTP ${response.status()}`);
    const detail = await page.evaluate(parseNoticeDetail, { html: await response.text(), expectedTitle: entry.title });
    const record = { ...entry, ...detail, publishedDate: publishedDate(entry.publishedText), updatedDate: publishedDate(entry.updatedText), checkedAt: new Date().toISOString() };
    const period = noticePeriod(record);
    if (period && period.endDate < today) { excluded.push({ ...entry, reason: "published-period-ended", ...period }); continue; }
    records.push({ ...record, ...(period || {}), openEnded: !period && entry.status === "En cours" });
    if (!period) review.push({ id: entry.id, sourceUrl: entry.sourceUrl, reason: "Published period requires source-specific review", title: entry.title, text: detail.description });
  }
  return { extractedAt: new Date().toISOString(), sourceUrl: SOURCE_URL, authority: "Société du parc Jean-Drapeau", schemaVersion: 1,
    timeZone: "America/Montreal", receivedCount: index.received, pages: index.pages, records, excluded, review };
}

export function buildParkSnapshot(notices, inputs) {
  const result = { ...notices, automobileRecords: [], pedestrianRecords: [], accessExceptions: [], review: [...notices.review],
    renderingPolicy: "Reference park polygons are never painted as road closures. Only verified road/path lines are displayed; authorized Casino access stays uncoloured." };
  const closure = notices.records.find(record => /Notre-Dame/.test(record.description) && /pas accessible au grand public/.test(record.description));
  const access = notices.records.find(record => /clients du Casino devront emprunter le pont de la Concorde/.test(record.description.replace(/\s+/g, " ")));
  for (const record of notices.records) if (record !== closure && record !== access) result.review.push({ id: record.id, sourceUrl: record.sourceUrl, title: record.title, text: record.description, reason: "New notice requires a verified location and impact mapping" });
  result.counts = { received: notices.receivedCount, retainedNotices: notices.records.length, excluded: notices.excluded.length, automobileLines: 0, pedestrianPaths: 0, authorizedRoadSegments: 0, review: result.review.length };
  if (!closure || !access || !closure.startDate || !access.startDate) {
    for (const record of notices.records) if (!result.review.some(entry => entry.id === record.id)) result.review.push({ id: record.id, sourceUrl: record.sourceUrl, title: record.title, text: record.description, reason: "Notice period or complementary access conditions require review before drawing" });
    result.counts.review = result.review.length;
    return result;
  }
  assert.ok(closure.publishedModes.includes("Marche") && closure.publishedModes.includes("Automobile"));
  for (const field of ["startDate", "endDate", "startTime", "endTime"]) assert.equal(closure[field], access[field], "Park access notices have different periods; review required");
  const areas = inputs.parks.features.filter(feature => feature.properties.Nom === "Jean-Drapeau"
    && pointInPolygon(inputs.casino.point, [feature.geometry.coordinates[0]]) && !pointInPolygon(inputs.casino.point, feature.geometry.coordinates));
  assert.equal(areas.length, 1, "Casino location does not identify one official Notre-Dame park surface");
  const area = areas[0];
  const roadFeatures = inputs.roads.data.features;
  const namedRoads = roadFeatures.filter(feature => ["pont de la Concorde", "avenue Pierre-Dupuy", "avenue du Casino"].includes(feature.properties.sur.trim()));
  const bridge = namedRoads.filter(feature => feature.properties.sur.trim() === "pont de la Concorde");
  assert.equal(bridge.length, 1, "Expected the official Concorde bridge");
  const casinoRoads = namedRoads.filter(feature => feature.properties.sur.trim() === "avenue du Casino");
  assert.equal(casinoRoads.length, 2, "Casino entry/exit road identities changed");
  const firstNodes = [casinoRoads[0].properties.noNoeudDebut, casinoRoads[0].properties.noNoeudFin];
  const casinoNodes = firstNodes.filter(node => [casinoRoads[1].properties.noNoeudDebut, casinoRoads[1].properties.noNoeudFin].includes(node));
  assert.equal(casinoNodes.length, 1, "Casino roads no longer meet at a unique published node");
  const casinoNode = casinoNodes[0];
  const casinoCoordinate = casinoRoads[0].properties.noNoeudDebut === casinoNode ? casinoRoads[0].geometry.coordinates[0] : casinoRoads[0].geometry.coordinates.at(-1);
  assert.ok(distanceMeters(casinoCoordinate, inputs.casino.point) < 300, "Casino road endpoint is not near the published Casino location");
  const bridgeCoordinates = bridge[0].geometry.coordinates;
  const bridgeNode = bridgeCoordinates[0][0] < bridgeCoordinates.at(-1)[0] ? bridge[0].properties.noNoeudDebut : bridge[0].properties.noNoeudFin;
  const approachNodes = new Set(roadFeatures.filter(feature => feature.properties.sur.trim() === "chemin des Moulins")
    .flatMap(feature => [feature.properties.noNoeudDebut, feature.properties.noNoeudFin]));
  const entries = [...new Set(namedRoads.flatMap(feature => [feature.properties.noNoeudDebut, feature.properties.noNoeudFin]).filter(node => approachNodes.has(node)))];
  assert.ok(entries.length, "Pierre-Dupuy approach junctions missing");
  const inbound = directedRoadPath(namedRoads, entries, [casinoNode]);
  const outbound = directedRoadPath(namedRoads, [casinoNode], entries);
  assert.ok(inbound.nodes.includes(bridgeNode) && outbound.nodes.includes(bridgeNode), "Casino access does not pass through Concorde");
  const openRoads = new Map([...directedRoadCorridor(namedRoads, entries, [casinoNode]), ...directedRoadCorridor(namedRoads, [casinoNode], entries)].map(feature => [feature.properties.id, feature]));
  result.accessExceptions.push({
    id: `parc-jean-drapeau-${access.id}-casino-access`, noticeId: access.id, sourceUrl: access.sourceUrl, checkedAt: access.checkedAt,
    startDate: access.startDate, endDate: access.endDate, startTime: access.startTime, endTime: access.endTime,
    affectedUsers: ["motorists"], authorizedUsers: "Clients du Casino", description: access.description,
    rendering: "No closure or parking colour is drawn on the authorized access corridor. This is not a declaration that parking is permitted.",
    inbound: { nodes: inbound.nodes, segments: inbound.edges.map(edge => ({ id: edge.id, forward: edge.forward })) },
    outbound: { nodes: outbound.nodes, segments: outbound.edges.map(edge => ({ id: edge.id, forward: edge.forward })) },
    geometrySource: { sourceUrl: inputs.roads.url, verifiedAt: inputs.roads.checkedAt, circulationField: "sensCir: 0 both ways, 1 coordinate order, -1 reverse order", casinoLocation: inputs.casino,
      corridorScope: "All simple directed connections through the named Concorde, Pierre-Dupuy and Casino roads, including connecting junction branches. No total closure is asserted on these access links; this does not open unrelated park roads." },
    roadFeatures: [...openRoads.values()]
  });
  const base = {
    reference: closure.id, sourceNoticeId: closure.id, source: "Société du parc Jean-Drapeau - Avis de mobilité", sourceUrl: closure.sourceUrl,
    sourceCheckedAt: closure.checkedAt, title: closure.title, category: /Marathon/i.test(closure.description) ? "event" : "regional",
    municipality: "Montréal", borough: "Ville-Marie", responsible: null,
    startDate: closure.startDate, endDate: closure.endDate, startTime: closure.startTime, endTime: closure.endTime,
    timeZone: closure.timeZone, openEnded: false, periods: ["day"], severity: "critical", impact: closure.description,
    scheduleText: `${access.description}\n${access.sourceUrl}`,
    side: { code: "not-applicable", published: null, geometryStatus: "verified-path-in-official-restricted-area" },
    evidence: { kind: "official-notice-and-located-road-or-path", text: closure.description, sourceUrl: closure.sourceUrl, publishedModes: closure.publishedModes },
    geometryNoteKey: "parcJeanDrapeau.lineGeometry",
    details: [{ labelKey: "parcJeanDrapeau.accessException", value: access.description }, { labelKey: "parcJeanDrapeau.notice", value: access.sourceUrl }]
  };
  for (const feature of roadFeatures) {
    if (openRoads.has(feature.properties.id) || feature.geometry.type !== "LineString") continue;
    const pieces = clipLineToPolygon(feature.geometry.coordinates, area.geometry.coordinates);
    if (!pieces.length) continue;
    result.automobileRecords.push({ ...base, id: `parc-jean-drapeau-${closure.id}-road-${feature.properties.id}`, sourceKind: "parc-jean-drapeau",
      streets: feature.properties.sur.trim(), automobileImpact: true, affectedUsers: ["motorists"], roadType: "street",
      geobaseId: feature.properties.id, geometry: pieces.length === 1 ? { type: "LineString", coordinates: pieces[0] } : { type: "MultiLineString", coordinates: pieces },
      geometrySource: { sourceUrl: inputs.roads.url, verifiedAt: inputs.roads.checkedAt, properties: feature.properties, originalGeometry: feature.geometry,
        clipping: "Original road line intersected with the official restricted park surface, with its holes preserved" }
    });
  }
  for (const way of inputs.paths.ways) {
    if (!["footway", "path", "pedestrian", "steps"].includes(way.tags.highway)
      || ["no", "private", "customers", "destination"].includes(way.tags.access) || ["no", "private"].includes(way.tags.foot)) continue;
    const pieces = clipLineToPolygon(way.coordinates, area.geometry.coordinates);
    if (!pieces.length) continue;
    result.pedestrianRecords.push({ ...base, id: `pedestrian-parc-jean-drapeau-${closure.id}-way-${way.id}`, sourceKey: "parc-jean-drapeau",
      sourceKind: "pedestrian-parc-jean-drapeau", streets: way.tags.name || "Île Notre-Dame - chemin du parc", pedestrianArea: "park",
      automobileImpact: false, affectedUsers: ["pedestrians"],
      geometry: pieces.length === 1 ? { type: "LineString", coordinates: pieces[0] } : { type: "MultiLineString", coordinates: pieces }, point: pieces[0][0],
      geometrySource: { sourceUrl: inputs.paths.url, verifiedAt: inputs.paths.checkedAt, osmWayId: way.id, sourceUpdatedAt: way.timestamp,
        tags: Object.fromEntries(["name", "highway", "access", "foot", "bicycle", "oneway", "bridge", "tunnel"].filter(key => way.tags[key] !== undefined).map(key => [key, way.tags[key]])),
        originalGeometry: { type: "LineString", coordinates: way.coordinates }, attribution: inputs.paths.attribution,
        clipping: "Published pedestrian path intersected with the official restricted park surface, with its holes preserved" }
    });
  }
  result.referenceArea = { sourceUrl: inputs.parks.url, verifiedAt: inputs.parks.checkedAt, feature: area, display: false };
  result.geometrySources = { roads: { sourceUrl: inputs.roads.url, verifiedAt: inputs.roads.checkedAt }, paths: { sourceUrl: inputs.paths.url, verifiedAt: inputs.paths.checkedAt, attribution: inputs.paths.attribution }, casino: inputs.casino };
  result.counts = { received: notices.receivedCount, retainedNotices: notices.records.length, excluded: notices.excluded.length,
    automobileLines: result.automobileRecords.length, pedestrianPaths: result.pedestrianRecords.length, authorizedRoadSegments: openRoads.size, review: result.review.length };
  assert.ok(result.automobileRecords.length && result.pedestrianRecords.length, "No verified park closure lines found");
  assert.ok(result.automobileRecords.every(record => !openRoads.has(record.geobaseId)), "An authorized road was coloured as closed");
  return result;
}

export function mergeParkPedestrianSnapshot(previous, snapshot) {
  assert.equal(snapshot?.schemaVersion, 1, "Invalid park input");
  assert.ok(Array.isArray(snapshot.pedestrianRecords), "Missing park pedestrian records");
  const key = "parc-jean-drapeau";
  const legacy = record => record.sourceKey === "marathon-access-notices" && /^https:\/\/www\.parcjeandrapeau\.com\/fr\/avis-et-alertes\/\d+\/$/.test(record.sourceUrl || "");
  const retained = previous.records.filter(record => record.sourceKey !== key && !legacy(record));
  const records = [...retained, ...snapshot.pedestrianRecords].sort((first, second) => first.id.localeCompare(second.id));
  assert.equal(new Set(records.map(record => record.id)).size, records.length, "Conflicting park pedestrian IDs");
  const review = (previous.review || []).filter(record => record.sourceKey !== key);
  review.push(...snapshot.review.map(record => ({ ...record, sourceKey: key })));
  const result = { ...previous, generatedAt: new Date().toISOString(), records, review,
    sources: [...previous.sources.filter(source => ![key, "marathon-access-notices"].includes(source.key)),
      { key, url: SNAPSHOT_PATH, status: "local-snapshot", checkedAt: null, sourceExtractedAt: snapshot.extractedAt,
        received: snapshot.records.length, retained: snapshot.pedestrianRecords.length, reviewCount: snapshot.review.length }] };
  assert.deepEqual(result.records.filter(record => record.sourceKey !== key), retained.sort((first, second) => first.id.localeCompare(second.id)), "Other pedestrian records changed");
  return result;
}

export function parseOsmPaths(xml) {
  const document = new DOMParser().parseFromString(xml, "application/xml");
  if (document.querySelector("parsererror") || document.documentElement.tagName !== "osm") throw new Error("Invalid OSM XML");
  const nodes = new Map([...document.querySelectorAll("osm > node")].map(node => [node.getAttribute("id"), [Number(node.getAttribute("lon")), Number(node.getAttribute("lat"))]]));
  const ways = [...document.querySelectorAll("osm > way")].map(way => ({ id: way.getAttribute("id"), timestamp: way.getAttribute("timestamp"),
    tags: Object.fromEntries([...way.querySelectorAll("tag")].map(tag => [tag.getAttribute("k"), tag.getAttribute("v")])),
    coordinates: [...way.querySelectorAll("nd")].map(node => nodes.get(node.getAttribute("ref"))) })).filter(way => way.tags.highway);
  if (!ways.length || ways.some(way => way.coordinates.length < 2 || way.coordinates.some(point => !point || !point.every(Number.isFinite)))) throw new Error("Incomplete OSM path response");
  return { nodeCount: nodes.size, ways };
}

async function collectGeometry(page) {
  const requestJson = async url => {
    const response = await page.request.get(url, { timeout: 60000 });
    assert.equal(response.status(), 200, `Park geometry HTTP ${response.status()}`);
    const data = await response.json();
    assert.equal(data.type, "FeatureCollection", "Invalid park geometry response");
    assert.ok(data.features.length, "Empty park geometry response");
    if (data.totalFeatures !== undefined) assert.equal(Number(data.totalFeatures), data.features.length, "Incomplete park geometry response");
    return { url, checkedAt: new Date().toISOString(), data };
  };
  const roadUrl = new URL("https://api.montreal.ca/api/it-platforms/geomatic/wfs-maps/montreal/ows");
  roadUrl.search = new URLSearchParams({ service: "WFS", version: "1.0.0", request: "GetFeature", typeName: "montreal:geobase", outputFormat: "application/json", srsname: "EPSG:4326", bbox: "-73.549,45.488,-73.512,45.529,EPSG:4326" });
  const roads = await requestJson(roadUrl.href);
  assert.match(roads.data.crs?.properties?.name || "", /4326/);
  const parkCapture = await requestJson("https://donnees.montreal.ca/dataset/2e9e4d2f-173a-4c3d-a5e3-565d79baa27d/resource/35796624-15df-4503-a569-797665f8768e/download/espace_vert.json");
  const parks = { url: parkCapture.url, checkedAt: parkCapture.checkedAt, features: parkCapture.data.features.filter(feature => feature.properties.Nom === "Jean-Drapeau") };
  const pathUrl = "https://api.openstreetmap.org/api/0.6/map?bbox=-73.540,45.495,-73.518,45.526";
  const pathResponse = await page.request.get(pathUrl, { timeout: 60000 });
  assert.equal(pathResponse.status(), 200, `OSM paths HTTP ${pathResponse.status()}`);
  const paths = { ...await page.evaluate(parseOsmPaths, await pathResponse.text()), url: pathUrl, checkedAt: new Date().toISOString(), attribution: "OpenStreetMap contributors (ODbL)" };
  const casinoUrl = "https://www.parcjeandrapeau.com/fr/casino-de-montreal-jeux-prestige/";
  const casinoResponse = await page.request.get(casinoUrl, { timeout: 45000 });
  assert.equal(casinoResponse.status(), 200, `Casino location HTTP ${casinoResponse.status()}`);
  const points = await page.evaluate(html => {
    const document = new DOMParser().parseFromString(html, "text/html");
    if (!/Casino de Montréal/.test(document.querySelector("h1")?.textContent || "")) throw new Error("Wrong Casino location page");
    const points = [...document.querySelectorAll('a[href*="openstreetmap.org"]')].map(link => new URL(link.getAttribute("href")))
      .filter(link => link.searchParams.has("mlat") && link.searchParams.has("mlon"))
      .map(link => [Number(link.searchParams.get("mlon")), Number(link.searchParams.get("mlat"))]);
    return [...new Map(points.map(point => [JSON.stringify(point), point])).values()];
  }, await casinoResponse.text());
  assert.equal(points.length, 1, "Ambiguous published Casino location");
  return { roads, parks, paths, casino: { url: casinoUrl, checkedAt: new Date().toISOString(), point: points[0], role: "Published Casino location, not a roadwork point or an inferred vehicle entrance" } };
}

function comparableNotices(snapshot) {
  return JSON.stringify({ received: snapshot.receivedCount, records: snapshot.records.map(({ checkedAt, ...record }) => record), excluded: snapshot.excluded });
}

export function updateCatalogTimestamp(text, timestamp) {
  return text.split("\n").map(line => {
    if (![SOURCE_URL, SNAPSHOT_PATH].some(url => line.includes(`url: "${url}"`))) return line;
    assert.match(line, /extractedAt: "[^"]+"/, "Park catalog entry has no verification timestamp");
    return line.replace(/extractedAt: "[^"]+"/, `extractedAt: "${timestamp}"`);
  }).join("\n");
}

async function main() {
  let previous = null;
  try { previous = JSON.parse(readFileSync(SNAPSHOT_PATH, "utf8")); } catch (error) { if (error.code !== "ENOENT") throw error; }
  let result;
  let metadataOnly = false;
  const captureIndex = process.argv.indexOf("--from-captures");
  if (captureIndex >= 0) {
    const directory = process.argv[captureIndex + 1];
    assert.ok(directory, "A verified capture directory is required");
    const read = name => JSON.parse(readFileSync(path.join(directory, name), "utf8"));
    result = buildParkSnapshot(read("verified-notices.json"), { roads: read("islands-geobase.json"), parks: read("park-surfaces.json"), paths: read("islands-osm-roads.json"), casino: read("casino-location.json") });
    if (previous) result.extractedAt = previous.extractedAt;
  } else {
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage();
      const notices = await collectNotices(page);
      if (previous && comparableNotices(previous) === comparableNotices(notices)) {
        result = { ...previous, extractedAt: notices.extractedAt };
        metadataOnly = true;
      } else if (!notices.records.length) {
        result = { ...notices, automobileRecords: [], pedestrianRecords: [], accessExceptions: [], counts: { received: notices.receivedCount, retainedNotices: 0, excluded: notices.excluded.length, automobileLines: 0, pedestrianPaths: 0, authorizedRoadSegments: 0, review: notices.review.length } };
      } else result = buildParkSnapshot(notices, await collectGeometry(page));
    } finally { await browser.close(); }
  }
  assert.ok(result.extractedAt && result.receivedCount === result.records.length + result.excluded.length, "Incomplete park snapshot");
  const catalogPath = "data/sources.js";
  const catalog = readFileSync(catalogPath, "utf8");
  const updatedCatalog = updateCatalogTimestamp(catalog, result.extractedAt);
  writeFileSync(SNAPSHOT_PATH, `${JSON.stringify(result, null, 2)}\n`);
  if (updatedCatalog !== catalog) writeFileSync(catalogPath, updatedCatalog);
  console.log(JSON.stringify({ output: SNAPSHOT_PATH, extractedAt: result.extractedAt, ...result.counts, metadataOnly, captureOnly: captureIndex >= 0 }));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(`Parc Jean-Drapeau snapshot unchanged: ${error.message}`); process.exitCode = 1; });
}