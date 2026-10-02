import { loadChartLibrary, chartConfig } from "./potholes-charts.mjs?v=20261001-charts16";
import { normalizeSearch } from "./potholes-data.mjs?v=20261001-potholes25";

const locale = () => window.currentLanguage() === "en" ? "en-CA" : "fr-CA";
const text = (key, values = {}) => window.t(`potholes.${key}`).replace(/\{(\w+)\}/g, (match, name) => values[name] ?? match);
const number = (value) => value == null ? text("chartsUnavailableValue") : new Intl.NumberFormat(locale(), { maximumFractionDigits: 1 }).format(value);
const share = (count, total) => total ? count / total * 100 : null;
const percent = (value) => value === null ? text("chartsUnavailableValue") : new Intl.NumberFormat(locale(), { style: "percent", maximumFractionDigits: 1 }).format(value / 100);
const date = (value) => value ? new Intl.DateTimeFormat(locale(), { dateStyle: "medium", timeZone: "UTC" }).format(new Date(value)) : text("notPublished");
const node = (tag, className = "", content = "") => {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = content;
  return element;
};

function matchesSources(origin, catalog) {
  return origin?.indexModifieLe === catalog?.contenuModifieLe && ["signalements", "reparations"].every((key) =>
    Array.isArray(origin[key]) && Array.isArray(catalog[key]) && origin[key].length === catalog[key].length
    && catalog[key].every((entry) => origin[key].some(([file, modified]) => entry.fichier === file && entry.contenuModifieLe === modified)));
}

function validateProfile(profile, descriptor, index) {
  const count = (value) => Number.isInteger(value) && value >= 0;
  if (profile?.schemaVersion !== 1 || profile.id !== descriptor.id || profile.nom !== descriptor.nom || profile.version !== descriptor.version
    || JSON.stringify(profile.origine) !== JSON.stringify(index.origine) || !Array.isArray(profile.periodes) || profile.periodes.length !== index.periodes.length) throw new Error("Stale borough profile");
  for (const period of profile.periodes) {
    if (!index.periodes.some((entry) => entry.id === period.id) || !Array.isArray(period.annuels) || !period.annuels.length
      || !period.annuels.every((entry) => Number.isInteger(entry.annee) && (entry.signalements === null || count(entry.signalements)))
      || period.persistance?.classes?.length !== 5 || !period.persistance.classes.every(count)
      || !period.indicateurs || !Object.values(period.indicateurs).every(count)
      || !Array.isArray(period.emplacements) || period.emplacements.length !== period.indicateurs.emplacements
      || period.persistance.classes.reduce((sum, value) => sum + value, 0) !== period.indicateurs.emplacements
      || !count(period.retours?.revenus) || !count(period.retours?.sansRetour) || period.retours.revenus + period.retours.sansRetour !== period.retours.observes
      || !Array.isArray(period.rues) || !period.comparaison) throw new Error("Inconsistent borough profile");
    for (const entry of period.emplacements) {
      if (typeof entry.positionId !== "string" || !count(entry.signalements) || !Array.isArray(entry.annees) || !entry.annees.every(Number.isInteger)
        || !Number.isFinite(entry.latitude) || !Number.isFinite(entry.longitude) || entry.latitude < 45.3 || entry.latitude > 45.8 || entry.longitude < -74.1 || entry.longitude > -73.4
        || !count(entry.colmatages) || !Number.isFinite(Date.parse(entry.premierSignalement)) || !Number.isFinite(Date.parse(entry.dernierSignalement))) throw new Error("Invalid location");
    }
    for (const entry of period.rues) if (typeof entry.rue !== "string" || ![entry.emplacements, entry.signalements, entry.persistants, entry.sansColmatage].every(count)) throw new Error("Invalid street");
    for (const entry of Object.values(period.comparaison)) if (!count(entry.emplacements) || !count(entry.recurrents) || entry.recurrents > entry.emplacements) throw new Error("Invalid comparison");
  }
}

