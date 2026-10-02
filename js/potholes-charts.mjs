const CHART_URL = "https://cdn.jsdelivr.net/npm/chart.js@4.5.1/dist/chart.umd.min.js";
const CHART_INTEGRITY = "sha384-jb8JQMbMoBUzgWatfe6COACi2ljcDdZQ2OxczGA3bGNeWe+6DChMTBJemed7ZnvJ";
const REFRESH_INTERVAL = 60000;
const locale = () => window.currentLanguage() === "en" ? "en-CA" : "fr-CA";
const text = (key, values = {}) => window.t(`potholes.${key}`).replace(/\{(\w+)\}/g, (match, name) => values[name] ?? match);
const number = (value) => new Intl.NumberFormat(locale(), { maximumFractionDigits: 1 }).format(value);
const percent = (part, total) => total > 0 ? part / total * 100 : null;
const date = (value) => value ? new Intl.DateTimeFormat(locale(), { dateStyle: "medium", timeZone: "UTC" }).format(new Date(value)) : text("notPublished");
const node = (tag, className = "", content = "") => {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = content;
  return element;
};
const format = (value, kind = "count") => value === null ? text("chartsUnavailableValue")
  : kind === "multiple" ? text("chartTimes", { value: number(value) })
  : kind === "percent" || kind === "change"
    ? new Intl.NumberFormat(locale(), { style: "percent", maximumFractionDigits: 1, ...(kind === "change" ? { signDisplay: "exceptZero" } : {}) }).format(value / 100)
    : number(value);

let chartLibrary;
export function loadChartLibrary() {
  if (window.Chart?.version === "4.5.1") return Promise.resolve(window.Chart);
  if (chartLibrary) return chartLibrary;
  chartLibrary = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = CHART_URL;
    script.integrity = CHART_INTEGRITY;
    script.crossOrigin = "anonymous";
    const fail = () => { clearTimeout(timer); script.remove(); chartLibrary = null; reject(new Error("Chart.js unavailable")); };
    const timer = setTimeout(fail, 20000);
    script.onload = () => {
      clearTimeout(timer);
      if (window.Chart?.version === "4.5.1") resolve(window.Chart);
      else fail();
    };
    script.onerror = fail;
    document.head.append(script);
  });
  return chartLibrary;
}

function validateAnalyses(data, catalog) {
  if (data?.schemaVersion !== 4 || typeof data.version !== "string" || !data.periodes?.length || !data.couverture) throw new Error("Invalid analyses");
  for (const key of ["signalements", "reparations"]) {
    if (!Array.isArray(catalog?.[key]) || !Array.isArray(data.origine?.[key]) || catalog[key].length !== data.origine[key].length
      || !catalog[key].every((entry) => data.origine[key].some(([file, modified]) => file === entry.fichier && modified === entry.contenuModifieLe))) throw new Error("Stale analyses");
  }
  if (data.origine.indexModifieLe !== catalog.contenuModifieLe) throw new Error("Stale catalogue");
  const count = (value) => Number.isInteger(value) && value >= 0;
  if (new Set(data.periodes.map((period) => period.id)).size !== data.periodes.length) throw new Error("Duplicate periods");
  for (const period of data.periodes) {
    if (!Number.isFinite(Date.parse(period.fin)) || !period.annuels?.length
      || !period.annuels.every((row) => Number.isInteger(row.annee) && (row.signalements === null || count(row.signalements)))
      || period.persistance?.classes?.length !== 5 || !period.persistance.classes.every(count)
      || period.persistance.classes.reduce((sum, value) => sum + value, 0) !== period.persistance.emplacements
      || !count(period.concentration?.principauxSignalements) || !count(period.concentration?.autresSignalements)
      || period.concentration.principauxSignalements + period.concentration.autresSignalements !== period.concentration.signalements
      || !count(period.retours?.revenus) || !count(period.retours?.sansRetour)
      || period.retours.revenus + period.retours.sansRetour !== period.retours.observes
      || period.sansColmatage?.classes?.length !== 4 || !period.sansColmatage.classes.every(count)
      || period.sansColmatage.classes.reduce((sum, value) => sum + value, 0) !== period.sansColmatage.emplacements
      || !Array.isArray(period.arrondissements?.lignes) || !period.arrondissements.lignes.every((row) => typeof row.nom === "string"
        && count(row.emplacements) && count(row.recurrents) && row.recurrents <= row.emplacements
        && (row.proportion === null ? row.emplacements === 0 : Number.isFinite(row.proportion) && row.proportion >= 0 && row.proportion <= 1))) throw new Error("Inconsistent analysis figures");
  }
}

