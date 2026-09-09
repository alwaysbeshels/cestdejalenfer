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

import { writeFile } from "node:fs/promises";

const CKAN = "https://donnees.montreal.ca/api/3/action/datastore_search?resource_id=ef2a8162-0644-47e7-bd03-bea33f14a5d2&limit=100";
const OVERPASS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter"
];
const OUT = "data/montreal-pedestrian-snapshot.json";
// Tolerance de validation de longueur (le troncon reconstruit peut differer un peu).
const LEN_TOLERANCE = 0.45;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function overpass(query, tries = 4) {
  let last;
  for (let attempt = 0; attempt < tries; attempt += 1) {
    for (const endpoint of OVERPASS) {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "User-Agent": "CestDejaLEnfer/1.0", "Content-Type": "application/x-www-form-urlencoded" },
          body: "data=" + encodeURIComponent(query)
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
      } catch (error) {
        last = error;
        await sleep(4000);
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

async function reconstruct(street, cross1, cross2, lat, lon) {
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
  const res = await overpass(query);
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
  if (streetSegs.length === 0) return [null, "street not found"];
  if (cross1Segs.length === 0 || cross2Segs.length === 0) {
    return [null, `cross missing (c1=${cross1Segs.length} c2=${cross2Segs.length})`];
  }

  const poly = stitch(streetSegs);
  if (poly.length < 2) return [null, "stitch failed"];

  const [i1, d1] = closestIndex(poly, cross1Segs.flat());
  const [i2, d2] = closestIndex(poly, cross2Segs.flat());
  if (d1 > 40 || d2 > 40) return [null, `intersections too far (d1=${Math.round(d1)}m d2=${Math.round(d2)}m)`];
  if (i1 === i2) return [null, "same intersection index"];
  const [lo, hi] = i1 < i2 ? [i1, i2] : [i2, i1];
  const sub = poly.slice(lo, hi + 1).map((pt) => pt.slice());
  if (sub.length < 2) return [null, "empty segment"];
  return [sub, lineLength(sub)];
}

async function main() {
  const response = await fetch(CKAN, { headers: { "User-Agent": "Mozilla/5.0" } });
  const records = (await response.json()).result.records;
  console.log(`CKAN records: ${records.length}`);

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
        [sub, info] = await reconstruct(street, cross1, cross2, lat, lon);
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
    records: outRecords
  };
  await writeFile(OUT, JSON.stringify(snapshot, null, 2), "utf-8");
  console.log(`\nSaved ${OUT}: ${validated} validated lines, ${pointOnly} point-only.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