function localDefinitions(profile, period) {
  const persistenceLabels = ["chartOneYear", "chartTwoYears", "chartThreeYears", "chartFourYears", "chartFiveYears"].map((key) => text(key));
  const returns = period.retours;
  const local = period.comparaison.local;
  const rest = period.comparaison.reste;
  return [
    { key: "trend", title: text("boroughTrendTitle"), note: text("chartTrendNote", { year: period.derniereAnnee }), vertical: true,
      labels: period.annuels.map((entry) => String(entry.annee)), values: period.annuels.map((entry) => entry.signalements),
      columns: [text("statisticsYear"), text("rankReports")], rows: period.annuels.map((entry) => [String(entry.annee), number(entry.signalements)]) },
    { key: "persistence", title: text("boroughPersistenceTitle"), note: text("boroughPersistenceNote"),
      labels: persistenceLabels, values: period.persistance.classes, columns: [text("chartReportedYears"), text("rankLocations")],
      rows: period.persistance.classes.map((value, index) => [persistenceLabels[index], number(value)]) },
    { key: "returns", title: text("chartReturnsTitle"), doughnut: true, valueFormat: "percent", showDetails: true,
      note: text("boroughReturnsNote", { count: number(returns.revenus), total: number(returns.observes), excluded: number(returns.suiviIncomplet) }),
      labels: [text("chartReportedAgain"), text("chartNoNewReport")], values: [share(returns.revenus, returns.observes), share(returns.sansRetour, returns.observes)],
      columns: [text("chartAfterPatching"), text("rankLocations"), text("chartShare")],
      rows: [[text("chartReportedAgain"), number(returns.revenus), percent(share(returns.revenus, returns.observes))], [text("chartNoNewReport"), number(returns.sansRetour), percent(share(returns.sansRetour, returns.observes))]] },
    { key: "comparison", title: text("boroughComparisonTitle"), note: text("boroughComparisonNote"), valueFormat: "percent", showDetails: true,
      labels: [profile.nom, text("boroughRestOfCity")], values: [share(local.recurrents, local.emplacements), share(rest.recurrents, rest.emplacements)],
      columns: [text("district"), text("chartShare"), text("chartRecurring"), text("rankLocations")],
      rows: [[profile.nom, percent(share(local.recurrents, local.emplacements)), number(local.recurrents), number(local.emplacements)],
        [text("boroughRestOfCity"), percent(share(rest.recurrents, rest.emplacements)), number(rest.recurrents), number(rest.emplacements)]] },
  ];
}