function analysisDefinitions(period) {
  const annual = period.annuels;
  const latest = annual.at(-1);
  const persistence = period.persistance;
  const recurrent = persistence.classes.slice(1).reduce((total, value) => total + value, 0);
  const persistenceLabels = ["chartOneYear", "chartTwoYears", "chartThreeYears", "chartFourYears", "chartFiveYears"].map((key) => text(key));
  const concentration = period.concentration;
  const remainingLocations = concentration.emplacements - concentration.principaux;
  const mainAverage = concentration.principaux ? concentration.principauxSignalements / concentration.principaux : null;
  const otherAverage = remainingLocations ? concentration.autresSignalements / remainingLocations : null;
  const returns = period.retours;
  const unpatched = period.sansColmatage;
  const unpatchedLabels = ["chartTwoReports", "chartThreeReports", "chartFourReports", "chartFivePlusReports"].map((key) => text(key));
  const districtRows = period.arrondissements.lignes;
  const districtTotal = districtRows.reduce((sum, row) => sum + row.emplacements, 0);
  const districtRecurrent = districtRows.reduce((sum, row) => sum + row.recurrents, 0);
  const districtPalette = ["#2166ac", "#b2182b", "#1b7837", "#762a83", "#c87514", "#008b8b", "#ba426c", "#5867a6", "#6a7d21", "#975f43", "#377eb8", "#9d3e91", "#00856a", "#8f6700", "#75559b", "#b65a42", "#466b52", "#657b9d", "#a35b73"];
  const districtNames = [...new Set(districtRows.map((row) => row.nom))].sort((left, right) => left.localeCompare(right, "fr"));
  const districtColors = districtRows.map((row) => districtPalette[districtNames.indexOf(row.nom) % districtPalette.length]);
  return [
    {
      key: "trend", title: text("chartTrendTitle"), metric: latest.signalements,
      statement: text("chartTrendStatement", { year: latest.annee, date: date(period.fin) }),
      note: text("chartTrendNote", { year: latest.annee }),
      labels: annual.map((row) => String(row.annee)), values: annual.map((row) => row.signalements), vertical: true,
      showDetails: true, columns: [text("statisticsYear"), text("rankReports"), text("chartAnnualChange")],
      rows: annual.map((row, index) => {
        const previous = annual[index - 1]?.signalements;
        const change = index < annual.length - 1 && previous > 0 && row.signalements !== null ? (row.signalements - previous) / previous * 100 : null;
        return [String(row.annee), format(row.signalements), index === annual.length - 1 ? text("chartPartialYear") : format(change, "change")];
      }),
    },
    {
      key: "persistence", title: text("chartPersistenceTitle"), metric: percent(recurrent, persistence.emplacements), metricFormat: "percent",
      statement: text("chartPersistenceStatement", { count: number(recurrent), total: number(persistence.emplacements) }),
      note: text("chartPersistenceNote", { excluded: number(persistence.nonLocalises) }),
      labels: persistenceLabels, values: persistence.classes,
      columns: [text("chartReportedYears"), text("rankLocations")],
      rows: persistence.classes.map((value, index) => [persistenceLabels[index], number(value)]),
    },
    {
      key: "unpatched", title: text("chartUnpatchedTitle"), metric: unpatched.debut ? unpatched.emplacements : null,
      statement: text("chartUnpatchedStatement", { count: number(unpatched.signalements) }),
      note: text("chartUnpatchedNote"), polarArea: true,
      labels: unpatchedLabels, values: unpatched.debut ? unpatched.classes : unpatched.classes.map(() => null),
      legendGroups: ["2", "3", "4", "5+"],
      columns: [text("rankReports"), text("rankLocations")], rows: unpatched.classes.map((value, index) => [unpatchedLabels[index], number(value)]),
    },
    {
      key: "returns", title: text("chartReturnsTitle"), metric: percent(returns.revenus, returns.observes), metricFormat: "percent",
      statement: text("chartReturnsStatement", { count: number(returns.revenus), total: number(returns.observes) }),
      note: text("chartReturnsNote", { excluded: number(returns.suiviIncomplet) }), valueFormat: "percent", doughnut: true,
      labels: [text("chartReportedAgain"), text("chartNoNewReport")], values: [percent(returns.revenus, returns.observes), percent(returns.sansRetour, returns.observes)],
      showDetails: true, columns: [text("chartAfterPatching"), text("rankLocations"), text("chartShare")],
      rows: [[text("chartReportedAgain"), number(returns.revenus), format(percent(returns.revenus, returns.observes), "percent")],
        [text("chartNoNewReport"), number(returns.sansRetour), format(percent(returns.sansRetour, returns.observes), "percent")]],
    },
    {
      key: "concentration", title: text("chartConcentrationTitle"), metric: otherAverage > 0 && mainAverage !== null ? mainAverage / otherAverage : null, metricFormat: "multiple",
      statement: text("chartConcentrationStatement", { main: format(mainAverage), other: format(otherAverage) }),
      note: text("chartConcentrationNote"),
      labels: [text("chartTopTen"), text("chartOtherLocations")], values: [mainAverage, otherAverage], seriesLabel: text("chartReportsPerLocation"),
      showDetails: true, columns: [text("chartGroup"), text("rankLocations"), text("rankReports"), text("chartShare"), text("chartReportsPerLocation")],
      rows: [[text("chartTopTen"), number(concentration.principaux), number(concentration.principauxSignalements), format(percent(concentration.principauxSignalements, concentration.signalements), "percent"), format(mainAverage)],
        [text("chartOtherLocations"), number(remainingLocations), number(concentration.autresSignalements), format(percent(concentration.autresSignalements, concentration.signalements), "percent"), format(otherAverage)]],
    },
    {
      key: "districts", title: text("chartDistrictsTitle"), metric: percent(districtRecurrent, districtTotal), metricFormat: "percent", valueFormat: "percent",
      statement: text("chartDistrictsStatement", { count: number(districtRecurrent), total: number(districtTotal) }),
      note: text("chartDistrictsNote", { excluded: number(period.arrondissements.emplacementsExclus) }),
      labels: districtRows.map((row) => row.nom), values: districtRows.map((row) => row.proportion === null ? null : row.proportion * 100),
      vertical: true, diagonalLabels: true, colors: districtColors, height: 390,
      showDetails: true, columns: [text("district"), text("chartShare"), text("chartRecurring"), text("rankLocations")],
      rows: districtRows.map((row) => [row.nom, format(row.proportion === null ? null : row.proportion * 100, "percent"), number(row.recurrents), number(row.emplacements)]),
    },
  ];
}

