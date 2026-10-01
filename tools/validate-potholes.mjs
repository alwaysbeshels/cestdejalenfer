import assert from "node:assert/strict";
import { districtBounds, clampResultsPanelWidth, RESULTS_PANEL_MIN_WIDTH, RESULTS_PANEL_MAX_WIDTH, summarizePotholeCatalog } from "../js/potholes-data.mjs";
import { readFileSync } from "node:fs";
import { createStreetMatcher, createPotholeRankings } from "./potholes-rankings.mjs";
import {
  buildReportGroups, buildRepairGroups, hasLocalCoordinates, normalizeSearch, reportStreet, selectRepairRecords, snapshotSummary,
  classifyPosition, buildPositionTimeline, selectMapPositions, decodeMapReport, decodeMapRepair,
  buildActivePeriods, activeInYear, pointRadiusForZoom, clusterProperties, mergeClusterProperties, clusterStatus, rankPotholePositions,
} from "../js/potholes-data.mjs";

const readSnapshot = (name) => JSON.parse(readFileSync(new URL(`../data/nids-de-poule/${name}`, import.meta.url), "utf8"));
const catalogFixture = {
  signalements: [{ annee: 2024, nombre: 10 }, { annee: 2026, nombre: 6, nombreOuverts: 2 }],
  reparations: [{ annee: 2023, nombre: 20 }, { annee: 2025, nombre: 4 }],
};
const catalogStatistics = summarizePotholeCatalog(catalogFixture);
assert.equal(catalogStatistics.totalRequests, 16);
assert.equal(catalogStatistics.totalInterventions, 24);
assert.equal(catalogStatistics.latestReports.nombre, 6);
assert.equal(catalogStatistics.latestReports.nombreOuverts, 2);
assert.equal(catalogStatistics.latestRepairs.annee, 2025);
assert.equal(catalogFixture.signalements[0].annee, 2024);
assert.equal(summarizePotholeCatalog({}).latestReports, null);
const separatedStatistics = summarizePotholeCatalog(catalogFixture, [
  { annee: 2024, nombre: 10, informations: 3 },
  { annee: 2026, nombre: 6, informations: 2 },
]);
assert.equal(separatedStatistics.hasRequestBreakdown, true);
assert.equal(separatedStatistics.totalReports, 11);
assert.equal(separatedStatistics.totalInformation, 5);
assert.equal(separatedStatistics.latestReports.reportCount, 4);
assert.equal(separatedStatistics.latestReports.informationCount, 2);
assert.equal(catalogStatistics.hasRequestBreakdown, false);
assert.equal(catalogStatistics.totalReports, null);
assert.equal(summarizePotholeCatalog(catalogFixture, [{ annee: 2026, nombre: 6, informations: 7 }]).hasRequestBreakdown, false);
console.log("PASS: catalog statistics separate annual requests from cumulative totals without mutating sources");
const updateSummary = summarizePotholeCatalog({
  contenuModifieLe: "2030-01-01T00:00:00Z",
  signalements: [
    { annee: 2026, nombre: 4, contenuModifieLe: "2026-09-28T12:00:00Z" },
    { annee: 2025, nombre: 3, contenuModifieLe: "2026-09-30T04:43:33.982Z" },
    { annee: 2024, nombre: 2, contenuModifieLe: "invalid" },
  ],
  reparations: [{ annee: 2025, nombre: 5, contenuModifieLe: "2026-09-29T10:00:00Z" }],
});
assert.equal(updateSummary.dataUpdatedAt, "2026-09-30T04:43:33.982Z");
assert.equal(summarizePotholeCatalog({ reparations: [{ annee: 2025, nombre: 1, contenuModifieLe: "2026-10-01T00:00:00Z" }] }).dataUpdatedAt, "2026-10-01T00:00:00Z");
assert.equal(summarizePotholeCatalog({}).dataUpdatedAt, null);
assert.equal(summarizePotholeCatalog(catalogFixture).dataUpdatedAt, null);
console.log("PASS: data update date uses the latest valid annual content change, not catalog verification or generation");
const districtPositions = [
  { latitude: 45.45, longitude: -73.6, arrondissements: ["Verdun"] },
  { latitude: 45.48, longitude: -73.57, arrondissements: ["Verdun"] },
  { latitude: 45.7, longitude: -73.8, arrondissements: ["Anjou"] },
  { latitude: 0, longitude: -73.6, arrondissements: ["Verdun"] },
];
assert.deepEqual(districtBounds(districtPositions, "Verdun"), [-73.6, 45.45, -73.57, 45.48]);
assert.equal(districtBounds(districtPositions, ""), null);
assert.equal(districtBounds(districtPositions, "missing"), null);
assert.deepEqual(districtBounds(districtPositions, "Anjou"), [-73.8, 45.7, -73.8, 45.7]);
assert.equal(clampResultsPanelWidth(0), RESULTS_PANEL_MIN_WIDTH);
assert.equal(clampResultsPanelWidth(999), RESULTS_PANEL_MAX_WIDTH);
assert.equal(clampResultsPanelWidth(280.4), 280);
console.log("PASS: district extent ignores invalid coordinates and results panel width stays within bounds");
const rankingPosition = (positionId, dates, repairs = []) => ({
  positionId, latitude: 45.5, longitude: -73.6, rues: ["rue Test"], arrondissements: ["Verdun"],
  signalements: dates.map((date, index) => [`${positionId}-${index}`, date]),
  premierSignalement: dates[0], nombreColmatages: repairs.length, periodesActives: buildActivePeriods(dates, repairs),
});
const rankingFixtures = [
  rankingPosition("old", ["2017-01-01", "2018-01-01"]),
  rankingPosition("future", ["2026-01-01", "2026-02-01", "2026-03-01", "2026-04-01"]),
  rankingPosition("reopened", ["2017-01-01", "2019-01-01", "2024-01-01"], ["2018-01-01", "2020-01-01"]),
  rankingPosition("same-time", ["2017-01-01", "2018-01-01"], ["2018-01-01"]),
  { ...rankingPosition("invalid", ["2017-01-01"]), latitude: 0 },
];
const positionRankings = rankPotholePositions(rankingFixtures, "2025-05-20");
assert.equal(positionRankings.plusSignales[0].positionId, "future");
assert.equal(positionRankings.plusColmates[0].positionId, "reopened");
assert.equal(positionRankings.emplacements.find((entry) => entry.positionId === "reopened").reapparitions, 2);
assert.equal(positionRankings.emplacements.find((entry) => entry.positionId === "same-time").reapparitions, 0);
assert.deepEqual(positionRankings.sansColmatage.map((entry) => entry.positionId), ["old"]);
assert.equal(rankPotholePositions(rankingFixtures).sansColmatage.length, 0);
assert.equal(rankingFixtures[0].positionId, "old");
assert.equal(positionRankings.emplacements.length, 4);
console.log("PASS: location rankings preserve inputs, distinguish reappearances and exclude reports outside repair coverage from unmatched rankings");
const streetFixtures = [
  { rue: "rue Test", arrondissements: ["Verdun"], coordinates: [[-73.61, 45.5], [-73.59, 45.5]] },
  { rue: "rue Croisee", arrondissements: ["Verdun"], coordinates: [[-73.601, 45.499], [-73.601, 45.501]] },
];
const matchStreet = createStreetMatcher(streetFixtures);
assert.equal(matchStreet({ latitude: 45.5, longitude: -73.6 }).street.rue, "rue Test");
assert.equal(matchStreet({ latitude: 45.5, longitude: -73.601 }).kind, "ambiguous");
assert.equal(matchStreet({ latitude: 45.6, longitude: -73.6 }).kind, "unmatched");
assert.equal(matchStreet({ latitude: 0, longitude: -73.6 }).kind, "invalid");
const rankingsAccumulator = createPotholeRankings(streetFixtures, { firstRepair: "2016-01-01", lastRepair: "2025-05-20", latestYear: 2025 });
const rankingRepair = { latitude: 45.5, longitude: -73.6, appareil: "NP100", horodatage: "2025-01-01" };
rankingsAccumulator.addRepair(rankingRepair, 2025);
rankingsAccumulator.addRepair(rankingRepair, 2025);
rankingsAccumulator.addRepair({ ...rankingRepair, appareil: "NP099", horodatage: "2023-01-01" }, 2023);
rankingsAccumulator.addRepair({ ...rankingRepair, longitude: -73.601, appareil: "NP101" }, 2025);
rankingsAccumulator.addRepair({ ...rankingRepair, latitude: 0, appareil: "NP102" }, 2025);
const streetRankings = rankingsAccumulator.finish(rankingFixtures, { reopened: [["2018-01-01", "NP099", 0, 45.5, -73.6]] });
assert.equal(streetRankings.couverture.colmatagesBruts, 5);
assert.equal(streetRankings.couverture.colmatagesAttribues, 2);
assert.equal(streetRankings.couverture.doublonsColmatages, 1);
assert.equal(streetRankings.couverture.colmatagesAmbigus, 1);
assert.equal(streetRankings.couverture.colmatagesInvalides, 1);
assert.equal(streetRankings.ruesEmplacements[0].emplacements, 4);
assert.equal(streetRankings.ruesRecurrences[0].emplacementsRecurrents, 1);
assert.equal(streetRankings.ruesRecurrences[0].colmatagesRecurrents, 1);
assert.equal(streetRankings.ruesAnciennes[0].plusAncienSansColmatage, "2017-01-01");
assert.deepEqual(streetRankings.machinesAbsentes.map((machine) => [machine.appareil, machine.derniereAnnee]), [["NP099", 2023]]);
assert.equal(streetRankings.machines.reduce((total, machine) => total + machine.colmatages, 0), 5);
assert.equal(streetRankings.ruesRatio[0].signalementsComparables, 7);
assert.equal(rankPotholePositions([rankingPosition("before", ["2014-01-01"])], "2025-05-20", "2016-01-01").sansColmatage.length, 0);
console.log("PASS: street assignment excludes ambiguous crossings, counts unique interventions, preserves raw machine totals and uses comparable reporting periods");
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
assert.equal(repairGroups.groups[0].firstDate, "2024-12-03T12:00:00");
assert.equal(repairGroups.groups[0].lastDate, "2025-04-03T12:00:00");
assert.deepEqual(repairGroups.groups[0].devices, ["NP100", "NP101"]);
assert.equal(repairGroups.unmappedCount, 1);
const filteredRepairs = buildRepairGroups(repairs, { month: "2025-04", device: "NP100" });
assert.equal(filteredRepairs.groups.length, 1);
assert.equal(filteredRepairs.groups[0].count, 1);
assert.equal(filteredRepairs.groups[0].firstDate, filteredRepairs.groups[0].lastDate);
assert.deepEqual(filteredRepairs.groups[0].devices, ["NP100"]);
assert.equal(buildRepairGroups(repairs, { device: "missing" }).groups.length, 0);
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
assert.equal(pointRadiusForZoom(10), 1);
assert.equal(pointRadiusForZoom(19), 7);
assert.equal(pointRadiusForZoom(8), 1);
assert.equal(pointRadiusForZoom(21), 7);
assert.ok(pointRadiusForZoom(12) < 1.5);
assert.ok(pointRadiusForZoom(12) < pointRadiusForZoom(15) && pointRadiusForZoom(15) < pointRadiusForZoom(18));
console.log("PASS: activity-year overlap, inactive gaps, one current status per position and zoom-scaled point radius");

