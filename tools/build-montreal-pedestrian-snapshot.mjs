#!/usr/bin/env node
// Reconstruit le trace reel des rues pietonnes de Montreal a partir de l'API CKAN
// officielle (donnees.montreal.ca) et de la geometrie de rue nommee dans OpenStreetMap.
//
// Pour chaque enregistrement, on utilise:
//   - TOPONYME / TYPE_AXE   -> nom de la rue
//   - LIMITES_1 / LIMITES_2 -> rues transversales bornant le troncon pieton
//   - LATITUDE / LONGITUDE  -> point central (pour cibler la zone Overpass)
//   - LONGUEUR_TRONCON      -> longueur officielle en metres (validation)
//
// On recupere la geometrie de la rue nommee dans OSM, on localise les deux
// intersections avec les rues limites, on coupe le troncon entre les deux, puis on
// valide la longueur reconstruite contre la longueur publiee. Aucun trace n'est
// invente: si la reconstruction n'est pas validee, l'enregistrement est conserve en
// point (focus/popup) sans ligne.
//
// Usage: node tools/build-montreal-pedestrian-snapshot.mjs

import { readFile, writeFile } from "node:fs/promises";

const CKAN = "https://donnees.montreal.ca/api/3/action/datastore_search?resource_id=ef2a8162-0644-47e7-bd03-bea33f14a5d2&limit=100";
const OVERPASS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter"
];
const OUT = "data/montreal-pedestrian-snapshot.json";
const CURATED = "data/montreal-pedestrian-curated.json";
const GEOCODE_CACHE = "tools/montreal-pedestrian-geocode-cache.json";
const NOMINATIM = "https://nominatim.openstreetmap.org/search";
const OVERPASS_MIN_DELAY_MS = 30000;
const OVERPASS_TIMEOUT_MS = 18000;
// Tolerance de validation de longueur (le troncon reconstruit peut differer un peu).
const LEN_TOLERANCE = 0.45;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let lastOverpassRequestAt = 0;

async function waitForOverpassSlot() {
  const elapsed = Date.now() - lastOverpassRequestAt;
  if (elapsed < OVERPASS_MIN_DELAY_MS) await sleep(OVERPASS_MIN_DELAY_MS - elapsed);
  lastOverpassRequestAt = Date.now();
}

