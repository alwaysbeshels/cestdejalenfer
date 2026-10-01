import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import RBush from "rbush";
import pointToLineDistance from "@turf/point-to-line-distance";
import { hasLocalCoordinates, normalizeSearch, rankPotholePositions } from "../js/potholes-data.mjs";

const GEOBASE_URL = "https://api.montreal.ca/api/it-platforms/geomatic/wfs-maps/montreal/ows";
const repairKey = (record) => [record.horodatage, record.appareil || "", record.latitude, record.longitude].join("|");

export async function loadPotholeStreets(cacheDirectory, refresh = false) {
  const cacheFile = path.join(cacheDirectory, "rues-statistiques.json");
  if (!refresh && existsSync(cacheFile)) {
    const cached = JSON.parse(readFileSync(cacheFile, "utf8"));
    if (cached.schemaVersion === 1 && cached.rues?.length) return cached;
  }
  const parameters = new URLSearchParams({
    service: "WFS", version: "1.0.0", request: "GetFeature", typeName: "montreal:geobase",
    outputFormat: "application/json", srsname: "EPSG:4326", maxFeatures: "30000", sortBy: "id A",
    propertyName: "id,sur,nomArrG,nomArrD,noMunicipaliteG,noMunicipaliteD,dateFin,geom",
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
    rue: feature.properties.sur.trim().replace(/\s+/g, " "),
    arrondissements: [...new Set([feature.properties.nomArrG, feature.properties.nomArrD].filter(Boolean))],
    coordinates: feature.geometry.coordinates,
  }));
  if (!streets.length) throw new Error("Aucune rue de Montreal dans la geobase");
  const reference = {
    schemaVersion: 1, source: `${GEOBASE_URL}?${parameters}`, recupereLe: new Date().toISOString(),
    nombreTronconsSource: features.length,
    empreinte: createHash("sha256").update(JSON.stringify(streets)).digest("hex"), rues: streets,
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
      ...street, key: normalizeSearch(street.rue).replace(/\s+/g, " "),
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
      else coverage.colmatagesHorsRue += 1;
    },
    finish(positions, history) {
      const rankings = rankPotholePositions(positions, lastRepair, firstRepair);
      for (const position of rankings.emplacements) {
        const match = matchStreet(position);
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
        schemaVersion: 1, couverture: coverage,
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