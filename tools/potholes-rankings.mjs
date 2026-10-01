import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import RBush from "rbush";
import pointToLineDistance from "@turf/point-to-line-distance";
import along from "@turf/along";
import length from "@turf/length";
import bearing from "@turf/bearing";
import nearestPointOnLine from "@turf/nearest-point-on-line";
import { MONTREAL_BOUNDS, hasLocalCoordinates, normalizeSearch, rankPotholePositions } from "../js/potholes-data.mjs";

const GEOBASE_URL = "https://api.montreal.ca/api/it-platforms/geomatic/wfs-maps/montreal/ows";
const RTSS_URL = "https://ws.mapserver.transports.gouv.qc.ca/swtq";
const repairKey = (record) => [record.horodatage, record.appareil || "", record.latitude, record.longitude].join("|");

export function isGenericStreetName(value) {
  const name = normalizeSearch(value);
  return !name || /^(?:(?:voie|rue|route)\s+)?(?:non[-\s]+nommee?|sans[-\s]+nom|unnamed)\b/.test(name);
}

export function rtssRoadsFromFeatures(features) {
  return features.flatMap((feature) => {
    const properties = feature.properties || {};
    const numero = Number(properties.num_route);
    const autoroute = normalizeSearch(properties.des_clasf_) === "autoroute";
    const sousRoute = String(properties.cod_sous_r ?? "").trim().toUpperCase();
    if (!/^\d{1,5}$/.test(String(properties.num_route)) || !Number.isInteger(numero) || numero < 1 || numero > 999
      || (!autoroute && numero < 100) || !["0", "3", "4", "V"].includes(sousRoute) || !properties.num_rts) return [];
    const lines = feature.geometry?.type === "LineString" ? [feature.geometry.coordinates]
      : feature.geometry?.type === "MultiLineString" ? feature.geometry.coordinates : [];
    return lines.filter((coordinates) => coordinates.length >= 2
      && coordinates.every((coordinate) => Number.isFinite(coordinate[0]) && Number.isFinite(coordinate[1]))).map((coordinates) => ({
      numero, autoroute, sousRoute, rtss: properties.num_rts, nom: properties.nom_sous_r || "",
      rue: `${autoroute ? "autoroute" : "route"} ${numero}`, coordinates,
    }));
  });
}

