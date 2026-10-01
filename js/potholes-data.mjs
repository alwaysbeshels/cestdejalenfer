export const MONTREAL_BOUNDS = Object.freeze({ west: -74.1, south: 45.3, east: -73.4, north: 45.8 });

export function normalizeSearch(value) {
  return String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

export function hasLocalCoordinates(record) {
  return Number.isFinite(record.latitude) && Number.isFinite(record.longitude)
    && record.latitude >= MONTREAL_BOUNDS.south && record.latitude <= MONTREAL_BOUNDS.north
    && record.longitude >= MONTREAL_BOUNDS.west && record.longitude <= MONTREAL_BOUNDS.east;
}

export function reportDistrict(record) {
  return record.arrondissementGeo || record.arrondissement || "";
}

export function reportStreet(record) {
  return record.rue || [record.intersection1, record.intersection2].filter(Boolean).join(" / ");
}

export function classifyPosition(lastReportDate, repairs = [], complete = true) {
  const reportTime = Date.parse(lastReportDate);
  if (!complete || !Number.isFinite(reportTime)) return "unknown";
  const lastRepairTime = repairs.reduce((latest, repair) => {
    const repairTime = Date.parse(repair.horodatage);
    return Number.isFinite(repairTime) ? Math.max(latest, repairTime) : latest;
  }, -Infinity);
  return lastRepairTime > reportTime ? "presumed-repaired" : "active";
}

export function buildPositionTimeline(records, repairs = []) {
  const repairEvents = new Map();
  repairs.forEach((repair) => {
    if (!Number.isFinite(Date.parse(repair.horodatage))) return;
    const key = [repair.horodatage, repair.appareil || "", repair.latitude ?? "", repair.longitude ?? ""].join("|");
    const previous = repairEvents.get(key);
    if (!previous || repair.distanceM < previous.distanceM) {
      repairEvents.set(key, { ...repair, kind: "repair", date: repair.horodatage });
    }
  });
  const reports = records.filter((record) => Number.isFinite(Date.parse(record.dateCreation)))
    .map((record) => ({ ...record, kind: "report", date: record.dateCreation }));
  return [...reports, ...repairEvents.values()].sort((left, right) => left.date.localeCompare(right.date)
    || left.kind.localeCompare(right.kind));
}

export function decodeMapReport(values) {
  const [idUnique, dateCreation, dernierStatut, annee, index] = values;
  return { idUnique, dateCreation, dernierStatut, annee, index };
}

export function decodeMapRepair(values) {
  const [horodatage, appareil, distanceM, latitude, longitude] = values;
  return { horodatage, appareil, distanceM, latitude, longitude };
}

export function buildActivePeriods(reportDates, repairDates) {
  const events = [
    ...reportDates.map((date) => ({ date, kind: "report" })),
    ...repairDates.map((date) => ({ date, kind: "repair" })),
  ].filter((event) => Number.isFinite(Date.parse(event.date)))
    .sort((left, right) => left.date.localeCompare(right.date) || left.kind.localeCompare(right.kind));
  const periods = [];
  let start = null;
  for (const event of events) {
    if (event.kind === "report" && start === null) start = event.date;
    if (event.kind === "repair" && start !== null) {
      periods.push({ start, end: event.date });
      start = null;
    }
  }
  if (start !== null) periods.push({ start, end: null });
  return periods;
}

export function activeInYear(periods, year) {
  const start = `${year}-01-01T00:00:00`;
  const end = `${year + 1}-01-01T00:00:00`;
  return periods.some((period) => period.start < end && (period.end === null || period.end > start));
}

export function pointRadiusForZoom(zoom) {
  return 2 + (Math.max(10, Math.min(19, zoom)) - 10) * 2 / 3;
}

export function selectMapPositions(positions, filters = {}) {
  const years = filters.years ? new Set(filters.years.map(Number)) : null;
  const search = normalizeSearch(filters.search);
  return positions.flatMap((position) => {
    if (filters.district && !position.arrondissements.includes(filters.district)) return [];
    if (years && ![...years].some((year) => activeInYear(position.periodesActives || [], year))) return [];
    const mapStatus = classifyPosition(position.dernierSignalement,
      position.dernierColmatage ? [{ horodatage: position.dernierColmatage }] : []);
    if (filters.status && filters.status !== "all" && filters.status !== mapStatus) return [];
    const locationMatches = !search || normalizeSearch([...position.rues, ...position.arrondissements].join(" ")).includes(search);
    const selectedIndices = [];
    position.signalements.forEach((record, index) => {
      if (!locationMatches && !normalizeSearch(record[0]).includes(search)) return;
      selectedIndices.push(index);
    });
    return selectedIndices.length ? [{ position, mapStatus, selectedIndices }] : [];
  });
}

export function buildReportGroups(records, filters = {}) {
  const groups = new Map();
  const search = normalizeSearch(filters.search);
  let matchedCount = 0;
  let unmappedCount = 0;
  records.forEach((record, recordIndex) => {
    if (record.etat === "information" || record.nature === "Information") return;
    if (filters.state && filters.state !== "all" && record.etat !== filters.state) return;
    if (filters.district && reportDistrict(record) !== filters.district) return;
    if (filters.month && record.dateCreation?.slice(0, 7) !== filters.month) return;
    if (search && !normalizeSearch([
      record.rue, record.intersection1, record.intersection2, record.idUnique, reportDistrict(record),
    ].filter(Boolean).join(" ")).includes(search)) return;
    matchedCount += 1;
    if (!record.positionFiable || !record.positionId || !hasLocalCoordinates(record)) {
      unmappedCount += 1;
      return;
    }
    let group = groups.get(record.positionId);
    if (!group) {
      group = {
        positionId: record.positionId,
        latitude: record.latitude,
        longitude: record.longitude,
        recordIndices: [],
        count: 0,
        openCount: 0,
        lastDate: "",
      };
      groups.set(record.positionId, group);
    }
    group.recordIndices.push(recordIndex);
    group.count += 1;
    if (record.etat === "ouvert") group.openCount += 1;
    if (record.dateCreation > group.lastDate) group.lastDate = record.dateCreation;
  });
  return { groups: [...groups.values()], matchedCount, mappedCount: matchedCount - unmappedCount, unmappedCount };
}

export function selectRepairRecords(records, filters = {}) {
  const recordIndices = [];
  let matchedCount = 0;
  let unmappedCount = 0;
  records.forEach((record, recordIndex) => {
    if (filters.month && record.horodatage?.slice(0, 7) !== filters.month) return;
    if (filters.device && record.appareil !== filters.device) return;
    matchedCount += 1;
    if (!hasLocalCoordinates(record)) {
      unmappedCount += 1;
      return;
    }
    recordIndices.push(recordIndex);
  });
  return { recordIndices, matchedCount, mappedCount: recordIndices.length, unmappedCount };
}

export function snapshotSummary(records, kind) {
  const dates = records.map((record) => kind === "reports" ? record.dateCreation : record.horodatage).filter(Boolean).sort();
  const distinct = (values) => [...new Set(values.filter(Boolean))].sort((left, right) => left.localeCompare(right, "fr"));
  return {
    total: records.length,
    firstDate: dates[0] || "",
    lastDate: dates.at(-1) || "",
    months: distinct(dates.map((date) => date.slice(0, 7))),
    districts: kind === "reports" ? distinct(records.map(reportDistrict)) : [],
    devices: kind === "repairs" ? distinct(records.map((record) => record.appareil)) : [],
    informationCount: records.filter((record) => record.etat === "information" || record.nature === "Information").length,
    mappableCount: records.filter((record) => hasLocalCoordinates(record)
      && (kind === "repairs" || (record.positionFiable && record.positionId && record.etat !== "information" && record.nature !== "Information"))).length,
  };
}

export function buildRepairGroups(records, filters = {}) {
  const selection = selectRepairRecords(records, filters);
  const groups = new Map();
  for (const recordIndex of selection.recordIndices) {
    const record = records[recordIndex];
    const positionId = `${record.latitude},${record.longitude}`;
    let group = groups.get(positionId);
    if (!group) {
      group = { positionId, latitude: record.latitude, longitude: record.longitude, recordIndices: [], count: 0, lastDate: "" };
      groups.set(positionId, group);
    }
    group.recordIndices.push(recordIndex);
    group.count += 1;
    if (record.horodatage > group.lastDate) group.lastDate = record.horodatage;
  }
  const { recordIndices, ...counts } = selection;
  return { ...counts, groups: [...groups.values()] };
}