const cluster = clusterProperties({ count: 40, status: "active" });
mergeClusterProperties(cluster, clusterProperties({ count: 5, status: "active" }));
assert.equal(cluster.reports, 45);
assert.equal(cluster.active, 2);
assert.equal(clusterStatus(cluster), "active");
mergeClusterProperties(cluster, clusterProperties({ count: 10, status: "presumed-repaired" }));
assert.equal(clusterStatus(cluster), "mixed");
assert.equal(cluster.active + cluster.repaired + cluster.unknown, 3);
assert.equal(cluster.reports, 55);
assert.equal(clusterStatus(clusterProperties({ count: 12, status: "unknown" })), "unknown");
assert.equal(clusterStatus(clusterProperties({ count: 7, status: "presumed-repaired" })), "presumed-repaired");
console.log("PASS: cluster position counts stay distinct from repeated 311 reports and preserve individual statuses");

const index = readSnapshot("index.json");
let totalReports = 0;
let totalMappedReports = 0;
let totalRepairs = 0;
let excludedRepairs = 0;
const machineCounts = new Map();
const latestMachineYears = new Map();
const latestFileMachines = new Set();
const latestRepairYear = Math.max(...index.reparations.map((entry) => entry.annee));
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
  for (const repair of snapshot.interventions) {
    const device = String(repair.appareil || "").trim();
    if (!device) continue;
    machineCounts.set(device, (machineCounts.get(device) || 0) + 1);
    if (entry.annee === latestRepairYear) latestFileMachines.add(device);
    if (Number.isFinite(Date.parse(repair.horodatage))) {
      latestMachineYears.set(device, Math.max(latestMachineYears.get(device) || 0, Number(repair.horodatage.slice(0, 4))));
    }
  }
  const result = selectRepairRecords(snapshot.interventions);
  assert.equal(result.mappedCount + result.unmappedCount, entry.nombre);
  const groups = buildRepairGroups(snapshot.interventions);
  assert.equal(groups.groups.reduce((count, group) => count + group.count, 0), result.mappedCount);
  assert.equal(new Set(groups.groups.map((group) => group.positionId)).size, groups.groups.length);
  assert.ok(groups.groups.every((group) => group.firstDate <= group.lastDate
    && group.recordIndices.length === group.count
    && group.recordIndices.every((recordIndex) => !snapshot.interventions[recordIndex].appareil
      || group.devices.includes(snapshot.interventions[recordIndex].appareil))));
  totalRepairs += entry.nombre;
  excludedRepairs += result.unmappedCount;
  if (result.unmappedCount) console.log(`NOTICE: ${entry.annee}: ${result.unmappedCount} repair coordinates excluded`);
}
console.log(`PASS: ${totalReports} reports and ${totalRepairs} repair records; ${excludedRepairs} invalid repair coordinates excluded`);
const annualStatistics = readSnapshot("statistiques.json");
assert.equal(annualStatistics.origine.indexModifieLe, index.contenuModifieLe);
assert.deepEqual(annualStatistics.origine.signalements, index.signalements.map((entry) => [entry.fichier, entry.contenuModifieLe]));
const realStatistics = summarizePotholeCatalog(index, annualStatistics.annees);
assert.equal(realStatistics.hasRequestBreakdown, true);
for (const entry of realStatistics.reports) {
  const source = readSnapshot(entry.fichier);
  const informationCount = source.signalements.filter((record) => record.etat === "information" || record.nature === "Information").length;
  assert.equal(entry.informationCount, informationCount);
  assert.equal(entry.reportCount, source.signalements.length - informationCount);
}
assert.equal(realStatistics.totalReports + realStatistics.totalInformation, totalReports);
assert.equal(realStatistics.totalRequests, totalReports);
assert.equal(realStatistics.totalInterventions, totalRepairs);
assert.equal(realStatistics.latestReports.annee, Math.max(...index.signalements.map((entry) => entry.annee)));
assert.equal(realStatistics.latestRepairs.annee, Math.max(...index.reparations.map((entry) => entry.annee)));
console.log("PASS: statistical overview agrees with every annual snapshot");

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
const rankings = annualStatistics.classements;
assert.equal(rankings.schemaVersion, 1);
assert.equal(rankings.couverture.derniereAnnee, latestRepairYear);
assert.equal(rankings.couverture.colmatagesBruts, totalRepairs);
assert.equal(["doublonsColmatages", "colmatagesAttribues", "colmatagesAmbigus", "colmatagesHorsRue", "colmatagesInvalides"]
  .reduce((total, key) => total + rankings.couverture[key], 0), totalRepairs);