export function resolveNumberedStreets(streets, roads) {
  const index = new RBush();
  index.load(roads.map((road) => ({
    ...road, minX: Math.min(...road.coordinates.map((coordinate) => coordinate[0])),
    maxX: Math.max(...road.coordinates.map((coordinate) => coordinate[0])),
    minY: Math.min(...road.coordinates.map((coordinate) => coordinate[1])),
    maxY: Math.max(...road.coordinates.map((coordinate) => coordinate[1])),
  })));
  const method = { version: 1, distanceMaxM: 25, distanceMoyenneMaxM: 12, angleMaxDeg: 30, ecartAmbiguiteM: 5 };
  let generiquesResolus = 0;
  let autoroutesNormalisees = 0;
  const resolved = streets.map((street) => {
    const generic = isGenericStreetName(street.rue);
    const name = normalizeSearch(street.rue);
    if (!generic && (!/^autoroute\b/.test(name) || /\d/.test(name))) return street;
    const classification = normalizeSearch(street.classeDescription);
    if (/projet|pieton|cycl|ruelle/.test(classification)) return street;
    const isHighway = classification === "autoroute" || /^autoroute\b/.test(normalizeSearch(street.rue));
    const geometry = { type: "LineString", coordinates: street.coordinates };
    const meters = length(geometry, { units: "meters" });
    if (!Number.isFinite(meters) || meters < 10) return street;
    const divisions = Math.max(4, Math.min(40, Math.ceil(meters / 30)));
    const samples = Array.from({ length: divisions + 1 }, (unused, sampleIndex) => {
      const offset = meters * (0.05 + 0.9 * sampleIndex / divisions);
      const delta = Math.min(3, meters / 20);
      return {
        point: along(geometry, offset, { units: "meters" }),
        direction: bearing(along(geometry, offset - delta, { units: "meters" }), along(geometry, offset + delta, { units: "meters" })),
      };
    });
    const latitudeMargin = method.distanceMaxM / 110000;
    const longitudeMargin = latitudeMargin / Math.cos(street.coordinates[0][1] * Math.PI / 180);
    const candidates = index.search({
      minX: Math.min(...street.coordinates.map((coordinate) => coordinate[0])) - longitudeMargin,
      maxX: Math.max(...street.coordinates.map((coordinate) => coordinate[0])) + longitudeMargin,
      minY: Math.min(...street.coordinates.map((coordinate) => coordinate[1])) - latitudeMargin,
      maxY: Math.max(...street.coordinates.map((coordinate) => coordinate[1])) + latitudeMargin,
    });
    const evidence = new Map();
    for (const candidate of candidates) {
      if (candidate.autoroute !== isHighway) continue;
      const candidateGeometry = { type: "LineString", coordinates: candidate.coordinates };
      const distances = samples.map((sample) => {
        const nearest = nearestPointOnLine(candidateGeometry, sample.point, { units: "meters" });
        const segmentIndex = Math.min(nearest.properties.index, candidate.coordinates.length - 2);
        const direction = bearing(candidate.coordinates[segmentIndex], candidate.coordinates[segmentIndex + 1]);
        const difference = Math.abs((sample.direction - direction + 540) % 360 - 180);
        const angle = Math.min(difference, 180 - difference);
        return angle <= method.angleMaxDeg && nearest.properties.dist <= method.distanceMaxM ? nearest.properties.dist : Infinity;
      });
      if (!distances.some(Number.isFinite)) continue;
      if (!evidence.has(candidate.rue)) evidence.set(candidate.rue, { road: candidate, distances: samples.map(() => Infinity), rtss: new Set(), sousRoutes: new Set() });
      const entry = evidence.get(candidate.rue);
      entry.distances = entry.distances.map((distance, sampleIndex) => Math.min(distance, distances[sampleIndex]));
      entry.rtss.add(candidate.rtss);
      entry.sousRoutes.add(candidate.sousRoute);
    }
    const matches = [...evidence.values()].filter((entry) => entry.distances.every(Number.isFinite)).map((entry) => ({
      ...entry, mean: entry.distances.reduce((total, distance) => total + distance, 0) / samples.length,
    })).filter((entry) => entry.mean <= method.distanceMoyenneMaxM)
      .sort((left, right) => left.mean - right.mean || left.road.rue.localeCompare(right.road.rue));
    if (!matches.length || (matches[1] && matches[1].mean - matches[0].mean <= method.ecartAmbiguiteM)) return street;
    const match = matches[0];
    if (generic) generiquesResolus += 1;
    else if (normalizeSearch(street.rue) !== match.road.rue) autoroutesNormalisees += 1;
    return {
      ...street, rue: match.road.rue, libelleGeobase: street.rue,
      identificationRtss: {
        numeroRoute: match.road.numero, references: [...match.rtss].sort(), sousRoutes: [...match.sousRoutes].sort(),
        distanceMoyenneM: Number(match.mean.toFixed(2)), distanceMaxM: Number(Math.max(...match.distances).toFixed(2)),
      },
    };
  });
  return {
    rues: resolved, methode: method,
    generiques: streets.filter((street) => isGenericStreetName(street.rue)).length,
    generiquesResolus, generiquesNonResolus: resolved.filter((street) => isGenericStreetName(street.rue)).length,
    autoroutesNormalisees,
  };
}

