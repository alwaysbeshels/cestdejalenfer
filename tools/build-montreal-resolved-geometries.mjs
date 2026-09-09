#!/usr/bin/env node
// Resout les geometries de troncons des entraves de la Ville de Montreal contre la
// geobase officielle (montreal:geobase), sans inventer aucune geometrie.
//
// Pour chaque impact publie dans le flux officiel des entraves, on dispose de:
//   - impact.spatialAnalysis.shortName  -> rue touchee
//   - impact.spatialAnalysis.fromShortName / fromName -> intersection de depart
//   - impact.spatialAnalysis.toShortName / toName     -> intersection d'arrivee
//   - impact.spatialAnalysis.lineGeometry (rare)      -> ligne deja publiee
//   - properties.locationOccupancyZoneGeometryCoordinates -> emprise (polygone)
//
// Quand lineGeometry n'est pas publie, on recupere dans la geobase les troncons
// officiels de la rue (champ "sur"), on repere les segments touchant les deux
// intersections publiees, puis on chaine les troncons adjacents entre elles par
// recherche de plus court chemin sur le graphe des troncons. Aucune geometrie
// n'est fabriquee: chaque coordonnee sortie provient d'un troncon geobase.
//
// Si la resolution est impossible ou ambigue (intersection absente, graphe
// deconnecte), l'impact est conserve avec geometryStatus="occupancy-zone" et le
// polygone d'emprise officiel, pour un affichage distinct et honnete.
//
// Usage: node tools/build-montreal-resolved-geometries.mjs [--limit N]

import { writeFile } from "node:fs/promises";

const WFS_BASE = "https://api.montreal.ca/api/it-platforms/geomatic/wfs-maps/montreal/ows";
const ENTRAVES_URL = `${WFS_BASE}?service=WFS&version=1.0.0&request=GetFeature&typeName=montreal:entraves-ponctuelles&outputFormat=application/json&CQL_FILTER=affectedArea%20like%20%27%25street%25%27`;
const OUT_SNAPSHOT = "data/montreal-entraves-geometries-snapshot.json";
const OUT_CACHE = "tools/geobase-cache.json";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ---------------------------------------------------------------------------
// Normalisation des noms de rues (publique et deterministe)
// ---------------------------------------------------------------------------

function normName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/^(rue|avenue|av\.?|boulevard|boul\.?|chemin|ch\.?|place|pl\.?|impasse|promenade|terrasse|cours|allee|autoroute|aut\.?)\s+/i, "")
    .replace(/^(du|de la|de l'|de|des|d')\s*/i, "")
    .replace(/\s+(est|ouest|nord|sud|e\.|o\.)$/i, "")
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
// Coeur du nom pour la requete ILIKE. La geobase est sensible aux accents
// (mesure: ILIKE '%Peloquin%' retourne 12 segments, ILIKE '%peloquin%' en
// retourne 0), donc on conserve les accents du nom publie par le permis et
// on retire seulement le type de voie et le point cardinal.
function streetQueryCore(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/^(rue|avenue|av\.?|boulevard|boul\.?|chemin|ch\.?|place|pl\.?|impasse|promenade|terrasse|cours|allee|autoroute|aut\.)\s+/i, "")
    .replace(/\s+(est|ouest|nord|sud|e\.|o\.)$/i, "")
    .trim();
}
// ---------------------------------------------------------------------------
// Outils geometriques
// ---------------------------------------------------------------------------

function haversine(a, b) {
  const r = 6371000;
  const p1 = (a[1] * Math.PI) / 180;
  const p2 = (b[1] * Math.PI) / 180;
  const dlat = ((b[1] - a[1]) * Math.PI) / 180;
  const dlon = ((b[0] - a[0]) * Math.PI) / 180;
  const h = Math.sin(dlat / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dlon / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(h));
}

function pointKey(coord, precision = 5) {
  // ~1m a cette precision; utilise pour identifier les noeuds partages.
  return `${coord[0].toFixed(precision)},${coord[1].toFixed(precision)}`;
}

// ---------------------------------------------------------------------------
// Telechargement
// ---------------------------------------------------------------------------

async function fetchJson(url, tries = 3) {
  let last;
  for (let attempt = 0; attempt < tries; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { "User-Agent": "CestDejaLEnfer/1.0" } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      last = error;
      await sleep(1500);
    }
  }
  throw last;
}