assert.equal(rankings.couverture.emplacementsAttribues + rankings.couverture.emplacementsNonAttribues, mapSnapshot.positions.length);
const expectedLocationRankings = rankPotholePositions(mapSnapshot.positions, rankings.couverture.dernierColmatage, rankings.couverture.premierColmatage);
assert.deepEqual(rankings.emplacementsSignales, expectedLocationRankings.plusSignales);
assert.deepEqual(rankings.emplacementsColmates, expectedLocationRankings.plusColmates);
assert.deepEqual(rankings.emplacementsSansColmatage, expectedLocationRankings.sansColmatage);
assert.equal(rankings.machines.length, machineCounts.size);
for (const machine of rankings.machines) {
  assert.equal(machine.colmatages, machineCounts.get(machine.appareil));
  assert.equal(machine.derniereAnnee, latestMachineYears.get(machine.appareil) || null);
}
assert.deepEqual(rankings.machinesAbsentes.map((machine) => machine.appareil).sort(),
  [...machineCounts.keys()].filter((device) => !latestFileMachines.has(device) && latestMachineYears.get(device) < latestRepairYear).sort());
for (const key of ["ruesEmplacements", "ruesRecurrences", "ruesColmatages", "ruesAnciennes", "ruesRatio"]) {
  assert.ok(rankings[key].length <= 5);
  assert.equal(new Set(rankings[key].map((row) => row.rue)).size, rankings[key].length);
}
assert.ok(rankings.ruesRatio.every((row) => row.ratio === row.colmatages / Math.max(1, row.signalementsComparables)));
assert.ok(rankings.ruesRecurrences.every((row) => row.emplacementsRecurrents > 0 && row.reapparitions >= row.emplacementsRecurrents));
assert.ok(rankings.ruesAnciennes.every((row) => row.sansColmatage > 0 && Number.isFinite(Date.parse(row.plusAncienSansColmatage))));
console.log("PASS: all ranking totals reconcile with annual files, location histories, machine counts and coverage exclusions");

