import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { lineMeasures, projectOnLine, sliceLine, mergeIntervals } from "./snapshot-geometry.mjs";

export function distanceMeters(first, second) {
  const radians = Math.PI / 180;
  const latitude = (second[1] - first[1]) * radians;
  const longitude = (second[0] - first[0]) * radians;
  const value = Math.sin(latitude / 2) ** 2 + Math.cos(first[1] * radians) * Math.cos(second[1] * radians) * Math.sin(longitude / 2) ** 2;
  return 12742000 * Math.asin(Math.sqrt(Math.min(1, value)));
}

export function normalizedRoadName(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/\b(rue|avenue|av|boulevard|boul|chemin|pont)\b/g, "")
    .replace(/[^a-z0-9]+/g, " ").replace(/\bst\b/g, "saint").replace(/\bste\b/g, "sainte").replace(/\s+/g, " ").trim();
}

export function resolveGeobaseSection(features, streetNames, fromStreet, toStreet) {
  const names = new Set(streetNames.map(normalizedRoadName));
  const roads = features.filter(feature => names.has(normalizedRoadName(feature.properties.sur))
    && [feature.properties.municipaliteG, feature.properties.municipaliteD].some(value => normalizedRoadName(value) === "montreal"));
  assert.ok(roads.length, `Missing official road: ${streetNames.join(" / ")}`);
  const byId = new Map();
  const graph = new Map();
  const nodeCoordinates = new Map();
  const startNodes = new Set();
  const endNodes = new Set();
  const fromName = normalizedRoadName(fromStreet);
  const toName = normalizedRoadName(toStreet);
  assert.notEqual(fromName, toName, "Distinct published limits required");
  for (const feature of roads) {
    const properties = feature.properties;
    assert.equal(feature.geometry.type, "LineString");
    assert.ok(feature.geometry.coordinates.length >= 2);
    assert.ok(feature.geometry.coordinates.every(pair => pair.length === 2 && pair.every(Number.isFinite)));
    assert.ok(Number.isInteger(properties.id) && Number.isInteger(properties.noNoeudDebut) && Number.isInteger(properties.noNoeudFin));
    const length = properties.longueur > 0 ? properties.longueur
      : feature.geometry.coordinates.slice(1).reduce((total, point, index) => total + distanceMeters(feature.geometry.coordinates[index], point), 0);
    assert.ok(length > 0, `Degenerate official segment ${properties.id}`);
    if (byId.has(properties.id)) {
      assert.deepEqual(byId.get(properties.id).geometry, feature.geometry, `Conflicting geobase segment ${properties.id}`);
      continue;
    }
    byId.set(properties.id, feature);
    for (const [node, other, coordinate] of [
      [properties.noNoeudDebut, properties.noNoeudFin, feature.geometry.coordinates[0]],
      [properties.noNoeudFin, properties.noNoeudDebut, feature.geometry.coordinates.at(-1)]
    ]) {
      if (nodeCoordinates.has(node)) assert.ok(coordinate.every((value, axis) => Math.abs(value - nodeCoordinates.get(node)[axis]) < 0.00002), `Inconsistent official node ${node}`);
      nodeCoordinates.set(node, coordinate);
      if (!graph.has(node)) graph.set(node, []);
      graph.get(node).push({ next: other, segmentId: properties.id, length });
    }
  }
  for (const feature of features) {
    const crossName = normalizedRoadName(feature.properties.sur);
    const target = crossName === fromName ? startNodes : crossName === toName ? endNodes : null;
    if (!target) continue;
    for (const node of [feature.properties.noNoeudDebut, feature.properties.noNoeudFin]) if (graph.has(node)) target.add(node);
  }
  assert.ok(startNodes.size && endNodes.size, `Published intersections not found: ${fromStreet} / ${toStreet}`);
  const paths = [];
  for (const start of startNodes) {
    const distances = new Map([[start, 0]]);
    const previous = new Map();
    const queue = [{ node: start, distance: 0 }];
    let end = null;
    while (queue.length) {
      queue.sort((left, right) => left.distance - right.distance);
      const current = queue.shift();
      if (current.distance !== distances.get(current.node)) continue;
      if (endNodes.has(current.node)) { end = current.node; break; }
      for (const edge of graph.get(current.node) || []) {
        const distance = current.distance + edge.length;
        if (distance >= (distances.get(edge.next) ?? Infinity)) continue;
        distances.set(edge.next, distance);
        previous.set(edge.next, { node: current.node, segmentId: edge.segmentId });
        queue.push({ node: edge.next, distance });
      }
    }
    if (end === null || end === start) continue;
    const nodes = [end];
    const segmentIds = [];
    while (nodes[0] !== start) {
      const step = previous.get(nodes[0]);
      assert.ok(step, "Broken official-node chain");
      nodes.unshift(step.node);
      segmentIds.unshift(step.segmentId);
    }
    paths.push({ nodes, segmentIds });
  }
  assert.ok(paths.length, `Disconnected official road: ${streetNames.join(" / ")}`);
  const segmentIds = [...new Set(paths.flatMap(path => path.segmentIds))];
  const selected = segmentIds.map(id => byId.get(id));
  return {
    geometry: selected.length === 1 ? selected[0].geometry : { type: "MultiLineString", coordinates: selected.map(feature => feature.geometry.coordinates) },
    paths,
    segments: selected.map(({ properties }) => ({
      id: properties.id, noTronconSq: properties.noTronconSq, sur: properties.sur, de: properties.de, a: properties.a,
      noNoeudDebut: properties.noNoeudDebut, noNoeudFin: properties.noNoeudFin, longueur: properties.longueur
    }))
  };
}