export async function loadPotholeStreets(cacheDirectory, refresh = false) {
  const cacheFile = path.join(cacheDirectory, "rues-statistiques.json");
  if (!refresh && existsSync(cacheFile)) {
    const cached = JSON.parse(readFileSync(cacheFile, "utf8"));
    if (cached.schemaVersion === 2 && cached.rues?.length) return cached;
  }
  const parameters = new URLSearchParams({
    service: "WFS", version: "1.0.0", request: "GetFeature", typeName: "montreal:geobase",
    outputFormat: "application/json", srsname: "EPSG:4326", maxFeatures: "30000", sortBy: "id A",
    propertyName: "id,sur,nomArrG,nomArrD,noMunicipaliteG,noMunicipaliteD,dateFin,classeDescription,geom",
  });
  const features = [];
  let total = null;
  while (total === null || features.length < total) {
    parameters.set("startIndex", String(features.length));
    const response = await fetch(`${GEOBASE_URL}?${parameters}`, { signal: AbortSignal.timeout(120000) });
    if (!response.ok) throw new Error(`Geobase HTTP ${response.status}`);
    const data = await response.json();
    if (data.type !== "FeatureCollection" || !data.features?.length || !Number.isInteger(Number(data.totalFeatures))
      || (total !== null && total !== Number(data.totalFeatures))) throw new Error("Page geobase incomplete ou source modifiee");
    total = Number(data.totalFeatures);
    features.push(...data.features);
  }
  if (features.length !== total || new Set(features.map((feature) => feature.properties.id)).size !== total) {
    throw new Error("Geobase incomplete; classements non generes");
  }
  parameters.delete("startIndex");
  const streets = features.filter((feature) => feature.geometry?.type === "LineString"
    && feature.geometry.coordinates.length >= 2 && feature.properties?.sur?.trim()
    && !feature.properties.dateFin
    && [feature.properties.noMunicipaliteG, feature.properties.noMunicipaliteD].includes(50)).map((feature) => ({
    id: feature.properties.id, classeDescription: feature.properties.classeDescription || "",
    rue: feature.properties.sur.trim().replace(/\s+/g, " "),
    arrondissements: [...new Set([feature.properties.nomArrG, feature.properties.nomArrD].filter(Boolean))],
    coordinates: feature.geometry.coordinates,
  }));
  if (!streets.length) throw new Error("Aucune rue de Montreal dans la geobase");
  const reference = {
    schemaVersion: 2, source: `${GEOBASE_URL}?${parameters}`, recupereLe: new Date().toISOString(),
    nombreTronconsSource: features.length,
    empreinte: createHash("sha256").update(JSON.stringify(streets)).digest("hex"), rues: streets,
  };
  mkdirSync(cacheDirectory, { recursive: true });
  writeFileSync(cacheFile, JSON.stringify(reference));
  return reference;
}

export async function loadRtssRoads(cacheDirectory, refresh = false) {
  const cacheFile = path.join(cacheDirectory, "rtss-statistiques.json");
  if (!refresh && existsSync(cacheFile)) {
    const cached = JSON.parse(readFileSync(cacheFile, "utf8"));
    if (cached.schemaVersion === 1 && cached.routes?.length) return cached;
  }
  const { west, south, east, north } = MONTREAL_BOUNDS;
  const parameters = new URLSearchParams({
    service: "wfs", version: "2.0.0", request: "getfeature", typename: "ms:bgr_v_sous_route_res_sup_act",
    srsname: "EPSG:4326", outputformat: "geojson", count: "20000",
    bbox: `${south},${west},${north},${east},EPSG:4326`,
  });
  const response = await fetch(`${RTSS_URL}?${parameters}`, { signal: AbortSignal.timeout(120000) });
  if (!response.ok) throw new Error(`RTSS HTTP ${response.status}`);
  const data = await response.json();
  const features = data.features;
  const total = Number(data.numberMatched);
  if (data.type !== "FeatureCollection" || !features?.length || !Number.isInteger(total)
    || features.length !== total || new Set(features.map((feature) => feature.properties.ide_sous_r)).size !== total) {
    throw new Error("Referentiel RTSS incomplet; classements non generes");
  }
  features.sort((left, right) => String(left.properties.num_rts).localeCompare(String(right.properties.num_rts))
    || Number(left.properties.ide_sous_r) - Number(right.properties.ide_sous_r));
  const routes = rtssRoadsFromFeatures(features);
  if (!routes.length) throw new Error("Aucune route numerotee dans le referentiel RTSS");
  const reference = {
    schemaVersion: 1, source: `${RTSS_URL}?${parameters}`, recupereLe: new Date().toISOString(),
    nombreTronconsSource: features.length, empreinte: createHash("sha256").update(JSON.stringify(routes)).digest("hex"), routes,
  };
  mkdirSync(cacheDirectory, { recursive: true });
  writeFileSync(cacheFile, JSON.stringify(reference));
  return reference;
}

