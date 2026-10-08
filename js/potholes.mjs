import {
  normalizeSearch, reportStreet, reportDistrict, pointRadiusForZoom, clusterSizeForCount,
  clampResultsPanelWidth, RESULTS_PANEL_MIN_WIDTH, RESULTS_PANEL_MAX_WIDTH, summarizePotholeCatalog,
} from "./potholes-data.mjs?v=20261008-potholes7";

const byId = (id) => document.getElementById(id);
const locale = () => currentLanguage() === "en" ? "en-CA" : "fr-CA";
const number = (value) => new Intl.NumberFormat(locale(), { maximumFractionDigits: 2 }).format(value);
const currentYear = () => Number(new Intl.DateTimeFormat("en-CA", { year: "numeric", timeZone: "America/Montreal" }).format(new Date()));
const text = (key, values = {}) => t(`potholes.${key}`).replace(/\{(\w+)\}/g, (match, name) => values[name] ?? match);
const compact = window.matchMedia("(max-width: 880px)");
const dialog = byId("potholeDialog");
const kinds = ["reports", "repairs"];
const views = [...kinds, "how", "statistics"];
const statisticsLinks = [...document.querySelectorAll("[data-statistics-tab]")];
const statisticsTabFromUrl = () => {
  const tab = new URLSearchParams(location.search).get("tab");
  return statisticsLinks.some((link) => link.dataset.statisticsTab === tab) ? tab : "summary";
};
const modeFromUrl = () => {
  const mode = new URLSearchParams(location.search).get("mode");
  return views.includes(mode) ? mode : "reports";
};
const isMapMode = (mode = state.mode) => kinds.includes(mode);
const state = {
  mode: modeFromUrl(),
  statisticsTab: statisticsTabFromUrl(),
  catalog: null, verification: null, worker: null, map: null, fatal: false, notice: "",
  viewportRequest: 0, detailRequest: 0, detail: null, detailQuery: null, listLimit: 16, location: null,
  pendingDistrict: null,
  savedMapView: null, catalogLoading: false, catalogError: false, annualCounts: null, rankings: null,
  reports: { version: 0, enabled: modeFromUrl() === "reports", loading: false, ready: false, error: false, features: [] },
  repairs: { version: 0, enabled: modeFromUrl() === "repairs", loading: false, ready: false, error: false, features: [] },
  markers: new Map(),
};
const sources = {
  reports: "https://donnees.montreal.ca/dataset/requete-311",
  repairs: "https://donnees.montreal.ca/dataset/refection-de-chaussee-par-remplissage-mecanise-de-nid-de-poule",
};
let chartsView = null;
let chartsImport = null;
let boroughView = null;
let boroughImport = null;

function syncBoroughView() {
  const active = state.mode === "statistics" && state.statisticsTab === "boroughs";
  if (boroughView) { boroughView.setActive(active); return; }
  if (!active || boroughImport) return;
  boroughImport = import("./potholes-boroughs.mjs?v=20261001-boroughs3").then(({ createBoroughView }) => {
    boroughView = createBoroughView(byId("statisticsBoroughs"));
    boroughView.setActive(state.mode === "statistics" && state.statisticsTab === "boroughs");
  }).catch(() => {
    byId("boroughsStatus").hidden = false;
    byId("boroughsStatus").textContent = text("boroughsLoadError");
    byId("boroughsRetry").hidden = false;
  });
}

function syncChartsView() {
  const active = state.mode === "statistics" && state.statisticsTab === "charts";
  if (chartsView) { chartsView.setActive(active); return; }
  if (!active || chartsImport) return;
  chartsImport = import("./potholes-charts.mjs?v=20261001-charts16").then(({ createStatisticsCharts }) => {
    chartsView = createStatisticsCharts(byId("statisticsCharts"));
    chartsView.setActive(state.mode === "statistics" && state.statisticsTab === "charts");
  }).catch(() => {
    byId("chartsStatus").hidden = false;
    byId("chartsStatus").textContent = text("chartsLoadError");
    byId("chartsRetry").hidden = false;
  });
}

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
  const requestedLocation = new URLSearchParams(location.search).get("location")?.split(",").map(Number);
  const focusedLocation = requestedLocation?.length === 2 && requestedLocation.every(Number.isFinite)
    && requestedLocation[0] >= 45.3 && requestedLocation[0] <= 45.8 && requestedLocation[1] >= -74.1 && requestedLocation[1] <= -73.4;
  const options = byId("yearOptions");
  options.replaceChildren();
  const firstYear = Math.min(...entries.map((entry) => entry.annee));
  const lastYear = Math.max(currentYear(), ...entries.map((entry) => entry.annee));
  Array.from({ length: lastYear - firstYear + 1 }, (unused, index) => lastYear - index).forEach((year) => {
    const label = element("label");
    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = String(year);
    input.checked = previous ? previous.has(year) : focusedLocation || year === currentYear();
    label.append(input, document.createTextNode(String(year)));
    options.append(label);
  });
  renderYears();
}

function reportCountFilters() {
  const minimum = byId("reportCountMin");
  const maximum = byId("reportCountMax");
  const value = (input) => input.value === "" && !input.validity.badInput ? null : input.valueAsNumber;
  const minReports = value(minimum);
  const maxReports = value(maximum);
  const invalidMinimum = minReports !== null && (!Number.isSafeInteger(minReports) || minReports < 0);
  const invalidMaximum = maxReports !== null && (!Number.isSafeInteger(maxReports) || maxReports < 0);
  const inverted = !invalidMinimum && !invalidMaximum && minReports !== null && maxReports !== null && minReports > maxReports;
  const message = invalidMinimum || invalidMaximum ? text("reportCountInvalid") : inverted ? text("reportCountOrder") : "";
  for (const [input, invalid] of [[minimum, invalidMinimum], [maximum, invalidMaximum]]) {
    input.setCustomValidity(invalid || inverted ? message : "");
    input.setAttribute("aria-invalid", String(invalid || inverted));
  }
  byId("reportCountError").textContent = message;
  byId("reportCountError").hidden = !message;
  byId("resetReportCount").disabled = minReports === null && maxReports === null;
  return { minReports, maxReports };
}

function renderFilterOptions(kind) {
  if (kind === "reports") {
    setOptions("reportDistrict", state.reports.summary?.districts || [], "allDistricts");
    renderYears();
    reportCountFilters();
  } else {
    const summary = state.repairs.summary;
    setOptions("repairMonth", summary?.months || [], "allMonths", (value) => new Intl.DateTimeFormat(locale(), {
      month: "long", year: "numeric", timeZone: "UTC",
    }).format(new Date(`${value}-01T00:00:00Z`)));
    setOptions("repairDevice", summary?.devices || [], "allDevices");
  }
}

function setStatisticsUrl(url, mode, tab = state.statisticsTab) {
  if (mode === "statistics" && tab !== "summary") url.searchParams.set("tab", tab);
  else url.searchParams.delete("tab");
  if (mode !== "statistics" || tab !== "boroughs") { url.searchParams.delete("borough"); url.searchParams.delete("period"); }
}

