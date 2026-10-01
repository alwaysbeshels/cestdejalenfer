import { normalizeSearch, reportStreet, reportDistrict, pointRadiusForZoom } from "./potholes-data.mjs?v=20260930-potholes3";

const byId = (id) => document.getElementById(id);
const locale = () => currentLanguage() === "en" ? "en-CA" : "fr-CA";
const number = (value) => new Intl.NumberFormat(locale(), { maximumFractionDigits: 2 }).format(value);
const currentYear = () => Number(new Intl.DateTimeFormat("en-CA", { year: "numeric", timeZone: "America/Montreal" }).format(new Date()));
const text = (key, values = {}) => t(`potholes.${key}`).replace(/\{(\w+)\}/g, (match, name) => values[name] ?? match);
const compact = window.matchMedia("(max-width: 880px)");
const dialog = byId("potholeDialog");
const kinds = ["reports"];
const state = {
  catalog: null, verification: null, worker: null, map: null, fatal: false, notice: "",
  viewportRequest: 0, detailRequest: 0, detail: null, detailQuery: null, listLimit: 16, location: null,
  reports: { version: 0, enabled: true, loading: false, ready: false, error: false, features: [] },
  markers: new Map(),
};
const sources = {
  reports: "https://donnees.montreal.ca/dataset/requete-311",
  repairs: "https://donnees.montreal.ca/dataset/refection-de-chaussee-par-remplissage-mecanise-de-nid-de-poule",
};

function element(tag, className = "", content = "") {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.textContent = content;
  return node;
}

function formatDate(value, withTime = false) {
  if (!value) return text("notPublished");
  const hasZone = /(?:Z|[+-]\d{2}:\d{2})$/.test(value);
  const date = new Date(hasZone ? value : `${value.length === 10 ? `${value}T00:00:00` : value}Z`);
  if (!Number.isFinite(date.getTime())) return text("notPublished");
  return new Intl.DateTimeFormat(locale(), {
    dateStyle: "medium", ...(withTime ? { timeStyle: "short" } : {}), timeZone: hasZone ? "America/Montreal" : "UTC",
  }).format(date);
}

function publishedLabel(type, value) {
  if (!value) return text("notPublished");
  const key = `potholes.${type}.${normalizeSearch(value).replace(/\s+/g, "-")}`;
  return t(key) === key ? value : t(key);
}

function setOptions(id, values, emptyKey, format = (value) => value) {
  const select = byId(id);
  const selected = select.value;
  select.replaceChildren();
  if (emptyKey) select.add(new Option(text(emptyKey), ""));
  values.forEach((value) => select.add(new Option(format(String(value)), String(value))));
  if ([...select.options].some((option) => option.value === selected)) select.value = selected;
}

function selectedYears() {
  return [...byId("yearOptions").querySelectorAll("input:checked")].map((input) => Number(input.value));
}

function renderYears() {
  const years = selectedYears();
  const total = byId("yearOptions").querySelectorAll("input").length;
  byId("allYears").checked = total > 0 && years.length === total;
  byId("allYears").indeterminate = years.length > 0 && years.length < total;
  byId("yearSelection").textContent = years.length === total && total > 0 ? text("allYears") : years.join(", ") || text("noYears");
}

function initializeYears(entries) {
  const previous = byId("yearOptions").childElementCount ? new Set(selectedYears()) : null;
  const options = byId("yearOptions");
  options.replaceChildren();
  const firstYear = Math.min(...entries.map((entry) => entry.annee));
  const lastYear = Math.max(currentYear(), ...entries.map((entry) => entry.annee));
  Array.from({ length: lastYear - firstYear + 1 }, (unused, index) => lastYear - index).forEach((year) => {
    const label = element("label");
    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = String(year);
    input.checked = previous ? previous.has(year) : year === currentYear();
    label.append(input, document.createTextNode(String(year)));
    options.append(label);
  });
  renderYears();
}

function renderFilterOptions() {
  setOptions("reportDistrict", state.reports.summary?.districts || [], "allDistricts");
  renderYears();
}

