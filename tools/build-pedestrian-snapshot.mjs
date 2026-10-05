import { readFile, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import { mergeMarathonPedestrianSnapshot } from "./build-marathon-closures.mjs";

const OUTPUT = "data/pedestrian-closures-snapshot.json";
const baseUrl = process.env.PEDESTRIAN_VALIDATION_URL || "http://localhost:5500";
const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto" }).format(new Date());

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
  let previous = { records: [], sources: [] };
  try { previous = JSON.parse(await readFile(OUTPUT, "utf8")); } catch (error) { if (error.code !== "ENOENT") throw error; }
  if (process.argv.includes("--marathon-only")) {
    if (previous.schemaVersion !== 1) throw new Error("Existing pedestrian snapshot required");
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
            const text = fields.join("\n");
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
                  publishedType: normalize === "montreal" ? (record.pedestrianArea === "park" ? attributes.occupancyImpactParkImpactBlockedType : impacts[impactIndex]?.sidewalk?.blockedType) : "Sentier_Ferme",
                  backSidewalk: impacts[impactIndex]?.backSidewalk || null };
                retained.push(record);
              });
              if (!output.length && /Trottoirs_Liens_Cyclable/i.test(attributes.REPERCUSSIONS_ENTRAVE || "")) pending.push({ id: String(attributes.OBJECTID), reason: "combined-sidewalk-cycle-impact", text: attributes.REPERCUSSIONS_ENTRAVE });
              return;
            }
            const cyclingImpacts = api.publishedCyclingImpacts(text);
            if (normalize === "normalizeLavalIdentifyResult" && /^(?:voie|piste|bande) cyclable$/i.test(attributes.ENTRAVE || attributes["Entrave :"] || "")) {
              cyclingImpacts.push({ index: 0, text, pedestrianArea: "path", affectedUsers: ["cyclists"], severity: "moderate",
                side: { code: "not-applicable", published: null, geometryStatus: "worksite-only" } });
            }
            if (!cyclingImpacts.length && !/pi[ée]ton|trottoir|sidewalk|pedestrian|sentier|footpath/i.test(text)) {
              if (/\b(?:cyclab\w*|cyclist\w*|v[ée]los?|bicycle\w*|bikes?|cycling)\b/i.test(text)) {
                pending.push({ id: String(attributes.globalid || attributes.OBJECTID || attributes.FID || attributes.id || index), reason: "cycling-mention-without-pedestrian-evidence", text });
              }
              return;
            }
            let impacts = [...api.publishedPedestrianImpacts(text), ...cyclingImpacts];
            if (normalize === "normalizeTerrebonneFeature" && attributes.statut_avis === "Actif"
              && attributes.type_entrave === "Fermeture complete" && /tunnel/i.test(attributes.localisation)
              && /s[ée]curit[ée] des pi[ée]tons/i.test(attributes.description)) {
              impacts = [{ index: 0, text: [attributes.description, attributes.note_type_circulation].filter(Boolean).join("\n"), pedestrianArea: "path", severity: "critical", side: { code: "not-applicable", published: null, geometryStatus: "published" } }];
            }
            if (!impacts.length) { pending.push({ id: String(attributes.OBJECTID || attributes.FID || attributes.id || index), reason: "pedestrian-mention-without-explicit-restriction", text }); return; }
            let base;
            if (normalize === "local") {
              base = { ...item, category: "municipal", source: options.name, sourceKind: key, borough: options.municipality,
                responsible: options.name, periods: ["day", "night"], sourceUrl: item.sourceUrl || options.sourceUrl };
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
              sourceDescription: record.description || record.impact,
              severity: record.severity, impact: record.impact, geometry: record.geometry, point: record.point || representativePoint(record.geometry),
              side: record.side || { code: "unknown", published: null, geometryStatus: "worksite-only" },
              evidence: record.evidence,
              details: (record.details || []).filter(([, value]) => value !== null && value !== undefined && value !== "").map(([label, value]) => ({ labelKey: labelKey(label) || null, label, value, valueKey: labelKey(value) || null }))
            })) };
        }, { raw, normalize, key, today, options });
        const unique = new Map();
        for (const record of result.records) {
          const stored = { ...record, sourceKey: key, sourceCheckedAt: checkedAt || sourceExtractedAt };
          if (unique.has(stored.id) && JSON.stringify(unique.get(stored.id)) !== JSON.stringify(stored)) throw new Error(`Conflicting duplicate ${stored.id}`);
          unique.set(stored.id, stored);
        }
        records.push(...unique.values());
        review.push(...result.review.map((item) => ({ ...item, sourceKey: key })));
        sources.push({ key, url, status: options.local ? "local-snapshot" : "checked", checkedAt, sourceExtractedAt, received: raw.length, retained: unique.size, reviewCount: result.review.length });
        console.log(`${key}: ${raw.length} received, ${unique.size} retained, ${result.review.length} review (${options.local ? "local snapshot" : "verified live"})`);
      } catch (error) {
        const old = previous.sources.find((source) => source.key === key);
        const retained = previous.records.filter((record) => record.sourceKey === key && (!record.endDate || record.endDate >= today));
        records.push(...retained);
        const message = error.cause?.code ? `${error.message} (${error.cause.code})` : error.message;
        sources.push({ key, url, status: "failed", checkedAt: old?.checkedAt || null, sourceExtractedAt: old?.sourceExtractedAt || null, retained: retained.length, error: message });
        console.log(`${key}: FAILED (${message}), ${retained.length} previous records retained`);
      }
    }

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
    await collect("repentigny", urls.repentignyOpen511, async () => {
      const events = [];
      let url = urls.repentignyOpen511;
      const seen = new Set();
      while (url) {
        if (seen.has(url)) throw new Error("Open511 pagination cycle");
        seen.add(url);
        const data = await json(url);
        if (!Array.isArray(data.events)) throw new Error("Missing Open511 events");
        events.push(...data.events.filter((event) => event.status === "ACTIVE"));
        url = data.pagination?.next_url ? new URL(data.pagination.next_url, url).href : null;
      }
      return events;
    }, "normalizeRepentignyEvent");
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
  } finally {
    await browser.close();
  }
  if (!sources.some((source) => source.status === "checked" && source.retained > 0)) throw new Error("No live pedestrian source verified; output unchanged");
  const uniqueIds = new Set(records.map((record) => record.id));
  if (uniqueIds.size !== records.length) throw new Error("Duplicate consolidated IDs; output unchanged");
  const snapshot = { schemaVersion: 1, generatedAt: new Date().toISOString(),
    policy: "Pedestrian and cycling impacts. Cycling-only records identify affectedUsers explicitly and do not confirm pedestrian restrictions. Per-source checkedAt is authoritative; local snapshots are not reverified. Unknown sidewalk sides are never inferred. Geometry is the published worksite unless explicitly identified otherwise. Selected documentary review notices are displayed separately without geometry or inferred dates.",
    sources, records: records.sort((first, second) => first.id.localeCompare(second.id)), review };
  const marathon = JSON.parse(await readFile("data/Marathon-Beneva-Mtl-2026.json", "utf8"));
  const result = mergeMarathonPedestrianSnapshot(snapshot, marathon);
  await writeFile(OUTPUT, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ output: OUTPUT, generatedAt: result.generatedAt, records: result.records.length, sources: result.sources.length, failed: result.sources.filter((source) => source.status === "failed").map((source) => source.key), review: review.length }));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });