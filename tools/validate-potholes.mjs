import assert from "node:assert/strict";
import { districtBounds, clampResultsPanelWidth, RESULTS_PANEL_MIN_WIDTH, RESULTS_PANEL_MAX_WIDTH, summarizePotholeCatalog } from "../js/potholes-data.mjs";
import { readFileSync } from "node:fs";
import { createPotholeAnalyses, analysisDistrict } from "./potholes-analysis.mjs";
import { createBoroughProfiles } from "./potholes-boroughs.mjs";
import { createStreetMatcher, createPotholeRankings, isGenericStreetName, rtssRoadsFromFeatures, resolveNumberedStreets } from "./potholes-rankings.mjs";
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
assert.equal(isGenericStreetName("voie Non-nomm\u00e9e"), true);
assert.equal(isGenericStreetName("voie Non-nomm\u00e9e Longue-Pointe"), true);
assert.equal(isGenericStreetName("autoroute 10"), false);
const unnamedStreets = [
  { rue: "voie Non-nommee", arrondissements: ["Verdun"], coordinates: [[-73.61, 45.51], [-73.60, 45.51]] },
  { rue: "rue Voisine", arrondissements: ["Verdun"], coordinates: [[-73.61, 45.51009], [-73.60, 45.51009]] },
];
const unnamedPoint = { latitude: 45.51, longitude: -73.605 };
assert.equal(createStreetMatcher(unnamedStreets)(unnamedPoint).kind, "unidentified");
assert.equal(createStreetMatcher([unnamedStreets[0], {
  ...unnamedStreets[0], coordinates: [[-73.605, 45.509], [-73.605, 45.511]],
}])(unnamedPoint).kind, "ambiguous");
const unnamedRankings = createPotholeRankings(unnamedStreets, { firstRepair: "2016-01-01", lastRepair: "2025-05-20", latestYear: 2025 });
unnamedRankings.addRepair({ ...rankingRepair, ...unnamedPoint }, 2025);
const unnamedResult = unnamedRankings.finish([{ ...rankingFixtures[0], ...unnamedPoint }], {});
assert.equal(unnamedResult.couverture.colmatagesBruts, 1);
assert.equal(unnamedResult.couverture.colmatagesSansIdentification, 1);
assert.equal(unnamedResult.couverture.emplacementsSansIdentification, 1);
assert.equal(unnamedResult.ruesEmplacements.length, 0);
assert.equal(unnamedResult.ruesColmatages.length, 0);
assert.equal(unnamedResult.machines[0].colmatages, 1);
console.log("PASS: generic street labels never merge distinct roads or transfer their events to a nearby named street; totals remain accounted for");
const highwayFixture = { ...unnamedStreets[0], id: 100, classeDescription: "Autoroute" };
const rtssFeature = (numero, coordinates = highwayFixture.coordinates, overrides = {}) => ({
  type: "Feature", geometry: { type: "LineString", coordinates },
  properties: { num_route: numero, num_rts: `${numero}-test`, cod_sous_r: "0", des_clasf_: "Autoroute", ...overrides },
});
const rtssRoads = rtssRoadsFromFeatures([rtssFeature("00010")]);
const numbered = resolveNumberedStreets([highwayFixture, unnamedStreets[1]], rtssRoads);
assert.equal(numbered.rues[0].rue, "autoroute 10");
assert.equal(numbered.rues[0].identificationRtss.numeroRoute, 10);
assert.equal(numbered.rues[0].libelleGeobase, "voie Non-nommee");
assert.equal(numbered.rues[1], unnamedStreets[1]);
assert.equal(highwayFixture.rue, "voie Non-nommee");
assert.equal(numbered.generiquesResolus, 1);
assert.equal(numbered.generiquesNonResolus, 0);
assert.equal(resolveNumberedStreets([highwayFixture], rtssRoadsFromFeatures([rtssFeature("00010", [...highwayFixture.coordinates].reverse())])).generiquesResolus, 1);
assert.equal(resolveNumberedStreets([highwayFixture], rtssRoadsFromFeatures([rtssFeature("00010"), rtssFeature("00015")])).generiquesResolus, 0);
assert.equal(resolveNumberedStreets([{ ...highwayFixture, classeDescription: "Rue projetee" }], rtssRoads).generiquesResolus, 0);
assert.equal(resolveNumberedStreets([{ ...highwayFixture, classeDescription: "Rue locale" }], rtssRoads).generiquesResolus, 0);
const shortCrossing = { ...highwayFixture, coordinates: [[-73.6052, 45.51], [-73.6048, 45.51]] };
assert.equal(resolveNumberedStreets([shortCrossing], rtssRoadsFromFeatures([
  rtssFeature("00040", [[-73.605, 45.509], [-73.605, 45.511]]),
])).generiquesResolus, 0);
assert.equal(rtssRoadsFromFeatures([rtssFeature("998028")]).length, 0);
assert.equal(rtssRoadsFromFeatures([rtssFeature("00010", highwayFixture.coordinates, { cod_sous_r: "C" })]).length, 0);
assert.equal(resolveNumberedStreets([highwayFixture], []).generiquesResolus, 0);
assert.equal(resolveNumberedStreets([{ ...highwayFixture, rue: "autoroute Bonaventure" }], rtssRoads).rues[0].rue, "autoroute 10");
assert.equal(resolveNumberedStreets([{ ...highwayFixture, rue: "autoroute 15" }], rtssRoads).rues[0].rue, "autoroute 15");
assert.equal(resolveNumberedStreets([{ ...highwayFixture, rue: "autoroute 15-20" }], rtssRoads).rues[0].rue, "autoroute 15-20");
assert.equal(resolveNumberedStreets([{ ...highwayFixture, rue: "autoroute 15" }], rtssRoads).autoroutesNormalisees, 0);
const groupedHighways = createPotholeRankings(numbered.rues, { firstRepair: "2016-01-01", lastRepair: "2025-05-20", latestYear: 2025 });
groupedHighways.addRepair({ ...rankingRepair, ...unnamedPoint }, 2025);
const groupedHighwayResult = groupedHighways.finish([{ ...rankingFixtures[0], ...unnamedPoint }], {});
assert.equal(groupedHighwayResult.ruesColmatages[0].rue, "autoroute 10");
assert.equal(groupedHighwayResult.ruesEmplacements[0].emplacements, 1);
assert.equal(groupedHighwayResult.couverture.colmatagesSansIdentification, 0);
console.log("PASS: RTSS matching uses public route numbers, multiple aligned samples and ambiguity rejection without altering named local streets or inventing route numbers");
const analysisCatalog = {
  signalements: [2017, 2025, 2026].map((annee) => ({ annee })),
  reparations: [{ premiereIntervention: "2016-12-01", derniereIntervention: "2025-05-20T12:00:00" }], rayonAppariementM: 25,
};
const analysisPositions = [
  rankingPosition("returning", ["2017-01-01", "2025-01-01", "2026-01-01"]),
  rankingPosition("unpatched", ["2025-03-01", "2025-04-01"]),
  rankingPosition("recent-patch", ["2025-05-01"]),
  { ...rankingPosition("ambiguous-district", ["2026-02-01"]), arrondissements: ["Verdun", "Anjou"] },
];
const analyses = createPotholeAnalyses(analysisCatalog);
for (const year of [2017, 2025, 2026]) analyses.addReports(analysisPositions.flatMap((position) => position.signalements)
  .filter((record) => Number(record[1].slice(0, 4)) === year).map((record) => ({ dateCreation: record[1] })), year);