function renderLayer(kind) {
  const layer = state[kind];
  byId(`${kind}Controls`).querySelectorAll("input, select").forEach((control) => { control.disabled = !layer.enabled; });
  byId(`${kind}Error`).hidden = !layer.error;
  byId(`${kind}Error`).textContent = text("loadError");
  byId(`${kind}Retry`).hidden = !layer.error;
  const coverage = byId(`${kind}Coverage`);
  const counts = byId(`${kind}Counts`);
  const warning = byId(`${kind}Warning`);
  coverage.hidden = !layer.summary?.firstDate;
  coverage.textContent = layer.summary ? text("coverage", { first: formatDate(layer.summary.firstDate), last: formatDate(layer.summary.lastDate) }) : "";
  counts.textContent = layer.loading ? text("loading") : layer.ready && layer.enabled ? text(kind === "reports" ? "reportCounts" : "repairCounts", { count: number(layer.counts.mapped), positions: number(layer.counts.positions) }) : "";
  warning.hidden = !layer.ready || !layer.enabled || (layer.counts.unmapped === 0 && layer.summary.mappableCount !== 0);
  warning.textContent = layer.summary?.mappableCount === 0 ? text("noCoordinates", { count: number(layer.summary.total) }) : text("excluded", { count: number(layer.counts?.unmapped || 0) });
}

function renderSources() {
  byId("verificationDate").textContent = state.verification?.derniereVerification
    ? text("verified", { date: formatDate(state.verification.derniereVerification, true) }) : text("verificationUnavailable");
  const statistics = byId("sourceStatistics");
  statistics.replaceChildren();
  for (const kind of kinds) {
    const layer = state[kind];
    if (!layer.summary || !layer.snapshot) continue;
    statistics.append(element("p", "", text("sourceCount", {
      source: text(kind), year: layer.summary.sourceYears.join(", "), count: number(layer.summary.total), mapped: number(layer.summary.mappableCount),
    })));
    if (kind === "reports") statistics.append(element("p", "", text("informationCount", { count: number(layer.summary.informationCount) })));
    statistics.append(element("p", "", text("modified", { date: formatDate(layer.snapshot.modified, true) })));
    if (layer.summary.repairsExcluded) statistics.append(element("p", "pothole-warning", text("repairHistoryExcluded", { count: number(layer.summary.repairsExcluded) })));
  }
}

function renderStatus() {
  const busy = kinds.some((kind) => state[kind].enabled && state[kind].loading);
  byId("mapStatus").hidden = !busy && !state.fatal;
  byId("mapStatus").dataset.mode = state.fatal ? "error" : "loading";
  byId("mapStatus").textContent = text(state.fatal ? "loadError" : "loading");
  byId("pageRetry").hidden = !state.fatal;
  byId("mapNotice").hidden = !state.notice;
  byId("mapNotice").textContent = state.notice ? text(state.notice) : "";
  byId("potholeResults").setAttribute("aria-busy", String(busy));
}

function renderLegend() {
  const legend = byId("potholeLegend");
  legend.replaceChildren();
  ["active", "presumed-repaired", "unknown"].forEach((status) => {
    const label = element("span");
    const swatch = element("i", `pothole-swatch ${status}`);
    swatch.setAttribute("aria-hidden", "true");
    label.append(swatch, document.createTextNode(text(`mapStatus.${status}`)));
    legend.append(label);
  });
  legend.hidden = !state.reports.enabled;
}

function requestLayer(kind) {
  clearTimeout(searchTimer);
  const layer = state[kind];
  layer.version += 1;
  layer.features = [];
  layer.mapLayer?.clearLayers();
  state.markers.clear();
  layer.enabled = byId(`${kind}Enabled`).checked;
  layer.ready = false;
  layer.loading = layer.enabled && Boolean(state.worker);
  layer.error = false;
  renderLayer(kind);
  renderLegend();
  renderStatus();
  renderResults();
  if (!layer.enabled || !state.catalog || !state.worker) return;
  const filters = {
    years: selectedYears(), status: byId("reportState").value,
    district: byId("reportDistrict").value, search: byId("reportSearch").value,
  };
  state.worker.postMessage({ type: "filter", kind, version: layer.version, catalog: state.catalog, filters });
}