function wrapLabel(value) {
  return String(value).match(/.{1,21}(?:\s|[-]|$)|.{1,21}/g)?.map((part) => part.trim()) || [String(value)];
}

export function chartConfig(entry, reducedMotion) {
  const definition = entry.definition;
  const colors = ["#963e51", "#397b6d", "#7198ac"];
  if (definition.doughnut || definition.polarArea) return {
    type: definition.polarArea ? "polarArea" : "doughnut",
    data: { labels: definition.labels, datasets: [{ data: definition.values, backgroundColor: definition.polarArea
      ? ["#963e51", "#397b6d", "#7198ac", "#a76b18"] : colors.slice(0, 2), borderColor: "#fff", borderWidth: 3, hoverOffset: 5 }] },
    plugins: [{
      id: "returnShareLabels",
      afterLayout(chart) {
        if (definition.polarArea) chart.scales.r.drawingArea = Math.min(chart.chartArea.width, chart.chartArea.height) * 0.5;
      },
      afterDraw(chart) {
        if (!definition.polarArea) return;
        const scale = chart.scales.r;
        entry.outerLabel.textContent = number(scale.max);
        entry.outerLabel.style.left = `${scale.xCenter}px`;
        entry.outerLabel.style.top = `${scale.yCenter - scale.drawingArea}px`;
        entry.outerLabel.hidden = false;
      },
      afterDatasetsDraw(chart) {
        if (definition.polarArea) return;
        const context = chart.ctx;
        context.save();
        context.font = `600 12px ${getComputedStyle(entry.canvas).fontFamily}`;
        context.fillStyle = "#fff";
        context.textAlign = "center";
        context.textBaseline = "middle";
        chart.getDatasetMeta(0).data.forEach((arc, index) => {
          const value = chart.data.datasets[0].data[index];
          if (value === null || !Number.isFinite(value)) return;
          if (value < 8) return;
          const position = arc.tooltipPosition();
          context.fillText(format(value, definition.valueFormat), position.x, position.y);
        });
        context.restore();
      },
    }],
    options: {
      responsive: true, maintainAspectRatio: false, ...(definition.doughnut ? { cutout: "60%" } : {}),
      animation: reducedMotion ? false : { duration: 650, easing: "easeOutCubic" },
      layout: { padding: definition.polarArea ? 2 : 8 },
      ...(definition.polarArea ? { onResize(chart, size) {
        chart.options.plugins.legend.position = size.width >= 600 ? "right" : "bottom";
        chart.options.plugins.legend.title.display = size.width < 600;
      } } : {}),
      plugins: {
        legend: { position: definition.polarArea && entry.plot.clientWidth >= 600 ? "right" : "bottom", onClick: () => {},
          ...(definition.polarArea ? { title: { display: entry.plot.clientWidth < 600, text: text("chartPolarLegendTitle"), font: { size: 11 } } } : {}),
          labels: {
          boxWidth: 12, boxHeight: 12, padding: definition.polarArea ? 8 : 14, font: { size: 11 },
          ...(definition.polarArea ? { generateLabels: (chart) => chart.data.labels.map((label, index) => ({
            text: text(chart.width >= 600 ? "chartPolarLegend" : "chartPolarLegendCompact", {
              group: chart.width >= 600 ? label : definition.legendGroups[index], count: format(chart.data.datasets[0].data[index]),
            }),
            fillStyle: chart.data.datasets[0].backgroundColor[index], strokeStyle: "#fff", lineWidth: 1, index,
          })) } : {}),
        } },
        tooltip: { callbacks: { label: (context) => `${context.label}: ${format(context.raw, definition.valueFormat)}` } },
      },
      ...(definition.polarArea ? { scales: { r: {
        min: 0,
        max: (Math.floor(Math.max(0, ...definition.values.filter(Number.isFinite)) / 250) + 1) * 250,
        ticks: { stepSize: 250, maxTicksLimit: 5, precision: 0, backdropColor: "transparent", color: "#506256", font: { size: 10 },
          callback(value) { return value === this.max ? "" : number(value); },
        },
        grid: { color: "#dfe8e2" },
      } } } : {}),
    },
  };
  const series = definition.series || [{ label: definition.seriesLabel || definition.columns[1], values: definition.values }];
  const percentage = definition.valueFormat === "percent";
  const datasets = series.map((serie, index) => ({
    label: serie.label, data: serie.values,
    backgroundColor: definition.colors || (definition.stacked ? colors[index] : serie.values.map((unused, valueIndex) => definition.vertical ? valueIndex === serie.values.length - 1 ? colors[0] : colors[1] : colors[valueIndex % colors.length])),
    borderWidth: 0, borderRadius: 2, maxBarThickness: definition.stacked ? 42 : 30,
  }));
  const plugin = {
    id: "analysisValues",
    afterDatasetsDraw(chart) {
      const definition = entry.definition;
      const context = chart.ctx;
      context.save();
      context.font = `600 12px ${getComputedStyle(entry.canvas).fontFamily}`;
      chart.data.datasets.forEach((dataset, datasetIndex) => {
        chart.getDatasetMeta(datasetIndex).data.forEach((bar, index) => {
          const value = dataset.data[index];
          if (value === null || !Number.isFinite(value)) return;
          if (definition.key === "trend" && chart.chartArea.width / chart.data.labels.length < 65 && index !== dataset.data.length - 1) return;
          const label = format(value, definition.valueFormat);
          if (definition.stacked) {
            if (bar.width < context.measureText(label).width + 12) return;
            context.fillStyle = "#fff";
            context.textAlign = "center";
            context.textBaseline = "middle";
            context.fillText(label, (bar.x + bar.base) / 2, bar.y);
          } else {
            context.fillStyle = "#243a31";
            context.textAlign = definition.vertical ? "center" : "left";
            context.textBaseline = definition.vertical ? "bottom" : "middle";
            context.fillText(label, definition.vertical ? bar.x : Math.min(bar.x + 7, chart.width - context.measureText(label).width - 3), definition.vertical ? bar.y - 5 : bar.y);
          }
        });
      });
      context.restore();
    },
  };
  return {
    type: "bar", data: { labels: definition.labels, datasets }, plugins: [plugin],
    options: {
      responsive: true, maintainAspectRatio: false, indexAxis: definition.vertical ? "x" : "y",
      animation: reducedMotion ? false : { duration: 650, easing: "easeOutCubic" },
      layout: { padding: { top: 28, right: definition.vertical ? 10 : 45 } },
      interaction: { mode: "nearest", intersect: true },
      plugins: {
        legend: { display: Boolean(definition.stacked), position: "bottom", labels: { boxWidth: 12, boxHeight: 12, padding: 16 } },
        tooltip: { callbacks: { label: (context) => {
          const label = `${context.dataset.label}: ${format(context.raw, definition.valueFormat)}`;
          return definition.key === "districts" ? [label, text("chartDistrictTooltip", { count: definition.rows[context.dataIndex][2], total: definition.rows[context.dataIndex][3] })] : label;
        } } },
      },
      scales: {
        x: definition.vertical ? { grid: { display: false }, ticks: definition.diagonalLabels
          ? { autoSkip: false, minRotation: 50, maxRotation: 50, font: { size: 10 } }
          : { autoSkip: true, maxTicksLimit: Math.max(3, Math.floor(entry.plot.clientWidth / 60)), maxRotation: 0, font: { size: 11 } } }
          : { stacked: Boolean(definition.stacked), min: 0, ...(percentage ? { max: 100 } : {}), grid: { color: "#e4e9e5" }, ticks: { precision: 0, maxTicksLimit: 5, callback: (value) => percentage ? format(value, "percent") : number(value) } },
        y: definition.vertical ? { min: 0, ...(percentage ? { max: 100 } : { grace: "15%" }), grid: { color: "#e4e9e5" }, ticks: { precision: 0, maxTicksLimit: 5, callback: (value) => percentage ? format(value, "percent") : number(value) } }
          : { stacked: Boolean(definition.stacked), grid: { display: false }, ticks: { autoSkip: false, font: { size: 11 }, callback: function(value) { return wrapLabel(this.getLabelForValue(value)); } } },
      },
    },
  };
}

