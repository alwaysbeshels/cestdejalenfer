import Supercluster from "https://cdn.jsdelivr.net/npm/supercluster@8.0.1/+esm";
import {
  selectMapPositions, decodeMapReport, decodeMapRepair, buildPositionTimeline,
  clusterProperties, mergeClusterProperties, clusterStatus, buildRepairGroups, snapshotSummary, districtBounds,
} from "./potholes-data.mjs?v=20261001-potholes18";

const store = { version: 0, features: [], groups: new Map(), reports: new Map(), index: null };
const repairStore = { version: 0, features: [], groups: new Map(), index: null, request: null };
let mapPromise;
let historyPromise;

async function fetchSnapshot(file, options = {}) {
  const response = await fetch(new URL(`../data/nids-de-poule/${file}`, import.meta.url), { cache: "no-cache", ...options });
  if (!response.ok) throw new Error(`Snapshot HTTP ${response.status}`);
  return response.json();
}

function loadMap() {
  if (!mapPromise) mapPromise = fetchSnapshot("carte.json").catch((error) => { mapPromise = null; throw error; });
  return mapPromise;
}

async function filterRecords(message) {
  const { version, filters, catalog } = message;
  store.version = version;
  store.features = [];
  store.index = null;
  store.groups.clear();
  const snapshot = await loadMap();
  if (version !== store.version) return;
  if (snapshot.schemaVersion !== 2 || snapshot.origine.indexModifieLe !== catalog.contenuModifieLe) throw new Error("Map index is stale");
  store.snapshot = snapshot;
  const selected = selectMapPositions(snapshot.positions, filters);
  store.groups = new Map(selected.map((entry) => [entry.position.positionId, entry]));
  store.features = selected.map(({ position, mapStatus, selectedIndices }) => ({
    type: "Feature",
    geometry: { type: "Point", coordinates: [position.longitude, position.latitude] },
    properties: {
      id: position.positionId, kind: "reports", count: selectedIndices.length, total: position.signalements.length,
      status: mapStatus, date: position.dernierSignalement,
      firstReport: position.premierSignalement, repairCount: position.nombreColmatages,
      label: position.rues[0] || "", district: position.arrondissements[0] || "",
    },
  }));
  store.index = new Supercluster({
    radius: 96, maxZoom: 16, minPoints: 2,
    map: clusterProperties, reduce: mergeClusterProperties,
  }).load(store.features);
  const years = new Set(filters.years);
  const metadata = snapshot.annees;
  const dateValues = selected.flatMap(({ position, selectedIndices }) => selectedIndices.map((index) => position.signalements[index][1])).sort();
  self.postMessage({
    type: "filtered", kind: "reports", version,
    district: filters.district || "", districtBounds: districtBounds(snapshot.positions, filters.district),
    summary: {
      sourceYears: metadata.map((entry) => entry.annee),
      total: metadata.reduce((count, entry) => count + entry.nombre, 0),
      informationCount: metadata.reduce((count, entry) => count + entry.informations, 0),
      mappableCount: metadata.reduce((count, entry) => count + entry.nombre - entry.informations - entry.nonCartographiables, 0),
      firstDate: dateValues[0] || "", lastDate: dateValues.at(-1) || "",
      districts: [...new Set(snapshot.positions.flatMap((position) => position.arrondissements))].sort((left, right) => left.localeCompare(right, "fr")),
      repairsExcluded: snapshot.reparations.reduce((count, entry) => count + entry.exclus, 0),
    },
    counts: {
      mapped: selected.reduce((count, entry) => count + entry.selectedIndices.length, 0),
      unmapped: metadata.reduce((count, entry) => count + entry.nonCartographiables, 0),
      positions: selected.length,
    },
    snapshot: { years: [...years].sort((left, right) => left - right), modified: snapshot.contenuModifieLe },
  });
}

async function filterRepairs(message) {
  const { version, filters, catalog } = message;
  repairStore.version = version;
  repairStore.index = null;
  repairStore.features = [];
  repairStore.groups.clear();
  const entry = catalog.reparations.find((item) => item.annee === filters.year);
  if (!entry || !/^reparations-\d{4}\.json$/.test(entry.fichier)) throw new Error("Invalid repair snapshot");
  if (repairStore.request?.file !== entry.fichier) {
    repairStore.request?.controller.abort();
    const request = { file: entry.fichier, controller: new AbortController() };
    repairStore.request = request;
    request.promise = fetchSnapshot(entry.fichier, { signal: request.controller.signal }).catch((error) => {
      if (repairStore.request === request) repairStore.request = null;
      throw error;
    });
  }
  const snapshot = await repairStore.request.promise;
  if (version !== repairStore.version) return;
  if (!Array.isArray(snapshot.interventions) || snapshot.interventions.length !== entry.nombre
    || (entry.contenuModifieLe && snapshot.contenuModifieLe !== entry.contenuModifieLe)) throw new Error("Repair snapshot is stale");
  if (repairStore.snapshot !== snapshot) repairStore.summary = snapshotSummary(snapshot.interventions, "repairs");
  repairStore.snapshot = snapshot;
  const selection = buildRepairGroups(snapshot.interventions, filters);
  repairStore.groups = new Map(selection.groups.map((group) => [group.positionId, group]));
  repairStore.features = selection.groups.map((group) => ({
    type: "Feature", geometry: { type: "Point", coordinates: [group.longitude, group.latitude] },
    properties: {
      id: group.positionId, kind: "repairs", status: "repairs", count: group.count,
      firstDate: group.firstDate, date: group.lastDate, devices: group.devices,
    },
  }));
  repairStore.index = new Supercluster({
    radius: 96, maxZoom: 16, minPoints: 2,
    map: (properties) => ({ interventions: properties.count }),
    reduce: (target, properties) => { target.interventions += properties.interventions; },
  }).load(repairStore.features);
  self.postMessage({
    type: "filtered", kind: "repairs", version, summary: repairStore.summary,
    counts: { mapped: selection.mappedCount, unmapped: selection.unmappedCount, positions: selection.groups.length },
    snapshot: { year: snapshot.annee, modified: snapshot.contenuModifieLe },
  });
}