function requestViewport() {
  if (!state.map || !state.worker) return;
  const bounds = state.map.getBounds();
  state.worker.postMessage({
    type: "viewport", requestId: ++state.viewportRequest,
    bounds: [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()], zoom: state.map.getZoom(),
    versions: Object.fromEntries(kinds.filter((kind) => state[kind].enabled && state[kind].ready).map((kind) => [kind, state[kind].version])),
  });
}

function featureCount(feature) {
  return feature.properties.count;
}

function featureTitle(feature) {
  return feature.properties.label || text("unknownStreet");
}

function chooseFeature(feature, kind) {
  if (state[kind].loading || !state[kind].ready) return;
  state.detailQuery = { kind, id: feature.properties.id, version: state[kind].version, offset: 0 };
  requestDetail();
}

function renderFeatures(kind) {
  const layer = state[kind];
  if (!layer.mapLayer) return;
  const radius = pointRadiusForZoom(state.map.getZoom());
  const visible = new Set(layer.features.map((feature) => feature.properties.id));
  for (const [id, entry] of state.markers) {
    if (!visible.has(id)) { layer.mapLayer.removeLayer(entry.marker); state.markers.delete(id); }
  }
  layer.features.forEach((feature) => {
    const status = feature.properties.status;
    const coordinates = [...feature.geometry.coordinates].reverse();
    const title = `${featureTitle(feature)} \u00b7 ${text(`mapStatus.${status}`)}`;
    const style = {
      radius, color: status === "unknown" ? "#d33030" : "#fff", weight: Math.max(0.6, radius / 5),
      fillOpacity: 0.9, fillColor: status === "presumed-repaired" ? "#7b8186" : status === "unknown" ? "#fff" : "#d33030",
    };
    let entry = state.markers.get(feature.properties.id);
    if (!entry) {
      const marker = L.circleMarker(coordinates, { renderer: state.renderer, ...style });
      entry = { marker, feature };
      marker.on("click", () => chooseFeature(entry.feature, kind));
      marker.addTo(layer.mapLayer);
      state.markers.set(feature.properties.id, entry);
    }
    entry.feature = feature;
    entry.marker.setStyle(style);
    entry.marker.bindTooltip(element("span", "", title), { direction: "top" });
  });
}

function renderResults() {
  const buckets = kinds.map((kind) => state[kind].features.map((feature) => ({ feature, kind }))
    .sort((left, right) => featureCount(right.feature) - featureCount(left.feature)));
  const rows = [];
  for (let index = 0; index < Math.max(...buckets.map((bucket) => bucket.length)); index += 1) {
    buckets.forEach((bucket) => { if (bucket[index]) rows.push(bucket[index]); });
  }
  const counts = Object.fromEntries(kinds.map((kind) => [kind, state[kind].features.reduce((sum, feature) => sum + featureCount(feature), 0)]));
  byId("viewportCounts").textContent = text("viewCounts", { reports: number(counts.reports), positions: number(rows.length) });
  const list = byId("potholeResults");
  list.replaceChildren();
  rows.slice(0, state.listLimit).forEach(({ feature, kind }) => {
    const item = element("li");
    const button = element("button", "pothole-result");
    button.type = "button";
    const swatch = element("span", `pothole-swatch ${feature.properties.status}`);
    swatch.setAttribute("aria-hidden", "true");
    const content = element("span");
    content.append(element("strong", "", featureTitle(feature, kind)));
    content.append(element("small", "", [text(`mapStatus.${feature.properties.status}`), feature.properties.district].filter(Boolean).join(" \u00b7 ")));
    button.append(swatch, content, element("span", "pothole-result-count", number(featureCount(feature))));
    button.addEventListener("click", () => chooseFeature(feature, kind));
    item.append(button);
    list.append(item);
  });
  byId("moreResults").hidden = rows.length <= state.listLimit;
  const empty = byId("emptyResults");
  empty.hidden = rows.length > 0 || kinds.some((kind) => state[kind].loading);
  empty.textContent = text(kinds.every((kind) => !state[kind].enabled) ? "noLayers" : "empty");
}