const activitySelection = selectMapPositions(mapSnapshot.positions, { years: [2025, 2026] });
assert.equal(new Set(activitySelection.map((entry) => entry.position.positionId)).size, activitySelection.length);
for (const status of ["active", "presumed-repaired", "unknown"]) {
  const filtered = selectMapPositions(mapSnapshot.positions, { years: [2025, 2026], status });
  assert.equal(filtered.length, activitySelection.filter((entry) => entry.mapStatus === status).length);
  assert.ok(filtered.every((entry) => entry.mapStatus === status));
}
console.log("PASS: real activity-year selection assigns exactly one current status to each position");

if (process.argv.includes("--browser")) {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ serviceWorkers: "block" });
    const page = await context.newPage();
    const browserErrors = [];
    const heavyRequests = [];
    page.on("pageerror", (error) => browserErrors.push(error.message));
    page.on("request", (request) => {
      if (/(?:reparations-\d|signalements-\d|carte\.json|historique-colmatages|tile\.openstreetmap)/.test(request.url())) heavyRequests.push(request.url());
    });
    const ready = () => page.waitForFunction(() => document.querySelectorAll(".pothole-ranking-table").length === 10, null, { polling: 100, timeout: 30000 });
    for (const language of ["fr", "en"]) {
      await page.goto(`http://localhost:5500/${language}/potholes.html?mode=statistics`);
      await ready();
      await page.evaluate(() => document.fonts.ready);
      for (const width of [1440, 1280, 1001, 1000, 768, 320]) {
        await page.setViewportSize({ width, height: width === 320 ? 568 : 960 });
        await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        const layout = await page.evaluate(() => ({
          pageOverflow: document.documentElement.scrollWidth > innerWidth || document.querySelector(".pothole-content").scrollWidth > document.querySelector(".pothole-content").clientWidth,
          missingTranslations: /potholes\.rank|\{(?:year|count|first|last)\}/.test(document.querySelector("#statisticsRankings").textContent),
          annualColumns: document.querySelector("#statisticsReportRows").rows[0].cells.length,
          pairs: [...document.querySelectorAll(".pothole-ranking-pair")].map((pair) => ({
            border: getComputedStyle(pair).borderBottomWidth,
            tables: [...pair.querySelectorAll(".pothole-table-scroll")].map((container) => {
              container.scrollTop = 0;
              const table = container.querySelector("table");
              const rows = [...table.tBodies[0].rows];
              const bounds = container.getBoundingClientRect();
              const headerHeight = table.tHead.getBoundingClientRect().height;
              const visibleRows = rows.filter((row) => {
                const rect = row.getBoundingClientRect();
                return rect.top < bounds.top + container.clientHeight - 1 && rect.bottom > bounds.top + headerHeight + 1;
              }).length;
              container.scrollTop = container.scrollHeight;
              const bottomVisible = rows.at(-1).getBoundingClientRect().bottom <= bounds.top + container.clientHeight + 1;
              const stickyHeader = Math.abs(table.tHead.rows[0].cells[0].getBoundingClientRect().top - bounds.top) < 1;
              container.scrollTop = 0;
              return {
                key: table.dataset.ranking, totalRows: rows.length, visibleRows, top: bounds.top, bottom: bounds.bottom,
                width: bounds.width, height: bounds.height, scrollbar: getComputedStyle(container).overflowY,
                bottomVisible, stickyHeader, columnsMatch: rows.every((row) => row.cells.length === table.tHead.rows[0].cells.length),
              };
            }),
          })),
        }));
        assert.equal(layout.pageOverflow, false, `${language} ${width}: page overflow`);
        assert.equal(layout.missingTranslations, false, `${language} ${width}: untranslated ranking labels`);
        assert.equal(layout.annualColumns, 3);
        assert.equal(layout.pairs.length, 5);
        for (const pair of layout.pairs) {
          const [left, right] = pair.tables;
          assert.equal(pair.border, "1px");
          if (width > 1000) {
            assert.ok(Math.abs(left.top - right.top) < 1 && Math.abs(left.width - right.width) < 1
              && Math.abs(left.height - right.height) < 1, `${language} ${width}: ${JSON.stringify(pair)}`);
          } else assert.ok(right.top >= left.bottom, `${language} ${width}: overlapping stacked tables`);
          for (const table of pair.tables) {
            assert.equal(table.totalRows, rankings[table.key].length);
            assert.equal(table.visibleRows, Math.min(5, table.totalRows), `${language} ${width}: ${JSON.stringify(table)}`);
            assert.equal(table.bottomVisible, true);
            assert.equal(table.stickyHeader, true);
            assert.equal(table.columnsMatch, true);
            if (table.totalRows > 5) assert.equal(table.scrollbar, "scroll");
          }
        }
      }
    }
    const statisticsRoute = "**/data/nids-de-poule/statistiques.json";
    for (const kind of ["missing", "stale"]) {
      const outdated = structuredClone(annualStatistics);
      if (kind === "missing") delete outdated.classements;
      else outdated.origine.reparations[0][1] = "2000-01-01T00:00:00Z";
      await context.route(statisticsRoute, (route) => route.fulfill({ json: outdated }));
      await page.goto("http://localhost:5500/fr/potholes.html?mode=statistics");
      await page.waitForFunction(() => document.querySelector("#rankingsStatus")?.hidden === false, null, { polling: 100 });
      assert.equal(await page.locator("#statisticsReportRows tr").count(), index.signalements.length);
      assert.equal(await page.locator(".pothole-ranking-table").count(), 0);
      await context.unroute(statisticsRoute);
      await page.locator("#rankingsRetry").click();
      await ready();
    }
    const empty = structuredClone(annualStatistics);
    for (const [key, value] of Object.entries(empty.classements)) if (Array.isArray(value)) empty.classements[key] = [];
    await context.route(statisticsRoute, (route) => route.fulfill({ json: empty }));
    await page.goto("http://localhost:5500/fr/potholes.html?mode=statistics");
    await ready();
    assert.equal(await page.locator(".pothole-ranking-table tbody td[colspan]").count(), 10);
    assert.deepEqual(heavyRequests, []);
    assert.deepEqual(browserErrors, []);
    console.log("PASS: ranking browser checks in both languages at six widths, five-row scrolling, empty states, stale-data isolation and retry; no map downloads");
  } finally {
    await browser.close();
  }
}