async function loadGeobaseStreet(streetRaw, cache) {
  const streetNorm = normName(streetRaw);
  if (cache.has(streetNorm)) return cache.get(streetNorm);
  const raw = String(streetRaw || "").trim().replace(/\s+/g, " ");
  const core = streetQueryCore(raw);
  // On interroge avec les accents exacts (geobase sensible aux accents):
  // nom complet publie puis coeur sans type de voie.
  const queries = [...new Set([raw, core].filter(Boolean))];
  const collected = [];
  for (const q of queries) {
    const params = new URLSearchParams({
      service: "WFS",
      version: "1.0.0",
      request: "GetFeature",
      typeName: "montreal:geobase",
      outputFormat: "application/json",
      srsname: "EPSG:4326",
      CQL_FILTER: `sur ILIKE '%${q.replace(/'/g, "''")}%'`
    });
    const url = `${WFS_BASE}?${params.toString()}`;
    try {
      const gj = await fetchJson(url);
      for (const f of gj.features || []) {
        if (f.geometry?.type === "LineString" && f.geometry.coordinates.length >= 2) {
          collected.push({
            de: normName(f.properties?.de),
            a: normName(f.properties?.a),
            sur: normName(f.properties?.sur),
            coords: f.geometry.coordinates
          });
        }
      }
    } catch (error) {
      console.error(`  geobase fetch failed for "${streetNorm}" ("${q}"): ${error.message}`);
    }
  }
  // Deduplique les segments identiques retournes par plusieurs variantes.
  const seen = new Set();
  const all = collected.filter((s) => {
    const key = `${s.coords[0]}|${s.coords[s.coords.length - 1]}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  // Correspondance controlee: egalite exacte d'abord, puis inclusion dans
  // un sens ou l'autre (ex: permis "45e" vs geobase "45e avenue").
  // L'inclusion est acceptee seulement si le nom normalise du permis fait
  // au moins 3 caracteres pour eviter les collisions de noms tres courts.
  const exact = all.filter((s) => s.sur === streetNorm);
  const segments = exact.length > 0
    ? exact
    : (streetNorm.length >= 3
        ? all.filter((s) => s.sur.includes(streetNorm) || streetNorm.includes(s.sur))
        // Noms tres courts (ex: "5e"): inclusion seulement si le segment
        // commence par le nom ("5e avenue", "5e rue"), jamais l'inverse,
        // pour ne pas aspirer "15e", "25e", "35e"...
        : all.filter((s) => s.sur.startsWith(streetNorm + " ") || s.sur === streetNorm));
  cache.set(streetNorm, segments);
  return segments;
}

// ---------------------------------------------------------------------------
// Resolution d'un impact: rue + intersection depart -> intersection arrivee
// ---------------------------------------------------------------------------

function resolveImpactGeometry(street, from, to, segments) {
  const fromN = normName(from);
  const toN = normName(to);
  if (!street || !fromN || !toN || segments.length === 0) return null;

  // Indexe les segments par intersection normalisee (de/a sont symetriques).
  const byCross = new Map();
  const addToIndex = (cross, idx) => {
    if (!cross) return;
    if (!byCross.has(cross)) byCross.set(cross, []);
    byCross.get(cross).push(idx);
  };
  segments.forEach((seg, idx) => {
    addToIndex(seg.de, idx);
    addToIndex(seg.a, idx);
  });

  // Tolere les correspondances partielles (ex: "Jean-Talon" vs "jean-talon").
  const findIndices = (wanted) => {
    const exact = byCross.get(wanted);
    if (exact) return exact;
    const partial = [];
    for (const [cross, indices] of byCross) {
      if (cross.includes(wanted) || wanted.includes(cross)) partial.push(...indices);
    }
    return partial.length ? [...new Set(partial)] : null;
  };

  const startIndices = findIndices(fromN);
  const endSet = new Set(findIndices(toN) || []);
  if (!startIndices || endSet.size === 0) return null;

  // Graphe des segments: deux segments sont voisins s'ils partagent un noeud
  // (meme intersection de/a) ou une extremite geometrique proche.
  const adjacency = segments.map(() => new Map());
  const nodeIndex = new Map();
  const registerNode = (key, idx) => {
    if (!nodeIndex.has(key)) nodeIndex.set(key, []);
    nodeIndex.get(key).push(idx);
  };
  segments.forEach((seg, idx) => {
    if (seg.de) {
      if (!nodeIndex.has(`x:${seg.de}`)) nodeIndex.set(`x:${seg.de}`, []);
      nodeIndex.get(`x:${seg.de}`).push(idx);
    }
    if (seg.a) {
      if (!nodeIndex.has(`x:${seg.a}`)) nodeIndex.set(`x:${seg.a}`, []);
      nodeIndex.get(`x:${seg.a}`).push(idx);
    }
    registerNode(`p:${pointKey(seg.coords[0])}`, idx);
    registerNode(`p:${pointKey(seg.coords[seg.coords.length - 1])}`, idx);
  });
  for (const indices of nodeIndex.values()) {
    for (let i = 0; i < indices.length; i += 1) {
      for (let j = i + 1; j < indices.length; j += 1) {
        const [a, b] = [indices[i], indices[j]];
        if (!adjacency[a].has(b)) adjacency[a].set(b, segDistance(segments[a], segments[b]));
        if (!adjacency[b].has(a)) adjacency[b].set(a, segDistance(segments[b], segments[a]));
      }
    }
  }

  // Dijkstra multi-sources depuis les segments touchant l'intersection de depart.
  const dist = new Map();
  const prev = new Map();
  const heap = [];
  const push = (idx, d) => { heap.push([idx, d]); heap.sort((x, y) => x[1] - y[1]); };
  startIndices.forEach((idx) => { dist.set(idx, segLength(segments[idx])); prev.set(idx, null); push(idx, dist.get(idx)); });

  let bestEnd = null;
  while (heap.length) {
    const [idx, d] = heap.shift();
    if (d > (dist.get(idx) ?? Infinity)) continue;
    if (endSet.has(idx)) { bestEnd = idx; break; }
    for (const [next, w] of adjacency[idx]) {
      const nd = d + w;
      if (nd < (dist.get(next) ?? Infinity)) {
        dist.set(next, nd);
        prev.set(next, idx);
        push(next, nd);
      }
    }
  }
  if (bestEnd === null) return null;

  // Reconstitue la liste ordonnee des segments du chemin.
  const path = [];
  for (let at = bestEnd; at !== null; at = prev.get(at)) path.unshift(at);
  if (path.length === 0) return null;

  // Chaine les coordonnees des segments dans le bon sens (tolerance 8m aux jointures).
  const polylines = path.map((idx) => segments[idx].coords.slice());
  let line = polylines.shift();
  for (const seg of polylines) {
    const endPt = line[line.length - 1];
    const startPt = line[0];
    const s0 = seg[0];
    const s1 = seg[seg.length - 1];
    if (haversine(endPt, s0) < 8) line = line.concat(seg.slice(1));
    else if (haversine(endPt, s1) < 8) line = line.concat(seg.slice().reverse().slice(1));
    else if (haversine(startPt, s1) < 8) line = seg.concat(line.slice(1));
    else if (haversine(startPt, s0) < 8) line = seg.slice().reverse().concat(line.slice(1));
    else return null; // chemin non chainable: on refuse plutot que d'inventer.
  }
  if (line.length < 2) return null;
  return line.map((c) => [Number(c[0].toFixed(6)), Number(c[1].toFixed(6))]);
}

function segLength(seg) {
  let total = 0;
  for (let i = 0; i < seg.coords.length - 1; i += 1) total += haversine(seg.coords[i], seg.coords[i + 1]);
  return total;
}

function segDistance(a, b) {
  // Distance minimale entre extremites (poids du graphe).
  const pts = [a.coords[0], a.coords[a.coords.length - 1]];
  const qts = [b.coords[0], b.coords[b.coords.length - 1]];
  let best = Infinity;
  for (const p of pts) for (const q of qts) best = Math.min(best, haversine(p, q));
  return best + (segLength(a) + segLength(b)) / 2;
}

// ---------------------------------------------------------------------------
// Programme principal
// ---------------------------------------------------------------------------

async function main() {
  const limitArg = process.argv.indexOf("--limit");
  const limit = limitArg >= 0 ? Number(process.argv[limitArg + 1]) : Infinity;

  console.log("Telechargement du flux officiel des entraves...");
  const data = await fetchJson(ENTRAVES_URL);
  const features = data.features || [];
  console.log(`Entraves publiees: ${features.length}`);

  let cache;
  try {
    cache = new Map(Object.entries(JSON.parse(await (await import("node:fs/promises")).readFile(OUT_CACHE, "utf-8"))));
  } catch {
    cache = new Map();
  }

  const impactsOut = [];
  let resolved = 0;
  let publishedLine = 0;
  let occupancyZone = 0;
  let noGeometry = 0;
  let processed = 0;

  for (const feature of features) {
    const properties = feature.properties ?? {};
    let impacts = [];
    try { impacts = JSON.parse(properties.occupancyImpactImpactsOfSection || "[]"); } catch {}
    let polygon = null;
    try { polygon = properties.locationOccupancyZoneGeometryCoordinates ? JSON.parse(properties.locationOccupancyZoneGeometryCoordinates) : null; } catch {}
    const point = feature.geometry?.type === "Point" ? feature.geometry.coordinates : null;

    impacts.forEach((impact, impactIndex) => {
      if (processed >= limit) return;
      const analysis = impact.spatialAnalysis || {};
      const street = (analysis.shortName || impact.streetId || "").trim();
      const from = (analysis.fromShortName || analysis.fromName || "").trim();
      const to = (analysis.toShortName || analysis.toName || "").trim();

      const out = {
        requestId: `mtl-${properties.id}-${impactIndex}`,
        permitId: properties.permitPermitId || null,
        street,
        from,
        to,
        point
      };

      let lineGeometry = null;
      try {
        const published = typeof analysis.lineGeometry === "string" ? JSON.parse(analysis.lineGeometry) : analysis.lineGeometry;
        if (published?.geometry?.coordinates) lineGeometry = published.geometry;
        else if (published?.coordinates) lineGeometry = published;
      } catch {}

      if (lineGeometry) {
        out.geometryStatus = "published-line";
        out.geometry = lineGeometry;
        publishedLine += 1;
      } else {
        out.geometryStatus = "pending";
        out._streetRaw = street;
      }
      if (polygon) out.occupancyZone = { type: "Polygon", coordinates: polygon };
      impactsOut.push(out);
      processed += 1;
    });
  }

  const pending = impactsOut.filter((i) => i.geometryStatus === "pending");
  console.log(`Impacts a resoudre: ${pending.length} (deja publies en ligne: ${publishedLine})`);

  let idx = 0;
  for (const impact of pending) {
    idx += 1;
    const segments = await loadGeobaseStreet(impact._streetRaw, cache);
    const line = resolveImpactGeometry(impact.street, impact.from, impact.to, segments);
    if (line) {
      impact.geometryStatus = "resolved-geobase";
      impact.geometry = { type: "LineString", coordinates: line };
      resolved += 1;
    } else if (impact.occupancyZone) {
      impact.geometryStatus = "occupancy-zone";
      occupancyZone += 1;
    } else if (impact.point) {
      impact.geometryStatus = "point-only";
      impact.geometry = { type: "Point", coordinates: impact.point };
      noGeometry += 1;
    } else {
      impact.geometryStatus = "no-geometry";
      noGeometry += 1;
    }
    delete impact._streetRaw;
    if (idx % 50 === 0 || idx === pending.length) {
      console.log(`[${idx}/${pending.length}] resolus: ${resolved}, emprise: ${occupancyZone}, point: ${noGeometry}`);
      await writeFile(OUT_CACHE, JSON.stringify(Object.fromEntries(cache)), "utf-8");
    }
  }

  await writeFile(OUT_CACHE, JSON.stringify(Object.fromEntries(cache)), "utf-8");

  const snapshot = {
    extractedAt: new Date().toISOString(),
    sourceUrl: "https://donnees.montreal.ca/dataset/info-travaux",
    wfsSource: ENTRAVES_URL,
    geobaseSource: `${WFS_BASE}?service=WFS&typeName=montreal:geobase`,
    municipality: "Ville de Montreal",
    resolvedLineCount: resolved,
    publishedLineCount: publishedLine,
    occupancyZoneCount: occupancyZone,
    pointOrNoneCount: noGeometry,
    impacts: impactsOut
  };
  await writeFile(OUT_SNAPSHOT, JSON.stringify(snapshot, null, 2), "utf-8");
  console.log(`\nSauvegarde ${OUT_SNAPSHOT}`);
  console.log(`  lignes resolues via geobase : ${resolved}`);
  console.log(`  lignes deja publiees        : ${publishedLine}`);
  console.log(`  emprise (polygone) conservee: ${occupancyZone}`);
  console.log(`  point ou aucune geometrie   : ${noGeometry}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