function row(list, key, value) {
  list.append(element("dt", "", text(key)), element("dd", "", value ?? text("notPublished")));
}

function renderHistory(container, history) {
  const section = element("details", "pothole-detail-section");
  section.id = "positionHistory";
  section.append(element("summary", "", text("history")));
  if (!history) {
    section.append(element("p", "pothole-detail-note", text("historyUnavailable")));
  } else {
    section.append(element("p", "", text("timelineCounts", { reports: number(history.reportCount), repairs: number(history.repairCount) })));
    if (!history.available) section.append(element("p", "pothole-warning", text("historyUnavailable")));
    const list = element("ol", "pothole-timeline");
    const more = element("button", "pothole-text-button", text("moreHistory"));
    more.type = "button";
    let limit = 0;
    const appendEvents = () => {
      history.timeline.slice(limit, limit + 40).forEach((event) => {
        const item = element("li", event.kind);
        item.dataset.eventDate = event.date;
        const date = element("time", "", formatDate(event.date, true));
        date.dateTime = event.date;
        item.append(date, element("strong", "", text(event.kind === "report" ? "timelineReport" : "timelineRepair")));
        item.append(element("span", "", event.kind === "report"
          ? `${event.idUnique} \u00b7 ${publishedLabel("status", event.dernierStatut)}`
          : `${event.appareil || text("notPublished")} \u00b7 ${number(event.distanceM)} m`));
        list.append(item);
      });
      limit += 40;
      more.hidden = limit >= history.timeline.length;
    };
    more.addEventListener("click", appendEvents);
    appendEvents();
    section.append(list, more, element("p", "pothole-detail-note", text("historyNote")));
    if (history.excludedRepairs) section.append(element("p", "pothole-detail-note", text("repairHistoryExcluded", { count: number(history.excludedRepairs) })));
  }
  container.append(section);
}

function renderMatch(container, record) {
  const section = element("section", "pothole-detail-section");
  section.append(element("h3", "", text("estimatedMatch")));
  const match = record.colmatage?.premiereApresSignalement;
  if (match) {
    const fields = element("dl", "pothole-detail-fields");
    row(fields, "observedTime", formatDate(match.horodatage, true));
    row(fields, "distance", `${number(match.distanceM)} m`);
    row(fields, "afterReport", text("days", { count: number(match.joursApresSignalement) }));
    row(fields, "device", match.appareil);
    row(fields, "confidence", publishedLabel("confidence", record.colmatage.confiance));
    if (typeof match.avantClotureDeLaRequete === "boolean") row(fields, "beforeLastStatus", text(match.avantClotureDeLaRequete ? "yes" : "no"));
    section.append(fields);
  } else {
    const lastRepair = state.catalog?.reparations.map((entry) => entry.derniereIntervention || "").sort().at(-1);
    section.append(element("p", "", text(lastRepair && record.dateCreation > lastRepair ? "outOfCoverage" : "noMatch")));
  }
  if (record.colmatage?.interventionsDansLeRayon) {
    section.append(element("p", "pothole-detail-meta", text("nearbyTraces", { count: number(record.colmatage.interventionsDansLeRayon), radius: number(record.colmatage.rayonM) })));
  }
  section.append(element("p", "pothole-detail-note", text("matchNote")));
  container.append(section);
}