function normalizeSearchName(value) {
  return String(value || "")
    .replace(/\b(ave|av)\.?\b/gi, "avenue")
    .replace(/\bboul\.?\b/gi, "boulevard")
    .replace(/\bch\.?\b/gi, "chemin")
    .replace(/\brte\.?\b/gi, "route")
    .replace(/\bE\b/g, "Est")
    .replace(/\bO\b/g, "Ouest")
    .replace(/\./g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function readGeocodeCache() {
  try { return JSON.parse(await readFile(GEOCODE_CACHE, "utf8")); } catch { return {}; }
}

async function geocodeStreet(name, lat, lon, cache) {
  const normalized = normalizeSearchName(name);
  const key = normalized.toLowerCase();
  if (!normalized) return null;
  if (Object.prototype.hasOwnProperty.call(cache, key)) return cache[key];

  const params = new URLSearchParams({
    format: "jsonv2",
    addressdetails: "1",
    polygon_geojson: "1",
    limit: "10",
    q: `${normalized}, Montréal, Québec`
  });
  if (lat && lon) {
    // Sans viewbox, Nominatim ne retourne que 10 segments au hasard parmi tous ceux
    // d'une longue rue (elle est decoupee par quartier) et peut rater celui qui
    // croise reellement la fermeture. Le bounded force le segment geographiquement pertinent.
    const delta = 0.01;
    params.set("viewbox", `${lon - delta},${lat + delta},${lon + delta},${lat - delta}`);
    params.set("bounded", "1");
  }
  try {
    const response = await fetch(`${NOMINATIM}?${params}`, {
      headers: { "User-Agent": "CestDejaLEnfer/1.0 (snapshot builder)" }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const results = await response.json();
    const candidates = results
      .map((result) => ({
        point: [Number(result.lon), Number(result.lat)],
        displayName: result.display_name,
        type: result.type,
        geometry: result.geojson || null,
        distance: lat && lon ? haversine([lon, lat], [Number(result.lon), Number(result.lat)]) : 0,
        // Un candidat rue (LineString) prime toujours sur un POI ponctuel
        // (commerce, station, arrondissement) meme s'il est plus proche.
        isLine: result.geojson && (result.geojson.type === "LineString" || result.geojson.type === "MultiLineString")
      }))
      .filter((result) => Number.isFinite(result.point[0]) && Number.isFinite(result.point[1]))
      .sort((a, b) => (a.isLine === b.isLine ? a.distance - b.distance : a.isLine ? -1 : 1));
    cache[key] = candidates[0] || null;
    await sleep(1100);
    return cache[key];
  } catch (error) {
    cache[key] = null;
    console.warn(`Geocoding failed for ${normalized}: ${error.message}`);
    return null;
  }
}

async function geocodeIntersection(street, cross, lat, lon, cache) {
  const normalizedStreet = normalizeSearchName(street);
  const normalizedCross = normalizeSearchName(cross);
  const key = `intersection:${normalizedStreet}::${normalizedCross}`.toLowerCase();
  if (Object.prototype.hasOwnProperty.call(cache, key)) return cache[key];
  const params = new URLSearchParams({
    format: "jsonv2",
    addressdetails: "1",
    limit: "5",
    q: `${normalizedStreet} et ${normalizedCross}, Montréal, Québec`
  });
  try {
    const response = await fetch(`${NOMINATIM}?${params}`, { headers: { "User-Agent": "CestDejaLEnfer/1.0 (snapshot builder)" } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const results = await response.json();
    const candidate = results
      .map((result) => ({
        point: [Number(result.lon), Number(result.lat)],
        displayName: result.display_name,
        type: result.type,
        distance: lat && lon ? haversine([lon, lat], [Number(result.lon), Number(result.lat)]) : 0
      }))
      .filter(result => Number.isFinite(result.point[0]) && Number.isFinite(result.point[1]))
      .sort((a, b) => a.distance - b.distance)[0] || null;
    cache[key] = candidate;
    await sleep(1100);
    return candidate;
  } catch (error) {
    console.warn(`Intersection geocoding failed for ${normalizedStreet} / ${normalizedCross}: ${error.message}`);
    cache[key] = null;
    return null;
  }
}

async function prefetchGeocodes(records, cache) {
  const names = new Map();
  for (const record of records) {
    const street = coreName(record.TOPONYME);
    // Garder le prefixe de type de rue (rue/boul./place) dans la requete Nominatim:
    // sans lui, Nominatim matche un POI generique au lieu de la vraie rue.
    const cross1Raw = String(record.LIMITES_1 || "").trim();
    const cross2Raw = String(record.LIMITES_2 || "").trim();
    for (const name of [street, cross1Raw, cross2Raw]) {
      const normalized = normalizeSearchName(name);
      if (normalized) names.set(normalized.toLowerCase(), { name: normalized, lat: record.LATITUDE, lon: record.LONGITUDE });
    }
  }

  console.log(`Prefetch geocoding: ${names.size} street names`);
  for (const { name, lat, lon } of names.values()) {
    await geocodeStreet(name, lat, lon, cache);
  }
  await writeFile(GEOCODE_CACHE, JSON.stringify(cache, null, 2), "utf8");
  console.log(`Geocoding cache ready: ${Object.keys(cache).length} entries`);
}

async function overpass(query, tries = 2) {
  let last;
  for (let attempt = 0; attempt < tries; attempt += 1) {
    for (const endpoint of OVERPASS) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), OVERPASS_TIMEOUT_MS);
      try {
        await waitForOverpassSlot();
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "User-Agent": "CestDejaLEnfer/1.0", "Content-Type": "application/x-www-form-urlencoded" },
          body: "data=" + encodeURIComponent(query),
          signal: controller.signal
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        return data;
      } catch (error) {
        last = error;
      } finally {
        clearTimeout(timer);
      }
    }
  }
  throw last;
}

function haversine(a, b) {
  const r = 6371000;
  const p1 = (a[1] * Math.PI) / 180;
  const p2 = (b[1] * Math.PI) / 180;
  const dlat = ((b[1] - a[1]) * Math.PI) / 180;
  const dlon = ((b[0] - a[0]) * Math.PI) / 180;
  const h = Math.sin(dlat / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dlon / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(h));
}

function lineLength(coords) {
  let total = 0;
  for (let i = 0; i < coords.length - 1; i += 1) total += haversine(coords[i], coords[i + 1]);
  return total;
}

function escapeRegex(value) {
  return String(value).replace(/([.\\+*?[\]^${}()|"])/g, "\\$1");
}

function coreName(toponyme) {
  return String(toponyme || "").split("\n")[0].replace(/\s+/g, " ").trim();
}

function cleanCross(limit) {
  return String(limit || "")
    .trim()
    .replace(/^(rue|ave|av|avenue|boul|boulevard|ch|chemin|place|pl)\.?\s+/i, "")
    .trim();
}

function isAutomobileRelevantPedestrianRecord(record) {
  // Only temporary pedestrianization can represent an automobile road that
  // becomes pedestrian-only for a bounded period. Permanent sites are not
  // automotive restrictions and must stay out of this snapshot.
  const mode = String(record.modeImplantation || "").toLowerCase();
  return /temporaire/.test(mode) && !/temporaire\s+[àa]\s+permanent/.test(mode);
}

function stitch(segments) {
  const segs = segments.filter((s) => s.length >= 2).map((s) => s.slice());
  if (segs.length === 0) return [];
  let poly = segs.shift();
  let changed = true;
  while (segs.length && changed) {
    changed = false;
    for (let i = 0; i < segs.length; i += 1) {
      const s = segs[i];
      if (haversine(poly[poly.length - 1], s[0]) < 8) { poly = poly.concat(s.slice(1)); segs.splice(i, 1); changed = true; break; }
      if (haversine(poly[poly.length - 1], s[s.length - 1]) < 8) { poly = poly.concat(s.slice().reverse().slice(1)); segs.splice(i, 1); changed = true; break; }
      if (haversine(poly[0], s[s.length - 1]) < 8) { poly = s.concat(poly.slice(1)); segs.splice(i, 1); changed = true; break; }
      if (haversine(poly[0], s[0]) < 8) { poly = s.slice().reverse().concat(poly.slice(1)); segs.splice(i, 1); changed = true; break; }
    }
  }
  return poly;
}

function nameMatches(tagName, wanted) {
  const a = String(tagName || "").toLowerCase();
  const b = String(wanted || "").toLowerCase();
  return Boolean(a) && Boolean(b) && (a.includes(b) || b.includes(a));
}

function closestIndex(poly, segment) {
  let bestIndex = 0;
  let bestDistance = Infinity;
  for (let i = 0; i < poly.length; i += 1) {
    for (const q of segment) {
      const d = haversine(poly[i], q);
      if (d < bestDistance) { bestDistance = d; bestIndex = i; }
    }
  }
  return [bestIndex, bestDistance];
}

function closestPointOnPolyline(poly, point) {
  const latitudeScale = Math.cos((point[1] * Math.PI) / 180);
  let best = { index: 0, distance: Infinity, point: poly[0] };
  for (let i = 0; i < poly.length - 1; i += 1) {
    const a = poly[i];
    const b = poly[i + 1];
    const ax = (a[0] - point[0]) * latitudeScale;
    const ay = a[1] - point[1];
    const bx = (b[0] - point[0]) * latitudeScale;
    const by = b[1] - point[1];
    const dx = bx - ax;
    const dy = by - ay;
    const denominator = dx * dx + dy * dy;
    const t = denominator ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / denominator)) : 0;
    const projected = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    const distance = haversine(projected, point);
    if (distance < best.distance) best = { index: i, distance, point: projected };
  }
  return best;
}

function lineIntersection(a, b, c, d) {
  const denominator = (a[0] - b[0]) * (c[1] - d[1]) - (a[1] - b[1]) * (c[0] - d[0]);
  if (Math.abs(denominator) < 1e-12) return null;
  const factorA = a[0] * b[1] - a[1] * b[0];
  const factorB = c[0] * d[1] - c[1] * d[0];
  const x = (factorA * (c[0] - d[0]) - (a[0] - b[0]) * factorB) / denominator;
  const y = (factorA * (c[1] - d[1]) - (a[1] - b[1]) * factorB) / denominator;
  const between = (value, first, second) => value >= Math.min(first, second) - 1e-7 && value <= Math.max(first, second) + 1e-7;
  return between(x, a[0], b[0]) && between(y, a[1], b[1]) && between(x, c[0], d[0]) && between(y, c[1], d[1]) ? [x, y] : null;
}

function polylineIntersections(first, second) {
  const intersections = [];
  for (let i = 0; i < first.length - 1; i += 1) {
    for (let j = 0; j < second.length - 1; j += 1) {
      const point = lineIntersection(first[i], first[i + 1], second[j], second[j + 1]);
      if (point) intersections.push(point);
    }
  }
  return intersections;
}

async function reconstruct(street, cross1, cross2, lat, lon, geocodeCache, cross1GeocodeName, cross2GeocodeName) {
  // Geocoder avec le prefixe de type de rue conserve (rue/boul./place...): le retirer
  // fait matcher Nominatim sur un POI generique au lieu de la vraie rue.
  cross1GeocodeName = cross1GeocodeName || cross1;
  cross2GeocodeName = cross2GeocodeName || cross2;
  const s = escapeRegex(street);
  const c1 = escapeRegex(cross1);
  const c2 = escapeRegex(cross2);
  const query = `
[out:json][timeout:45];
(
  way(around:650,${lat},${lon})["highway"]["name"~"${s}",i];
  way(around:650,${lat},${lon})["highway"]["name"~"${c1}",i];
  way(around:650,${lat},${lon})["highway"]["name"~"${c2}",i];
);
out geom;
`;
  let res = { elements: [] };
  try {
    res = await overpass(query);
  } catch (error) {
    console.warn(`Overpass unavailable for ${street}: ${error.message}`);
  }
  const streetSegs = [];
  const cross1Segs = [];
  const cross2Segs = [];
  for (const element of res.elements || []) {
    if (element.type !== "way" || !element.geometry) continue;
    const coords = element.geometry.map((p) => [p.lon, p.lat]);
    const nm = (element.tags || {}).name || "";
    if (nameMatches(nm, street)) streetSegs.push(coords);
    if (nameMatches(nm, cross1)) cross1Segs.push(coords);
    if (nameMatches(nm, cross2)) cross2Segs.push(coords);
  }
  let streetPoint = null;
  if (streetSegs.length === 0) {
    streetPoint = await geocodeStreet(street, lat, lon, geocodeCache);
    if (streetPoint) {
      if (streetPoint.geometry?.type === "LineString") streetSegs.push(streetPoint.geometry.coordinates);
      if (streetPoint.geometry?.type === "MultiLineString") streetSegs.push(...streetPoint.geometry.coordinates);
      let fallback = { elements: [] };
      try {
        fallback = await overpass(`
[out:json][timeout:45];
way(around:250,${streetPoint.point[1]},${streetPoint.point[0]})["highway"]["name"~"${s}",i];
out geom;`, 1);
      } catch (error) {
        console.warn(`Overpass fallback unavailable for ${street}: ${error.message}`);
      }
      for (const element of fallback.elements || []) {
        if (element.type === "way" && element.geometry) streetSegs.push(element.geometry.map((p) => [p.lon, p.lat]));
      }
    }
  }
  if (streetSegs.length === 0) return [null, "street not found after geocoding"];

  const poly = stitch(streetSegs);
  if (poly.length < 2) return [null, "stitch failed"];

  const crossPoints = [];
  for (const [cross, crossGeocodeName, segments] of [[cross1, cross1GeocodeName, cross1Segs], [cross2, cross2GeocodeName, cross2Segs]]) {
    if (segments.length) {
      let nearest = null;
      for (const segment of segments) {
        for (const point of segment) {
          const projection = closestPointOnPolyline(poly, point);
          if (!nearest || projection.distance < nearest.distance) nearest = { point, distance: projection.distance };
        }
      }
      crossPoints.push(nearest);
    } else {
      const result = await geocodeStreet(crossGeocodeName, lat, lon, geocodeCache);
      if (!result) return [null, `cross missing after geocoding (${cross})`];
      const crossGeometry = result.geometry?.type === "LineString" ? result.geometry.coordinates
        : result.geometry?.type === "MultiLineString" ? result.geometry.coordinates.flat() : null;
      const intersections = crossGeometry ? polylineIntersections(poly, crossGeometry) : [];
      if (intersections.length) {
        crossPoints.push({ point: intersections[0], distance: 0 });
      } else {
        crossPoints.push({ point: result.point, distance: closestPointOnPolyline(poly, result.point).distance });
      }
    }
  }
  const projected = crossPoints.map((item) => ({ ...item, ...closestPointOnPolyline(poly, item.point) }));
  if (projected.some((item) => item.distance > 80)) return [null, `intersections too far after geocoding (${projected.map((item) => Math.round(item.distance)).join(",")}m)`];
  if (projected[0].index === projected[1].index) return [null, "same intersection index"];
  const [first, second] = projected[0].index < projected[1].index ? projected : [projected[1], projected[0]];
  const sub = [first.point, ...poly.slice(first.index + 1, second.index + 1), second.point].map((pt) => pt.slice());
  if (sub.length < 2) return [null, "empty segment"];
  return [sub, lineLength(sub)];
}

async function main() {
  const curatedRecords = JSON.parse(await readFile(CURATED, "utf8"));
  const geocodeCache = await readGeocodeCache();
  if (process.argv.includes("--reuse-existing")) {
    const existing = JSON.parse(await readFile(OUT, "utf8"));
    const records = (existing.records || []).filter(isAutomobileRelevantPedestrianRecord);
    await writeFile(OUT, JSON.stringify({
      ...existing,
      extractedAt: new Date().toISOString(),
      records,
      filteredRecordCount: records.length,
      curatedRecords
    }, null, 2), "utf8");
    console.log(`Updated ${OUT} with ${curatedRecords.length} curated records while reusing existing CKAN geometries.`);
    return;
  }

  const response = await fetch(CKAN, { headers: { "User-Agent": "Mozilla/5.0" } });
  const requestedIds = process.argv.find((argument) => argument.startsWith("--only="))?.slice(7).split(",").filter(Boolean);
  const allRecords = (await response.json()).result.records;
  const records = (requestedIds?.length ? allRecords.filter((record) => requestedIds.includes(record.ID_PROJET)) : allRecords)
    .filter((record) => isAutomobileRelevantPedestrianRecord({ modeImplantation: record.MODE_IMPLANTATION }));
  console.log(`CKAN automobile-relevant temporary records: ${records.length}`);

  await prefetchGeocodes(records, geocodeCache);

  const outRecords = [];
  let validated = 0;
  let pointOnly = 0;

  for (let idx = 0; idx < records.length; idx += 1) {
    const r = records[idx];
    const street = coreName(r.TOPONYME);
    const typeAxe = String(r.TYPE_AXE || "").trim();
    const streetFull = typeAxe ? `${typeAxe} ${street}`.trim() : street;
    const cross1 = cleanCross(r.LIMITES_1);
    const cross2 = cleanCross(r.LIMITES_2);
    const cross1Raw = String(r.LIMITES_1 || "").trim();
    const cross2Raw = String(r.LIMITES_2 || "").trim();
    const lat = r.LATITUDE;
    const lon = r.LONGITUDE;
    const published = r.LONGUEUR_TRONCON;
    const nom = String(r.NOM_PROJET || street).trim();

    let geometry = null;
    let geomNote = "point";
    if (lat && lon && cross1 && cross2) {
      let sub;
      let info;
      try {
        [sub, info] = await reconstruct(streetFull, cross1, cross2, lat, lon, geocodeCache, cross1Raw, cross2Raw);
      } catch (error) {
        sub = null;
        info = String(error);
      }
      await sleep(1000);
      if (sub && typeof info === "number") {
        if (!published || Math.abs(info - Number(published)) <= Number(published) * LEN_TOLERANCE) {
          geometry = { type: "LineString", coordinates: sub.map((c) => [Number(c[0].toFixed(6)), Number(c[1].toFixed(6))]) };
          geomNote = `validated (${Math.round(info)}m vs ${published}m)`;
        } else {
          geomNote = `length mismatch (${Math.round(info)}m vs ${published}m)`;
        }
      } else {
        geomNote = `point (${info})`;
      }
    }

    const rec = {
      id: `montreal-pieton-${String(r.ID_PROJET || "").toLowerCase()}`,
      projectId: r.ID_PROJET,
      title: nom,
      streetName: streetFull,
      limits: [r.LIMITES_1, r.LIMITES_2],
      publishedLengthMeters: published,
      typeRepartage: r.TYPE_REPARTAGE,
      modeImplantation: r.MODE_IMPLANTATION,
      borough: r.ARRONDISSEMENT,
      dateOuverture: r.DATE_OUVERTURE,
      sourceUrl: "https://donnees.montreal.ca/dataset/rues-pietonnes-et-partagees",
      geometryStatus: geomNote
    };
    if (geometry) {
      rec.geometry = geometry;
      validated += 1;
    } else {
      rec.geometry = lat && lon ? { type: "Point", coordinates: [Number(lon.toFixed(6)), Number(lat.toFixed(6))] } : null;
      pointOnly += 1;
    }
    rec.point = lat && lon ? [Number(lon.toFixed(6)), Number(lat.toFixed(6))] : null;
    outRecords.push(rec);
    console.log(`[${String(idx + 1).padStart(2)}/${records.length}] ${nom.slice(0, 40).padEnd(40)} -> ${geomNote}`);
  }

  const snapshot = {
    extractedAt: new Date().toISOString(),
    sourceApi: CKAN,
    geometrySource: "OpenStreetMap (Overpass) - rue nommee entre limites publiees, validee par LONGUEUR_TRONCON",
    validatedLineCount: validated,
    pointOnlyCount: pointOnly,
    records: outRecords,
    filteredRecordCount: outRecords.length,
    curatedRecords
  };
  if (!process.argv.includes("--preview")) await writeFile(OUT, JSON.stringify(snapshot, null, 2), "utf-8");
  await writeFile(GEOCODE_CACHE, JSON.stringify(geocodeCache, null, 2), "utf-8");
  console.log(process.argv.includes("--preview")
    ? `\nPreview: ${validated} validated lines, ${pointOnly} point-only.`
    : `\nSaved ${OUT}: ${validated} validated lines, ${pointOnly} point-only.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