function syncDocumentTitle() {
  const key = state.mode === "statistics"
    ? `potholes.statistics${state.statisticsTab[0].toUpperCase()}${state.statisticsTab.slice(1)}DocumentTitle`
    : { reports: "potholes.documentTitle", repairs: "potholes.repairsDocumentTitle", how: "potholes.howDocumentTitle", statistics: "potholes.statisticsDocumentTitle" }[state.mode];
  document.body.dataset.documentTitle = key;
  document.title = t(key);
}

function renderStatisticsTab() {
  document.body.dataset.statisticsPage = state.statisticsTab;
  syncDocumentTitle();
  for (const link of statisticsLinks) {
    const tab = link.dataset.statisticsTab;
    const selected = tab === state.statisticsTab;
    byId(link.getAttribute("aria-controls")).hidden = !selected;
    if (selected) {
      link.setAttribute("aria-current", "page");
      byId("statisticsView").setAttribute("aria-labelledby", link.dataset.statisticsHeading);
    } else link.removeAttribute("aria-current");
    const url = new URL(location.href);
    url.searchParams.set("mode", "statistics");
    url.hash = "";
    setStatisticsUrl(url, "statistics", tab);
    link.href = url.href;
  }
  syncChartsView();
  syncBoroughView();
}

function updateModeUrl(push = false) {
  const url = new URL(location.href);
  if (push) url.hash = "";
  if (state.mode !== "reports") url.searchParams.set("mode", state.mode);
  else url.searchParams.delete("mode");
  setStatisticsUrl(url, state.mode);
  window.history[push ? "pushState" : "replaceState"]({}, "", url);
}

function renderMode() {
  const repairs = state.mode === "repairs";
  const mapView = isMapMode();
  const titleKey = { reports: "potholes.title", repairs: "potholes.repairsTitle", how: "potholes.howTitle", statistics: "potholes.statisticsTitle" }[state.mode];
  document.body.dataset.potholeView = state.mode;
  document.body.classList.toggle("pothole-reading", !mapView);
  syncDocumentTitle();
  for (const [id, key] of [
    ["potholePageTitle", titleKey],
    ["potholeMapCaption", repairs ? "potholes.repairsTitle" : "nav.potholes"],
    ["viewportPrimaryLabel", repairs ? "potholes.repairsTitle" : "potholes.visiblePotholes"],
    ["viewportSecondaryLabel", repairs ? "potholes.repairLocationsLabel" : "potholes.knownReportsLabel"],
  ]) {
    byId(id).dataset.i18n = key;
    translateElement(byId(id));
  }
  byId("map").dataset.i18nAriaLabel = repairs ? "potholes.repairsMapAria" : "potholes.mapAria";
  translateElement(byId("map"));
  ["sidePanel", "panelResizeHandle", "potholeMapZone", "menuToggle", "mapFilters"].forEach((id) => { byId(id).hidden = !mapView; });
  if (!compact.matches) byId("mapFilters").open = true;
  byId("potholeContent").hidden = mapView;
  byId("howView").hidden = state.mode !== "how";
  byId("statisticsView").hidden = state.mode !== "statistics";
  renderStatisticsTab();
  kinds.forEach((kind) => {
    state[kind].enabled = state.mode === kind;
    byId(`${kind}Fieldset`).hidden = state.mode !== kind;
  });
  document.querySelectorAll("[data-source-mode]").forEach((node) => { node.hidden = node.dataset.sourceMode !== state.mode; });
  document.querySelectorAll("[data-pothole-mode]").forEach((link) => {
    const mode = link.dataset.potholeMode;
    if (mode === state.mode) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
    const url = new URL(location.href);
    if (mode !== "reports") url.searchParams.set("mode", mode);
    else url.searchParams.delete("mode");
    setStatisticsUrl(url, mode);
    link.href = url.href;
  });
  document.querySelectorAll("[data-doc-target]").forEach((link) => {
    const url = new URL(location.href);
    url.hash = link.dataset.docTarget;
    link.href = url.href;
  });
  renderInfoData();
}

function selectMode(mode, push = true) {
  if (!views.includes(mode)) mode = "reports";
  if (mode === state.mode) return;
  if (isMapMode() && state.map) state.savedMapView = { center: state.map.getCenter(), zoom: state.map.getZoom() };
  clearTimeout(searchTimer);
  finishResultsResize();
  setPanel(false);
  if (dialog.open) dialog.close();
  state.detailRequest += 1;
  kinds.forEach((kind) => { setCountsHelp(false, kind); state[kind].mapLayer?.clearLayers(); state[kind].features = []; });
  state.markers.clear();
  state.mode = mode;
  state.listLimit = 16;
  if (push) updateModeUrl(true);
  renderMode();
  byId("potholeContent").scrollTop = 0;
  renderStatus();
  if (!isMapMode()) return;
  renderLayer(mode);
  renderLegend();
  renderSources();
  renderResults();
  renderStatus();
  if (!state.catalog) { if (!state.catalogLoading) start(); return; }
  try { ensureMapEngine(); } catch { fatalError(); return; }
  if (state[mode].ready) { focusSelectedDistrict(); requestViewport(); }
  else requestLayer(mode);
}

function focusSelectedDistrict() {
  const layer = state.reports;
  if (state.mode !== "reports" || !layer.ready || !state.pendingDistrict || layer.district !== state.pendingDistrict) return;
  state.pendingDistrict = null;
  if (!layer.districtBounds) return;
  if (compact.matches && byId("sidePanel").classList.contains("is-open")) setPanel(false);
  const [west, south, east, north] = layer.districtBounds;
  state.map.fitBounds([[south, west], [north, east]], { padding: [24, 24], maxZoom: 14, animate: false });
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
  coverage.textContent = layer.summary ? text(kind === "reports" ? "coverage" : "repairCoverage", { first: formatDate(layer.summary.firstDate), last: formatDate(layer.summary.lastDate) }) : "";
  counts.textContent = layer.loading ? text("loading") : layer.ready && layer.enabled ? text(kind === "reports" ? "reportCounts" : "repairCounts", { count: number(layer.counts.mapped), positions: number(layer.counts.positions) }) : "";
  warning.hidden = !layer.ready || !layer.enabled || (layer.counts.unmapped === 0 && layer.summary.mappableCount !== 0);
  warning.textContent = layer.summary?.mappableCount === 0 ? text("noCoordinates", { count: number(layer.summary.total) }) : text(kind === "reports" ? "excluded" : "repairExcluded", { count: number(layer.counts?.unmapped || 0) });
}