export function createStreetMatcher(streets, radiusM = 25) {
  const index = new RBush();
  index.load(streets.map((street) => {
    const longitudes = street.coordinates.map((coordinate) => coordinate[0]);
    const latitudes = street.coordinates.map((coordinate) => coordinate[1]);
    return {
      ...street, key: isGenericStreetName(street.rue)
        ? `unidentified:${street.id ?? JSON.stringify(street.coordinates)}` : normalizeSearch(street.rue).replace(/\s+/g, " "),
      minX: Math.min(...longitudes), minY: Math.min(...latitudes),
      maxX: Math.max(...longitudes), maxY: Math.max(...latitudes),
    };
  }));
  return (record) => {
    if (!hasLocalCoordinates(record)) return { kind: "invalid" };
    const latitudeMargin = radiusM / 110000;
    const longitudeMargin = latitudeMargin / Math.cos(record.latitude * Math.PI / 180);
    const candidates = index.search({
      minX: record.longitude - longitudeMargin, maxX: record.longitude + longitudeMargin,
      minY: record.latitude - latitudeMargin, maxY: record.latitude + latitudeMargin,
    });
    const byStreet = new Map();
    for (const candidate of candidates) {
      const distance = pointToLineDistance([record.longitude, record.latitude], candidate.coordinates, { units: "meters" });
      if (distance <= radiusM && (!byStreet.has(candidate.key) || distance < byStreet.get(candidate.key).distance)) {
        byStreet.set(candidate.key, { ...candidate, distance });
      }
    }
    const closest = [...byStreet.values()].sort((left, right) => left.distance - right.distance || left.key.localeCompare(right.key));
    if (!closest.length) return { kind: "unmatched" };
    if (closest[1] && closest[1].distance - closest[0].distance <= 3) return { kind: "ambiguous" };
    if (isGenericStreetName(closest[0].rue)) return { kind: "unidentified" };
    return { kind: "matched", street: closest[0] };
  };
}