export function createBoroughView(root) {
  const byId = (id) => document.getElementById(id);
  const controls = byId("boroughsControls");
  const select = byId("boroughSelect");
  const periodSelect = byId("boroughPeriod");
  const content = byId("boroughsContent");
  const chartRoot = byId("boroughCharts");
  const status = byId("boroughsStatus");
  const retry = byId("boroughsRetry");
  const locationFilter = byId("boroughLocationFilter");
  const search = byId("boroughSearch");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const charts = new Map();
  const tables = new Map();
  const cache = new Map();
  let active = false;
  let index = null;
  let profile = null;
  let Chart = null;
  let request = null;
  let sequence = 0;
  let interval = null;
  let error = false;
  let libraryError = false;
  let libraryLoading = false;
  let selectedId = new URLSearchParams(location.search).get("borough") || "";
  let selectedPeriod = new URLSearchParams(location.search).get("period") || "recent";

  function updateUrl() {
    if (!active) return;
    const url = new URL(location.href);
    url.searchParams.set("borough", selectedId);
    url.searchParams.set("period", selectedPeriod);
    history.replaceState({}, "", url);
  }

  function currentPeriod() { return profile?.periodes.find((entry) => entry.id === selectedPeriod); }

  function renderStatus() {
    const key = error ? "boroughsLoadError" : libraryError ? "chartsLibraryError" : request && !profile ? "loading" : "";
    status.hidden = !key;
    status.textContent = key ? text(key) : "";
    retry.hidden = !error && !libraryError;
    retry.disabled = Boolean(request) || libraryLoading;
    root.setAttribute("aria-busy", String(Boolean(request) && !profile));
    content.hidden = !profile;
    charts.forEach(updateDetailsVisibility);
  }

  function updateDetailsVisibility(entry) {
    const redundant = !entry.definition.showDetails && !libraryError;
    if (entry.details.classList.contains("is-accessible-only") !== redundant) {
      entry.details.open = redundant;
      entry.details.classList.toggle("is-accessible-only", redundant);
    }
    entry.summary.tabIndex = redundant ? -1 : 0;
    entry.table.parentElement.tabIndex = redundant ? -1 : 0;
  }

  function syncControls() {
    if (!index) return;
    select.replaceChildren(...index.arrondissements.map((entry) => new Option(entry.nom, entry.id)));
    select.value = selectedId;
    periodSelect.replaceChildren(...index.periodes.map((entry) => new Option(`${entry.premiereAnnee}\u2013${entry.derniereAnnee}`, entry.id)));
    periodSelect.value = selectedPeriod;
    controls.hidden = !active;
    for (const [key, id, label] of [["signalements", "boroughReportsUpdated", "chartsReportsUpdated"], ["reparations", "boroughRepairsUpdated", "chartsRepairsUpdated"]]) {
      const dates = index.origine[key].map((entry) => Date.parse(entry[1])).filter(Number.isFinite);
      const modified = dates.length ? new Intl.DateTimeFormat(locale(), { dateStyle: "medium", timeZone: "America/Montreal" }).format(new Date(Math.max(...dates))) : text("notPublished");
      byId(id).textContent = text(label, { date: modified });
    }
  }

  function draw(entry) {
    if (!Chart || !active || !profile || !entry.visible) return;
    const empty = entry.definition.values.every((value) => value === null);
    entry.canvas.hidden = empty;
    entry.empty.hidden = !empty;
    entry.empty.textContent = text("chartsNoData");
    if (empty) { entry.chart?.destroy(); entry.chart = null; return; }
    const configuration = chartConfig(entry, reducedMotion.matches);
    if (!entry.chart) entry.chart = new Chart(entry.canvas, configuration);
    else { entry.chart.data = configuration.data; entry.chart.options = configuration.options; entry.chart.resize(); entry.chart.update(reducedMotion.matches ? "none" : undefined); }
  }

  const observer = new IntersectionObserver((observations) => {
    for (const observation of observations) {
      const entry = charts.get(observation.target.dataset.boroughChart);
      if (entry && observation.isIntersecting) { entry.visible = true; draw(entry); observer.unobserve(entry.plot); }
    }
  }, { root: byId("potholeContent"), threshold: 0.05 });

  function renderCharts(period) {
    for (const definition of localDefinitions(profile, period)) {
      let entry = charts.get(definition.key);
      if (!entry) {
        const article = node("article", "pothole-borough-chart");
        article.dataset.boroughAnalysis = definition.key;
        const heading = node("h3");
        heading.id = `borough-chart-${definition.key}`;
        article.setAttribute("aria-labelledby", heading.id);
        const note = node("p", "pothole-analysis-note");
        const copy = node("div");
        copy.append(heading, note);
        const plot = node("div", "pothole-analysis-plot");
        plot.dataset.boroughChart = definition.key;
        const canvas = node("canvas");
        canvas.setAttribute("role", "img");
        const empty = node("p", "pothole-analysis-empty");
        empty.hidden = true;
        plot.append(canvas, empty);
        const details = node("details", "pothole-borough-chart-details pothole-analysis-values");
        const summary = node("summary");
        const wrap = node("div", "pothole-analysis-table-wrap");
        wrap.tabIndex = 0;
        wrap.setAttribute("aria-labelledby", heading.id);
        const table = node("table", "pothole-statistics-table");
        wrap.append(table);
        details.append(summary, wrap);
        article.append(copy, plot, details);
        chartRoot.append(article);
        entry = { heading, note, plot, canvas, empty, details, summary, table, chart: null, visible: false };
        charts.set(definition.key, entry);
      }
      entry.definition = definition;
      updateDetailsVisibility(entry);
      entry.heading.textContent = definition.title;
      entry.note.textContent = definition.note;
      entry.summary.textContent = text("chartsFigures");
      entry.canvas.setAttribute("aria-label", `${definition.title}. ${definition.note}`);
      entry.table.replaceChildren();
      const header = entry.table.createTHead().insertRow();
      definition.columns.forEach((label) => { const cell = node("th", "", label); cell.scope = "col"; header.append(cell); });
      const body = entry.table.createTBody();
      definition.rows.forEach((values) => {
        const row = body.insertRow();
        values.forEach((value, column) => { const cell = node(column ? "td" : "th", "", value); if (!column) cell.scope = "row"; row.append(cell); });
      });
      observer.observe(entry.plot);
      draw(entry);
    }
  }

  const tableDefinitions = {
    streets: [
      ["rue", "rankStreet"], ["signalements", "rankReports"], ["emplacements", "rankLocations"],
      ["persistants", "boroughPersistent"], ["sansColmatage", "boroughWithoutPatch"],
    ],
    locations: [
      ["lieu", "rankLocation"], ["signalements", "rankReports"], ["annees", "boroughYears"],
      ["premierSignalement", "rankFirstReport"], ["dernierSignalement", "boroughLastReport"], ["colmatages", "rankNearbyRepairs"], ["map", "boroughViewMap"],
    ],
  };

  function renderTable(kind) {
    const period = currentPeriod();
    if (!period) return;
    const state = tables.get(kind);
    const term = normalizeSearch(search.value);
    const filter = locationFilter.value;
    const rows = (kind === "streets" ? period.rues : period.emplacements).filter((entry) => {
      if (kind === "locations" && ((filter === "persistent" && entry.annees.length < 2)
        || (filter === "unpatched" && !entry.sansColmatage) || (filter === "returns" && entry.retour12Mois !== true))) return false;
      return !term || normalizeSearch(`${entry.rue || ""} ${entry.lieu || ""} ${entry.positionId || ""}`).includes(term);
    }).sort((left, right) => {
      const leftValue = state.sort === "annees" ? left.annees.length : left[state.sort];
      const rightValue = state.sort === "annees" ? right.annees.length : right[state.sort];
      const comparison = typeof leftValue === "number" ? leftValue - rightValue : String(leftValue || "").localeCompare(String(rightValue || ""), locale());
      return comparison * state.direction || String(left.positionId || left.rue).localeCompare(String(right.positionId || right.rue));
    });
    const pageSize = 10;
    state.page = Math.min(state.page, Math.max(0, Math.ceil(rows.length / pageSize) - 1));
    const table = byId(kind === "streets" ? "boroughStreetsTable" : "boroughLocationsTable");
    table.replaceChildren();
    const header = table.createTHead().insertRow();
    for (const [field, label] of tableDefinitions[kind]) {
      const cell = node("th");
      cell.scope = "col";
      if (field === "map") cell.textContent = text(label);
      else {
        cell.setAttribute("aria-sort", state.sort === field ? state.direction > 0 ? "ascending" : "descending" : "none");
        const button = node("button", "pothole-borough-sort", text(label));
        button.type = "button";
        button.dataset.sort = field;
        const icon = node("i");
        icon.dataset.lucide = state.sort === field ? state.direction > 0 ? "arrow-up" : "arrow-down" : "arrow-up-down";
        icon.setAttribute("aria-hidden", "true");
        button.append(icon);
        button.addEventListener("click", () => {
          state.direction = state.sort === field ? -state.direction : ["rue", "lieu", "premierSignalement", "dernierSignalement"].includes(field) ? 1 : -1;
          state.sort = field; state.page = 0; renderTable(kind);
        });
        cell.append(button);
      }
      header.append(cell);
    }
    const body = table.createTBody();
    for (const entry of rows.slice(state.page * pageSize, (state.page + 1) * pageSize)) {
      const row = body.insertRow();
      row.dataset.positionId = entry.positionId || "";
      for (const [field] of tableDefinitions[kind]) {
        const cell = node(field === "rue" || field === "lieu" ? "th" : "td");
        if (cell.tagName === "TH") cell.scope = "row";
        if (field === "map") {
          const url = new URL(location.href);
          ["mode", "tab", "borough", "period"].forEach((key) => url.searchParams.delete(key));
          url.hash = "";
          url.searchParams.set("mapView", `${entry.latitude},${entry.longitude},18`);
          url.searchParams.set("location", entry.positionId);
          const link = node("a", "pothole-icon-button");
          link.href = url.href;
          link.title = text("boroughViewMap");
          link.setAttribute("aria-label", text("boroughViewLocation", { place: entry.lieu || entry.rue || entry.positionId }));
          const icon = node("i"); icon.dataset.lucide = "map-pin"; icon.setAttribute("aria-hidden", "true"); link.append(icon);
          cell.append(link);
        } else if (field === "annees") cell.textContent = entry.annees.join(", ");
        else if (field === "premierSignalement" || field === "dernierSignalement") cell.textContent = date(entry[field]);
        else if (field === "colmatages") {
          cell.textContent = entry.colmatages ? number(entry.colmatages) : text("boroughNoPatch");
          if (entry.dernierColmatage) cell.append(node("small", "pothole-ranking-meta", text("boroughLatestPatch", { date: date(entry.dernierColmatage) })));
        } else {
          cell.textContent = typeof entry[field] === "number" ? number(entry[field]) : entry[field] || text("rankLocation");
          if (field === "lieu") cell.append(node("small", "pothole-ranking-meta", `${entry.latitude.toFixed(5)}, ${entry.longitude.toFixed(5)}`));
        }
        row.append(cell);
      }
    }
    if (!rows.length) { const cell = body.insertRow().insertCell(); cell.colSpan = tableDefinitions[kind].length; cell.textContent = text("rankNoResults"); }
    byId(`${kind}BoroughPage`).textContent = text("boroughPagination", { first: rows.length ? state.page * pageSize + 1 : 0, last: Math.min(rows.length, (state.page + 1) * pageSize), total: number(rows.length) });
    byId(`${kind}BoroughPrevious`).disabled = state.page === 0;
    byId(`${kind}BoroughNext`).disabled = (state.page + 1) * pageSize >= rows.length;
    window.lucide?.createIcons({ attrs: { "aria-hidden": "true", focusable: "false" } });
  }

  function render() {
    syncControls();
    if (index) updateUrl();
    const period = currentPeriod();
    if (!period) { renderStatus(); return; }
    const scroller = byId("potholeContent");
    const scroll = scroller.scrollTop;
    byId("boroughsHeading").textContent = text("boroughSelectedHeading", { name: profile.nom });
    byId("boroughSources").textContent = text("chartsSources", { reports: date(profile.couverture.signalementsFin), repairs: date(profile.couverture.colmatagesFin) });
    const metrics = byId("boroughMetrics");
    metrics.replaceChildren();
    for (const [label, count] of [["boroughReportCount", period.indicateurs.signalements], ["boroughLocationsCount", period.indicateurs.emplacements], ["boroughPersistent", period.indicateurs.persistants], ["boroughReturnsCount", period.indicateurs.retours]]) {
      const item = node("div"); item.append(node("dt", "", text(label)), node("dd", "", number(count))); metrics.append(item);
    }
    byId("boroughCoverage").textContent = text("boroughCoverage", { missing: number(period.indicateurs.sansPosition), streets: number(period.emplacementsSansRue), end: date(profile.couverture.colmatagesFin) });
    byId("boroughLocationsNote").textContent = text("boroughLocationsNote", { end: date(profile.couverture.colmatagesFin) });
    content.hidden = false;
    root.dataset.borough = profile.id;
    root.dataset.profileVersion = profile.version;
    renderCharts(period);
    renderTable("streets"); renderTable("locations");
    renderStatus();
    scroller.scrollTop = scroll;
  }

  function resetTables() { tables.forEach((state) => { state.page = 0; }); }

  async function ensureLibrary() {
    if (Chart || libraryLoading) return;
    libraryLoading = true; libraryError = false;
    try { Chart = await loadChartLibrary(); Chart.defaults.font.family = getComputedStyle(root).fontFamily; charts.forEach(draw); }
    catch { libraryError = true; }
    finally { libraryLoading = false; renderStatus(); }
  }

  async function refresh() {
    if (!active || document.hidden || request) return;
    const current = ++sequence;
    const controller = new AbortController();
    request = controller;
    let timedOut = false;
    const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, 20000);
    renderStatus();
    try {
      const fetchData = async (file) => {
        const response = await fetch(new URL(`../data/nids-de-poule/${file}`, import.meta.url), { cache: "no-cache", signal: controller.signal });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      };
      const [next, catalog] = await Promise.all([fetchData("arrondissements.json"), fetchData("index.json")]);
      if (current !== sequence || !active) return;
      if (next.schemaVersion !== 1 || !Array.isArray(next.arrondissements) || next.arrondissements.length !== 19 || !next.periodes?.length || !matchesSources(next.origine, catalog)
        || next.arrondissements.some((entry) => !/^[a-z0-9-]+$/.test(entry.id) || entry.fichier !== `arrondissements/${entry.id}.json`)) throw new Error("Stale borough index");
      index = next;
      if (!index.arrondissements.some((entry) => entry.id === selectedId)) selectedId = index.arrondissements[0].id;
      if (!index.periodes.some((entry) => entry.id === selectedPeriod)) selectedPeriod = index.periodes[0].id;
      syncControls(); updateUrl();
      const descriptor = index.arrondissements.find((entry) => entry.id === selectedId);
      let nextProfile = cache.get(descriptor.id);
      if (nextProfile?.version !== descriptor.version) nextProfile = await fetchData(descriptor.fichier);
      if (current !== sequence || !active) return;
      validateProfile(nextProfile, descriptor, index);
      cache.delete(descriptor.id); cache.set(descriptor.id, nextProfile);
      if (cache.size > 2) cache.delete(cache.keys().next().value);
      const changed = profile?.version !== nextProfile.version;
      profile = nextProfile; error = false;
      if (changed) render();
    } catch (failure) {
      if (current === sequence && (timedOut || failure.name !== "AbortError")) {
        error = true; profile = null; root.removeAttribute("data-profile-version");
        charts.forEach((entry) => { entry.chart?.destroy(); entry.chart = null; });
      }
    } finally {
      clearTimeout(timeout);
      if (current === sequence) { request = null; renderStatus(); }
    }
  }

  function cancel() { sequence += 1; request?.abort(); request = null; }

  function activate() {
    clearInterval(interval); interval = null;
    if (active && !document.hidden) {
      ensureLibrary(); refresh(); interval = setInterval(refresh, 60000);
      charts.forEach((entry) => observer.observe(entry.plot));
    } else {
      cancel(); observer.disconnect();
      charts.forEach((entry) => { entry.chart?.destroy(); entry.chart = null; entry.visible = false; });
    }
  }
  for (const kind of ["streets", "locations"]) {
    const state = { sort: kind === "streets" ? "persistants" : "annees", direction: -1, page: 0 };
    tables.set(kind, state);
    for (const [id, direction] of [[`${kind}BoroughPrevious`, -1], [`${kind}BoroughNext`, 1]]) byId(id).addEventListener("click", () => { state.page += direction; renderTable(kind); });
  }
  [select, periodSelect, locationFilter].forEach((element) => element.addEventListener("pointerdown", () => element.focus({ preventScroll: true })));
  select.addEventListener("change", () => { selectedId = select.value; cancel(); profile = null; resetTables(); updateUrl(); renderStatus(); refresh(); });
  periodSelect.addEventListener("change", () => { selectedPeriod = periodSelect.value; resetTables(); updateUrl(); render(); });
  search.addEventListener("input", () => { resetTables(); renderTable("streets"); renderTable("locations"); });
  locationFilter.addEventListener("change", () => { tables.get("locations").page = 0; renderTable("locations"); });
  document.addEventListener("visibilitychange", activate);
  reducedMotion.addEventListener("change", () => charts.forEach(draw));
  return {
    setActive(value) {
      active = value;
      controls.hidden = !active || !index;
      if (active) {
        const params = new URLSearchParams(location.search);
        const requested = params.get("borough");
        if (requested && requested !== selectedId) { selectedId = requested; cancel(); profile = null; resetTables(); }
        selectedPeriod = params.get("period") || selectedPeriod;
        if (index && !index.periodes.some((entry) => entry.id === selectedPeriod)) selectedPeriod = index.periodes[0].id;
        render();
      }
      activate();
    },
    retry() { ensureLibrary(); refresh(); },
  };
}