function renderSources() {
  if (!isMapMode()) return;
  byId("verificationDate").textContent = state.verification?.derniereVerification
    ? text("verified", { date: formatDate(state.verification.derniereVerification, true) }) : text("verificationUnavailable");
  const statistics = byId("sourceStatistics");
  statistics.replaceChildren();
  for (const kind of [state.mode]) {
    const layer = state[kind];
    if (!layer.summary || !layer.snapshot) continue;
    statistics.append(element("p", "", text("sourceCount", {
      source: text(kind), year: kind === "reports" ? layer.summary.sourceYears.join(", ") : layer.snapshot.year, count: number(layer.summary.total), mapped: number(layer.summary.mappableCount),
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
  byId("viewportCounts").setAttribute("aria-busy", String(busy));
  if (busy || state.fatal) {
    byId("viewportPrimaryCount").textContent = "-";
    byId("viewportSecondaryCount").textContent = "-";
  }
  byId("withoutRepairs").disabled = state.mode !== "reports" || !state.catalog || state.catalogLoading || state.fatal;
  const statisticsError = state.catalogError || Boolean(state.catalog && !state.catalogLoading && !state.annualCounts);
  byId("infoStatus").hidden = state.mode !== "statistics" || (!state.catalogLoading && !statisticsError);
  byId("infoStatus").textContent = text(statisticsError ? "statisticsLoadError" : "loading");
  byId("infoRetry").hidden = state.mode !== "statistics" || !statisticsError;
}

function renderLegend() {
  const legend = byId("potholeLegend");
  legend.replaceChildren();
  if (!isMapMode()) return;
  const statuses = state.mode === "repairs" ? ["repairs"] : ["active", "presumed-repaired", "unknown"];
  statuses.forEach((status) => {
    const label = element("span");
    const swatch = element("i", `pothole-swatch ${status}`);
    swatch.setAttribute("aria-hidden", "true");
    label.append(swatch, document.createTextNode(status === "repairs" ? text("repairLegend", { year: byId("repairYear").value }) : text(`mapStatus.${status}`)));
    legend.append(label);
  });
  legend.hidden = false;
}

function requestLayer(kind) {
  clearTimeout(searchTimer);
  const layer = state[kind];
  layer.version += 1;
  layer.features = [];
  layer.mapLayer?.clearLayers();
  state.markers.clear();
  layer.enabled = kind === state.mode;
  layer.ready = false;
  layer.loading = layer.enabled && Boolean(state.worker);
  layer.error = false;
  renderLayer(kind);
  renderLegend();
  renderStatus();
  renderResults();
  if (!layer.enabled || !state.catalog || !state.worker) return;
  const filters = kind === "reports" ? {
    years: selectedYears(), status: byId("reportState").value,
    district: byId("reportDistrict").value, search: byId("reportSearch").value,
    withoutRepairs: byId("withoutRepairs").checked,
    ...reportCountFilters(),
  } : { year: Number(byId("repairYear").value), month: byId("repairMonth").value, device: byId("repairDevice").value };
  state.worker.postMessage({ type: "filter", kind, version: layer.version, catalog: state.catalog, filters });
}

function requestViewport() {
  if (!isMapMode() || !state.map || !state.worker) return;
  const bounds = state.map.getBounds();
  state.worker.postMessage({
    type: "viewport", requestId: ++state.viewportRequest,
    bounds: [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()], zoom: state.map.getZoom(),
    versions: Object.fromEntries(kinds.filter((kind) => state[kind].enabled && state[kind].ready).map((kind) => [kind, state[kind].version])),
  });
}

function featureCount(feature) {
  return feature.properties.cluster ? (feature.properties.kind === "repairs" ? feature.properties.interventions : feature.properties.reports) : feature.properties.count;
}

function featurePositionCount(feature) {
  return feature.properties.cluster ? feature.properties.point_count : 1;
}

function featureTitle(feature) {
  if (feature.properties.cluster) return text(feature.properties.kind === "repairs" ? "repairClusterTitle" : "clusterTitle");
  if (feature.properties.kind === "repairs") return text("repairPosition");
  return feature.properties.label || text("unknownStreet");
}

function chooseFeature(feature, kind, { focus = false } = {}) {
  if (state[kind].loading || !state[kind].ready) return;
  const selection = ++state.detailRequest;
  state.map.stop();
  if (feature.properties.cluster) {
    state.worker.postMessage({
      type: "expand", kind, version: state[kind].version,
      clusterId: feature.properties.cluster_id, coordinates: feature.geometry.coordinates,
    });
    if (compact.matches) setPanel(false);
    return;
  }
  const query = { kind, id: feature.properties.id, version: state[kind].version, offset: 0 };
  const openDetail = () => {
    if (selection !== state.detailRequest || state.mode !== kind || query.version !== state[kind].version || !state[kind].ready) return;
    state.detailQuery = query;
    requestDetail();
  };
  if (!focus) { openDetail(); return; }
  if (compact.matches) setPanel(false);
  const center = L.latLng([...feature.geometry.coordinates].reverse());
  const zoom = Math.max(18, state.map.getZoom());
  const atTarget = () => state.map.getZoom() === zoom
    && state.map.project(state.map.getCenter(), zoom).distanceTo(state.map.project(center, zoom)) <= 1;
  const openAfterMove = () => requestAnimationFrame(() => { if (atTarget()) openDetail(); });
  if (atTarget()) { openAfterMove(); return; }
  state.map.once("moveend", openAfterMove);
  state.map.flyTo(center, zoom, {
    animate: !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    duration: 0.45,
  });
}

function renderFeatures(kind) {
  const layer = state[kind];
  if (!layer.mapLayer) return;
  if (!layer.enabled) { layer.mapLayer.clearLayers(); return; }
  const radius = pointRadiusForZoom(state.map.getZoom());
  const css = getComputedStyle(document.body);
  const colors = {
    active: css.getPropertyValue("--pothole-report").trim(),
    repairs: css.getPropertyValue("--pothole-repair").trim(),
    repaired: css.getPropertyValue("--pothole-presumed").trim(),
    unknown: css.getPropertyValue("--pothole-unknown").trim(),
  };
  const visible = new Set(layer.features.map((feature) => feature.properties.id));
  for (const [id, entry] of state.markers) {
    if (!visible.has(id)) { layer.mapLayer.removeLayer(entry.marker); state.markers.delete(id); }
  }
  layer.features.forEach((feature) => {
    const status = feature.properties.status;
    const clustered = Boolean(feature.properties.cluster);
    const coordinates = [...feature.geometry.coordinates].reverse();
    const title = kind === "repairs" ? (clustered ? text("repairClusterTooltip", {
      positions: number(featurePositionCount(feature)), count: number(featureCount(feature)),
    }) : text("repairPointTooltip", {
      count: number(featureCount(feature)),
      period: feature.properties.firstDate === feature.properties.date
        ? text("repairDate", { date: formatDate(feature.properties.date, true) })
        : text("repairPeriod", { first: formatDate(feature.properties.firstDate, true), last: formatDate(feature.properties.date, true) }),
      devices: feature.properties.devices.join(", ") || text("notPublished"),
    })) : clustered ? text("clusterTooltip", {
      positions: number(featurePositionCount(feature)), reports: number(featureCount(feature)),
      active: number(feature.properties.active), repaired: number(feature.properties.repaired), unknown: number(feature.properties.unknown),
    }) : text("pointTooltip", {
      count: number(feature.properties.total), status: text(`mapStatus.${status}`),
      year: feature.properties.firstReport?.slice(0, 4) || text("notPublished"),
      repairs: feature.properties.repairCount === 0 ? text("pointTooltipNone") : number(feature.properties.repairCount),
    });
    const style = {
      radius, color: status === "unknown" ? colors.unknown : "#fff", weight: Math.max(0.6, radius / 5),
      fillOpacity: 0.9, fillColor: kind === "repairs" ? colors.repairs : status === "presumed-repaired" ? colors.repaired : status === "unknown" ? "#fff" : colors.active,
    };
    let icon;
    if (clustered) {
      const count = featurePositionCount(feature);
      const size = clusterSizeForCount(count);
      const label = element("span", "", number(count));
      label.dataset.positionCount = String(count);
      label.style.width = `${size}px`;
      label.style.height = `${size}px`;
      icon = L.divIcon({
        className: `pothole-marker ${status}`, html: label,
        iconSize: [size, size], iconAnchor: [size / 2, size / 2],
      });
    }
    let entry = state.markers.get(feature.properties.id);
    if (!entry) {
      const marker = clustered ? L.marker(coordinates, { icon, title, keyboard: true })
        : L.circleMarker(coordinates, { renderer: state.renderer, ...style });
      entry = { marker, feature };
      marker.on("click", () => chooseFeature(entry.feature, kind));
      marker.addTo(layer.mapLayer);
      state.markers.set(feature.properties.id, entry);
    }
    entry.feature = feature;
    if (clustered) {
      entry.marker.setIcon(icon);
      entry.marker.getElement()?.setAttribute("aria-label", title);
      entry.marker.getElement()?.setAttribute("title", title);
    } else {
      entry.marker.setStyle(style);
    }
    const multiline = !clustered || kind === "reports";
    entry.marker.bindTooltip(element("span", multiline ? "pothole-point-tooltip" : "", title), {
      direction: "top", className: multiline ? "pothole-point-label" : "",
    });
  });
}

function renderResults() {
  if (!isMapMode()) return;
  const buckets = [state.mode].map((kind) => state[kind].features.map((feature) => ({ feature, kind }))
    .sort((left, right) => featureCount(right.feature) - featureCount(left.feature)));
  const rows = [];
  for (let index = 0; index < Math.max(...buckets.map((bucket) => bucket.length)); index += 1) {
    buckets.forEach((bucket) => { if (bucket[index]) rows.push(bucket[index]); });
  }
  const counts = Object.fromEntries(kinds.map((kind) => [kind, state[kind].features.reduce((sum, feature) => sum + featureCount(feature), 0)]));
  const positionCount = rows.reduce((count, entry) => count + featurePositionCount(entry.feature), 0);
  const ready = state[state.mode].ready && !state[state.mode].loading;
  byId("viewportPrimaryCount").textContent = ready ? number(state.mode === "repairs" ? counts.repairs : positionCount) : "-";
  byId("viewportSecondaryCount").textContent = ready ? number(state.mode === "repairs" ? positionCount : counts.reports) : "-";
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
    content.append(element("small", "", feature.properties.cluster ? text(kind === "repairs" ? "repairClusterEvents" : "clusterReports", { count: number(featureCount(feature)) })
      : kind === "repairs" ? [formatDate(feature.properties.date, true), feature.properties.devices.join(", ")].filter(Boolean).join(" \u00b7 ")
      : [text(`mapStatus.${feature.properties.status}`), feature.properties.district].filter(Boolean).join(" \u00b7 ")));
    button.append(swatch, content, element("span", "pothole-result-count", number(feature.properties.cluster ? featurePositionCount(feature) : featureCount(feature))));
    button.addEventListener("click", () => chooseFeature(feature, kind, { focus: true }));
    item.append(button);
    list.append(item);
  });
  byId("moreResults").hidden = rows.length <= state.listLimit;
  const empty = byId("emptyResults");
  empty.hidden = rows.length > 0 || state[state.mode].loading;
  empty.textContent = text(state.mode === "repairs" ? "repairEmpty" : "empty");
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
    const timeline = [...history.timeline].reverse();
    const list = element("ol", "pothole-timeline");
    const more = element("button", "pothole-text-button", text("moreHistory"));
    more.type = "button";
    let limit = 0;
    const appendEvents = () => {
      timeline.slice(limit, limit + 40).forEach((event) => {
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
      more.hidden = limit >= timeline.length;
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
    const sinceRepair = detail.reportsSinceLastRepair;
    row(summary, "reportsSinceLastRepair", !Number.isInteger(sinceRepair) ? text("reportCountUnavailable")
      : detail.history.latestRepair ? number(sinceRepair) : text("reportsWithoutRepair"));
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
    row(fields, "repairSelectedCount", number(detail.position.count));
    row(fields, "observedTime", formatDate(record.horodatage, true));
    row(fields, "device", record.appareil);
    row(fields, "coordinates", `${record.latitude}, ${record.longitude}`);
    row(fields, "repairFirst", formatDate(detail.position.firstDate, true));
    row(fields, "repairLast", formatDate(detail.position.lastDate, true));
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
  byId("recordPage").textContent = text(isReport ? "recordPage" : "repairRecordPage", { current: number(detail.offset + 1), total: number(detail.total) });
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
    if (message.kind === "reports") Object.assign(layer, { district: message.district, districtBounds: message.districtBounds });
    renderFilterOptions(message.kind);
    renderLayer(message.kind);
    renderSources();
    renderStatus();
    if (layer.enabled) { focusSelectedDistrict(); requestViewport(); }
  } else if (message.type === "detail" && layer.enabled && message.requestId === state.detailRequest && dialog.open) {
    state.detail = message;
    renderDetail();
  } else if (message.type === "expand" && layer.enabled) {
    state.map.setView([...message.coordinates].reverse(), Math.min(19, message.zoom));
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

function helpId(kind = state.mode) {
  return kind === "repairs" ? "repairsCountsHelp" : "countsHelp";
}

function setCountsHelp(open, kind = state.mode) {
  const id = helpId(kind);
  byId(id).hidden = !open;
  byId(`${id}Button`).setAttribute("aria-expanded", String(open));
  if (open) byId(id).scrollIntoView({ block: "nearest" });
}

function setPanel(open) {
  const isOpen = isMapMode() && compact.matches && open;
  byId("sidePanel").classList.toggle("is-open", isOpen);
  byId("sidePanel").inert = compact.matches && !isOpen;
  byId("menuToggle").classList.toggle("is-open", isOpen);
  byId("menuToggle").setAttribute("aria-expanded", String(isOpen));
  byId("menuBackdrop").hidden = !isOpen;
  byId("potholeMapZone").inert = isOpen;
  if (!isOpen) kinds.forEach((kind) => setCountsHelp(false, kind));
  if (compact.matches && isMapMode()) {
    if (isOpen) byId("sidePanel").focus({ preventScroll: true });
    else byId("menuToggle").focus({ preventScroll: true });
  }
}

function initializeMap() {
  if (state.map) return;
  if (!window.L) throw new Error("Map library unavailable");
  const defaultCenter = [45.5019, -73.5674];
  const requested = new URLSearchParams(location.search).get("mapView")?.split(",").map(Number);
  const validView = requested?.length === 3 && requested.every(Number.isFinite)
    && requested[0] >= 45.3 && requested[0] <= 45.8 && requested[1] >= -74.1 && requested[1] <= -73.4
    && requested[2] >= 10 && requested[2] <= 19;
  state.map = L.map("map", { preferCanvas: true, zoomControl: false, minZoom: 10, maxZoom: 19 })
    .setView(validView ? requested.slice(0, 2) : defaultCenter, validView ? requested[2] : 12);
  state.renderer = L.canvas({ padding: 1 });
  const toolbar = byId("potholeToolbar");
  const layoutObserver = new ResizeObserver(() => {
    if (!isMapMode()) return;
    document.body.style.setProperty("--pothole-toolbar-height", `${Math.ceil(toolbar.getBoundingClientRect().height)}px`);
    state.map.invalidateSize({ animate: false, pan: true, debounceMoveend: true });
  });
  layoutObserver.observe(toolbar);
  layoutObserver.observe(byId("potholeMapZone"));
  const tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "&copy; OpenStreetMap contributors" }).addTo(state.map);
  tiles.on("tileerror", () => { state.notice = "tileError"; renderStatus(); });
  kinds.forEach((kind) => { state[kind].mapLayer = L.layerGroup().addTo(state.map); });
  state.map.on("moveend", requestViewport);
  byId("zoomIn").addEventListener("click", () => state.map.zoomIn());
  byId("zoomOut").addEventListener("click", () => state.map.zoomOut());
  byId("resetMap").addEventListener("click", () => state.map.setView(defaultCenter, 12));
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
  document.querySelectorAll(".pothole-road-link").forEach((link) => {
    link.addEventListener("click", () => {
      const target = new URL(link.href);
      const center = state.map.getCenter();
      target.searchParams.set("mapView", [center.lat, center.lng, state.map.getZoom()].join(","));
      link.href = target.href;
    });
  });
}

async function fetchJson(file) {
  const response = await fetch(new URL(`../data/nids-de-poule/${file}`, import.meta.url), { cache: "no-store" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

function updateStatisticsTableLimits() {
  const visibleYears = 5;
  document.querySelectorAll(".pothole-ranking-pair").forEach((pair) => {
    if (!pair.getClientRects().length) return;
    pair.style.removeProperty("--ranking-header-height");
    pair.style.removeProperty("--ranking-row-height");
    if (!window.matchMedia("(min-width: 1001px)").matches) return;
    const headers = [...pair.querySelectorAll("thead tr")];
    const rows = [...pair.querySelectorAll("tbody tr")];
    pair.style.setProperty("--ranking-header-height", `${Math.max(...headers.map((row) => row.getBoundingClientRect().height))}px`);
    pair.style.setProperty("--ranking-row-height", `${Math.max(...rows.map((row) => row.getBoundingClientRect().height))}px`);
  });
  document.querySelectorAll("#statisticsView .pothole-table-scroll").forEach((container) => {
    if (!container.getClientRects().length) return;
    const table = container.querySelector("table");
    const rows = table.tBodies[0]?.rows;
    const scrollable = rows && rows.length > visibleYears;
    container.classList.toggle("has-year-overflow", Boolean(scrollable));
    if (!scrollable) {
      container.style.maxHeight = "";
      return;
    }
    const visibleRowsHeight = rows[visibleYears - 1].getBoundingClientRect().bottom - table.getBoundingClientRect().top;
    const horizontalScrollbarHeight = container.offsetHeight - container.clientHeight;
    container.style.maxHeight = `${visibleRowsHeight + horizontalScrollbarHeight}px`;
  });
}

const statisticsTableSelections = new Map();

function addStatisticsTableControls(table, key, columns, values) {
  let selection = statisticsTableSelections.get(key);
  if (!selection) {
    selection = { column: -1, direction: 0, filters: new Map() };
    statisticsTableSelections.set(key, selection);
  }
  const body = table.tBodies[0];
  const rows = values.map((cells, index) => ({ cells, row: body.rows[index], index }));
  const collator = new Intl.Collator(locale(), { numeric: true, sensitivity: "base" });
  const header = table.tHead.rows[0];
  header.replaceChildren();
  table.dataset.tableControls = key;
  const controls = columns.map(([label, filterable], column) => {
    const cell = element("th");
    cell.scope = "col";
    const button = element("button", "pothole-table-sort");
    button.type = "button";
    button.dataset.sortColumn = column;
    cell.append(button);
    if (filterable) {
      const select = element("select", "pothole-column-filter");
      select.dataset.filterColumn = column;
      select.setAttribute("aria-label", text("tableFilter", { column: text(label) }));
      select.title = select.getAttribute("aria-label");
      select.add(new Option(text("tableAll"), ""));
      const options = [...new Set(values.map((entry) => entry[column]).filter((value) => value != null).map(String))].sort(collator.compare);
      options.forEach((value) => select.add(new Option(value, value)));
      if (!options.includes(selection.filters.get(column))) selection.filters.delete(column);
      select.value = selection.filters.get(column) || "";
      select.disabled = !options.length;
      select.addEventListener("change", () => {
        if (select.value) selection.filters.set(column, select.value);
        else selection.filters.delete(column);
        render();
      });
      cell.append(select);
    }
    button.addEventListener("click", () => {
      selection.direction = selection.column !== column ? 1 : selection.direction === 1 ? -1 : selection.direction === -1 ? 0 : 1;
      selection.column = selection.direction ? column : -1;
      render();
    });
    header.append(cell);
    return { cell, button, label };
  });
  function render() {
    const filtered = rows.filter((entry) => [...selection.filters].every(([column, value]) => String(entry.cells[column] ?? "") === value));
    if (selection.direction) filtered.sort((left, right) => {
      const leftValue = left.cells[selection.column];
      const rightValue = right.cells[selection.column];
      if (leftValue == null || rightValue == null) return leftValue == null ? rightValue == null ? left.index - right.index : 1 : -1;
      const comparison = typeof leftValue === "number" && typeof rightValue === "number" ? leftValue - rightValue : collator.compare(String(leftValue), String(rightValue));
      return selection.direction * comparison || left.index - right.index;
    });
    body.replaceChildren(...filtered.map((entry) => entry.row));
    if (!filtered.length) {
      const cell = body.insertRow().insertCell();
      cell.colSpan = columns.length;
      cell.textContent = text("rankNoResults");
    }
    controls.forEach(({ cell, button, label }, column) => {
      const direction = selection.column === column ? selection.direction : 0;
      cell.setAttribute("aria-sort", direction === 1 ? "ascending" : direction === -1 ? "descending" : "none");
      const action = text(direction === 1 ? "tableSortDescending" : direction === -1 ? "tableSortReset" : "tableSortAscending", { column: text(label) });
      button.title = action;
      button.setAttribute("aria-label", action);
      const icon = element("i");
      icon.dataset.lucide = direction === 1 ? "arrow-up" : direction === -1 ? "arrow-down" : "arrow-up-down";
      icon.setAttribute("aria-hidden", "true");
      button.replaceChildren(element("span", "", text(label)), icon);
    });
    window.lucide?.createIcons();
    updateStatisticsTableLimits();
  }
  render();
}

const rankingTables = [
  ["emplacementsSignales", "rankMostReported", "rankAllReportsNote", [["location", "rankLocation"], ["signalements", "rankReports"], ["colmatages", "rankNearbyRepairs"]]],
  ["emplacementsColmates", "rankMostPatched", "rankNearbyRepairsNote", [["location", "rankLocation"], ["colmatages", "rankNearbyRepairs"], ["signalements", "rankReports"]]],
  ["ruesEmplacements", "rankStreetLocations", "rankStreetLocationsNote", [["rue", "rankStreet"], ["emplacements", "rankLocations"], ["signalements", "rankReports"]]],
  ["ruesRecurrences", "rankStreetReturns", "rankStreetReturnsNote", [["rue", "rankStreet"], ["emplacementsRecurrents", "rankRecurringLocations"], ["reapparitions", "rankReturns"], ["colmatagesRecurrents", "rankNearbyRepairs"]]],
  ["ruesColmatages", "rankStreetPatching", "rankStreetPatchingNote", [["rue", "rankStreet"], ["colmatages", "rankRepairs"]]],
  ["emplacementsSansColmatage", "rankUnpatched", "rankUnpatchedNote", [["location", "rankLocation"], ["signalementsPeriodeColmatages", "rankReports"], ["premierSignalement", "rankFirstReport"]]],
  ["ruesAnciennes", "rankOldest", "rankOldestNote", [["rue", "rankStreet"], ["plusAncienSansColmatage", "rankFirstReport"], ["sansColmatage", "rankUnpatchedLocations"]]],
  ["ruesRatio", "rankRatioHeading", "rankRatioNote", [["rue", "rankStreet"], ["colmatages", "rankRepairs"], ["signalementsComparables", "rankReports"], ["ratio", "rankRatio"]]],
  ["machines", "rankMachines", "rankMachinesNote", [["appareil", "rankMachine"], ["colmatages", "rankRepairs"], ["derniereAnnee", "rankLastYear"]]],
  ["machinesAbsentes", "rankUnusedMachines", "rankUnusedMachinesNote", [["appareil", "rankMachine"], ["derniereAnnee", "rankLastYear"], ["colmatages", "rankRepairs"]]],
];

function renderRankings() {
  const rankings = state.rankings;
  const target = byId("statisticsRankingTables");
  target.replaceChildren();
  byId("rankingsStatus").hidden = Boolean(rankings);
  byId("rankingsStatus").textContent = rankings ? "" : text("rankingsUnavailable");
  byId("rankingsRetry").hidden = Boolean(rankings);
  byId("rankingsCoverage").textContent = "";
  byId("statisticsRankings").querySelector("details").hidden = !rankings;
  if (!rankings) return;
  const coverage = rankings.couverture;
  const values = { year: coverage.derniereAnnee };
  byId("rankingsCoverage").textContent = text("rankingsCoverage", {
    first: formatDate(coverage.premierColmatage), last: formatDate(coverage.dernierColmatage),
  });
  byId("rankingsGeography").textContent = text("rankingsGeography", {
    radius: number(coverage.rayonRueM), matched: number(coverage.colmatagesAttribues), ambiguous: number(coverage.colmatagesAmbigus),
    excluded: number(coverage.colmatagesHorsRue + coverage.colmatagesInvalides + coverage.colmatagesSansIdentification),
    unidentified: number(coverage.colmatagesSansIdentification), duplicates: number(coverage.doublonsColmatages),
  });
  byId("rankingsLocationsCoverage").textContent = text("rankingsLocationsCoverage", {
    matched: number(coverage.emplacementsAttribues), excluded: number(coverage.emplacementsNonAttribues),
    unidentified: number(coverage.emplacementsSansIdentification),
  });
  byId("rankingsGeobase").textContent = text("rankingsGeobase", { date: formatDate(rankings.geobase.recupereLe) });
  byId("rankingsRtss").textContent = text("rankingsRtss", {
    date: formatDate(rankings.rtss.recupereLe), identified: number(rankings.identificationRues.generiquesResolus),
    total: number(rankings.identificationRues.generiques), remaining: number(rankings.identificationRues.generiquesNonResolus),
  });
  for (let index = 0; index < rankingTables.length; index += 2) {
    const pair = element("div", "pothole-ranking-pair");
    for (const [key, headingKey, noteKey, columns] of rankingTables.slice(index, index + 2)) {
      const section = element("section", "pothole-ranking-panel");
      const heading = element("h3", "", text(headingKey, values));
      heading.id = `ranking-${key}-heading`;
      section.setAttribute("aria-labelledby", heading.id);
      const container = element("div", "pothole-table-scroll");
      container.tabIndex = 0;
      container.setAttribute("aria-labelledby", heading.id);
      const table = element("table", "pothole-statistics-table pothole-ranking-table");
      table.dataset.ranking = key;
      const head = table.createTHead().insertRow();
      for (const [, label] of columns) {
        const cell = element("th", "", text(label));
        cell.scope = "col";
        head.append(cell);
      }
      const body = table.createTBody();
      for (const entry of rankings[key]) {
        const row = body.insertRow();
        columns.forEach(([field], columnIndex) => {
          const cell = element(columnIndex === 0 ? "th" : "td");
          if (columnIndex === 0) cell.scope = "row";
          if (field === "location" || field === "rue") {
            const label = field === "location" ? entry.rues[0] || text("rankLocation") : entry.rue;
            cell.append(element("span", "pothole-ranking-place", label));
            const districts = [...new Map(entry.arrondissements.map((district) => [normalizeSearch(district).replace(/\s*-\s*/g, "-"), district])).values()];
            if (districts.length) {
              const districtLabel = element("small", "pothole-ranking-meta", field === "rue" && districts.length > 1
                ? text("rankDistricts", { count: number(districts.length) }) : districts.join(", "));
              districtLabel.title = districts.join(", ");
              cell.append(districtLabel);
            }
            if (field === "location") {
              cell.title = entry.rues.join(" | ");
              cell.append(element("small", "pothole-ranking-meta", `${entry.latitude.toFixed(5)}, ${entry.longitude.toFixed(5)}`));
            }
          } else if (field === "premierSignalement" || field === "plusAncienSansColmatage") cell.textContent = formatDate(entry[field]);
          else if (field === "derniereAnnee") cell.textContent = entry[field] == null ? text("notPublished") : String(entry[field]);
          else cell.textContent = typeof entry[field] === "number" ? number(entry[field]) : entry[field];
          row.append(cell);
        });
      }
      if (!rankings[key].length) {
        const cell = body.insertRow().insertCell();
        cell.colSpan = columns.length;
        cell.textContent = text("rankNoResults");
      }
      addStatisticsTableControls(table, key, columns.map(([field, label]) => [label, ["location", "rue", "appareil", "derniereAnnee"].includes(field)]),
        rankings[key].map((entry) => columns.map(([field]) => field === "location" ? entry.rues[0] || text("rankLocation") : entry[field])));
      container.append(table);
      section.append(heading, element("p", "pothole-ranking-note", text(noteKey, values)), container);
      pair.append(section);
    }
    target.append(pair);
  }
}

function renderInfoData() {
  const statistics = state.catalog ? summarizePotholeCatalog(state.catalog, state.annualCounts || []) : null;
  const updatedText = statistics?.dataUpdatedAt
    ? text("dataUpdated", { date: formatDate(statistics.dataUpdatedAt, true) }) : text("dataUpdateUnavailable");
  byId("howVerified").textContent = updatedText;
  byId("statisticsVerified").textContent = updatedText;
  const latest = statistics?.latestRepairs;
  byId("howMatchingRadius").textContent = state.catalog ? text("howRadius", { radius: number(state.catalog.rayonAppariementM) }) : "";
  byId("statisticsData").hidden = !statistics?.hasRequestBreakdown;
  byId("statisticsRankings").hidden = !statistics?.hasRequestBreakdown;
  if (!statistics?.hasRequestBreakdown) return;
  const metrics = byId("statisticsMetrics");
  metrics.replaceChildren();
  for (const [key, value] of [
    ["statisticsLatestReports", statistics.latestReports.reportCount],
    ["statisticsLatestInformation", statistics.latestReports.informationCount],
  ]) {
    const item = element("div");
    item.append(element("dt", "", text(key, { year: statistics.latestReports?.annee || "" })), element("dd", "", number(value)));
    metrics.append(item);
  }
  const reports = byId("statisticsReportRows");
  reports.replaceChildren();
  byId("statisticsReportsTotal").textContent = text("statisticsReportsTotal", { count: number(statistics.totalReports) });
  const largest = Math.max(...statistics.reports.flatMap((entry) => [entry.reportCount, entry.informationCount]), 1);
  for (const entry of statistics.reports) {
    const line = element("tr");
    const year = element("th", "", String(entry.annee));
    year.scope = "row";
    line.append(year);
    for (const [value, className] of [[entry.reportCount, "pothole-stat-volume"], [entry.informationCount, "pothole-stat-volume pothole-stat-information"]]) {
      const volume = element("td", className);
      const bar = element("span", "pothole-stat-bar");
      bar.style.width = `${100 * value / largest}%`;
      bar.setAttribute("aria-hidden", "true");
      const track = element("span", "pothole-stat-track");
      track.append(bar);
      volume.append(track, element("span", "", number(value)));
      line.append(volume);
    }
    reports.append(line);
  }
  const repairs = byId("statisticsRepairRows");
  repairs.replaceChildren();
  byId("statisticsRepairsTotal").textContent = text("statisticsRepairsTotal", { count: number(statistics.totalInterventions) });
  for (const entry of statistics.repairs) {
    const line = element("tr");
    const year = element("th", "", String(entry.annee));
    year.scope = "row";
    line.append(year, element("td", "", number(entry.nombre)), element("td", "", formatDate(entry.premiereIntervention)), element("td", "", formatDate(entry.derniereIntervention)));
    repairs.append(line);
  }
  addStatisticsTableControls(reports.closest("table"), "reports", [["statisticsYear", true], ["statisticsRequests"], ["statisticsInformation"]],
    statistics.reports.map((entry) => [entry.annee, entry.reportCount, entry.informationCount]));
  addStatisticsTableControls(repairs.closest("table"), "repairs", [["repairYear", true], ["repairEventsLabel"], ["statisticsFirstDate"], ["statisticsLastDate"]],
    statistics.repairs.map((entry) => [entry.annee, entry.nombre, entry.premiereIntervention, entry.derniereIntervention]));
  renderRankings();
  statisticsTableObserver.disconnect();
  document.querySelectorAll("#statisticsView .pothole-statistics-table").forEach((table) => statisticsTableObserver.observe(table));
  updateStatisticsTableLimits();
}

function ensureMapEngine() {
  const existing = Boolean(state.map);
  initializeMap();
  if (existing) {
    state.map.invalidateSize({ animate: false, pan: false });
    if (state.savedMapView) state.map.setView(state.savedMapView.center, state.savedMapView.zoom, { animate: false });
  }
  if (!state.worker) {
    state.worker = new Worker(new URL("./potholes-worker.mjs?v=20261008-potholes7", import.meta.url), { type: "module" });
    state.worker.addEventListener("message", handleWorker);
    state.worker.addEventListener("error", fatalError);
  }
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
  state.catalogLoading = true;
  state.catalogError = false;
  state.annualCounts = null;
  state.rankings = null;
  renderMode();
  kinds.forEach((kind) => {
    Object.assign(state[kind], { loading: kind === state.mode, ready: false, features: [], summary: null, snapshot: null });
    state[kind].mapLayer?.clearLayers();
    state.markers.clear();
    byId(`${kind}Fieldset`).disabled = true;
  });
  renderStatus();
  try {
    const [catalog, verification, annual] = await Promise.all([
      fetchJson("index.json"), fetchJson("verification.json").catch(() => null), fetchJson("statistiques.json").catch(() => null),
    ]);
    state.catalog = catalog;
    state.verification = verification;
    const matches = annual?.origine?.indexModifieLe === catalog.contenuModifieLe
      && Array.isArray(annual?.annees) && Array.isArray(annual?.origine?.signalements)
      && catalog.signalements.every((entry) => annual.origine.signalements.some(([file, modified]) => file === entry.fichier && modified === entry.contenuModifieLe));
    if (matches && summarizePotholeCatalog(catalog, annual.annees).hasRequestBreakdown) state.annualCounts = annual.annees;
    const rankings = annual?.classements;
    const repairsMatch = Array.isArray(annual?.origine?.reparations)
      && catalog.reparations.every((entry) => annual.origine.reparations.some(([file, modified]) => file === entry.fichier && modified === entry.contenuModifieLe));
    if (state.annualCounts && repairsMatch && rankings?.schemaVersion === 2 && rankings.couverture && rankings.geobase && rankings.rtss && rankings.identificationRues
      && rankingTables.every(([key]) => Array.isArray(rankings[key]))) state.rankings = rankings;
    for (const kind of kinds) {
      const entries = state.catalog[kind === "reports" ? "signalements" : "reparations"];
      if (!Array.isArray(entries) || !entries.length) throw new Error("Empty catalog");
      if (kind === "reports") initializeYears(entries);
      else setOptions("repairYear", entries.map((entry) => entry.annee).sort((left, right) => right - left));
      renderFilterOptions(kind);
      byId(`${kind}Fieldset`).disabled = false;
    }
    state.catalogLoading = false;
    renderInfoData();
    if (isMapMode()) { ensureMapEngine(); requestLayer(state.mode); renderSources(); }
    renderStatus();
  } catch {
    state.catalog = null;
    state.catalogLoading = false;
    state.catalogError = true;
    renderInfoData();
    fatalError();
  }
}

let searchTimer;
["reportSearch", "reportCountMin", "reportCountMax"].forEach((id) => byId(id).addEventListener("input", () => {
  reportCountFilters();
  clearTimeout(searchTimer);
  state.reports.loading = true;
  state.reports.ready = false;
  renderStatus();
  searchTimer = setTimeout(() => requestLayer("reports"), 250);
}));
byId("resetReportCount").addEventListener("click", () => {
  byId("reportCountMin").value = "";
  byId("reportCountMax").value = "";
  requestLayer("reports");
});
byId("reportState").addEventListener("change", () => requestLayer("reports"));
byId("withoutRepairs").addEventListener("change", () => requestLayer("reports"));
byId("reportDistrict").addEventListener("change", () => {
  state.pendingDistrict = byId("reportDistrict").value || null;
  requestLayer("reports");
});
byId("reportsRetry").addEventListener("click", () => requestLayer("reports"));
byId("repairsRetry").addEventListener("click", () => requestLayer("repairs"));
["repairYear", "repairMonth", "repairDevice"].forEach((id) => byId(id).addEventListener("change", () => {
  if (id === "repairYear") {
    state.repairs.summary = null;
    state.repairs.snapshot = null;
    byId("repairMonth").value = "";
    byId("repairDevice").value = "";
    renderFilterOptions("repairs");
  }
  requestLayer("repairs");
}));
byId("reportYears").addEventListener("change", (event) => {
  if (event.target.id === "allYears") byId("yearOptions").querySelectorAll("input").forEach((input) => { input.checked = event.target.checked; });
  renderYears();
  requestLayer("reports");
});
document.addEventListener("click", (event) => {
  if (!byId("reportYears").contains(event.target)) byId("reportYears").open = false;
  kinds.forEach((kind) => { if (!byId(`${helpId(kind)}Area`).contains(event.target)) setCountsHelp(false, kind); });
});
kinds.forEach((kind) => byId(`${helpId(kind)}Button`).addEventListener("click", () => setCountsHelp(byId(helpId(kind)).hidden, kind)));
document.querySelectorAll("[data-pothole-mode]").forEach((link) => link.addEventListener("click", (event) => {
  if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  selectMode(link.dataset.potholeMode);
}));
statisticsLinks.forEach((link) => link.addEventListener("click", (event) => {
  if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  if (state.statisticsTab === link.dataset.statisticsTab) return;
  state.statisticsTab = link.dataset.statisticsTab;
  updateModeUrl(true);
  renderStatisticsTab();
  updateStatisticsTableLimits();
  byId("potholeContent").scrollTop = 0;
}));
window.addEventListener("popstate", () => {
  state.statisticsTab = statisticsTabFromUrl();
  selectMode(modeFromUrl(), false);
  renderStatisticsTab();
  updateStatisticsTableLimits();
});
byId("moreResults").addEventListener("click", () => { state.listLimit += 16; renderResults(); });
byId("pageRetry").addEventListener("click", start);
byId("infoRetry").addEventListener("click", start);
byId("rankingsRetry").addEventListener("click", start);
byId("chartsRetry").addEventListener("click", () => {
  if (chartsView) chartsView.retry();
  else { chartsImport = null; syncChartsView(); }
});
byId("boroughsRetry").addEventListener("click", () => {
  if (boroughView) boroughView.retry();
  else { boroughImport = null; syncBoroughView(); }
});
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
const resultsResizeHandle = byId("panelResizeHandle");
let resultsResizeStart = null;

function setResultsPanelWidth(width) {
  const value = clampResultsPanelWidth(width);
  document.body.style.setProperty("--panel-width", `${value}px`);
  resultsResizeHandle.setAttribute("aria-valuenow", String(value));
}

function finishResultsResize() {
  resultsResizeStart = null;
  document.body.classList.remove("is-resizing-panel");
}

resultsResizeHandle.addEventListener("pointerdown", (event) => {
  if (!isMapMode() || compact.matches || event.button !== 0) return;
  event.preventDefault();
  resultsResizeStart = { pointerId: event.pointerId, startX: event.clientX, startWidth: byId("sidePanel").getBoundingClientRect().width };
  resultsResizeHandle.setPointerCapture(event.pointerId);
  document.body.classList.add("is-resizing-panel");
});
resultsResizeHandle.addEventListener("pointermove", (event) => {
  if (!resultsResizeStart || event.pointerId !== resultsResizeStart.pointerId) return;
  setResultsPanelWidth(resultsResizeStart.startWidth + event.clientX - resultsResizeStart.startX);
});
["pointerup", "pointercancel", "lostpointercapture"].forEach((name) => resultsResizeHandle.addEventListener(name, finishResultsResize));
resultsResizeHandle.addEventListener("dblclick", () => setResultsPanelWidth(RESULTS_PANEL_MAX_WIDTH));
resultsResizeHandle.addEventListener("keydown", (event) => {
  if (!isMapMode() || compact.matches) return;
  const width = byId("sidePanel").getBoundingClientRect().width;
  const values = { ArrowLeft: width - 10, ArrowRight: width + 10, Home: RESULTS_PANEL_MIN_WIDTH, End: RESULTS_PANEL_MAX_WIDTH };
  if (!(event.key in values)) return;
  event.preventDefault();
  setResultsPanelWidth(values[event.key]);
});

byId("menuToggle").addEventListener("click", () => setPanel(!byId("sidePanel").classList.contains("is-open")));
byId("menuBackdrop").addEventListener("click", () => setPanel(false));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !byId(helpId()).hidden) {
    setCountsHelp(false);
    byId(`${helpId()}Button`).focus();
    event.preventDefault();
    return;
  }
  if (dialog.open || !compact.matches || !byId("sidePanel").classList.contains("is-open")) return;
  if (event.key === "Escape") setPanel(false);
  if (event.key === "Tab") {
    const targets = [...byId("potholeToolbar").querySelectorAll('a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), summary'), byId("menuToggle"), ...byId("sidePanel").querySelectorAll('a[href], button:not(:disabled), input:not(:disabled), summary')].filter((node) => node.getClientRects().length);
    const first = targets[0];
    const last = targets.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
});
compact.addEventListener("change", () => { byId("mapFilters").open = !compact.matches; finishResultsResize(); setPanel(false); if (isMapMode()) state.map?.invalidateSize(); });
window.addEventListener("languagechange", () => {
  updateModeUrl();
  renderMode();
  kinds.forEach((kind) => { renderFilterOptions(kind); renderLayer(kind); renderFeatures(kind); });
  renderLegend(); renderSources(); renderResults(); renderStatus(); renderDetail();
});
const statisticsTableObserver = new ResizeObserver(updateStatisticsTableLimits);
document.querySelectorAll("#statisticsData .pothole-statistics-table").forEach((table) => statisticsTableObserver.observe(table));
const statisticsDockObserver = new ResizeObserver(() => {
  byId("potholeContent").style.setProperty("--statistics-dock-height", `${Math.max(20, byId("statisticsDock").getBoundingClientRect().height + 16)}px`);
});
statisticsDockObserver.observe(byId("statisticsDock"));
window.lucide?.createIcons({ attrs: { "aria-hidden": "true", focusable: "false" } });
setPanel(false);
start();