analyses.addReports([{ dateCreation: "2026-03-01", nature: "Information" }, { dateCreation: "invalid" }], 2026);
const analysisResult = analyses.finish(analysisPositions, {
  returning: [["2025-02-01"]], "recent-patch": [["2025-05-20"]],
});
const allAnalysis = analysisResult.periodes.find((period) => period.id === "all");
const recentAnalysis = analysisResult.periodes.find((period) => period.id === "recent");
assert.deepEqual(allAnalysis.persistance.classes, [3, 0, 1, 0, 0]);
assert.deepEqual(recentAnalysis.persistance.classes, [3, 1, 0, 0, 0]);
assert.equal(allAnalysis.concentration.principaux, 1);
assert.equal(allAnalysis.concentration.principauxSignalements, 3);
assert.equal(allAnalysis.concentration.autresSignalements, 4);
assert.deepEqual(allAnalysis.retours, { observes: 1, revenus: 1, sansRetour: 0, suiviIncomplet: 1, moisSuivi: 12 });
assert.deepEqual(allAnalysis.sansColmatage.classes, [1, 0, 0, 0]);
assert.equal(allAnalysis.arrondissements.emplacementsExclus, 1);
assert.equal(allAnalysis.arrondissements.lignes.find((entry) => entry.nom === "Verdun").emplacements, 3);
assert.equal(allAnalysis.arrondissements.lignes.find((entry) => entry.nom === "Anjou").proportion, null);
assert.equal(allAnalysis.annuels.find((entry) => entry.annee === 2025).signalements, 4);
assert.equal(allAnalysis.annuels.find((entry) => entry.annee === 2026).signalements, 2);
assert.equal(allAnalysis.annuels.find((entry) => entry.annee === 2024).signalements, null);
assert.equal(analysisResult.couverture.datesInvalides, 1);
assert.equal(analysisPositions[0].signalements.length, 3);
const reportCountPositions = Array.from({ length: 11 }, (unused, index) => rankingPosition(`count-${index + 1}`,
  Array.from({ length: index + 1 }, (unused, day) => `2025-01-${String(day + 1).padStart(2, "0")}`)));
const reportCountAnalyses = createPotholeAnalyses(analysisCatalog);
reportCountAnalyses.addReports(reportCountPositions.flatMap((position) => position.signalements).map((record) => ({ dateCreation: record[1] })), 2025);
const reportCountGroups = reportCountAnalyses.finish(reportCountPositions, {}).periodes.find((period) => period.id === "all").sansColmatage;
assert.deepEqual(reportCountGroups.classes, [1, 1, 1, 7]);
assert.equal(reportCountGroups.emplacements, 10);
assert.equal(reportCountGroups.signalements, 65);
const fiveYearsPosition = rankingPosition("five-years", ["2017-01-01", "2022-01-01", "2023-01-01", "2024-01-01", "2025-01-01", "2026-01-01"]);
const fiveYearsAnalyses = createPotholeAnalyses({
  ...analysisCatalog, signalements: [2017, 2022, 2023, 2024, 2025, 2026].map((annee) => ({ annee })),
});
for (const record of fiveYearsPosition.signalements) fiveYearsAnalyses.addReports([{ dateCreation: record[1] }], Number(record[1].slice(0, 4)));
assert.deepEqual(fiveYearsAnalyses.finish([fiveYearsPosition], {}).periodes.find((period) => period.id === "all").persistance.classes, [0, 0, 0, 0, 1]);
console.log("PASS: chart analyses retain all available annual reports, five persistence groups, concentration, complete follow-up and explicit missing data");
const boroughBuilder = createBoroughProfiles(analysisCatalog);
for (const year of [2017, 2025, 2026]) boroughBuilder.addReports(analysisPositions.flatMap((position) => position.signalements
  .filter((record) => Number(record[1].slice(0, 4)) === year).map((record) => ({ dateCreation: record[1], arrondissementGeo: position.arrondissements.at(-1) }))), year);
boroughBuilder.addReports([{ dateCreation: "2026-02-01", arrondissementGeo: "Verdun" }, { dateCreation: "2026-02-01", arrondissementGeo: "Westmount" },
  { dateCreation: "2026-02-01", arrondissementGeo: "Verdun", nature: "Information" }], 2026);
const boroughResult = boroughBuilder.finish(analysisPositions, { returning: [["2025-02-01"]], "recent-patch": [["2025-05-20"]] },
  { ...analysisResult, origine: { indexModifieLe: "fixture" } }, () => ({ kind: "matched", street: { rue: "rue Test" } }));