function queryViewport(message) {
  const layers = {};
  for (const [kind, version] of Object.entries(message.versions)) {
    const current = kind === "repairs" ? repairStore : store;
    if (version !== current.version || !current.index) continue;
    const features = current.index.getClusters(message.bounds, Math.floor(message.zoom)).map((feature) => {
      if (!feature.properties.cluster) return feature;
      return {
        ...feature,
        properties: {
          ...feature.properties, kind, id: `cluster:${feature.properties.cluster_id}`,
          status: kind === "repairs" ? "repairs" : clusterStatus(feature.properties),
        },
      };
    });
    layers[kind] = { version, features };
  }
  self.postMessage({ type: "viewport", requestId: message.requestId, layers });
}

function expandCluster(message) {
  const current = message.kind === "repairs" ? repairStore : store;
  if (message.version !== current.version || !current.index) return;
  self.postMessage({
    type: "expand", kind: message.kind, version: current.version, coordinates: message.coordinates,
    zoom: current.index.getClusterExpansionZoom(message.clusterId),
  });
}

async function loadRecord(reference) {
  if (!store.reports.has(reference.annee)) {
    const promise = fetchSnapshot(`signalements-${reference.annee}.json`).catch((error) => {
      store.reports.delete(reference.annee);
      throw error;
    });
    store.reports.set(reference.annee, promise);
    if (store.reports.size > 2) store.reports.delete(store.reports.keys().next().value);
  }
  const snapshot = await store.reports.get(reference.annee);
  const expectedDate = store.snapshot.origine.signalements.find(([file]) => file === `signalements-${reference.annee}.json`)?.[1];
  const record = snapshot.signalements?.[reference.index];
  if (snapshot.contenuModifieLe !== expectedDate || record?.idUnique !== reference.idUnique || record.dateCreation !== reference.dateCreation) {
    throw new Error("Report index is stale");
  }
  return record;
}

async function loadHistory(positionId, version) {
  if (!historyPromise) historyPromise = fetchSnapshot("historique-colmatages.json").catch((error) => { historyPromise = null; throw error; });
  const snapshot = await historyPromise;
  if (snapshot.version !== version) { historyPromise = null; throw new Error("Repair history is stale"); }
  return (snapshot.positions[positionId] || []).map(decodeMapRepair);
}

async function queryDetail(message) {
  const { version, id, requestId } = message;
  if (version !== store.version) return;
  const group = store.groups.get(id);
  if (!group) return;
  const selected = [...group.selectedIndices].reverse();
  const offset = Math.max(0, Math.min(selected.length - 1, Number(message.offset) || 0));
  const reference = decodeMapReport(group.position.signalements[selected[offset]]);
  const [record, repairs] = await Promise.all([
    loadRecord(reference),
    loadHistory(id, store.snapshot.version).catch(() => null),
  ]);
  if (version !== store.version) return;
  const records = group.position.signalements.map(decodeMapReport);
  self.postMessage({
    type: "detail", kind: "reports", version, requestId, id, offset,
    total: selected.length, totalReports: group.position.signalements.length, mapStatus: group.mapStatus,
    record, history: {
      timeline: buildPositionTimeline(records, repairs || []), available: repairs !== null,
      reportCount: records.length, repairCount: repairs?.length ?? group.position.nombreColmatages,
      latestReport: group.position.dernierSignalement, latestRepair: group.position.dernierColmatage,
      excludedRepairs: store.snapshot.reparations.reduce((count, entry) => count + entry.exclus, 0),
    },
    snapshot: { year: reference.annee, modified: store.snapshot.contenuModifieLe },
  });
}

function queryRepairDetail(message) {
  if (message.version !== repairStore.version) return;
  const group = repairStore.groups.get(message.id);
  if (!group) return;
  const records = repairStore.snapshot.interventions;
  const indices = [...group.recordIndices].sort((left, right) => (records[right].horodatage || "").localeCompare(records[left].horodatage || ""));
  const offset = Math.max(0, Math.min(indices.length - 1, Number(message.offset) || 0));
  self.postMessage({
    type: "detail", kind: "repairs", version: message.version, requestId: message.requestId, id: message.id,
    offset, total: indices.length, record: records[indices[offset]],
    position: { count: group.count, firstDate: group.firstDate, lastDate: group.lastDate, devices: group.devices },
    snapshot: { year: repairStore.snapshot.annee, modified: repairStore.snapshot.contenuModifieLe },
  });
}

self.addEventListener("message", async ({ data: message }) => {
  try {
    if (message.type === "filter") await (message.kind === "repairs" ? filterRepairs(message) : filterRecords(message));
    if (message.type === "viewport") queryViewport(message);
    if (message.type === "expand") expandCluster(message);
    if (message.type === "detail") await (message.kind === "repairs" ? queryRepairDetail(message) : queryDetail(message));
  } catch (error) {
    if (error.name === "AbortError") return;
    self.postMessage({ type: "error", operation: message.type, kind: message.kind || "reports", version: message.version, requestId: message.requestId, message: error.message });
  }
});

