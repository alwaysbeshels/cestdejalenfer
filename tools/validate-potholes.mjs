import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  buildReportGroups, buildRepairGroups, hasLocalCoordinates, normalizeSearch, reportStreet, selectRepairRecords, snapshotSummary,
  classifyPosition, buildPositionTimeline, selectMapPositions, decodeMapReport, decodeMapRepair,
  buildActivePeriods, activeInYear, pointRadiusForZoom,
} from "../js/potholes-data.mjs";

const readSnapshot = (name) => JSON.parse(readFileSync(new URL(`../data/nids-de-poule/${name}`, import.meta.url), "utf8"));
const base = {
  positionId: "45.5,-73.6", latitude: 45.5, longitude: -73.6,
  positionFiable: true, etat: "ouvert", nature: "Requete",
  rue: "rue de l\u00c9glise", arrondissementGeo: "Verdun", dateCreation: "2026-04-03T12:00:00",
};
const records = [
  { ...base, idUnique: "26-1" },
  { ...base, idUnique: "26-2", etat: "ferme" },
  { ...base, idUnique: "26-3", positionFiable: false },
  { ...base, idUnique: "26-4", latitude: 0.000412 },
  { ...base, nature: "Information", etat: "information" },
];
const grouped = buildReportGroups(records);
assert.equal(grouped.groups.length, 1);
assert.deepEqual(grouped.groups[0].recordIndices, [0, 1]);
assert.equal(grouped.groups[0].openCount, 1);
assert.equal(grouped.mappedCount, 2);
assert.equal(grouped.unmappedCount, 2);
assert.equal(grouped.matchedCount, 4);
assert.equal(buildReportGroups(records, { state: "ouvert", search: "eglise", district: "Verdun", month: "2026-04" }).mappedCount, 1);
assert.equal(buildReportGroups(records, { search: "26-2" }).mappedCount, 1);
assert.equal(buildReportGroups(records, { state: "inconnu" }).matchedCount, 0);
assert.equal(buildReportGroups(records, { month: "2026-03" }).matchedCount, 0);
assert.equal(buildReportGroups(records, { district: "Lachine" }).matchedCount, 0);
assert.equal(normalizeSearch("  Montr\u00e9al  "), "montreal");
assert.equal(reportStreet({ intersection1: "A", intersection2: "B" }), "A / B");
assert.equal(hasLocalCoordinates({ latitude: "45.5", longitude: -73.6 }), false);
assert.equal(hasLocalCoordinates({ latitude: NaN, longitude: -73.6 }), false);

const repairs = [
  { latitude: 45.5, longitude: -73.6, horodatage: "2025-04-03T12:00:00", appareil: "NP100" },
  { latitude: 0.000412, longitude: -76.237951, horodatage: "2025-04-03T12:00:00", appareil: "NP100" },
  { latitude: 45.5, longitude: -73.6, horodatage: "2024-12-03T12:00:00", appareil: "NP101" },
];
assert.deepEqual(selectRepairRecords(repairs, { month: "2025-04", device: "NP100" }), {
  recordIndices: [0], matchedCount: 2, mappedCount: 1, unmappedCount: 1,
});
assert.deepEqual(snapshotSummary(repairs, "repairs").months, ["2024-12", "2025-04"]);
const repairGroups = buildRepairGroups(repairs);
assert.equal(repairGroups.groups.length, 1);
assert.equal(repairGroups.groups[0].count, 2);
assert.equal(repairGroups.unmappedCount, 1);
assert.equal(snapshotSummary(records, "reports").informationCount, 1);
assert.equal(snapshotSummary(records, "reports").mappableCount, 2);
console.log("PASS: grouping, administrative locations, information records, filters and coordinate validation");