assert.equal(boroughResult.index.arrondissements.length, 19);
assert.equal(boroughResult.index.signalementsNonAttribues[0].nombre, 1);
const verdunProfile = boroughResult.profiles.find((profile) => profile.id === "verdun").periodes.find((period) => period.id === "all");
assert.equal(verdunProfile.indicateurs.signalements, 7);
assert.equal(verdunProfile.indicateurs.emplacements, 3);
assert.equal(verdunProfile.indicateurs.sansPosition, 1);
assert.equal(verdunProfile.indicateurs.persistants, 1);
assert.equal(verdunProfile.indicateurs.retours, 1);
assert.equal(verdunProfile.rues[0].emplacements, 3);
assert.equal(verdunProfile.emplacements.filter((entry) => entry.sansColmatage).length, 1);
assert.equal(verdunProfile.emplacements.filter((entry) => entry.retour12Mois === true).length, 1);
assert.equal(verdunProfile.comparaison.local.emplacements, 3);
assert.equal(verdunProfile.comparaison.reste.emplacements, 0);
const anjouProfile = boroughResult.profiles.find((profile) => profile.id === "anjou").periodes.find((period) => period.id === "all");
assert.equal(anjouProfile.indicateurs.signalements, 1);
assert.equal(anjouProfile.indicateurs.emplacements, 0);
assert.deepEqual(anjouProfile.emplacements, []);
assert.equal(analysisPositions[0].signalements.length, 3);
console.log("PASS: borough profiles retain unmapped requests, exclude ambiguous locations, reconcile recurrences and compare with the rest of Montreal");
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
const reportsByBoroughYear = new Map();
for (const entry of index.signalements) {
  const snapshot = readSnapshot(entry.fichier);
  for (const report of snapshot.signalements) {
    if (report.etat === "information" || report.nature === "Information" || !Number.isFinite(Date.parse(report.dateCreation))) continue;
    const name = analysisDistrict([report.arrondissementGeo || report.arrondissement || ""]);
    if (name) {
      const key = `${name}|${entry.annee}`;
      reportsByBoroughYear.set(key, (reportsByBoroughYear.get(key) || 0) + 1);
    }
  }
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
assert.equal(rankings.schemaVersion, 2);
assert.equal(rankings.couverture.derniereAnnee, latestRepairYear);
assert.equal(rankings.couverture.colmatagesBruts, totalRepairs);
assert.equal(["doublonsColmatages", "colmatagesAttribues", "colmatagesAmbigus", "colmatagesHorsRue", "colmatagesInvalides", "colmatagesSansIdentification"]
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
  assert.ok(rankings[key].every((row) => !isGenericStreetName(row.rue)));
}
assert.equal(rankings.identificationRues.generiquesResolus + rankings.identificationRues.generiquesNonResolus, rankings.identificationRues.generiques);
assert.ok(rankings.identificationRues.generiquesResolus > 0);
assert.ok(rankings.rtss.empreinte && rankings.rtss.troncons > 0);
assert.ok(rankings.couverture.emplacementsSansIdentification <= rankings.couverture.emplacementsNonAttribues);
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
const analysisSnapshot = readSnapshot("analyses.json");
assert.equal(analysisSnapshot.schemaVersion, 4);
assert.equal(analysisSnapshot.couverture.signalements, realStatistics.totalReports);
assert.deepEqual(analysisSnapshot.origine, mapSnapshot.origine);
assert.equal(analysisSnapshot.couverture.rayonAppariementM, mapSnapshot.rayonAppariementM);
assert.deepEqual(analysisSnapshot.periodes.map((period) => period.id), ["recent", "all"]);
for (const period of analysisSnapshot.periodes) {
  const start = period.debut.slice(0, 10);
  const end = period.fin.slice(0, 19);
  const positions = mapSnapshot.positions.map((position) => ({
    id: position.positionId,
    dates: position.signalements.map((record) => record[1]).filter((date) => date >= start && date <= end),
  })).filter((position) => position.dates.length);
  assert.equal(period.persistance.emplacements, positions.length);
  assert.equal(period.persistance.signalements, positions.reduce((sum, position) => sum + position.dates.length, 0));
  assert.deepEqual(period.persistance.classes, [1, 2, 3, 4, 5].map((years) => positions.filter((position) =>
    Math.min(5, new Set(position.dates.map((date) => date.slice(0, 4))).size) === years).length));
  assert.equal(period.concentration.principaux, Math.ceil(positions.length / 10));
  assert.equal(period.concentration.principauxSignalements, positions.map((position) => position.dates.length)
    .sort((left, right) => right - left).slice(0, period.concentration.principaux).reduce((sum, count) => sum + count, 0));
  assert.equal(period.concentration.principauxSignalements + period.concentration.autresSignalements, period.persistance.signalements);
  assert.equal(period.retours.revenus + period.retours.sansRetour, period.retours.observes);
  assert.ok(period.retours.observes + period.retours.suiviIncomplet <= positions.length);
  assert.equal(period.sansColmatage.classes.reduce((sum, count) => sum + count, 0), period.sansColmatage.emplacements);
  assert.equal(period.sansColmatage.classes.length, 4);
  assert.equal(period.arrondissements.lignes.reduce((sum, row) => sum + row.emplacements, 0) + period.arrondissements.emplacementsExclus, positions.length);
  assert.ok(period.arrondissements.lignes.every((row) => row.proportion === (row.emplacements ? row.recurrents / row.emplacements : null)));
  assert.equal(period.annuels.at(-1).signalements, realStatistics.latestReports.reportCount);
  for (const annual of period.annuels) assert.equal(annual.signalements, realStatistics.reports.find((entry) => entry.annee === annual.annee)?.reportCount ?? null);
}
console.log("PASS: published analyses reconcile with raw location histories, annual reports and district denominators");
const boroughIndex = readSnapshot("arrondissements.json");
assert.equal(boroughIndex.schemaVersion, 1);
assert.equal(boroughIndex.arrondissements.length, 19);
assert.deepEqual(boroughIndex.origine, analysisSnapshot.origine);
const boroughProfiles = new Map();
const positionsById = new Map(mapSnapshot.positions.map((position) => [position.positionId, position]));
for (const descriptor of boroughIndex.arrondissements) {
  const profile = readSnapshot(descriptor.fichier);
  boroughProfiles.set(descriptor.id, profile);
  assert.equal(profile.id, descriptor.id);
  assert.equal(profile.version, descriptor.version);
  assert.deepEqual(profile.origine, boroughIndex.origine);
  for (const period of profile.periodes) {
    const city = analysisSnapshot.periodes.find((entry) => entry.id === period.id);
    const local = city.arrondissements.lignes.find((entry) => entry.nom === profile.nom);
    const rest = city.arrondissements.lignes.filter((entry) => entry.nom !== profile.nom);
    for (const entry of period.annuels) assert.equal(entry.signalements, reportsByBoroughYear.get(`${profile.nom}|${entry.annee}`) || 0);
    assert.equal(period.indicateurs.signalements, period.annuels.reduce((sum, entry) => sum + entry.signalements, 0));
    assert.equal(period.indicateurs.emplacements, local.emplacements);
    assert.equal(period.indicateurs.persistants, local.recurrents);
    assert.equal(period.indicateurs.retours, period.emplacements.filter((entry) => entry.retour12Mois === true).length);
    assert.equal(period.indicateurs.emplacements, period.emplacements.length);
    assert.equal(new Set(period.emplacements.map((entry) => entry.positionId)).size, period.emplacements.length);
    assert.equal(period.emplacements.reduce((sum, entry) => sum + entry.signalements, 0) + period.indicateurs.sansPosition, period.indicateurs.signalements);
    assert.equal(period.sansColmatage.emplacements, period.emplacements.filter((entry) => entry.sansColmatage).length);
    assert.equal(period.rues.reduce((sum, entry) => sum + entry.emplacements, 0) + period.emplacementsSansRue, period.indicateurs.emplacements);
    assert.ok(period.rues.every((entry) => !isGenericStreetName(entry.rue)));
    assert.equal(period.comparaison.reste.emplacements, rest.reduce((sum, entry) => sum + entry.emplacements, 0));
    assert.equal(period.comparaison.reste.recurrents, rest.reduce((sum, entry) => sum + entry.recurrents, 0));
    for (const entry of period.emplacements) {
      const source = positionsById.get(entry.positionId);
      assert.equal(analysisDistrict(source.arrondissements), profile.nom);
      assert.equal(entry.latitude, source.latitude);
      assert.equal(entry.longitude, source.longitude);
      assert.equal(entry.colmatages, (repairHistory.positions[entry.positionId] || []).length);
      assert.ok(entry.premierSignalement >= period.debut && entry.dernierSignalement <= period.fin);
      if (entry.sansColmatage) assert.ok(entry.colmatages === 0 && entry.signalementsComparables >= 2);
    }
  }
}
const assignedReports = [...boroughProfiles.values()].reduce((total, profile) => total + profile.periodes.find((period) => period.id === "all").indicateurs.signalements, 0);
assert.equal(assignedReports + boroughIndex.signalementsNonAttribues.reduce((sum, entry) => sum + entry.nombre, 0), realStatistics.totalReports);
console.log("PASS: all 19 borough profiles reconcile with source reports, map locations, patching histories and city comparison denominators");

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
          genericStreet: [...document.querySelectorAll("[data-ranking^=rues] tbody .pothole-ranking-place")]
            .some((element) => /non[-\s]+nomm/i.test(element.textContent)),
          rtssMethod: document.querySelector("#rankingsRtss").textContent,
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
        assert.equal(layout.genericStreet, false, `${language} ${width}: generic street grouping`);
        assert.ok(layout.rtssMethod.includes("MTMD") && !layout.rtssMethod.includes("{"));
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
    for (const language of ["fr", "en"]) {
      await page.goto(`http://localhost:5500/${language}/potholes.html?mode=statistics`);
      await ready();
      assert.equal(await page.locator("[data-table-controls]").count(), 12);
      const reports = page.locator('[data-table-controls="reports"]');
      const years = await reports.locator("tbody th").allTextContents();
      const yearSort = reports.locator('[data-sort-column="0"]');
      for (const [sort, expected] of [["ascending", [...years].sort()], ["descending", [...years].sort().reverse()], ["none", years]]) {
        await yearSort.click();
        assert.equal(await yearSort.locator("..").getAttribute("aria-sort"), sort);
        assert.deepEqual(await reports.locator("tbody th").allTextContents(), expected);
      }
      await reports.locator('[data-filter-column="0"]').selectOption(years[0]);
      assert.equal(await reports.locator("tbody tr").count(), 1);
      const machines = page.locator('[data-table-controls="machines"]');
      const machineName = await machines.locator("tbody th").first().textContent();
      await machines.locator('[data-sort-column="1"]').click();
      const counts = (await machines.locator("tbody td:first-of-type").allTextContents()).map((value) => Number(value.replace(/\D/g, "")));
      assert.deepEqual(counts, [...counts].sort((left, right) => left - right));
      await machines.locator('[data-filter-column="0"]').selectOption(machineName);
      assert.equal(await machines.locator("tbody tr").count(), 1);
      const machineYear = await machines.locator("tbody td:last-child").textContent();
      const differentYear = await machines.locator('[data-filter-column="2"] option').evaluateAll((options, year) => options.find((option) => option.value && option.value !== year)?.value, machineYear);
      if (differentYear) {
        await machines.locator('[data-filter-column="2"]').selectOption(differentYear);
        assert.equal(await machines.locator("tbody td[colspan]").count(), 1);
        await machines.locator('[data-filter-column="2"]').selectOption("");
      }
      await page.locator("#languageToggle").click();
      assert.equal(await reports.locator("tbody th").textContent(), years[0]);
      assert.equal(await machines.locator("tbody th").textContent(), machineName);
      await reports.locator('[data-filter-column="0"]').selectOption("");
      await machines.locator('[data-filter-column="0"]').selectOption("");
      assert.equal(await reports.locator("tbody tr").count(), years.length);
    }
    console.log("PASS: overview tables support numeric and three-state year sorting, combined value filters, empty results, reset and FR/EN selection retention");
    const statisticsRoute = "**/data/nids-de-poule/statistiques.json";
    for (const kind of ["missing", "stale", "legacy"]) {
      const outdated = structuredClone(annualStatistics);
      if (kind === "missing") delete outdated.classements;
      else if (kind === "stale") outdated.origine.reparations[0][1] = "2000-01-01T00:00:00Z";
      else outdated.classements.schemaVersion = 1;
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
    await context.unroute(statisticsRoute);
    const chartRequests = [];
    page.on("request", (request) => {
      if (/analyses\.json|chart\.umd/.test(request.url())) chartRequests.push(request.url());
    });
    await page.goto("http://localhost:5500/fr/potholes.html?mode=statistics");
    await ready();
    assert.deepEqual(chartRequests, []);
    const chartReady = async (key = "trend") => {
      await page.locator(`[data-analysis=${key}] .pothole-analysis-plot`).scrollIntoViewIfNeeded();
      await page.waitForFunction((key) => Boolean(window.Chart?.getChart(document.querySelector(`[data-analysis=${key}] canvas`))), key, { polling: 100, timeout: 30000 });
    };
    const diagramKeys = ["trend", "persistence", "unpatched", "returns", "concentration", "districts"];
    await page.locator("[data-statistics-tab=charts]").click();
    await chartReady();
    assert.match(page.url(), /tab=charts/);
    assert.deepEqual(await page.locator(".pothole-analysis").evaluateAll((articles) => articles.map((article) => article.dataset.analysis)), diagramKeys);
    assert.equal(await page.locator("#statisticsSummary").isVisible(), false);
    assert.ok(await page.locator("#statisticsNav").evaluate((nav) => Boolean(nav.compareDocumentPosition(document.querySelector("#chartsHeading")) & Node.DOCUMENT_POSITION_FOLLOWING)));
    const animated = await page.evaluate(() => window.Chart.getChart(document.querySelector("[data-analysis=trend] canvas")).options.animation.duration);
    assert.ok(animated > 0);
    for (const key of diagramKeys) {
      await page.locator(`[data-analysis=${key}]`).scrollIntoViewIfNeeded();
      await chartReady(key);
    }
    await page.locator("#chartsPeriod").selectOption("all");
    await page.waitForFunction(() => window.Chart.getChart(document.querySelector("[data-analysis=trend] canvas")).data.labels.length === 13, null, { polling: 100 });
    assert.equal(await page.locator("[data-analysis=trend] tbody tr").count(), 13);
    await page.goBack();
    assert.equal(await page.locator("#statisticsSummary").isVisible(), true);
    assert.equal(await page.locator("#chartsControls").isVisible(), false);
    assert.equal(await page.evaluate(() => Object.keys(window.Chart.instances).length), 0);
    await page.goForward();
    await chartReady();
    assert.equal(await page.locator("#chartsPeriod").inputValue(), "all");
    await page.locator("#languageToggle").click();
    assert.match(page.url(), /\/en\/.*tab=charts/);
    assert.equal(await page.locator("[data-statistics-tab=charts]").textContent(), "Charts");
    await page.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, value: true }); document.dispatchEvent(new Event("visibilitychange")); });
    assert.equal(await page.evaluate(() => Object.keys(window.Chart.instances).length), 0);
    await page.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, value: false }); document.dispatchEvent(new Event("visibilitychange")); });
    await chartReady();
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const language of ["fr", "en"]) {
      await page.goto(`http://localhost:5500/${language}/potholes.html?mode=statistics&tab=charts`);
      await chartReady();
      assert.ok((await page.locator(".pothole-analysis-values summary").allTextContents())
        .every((label) => label === (language === "fr" ? "Informations complémentaires" : "Additional information")));
      await page.locator("#chartsPeriod").selectOption("all");
      for (const width of [1440, 768, 320]) {
        await page.setViewportSize({ width, height: width === 320 ? 568 : 960 });
        for (const key of diagramKeys) {
          const article = page.locator(`[data-analysis=${key}]`);
          await article.scrollIntoViewIfNeeded();
          await chartReady(key);
          await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
          const picture = await article.evaluate((article) => {
            const canvas = article.querySelector("canvas");
            const chart = window.Chart.getChart(canvas);
            let polarSectorLabels = null;
            let polarOuterLabels = null;
            if (article.dataset.analysis === "unpatched") {
              const original = chart.ctx.fillText;
              polarSectorLabels = [];
              chart.ctx.fillText = function(value, ...args) {
                polarSectorLabels.push(String(value));
                return original.call(this, value, ...args);
              };
              try { chart.config.plugins.find((plugin) => plugin.id === "returnShareLabels").afterDatasetsDraw(chart); }
              finally { chart.ctx.fillText = original; }
              chart.draw();
              const canvasBounds = canvas.getBoundingClientRect();
              const articleBounds = article.getBoundingClientRect();
              polarOuterLabels = [...article.querySelectorAll(".pothole-polar-outer-label")].filter((label) => !label.hidden).map((label) => {
                const bounds = label.getBoundingClientRect();
                return {
                  value: label.textContent.replace(/\D/g, ""), expected: String(chart.scales.r.max),
                  centered: Math.abs((bounds.left + bounds.right) / 2 - canvasBounds.left - chart.scales.r.xCenter) < 1
                    && Math.abs((bounds.top + bounds.bottom) / 2 - canvasBounds.top - chart.scales.r.yCenter + chart.scales.r.drawingArea) < 1,
                  unclipped: bounds.left >= articleBounds.left && bounds.right <= articleBounds.right
                    && bounds.top >= articleBounds.top && bounds.bottom <= articleBounds.bottom
                    && getComputedStyle(article.querySelector(".pothole-analysis-viewport")).overflow === "visible",
                };
              });
            }
            let districtPercentages = null;
            if (article.dataset.analysis === "districts") {
              const context = chart.ctx;
              const original = context.fillText;
              const drawn = [];
              context.fillText = function(value, horizontal, vertical, ...rest) {
                drawn.push({ value: String(value), horizontal, vertical, width: this.measureText(String(value)).width });
                return original.call(this, value, horizontal, vertical, ...rest);
              };
              try { chart.draw(); } finally { context.fillText = original; }
              const percentages = chart.getDatasetMeta(0).data.flatMap((bar, index) => {
                if (!Number.isFinite(chart.data.datasets[0].data[index])) return [];
                return [drawn.find((item) => Math.abs(item.horizontal - bar.x) < 0.1 && Math.abs(item.vertical - (bar.y - 5)) < 0.1 && item.value.includes("%"))];
              });
              districtPercentages = {
                count: percentages.filter(Boolean).length,
                expected: chart.data.datasets[0].data.filter(Number.isFinite).length,
                overlap: percentages.some((item, index) => index > 0 && item && percentages[index - 1]
                  && Math.abs(item.vertical - percentages[index - 1].vertical) < 13
                  && item.horizontal - item.width / 2 < percentages[index - 1].horizontal + percentages[index - 1].width / 2 + 2),
              };
            }
            const pixels = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
            let colored = 0;
            for (let index = 0; index < pixels.length; index += 16) {
              if (pixels[index + 3] > 100 && Math.max(pixels[index], pixels[index + 1], pixels[index + 2]) - Math.min(pixels[index], pixels[index + 1], pixels[index + 2]) > 30) colored += 1;
            }
            const bounds = article.querySelector(".pothole-analysis-viewport").getBoundingClientRect();
            const dock = document.querySelector("#statisticsDock").getBoundingClientRect();
            const contentBounds = document.querySelector("#potholeContent").getBoundingClientRect();
            const nav = document.querySelector("#statisticsNav").getBoundingClientRect();
            const controls = document.querySelector("#chartsControls").getBoundingClientRect();
            const parent = document.querySelector("#statisticsView").getBoundingClientRect();
            const labels = article.dataset.analysis === "trend" ? chart.scales.x.getLabelItems().map((item) => {
              chart.ctx.font = item.font.string;
              const width = chart.ctx.measureText(String(item.label)).width;
              return { left: item.options.translation[0] - width / 2, right: item.options.translation[0] + width / 2 };
            }) : [];
            return {
              colored, left: bounds.left, right: bounds.right, width: chart.width, height: chart.height,
              noAnimation: chart.options.animation === false,
              accessible: Boolean(canvas.getAttribute("aria-label") && article.querySelector("tbody tr")),
              untranslated: /potholes\.chart|\{[a-z]+\}/i.test(article.textContent),
              overflow: document.documentElement.scrollWidth > innerWidth || document.querySelector("#potholeContent").scrollWidth > document.querySelector("#potholeContent").clientWidth,
              overlappingYears: labels.slice(1).some((item, index) => item.left < labels[index].right + 2),
              centeredControls: Math.abs((nav.left + nav.right) - (parent.left + parent.right)) < 2
                && Math.abs((controls.left + controls.right) - (parent.left + parent.right)) < 2 && controls.top >= nav.bottom,
              compactNav: nav.width <= parent.width,
              stickyDock: Math.abs(dock.top - contentBounds.top) < 2 && dock.bottom < contentBounds.bottom,
              chartType: chart.config.type,
              polarSectorLabels,
              polarOuterLabels,
              districtPercentages,
              polarGroups: article.dataset.analysis === "unpatched" ? {
                count: chart.data.labels.length,
                colors: new Set(chart.data.datasets[0].backgroundColor).size,
                legend: chart.legend.legendItems.map((item) => item.text),
                radius: chart.scales.r.drawingArea,
                plotHeight: article.querySelector(".pothole-analysis-plot").getBoundingClientRect().height,
                legendPosition: chart.legend.position,
                canvasWidth: chart.width,
                diameterRatio: 2 * chart.scales.r.drawingArea / Math.min(chart.chartArea.width, chart.chartArea.height),
                outerCircle: chart.scales.r.max,
                largestGroup: Math.max(0, ...chart.data.datasets[0].data.filter(Number.isFinite)),
              } : null,
              distinctDistrictColors: article.dataset.analysis !== "districts" || new Set(chart.data.datasets[0].backgroundColor).size === chart.data.labels.length,
              districtAxis: article.dataset.analysis !== "districts" || chart.options.indexAxis === "x",
              valueColumns: article.querySelector("thead tr").cells.length,
              redundantDetailsHidden: !["persistence", "unpatched"].includes(article.dataset.analysis) || article.querySelector("details").classList.contains("is-accessible-only"),
            };
          });
          assert.ok(picture.colored > 50 && picture.width > 0 && picture.height > 0, `${language} ${width} ${key}: blank chart`);
          assert.ok(picture.left >= -1 && picture.right <= width + 1 && !picture.overflow, `${language} ${width} ${key}: overflow`);
          assert.equal(picture.accessible, true);
          assert.equal(picture.noAnimation, true);
          assert.equal(picture.untranslated, false);
          assert.equal(picture.overlappingYears, false, `${language} ${width}: overlapping year labels`);
          assert.equal(picture.centeredControls, true, `${language} ${width}: controls not centered`);
          assert.equal(picture.compactNav, true);
          assert.equal(picture.stickyDock, true, `${language} ${width}: sticky controls`);
          assert.equal(picture.chartType, key === "returns" ? "doughnut" : key === "unpatched" ? "polarArea" : "bar");
          if (key === "districts") {
            assert.equal(picture.districtPercentages.count, picture.districtPercentages.expected, `${language} ${width}: missing district percentages`);
            assert.equal(picture.districtPercentages.overlap, false, `${language} ${width}: overlapping district percentages`);
          }
          if (key === "unpatched") {
            assert.deepEqual(picture.polarSectorLabels, []);
            assert.equal(picture.polarOuterLabels.length, 1);
            assert.ok(picture.polarOuterLabels.every((label) => label.value === label.expected && label.centered && label.unclipped), `${language} ${width}: misplaced or clipped outer polar label`);
            assert.equal(picture.polarGroups.count, 4);
            assert.equal(picture.polarGroups.colors, 4);
            assert.equal(picture.polarGroups.legend.length, 4);
            assert.equal(picture.polarGroups.plotHeight, 300);
            assert.ok(picture.polarGroups.radius >= (picture.polarGroups.canvasWidth >= 600 ? 130 : 100), `${language} ${width}: polar chart too small`);
            assert.ok(Math.abs(picture.polarGroups.diameterRatio - 1) < 0.001);
            assert.equal(picture.polarGroups.outerCircle, (Math.floor(picture.polarGroups.largestGroup / 250) + 1) * 250);
            assert.equal(picture.polarGroups.legendPosition, picture.polarGroups.canvasWidth >= 600 ? "right" : "bottom");
          }
          assert.equal(picture.distinctDistrictColors, true);
          assert.equal(picture.districtAxis, true);
          assert.equal(picture.redundantDetailsHidden, true);
          if (key === "trend") assert.equal(picture.valueColumns, 3);
          if (key === "concentration") assert.equal(picture.valueColumns, 5);
        }
        const pairs = await page.evaluate(() => [...document.querySelectorAll(".pothole-analysis")].map((element) => {
          const bounds = element.getBoundingClientRect();
          const plot = element.querySelector(".pothole-analysis-plot").getBoundingClientRect();
          return { top: bounds.top, left: bounds.left, width: bounds.width, plotTop: plot.top };
        }));
        for (let index = 0; index < pairs.length; index += 2) {
          const left = pairs[index];
          const right = pairs[index + 1];
          if (width > 1000) assert.ok(Math.abs(left.top - right.top) < 1 && Math.abs(left.plotTop - right.plotTop) < 1 && right.left > left.left);
          else assert.ok(right.top > left.top && Math.abs(right.left - left.left) < 1);
        }
        assert.equal(await page.locator("[data-analysis=persistence] tbody tr").count(), 5);
        const header = await page.evaluate(() => {
          const label = document.querySelector("#chartsControls label > span").getBoundingClientRect();
          const select = document.querySelector("#chartsPeriod").getBoundingClientRect();
          const dates = document.querySelector("#chartsDataUpdates").getBoundingClientRect();
          const content = document.querySelector("#potholeContent").getBoundingClientRect();
          const dock = getComputedStyle(document.querySelector("#statisticsDock"));
          return {
            sameLine: Math.abs((label.top + label.bottom) - (select.top + select.bottom)) < 2,
            datesVisible: dates.top >= content.top && dates.bottom <= content.bottom,
            height: document.querySelector("#statisticsDock").getBoundingClientRect().height,
            balancedPadding: dock.paddingTop === dock.paddingBottom && getComputedStyle(document.querySelector("#potholeContent")).paddingTop === "0px",
            repeatedSources: document.querySelectorAll(".pothole-analysis-source").length,
            oldUpdatedLine: Boolean(document.querySelector("#chartsUpdated")),
            sources: document.querySelector("#chartsSources").textContent,
          };
        });
        assert.ok(header.sameLine && header.datesVisible && header.height < 140);
        assert.equal(header.balancedPadding, true);
        assert.equal(header.repeatedSources, 0);
        assert.equal(header.oldUpdatedLine, false);
        assert.ok(header.sources.includes("311"));
        const scrollBefore = await page.locator("#potholeContent").evaluate((element) => element.scrollTop);
        const selectBounds = await page.locator("#chartsPeriod").boundingBox();
        await page.mouse.click(selectBounds.x + selectBounds.width / 2, selectBounds.y + selectBounds.height / 2);
        assert.ok(Math.abs(await page.locator("#potholeContent").evaluate((element) => element.scrollTop) - scrollBefore) <= 1);
        await page.keyboard.press("Escape");
        await page.locator("#chartsPeriod").selectOption("recent");
        await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        assert.ok(Math.abs(await page.locator("#potholeContent").evaluate((element) => element.scrollTop) - scrollBefore) <= 1);
        await page.locator("#chartsPeriod").selectOption("all");
      }
    }
    const analysisRoute = "**/data/nids-de-poule/analyses.json";
    await page.clock.install();
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.goto("http://localhost:5500/fr/potholes.html?mode=statistics&tab=charts");
    await chartReady();
    const changed = structuredClone(analysisSnapshot);
    changed.version += "-refresh-test";
    changed.periodes[0].annuels.at(-1).signalements += 1;
    await context.route(analysisRoute, (route) => route.fulfill({ json: changed }));
    await page.clock.runFor(60001);
    await page.waitForFunction((version) => document.querySelector("#statisticsCharts").dataset.analysisVersion === version, changed.version, { polling: 100 });
    assert.equal(await page.evaluate(() => window.Chart.getChart(document.querySelector("[data-analysis=trend] canvas")).data.datasets[0].data.at(-1)), changed.periodes[0].annuels.at(-1).signalements);
    await context.unroute(analysisRoute);
    await context.route(analysisRoute, (route) => route.abort());
    await page.clock.runFor(60001);
    await page.waitForFunction(() => !document.querySelector("#chartsRetry").hidden, null, { polling: 100 });
    assert.equal(await page.locator(".pothole-analysis").count(), 6);
    assert.equal(await page.locator("#statisticsCharts").getAttribute("data-analysis-version"), changed.version);
    await context.unroute(analysisRoute);
    await page.locator("#chartsRetry").click();
    await page.waitForFunction((version) => document.querySelector("#statisticsCharts").dataset.analysisVersion === version, analysisSnapshot.version, { polling: 100 });
    await page.locator("[data-statistics-tab=summary]").click();
    const requestsBefore = chartRequests.length;
    await page.clock.runFor(120001);
    assert.equal(chartRequests.length, requestsBefore);
    const staleAnalysis = structuredClone(analysisSnapshot);
    staleAnalysis.origine.reparations[0][1] = "stale";
    await context.route(analysisRoute, (route) => route.fulfill({ json: staleAnalysis }));
    await page.goto("http://localhost:5500/fr/potholes.html?mode=statistics&tab=charts");
    await page.waitForFunction(() => !document.querySelector("#chartsRetry").hidden, null, { polling: 100 });
    assert.equal(await page.locator(".pothole-analysis").count(), 0);
    await context.unroute(analysisRoute);
    await page.locator("#chartsRetry").click();
    await chartReady();
    await context.route("**/chart.umd.min.js", (route) => route.abort());
    await page.goto("http://localhost:5500/fr/potholes.html?mode=statistics&tab=charts");
    await page.waitForFunction(() => document.querySelectorAll(".pothole-analysis").length === 6 && !document.querySelector("#chartsRetry").hidden, null, { polling: 100 });
    assert.equal(await page.locator(".pothole-analysis-values table").count(), 6);
    assert.equal(await page.locator(".pothole-analysis-values.is-accessible-only").count(), 0);
    await context.unroute("**/chart.umd.min.js");
    await page.locator("#chartsRetry").click();
    await chartReady();
    assert.deepEqual(heavyRequests, []);
    assert.deepEqual(browserErrors, []);
    console.log("PASS: six animated, accessible charts; FR/EN desktop/mobile pixels, tab history, periods, live refresh, retries, stale data, CDN failure and reduced motion");
    await page.close();
    const boroughPage = await context.newPage();
    await boroughPage.emulateMedia({ reducedMotion: "reduce" });
    const boroughErrors = [];
    const boroughRequests = [];
    const boroughHeavy = [];
    boroughPage.on("pageerror", (failure) => boroughErrors.push(failure.message));
    boroughPage.on("request", (request) => {
      if (/arrondissements(?:\/|\.json)/.test(request.url())) boroughRequests.push(request.url());
      if (/(?:reparations-\d|signalements-\d|carte\.json|historique-colmatages|tile\.openstreetmap)/.test(request.url())) boroughHeavy.push(request.url());
    });
    const boroughReady = (id) => boroughPage.waitForFunction((id) => document.querySelector("#statisticsBoroughs")?.dataset.borough === id
      && document.querySelector("#statisticsBoroughs").dataset.profileVersion && !document.querySelector("#boroughsContent").hidden, id, { polling: 100, timeout: 30000 });
    await boroughPage.goto("http://localhost:5500/fr/potholes.html?mode=statistics");
    await boroughPage.waitForFunction(() => document.querySelector("#statisticsReportRows")?.rows.length === 13, null, { polling: 100 });
    assert.deepEqual(boroughRequests, []);
    await boroughPage.locator("[data-statistics-tab=boroughs]").click();
    await boroughReady(boroughIndex.arrondissements[0].id);
    assert.equal(await boroughPage.locator("#boroughSelect").evaluate((select) => select.selectedIndex), 0);
    assert.equal(await boroughPage.locator("[data-statistics-tab=boroughs]").textContent(), "Par Arrondissements");
    await boroughPage.locator("#boroughSelect").selectOption("verdun");
    await boroughReady("verdun");
    assert.equal(await boroughPage.locator("#boroughSelect option").count(), 19);
    await boroughPage.locator("#boroughPeriod").selectOption("all");
    const allVerdun = boroughProfiles.get("verdun").periodes.find((entry) => entry.id === "all");
    assert.deepEqual((await boroughPage.locator("#boroughMetrics dd").allTextContents()).map((value) => Number(value.replace(/\D/g, ""))),
      [allVerdun.indicateurs.signalements, allVerdun.indicateurs.emplacements, allVerdun.indicateurs.persistants, allVerdun.indicateurs.retours]);
    await boroughPage.locator("#boroughStreetsTable button[data-sort=signalements]").click();
    const volumes = await boroughPage.locator("#boroughStreetsTable tbody tr td:first-of-type").allTextContents();
    assert.deepEqual(volumes.map((value) => Number(value.replace(/\D/g, ""))), [...allVerdun.rues].sort((left, right) => right.signalements - left.signalements).slice(0, 10).map((entry) => entry.signalements));
    const firstLocation = await boroughPage.locator("#boroughLocationsTable tbody tr").first().getAttribute("data-position-id");
    await boroughPage.locator("#locationsBoroughNext").click();
    assert.notEqual(await boroughPage.locator("#boroughLocationsTable tbody tr").first().getAttribute("data-position-id"), firstLocation);
    await boroughPage.locator("#locationsBoroughPrevious").click();
    assert.equal(await boroughPage.locator("#boroughLocationsTable tbody tr").first().getAttribute("data-position-id"), firstLocation);
    await boroughPage.locator("#boroughLocationFilter").selectOption("unpatched");
    const unmatchedIds = await boroughPage.locator("#boroughLocationsTable tbody tr").evaluateAll((rows) => rows.map((row) => row.dataset.positionId));
    assert.ok(unmatchedIds.every((id) => allVerdun.emplacements.find((entry) => entry.positionId === id)?.sansColmatage));
    await boroughPage.locator("#boroughSearch").fill("no-such-local-street-xyz");
    assert.equal(await boroughPage.locator("#boroughLocationsTable tbody td[colspan]").count(), 1);
    assert.equal(await boroughPage.locator("#boroughStreetsTable tbody td[colspan]").count(), 1);
    await boroughPage.locator("#boroughSearch").fill("");
    await boroughPage.locator("[data-statistics-tab=charts]").click();
    assert.equal(await boroughPage.locator("#boroughsControls").isVisible(), false);
    await boroughPage.goBack();
    await boroughReady("verdun");
    assert.equal(await boroughPage.locator("#boroughPeriod").inputValue(), "all");
    await boroughPage.locator("#languageToggle").click();
    assert.equal(await boroughPage.locator("[data-statistics-tab=boroughs]").textContent(), "Boroughs");
    assert.match(boroughPage.url(), /\/en\/.*borough=verdun.*period=all/);
    for (const language of ["fr", "en"]) {
      await boroughPage.goto(`http://localhost:5500/${language}/potholes.html?mode=statistics&tab=boroughs&borough=verdun&period=recent`);
      await boroughReady("verdun");
      for (const width of [1440, 768, 320]) {
        await boroughPage.setViewportSize({ width, height: width === 320 ? 568 : 960 });
        for (const key of ["trend", "persistence", "returns", "comparison"]) {
          await boroughPage.locator(`[data-borough-chart=${key}]`).scrollIntoViewIfNeeded();
          await boroughPage.waitForFunction((key) => window.Chart?.getChart(document.querySelector(`[data-borough-chart=${key}] canvas`)), key, { polling: 100 });
          await boroughPage.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
          const diagram = await boroughPage.locator(`[data-borough-chart=${key}]`).evaluate((plot) => {
            const canvas = plot.querySelector("canvas");
            const chart = window.Chart.getChart(canvas);
            const pixels = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
            let colored = 0;
            for (let offset = 0; offset < pixels.length; offset += 16) {
              if (pixels[offset + 3] > 100 && Math.max(pixels[offset], pixels[offset + 1], pixels[offset + 2]) - Math.min(pixels[offset], pixels[offset + 1], pixels[offset + 2]) > 30) colored += 1;
            }
            return { colored, type: chart.config.type, accessible: Boolean(canvas.getAttribute("aria-label")), reducedMotion: chart.options.animation === false };
          });
          assert.ok(diagram.colored > 40 && diagram.accessible && diagram.reducedMotion, `${language} ${width}: borough chart ${key}`);
          assert.equal(diagram.type, key === "returns" ? "doughnut" : "bar");
          const details = await boroughPage.locator(`[data-borough-analysis=${key}] details`).evaluate((element) => ({
            redundant: element.classList.contains("is-accessible-only"), open: element.open,
            clipped: getComputedStyle(element).clipPath !== "none", rows: element.querySelector("tbody").rows.length,
            summaryTab: element.querySelector("summary").tabIndex, tableTab: element.querySelector(".pothole-analysis-table-wrap").tabIndex,
          }));
          const redundant = key === "trend" || key === "persistence";
          assert.equal(details.redundant, redundant);
          assert.ok(details.rows > 0);
          if (redundant) assert.ok(details.open && details.clipped && details.summaryTab === -1 && details.tableTab === -1);
        }
        const layout = await boroughPage.evaluate(() => {
          const content = document.querySelector("#potholeContent");
          const dock = document.querySelector("#statisticsDock").getBoundingClientRect();
          const bounds = content.getBoundingClientRect();
          return { overflow: document.documentElement.scrollWidth > innerWidth || content.scrollWidth > content.clientWidth,
            controls: document.querySelector("#boroughsControls").getBoundingClientRect().bottom <= bounds.bottom,
            sticky: Math.abs(dock.top - bounds.top) < 1,
            untranslated: /potholes\.[a-z]|\{(?:name|count|total|first|last)\}/i.test(document.querySelector("#statisticsBoroughs").innerText) };
        });
        assert.ok(!layout.overflow && layout.controls && layout.sticky && !layout.untranslated, `${language} ${width}: ${JSON.stringify(layout)}`);
      }
    }
    await context.route("**/chart.umd.min.js", (route) => route.abort());
    await boroughPage.goto("http://localhost:5500/fr/potholes.html?mode=statistics&tab=boroughs&borough=verdun");
    await boroughReady("verdun");
    await boroughPage.waitForFunction(() => !document.querySelector("#boroughsRetry").hidden, null, { polling: 100 });
    assert.equal(await boroughPage.locator(".pothole-borough-chart-details:not(.is-accessible-only)").count(), 4);
    await context.unroute("**/chart.umd.min.js");
    await boroughPage.locator("#boroughsRetry").click();
    await boroughPage.waitForFunction(() => document.querySelector("#boroughsRetry").hidden, null, { polling: 100 });
    assert.deepEqual(await boroughPage.locator(".pothole-borough-chart-details:not(.is-accessible-only)").evaluateAll((details) =>
      details.map((element) => element.closest("article").dataset.boroughAnalysis)), ["returns", "comparison"]);
    const profileRoute = "**/data/nids-de-poule/arrondissements/anjou.json";
    const staleProfile = structuredClone(boroughProfiles.get("anjou"));
    staleProfile.version = "obsolete";
    await context.route(profileRoute, (route) => route.fulfill({ json: staleProfile }));
    await boroughPage.locator("#boroughSelect").selectOption("anjou");
    await boroughPage.waitForFunction(() => !document.querySelector("#boroughsRetry").hidden, null, { polling: 100 });
    assert.equal(await boroughPage.locator("#boroughsContent").isVisible(), false);
    await context.unroute(profileRoute);
    await boroughPage.locator("#boroughsRetry").click();
    await boroughReady("anjou");
    await boroughPage.locator("#boroughSelect").selectOption("verdun");
    await boroughReady("verdun");
    await boroughPage.clock.install();
    const changedProfile = structuredClone(boroughProfiles.get("verdun"));
    changedProfile.version += "-refresh";
    changedProfile.periodes[0].indicateurs.signalements += 1;
    changedProfile.periodes[0].indicateurs.sansPosition += 1;
    changedProfile.periodes[0].annuels.at(-1).signalements += 1;
    const changedIndex = structuredClone(boroughIndex);
    changedIndex.version += "-refresh";
    changedIndex.arrondissements.find((entry) => entry.id === "verdun").version = changedProfile.version;
    await context.route("**/data/nids-de-poule/arrondissements.json", (route) => route.fulfill({ json: changedIndex }));
    await context.route("**/data/nids-de-poule/arrondissements/verdun.json", (route) => route.fulfill({ json: changedProfile }));
    await boroughPage.clock.runFor(60001);
    await boroughPage.waitForFunction((version) => document.querySelector("#statisticsBoroughs").dataset.profileVersion === version, changedProfile.version, { polling: 100 });
    await context.unroute("**/data/nids-de-poule/arrondissements.json");
    await context.unroute("**/data/nids-de-poule/arrondissements/verdun.json");
    await boroughPage.locator("[data-statistics-tab=summary]").click();
    const boroughCountBefore = boroughRequests.length;
    await boroughPage.clock.runFor(120001);
    assert.equal(boroughRequests.length, boroughCountBefore);
    assert.deepEqual(boroughHeavy, []);
    assert.deepEqual(boroughErrors, []);
    await boroughPage.locator("[data-statistics-tab=boroughs]").click();
    await boroughReady("verdun");
    const mapLink = boroughPage.locator("#boroughLocationsTable tbody a").first();
    const target = new URL(await mapLink.getAttribute("href"));
    assert.equal(target.searchParams.get("mode"), null);
    assert.equal(target.searchParams.get("tab"), null);
    assert.ok(target.searchParams.get("mapView").endsWith(",18") && target.searchParams.get("location"));
    await mapLink.click();
    await boroughPage.waitForFunction(() => document.querySelector("#map")?.classList.contains("leaflet-container") && document.querySelector("#allYears")?.checked, null, { polling: 100, timeout: 30000 });
    assert.equal(await boroughPage.locator("#potholeModeNav [aria-current=page]").getAttribute("data-pothole-mode"), "reports");
    console.log("PASS: borough profiles, independent filters, sorting, search, pagination, FR/EN responsive chart pixels, history, refresh, stale-data retry and real map links");
    await boroughPage.close();
    const mobilePage = await context.newPage();
    await mobilePage.emulateMedia({ reducedMotion: "reduce" });
    const mobileErrors = [];
    mobilePage.on("pageerror", (error) => mobileErrors.push(error.message));
    for (const language of ["fr", "en"]) {
      await mobilePage.setViewportSize({ width: 375, height: 812 });
      for (const mode of ["reports", "repairs"]) {
        await mobilePage.goto(`http://localhost:5500/${language}/potholes.html?mode=${mode}`);
        await mobilePage.waitForFunction(() => document.querySelector("#map")?.classList.contains("leaflet-container"), null, { polling: 100 });
        const input = mobilePage.locator(mode === "reports" ? "#reportState" : "#repairDevice");
        assert.equal(await mobilePage.locator("#mapFilters").evaluate((element) => element.open), false);
        assert.equal(await input.isVisible(), false);
        for (const width of [320, 375, 768]) {
          await mobilePage.setViewportSize({ width, height: 812 });
          await mobilePage.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
          const layout = await mobilePage.evaluate(() => ({
            tops: [...document.querySelectorAll("#potholeModeNav a")].map((element) => element.getBoundingClientRect().top),
            mapHeight: document.querySelector("#map").getBoundingClientRect().height,
            overflow: document.documentElement.scrollWidth > innerWidth,
          }));
          assert.equal(new Set(layout.tops).size, 1);
          assert.ok(layout.mapHeight > 590 && !layout.overflow, `${language} ${mode} ${width}: ${JSON.stringify(layout)}`);
        }
        const disclosure = mobilePage.locator("#mapFilters > summary");
        await disclosure.click();
        assert.equal(await input.isVisible(), true);
        await disclosure.focus();
        await mobilePage.keyboard.press("Enter");
        assert.equal(await input.isVisible(), false);
        await mobilePage.setViewportSize({ width: 1440, height: 960 });
        await mobilePage.waitForFunction(() => document.querySelector("#mapFilters").open, null, { polling: 100 });
        assert.equal(await input.isVisible(), true);
        assert.equal(await disclosure.isVisible(), false);
        await mobilePage.setViewportSize({ width: 375, height: 812 });
      }
      await mobilePage.goto(`http://localhost:5500/${language}/faq.html`);
      await mobilePage.waitForFunction(() => document.querySelector("#potholesFaqLink")?.textContent, null, { polling: 100 });
      for (const width of [1440, 800, 640, 375, 320]) {
        await mobilePage.setViewportSize({ width, height: 900 });
        const layout = await mobilePage.evaluate(() => {
          const title = document.querySelector(".faq-header h1").getBoundingClientRect();
          const intro = document.querySelector(".faq-header .intro").getBoundingClientRect();
          const nav = document.querySelector(".faq-nav").getBoundingClientRect();
          return {
            overflow: document.documentElement.scrollWidth > innerWidth,
            navOverlap: title.left < nav.right && title.right > nav.left && title.top < nav.bottom && title.bottom > nav.top,
            introBelow: intro.top >= title.bottom,
            helpBeforeAbout: document.querySelector(".faq-potholes-help").getBoundingClientRect().bottom <= document.querySelector("#about-title").getBoundingClientRect().top,
          };
        });
        assert.ok(!layout.overflow && !layout.navOverlap && layout.introBelow && layout.helpBeforeAbout, `${language} FAQ ${width}: ${JSON.stringify(layout)}`);
      }
      const link = mobilePage.locator("#potholesFaqLink");
      assert.ok((await link.getAttribute("href")).endsWith(`/${language}/potholes.html?mode=how`));
      await mobilePage.locator("#languageToggle").click();
      assert.ok((await link.getAttribute("href")).endsWith(`/${language === "fr" ? "en" : "fr"}/potholes.html?mode=how`));
      await link.click();
      await mobilePage.waitForFunction(() => document.querySelector("#howVerified")?.textContent, null, { polling: 100 });
      assert.equal(await mobilePage.locator("#mapFilters").isVisible(), false);
      assert.equal(await mobilePage.locator("#howRepairCoverage").count(), 0);
      assert.equal(await mobilePage.locator(".pothole-document-intro + .pothole-document-nav").isVisible(), true);
      await mobilePage.locator("#how-report summary").click();
      assert.equal(await mobilePage.locator("#how-report a").first().getAttribute("href"), "https://montreal.ca/requetes311/signaler-nid-poule/emplacement");
      assert.equal(await mobilePage.locator('#how-report a[href="tel:311"]').count(), 1);
      assert.equal(await mobilePage.locator('[data-i18n="potholes.how.q.radius"]').count(), 1);
      assert.equal(await mobilePage.locator('[data-i18n="potholes.how.q.manualRepairs"]').count(), 1);
    }
    assert.deepEqual(mobileErrors, []);
    await mobilePage.close();
    console.log("PASS: mobile map disclosures, keyboard and desktop transition, compact four-mode navigation, responsive FAQ headers, translated help links and reporting guidance");
  } finally {
    await browser.close();
  }
}