export function resolveGeobaseCrossing(features, crossFeatures, streetNames, fromStreet, toStreet) {
  const names = new Set(streetNames.map(normalizedRoadName));
  const roads = features.filter(feature => names.has(normalizedRoadName(feature.properties.sur)));
  const crosses = crossFeatures.filter(feature => normalizedRoadName(feature.properties.sur) === normalizedRoadName(toStreet));
  const intersections = [];
  for (const road of roads) for (const cross of crosses) {
    for (let roadIndex = 1; roadIndex < road.geometry.coordinates.length; roadIndex += 1) {
      for (let crossIndex = 1; crossIndex < cross.geometry.coordinates.length; crossIndex += 1) {
        const start = road.geometry.coordinates[roadIndex - 1];
        const end = road.geometry.coordinates[roadIndex];
        const crossStart = cross.geometry.coordinates[crossIndex - 1];
        const crossEnd = cross.geometry.coordinates[crossIndex];
        const delta = [end[0] - start[0], end[1] - start[1]];
        const other = [crossEnd[0] - crossStart[0], crossEnd[1] - crossStart[1]];
        const gap = [crossStart[0] - start[0], crossStart[1] - start[1]];
        const denominator = delta[0] * other[1] - delta[1] * other[0];
        if (Math.abs(denominator) < 1e-15) continue;
        const fraction = (gap[0] * other[1] - gap[1] * other[0]) / denominator;
        const crossFraction = (gap[0] * delta[1] - gap[1] * delta[0]) / denominator;
        if (fraction < 0 || fraction > 1 || crossFraction < 0 || crossFraction > 1) continue;
        intersections.push({ road, cross, roadIndex, crossIndex, fraction, coordinate: [start[0] + fraction * delta[0], start[1] + fraction * delta[1]] });
      }
    }
  }
  assert.equal(intersections.length, 1, `Ambiguous published crossing: ${streetNames.join(" / ")} / ${toStreet}`);
  const intersection = intersections[0];
  const before = resolveGeobaseSection(features.filter(feature => feature.properties.id !== intersection.road.properties.id), streetNames, fromStreet, intersection.road.properties.de);
  const prefix = intersection.road.geometry.coordinates.slice(0, intersection.roadIndex);
  assert.ok(before.paths.some(path => path.nodes.at(-1) === intersection.road.properties.noNoeudDebut), "Crossing does not continue the verified road chain");
  const lines = before.geometry.type === "LineString" ? [before.geometry.coordinates] : before.geometry.coordinates;
  return {
    ...before,
    geometry: { type: "MultiLineString", coordinates: [...lines, [...prefix, intersection.coordinate]] },
    clippedSection: {
      method: "Intersection of two published geobase lines; only the last road segment is clipped. This crossing does not assert a traffic connection.",
      roadSegmentId: intersection.road.properties.id, crossSegmentId: intersection.cross.properties.id,
      roadSegmentProperties: intersection.road.properties, crossSegmentProperties: intersection.cross.properties,
      sourceRoadGeometry: intersection.road.geometry, sourceCrossGeometry: intersection.cross.geometry,
      roadCoordinateIndex: intersection.roadIndex, crossCoordinateIndex: intersection.crossIndex,
      fraction: intersection.fraction, coordinate: intersection.coordinate
    }
  };
}

function geometryLines(geometry) {
  return geometry.type === "LineString" ? [geometry.coordinates] : geometry.coordinates;
}