const matchedRepair = { horodatage: "2025-05-03T12:00:00", appareil: "NP100", distanceM: 12 };
assert.equal(classifyPosition("2025-04-01T12:00:00", []), "active");
assert.equal(classifyPosition("2025-04-01T12:00:00", [matchedRepair]), "presumed-repaired");
assert.equal(classifyPosition("2026-01-01T12:00:00", [matchedRepair]), "active");
assert.equal(classifyPosition(matchedRepair.horodatage, [matchedRepair]), "active");
assert.equal(classifyPosition("", [matchedRepair]), "unknown");
assert.equal(classifyPosition("2025-04-01T12:00:00", [matchedRepair], false), "unknown");
const timeline = buildPositionTimeline([
  { dateCreation: "2026-01-01T12:00:00", etat: "ferme", idUnique: "26-1" },
  { dateCreation: "2025-04-01T12:00:00", etat: "ouvert", idUnique: "25-1" },
], [matchedRepair, { ...matchedRepair }, { horodatage: "invalid" }]);
assert.deepEqual(timeline.map((event) => event.kind), ["report", "repair", "report"]);
assert.equal(classifyPosition(timeline.at(-1).date, [matchedRepair]), "active");
console.log("PASS: presumed repair, later reopening, unknown history and chronological event deduplication");

const compactPosition = {
  positionId: base.positionId, rues: [base.rue], arrondissements: ["Verdun"],
  dernierSignalement: "2026-01-01T12:00:00", dernierColmatage: matchedRepair.horodatage,
  signalements: [["25-1", "2025-04-01T12:00:00", "Terminee", 2025, 0], ["26-1", "2026-01-01T12:00:00", "Terminee", 2026, 1]],
  periodesActives: buildActivePeriods(["2025-04-01T12:00:00", "2026-01-01T12:00:00"], [matchedRepair.horodatage]),
};
assert.equal(selectMapPositions([compactPosition], { years: [2025] })[0].mapStatus, "active");
assert.equal(selectMapPositions([compactPosition], { years: [2025], status: "presumed-repaired" }).length, 0);
assert.equal(selectMapPositions([compactPosition], { years: [] }).length, 0);
assert.deepEqual(selectMapPositions([compactPosition], { years: [2025, 2026], search: "26-1" })[0].selectedIndices, [1]);
assert.equal(decodeMapReport(compactPosition.signalements[0]).idUnique, "25-1");
assert.equal(decodeMapRepair([matchedRepair.horodatage, "NP100", 12, 45.5, -73.6]).distanceM, 12);
console.log("PASS: multi-year selection preserves all-time status and includes closed 311 requests");

const activity = buildActivePeriods(
  ["2020-08-01T12:00:00", "2020-09-01T12:00:00", "2025-03-01T12:00:00"],
  ["2022-01-01T00:00:00", "2023-06-01T12:00:00"],
);
assert.deepEqual(activity, [
  { start: "2020-08-01T12:00:00", end: "2022-01-01T00:00:00" },
  { start: "2025-03-01T12:00:00", end: null },
]);
assert.equal(activeInYear(activity, 2019), false);
assert.equal(activeInYear(activity, 2021), true);
assert.equal(activeInYear(activity, 2022), false);
assert.equal(activeInYear(activity, 2023), false);
assert.equal(activeInYear(activity, 2024), false);
assert.equal(activeInYear(activity, 2025), true);
assert.equal(activeInYear(activity, 2026), true);
const continuingPosition = { ...compactPosition, periodesActives: activity };
assert.equal(selectMapPositions([continuingPosition], { years: [2021] }).length, 1);
assert.equal(selectMapPositions([continuingPosition], { years: [2024] }).length, 0);
assert.equal(selectMapPositions([continuingPosition], { years: [2021, 2025, 2026] }).length, 1);
assert.equal(selectMapPositions([continuingPosition], { years: [2021], status: "presumed-repaired" }).length, 0);
assert.deepEqual(buildActivePeriods([matchedRepair.horodatage], [matchedRepair.horodatage]), [{ start: matchedRepair.horodatage, end: null }]);
assert.equal(pointRadiusForZoom(10), 2);
assert.equal(pointRadiusForZoom(19), 8);
assert.equal(pointRadiusForZoom(8), 2);
assert.equal(pointRadiusForZoom(21), 8);
assert.ok(pointRadiusForZoom(12) < pointRadiusForZoom(15) && pointRadiusForZoom(15) < pointRadiusForZoom(18));
console.log("PASS: activity-year overlap, inactive gaps, one current status per position and zoom-scaled point radius");