function renderDetail() {
  const detail = state.detail;
  if (!detail) return;
  const { record, kind } = detail;
  const isReport = kind === "reports";
  byId("detailTitle").textContent = isReport ? reportStreet(record) || text("unknownStreet") : text("repairPosition");
  const content = byId("detailContent");
  content.replaceChildren();
  content.append(element("p", "pothole-detail-meta", isReport ? reportDistrict(record) : text("sourceYear", { year: detail.snapshot.year })));
  if (isReport) {
    const status = element("p", `pothole-detail-status ${detail.mapStatus}`, text(`mapStatus.${detail.mapStatus}`));
    status.id = "positionStatus";
    content.append(status);
    const summary = element("dl", "pothole-detail-fields");
    row(summary, "totalReports", number(detail.totalReports));
    row(summary, "selectedReports", number(detail.total));
    row(summary, "latestReport", formatDate(detail.history.latestReport, true));
    row(summary, "latestRepair", formatDate(detail.history.latestRepair, true));
    content.append(summary, element("p", "pothole-detail-note", text("mapStatusNote")));
  }
  const fields = element("dl", "pothole-detail-fields");
  if (isReport) {
    row(fields, "reportId", record.idUnique);
    row(fields, "status311", publishedLabel("status", record.dernierStatut));
    row(fields, "created", formatDate(record.dateCreation, true));
    row(fields, "statusDate", formatDate(record.dateDernierStatut, true));
    if (Number.isFinite(record.delaiTraitementJours)) row(fields, "statusDelay", text("days", { count: number(record.delaiTraitementJours) }));
  } else {
    row(fields, "observedTime", formatDate(record.horodatage, true));
    row(fields, "device", record.appareil);
    row(fields, "coordinates", `${record.latitude}, ${record.longitude}`);
  }
  content.append(fields, element("p", "pothole-detail-note", text(isReport ? "positionNote" : "repairNote")));
  if (isReport) {
    content.append(element("p", "pothole-detail-note", text("statusNote")));
    renderHistory(content, detail.history);
    const administrative = element("details", "pothole-detail-section");
    administrative.append(element("summary", "", text("administrative")));
    const administrativeFields = element("dl", "pothole-detail-fields");
    row(administrativeFields, "nature", publishedLabel("nature", record.nature));
    row(administrativeFields, "locationType", publishedLabel("place", record.typeLieuIntervention));
    row(administrativeFields, "intersections", [record.intersection1, record.intersection2].filter(Boolean).join(" / ") || text("notPublished"));
    row(administrativeFields, "postalCode", record.codePostal);
    row(administrativeFields, "responsible", record.uniteResponsable);
    row(administrativeFields, "origin", record.provenance);
    row(administrativeFields, "coordinates", `${record.latitude}, ${record.longitude}`);
    administrative.append(administrativeFields);
    content.append(administrative);
  }
  const source = element("a", "", text("officialSource"));
  source.href = sources[kind];
  source.target = "_blank";
  source.rel = "noreferrer";
  content.append(source);
  byId("detailPagination").hidden = detail.total <= 1;
  byId("recordPage").textContent = text("recordPage", { current: number(detail.offset + 1), total: number(detail.total) });
  byId("previousRecord").disabled = detail.offset === 0;
  byId("nextRecord").disabled = detail.offset + 1 === detail.total;
}

function requestDetail() {
  state.detail = null;
  byId("detailTitle").textContent = text("details");
  byId("detailContent").replaceChildren(element("p", "", text("loading")));
  byId("detailPagination").hidden = true;
  if (!dialog.open) dialog.showModal();
  state.worker.postMessage({ type: "detail", ...state.detailQuery, requestId: ++state.detailRequest });
}

function handleWorker({ data: message }) {
  if (message.type === "viewport") {
    if (message.requestId !== state.viewportRequest) return;
    kinds.forEach((kind) => {
      const result = message.layers[kind];
      state[kind].features = state[kind].enabled && result?.version === state[kind].version ? result.features : [];
      renderFeatures(kind);
    });
    state.listLimit = 16;
    renderResults();
    return;
  }
  const layer = state[message.kind];
  if (!layer || message.version !== layer.version) return;
  if (message.type === "filtered") {
    Object.assign(layer, { loading: false, ready: true, error: false, counts: message.counts, summary: message.summary, snapshot: message.snapshot });
    renderFilterOptions(message.kind);
    renderLayer(message.kind);
    renderSources();
    renderStatus();
    requestViewport();
  } else if (message.type === "detail" && message.requestId === state.detailRequest && dialog.open) {
    state.detail = message;
    renderDetail();
  } else if (message.type === "error") {
    if (message.operation === "detail") {
      if (message.requestId === state.detailRequest) byId("detailContent").replaceChildren(element("p", "pothole-error", text("loadError")));
    } else if (message.operation === "filter") {
      Object.assign(layer, { loading: false, ready: false, error: true });
      renderLayer(message.kind);
      renderStatus();
      renderResults();
    }
  }
}