function pointLineDistance(point, lines) {
  let best = Infinity;
  const scale = Math.cos(point[1] * Math.PI / 180);
  for (const line of lines) for (let index = 1; index < line.length; index += 1) {
    const first = line[index - 1];
    const last = line[index];
    const delta = [(last[0] - first[0]) * scale, last[1] - first[1]];
    const squared = delta[0] ** 2 + delta[1] ** 2;
    const fraction = squared ? Math.max(0, Math.min(1, ((point[0] - first[0]) * scale * delta[0] + (point[1] - first[1]) * delta[1]) / squared)) : 0;
    best = Math.min(best, distanceMeters(point, [first[0] + fraction * (last[0] - first[0]), first[1] + fraction * (last[1] - first[1])]));
  }
  return best;
}

function geometryMatchScore(geometry, reference) {
  const lines = geometryLines(reference);
  const gaps = geometryLines(geometry).flatMap(line => line.slice(1).flatMap((end, index) => [0.2, 0.5, 0.8].map(fraction => {
    const start = line[index];
    return pointLineDistance([start[0] + fraction * (end[0] - start[0]), start[1] + fraction * (end[1] - start[1])], lines);
  })));
  return { maximum: Math.max(...gaps), average: gaps.reduce((sum, value) => sum + value, 0) / gaps.length };
}

