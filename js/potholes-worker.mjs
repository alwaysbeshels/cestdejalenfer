import { selectMapPositions, decodeMapReport, decodeMapRepair, buildPositionTimeline } from "./potholes-data.mjs?v=20260930-potholes3";

const store = { version: 0, features: [], groups: new Map(), reports: new Map() };
let mapPromise;
let historyPromise;

async function fetchSnapshot(file) {
  const response = await fetch(new URL(`../data/nids-de-poule/${file}`, import.meta.url), { cache: "no-cache" });
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
      label: position.rues[0] || "", district: position.arrondissements[0] || "",
    },
  }));
  const years = new Set(filters.years);
  const metadata = snapshot.annees;
  const dateValues = selected.flatMap(({ position, selectedIndices }) => selectedIndices.map((index) => position.signalements[index][1])).sort();
  self.postMessage({
    type: "filtered", kind: "reports", version,
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

function queryViewport(message) {
  if (message.versions.reports !== store.version) return;
  const [west, south, east, north] = message.bounds;
  const features = store.features.filter((feature) => {
    const [longitude, latitude] = feature.geometry.coordinates;
    return latitude >= south && latitude <= north && longitude >= west && longitude <= east;
  });
  self.postMessage({ type: "viewport", requestId: message.requestId, layers: { reports: { version: store.version, features } } });
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

self.addEventListener("message", async ({ data: message }) => {
  try {
    if (message.type === "filter") await filterRecords(message);
    if (message.type === "viewport") queryViewport(message);
    if (message.type === "detail") await queryDetail(message);
  } catch (error) {
    self.postMessage({ type: "error", operation: message.type, kind: "reports", version: message.version, requestId: message.requestId, message: error.message });
  }
});