function setPanel(open) {
  const isOpen = compact.matches && open;
  byId("sidePanel").classList.toggle("is-open", isOpen);
  byId("sidePanel").inert = compact.matches && !isOpen;
  byId("menuToggle").classList.toggle("is-open", isOpen);
  byId("menuToggle").setAttribute("aria-expanded", String(isOpen));
  byId("menuBackdrop").hidden = !isOpen;
  byId("potholeMapZone").inert = isOpen;
  if (compact.matches) {
    if (isOpen) byId("languageToggle").focus();
    else byId("menuToggle").focus({ preventScroll: true });
  }
}

function initializeMap() {
  if (state.map) return;
  if (!window.L) throw new Error("Map library unavailable");
  const requested = new URLSearchParams(location.search).get("mapView")?.split(",").map(Number);
  const validView = requested?.length === 3 && requested.every(Number.isFinite)
    && requested[0] >= 45.3 && requested[0] <= 45.8 && requested[1] >= -74.1 && requested[1] <= -73.4
    && requested[2] >= 10 && requested[2] <= 19;
  state.map = L.map("map", { preferCanvas: true, zoomControl: false, minZoom: 10, maxZoom: 19 })
    .setView(validView ? requested.slice(0, 2) : [45.53, -73.65], validView ? requested[2] : 12);
  state.renderer = L.canvas({ padding: 1 });
  const tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "&copy; OpenStreetMap contributors" }).addTo(state.map);
  tiles.on("tileerror", () => { state.notice = "tileError"; renderStatus(); });
  kinds.forEach((kind) => { state[kind].mapLayer = L.layerGroup().addTo(state.map); });
  state.map.on("moveend", requestViewport);
  byId("zoomIn").addEventListener("click", () => state.map.zoomIn());
  byId("zoomOut").addEventListener("click", () => state.map.zoomOut());
  byId("resetMap").addEventListener("click", () => state.map.setView([45.53, -73.65], 12));
  byId("locatePotholes").addEventListener("click", () => {
    const button = byId("locatePotholes");
    if (!navigator.geolocation) { state.notice = "locateError"; renderStatus(); return; }
    button.disabled = true;
    state.notice = "locating";
    renderStatus();
    navigator.geolocation.getCurrentPosition((position) => {
      button.disabled = false;
      state.notice = "";
      const coordinates = [position.coords.latitude, position.coords.longitude];
      state.location?.remove();
      state.location = L.circleMarker(coordinates, { radius: 7, color: "#fff", weight: 2, fillColor: "#1976d2", fillOpacity: 1 }).addTo(state.map);
      state.map.setView(coordinates, 16);
      renderStatus();
    }, () => { button.disabled = false; state.notice = "locateError"; renderStatus(); }, { timeout: 12000, maximumAge: 60000 });
  });
  document.querySelectorAll(".map-mode-nav a").forEach((link) => {
    link.addEventListener("click", () => {
      const target = new URL(link.href);
      const center = state.map.getCenter();
      target.searchParams.set("mapView", [center.lat, center.lng, state.map.getZoom()].join(","));
      link.href = target.href;
    });
  });
}