export function createStatisticsCharts(root) {
  const content = root.querySelector("#statisticsChartsContent");
  const status = root.querySelector("#chartsStatus");
  const retry = root.querySelector("#chartsRetry");
  const controls = document.getElementById("chartsControls");
  const periodSelect = document.getElementById("chartsPeriod");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const entries = new Map();
  let active = false;
  let data = null;
  let Chart = null;
  let interval = null;
  let request = null;
  let requestNumber = 0;
  let dataError = false;
  let libraryError = false;
  let loadingLibrary = false;

  function renderStatus() {
    const key = dataError ? data ? "chartsRefreshError" : "chartsLoadError" : libraryError ? "chartsLibraryError" : !data ? "loading" : "";
    status.hidden = !key;
    status.textContent = key ? text(key) : "";
    retry.hidden = !dataError && !libraryError;
    retry.disabled = Boolean(request) || loadingLibrary;
    root.setAttribute("aria-busy", String(Boolean(request) && !data));
    entries.forEach(updateDetailsVisibility);
  }

  function updateDetailsVisibility(entry) {
    const redundant = !entry.definition.showDetails && !libraryError;
    if (entry.details.classList.contains("is-accessible-only") !== redundant) {
      entry.details.open = redundant;
      entry.details.classList.toggle("is-accessible-only", redundant);
    }
  }

  function draw(entry) {
    if (!Chart || !active || !entry.visible || entry.empty) return;
    const configuration = chartConfig(entry, reducedMotion.matches);
    if (!entry.chart) entry.chart = new Chart(entry.canvas, configuration);
    else {
      entry.chart.data = configuration.data;
      entry.chart.options = configuration.options;
      entry.chart.resize();
      entry.chart.update(reducedMotion.matches ? "none" : undefined);
    }
  }

  const observer = new IntersectionObserver((observations) => {
    for (const observation of observations) {
      const entry = entries.get(observation.target.dataset.chartKey);
      if (entry && observation.isIntersecting) { entry.visible = true; draw(entry); observer.unobserve(entry.plot); }
    }
  }, { root: document.getElementById("potholeContent"), threshold: 0.05 });

  function renderData() {
    if (!data) return;
    const scroller = document.getElementById("potholeContent");
    const scrollTop = scroller.scrollTop;
    const preserveScroll = entries.size > 0;
    const selected = periodSelect.value || "recent";
    periodSelect.replaceChildren(...data.periodes.map((period) => new Option(text(period.id === "recent" ? "chartsRecentPeriod" : "chartsAllPeriod", {
      first: period.premiereAnnee, last: period.derniereAnnee,
    }), period.id)));
    periodSelect.value = data.periodes.some((period) => period.id === selected) ? selected : data.periodes[0].id;
    controls.hidden = !active;
    for (const [source, id, label] of [["signalements", "chartsReportsUpdated", "chartsReportsUpdated"], ["reparations", "chartsRepairsUpdated", "chartsRepairsUpdated"]]) {
      const dates = data.origine[source].map((entry) => Date.parse(entry[1])).filter(Number.isFinite);
      const modified = dates.length ? new Intl.DateTimeFormat(locale(), { dateStyle: "medium", timeZone: "America/Montreal" }).format(new Date(Math.max(...dates))) : text("notPublished");
      document.getElementById(id).textContent = text(label, { date: modified });
    }
    root.querySelector("#chartsSources").textContent = text("chartsSources", { reports: date(data.couverture.signalementsFin), repairs: date(data.couverture.colmatagesFin) });
    const period = data.periodes.find((item) => item.id === periodSelect.value);
    for (const definition of analysisDefinitions(period)) {
      let entry = entries.get(definition.key);
      if (!entry) {
        const article = node("article", "pothole-analysis");
        article.dataset.analysis = definition.key;
        const heading = node("h3");
        heading.id = `analysis-${definition.key}-heading`;
        article.setAttribute("aria-labelledby", heading.id);
        const metric = node("p", "pothole-analysis-metric");
        const statement = node("p", "pothole-analysis-statement");
        const note = node("p", "pothole-analysis-note");
        const copy = node("div", "pothole-analysis-copy");
        copy.append(heading, metric, statement, note);
        const plot = node("div", "pothole-analysis-plot");
        plot.dataset.chartKey = definition.key;
        const canvas = node("canvas");
        canvas.setAttribute("role", "img");
        const empty = node("p", "pothole-analysis-empty");
        plot.append(canvas, empty);
        const outerLabel = definition.polarArea ? node("span", "pothole-polar-outer-label") : null;
        if (outerLabel) {
          outerLabel.hidden = true;
          outerLabel.setAttribute("aria-hidden", "true");
          plot.append(outerLabel);
        }
        const viewport = node("div", "pothole-analysis-viewport");
        viewport.append(plot);
        const details = node("details", "pothole-analysis-values");
        const summary = node("summary");
        const tableWrap = node("div", "pothole-analysis-table-wrap");
        tableWrap.tabIndex = 0;
        tableWrap.setAttribute("aria-labelledby", heading.id);
        const table = node("table", "pothole-statistics-table");
        tableWrap.append(table);
        details.append(summary, tableWrap);
        article.append(copy, viewport, details);
        content.append(article);
        entry = { article, heading, metric, statement, note, plot, canvas, outerLabel, emptyNode: empty, details, summary, table, visible: false, chart: null };
        entries.set(definition.key, entry);
        observer.observe(plot);
      }
      entry.definition = definition;
      updateDetailsVisibility(entry);
      entry.heading.textContent = definition.title;
      entry.metric.textContent = format(definition.metric, definition.metricFormat);
      entry.statement.textContent = definition.statement;
      entry.note.textContent = definition.note;
      entry.summary.textContent = text("chartsFigures");
      entry.plot.style.setProperty("--analysis-height", `${definition.height || 300}px`);
      entry.canvas.setAttribute("aria-label", `${definition.title}. ${format(definition.metric, definition.metricFormat)}. ${definition.statement}`);
      const values = definition.values || definition.series.flatMap((serie) => serie.values);
      entry.empty = values.every((value) => value === null);
      entry.canvas.hidden = entry.empty;
      if (entry.outerLabel) entry.outerLabel.hidden = true;
      entry.emptyNode.hidden = !entry.empty;
      entry.emptyNode.textContent = text("chartsNoData");
      entry.table.replaceChildren();
      const header = entry.table.createTHead().insertRow();
      definition.columns.forEach((label) => { const cell = node("th", "", label); cell.scope = "col"; header.append(cell); });
      const body = entry.table.createTBody();
      definition.rows.forEach((values) => {
        const row = body.insertRow();
        values.forEach((value, index) => { const cell = node(index ? "td" : "th", "", value); if (!index) cell.scope = "row"; row.append(cell); });
      });
      draw(entry);
    }
    root.dataset.analysisVersion = data.version;
    if (preserveScroll) scroller.scrollTop = scrollTop;
  }

  async function ensureLibrary() {
    if (Chart || loadingLibrary) return;
    loadingLibrary = true;
    libraryError = false;
    try {
      Chart = await loadChartLibrary();
      Chart.defaults.font.family = getComputedStyle(root).fontFamily;
      entries.forEach(draw);
    } catch { libraryError = true; }
    finally { loadingLibrary = false; renderStatus(); }
  }

  async function refresh() {
    if (!active || document.hidden || request) return;
    const sequence = ++requestNumber;
    request = new AbortController();
    const controller = request;
    let timedOut = false;
    const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, 20000);
    renderStatus();
    try {
      const fetchData = async (name) => {
        const response = await fetch(new URL(`../data/nids-de-poule/${name}`, import.meta.url), { cache: "no-cache", signal: controller.signal });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      };
      const [next, catalog] = await Promise.all([fetchData("analyses.json"), fetchData("index.json")]);
      if (sequence !== requestNumber || !active) return;
      validateAnalyses(next, catalog);
      dataError = false;
      if (!data || data.version !== next.version) { data = next; renderData(); }
    } catch (error) {
      if (sequence === requestNumber && (timedOut || error.name !== "AbortError")) dataError = true;
    } finally {
      clearTimeout(timeout);
      if (sequence === requestNumber) { request = null; renderStatus(); }
    }
  }

  function activate() {
    clearInterval(interval);
    interval = null;
    if (active && !document.hidden) {
      entries.forEach((entry) => observer.observe(entry.plot));
      ensureLibrary();
      refresh();
      interval = setInterval(refresh, REFRESH_INTERVAL);
      entries.forEach((entry) => { if (entry.chart) entry.chart.resize(); });
    } else {
      observer.disconnect();
      requestNumber += 1;
      request?.abort();
      request = null;
      entries.forEach((entry) => { entry.chart?.destroy(); entry.chart = null; entry.visible = false; if (entry.outerLabel) entry.outerLabel.hidden = true; });
    }
  }
  periodSelect.addEventListener("pointerdown", () => periodSelect.focus({ preventScroll: true }));
  periodSelect.addEventListener("change", renderData);
  reducedMotion.addEventListener("change", () => entries.forEach(draw));
  document.addEventListener("visibilitychange", activate);
  return {
    setActive(value) {
      active = value;
      controls.hidden = !active || !data;
      if (active && data) {
        renderData();
        entries.forEach((entry) => observer.observe(entry.plot));
      }
      activate();
    },
    retry() { ensureLibrary(); refresh(); },
  };
}