const index = readSnapshot("index.json");
let totalReports = 0;
let totalMappedReports = 0;
let totalRepairs = 0;
let excludedRepairs = 0;
for (const entry of index.signalements) {
  const snapshot = readSnapshot(entry.fichier);
  assert.equal(snapshot.signalements.length, entry.nombre);
  const result = buildReportGroups(snapshot.signalements);
  assert.equal(result.groups.reduce((count, group) => count + group.count, 0), result.mappedCount);
  assert.equal(result.mappedCount + result.unmappedCount + snapshotSummary(snapshot.signalements, "reports").informationCount, entry.nombre);
  assert.equal(result.groups.length, new Set(result.groups.map((group) => group.positionId)).size);
  totalReports += entry.nombre;
  totalMappedReports += result.mappedCount;
}
for (const entry of index.reparations) {
  const snapshot = readSnapshot(entry.fichier);
  assert.equal(snapshot.interventions.length, entry.nombre);
  const result = selectRepairRecords(snapshot.interventions);
  assert.equal(result.mappedCount + result.unmappedCount, entry.nombre);
  totalRepairs += entry.nombre;
  excludedRepairs += result.unmappedCount;
  if (result.unmappedCount) console.log(`NOTICE: ${entry.annee}: ${result.unmappedCount} repair coordinates excluded`);
}
console.log(`PASS: ${totalReports} reports and ${totalRepairs} repair records; ${excludedRepairs} invalid repair coordinates excluded`);

const mapSnapshot = readSnapshot("carte.json");
const repairHistory = readSnapshot("historique-colmatages.json");
assert.equal(mapSnapshot.schemaVersion, 2);
assert.equal(mapSnapshot.version, repairHistory.version);
assert.equal(mapSnapshot.origine.indexModifieLe, index.contenuModifieLe);
assert.equal(mapSnapshot.positions.length, readSnapshot("positions.json").nombrePositions);
assert.equal(mapSnapshot.positions.reduce((count, position) => count + position.signalements.length, 0), totalMappedReports);
const statuses = {};
for (const entry of selectMapPositions(mapSnapshot.positions)) {
  const position = entry.position;
  const repairs = (repairHistory.positions[position.positionId] || []).map(decodeMapRepair);
  assert.equal(repairs.length, position.nombreColmatages);
  assert.equal(repairs.at(-1)?.horodatage || "", position.dernierColmatage);
  assert.ok(repairs.every((repair) => repair.distanceM <= mapSnapshot.rayonAppariementM && hasLocalCoordinates(repair)
    && repair.horodatage >= position.premierSignalement));
  assert.equal(classifyPosition(position.dernierSignalement, repairs), entry.mapStatus);
  assert.deepEqual(position.periodesActives, buildActivePeriods(position.signalements.map((record) => record[1]), repairs.map((repair) => repair.horodatage)));
  assert.equal(position.periodesActives.at(-1)?.end === null, entry.mapStatus === "active");
  statuses[entry.mapStatus] = (statuses[entry.mapStatus] || 0) + 1;
}
console.log(`PASS: compact map and chronological repair history agree: ${JSON.stringify(statuses)}`);

const activitySelection = selectMapPositions(mapSnapshot.positions, { years: [2025, 2026] });
assert.equal(new Set(activitySelection.map((entry) => entry.position.positionId)).size, activitySelection.length);
for (const status of ["active", "presumed-repaired", "unknown"]) {
  const filtered = selectMapPositions(mapSnapshot.positions, { years: [2025, 2026], status });
  assert.equal(filtered.length, activitySelection.filter((entry) => entry.mapStatus === status).length);
  assert.ok(filtered.every((entry) => entry.mapStatus === status));
}
console.log("PASS: real activity-year selection assigns exactly one current status to each position");