async function fetchJson(file) {
  const response = await fetch(new URL(`../data/nids-de-poule/${file}`, import.meta.url), { cache: "no-cache" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

function fatalError() {
  state.fatal = true;
  kinds.forEach((kind) => { state[kind].loading = false; });
  renderStatus();
}

async function start() {
  state.worker?.terminate();
  state.worker = null;
  state.fatal = false;
  kinds.forEach((kind) => {
    Object.assign(state[kind], { loading: true, ready: false, features: [], summary: null, snapshot: null });
    state[kind].mapLayer?.clearLayers();
    state.markers.clear();
    byId(`${kind}Fieldset`).disabled = true;
  });
  renderStatus();
  try {
    initializeMap();
    [state.catalog, state.verification] = await Promise.all([fetchJson("index.json"), fetchJson("verification.json").catch(() => null)]);
    for (const kind of kinds) {
      const entries = state.catalog[kind === "reports" ? "signalements" : "reparations"];
      if (!Array.isArray(entries) || !entries.length) throw new Error("Empty catalog");
      initializeYears(entries);
      renderFilterOptions(kind);
      byId(`${kind}Fieldset`).disabled = false;
    }
    state.worker = new Worker(new URL("./potholes-worker.mjs?v=20260930-potholes3", import.meta.url), { type: "module" });
    state.worker.addEventListener("message", handleWorker);
    state.worker.addEventListener("error", fatalError);
    kinds.forEach(requestLayer);
    renderSources();
  } catch {
    fatalError();
  }
}

let searchTimer;
byId("reportSearch").addEventListener("input", () => {
  clearTimeout(searchTimer);
  state.reports.loading = true;
  state.reports.ready = false;
  renderStatus();
  searchTimer = setTimeout(() => requestLayer("reports"), 250);
});
["reportsEnabled", "reportState", "reportDistrict"].forEach((id) => byId(id).addEventListener("change", () => requestLayer("reports")));
byId("reportsRetry").addEventListener("click", () => requestLayer("reports"));
byId("reportYears").addEventListener("change", (event) => {
  if (event.target.id === "allYears") byId("yearOptions").querySelectorAll("input").forEach((input) => { input.checked = event.target.checked; });
  renderYears();
  requestLayer("reports");
});
document.addEventListener("click", (event) => { if (!byId("reportYears").contains(event.target)) byId("reportYears").open = false; });
byId("resetFilters").addEventListener("click", () => {
  byId("reportState").value = "all";
  ["reportSearch", "reportDistrict"].forEach((id) => { byId(id).value = ""; });
  byId("yearOptions").querySelectorAll("input").forEach((input) => { input.checked = Number(input.value) === currentYear(); });
  renderYears();
  kinds.forEach((kind) => { byId(`${kind}Enabled`).checked = true; requestLayer(kind); });
});
byId("moreResults").addEventListener("click", () => { state.listLimit += 16; renderResults(); });
byId("pageRetry").addEventListener("click", start);
byId("closeDetail").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  const bounds = dialog.getBoundingClientRect();
  if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
});
dialog.addEventListener("close", () => { state.detail = null; state.detailQuery = null; state.detailRequest += 1; });
for (const [id, step] of [["previousRecord", -1], ["nextRecord", 1]]) {
  byId(id).addEventListener("click", () => {
    if (!state.detail || !state.detailQuery) return;
    state.detailQuery.offset = state.detail.offset + step;
    requestDetail();
  });
}
byId("menuToggle").addEventListener("click", () => setPanel(!byId("sidePanel").classList.contains("is-open")));
byId("menuBackdrop").addEventListener("click", () => setPanel(false));
document.addEventListener("keydown", (event) => {
  if (dialog.open || !compact.matches || !byId("sidePanel").classList.contains("is-open")) return;
  if (event.key === "Escape") setPanel(false);
  if (event.key === "Tab") {
    const targets = [byId("menuToggle"), ...byId("sidePanel").querySelectorAll('a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), summary')].filter((node) => node.getClientRects().length);
    const first = targets[0];
    const last = targets.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
});
compact.addEventListener("change", () => { setPanel(false); state.map?.invalidateSize(); });
window.addEventListener("languagechange", () => {
  kinds.forEach((kind) => { renderFilterOptions(kind); renderLayer(kind); renderFeatures(kind); });
  renderLegend(); renderSources(); renderResults(); renderStatus(); renderDetail();
});
window.lucide?.createIcons({ attrs: { "aria-hidden": "true", focusable: "false" } });
setPanel(false);
start();