export function createPotholeRankings(streets, { firstRepair, lastRepair, latestYear, radiusM = 25 }) {
  const matchStreet = createStreetMatcher(streets, radiusM);
  const streetTotals = new Map();
  const machines = new Map();
  const seenRepairs = new Set();
  const coverage = {
    premierColmatage: firstRepair, dernierColmatage: lastRepair, derniereAnnee: latestYear, rayonRueM: radiusM,
    colmatagesBruts: 0, doublonsColmatages: 0, colmatagesAttribues: 0, colmatagesAmbigus: 0,
    colmatagesHorsRue: 0, colmatagesInvalides: 0, appareilAbsent: 0, emplacementsAttribues: 0, emplacementsNonAttribues: 0,
    colmatagesSansIdentification: 0, emplacementsSansIdentification: 0,
  };
  const streetTotal = (street) => {
    if (!streetTotals.has(street.key)) streetTotals.set(street.key, {
      rue: street.rue, arrondissements: new Set(street.arrondissements), emplacements: 0, signalements: 0,
      signalementsComparables: 0, colmatages: 0, emplacementsRecurrents: 0, reapparitions: 0,
      colmatagesRecurrents: new Set(), sansColmatage: 0, plusAncienSansColmatage: null,
    });
    return streetTotals.get(street.key);
  };
  return {
    addRepair(record, fileYear) {
      coverage.colmatagesBruts += 1;
      const device = String(record.appareil || "").trim();
      if (device) {
        if (!machines.has(device)) machines.set(device, { appareil: device, colmatages: 0, derniereAnnee: null, derniereDate: null, presentDernierFichier: false });
        const machine = machines.get(device);
        machine.colmatages += 1;
        if (fileYear === latestYear) machine.presentDernierFichier = true;
        if (Number.isFinite(Date.parse(record.horodatage)) && (!machine.derniereDate || record.horodatage > machine.derniereDate)) {
          machine.derniereDate = record.horodatage;
          machine.derniereAnnee = Number(record.horodatage.slice(0, 4));
        }
      } else coverage.appareilAbsent += 1;
      if (!hasLocalCoordinates(record) || !Number.isFinite(Date.parse(record.horodatage))) { coverage.colmatagesInvalides += 1; return; }
      const key = repairKey(record);
      if (seenRepairs.has(key)) { coverage.doublonsColmatages += 1; return; }
      seenRepairs.add(key);
      const match = matchStreet(record);
      if (match.kind === "matched") {
        streetTotal(match.street).colmatages += 1;
        coverage.colmatagesAttribues += 1;
      } else if (match.kind === "ambiguous") coverage.colmatagesAmbigus += 1;
      else if (match.kind === "unidentified") coverage.colmatagesSansIdentification += 1;
      else coverage.colmatagesHorsRue += 1;
    },
    finish(positions, history) {
      const rankings = rankPotholePositions(positions, lastRepair, firstRepair);
      for (const position of rankings.emplacements) {
        const match = matchStreet(position);
        if (match.kind === "unidentified") coverage.emplacementsSansIdentification += 1;
        if (match.kind !== "matched") { coverage.emplacementsNonAttribues += 1; continue; }
        coverage.emplacementsAttribues += 1;
        const street = streetTotal(match.street);
        position.arrondissements.forEach((district) => street.arrondissements.add(district));
        street.emplacements += 1;
        street.signalements += position.signalements;
        street.signalementsComparables += position.signalementsPeriodeColmatages;
        if (position.reapparitions > 0) {
          street.emplacementsRecurrents += 1;
          street.reapparitions += position.reapparitions;
          for (const repair of history[position.positionId] || []) {
            street.colmatagesRecurrents.add([repair[0], repair[1], repair[3], repair[4]].join("|"));
          }
        }
        if (position.colmatages === 0 && position.signalementsPeriodeColmatages > 0) {
          street.sansColmatage += 1;
          if (!street.plusAncienSansColmatage || position.premierSignalement < street.plusAncienSansColmatage) {
            street.plusAncienSansColmatage = position.premierSignalement;
          }
        }
      }
      const rows = [...streetTotals.values()].map((street) => ({
        ...street, arrondissements: [...street.arrondissements].sort(), colmatagesRecurrents: street.colmatagesRecurrents.size,
        ratio: street.colmatages / Math.max(1, street.signalementsComparables),
      }));
      const byName = (left, right) => left.rue.localeCompare(right.rue);
      const devices = [...machines.values()].sort((left, right) => right.colmatages - left.colmatages || left.appareil.localeCompare(right.appareil));
      return {
        schemaVersion: 2, couverture: coverage,
        emplacementsSignales: rankings.plusSignales, emplacementsColmates: rankings.plusColmates,
        ruesEmplacements: rows.filter((row) => row.emplacements > 0)
          .sort((left, right) => right.emplacements - left.emplacements || right.signalements - left.signalements || byName(left, right)).slice(0, 5),
        ruesRecurrences: rows.filter((row) => row.emplacementsRecurrents > 0)
          .sort((left, right) => right.emplacementsRecurrents - left.emplacementsRecurrents
            || right.colmatagesRecurrents - left.colmatagesRecurrents || right.reapparitions - left.reapparitions || byName(left, right)).slice(0, 5),
        ruesColmatages: rows.filter((row) => row.colmatages > 0)
          .sort((left, right) => right.colmatages - left.colmatages || byName(left, right)).slice(0, 5),
        emplacementsSansColmatage: rankings.sansColmatage,
        ruesAnciennes: rows.filter((row) => row.sansColmatage > 0)
          .sort((left, right) => left.plusAncienSansColmatage.localeCompare(right.plusAncienSansColmatage)
            || right.sansColmatage - left.sansColmatage || byName(left, right)).slice(0, 5),
        ruesRatio: rows.filter((row) => row.colmatages > 0)
          .sort((left, right) => right.ratio - left.ratio || right.colmatages - left.colmatages || byName(left, right)).slice(0, 5),
        machines: devices,
        machinesAbsentes: devices.filter((device) => !device.presentDernierFichier && device.derniereAnnee !== null && device.derniereAnnee < latestYear)
          .sort((left, right) => right.derniereAnnee - left.derniereAnnee || right.colmatages - left.colmatages || left.appareil.localeCompare(right.appareil)),
      };
    },
  };
}