export function buildSupplement(snapshot, captures) {
  const original = JSON.stringify(snapshot);
  const article = snapshot.articleScheduleReference;
  assert.equal(article?.sourceKind, "journalistic-supplement");
  const courseReference = snapshot.officialClosureReference;
  const allFeatures = [captures.roads, captures.viau, captures.crosses, captures.intersections].flatMap(capture => capture.data.features);
  const specifications = [
    ["viau", "2026-10-10", ["rue Viau"], "boulevard Rosemont", "rue Sherbrooke Est", "07:30", "12:30", true, "10k"],
    ["rosemont-ouest", "2026-10-10", ["boulevard Rosemont"], "boulevard Pie-IX", "rue Viau", "07:45", "12:30", true, "10k"],
    ["rosemont-est", "2026-10-10", ["boulevard Rosemont"], "rue Viau", "44e avenue", "08:45", "12:30", true, "10k"],
    ["notre-dame", "2026-10-11", ["rue Notre-Dame Ouest", "rue Notre-Dame Est"], "rue McGill", "rue Atateken", "06:30", "11:45", false, "marathon"],
    ["saint-joseph", "2026-10-11", ["boulevard Saint-Joseph Est"], "rue Saint-Denis", "16e avenue", "06:30", "14:50", true, "marathon"],
    ["louisiane-bellechasse", "2026-10-10", ["rue de Bellechasse"], "31e avenue", "35e avenue", "08:45", "11:30", false, "10k"],
    ["louisiane-31e", "2026-10-10", ["31e avenue"], "rue de Bellechasse", "rue Beaubien Est", "08:45", "11:30", false, "10k"],
    ["louisiane-35e", "2026-10-10", ["35e avenue"], "rue de Bellechasse", "rue Beaubien Est", "08:45", "11:30", false, "10k"],
    ["louisiane-beaubien", "2026-10-10", ["rue Beaubien Est"], "31e avenue", "35e avenue", "08:45", "11:30", false, "10k"],
    ["joseph-pare-beaubien", "2026-10-10", ["rue Beaubien Est"], "41e avenue", "44e avenue", "08:45", "12:15", false, "10k"],
    ["joseph-pare-41e", "2026-10-10", ["41e avenue"], "rue Beaubien Est", "rue Saint-Zotique Est", "08:45", "12:15", false, "10k"],
    ["joseph-pare-saint-zotique", "2026-10-10", ["rue Saint-Zotique Est"], "41e avenue", "43e avenue", "08:45", "12:15", false, "10k"],
    ["joseph-pare-43e", "2026-10-10", ["43e avenue"], "boulevard Rosemont", "rue Saint-Zotique Est", "08:45", "12:15", false, "10k"],
    ["joseph-pare-44e", "2026-10-10", ["44e avenue"], "boulevard Rosemont", "rue Beaubien Est", "08:45", "12:15", false, "10k"]
  ];
  const resolvedRoads = specifications.map(([key, date, streets, from, to, startTime, endTime, approximate, courseId]) => {
    const capture = key === "viau" ? captures.viau : captures.roads;
    const resolved = key === "notre-dame"
      ? resolveGeobaseCrossing(allFeatures, captures.crosses.data.features, streets, from, to)
      : resolveGeobaseSection(allFeatures, streets, from, to);
    const parkName = key.startsWith("louisiane-") ? "Louisiane" : key.startsWith("joseph-pare-") ? "Joseph-Paré" : null;
    const park = parkName && captures.parks.data.features.find(feature => feature.properties.Nom === parkName);
    assert.ok(!parkName || park, `Missing named park: ${parkName}`);
    return {
      id: `marathon-article-geobase-${date}-${key}`, kind: "road", streetName: streets.join(" / "), streetNames: streets,
      fromStreet: from, toStreet: to, startDate: date, endDate: date, startTime, endTime, endTimeApproximate: approximate,
      timeZone: "America/Montreal", courseIds: [courseId], severity: "critical",
      impact: "Fermeture automobile annoncée dans l'article de La Presse.",
      evidence: { kind: "article-location-and-schedule", sourceUrl: article.sourceUrl, checkedAt: article.checkedAt,
        scope: park ? `Pourtour du parc ${parkName} et liaisons nommées; rues identifiées par le parcours vérifié et la géobase.` : `${streets.join(" / ")}, de ${from} à ${to}.`,
        approximateEnd: approximate ? `Réouverture annoncée pour environ ${endTime}.` : null },
      geometry: resolved.geometry,
      geometrySource: { kind: "official-geobase", sourceUrl: capture.url, verifiedAt: capture.checkedAt,
        segments: resolved.segments, paths: resolved.paths,
        intersectionMethod: "Endpoints are nodes shared with the named crossing roads, not inferred from the order of de/a labels.",
        intersectionSources: [captures.roads, captures.viau, captures.crosses, captures.intersections].map(source => ({ sourceUrl: source.url, verifiedAt: source.checkedAt })),
        ...(resolved.clippedSection ? { clippedSection: resolved.clippedSection, crossSourceUrl: captures.crosses.url, crossVerifiedAt: captures.crosses.checkedAt } : {}),
        ...(park ? { park: { sourceUrl: captures.parks.url, verifiedAt: captures.parks.checkedAt, properties: park.properties, geometry: park.geometry } } : {}) }
    };
  });
  const segments = new Map(snapshot.segments.objects.map(segment => [segment.id, segment]));
  const streets = new Map(snapshot.streets.objects.map(street => [street.id, street]));
  const candidates = [
    ...courseReference.records.filter(record => record.kind === "road").map(record => ({ ...record, sourceKind: "pdf" })),
    ...snapshot.roadClosures.objects.map(record => ({ id: `marathon-beneva-${record.id}`, streetName: streets.get(segments.get(record.segID).primaryStreetID).name,
      startDate: record.startDate.slice(0, 10), endDate: record.endDate.slice(0, 10), startTime: record.startDate.slice(11), endTime: record.endDate.slice(11), geometry: record.geometry, sourceKind: "waze" }))
  ];
  const concorde = article.adjustments.find(adjustment => adjustment.id === "marathon-lapresse-concorde-2026-10-11");
  assert.ok(concorde);
  const adjustments = [structuredClone(concorde)];
  const byRoad = new Map();
  const ambiguous = [];
  for (const candidate of candidates) {
    const matches = resolvedRoads.filter(road => road.startDate === candidate.startDate && road.streetNames.some(name => normalizedRoadName(name) === normalizedRoadName(candidate.streetName)))
      .map(road => ({ road, ...geometryMatchScore(candidate.geometry, road.geometry) })).filter(match => match.maximum <= 35).sort((left, right) => left.average - right.average);
    if (!matches.length) continue;
    if (matches.length > 1 && matches[1].average - matches[0].average < 2 && matches[1].road.startTime !== matches[0].road.startTime) {
      ambiguous.push({ id: candidate.id, reason: "article-sector-boundary", candidateIds: matches.map(match => match.road.id) });
      continue;
    }
    const road = matches[0].road;
    if (!byRoad.has(road.id)) byRoad.set(road.id, { id: `${road.id}-schedule`, targetIds: [], streetName: road.streetName, fromStreet: road.fromStreet, toStreet: road.toStreet,
      startDate: road.startDate, endDate: road.endDate, startTime: road.startTime, endTime: road.endTime, endTimeApproximate: road.endTimeApproximate,
      evidence: road.evidence.scope, geometryMatch: "Same named road, same date, and every sampled source edge within 35 m of the verified geobase chain; no cross-street substitution.",
      geometryReferenceId: road.id, warnings: road.endTimeApproximate ? [`Réouverture annoncée pour environ ${road.endTime}.`] : [], relatedSourceUrls: [] });
    byRoad.get(road.id).targetIds.push(candidate.id);
  }
  adjustments.push(...byRoad.values());
  for (const candidate of candidates.filter(record => record.startDate === "2026-10-10" && normalizedRoadName(record.streetName) === "sherbrooke est")) {
    const source = courseReference.records.find(record => record.streetName === "rue Sherbrooke Est" && record.startDate === candidate.startDate);
    const score = geometryMatchScore(candidate.geometry, source.geometry);
    if (score.maximum > 35) continue;
    adjustments.push({ id: `marathon-article-sherbrooke-${candidate.id}`, targetIds: [candidate.id], streetName: candidate.streetName,
      startDate: candidate.startDate, endDate: candidate.endDate, startTime: "06:45", endTime: "12:35", endTimeApproximate: false,
      evidence: "Rue Sherbrooke Est aux abords du parc Maisonneuve, samedi : 06:45-12:35.",
      geometryMatch: "Existing verified Sherbrooke course sections; every sampled edge within 35 m of the stored official-course geometry.", warnings: [], relatedSourceUrls: [] });
  }
  for (const restriction of courseReference.parkingRestrictions) {
    if (restriction.courseId !== "10k") continue;
    const targetIds = courseReference.records.filter(record => record.kind === "road" && record.courseIds.includes("10k")).map(record => `${restriction.id}-${record.id}`);
    adjustments.push({ id: "marathon-article-parking-saturday", targetIds, streetName: "Parcours du samedi",
      startDate: restriction.startDate, endDate: restriction.endDate, startTime: "00:00", endTime: "12:00", endTimeApproximate: false,
      evidence: "Stationnement interdit dans les rues réservées aux courses du samedi, de minuit à midi.",
      geometryMatch: "Same verified road sections used by the official 10 km parking restriction.",
      warnings: ["Le dépliant officiel indique 00:01; le début à minuit suit l'article, à la demande du site."], relatedSourceUrls: [restriction.sourceUrl] });
  }
  const island = captures.parks.data.features.find(feature => feature.properties.OBJECTID === "3610" && feature.properties.Nom === "Jean-Drapeau");
  assert.equal(island?.geometry.type, "Polygon", "Notre-Dame park surface missing");
  const accessNotices = {
    schemaVersion: 1,
    records: [{
      id: "marathon-parc-jean-drapeau-3269", source: "Société du parc Jean-Drapeau - Avis 3269", sourceUrl: "https://www.parcjeandrapeau.com/fr/avis-et-alertes/3269/",
      sourceCheckedAt: "2026-10-08T23:47:59.770Z", publishedDate: "2026-10-06", sourceUpdatedDate: "2026-10-07",
      title: "Île Notre-Dame inaccessible au grand public", streets: "Parc Jean-Drapeau - île Notre-Dame", municipality: "Montréal",
      startDate: "2026-10-11", endDate: "2026-10-11", startTime: "06:30", endTime: "11:00", timeZone: "America/Montreal",
      severity: "critical", pedestrianArea: "park", affectedUsers: ["pedestrians", "cyclists", "motorists"],
      impact: "L'île Notre-Dame ne sera pas accessible au grand public le dimanche 11 octobre, de 6 h 30 à 11 h, en raison du Marathon Beneva de Montréal.",
      evidence: { kind: "official-access-notice", text: "L'île Notre-Dame ne sera pas accessible au grand public le dimanche 11 octobre, de 6 h 30 à 11 h, en raison du Marathon Beneva de Montréal.", publishedModes: ["Marche", "Automobile", "Vélo"] },
      geometry: island.geometry,
      geometrySource: { kind: "official-park-surface", sourceUrl: captures.parks.url, verifiedAt: captures.parks.checkedAt, properties: island.properties,
        control: { courseRecordId: "marathon-pdf-2026-10-11-bde156b6e62c", circuitPointsInside: 79, sainteHeleneStartInside: false },
        limitation: "Surface municipale du parc sur l'île Notre-Dame, conservée avec ses trous. Ce n'est pas une limite cadastrale légale ni le tracé de chaque accès; les espaces extérieurs à cette surface ne sont pas inventés." },
      relatedNotices: [{ id: "3270", sourceUrl: "https://www.parcjeandrapeau.com/fr/avis-et-alertes/3270/", sourceCheckedAt: "2026-10-08T23:47:59.871Z",
        startDate: "2026-10-11", endDate: "2026-10-11", startTime: "06:30", endTime: "11:00", affectedUsers: ["motorists"],
        text: "Les installations de l'île Sainte-Hélène ainsi que La Ronde seront accessibles par le pont Jacques-Cartier, tandis que les clients du Casino devront emprunter le pont de la Concorde. Le transit entre les deux ponts ne sera pas possible pendant cette période." }]
    }]
  };
  assert.equal(JSON.stringify(snapshot), original, "Supplement builder mutated source collections");
  return {
    ...snapshot,
    articleScheduleReference: { ...article, adjustments, resolvedRoads, unresolvedAdjustments: [
      ...ambiguous,
      { streetName: "boulevard Saint-Laurent", reason: "Article gives several closing/reopening times without assigning exact limits to each; existing segment-specific source hours retained." },
      { streetName: "boulevard Gouin Est", reason: "The Ahuntsic sector is described without exact limits; the stored 13:35 segment cannot be equated to the 13:00 sector by name alone." }
    ] },
    officialAccessNotices: snapshot.officialAccessNotices?.managedBy ? snapshot.officialAccessNotices : accessNotices
  };
}

export function buildMarathonDisplayReference(snapshot, normalizedRecords, roadCapture, parkSnapshot) {
  const sourceBefore = JSON.stringify(snapshot);
  const features = new Map(roadCapture.data.features.map(feature => [feature.properties.id, feature]));
  const measures = new Map([...features].map(([id, feature]) => [id, lineMeasures(feature.geometry.coordinates)]));
  const pdf = new Map(snapshot.officialClosureReference.records.map(record => [record.id, record]));
  const resolved = new Map(snapshot.articleScheduleReference.resolvedRoads.map(record => [record.id, record]));
  const groups = new Map();
  const review = [];
  const withheld = [];
  const inputs = normalizedRecords.filter(record => !record.marathonGeometryReplacementId && record.sourceKind !== "marathon-beneva-access");
  const rank = record => record.id.includes("marathon-article-geobase-") ? 4 : record.sourceKind === "marathon-beneva-article" ? 3 : record.sourceKind === "marathon-beneva-pdf" ? 2 : 1;
  const add = (record, geobaseId, start, end) => {
    if (end - start < 0.01) return;
    const key = JSON.stringify([geobaseId, record.startDate, record.endDate, record.severity]);
    if (!groups.has(key)) groups.set(key, { geobaseId, startDate: record.startDate, endDate: record.endDate, severity: record.severity, intervals: [] });
    groups.get(key).intervals.push({ start, end, record, rank: rank(record) });
  };
  const matchLine = (record, line, referenceIds) => {
    const references = referenceIds.map(id => features.get(id)).filter(Boolean);
    const referenceNames = new Set(references.map(feature => normalizedRoadName(feature.properties.sur)));
    const referenceNodes = new Set(references.flatMap(feature => [feature.properties.noNoeudDebut, feature.properties.noNoeudFin]));
    const candidates = [...features.values()].filter(feature => referenceIds.includes(feature.properties.id)
      || (referenceNames.has(normalizedRoadName(feature.properties.sur)) && (!/non nommee/.test(normalizedRoadName(feature.properties.sur))
        || [feature.properties.noNoeudDebut, feature.properties.noNoeudFin].some(node => referenceNodes.has(node)))));
    for (let index = 1; index < line.length; index += 1) {
      const first = line[index - 1];
      const last = line[index];
      const sourceLine = [first, last];
      const sourceLength = distanceMeters(first, last);
      if (sourceLength < 0.01) continue;
      const cuts = [0, 1];
      for (const feature of candidates) for (const point of [feature.geometry.coordinates[0], feature.geometry.coordinates.at(-1)]) {
        const projection = projectOnLine(point, sourceLine);
        if (projection.gap <= 30 && projection.fraction > 0 && projection.fraction < 1) cuts.push(projection.fraction);
      }
      const ordered = [...new Set(cuts)].sort((left, right) => left - right);
      for (let cut = 1; cut < ordered.length; cut += 1) {
        const start = first.map((value, axis) => value + ordered[cut - 1] * (last[axis] - value));
        const end = first.map((value, axis) => value + ordered[cut] * (last[axis] - value));
        if (distanceMeters(start, end) < 0.01) continue;
        const matches = candidates.map(feature => {
          const positions = [start, start.map((value, axis) => (value + end[axis]) / 2), end].map(point => projectOnLine(point, feature.geometry.coordinates, measures.get(feature.properties.id)));
          const direction = Math.sign(positions[2].measure - positions[0].measure);
          const allowedDirection = !record.sourceDirection || feature.properties.sensCir === 0 || feature.properties.sensCir === direction;
          return { feature, positions, allowedDirection, maximum: Math.max(...positions.map(position => position.gap)), average: positions.reduce((sum, position) => sum + position.gap, 0) / positions.length };
        }).filter(match => match.allowedDirection && match.maximum <= 30 && Math.abs(match.positions[2].measure - match.positions[0].measure) >= distanceMeters(start, end) * 0.4)
          .sort((left, right) => left.average - right.average || left.feature.properties.id - right.feature.properties.id);
        if (!matches.length) { review.push({ recordId: record.id, reason: "source-edge-not-matched-to-its-verified-road-reference", geometry: { type: "LineString", coordinates: [start, end] }, referenceIds }); continue; }
        const best = matches[0];
        const limits = [best.positions[0].measure, best.positions[2].measure].sort((left, right) => left - right);
        add(record, best.feature.properties.id, limits[0], limits[1]);
      }
    }
  };
  for (const record of inputs) {
    const sourceId = record.geometryRef?.recordId || record.id;
    const road = resolved.get(sourceId);
    if (road) {
      const lines = geometryLines(record.geometry);
      lines.forEach((line, index) => {
        const id = road.geometrySource.segments[index]?.id || road.geometrySource.clippedSection?.roadSegmentId;
        assert.ok(features.has(id), `Missing current geobase geometry ${id}`);
        const positions = line.map(point => projectOnLine(point, features.get(id).geometry.coordinates, measures.get(id)));
        assert.ok(positions.every(position => position.gap < 1), `Stored geobase geometry changed: ${id}`);
        add(record, id, Math.min(...positions.map(position => position.measure)), Math.max(...positions.map(position => position.measure)));
      });
    } else if (pdf.has(sourceId)) {
      const parent = pdf.get(sourceId);
      for (const section of parent.sections.filter(section => !record.geometryRef?.courseId || section.courseId === record.geometryRef.courseId)) {
        const course = snapshot.officialCourseReference.courses.find(course => course.id === section.courseId);
        matchLine(record, course.geometry.coordinates.slice(section.firstCoordinateIndex, section.lastCoordinateIndex + 1), section.referenceIds.filter(id => id.startsWith("geobase:")).map(id => Number(id.split(":")[1])));
      }
    } else {
      const ids = [...features.values()].filter(feature => normalizedRoadName(feature.properties.sur) === normalizedRoadName(record.streets)).map(feature => feature.properties.id);
      for (const line of geometryLines(record.geometry)) matchLine(record, line, ids);
    }
  }
  const openRoads = new Map();
  for (const exception of parkSnapshot.accessExceptions) for (const feature of exception.roadFeatures) openRoads.set(feature.properties.id, exception);
  const ownedRoads = new Map();
  for (const record of parkSnapshot.automobileRecords) {
    if (!features.has(record.geobaseId)) continue;
    const intervals = geometryLines(record.geometry).map(line => {
      const values = line.map(point => projectOnLine(point, features.get(record.geobaseId).geometry.coordinates, measures.get(record.geobaseId)).measure);
      return [Math.min(...values), Math.max(...values)];
    });
    ownedRoads.set(record.geobaseId, { record, intervals });
  }
  const records = [];
  for (const group of groups.values()) {
    const exception = openRoads.get(group.geobaseId);
    if (exception && group.startDate <= exception.endDate && group.endDate >= exception.startDate) {
      withheld.push({ geobaseId: group.geobaseId, startDate: group.startDate, endDate: group.endDate, severity: group.severity,
        sourceRecordIds: [...new Set(group.intervals.map(interval => interval.record.id))], reason: "authorized-Casino-access-contradicts-unqualified-Marathon-colour", authorityNotice: exception.sourceUrl,
        authorityPeriod: { startDate: exception.startDate, endDate: exception.endDate, startTime: exception.startTime, endTime: exception.endTime } });
      continue;
    }
    const authority = group.severity !== "parking" && ownedRoads.get(group.geobaseId);
    const cuts = [...new Set(group.intervals.flatMap(interval => [interval.start, interval.end]).concat(authority && authority.record.startDate === group.startDate ? authority.intervals.flat() : []))].sort((left, right) => left - right);
    const portions = [];
    for (let index = 1; index < cuts.length; index += 1) {
      const start = cuts[index - 1];
      const end = cuts[index];
      if (end - start < 0.01) continue;
      const middle = (start + end) / 2;
      const candidates = group.intervals.filter(interval => interval.start <= middle && interval.end >= middle);
      if (!candidates.length) continue;
      if (authority && authority.record.startDate === group.startDate && authority.intervals.some(([lower, upper]) => lower <= middle && upper >= middle)) {
        withheld.push({ geobaseId: group.geobaseId, startDate: group.startDate, endDate: group.endDate, severity: group.severity, interval: [start, end],
          sourceRecordIds: [...new Set(candidates.map(candidate => candidate.record.id))], reason: "display-owned-by-current-park-notice", ownerId: authority.record.id });
        continue;
      }
      const priority = Math.max(...candidates.map(candidate => candidate.rank));
      const preferred = candidates.filter(candidate => candidate.rank === priority).sort((left, right) => left.record.id.localeCompare(right.record.id));
      const windows = mergeIntervals(preferred.map(candidate => [Date.parse(`${candidate.record.startDate}T${candidate.record.startTime}:00Z`), Date.parse(`${candidate.record.endDate}T${candidate.record.endTime}:00Z`)]));
      const owner = preferred[0].record;
      const memberIds = [...new Set(candidates.flatMap(candidate => [candidate.record.id, ...(candidate.record.matchedSourceRecords || []).map(record => record.id)]))].sort();
      const windowKey = JSON.stringify(windows);
      const previous = portions.at(-1);
      if (previous && previous.end === start && previous.windowKey === windowKey && previous.priority === priority) {
        previous.end = end;
        previous.memberIds = [...new Set([...previous.memberIds, ...memberIds])].sort();
      } else portions.push({ start, end, windows, windowKey, priority, owner, memberIds });
    }
    for (const portion of portions) {
      const windows = portion.windows.map(([start, end]) => ({ startDate: new Date(start).toISOString().slice(0, 10), startTime: new Date(start).toISOString().slice(11, 16), endDate: new Date(end).toISOString().slice(0, 10), endTime: new Date(end).toISOString().slice(11, 16) }));
      const first = windows[0];
      const last = windows.at(-1);
      const key = [group.geobaseId, group.severity, first.startDate, last.endDate, portion.start.toFixed(4), portion.end.toFixed(4), portion.windowKey];
      records.push({ id: `marathon-display-${createHash("sha256").update(JSON.stringify(key)).digest("hex").slice(0, 16)}`,
        ownerRecordId: portion.owner.id, sourceRecordIds: portion.memberIds, geobaseId: group.geobaseId, streetName: features.get(group.geobaseId).properties.sur.trim(),
        severity: group.severity, startDate: first.startDate, startTime: first.startTime, endDate: last.endDate, endTime: last.endTime, windows,
        interval: [portion.start, portion.end], geometry: { type: "LineString", coordinates: sliceLine(features.get(group.geobaseId).geometry.coordinates, portion.start, portion.end, measures.get(group.geobaseId)) } });
    }
  }
  assert.equal(JSON.stringify(snapshot), sourceBefore, "Display builder mutated the original snapshot");
  return { schemaVersion: 1, generatedAt: new Date().toISOString(), sourceUrl: roadCapture.url, sourceCheckedAt: roadCapture.checkedAt,
    additionalSource: roadCapture.additionalSource || null, additionalSources: roadCapture.additionalSources || [], authoritySnapshot: "data/parc-jean-drapeau-snapshot.json", authorityCheckedAt: parkSnapshot.extractedAt,
    method: "Source traces projected only onto their verified named geobase references. Overlapping spatial intervals are partitioned once per road, day and impact; article matches take precedence. Original records, directions and geometries remain in the source collections. Authorized Casino access colours are withheld, not declared open outside the authority's published period.",
    records: records.sort((left, right) => left.id.localeCompare(right.id)), roadFeatures: [...features.values()].filter(feature => records.some(record => record.geobaseId === feature.properties.id)), review, withheld,
    inputRecordCount: inputs.length, sourceRecordsPreserved: true };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const displayOnly = process.argv.includes("--display-only");
  const directory = displayOnly ? process.argv[process.argv.indexOf("--display-only") + 1] : process.argv[2];
  assert.ok(directory, "Supply the directory containing verified source captures; no network refresh is implied");
  const read = name => JSON.parse(readFileSync(path.join(directory, name), "utf8"));
  const snapshotFile = "data/Marathon-Beneva-Mtl-2026.json";
  const snapshot = JSON.parse(readFileSync(snapshotFile, "utf8"));
  const result = displayOnly
    ? { ...snapshot, displayGeometryReference: buildMarathonDisplayReference(snapshot, read("marathon-normalized.json"), read("marathon-reference-roads.json"), JSON.parse(readFileSync("data/parc-jean-drapeau-snapshot.json", "utf8"))) }
    : buildSupplement(snapshot, { roads: read("article-roads-geobase.json"), viau: read("viau-geobase.json"), crosses: read("notre-dame-cross-streets.json"), intersections: read("intersection-streets.json"), parks: read("official-parks-geojson.json") });
  writeFileSync(snapshotFile, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify({ displayRecords: result.displayGeometryReference?.records.length, displayReview: result.displayGeometryReference?.review.length,
    resolvedRoads: result.articleScheduleReference.resolvedRoads.length, scheduleAdjustments: result.articleScheduleReference.adjustments.length,
    adjustedTargets: result.articleScheduleReference.adjustments.reduce((total, adjustment) => total + adjustment.targetIds.length, 0), accessNotices: result.officialAccessNotices.records.length,
    unresolvedAdjustments: result.articleScheduleReference.unresolvedAdjustments.length, originalSourceCollections: "unchanged", sourceCaptureDates: "preserved" }));
}