const BAR_STYLES = ["horizontal", "vertical"];
const DISTRIBUTION_TYPES = ["pie", "doughnut", "polarArea"];
const POINT_TYPES = ["scatter", "bubble"];
const VALUE_STYLES = [...BAR_STYLES, "line", "radar", "mixed"];
const ADDITIVE_STYLES = [...VALUE_STYLES, "stacked-horizontal", "stacked-vertical", "percent-horizontal", "percent-vertical", ...DISTRIBUTION_TYPES];
export const OTHER_CUSTOM_SERIES = "__custom_other_series__";
export const DAYS_PER_YEAR = 365.25;
export const DAYS_PER_MONTH = DAYS_PER_YEAR / 12;

export function customDisplayValue(value, unit) {
  return value === null ? null : unit === "meters" ? value / 1000 : unit === "days" ? value / DAYS_PER_MONTH : value;
}

export const customFields = [
  ...[
    ["municipalityKey", "municipality"], ["boroughKey", "borough"],
    ["impactType", "impact"], ["roadKind", "roadKind"],
    ["routeNumber", "route"], ["streetKey", "street"],
    ["authorityType", "authority"], ["organizationKey", "organization"],
    ["performerSector", "performer"], ["beneficiarySector", "beneficiary"],
    ["directionCode", "direction"], ["sourceKind", "source"],
    ["temporalStatus", "status"], ["timePeriod", "timePeriod"],
    ["lengthMethod", "lengthMethod"]
  ].map(([key, label]) => ({ key, labelKey: `stats.custom.field.${label}`, role: "group", field: key, valueType: "category", unit: null, aggregation: null, compatibleChartTypes: ADDITIVE_STYLES, availability: "available" })),
  ...[
    ["count", null, "count", "count", ADDITIVE_STYLES],
    ["share", null, "percent", "percent", ADDITIVE_STYLES],
    ["length", "lengthMeters", "sum", "meters", ADDITIVE_STYLES],
    ["duration", "plannedDurationDays", "median", "days", VALUE_STYLES],
    ["age", "ageDays", "median", "days", VALUE_STYLES]
  ].map(([key, field, aggregation, unit, compatibleChartTypes]) => ({ key, labelKey: `stats.custom.metric.${key}`, role: "measure", field, valueType: "number", unit, aggregation, compatibleChartTypes, availability: "available" }))
];

export function compatibleCustomStyles(metricKey, seriesFieldKey) {
  const metric = customFields.find(field => field.role === "measure" && field.key === metricKey);
  if (!metric) return [];
  return metric.compatibleChartTypes.filter(style => {
    if ([...DISTRIBUTION_TYPES, "mixed"].includes(style)) return !seriesFieldKey;
    if (style.startsWith("stacked-") || style.startsWith("percent-")) return Boolean(seriesFieldKey);
    return true;
  });
}

export function customStyleParts(style) {
  return {
    type: [...DISTRIBUTION_TYPES, "line", "radar", "mixed", ...POINT_TYPES].includes(style) ? style : "bar",
    orientation: style.includes("vertical") ? "vertical" : "horizontal",
    arrangement: style.startsWith("percent-") ? "percent" : style.startsWith("stacked-") ? "stacked" : "grouped"
  };
}

export function composeCustomStyle(parts, metricKey, seriesFieldKey) {
  const styles = compatibleCustomStyles(metricKey, seriesFieldKey);
  const requested = parts.type === "bar" ? `${parts.arrangement === "grouped" ? "" : `${parts.arrangement}-`}${parts.orientation}` : parts.type;
  return styles.includes(requested) ? requested : styles.find(style => customStyleParts(style).orientation === parts.orientation) || styles[0];
}

export function customAxisControls(style) {
  const { type } = customStyleParts(style);
  if (POINT_TYPES.includes(type)) return [
    { key: "xField", labelKey: "stats.custom.xAxis", choices: "numeric" },
    { key: "yField", labelKey: "stats.custom.yAxis", choices: "numeric" }
  ];
  if (type === "mixed") return [
    { key: "groupFieldKey", labelKey: "stats.custom.xCategory", choices: "category" },
    { key: "barMetricKey", labelKey: "stats.custom.leftY", choices: "measure" },
    { key: "metricKey", labelKey: "stats.custom.rightY", choices: "measure" }
  ];
  if (DISTRIBUTION_TYPES.includes(type) || type === "radar") return [
    { key: "groupFieldKey", labelKey: type === "radar" ? "stats.custom.categoryAxes" : "stats.custom.categories", choices: "category" },
    { key: "metricKey", labelKey: ["radar", "polarArea"].includes(type) ? "stats.custom.radialValue" : "stats.custom.valueMeasure", choices: "measure" }
  ];
  return [
    { key: "groupFieldKey", labelKey: "stats.custom.xCategory", choices: "category" },
    { key: "metricKey", labelKey: "stats.custom.yMeasure", choices: "measure" }
  ];
}

export function customAxisChoices(style, key, selection = {}) {
  const control = customAxisControls(style).find(entry => entry.key === key);
  if (!control) return [];
  const catalog = control.choices === "numeric" ? customXYFields : customFields.filter(field => field.role === (control.choices === "category" ? "group" : "measure"));
  return catalog.filter(field => (control.choices !== "measure" || field.compatibleChartTypes.includes(style))
    && (key !== "yField" || field.key !== selection.xField)
    && (style !== "mixed" || key !== "metricKey" || field.key !== selection.barMetricKey));
}

export function customTableDimensions(rows, groupFieldKey, seriesFieldKey) {
  const hideGroup = rows.length > 0 && groupFieldKey === "temporalStatus" && Boolean(seriesFieldKey) && new Set(rows.map(row => row.groupKey)).size === 1;
  const hideSeries = rows.length > 0 && seriesFieldKey === "temporalStatus" && new Set(rows.map(row => row.seriesKey)).size === 1;
  return { group: !hideGroup, series: Boolean(seriesFieldKey) && !hideSeries, constantStatus: hideGroup ? rows[0].groupLabel : hideSeries ? rows[0].seriesLabel : null };
}

export function filterCustomClosures(records, filters = {}) {
  const selections = Object.entries(filters).filter(([, values]) => Array.isArray(values))
    .map(([key, values]) => [key, new Set(values)]);
  return records.filter(record => selections.every(([key, selected]) => selected.has(record[key] ?? null)));
}

export function isBoroughSelection(selection) {
  return selection.groupFieldKey === "boroughKey" || selection.seriesFieldKey === "boroughKey";
}

export function customRecordsForSelection(records, selection) {
  const boroughs = isBoroughSelection(selection);
  const scoped = boroughs ? records.filter(record => record.municipalityKey === "montreal") : records;
  return filterCustomClosures(scoped, boroughs ? { ...selection.filters, municipalityKey: ["montreal"] } : selection.filters);
}

export const customXYFields = [
  { key: "lengthMeters", labelKey: "stats.custom.axis.length", unit: "meters", metricKey: "length" },
  { key: "plannedDurationDays", labelKey: "stats.custom.axis.duration", unit: "days", metricKey: "duration" },
  { key: "ageDays", labelKey: "stats.custom.axis.age", unit: "days", metricKey: "age" }
];

export function customPointData(records, selection, labelOf = (field, value) => String(value ?? "")) {
  const fields = new Map(customXYFields.map(field => [field.key, field]));
  if (!fields.has(selection.xField) || !fields.has(selection.yField) || selection.xField === selection.yField) throw new Error("Two distinct numeric axes are required");
  const bubbles = selection.style === "bubble";
  if (bubbles && !fields.has(selection.bubbleField)) throw new Error("Invalid bubble measure");
  const selected = customRecordsForSelection(records, { ...selection, groupFieldKey: selection.xyColorField, seriesFieldKey: null });
  const groupedRecords = selection.xyColorField ? selected : selected.map(record => ({ ...record, sourceKind: null }));
  const aggregate = field => aggregateCustomRows(groupedRecords, { groupFieldKey: selection.xyColorField || "sourceKind", seriesFieldKey: null, metricKey: fields.get(field).metricKey },
    (key, value, record) => labelOf(selection.xyColorField || null, value, record));
  const horizontal = aggregate(selection.xField);
  const vertical = new Map(aggregate(selection.yField).map(row => [row.groupKey, row]));
  const sizes = new Map((bubbles ? aggregate(selection.bubbleField) : []).map(row => [row.groupKey, row]));
  const rows = horizontal.map(row => {
    const verticalRow = vertical.get(row.groupKey);
    const sizeRow = sizes.get(row.groupKey);
    return { id: JSON.stringify([selection.xyColorField || null, row.groupKey]), label: row.groupLabel,
      groupKey: row.groupKey, groupLabel: row.groupLabel, recordCount: row.recordCount,
      x: row.value, y: verticalRow.value, bubbleValue: sizeRow?.value ?? null,
      xValidCount: row.validCount, xMissingCount: row.missingCount,
      yValidCount: verticalRow.validCount, yMissingCount: verticalRow.missingCount,
      bubbleValidCount: sizeRow?.validCount ?? null, bubbleMissingCount: sizeRow?.missingCount ?? null };
  });
  const points = rows.filter(row => [row.x, row.y, ...(bubbles ? [row.bubbleValue] : [])].every(value => typeof value === "number" && Number.isFinite(value) && value >= 0));
  return { points, rows, recordCount: selected.length, missingCount: rows.length - points.length };
}

export function customPointXRange(points, includeExtremes = false) {
  const full = { maximum: null, shownCount: points.length, outsideCount: 0 };
  if (includeExtremes || points.length < 20) return full;
  const values = points.map(point => point.x).sort((first, second) => first - second);
  const maximum = values[Math.ceil(values.length * 0.95) - 1];
  if (maximum <= 0 || maximum === values.at(-1)) return full;
  const outsideCount = values.filter(value => value > maximum).length;
  return { maximum, shownCount: points.length - outsideCount, outsideCount };
}

export function customPointXYRange(points, includeExtremes = false) {
  const xMaximum = customPointXRange(points, includeExtremes).maximum;
  const yMaximum = customPointXRange(points.map(point => ({ x: point.y })), includeExtremes).maximum;
  const outsideCount = points.filter(point => (xMaximum !== null && point.x > xMaximum) || (yMaximum !== null && point.y > yMaximum)).length;
  return { xMaximum, yMaximum, shownCount: points.length - outsideCount, outsideCount };
}

export function aggregateCustomRows(records, {
  groupFieldKey = "municipalityKey", seriesFieldKey = "impactType", metricKey = "count",
  filters = {}, normalizeWithinGroup = false
} = {}, labelOf = (field, value) => value === null ? "" : String(value)) {
  const metric = customFields.find(field => field.role === "measure" && field.key === metricKey);
  const dimensions = new Set(customFields.filter(field => field.role === "group").map(field => field.key));
  if (!metric || !dimensions.has(groupFieldKey) || (seriesFieldKey && !dimensions.has(seriesFieldKey))) throw new Error("Invalid custom chart fields");
  if (normalizeWithinGroup && metric.aggregation === "median") throw new Error("Medians cannot be stacked as percentages");
  const selected = customRecordsForSelection(records, { groupFieldKey, seriesFieldKey, filters });
  const buckets = new Map();
  for (const record of selected) {
    const groupKey = record[groupFieldKey] ?? null;
    const seriesKey = seriesFieldKey ? record[seriesFieldKey] ?? null : null;
    const key = JSON.stringify([groupKey, seriesKey]);
    if (!buckets.has(key)) buckets.set(key, {
      groupFieldKey, groupKey, groupLabel: labelOf(groupFieldKey, groupKey, record),
      seriesFieldKey: seriesFieldKey || null, seriesKey,
      seriesLabel: seriesFieldKey ? labelOf(seriesFieldKey, seriesKey, record) : null,
      metricKey, value: null, unit: metric.unit, recordCount: 0, validCount: 0,
      missingCount: 0, denominator: null, values: []
    });
    const bucket = buckets.get(key);
    bucket.recordCount++;
    const value = metric.field ? record[metric.field] : 1;
    if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
      bucket.validCount++;
      bucket.values.push(value);
    } else bucket.missingCount++;
  }
  const rows = [...buckets.values()].map(({ values, ...row }) => {
    if (row.validCount) {
      if (metric.aggregation === "median") {
        values.sort((first, second) => first - second);
        const middle = Math.floor(values.length / 2);
        row.value = values.length % 2 ? values[middle] : (values[middle - 1] + values[middle]) / 2;
      } else row.value = values.reduce((total, value) => total + value, 0);
    }
    return row;
  });
  if (normalizeWithinGroup) {
    const totals = new Map();
    rows.forEach(row => totals.set(row.groupKey, (totals.get(row.groupKey) || 0) + (row.value || 0)));
    rows.forEach(row => {
      row.denominator = totals.get(row.groupKey);
      row.value = row.value === null || !row.denominator ? null : row.value / row.denominator * 100;
      row.unit = "percent";
    });
  } else if (metric.aggregation === "percent") {
    rows.forEach(row => {
      row.denominator = selected.length;
      row.value = row.recordCount / selected.length * 100;
    });
  }
  return rows;
}

export function prepareCustomChartRows(records, selection, labelOf, maximumSeries = 8) {
  if (selection.style === "mixed") {
    const mixedSelection = { ...selection, seriesFieldKey: null, normalizeWithinGroup: false };
    const values = aggregateCustomRows(records, mixedSelection, labelOf);
    const bars = new Map(aggregateCustomRows(records, { ...mixedSelection, metricKey: selection.barMetricKey || "count" }, labelOf).map(row => [row.groupKey, row]));
    const rows = values.map(row => {
      const bar = bars.get(row.groupKey);
      return { ...row, barValue: bar.value, barUnit: bar.unit, barValidCount: bar.validCount, barMissingCount: bar.missingCount, barDenominator: bar.denominator };
    });
    return { rows, displayRows: rows, collapsedSeries: false };
  }
  const rows = aggregateCustomRows(records, selection, labelOf);
  const counts = new Map();
  rows.forEach(row => counts.set(row.seriesKey, (counts.get(row.seriesKey) || 0) + row.recordCount));
  if (!selection.seriesFieldKey || counts.size <= maximumSeries) return { rows, displayRows: rows, collapsedSeries: false };
  const retained = new Set([...counts].sort((first, second) => second[1] - first[1]).slice(0, maximumSeries - 1).map(([key]) => key));
  const selected = customRecordsForSelection(records, selection).map(record => retained.has(record[selection.seriesFieldKey] ?? null) ? record : { ...record, [selection.seriesFieldKey]: OTHER_CUSTOM_SERIES });
  return { rows, displayRows: aggregateCustomRows(selected, { ...selection, filters: {} }, labelOf), collapsedSeries: true };
}

const STORAGE_KEY = "entraves-custom-chart-v1";
const PANEL_WIDTH_KEY = "entraves-custom-panel-width-v1";
export const CUSTOM_PANEL_MIN_WIDTH = 250;
export const CUSTOM_PANEL_DEFAULT_WIDTH = 360;

export function clampCustomPanelWidth(width, containerWidth) {
  const maximum = Math.max(CUSTOM_PANEL_MIN_WIDTH, Math.min(520, Math.floor(containerWidth - 404)));
  return Math.max(CUSTOM_PANEL_MIN_WIDTH, Math.min(maximum, Number.isFinite(width) ? width : CUSTOM_PANEL_MIN_WIDTH));
}

const DEFAULT_SELECTION = { groupFieldKey: "municipalityKey", seriesFieldKey: "impactType", metricKey: "count", barMetricKey: "count", style: "stacked-horizontal", limit: 10, xField: "lengthMeters", yField: "plannedDurationDays", bubbleField: "ageDays", xyColorField: "impactType", includeExtremes: false, filters: {} };
const DIMENSIONS = customFields.filter(field => field.role === "group");
const METRICS = customFields.filter(field => field.role === "measure");
const PALETTE = ["#1769aa", "#d85a13", "#25845b", "#933b89", "#bc9320", "#00a0b0", "#ad3151", "#596c2e", "#7547b0", "#846047"];

export function customCategoryColor(field, value, index, colorOf = () => null) {
  if (field === "impactType") return colorOf(field, value) || "#7c8781";
  if (value === null || value === undefined || value === "unknown") return "#7c8781";
  return PALETTE[index] || `hsl(${Math.round(index * 137.508) % 360} 65% ${index % 2 ? 38 : 48}%)`;
}

function readSelection() {
  const state = { ...DEFAULT_SELECTION, filters: {} };
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved || typeof saved !== "object") return state;
    if (DIMENSIONS.some(field => field.key === saved.groupFieldKey)) state.groupFieldKey = saved.groupFieldKey;
    if (saved.seriesFieldKey === null || DIMENSIONS.some(field => field.key === saved.seriesFieldKey)) state.seriesFieldKey = saved.seriesFieldKey;
    if (METRICS.some(field => field.key === saved.metricKey)) state.metricKey = saved.metricKey;
    if (METRICS.some(field => field.key === saved.barMetricKey)) state.barMetricKey = saved.barMetricKey;
    for (const key of ["xField", "yField", "bubbleField"]) if (customXYFields.some(field => field.key === saved[key])) state[key] = saved[key];
    if (saved.xyColorField === null || DIMENSIONS.some(field => field.key === saved.xyColorField)) state.xyColorField = saved.xyColorField;
    if (typeof saved.includeExtremes === "boolean") state.includeExtremes = saved.includeExtremes;
    if ([5, 10, 20, 40].includes(saved.limit)) state.limit = saved.limit;
    if (compatibleCustomStyles(state.metricKey, state.seriesFieldKey).includes(saved.style)) state.style = saved.style;
    for (const field of DIMENSIONS) {
      const values = saved.filters?.[field.key];
      if (Array.isArray(values) && values.length <= 10000 && values.every(value => value === null || typeof value === "string")) state.filters[field.key] = values;
    }
  } catch {}
  if (state.groupFieldKey === state.seriesFieldKey) state.seriesFieldKey = null;
  if (state.xField === state.yField) state.yField = customXYFields.find(field => field.key !== state.xField).key;
  return state;
}

export function createCustomView(root, context) {
  let state = readSelection();
  let allRecords = [];
  let scope = {};
  let chart = null;
  let drawVersion = 0;
  let lastSignature = "";
  let tableSort = { key: "groupLabel", direction: 0 };
  let tableRows = [];
  let shownChart = null;
  let pointResult = null;
  let pointRange = null;
  let chartFailed = false;
  const desktop = matchMedia("(min-width: 881px)");
  let controlsOpen = desktop.matches;
  let periodOpen = false;
  let impactOpen = false;
  let timeOpen = false;
  let valuesOpen = false;
  const facetOpen = new Set();
  const searches = new Map();
  const searchHeights = new Map();
  const searchSelectionEligible = new Map();
  const listeners = new AbortController();
  let preferredPanelWidth = CUSTOM_PANEL_DEFAULT_WIDTH;
  try {
    const stored = Number(localStorage.getItem(PANEL_WIDTH_KEY));
    if (Number.isFinite(stored) && stored >= CUSTOM_PANEL_MIN_WIDTH) preferredPanelWidth = Math.min(520, stored);
  } catch {}
  let resizing = null;
  let renderAfterResize = false;
  let helpDialog = null;
  let helpAnimation = null;
  let activeHelp = null;
  let helpClosing = false;
  const text = key => context.t(key);
  const esc = value => context.escapeHtml(String(value ?? ""));
  const attr = value => context.escapeAttr(String(value ?? ""));
  const number = (value, digits = 0) => context.numberFormat(value, digits);
  const translated = (key, values) => text(key).replace(/\{(\w+)\}/g, (match, name) => values[name] ?? match);
  const dimension = key => DIMENSIONS.find(field => field.key === key);
  const metric = () => METRICS.find(field => field.key === state.metricKey);
  const barMetric = () => METRICS.find(field => field.key === state.barMetricKey);
  const unitLabel = unit => unit === "percent" ? "%" : unit === "meters" ? "km" : unit === "days" ? text("stats.custom.months") : text("stats.custom.records");
  const scaledValue = customDisplayValue;
  const displayNumber = (value, unit) => unit === "days" && value > 0 && value < 0.1 ? `<${number(0.1, 1)}` : number(value, unit === "count" ? 0 : unit === "days" ? 1 : 2);
  const ticksFor = unit => ({ precision: unit === "count" ? 0 : unit === "days" ? 1 : 2, callback: value => displayNumber(value, unit) });
  const xyField = key => customXYFields.find(field => field.key === key);
  const xyValue = (value, key) => scaledValue(value, xyField(key).unit);
  const activeRecords = () => allRecords.filter(record => record._inScope !== false);
  const valueLabel = row => row.value === null ? text("stats.custom.unknown") : `${displayNumber(scaledValue(row.value, row.unit), row.unit)}${row.unit === "percent" ? " %" : row.unit === "meters" ? " km" : row.unit === "days" ? ` ${text("stats.custom.months")}` : ""}`;

  function applyPanelWidth() {
    const width = clampCustomPanelWidth(preferredPanelWidth, root.clientWidth);
    root.style.setProperty("--custom-controls-width", `${width}px`);
    const handle = root.querySelector("[data-custom-resize]");
    if (handle) {
      handle.setAttribute("aria-valuenow", String(width));
      handle.setAttribute("aria-valuemax", String(clampCustomPanelWidth(520, root.clientWidth)));
    }
    return width;
  }

  function savePanelWidth() {
    try { localStorage.setItem(PANEL_WIDTH_KEY, String(preferredPanelWidth)); } catch {}
  }

  const helpLabels = { page: "stats.custom.help.title", style: "stats.custom.style", orientation: "stats.custom.orientation", arrangement: "stats.custom.arrangement", limit: "stats.custom.groups",
    groupFieldKey: "stats.custom.xCategory", metricKey: "stats.custom.yMeasure", barMetricKey: "stats.custom.leftY", seriesFieldKey: "stats.custom.split",
    xField: "stats.custom.xAxis", yField: "stats.custom.yAxis", bubbleField: "stats.custom.bubbleSize", xyColorField: "stats.custom.colorBy" };

  const helpLabel = topic => text(customAxisControls(state.style).find(control => control.key === topic)?.labelKey || helpLabels[topic]);

  function helpButton(topic) {
    const label = translated("stats.custom.help.about", { label: helpLabel(topic) });
    return `<button type="button" class="custom-help-icon" data-custom-help="${topic}" aria-label="${attr(label)}" title="${attr(label)}" aria-haspopup="dialog" aria-expanded="false"><img src="https://unpkg.com/lucide-static@0.468.0/icons/info.svg" width="22" height="22" alt="" aria-hidden="true"></button>`;
  }

  function helpTable(headers, rows) {
    return `<div class="custom-help-table"><table class="stats-table" role="table"><thead role="rowgroup"><tr role="row">${headers.map(header => `<th scope="col" role="columnheader">${esc(header)}</th>`).join("")}</tr></thead><tbody role="rowgroup">${rows.map(row => `<tr role="row">${row.map(cell => `<td role="cell">${esc(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  }

  function styleHelp() {
    const types = [...new Set(ADDITIVE_STYLES.map(style => customStyleParts(style).type))];
    return helpTable([text("stats.custom.style"), text("stats.custom.help.definition")], types.map(type => [text(`stats.custom.chartType.${type}`), text(`stats.custom.help.style.${type}`)]));
  }

  function helpContent(topic) {
    if (topic === "style") return `<p>${esc(text("stats.custom.help.styleIntro"))}</p>${styleHelp()}`;
    if (topic === "orientation") return `<p>${esc(text("stats.custom.help.orientationIntro"))}</p>${helpTable([text("stats.custom.help.choice"), text("stats.custom.help.definition")], ["horizontal", "vertical"].map(value => [text(`stats.custom.orientation.${value}`), text(`stats.custom.help.orientation.${value}`)]))}`;
    if (topic === "arrangement") return `<p>${esc(text("stats.custom.help.arrangementIntro"))}</p>${helpTable([text("stats.custom.help.choice"), text("stats.custom.help.definition")], ["grouped", "stacked", "percent"].map(value => [text(`stats.custom.arrangement.${value}`), text(`stats.custom.help.arrangement.${value}`)]))}`;
    if (topic === "limit") return `<p>${esc(text("stats.custom.help.groups"))}</p>`;
    if (["groupFieldKey", "metricKey", "barMetricKey", "seriesFieldKey", "xField", "yField", "bubbleField", "xyColorField"].includes(topic)) {
      const category = ["groupFieldKey", "seriesFieldKey", "xyColorField"].includes(topic);
      const numeric = ["xField", "yField", "bubbleField"].includes(topic);
      const catalog = category ? DIMENSIONS : numeric ? customXYFields : METRICS;
      const intro = { groupFieldKey: "category", metricKey: "measure", barMetricKey: "measure", seriesFieldKey: "series", xField: "x", yField: "y", bubbleField: "bubble", xyColorField: "color" }[topic];
      const rows = [...root.querySelector(`[data-custom-select="${topic}"]`).options].map(option => {
        if (!option.value) return [option.textContent, text("stats.custom.help.axis.none")];
        const field = catalog.find(entry => entry.key === option.value);
        return category ? [option.textContent, text(field.labelKey.replace(".field.", ".help.field."))]
          : [option.textContent, text(`stats.custom.help.unit.${field.unit}`), text(`stats.custom.help.${numeric ? "observation" : "metric"}.${field.key}`)];
      });
      return `<p>${esc(text(`stats.custom.help.axis.${intro}`))}</p>${helpTable([text("stats.custom.help.choice"), ...(category ? [] : [text("stats.custom.help.type")]), text("stats.custom.help.definition")], rows)}`;
    }
    const stepKeys = ["step1", "step2", "step3", "step4"];
    return `<p class="custom-help-intro">${esc(text("stats.custom.help.intro"))}</p>
      <section><h3>${esc(text("stats.custom.help.stepsTitle"))}</h3><ol>${stepKeys.map(key => `<li>${esc(text(`stats.custom.help.${key}`))}</li>`).join("")}</ol></section>
      <section><h3>${esc(text("stats.custom.help.fieldsTitle"))}</h3>${helpTable([text("stats.custom.help.choice"), text("stats.custom.help.definition")], DIMENSIONS.map(field => [text(field.labelKey), text(field.labelKey.replace(".field.", ".help.field."))]))}</section>
      <section><h3>${esc(text("stats.custom.help.measuresTitle"))}</h3>${helpTable([text("stats.custom.help.choice"), text("stats.custom.help.type"), text("stats.custom.help.definition")], METRICS.map(field => [text(field.labelKey), text(`stats.custom.help.unit.${field.unit}`), text(`stats.custom.help.metric.${field.key}`)]))}<p>${esc(text("stats.custom.help.months"))}</p><p>${esc(text("stats.custom.help.dates"))}</p></section>
      <section><h3>${esc(text("stats.custom.help.controlsTitle"))}</h3>${helpTable([text("stats.custom.help.choice"), text("stats.custom.help.definition")], [["axes", "axes"], ["filters", "filters"], ["period", "period"]].map(([label, definition]) => [text(`stats.custom.help.control.${label}`), text(`stats.custom.help.controlDefinition.${definition}`)]))}</section>
      <section><h3>${esc(text("stats.custom.help.missingTitle"))}</h3><p>${esc(text("stats.custom.help.missing"))}</p><p>${esc(text("stats.custom.help.comparison"))}</p><p>${esc(text("stats.custom.help.organizationFix"))}</p></section>
      <section><h3>${esc(text("stats.custom.style"))}</h3>${styleHelp()}</section>`;
  }

  async function closeHelp() {
    if (!helpDialog?.open || helpClosing) return;
    helpClosing = true;
    helpAnimation?.cancel();
    const panel = helpDialog.querySelector(".custom-help-panel");
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
      helpAnimation = panel.animate([{ opacity: 1, transform: "translateY(0)" }, { opacity: 0, transform: "translateY(8px)" }], { duration: 160, easing: "ease-in", fill: "forwards" });
      await helpAnimation.finished.catch(() => {});
    }
    const topic = activeHelp;
    helpDialog.close();
    helpAnimation?.cancel();
    activeHelp = null;
    helpClosing = false;
    const trigger = root.querySelector(`[data-custom-help="${topic}"]`);
    trigger?.setAttribute("aria-expanded", "false");
    trigger?.focus({ preventScroll: true });
  }

  function openHelp(topic) {
    if (!helpLabels[topic]) return;
    if (!helpDialog) {
      helpDialog = document.createElement("dialog");
      helpDialog.className = "custom-help-dialog";
      helpDialog.setAttribute("aria-labelledby", "custom-help-title");
      document.body.append(helpDialog);
      helpDialog.addEventListener("cancel", event => { event.preventDefault(); closeHelp(); }, { signal: listeners.signal });
      helpDialog.addEventListener("keydown", event => {
        if (event.key !== "Tab") return;
        const focusable = [...helpDialog.querySelectorAll("button, [tabindex='0']")];
        const first = focusable[0];
        const last = focusable.at(-1);
        if ((event.shiftKey && document.activeElement === first) || (!event.shiftKey && document.activeElement === last)) {
          event.preventDefault();
          (event.shiftKey ? last : first).focus({ preventScroll: true });
        }
      }, { signal: listeners.signal });
      helpDialog.addEventListener("click", event => { if (event.target === helpDialog || event.target.closest("[data-custom-help-close]")) closeHelp(); }, { signal: listeners.signal });
    }
    helpAnimation?.cancel();
    helpClosing = false;
    activeHelp = topic;
    helpDialog.innerHTML = `<div class="custom-help-panel"><header><h2 id="custom-help-title">${esc(helpLabel(topic))}</h2><button type="button" data-custom-help-close aria-label="${attr(text("stats.custom.help.close"))}" title="${attr(text("stats.custom.help.close"))}"><img src="https://unpkg.com/lucide-static@0.468.0/icons/x.svg" width="20" height="20" alt="" aria-hidden="true"></button></header><div class="custom-help-body" tabindex="0">${helpContent(topic)}</div></div>`;
    helpDialog.showModal();
    root.querySelector(`[data-custom-help="${topic}"]`)?.setAttribute("aria-expanded", "true");
    helpDialog.querySelector("[data-custom-help-close]").focus({ preventScroll: true });
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) helpAnimation = helpDialog.querySelector(".custom-help-panel").animate([{ opacity: 0, transform: "translateY(12px)" }, { opacity: 1, transform: "translateY(0)" }], { duration: 240, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" });
  }

  function fitViewport() {
    const outer = root.closest(".stats-view");
    const layout = root.querySelector(".custom-layout");
    if (!outer || !layout || !desktop.matches || root.clientWidth < 760) return;
    const offset = layout.getBoundingClientRect().top - outer.getBoundingClientRect().top + outer.scrollTop;
    const available = Math.max(340, Math.floor(outer.clientHeight - offset - 12));
    const headingHeight = root.querySelector("#custom-choices-title")?.getBoundingClientRect().height || 43;
    root.style.setProperty("--custom-available-height", `${available}px`);
    root.style.setProperty("--custom-controls-body-height", `${Math.max(220, available - headingHeight)}px`);
  }

  function optionsFor(key, records) {
    const options = new Map();
    for (const record of records) {
      const value = record[key] ?? null;
      if (!options.has(value)) options.set(value, { value, label: context.labelOf(key, value, record), count: 0 });
      options.get(value).count++;
    }
    for (const value of state.filters[key] || []) {
      if (!options.has(value)) options.set(value, { value, label: context.labelOf(key, value), count: 0 });
    }
    return [...options.values()].sort((first, second) => first.value === null ? 1 : second.value === null ? -1 : first.label.localeCompare(second.label, scope.language));
  }

  function selectControl(key, label, choices, value, disabled = false) {
    const control = `<select${helpLabels[key] ? ` id="custom-select-${key}"` : ""} data-custom-select="${key}" data-custom-focus="${key}"${disabled ? " disabled" : ""}>${choices.map(choice => `<option value="${attr(choice.value ?? "")}"${choice.value === value ? " selected" : ""}>${esc(choice.label)}</option>`).join("")}</select>`;
    return helpLabels[key] ? `<div class="custom-select"><div class="custom-select-heading"><label for="custom-select-${key}">${esc(label)}</label>${helpButton(key)}</div>${control}</div>` : `<label class="custom-select"><span>${esc(label)}</span>${control}</label>`;
  }

  function axesHtml() {
    return customAxisControls(state.style).map(control => {
      const choices = customAxisChoices(state.style, control.key, state);
      return selectControl(control.key, text(control.labelKey), choices.map(field => ({ value: field.key, label: text(field.labelKey) })), state[control.key]);
    }).join("");
  }

  function facetHtml(key, records) {
    const field = dimension(key);
    const options = optionsFor(key, records);
    const selected = state.filters[key];
    const selectedCount = selected ? options.filter(option => selected.includes(option.value)).length : options.length;
    const allSelected = options.length > 0 && selectedCount === options.length;
    const mixed = selectedCount > 0 && !allSelected;
    const search = searches.get(key) || "";
    const words = context.normalizeSearchText(search).split(" ").filter(Boolean);
    const canKeepSelection = words.length > 0 && searchSelectionEligible.get(key) === true;
    const matching = options.filter(option => words.every(word => context.normalizeSearchText(option.label).includes(word)));
    const matchingSelected = matching.filter(option => !selected || selected.includes(option.value)).length;
    return `<details class="custom-facet" data-custom-facet="${key}"${facetOpen.has(key) ? " open" : ""}>
      <summary>${esc(text(field.labelKey))}<span>${selected ? `${number(selected.length)} / ${number(options.length)}` : esc(text("stats.filterAll"))}</span></summary>
      <div class="custom-facet-tools"><label class="custom-all"><input type="checkbox" data-custom-all="${key}" data-custom-mixed="${mixed}" data-custom-focus="all-${key}" aria-label="${attr(`${text("stats.custom.all")} : ${text(field.labelKey)}`)}"${allSelected ? " checked" : ""}${options.length ? "" : " disabled"}><span>${esc(text("stats.custom.all"))}</span></label><div class="custom-search-action"><button type="button" class="custom-search-selection" data-custom-search-only="${key}" data-custom-focus="search-only-${key}"${canKeepSelection ? "" : " hidden"}${matchingSelected ? "" : " disabled"}>${esc(text("stats.custom.keepSelection"))}</button></div></div>
      <input type="search" class="custom-search" value="${attr(search)}" data-custom-search="${key}" data-custom-focus="search-${key}" aria-label="${attr(`${text("stats.custom.search")} ${text(field.labelKey)}`)}" placeholder="${attr(text("stats.custom.search"))}">
      <div class="custom-options" data-custom-options="${key}"${searchHeights.has(key) ? ` style="height:${searchHeights.get(key)}px"` : ""}><p class="custom-search-empty" data-custom-no-results role="status"${matching.length ? " hidden" : ""}>${esc(text(words.length ? "stats.custom.noMatches" : "stats.custom.noOptions"))}</p>${options.map(option => `<label data-custom-option data-search="${attr(context.normalizeSearchText(option.label))}"${words.every(word => context.normalizeSearchText(option.label).includes(word)) ? "" : " hidden"}><input type="checkbox" data-custom-check="${key}" value="${attr(JSON.stringify(option.value))}" data-custom-focus="${attr(`check-${key}-${JSON.stringify(option.value)}`)}"${!selected || selected.includes(option.value) ? " checked" : ""}><span>${esc(option.label)}</span><small>${number(option.count)}</small></label>`).join("")}</div>
    </details>`;
  }

  function scopeHtml() {
    return `<details class="custom-period custom-facet"${periodOpen ? " open" : ""}><summary>${esc(text("stats.custom.period"))}</summary><div class="custom-scope">
      ${selectControl("dateMode", text("stats.custom.period"), [{ value: "period", label: text("stats.custom.activePeriod") }, { value: "all", label: text("stats.custom.allDates") }], scope.allDates ? "all" : "period")}
      ${scope.allDates ? "" : `<div class="custom-date-row"><label>${esc(text("stats.custom.start"))}<input type="date" data-custom-date="start" data-custom-focus="start" value="${attr(scope.start)}"></label><label>${esc(text("stats.custom.end"))}<input type="date" data-custom-date="end" data-custom-focus="end" value="${attr(scope.end)}" min="${attr(scope.start)}"></label></div>`}
    </div></details>`;
  }

  function timeHtml() {
    return `<details class="custom-facet custom-time"${timeOpen ? " open" : ""}><summary>${esc(text("stats.custom.time"))}</summary><fieldset class="custom-checks"><legend class="custom-sr-only">${esc(text("stats.custom.time"))}</legend>${["day", "night"].map(value => `<label><input type="checkbox" data-custom-time="${value}" data-custom-focus="time-${value}"${scope.periods.includes(value) ? " checked" : ""}>${esc(text(`stats.custom.time.${value}`))}</label>`).join("")}</fieldset></details>`;
  }

  function impactHtml() {
    return `<details class="custom-facet custom-impacts"${impactOpen ? " open" : ""}><summary>${esc(text("stats.custom.field.impact"))}</summary><fieldset class="custom-checks custom-impact-checks"><legend class="custom-sr-only">${esc(text("stats.custom.field.impact"))}</legend>${["critical", "major", "moderate", "parking"].map(value => `<label><input type="checkbox" data-custom-impact="${value}" data-custom-focus="impact-${value}"${scope.impacts.includes(value) ? " checked" : ""}><i style="background:${attr(context.colorOf("impactType", value))}"></i>${esc(context.labelOf("impactType", value))}</label>`).join("")}</fieldset></details>`;
  }

  function chartData(rows) {
    const groups = new Map();
    const series = new Map();
    rows.forEach(row => {
      if (!groups.has(row.groupKey)) groups.set(row.groupKey, { key: row.groupKey, label: row.groupLabel, count: 0, rows: [] });
      const group = groups.get(row.groupKey);
      group.count += row.recordCount;
      group.rows.push(row);
      if (!series.has(row.seriesKey)) series.set(row.seriesKey, { key: row.seriesKey, label: row.seriesLabel });
    });
    const ordered = [...groups.values()].sort((first, second) => second.count - first.count || first.label.localeCompare(second.label, scope.language));
    const shown = ordered.slice(0, state.limit);
    const circular = DISTRIBUTION_TYPES.includes(state.style);
    if (circular && ordered.length > shown.length) {
      const rest = ordered.slice(shown.length).flatMap(group => group.rows);
      shown.push({ key: "__other_groups", label: text("stats.custom.otherGroups"), rows: [{ value: rest.some(row => row.value !== null) ? rest.reduce((total, row) => total + (row.value || 0), 0) : null }] });
    }
    return { groups: shown, series: [...series.values()], totalGroups: ordered.length, circular, unit: rows[0]?.unit || metric().unit };
  }

  function renderTable() {
    const host = root.querySelector(".custom-table-host");
    if (!host) return;
    const pointMode = POINT_TYPES.includes(state.style);
    const mixed = state.style === "mixed";
    const dimensions = pointMode ? { constantStatus: null } : customTableDimensions(tableRows, state.groupFieldKey, state.seriesFieldKey);
    const columns = pointMode ? [
      ["label", text(state.xyColorField ? dimension(state.xyColorField).labelKey : "stats.custom.group")],
      ["recordCount", text("stats.custom.records")],
      ["x", text(xyField(state.xField).labelKey)], ["xValidCount", translated("stats.custom.knownAxis", { axis: "X" })],
      ["y", text(xyField(state.yField).labelKey)], ["yValidCount", translated("stats.custom.knownAxis", { axis: "Y" })],
      ...(state.style === "bubble" ? [["bubbleValue", text(xyField(state.bubbleField).labelKey)], ["bubbleValidCount", text("stats.custom.knownBubble")]] : [])
    ] : [
      ...(dimensions.group ? [["groupLabel", text(dimension(state.groupFieldKey).labelKey)]] : []),
      ...(dimensions.series ? [["seriesLabel", text(dimension(state.seriesFieldKey).labelKey)]] : []),
      ...(mixed ? [["barValue", `${text("stats.custom.leftY")} : ${text(barMetric().labelKey)}`]] : []),
      ["value", mixed ? `${text("stats.custom.rightY")} : ${text(metric().labelKey)}` : text("stats.custom.value")], ["recordCount", text("stats.custom.records")],
      ...(mixed ? [["barValidCount", text("stats.custom.validLeft")], ["barMissingCount", text("stats.custom.missingLeft")]] : []),
      ["validCount", text(mixed ? "stats.custom.validRight" : "stats.custom.valid")], ["missingCount", text(mixed ? "stats.custom.missingRight" : "stats.custom.missing")],
      ...(mixed && tableRows.some(row => row.barDenominator !== null) ? [["barDenominator", `${text("stats.custom.denominator")} (Y1)`]] : []),
      ...(tableRows.some(row => row.denominator !== null) ? [["denominator", `${text("stats.custom.denominator")}${mixed ? " (Y2)" : ""}`]] : [])
    ];
    const textColumn = key => ["groupLabel", "seriesLabel", "label", "sourceLabel"].includes(key);
    const cellValue = (row, key) => {
      if (pointMode && ["x", "y", "bubbleValue"].includes(key)) {
        const field = key === "x" ? state.xField : key === "y" ? state.yField : state.bubbleField;
        return row[key] === null ? text("stats.custom.unknown") : displayNumber(xyValue(row[key], field), xyField(field).unit);
      }
      return key === "barValue" ? valueLabel({ value: row.barValue, unit: row.barUnit }) : key === "value" ? valueLabel(row) : typeof row[key] === "number" ? number(row[key], ["denominator", "barDenominator"].includes(key) ? 2 : 0) : row[key] ?? text("stats.custom.unknown");
    };
    if (!columns.some(([key]) => key === tableSort.key)) tableSort = { key: columns[0][0], direction: 0 };
    const collator = new Intl.Collator(scope.language, { numeric: true, sensitivity: "base" });
    const sorted = [...tableRows];
    if (tableSort.direction) sorted.sort((first, second) => {
      const left = first[tableSort.key];
      const right = second[tableSort.key];
      if (left === null && right === null) return 0;
      if (left === null) return 1;
      if (right === null) return -1;
      return (typeof left === "number" ? left - right : collator.compare(String(left ?? ""), String(right ?? ""))) * tableSort.direction;
    });
    host.innerHTML = `${dimensions.constantStatus ? `<p class="custom-constant-status">${esc(translated("stats.custom.constantStatus", { status: dimensions.constantStatus }))}</p>` : ""}
      <div class="stats-table-wrap custom-table-scroll"><table class="stats-table"><caption class="custom-sr-only">${esc(text("stats.custom.values"))}</caption><thead><tr>${columns.map(([key, label]) => {
        const direction = tableSort.key === key ? tableSort.direction : 0;
        const action = translated(direction === 1 ? "stats.sortDescending" : direction === -1 ? "stats.custom.sortOriginal" : "stats.sortAscending", { column: label });
        return `<th scope="col" class="${textColumn(key) ? "" : "num"}${direction ? " is-sorted" : ""}" aria-sort="${direction === 1 ? "ascending" : direction === -1 ? "descending" : "none"}"><span class="stats-th"><button type="button" class="stats-sort" data-custom-sort="${key}" title="${attr(action)}" aria-label="${attr(action)}"><span>${esc(label)}</span>${context.sortIcon(direction)}</button></span></th>`;
      }).join("")}</tr></thead><tbody>${sorted.map(row => `<tr${pointMode ? ` data-custom-point-id="${attr(row.id)}"` : ""}>${columns.map(([key]) => `<td${textColumn(key) ? "" : ' class="num"'}>${esc(cellValue(row, key))}</td>`).join("")}</tr>`).join("")}</tbody></table></div><p class="stats-scroll-hint" aria-hidden="true" hidden></p>`;
    context.limitTable(host.querySelector(".stats-table-wrap"));
  }

  async function draw() {
    const version = ++drawVersion;
    chart?.destroy();
    chart = null;
    const canvas = root.querySelector("canvas");
    if (!canvas || (!shownChart && !pointResult)) return;
    try {
      const Chart = await context.loadChart();
      if (version !== drawVersion || !root.isConnected || listeners.signal.aborted) return;
      chartFailed = false;
      root.querySelector(".custom-chart-error").hidden = true;
      if (POINT_TYPES.includes(state.style)) {
        const groups = new Map();
        pointResult.points.forEach(point => {
          if (!groups.has(point.groupKey)) groups.set(point.groupKey, { label: point.groupLabel || text("stats.custom.observations"), color: customCategoryColor(state.xyColorField, point.groupKey, groups.size, context.colorOf) });
        });
        const maximum = pointResult.points.reduce((highest, point) => Math.max(highest, point.bubbleValue || 0), 0);
        const data = pointResult.points.map(point => ({ ...point, x: xyValue(point.x, state.xField), y: xyValue(point.y, state.yField), ...(state.style === "bubble" ? { r: Math.max(5, 14 * Math.sqrt((point.bubbleValue || 0) / (maximum || 1))) } : {}) }));
        const colors = pointResult.points.map(point => groups.get(point.groupKey).color);
        chart = new Chart(canvas, {
          type: state.style,
          data: { datasets: [{ label: text("stats.custom.observations"), data, backgroundColor: colors, borderColor: colors, pointBackgroundColor: colors, pointBorderColor: colors, borderWidth: 1, pointRadius: 5 }] },
          options: {
            responsive: true, maintainAspectRatio: false, animation: false,
            scales: {
              x: { type: "linear", beginAtZero: true, ...(pointRange.xMaximum === null ? {} : { max: xyValue(pointRange.xMaximum, state.xField) }), title: { display: true, text: text(xyField(state.xField).labelKey) }, ticks: ticksFor(xyField(state.xField).unit), grid: { color: "#e3e9e5" } },
              y: { type: "linear", beginAtZero: true, ...(pointRange.yMaximum === null ? {} : { max: xyValue(pointRange.yMaximum, state.yField) }), title: { display: true, text: text(xyField(state.yField).labelKey) }, ticks: ticksFor(xyField(state.yField).unit), grid: { color: "#e3e9e5" } }
            },
            plugins: { legend: { display: false }, tooltip: { callbacks: {
              title: entries => entries[0]?.raw?.label || "",
              label: item => [
                `${text(xyField(state.xField).labelKey)} : ${displayNumber(item.raw.x, xyField(state.xField).unit)} (${number(item.raw.xValidCount)} ${text("stats.custom.knownValues")})`,
                `${text(xyField(state.yField).labelKey)} : ${displayNumber(item.raw.y, xyField(state.yField).unit)} (${number(item.raw.yValidCount)} ${text("stats.custom.knownValues")})`,
                ...(state.style === "bubble" ? [`${text(xyField(state.bubbleField).labelKey)} : ${displayNumber(xyValue(item.raw.bubbleValue, state.bubbleField), xyField(state.bubbleField).unit)} (${number(item.raw.bubbleValidCount)} ${text("stats.custom.knownValues")})`] : []),
                `${number(item.raw.recordCount)} ${text("stats.custom.records")}`
              ].filter(Boolean)
            } } }
          }
        });
        root.querySelector(".custom-legend").innerHTML = [...groups.values()].map(group => `<li><i style="background:${attr(group.color)}"></i><span>${esc(group.label)}</span></li>`).join("");
        return;
      }
      const data = shownChart;
      const scaled = value => scaledValue(value, data.unit);
      const labels = data.groups.map(group => group.label);
      const color = (key, value, index) => customCategoryColor(key, value, index, context.colorOf);
      const impactGroups = state.groupFieldKey === "impactType" && state.seriesFieldKey !== "impactType";
      const colorByGroup = impactGroups || !state.seriesFieldKey;
      const groupColors = data.groups.map((group, index) => color(state.groupFieldKey, group.key, index));
      const radar = state.style === "radar";
      const line = state.style === "line";
      const mixed = state.style === "mixed";
      let datasets = data.circular
        ? [{ data: data.groups.map(group => scaled(group.rows[0]?.value ?? null)), backgroundColor: groupColors, borderColor: "#ffffff", borderWidth: 2 }]
        : data.series.map((series, index) => ({ label: series.label || text(metric().labelKey), data: data.groups.map(group => { const row = group.rows.find(entry => entry.seriesKey === series.key); return row ? scaled(row.value) : metric().aggregation === "median" ? null : 0; }), backgroundColor: colorByGroup ? groupColors : color(state.seriesFieldKey, series.key, index), borderWidth: 0, borderRadius: 2, maxBarThickness: 32 }));
      if (radar || line) datasets = datasets.map(dataset => ({ ...dataset, borderColor: colorByGroup ? "#65736d" : dataset.backgroundColor, pointBackgroundColor: dataset.backgroundColor, pointBorderColor: dataset.backgroundColor, borderWidth: 2, pointRadius: 3, fill: false, spanGaps: false, tension: 0 }));
      if (mixed) datasets = [
        { type: "bar", label: text(barMetric().labelKey), data: data.groups.map(group => scaledValue(group.rows[0].barValue, group.rows[0].barUnit)), yAxisID: "y", backgroundColor: groupColors, maxBarThickness: 32, customUnit: barMetric().unit, order: 2 },
        { type: "line", label: text(metric().labelKey), data: data.groups.map(group => scaled(group.rows[0].value)), yAxisID: "measure", backgroundColor: "#b74a65", borderColor: impactGroups ? "#65736d" : "#b74a65", pointBackgroundColor: impactGroups ? groupColors : "#b74a65", pointBorderColor: impactGroups ? groupColors : "#b74a65", borderWidth: 2, pointRadius: 3, spanGaps: false, tension: 0, customUnit: data.unit, order: 1 }
      ];
      const horizontal = state.style.includes("horizontal");
      const stacked = state.style.startsWith("stacked-") || state.style.startsWith("percent-");
      const normalized = state.style.startsWith("percent-");
      const unit = unitLabel(data.unit);
      const measureTitle = `${text(metric().labelKey)} (${unit})`;
      const categoryTitle = text(dimension(state.groupFieldKey).labelKey);
      chart = new Chart(canvas, {
        type: data.circular || radar || line ? state.style : "bar", data: { labels, datasets },
        options: {
          responsive: true, maintainAspectRatio: false,
          animation: matchMedia("(prefers-reduced-motion: reduce)").matches ? false : { duration: 250 },
          indexAxis: radar || state.style === "polarArea" ? "r" : horizontal ? "y" : "x",
          plugins: { legend: { display: false }, tooltip: { callbacks: { label: item => `${item.dataset.label || item.label}: ${displayNumber(item.raw, item.dataset.customUnit || data.unit)} ${unitLabel(item.dataset.customUnit || data.unit)}` } } },
          ...(radar || state.style === "polarArea" ? { scales: { r: { beginAtZero: true, ticks: ticksFor(data.unit), pointLabels: { callback: value => { const maximum = canvas.clientWidth < 480 ? 12 : 26; return value.length > maximum ? value.slice(0, maximum - 3) + "..." : value; } } } } } : data.circular ? {} : mixed ? { scales: {
            x: { title: { display: true, text: categoryTitle }, grid: { display: false }, ticks: { maxRotation: 35, minRotation: 0 } },
            y: { beginAtZero: true, position: "left", title: { display: true, text: `${text(barMetric().labelKey)} (${unitLabel(barMetric().unit)})` }, ticks: ticksFor(barMetric().unit) },
            measure: { beginAtZero: true, position: "right", title: { display: true, text: measureTitle }, ticks: ticksFor(data.unit), grid: { drawOnChartArea: false } }
          } } : { scales: {
            [horizontal ? "x" : "y"]: { beginAtZero: true, stacked, ...(normalized ? { max: 100 } : {}), title: { display: true, text: measureTitle }, ticks: ticksFor(data.unit), grid: { color: "#e3e9e5" } },
            [horizontal ? "y" : "x"]: { title: { display: true, text: categoryTitle }, stacked, ticks: { autoSkip: false, callback(value) { const label = this.getLabelForValue(value); return label.length > 32 ? label.slice(0, 29) + "..." : label; } }, grid: { display: false } }
          } })
        }
      });
      const legend = data.circular || colorByGroup ? data.groups.map((group, index) => ({ label: group.label, color: groupColors[index] })) : datasets.map(dataset => ({ label: dataset.label, color: dataset.backgroundColor }));
      root.querySelector(".custom-legend").innerHTML = legend.map(entry => `<li><i style="background:${attr(entry.color)}"></i><span>${esc(entry.label)}</span></li>`).join("");
    } catch {
      if (version !== drawVersion || listeners.signal.aborted) return;
      chartFailed = true;
      root.querySelector(".custom-chart-error").hidden = false;
      root.querySelector(".custom-values").open = true;
      valuesOpen = true;
    }
  }

  function render() {
    if (resizing) { renderAfterResize = true; return; }
    const previousControls = root.querySelector(".custom-controls");
    if (previousControls?.tagName === "DETAILS") controlsOpen = previousControls.open;
    periodOpen = root.querySelector(".custom-period")?.open ?? periodOpen;
    impactOpen = root.querySelector(".custom-impacts")?.open ?? impactOpen;
    timeOpen = root.querySelector(".custom-time")?.open ?? timeOpen;
    valuesOpen = root.querySelector(".custom-values")?.open ?? valuesOpen;
    const pointMode = POINT_TYPES.includes(state.style);
    const effectiveSelection = pointMode ? { ...state, groupFieldKey: state.xyColorField, seriesFieldKey: null } : state;
    const boroughMode = isBoroughSelection(effectiveSelection);
    const montrealSelected = !Array.isArray(state.filters.municipalityKey) || state.filters.municipalityKey.includes("montreal");
    if (!boroughMode && !montrealSelected) delete state.filters.boroughKey;
    if (state.style === "mixed" && state.metricKey === state.barMetricKey) state.metricKey = state.barMetricKey === "duration" ? "count" : "duration";
    const styles = compatibleCustomStyles(state.metricKey, state.seriesFieldKey);
    if (!styles.includes(state.style)) state.style = composeCustomStyle(customStyleParts(state.style), state.metricKey, state.seriesFieldKey);
    const presentation = customStyleParts(state.style);
    const chartTypes = [...new Set([...styles, ...compatibleCustomStyles(state.metricKey, null)].map(style => customStyleParts(style).type))];
    const arrangements = [...new Set(styles.filter(style => customStyleParts(style).type === "bar").map(style => customStyleParts(style).arrangement))];
    const limits = presentation.type === "radar" ? [5, 10] : [10, 20, 40];
    if (!limits.includes(state.limit)) state.limit = 10;
    const records = boroughMode ? activeRecords().filter(record => record.municipalityKey === "montreal") : activeRecords();
    pointResult = pointMode ? customPointData(records, state, (key, value, record) => key ? context.labelOf(key, value, record) : text("stats.custom.allRecords")) : null;
    pointRange = pointMode ? customPointXYRange(pointResult.points, state.includeExtremes) : null;
    const prepared = pointMode ? { rows: pointResult.rows, collapsedSeries: false } : prepareCustomChartRows(records, { ...state, normalizeWithinGroup: state.style.startsWith("percent-") }, (key, value, record) => value === OTHER_CUSTOM_SERIES ? text("stats.custom.otherSeries") : context.labelOf(key, value, record));
    tableRows = prepared.rows;
    shownChart = pointMode ? null : chartData(prepared.displayRows);
    const signature = JSON.stringify([desktop.matches, state, scope, tableRows, DIMENSIONS.map(field => [field.key, optionsFor(field.key, records)])]);
    if (signature === lastSignature) return;
    lastSignature = signature;
    const active = root.contains(document.activeElement) ? document.activeElement : null;
    const focused = active?.dataset.customFocus;
    const caret = active?.matches("input[type=search]") ? [active.selectionStart, active.selectionEnd] : null;
    const outer = root.closest(".stats-view");
    const outerScrollTop = outer?.scrollTop || 0;
    const panelScrollTop = root.querySelector(".custom-control-body")?.scrollTop || 0;
    const tableScrollTop = root.querySelector(".custom-table-scroll")?.scrollTop || 0;
    const scrolls = new Map([...root.querySelectorAll("[data-custom-options]")].map(element => [element.dataset.customOptions, element.scrollTop]));
    const count = pointMode ? pointResult.points.length : tableRows.reduce((total, row) => total + row.recordCount, 0);
    const missing = pointMode ? pointResult.missingCount : tableRows.reduce((total, row) => total + row.missingCount, 0);
    const finite = tableRows.some(row => row.value !== null);
    const enoughRadarGroups = presentation.type !== "radar" || shownChart.groups.length >= 3;
    const canDraw = pointMode ? count > 0 : enoughRadarGroups && (presentation.type === "mixed" ? tableRows.some(row => row.value !== null || row.barValue !== null) : finite && (!shownChart.circular || tableRows.some(row => row.value > 0)));
    const facetKeys = [...new Set(["municipalityKey", "boroughKey", effectiveSelection.groupFieldKey, effectiveSelection.seriesFieldKey, ...Object.keys(state.filters), "organizationKey", "roadKind"])].filter(key => key && key !== "impactType" && key !== "sourceKind" && (key !== "municipalityKey" || !boroughMode) && (key !== "boroughKey" || boroughMode || montrealSelected));
    facetKeys.push("sourceKind");
    const horizontal = state.style.includes("horizontal");
    const chartHeight = pointMode || shownChart?.circular || presentation.type === "radar" ? 380 : horizontal ? Math.max(300, shownChart.groups.length * Math.max(34, state.style === "horizontal" ? shownChart.series.length * 12 : 34) + 60) : 380;
    const chartWidth = !pointMode && !horizontal && !shownChart.circular && presentation.type !== "radar" ? Math.max(0, shownChart.groups.length * 80) : 0;
    const title = pointMode ? `${text(xyField(state.yField).labelKey)} / ${text(xyField(state.xField).labelKey)}` : `${presentation.type === "mixed" ? `${text(barMetric().labelKey)} + ` : ""}${text(metric().labelKey)} / ${text(dimension(state.groupFieldKey).labelKey)}`;
    const displayedMetrics = new Set(pointMode ? [] : presentation.type === "mixed" ? [state.barMetricKey, state.metricKey] : [state.metricKey]);
    const controlsTag = desktop.matches ? "section" : "details";
    const titleTag = desktop.matches ? "h2" : "summary";
    root.innerHTML = `<header class="stats-header custom-page-header"><div class="custom-page-title"><p class="eyebrow">${esc(text("map.region"))}</p><div class="custom-title-help"><h1>${esc(text("stats.title"))} / ${esc(text("stats.tab.custom"))}</h1>${helpButton("page")}</div></div>
        <div class="custom-chart-toolbar${pointMode ? " is-point-mode" : ""}">
          ${selectControl("style", text("stats.custom.style"), chartTypes.map(value => ({ value, label: text(`stats.custom.chartType.${value}`) })), presentation.type)}
          ${pointMode ? `<div class="custom-point-range"><label class="custom-all"><input type="checkbox" data-custom-extremes data-custom-focus="includeExtremes" aria-describedby="custom-point-range-note"${state.includeExtremes ? " checked" : ""}><span>${esc(text("stats.custom.includeExtremes"))}</span></label></div>` : ""}
          ${presentation.type === "bar" ? selectControl("orientation", text("stats.custom.orientation"), ["horizontal", "vertical"].map(value => ({ value, label: text(`stats.custom.orientation.${value}`) })), presentation.orientation) : ""}
          ${presentation.type === "bar" && arrangements.length > 1 ? selectControl("arrangement", text("stats.custom.arrangement"), arrangements.map(value => ({ value, label: text(`stats.custom.arrangement.${value}`) })), presentation.arrangement) : ""}
          ${pointMode ? "" : selectControl("limit", text("stats.custom.groups"), limits.map(value => ({ value: String(value), label: String(value) })), String(state.limit))}
        </div></header><div class="custom-layout">
      <${controlsTag} id="custom-choices" class="custom-controls" aria-labelledby="custom-choices-title"${!desktop.matches && controlsOpen ? " open" : ""}><${titleTag} id="custom-choices-title">${esc(text("stats.custom.choices"))}</${titleTag}><div class="custom-control-body">
        <button type="button" class="custom-reset" data-custom-reset>${esc(text("stats.custom.reset"))}</button>
        ${axesHtml()}
        ${pointMode ? `${state.style === "bubble" ? selectControl("bubbleField", text("stats.custom.bubbleSize"), customXYFields.map(field => ({ value: field.key, label: text(field.labelKey) })), state.bubbleField) : ""}
          ${selectControl("xyColorField", text("stats.custom.colorBy"), [{ value: "", label: text("stats.custom.allRecords") }, ...DIMENSIONS.map(field => ({ value: field.key, label: text(field.labelKey) }))], state.xyColorField || "")}`
          : DISTRIBUTION_TYPES.includes(presentation.type) || presentation.type === "mixed" ? "" : selectControl("seriesFieldKey", text("stats.custom.split"), [{ value: "", label: text("stats.custom.noSeries") }, ...DIMENSIONS.filter(field => field.key !== state.groupFieldKey).map(field => ({ value: field.key, label: text(field.labelKey) }))], state.seriesFieldKey || "")}
        <div class="custom-facets">${scopeHtml()}${impactHtml()}${timeHtml()}${facetKeys.map(key => facetHtml(key, records)).join("")}</div>
      </div>${desktop.matches ? `<button type="button" class="custom-resize-handle" data-custom-resize role="separator" aria-orientation="vertical" aria-controls="custom-choices" aria-valuemin="${CUSTOM_PANEL_MIN_WIDTH}" aria-valuenow="${clampCustomPanelWidth(preferredPanelWidth, root.clientWidth)}" aria-valuemax="${clampCustomPanelWidth(520, root.clientWidth)}" aria-label="${attr(text("stats.custom.resizeChoices"))}" title="${attr(text("stats.custom.resizeChoices"))}">&#8596;</button>` : ""}</${controlsTag}>
      <section class="custom-result" aria-labelledby="custom-chart-title">
        <h2 id="custom-chart-title">${esc(title)}</h2>
        ${boroughMode ? `<p class="custom-warning" role="note">${esc(text("stats.custom.montrealOnly"))}</p>` : ""}
        <div class="custom-overview"><p class="custom-summary" role="status">${esc(translated(pointMode ? "stats.custom.pointSummary" : presentation.type === "mixed" ? "stats.custom.mixedSummary" : "stats.custom.summary", { count: number(count), missing: number(missing), groups: number(tableRows.length), records: number(pointResult?.recordCount || 0), barMissing: number(tableRows.reduce((total, row) => total + (row.barMissingCount || 0), 0)) }))}${scope.loading ? ` ${esc(text("stats.custom.loading"))}` : ""}</p></div>
        <p class="custom-chart-error" role="alert"${chartFailed ? "" : " hidden"}>${esc(text("stats.custom.chartError"))} <button type="button" data-custom-retry>${esc(text("stats.custom.retry"))}</button></p>
        ${canDraw ? `<div class="custom-canvas-scroll" tabindex="0" role="region" aria-label="${attr(title)}"><div class="custom-canvas-frame" style="height:${chartHeight}px;min-width:${chartWidth}px"><canvas role="img" aria-label="${attr(title)}"></canvas></div></div><ul class="custom-legend" aria-label="${attr(text("stats.custom.legend"))}"></ul>` : `<div class="custom-empty" role="status">${esc(text(!enoughRadarGroups ? "stats.custom.radarMinimum" : (pointMode ? pointResult.recordCount : count) ? "stats.custom.noValues" : "stats.empty"))}</div>`}
        ${presentation.type === "mixed" ? `<p class="custom-note">${esc(translated("stats.custom.mixedNote", { bars: text(barMetric().labelKey), line: text(metric().labelKey) }))}</p>` : ""}
        ${presentation.type === "line" ? `<p class="custom-note">${esc(text("stats.custom.lineNote"))}</p>` : ""}
        ${pointMode ? `<p class="custom-note">${esc(text("stats.custom.xyNote"))}</p>${state.style === "bubble" ? `<p class="custom-note">${esc(text("stats.custom.bubbleNote"))}</p>` : ""}` : `<p class="custom-coverage">${esc(translated("stats.custom.coverage", { shown: number(Math.min(shownChart.totalGroups, state.limit)), total: number(shownChart.totalGroups) }))}${shownChart.circular && shownChart.totalGroups > state.limit ? ` ${esc(text("stats.custom.otherIncluded"))}` : ""}</p>`}
        ${prepared.collapsedSeries ? `<p class="custom-note">${esc(text("stats.custom.seriesCollapsed"))}</p>` : ""}
        ${state.style.startsWith("percent-") ? `<p class="custom-note">${esc(text("stats.custom.groupDenominator"))}</p>` : displayedMetrics.has("share") ? `<p class="custom-note">${esc(text("stats.custom.selectionDenominator"))}</p>` : ""}
        ${[...displayedMetrics].filter(key => ["length", "duration", "age"].includes(key)).map(key => `<p class="custom-note">${esc(text(`stats.custom.note.${key}`))}</p>`).join("")}
        ${pointMode ? `<p id="custom-point-range-note" class="custom-note">${esc(translated(pointRange.outsideCount ? "stats.custom.xyRangeFocused" : state.includeExtremes ? "stats.custom.xyRangeFull" : "stats.custom.xyRangeUnchanged", { shown: number(pointRange.shownCount), outside: number(pointRange.outsideCount), ...Object.fromEntries(["x", "y"].map(axis => { const maximum = pointRange[`${axis}Maximum`]; const field = state[`${axis}Field`]; return [`${axis}Maximum`, maximum === null ? text("stats.custom.fullAxis") : `${displayNumber(xyValue(maximum, field), xyField(field).unit)} ${unitLabel(xyField(field).unit)}`]; })) }))}</p>` : ""}
        <details class="custom-values"${valuesOpen || chartFailed ? " open" : ""}><summary>${esc(text("stats.custom.values"))} <span>${number(tableRows.length)}</span></summary><div class="custom-table-host"></div></details>
      </section></div>`;
    renderTable();
    root.querySelector(".custom-table-scroll").scrollTop = tableScrollTop;
    applyPanelWidth();
    fitViewport();
    root.querySelectorAll("[data-custom-all]").forEach(input => { input.indeterminate = input.dataset.customMixed === "true"; });
    if (activeHelp) root.querySelector(`[data-custom-help="${activeHelp}"]`)?.setAttribute("aria-expanded", "true");
    root.querySelector(".custom-control-body").scrollTop = panelScrollTop;
    scrolls.forEach((top, key) => { const list = root.querySelector(`[data-custom-options="${key}"]`); if (list) list.scrollTop = top; });
    if (focused) {
      const control = [...root.querySelectorAll("[data-custom-focus]")].find(element => element.dataset.customFocus === focused);
      control?.focus({ preventScroll: true });
      if (caret) control?.setSelectionRange?.(...caret);
    }
    if (outer) outer.scrollTop = outerScrollTop;
    draw();
  }

  function changed() {
    lastSignature = "";
    render();
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }

  root.addEventListener("change", event => {
    const target = event.target;
    if (target.hasAttribute("data-custom-extremes")) {
      state.includeExtremes = target.checked;
      changed();
    } else if (target.dataset.customAll) {
      if (target.checked) delete state.filters[target.dataset.customAll];
      else state.filters[target.dataset.customAll] = [];
      changed();
    } else if (target.dataset.customSelect) {
      const key = target.dataset.customSelect;
      if (key === "dateMode") { context.setScope({ allDates: target.value === "all" }); return; }
      if (["style", "orientation", "arrangement"].includes(key)) {
        const parts = customStyleParts(state.style);
        parts[key === "style" ? "type" : key] = target.value;
        if (key === "style" && [...DISTRIBUTION_TYPES, "mixed"].includes(target.value)) state.seriesFieldKey = null;
        state.style = composeCustomStyle(parts, state.metricKey, state.seriesFieldKey);
        changed();
        return;
      }
      state[key] = key === "limit" ? Number(target.value) : target.value || null;
      if (key === "xField" && state.xField === state.yField) state.yField = customXYFields.find(field => field.key !== state.xField).key;
      if (key === "xyColorField" && state.xyColorField) facetOpen.add(state.xyColorField);
      if (key === "groupFieldKey") { facetOpen.add(state.groupFieldKey); if (state.groupFieldKey === state.seriesFieldKey) state.seriesFieldKey = null; }
      if (key === "seriesFieldKey" && state.seriesFieldKey) facetOpen.add(state.seriesFieldKey);
      changed();
    } else if (target.dataset.customDate) {
      if (target.validity.valid) context.setScope({ [target.dataset.customDate]: target.value });
    } else if (target.dataset.customImpact) {
      context.setScope({ impacts: [...root.querySelectorAll("[data-custom-impact]:checked")].map(input => input.dataset.customImpact) });
    } else if (target.dataset.customTime) {
      context.setScope({ periods: [...root.querySelectorAll("[data-custom-time]:checked")].map(input => input.dataset.customTime) });
    } else if (target.dataset.customCheck) {
      const key = target.dataset.customCheck;
      const values = new Set(state.filters[key] || optionsFor(key, activeRecords()).map(option => option.value));
      const value = JSON.parse(target.value);
      if (target.checked) values.add(value); else values.delete(value);
      state.filters[key] = [...values];
      changed();
    }
  }, { signal: listeners.signal });

  root.addEventListener("input", event => {
    const key = event.target.dataset.customSearch;
    if (!key) return;
    const panel = root.querySelector(".custom-control-body");
    const outer = root.closest(".stats-view");
    const panelTop = panel.scrollTop;
    const outerTop = outer?.scrollTop || 0;
    const facet = event.target.closest(".custom-facet");
    const list = facet.querySelector(".custom-options");
    const before = context.normalizeSearchText(searches.get(key) || "");
    const next = context.normalizeSearchText(event.target.value);
    if (!before && next) {
      const all = root.querySelector(`[data-custom-all="${key}"]`);
      searchSelectionEligible.set(key, all.checked && !all.indeterminate);
      searchHeights.set(key, Math.max(36, list.getBoundingClientRect().height));
    }
    if (!next) { searchSelectionEligible.delete(key); searchHeights.delete(key); }
    list.style.height = searchHeights.has(key) ? `${searchHeights.get(key)}px` : "";
    searches.set(key, event.target.value);
    const words = next.split(" ").filter(Boolean);
    facet.querySelectorAll("[data-custom-option]").forEach(option => { option.hidden = !words.every(word => option.dataset.search.includes(word)); });
    const empty = facet.querySelector("[data-custom-no-results]");
    empty.hidden = Boolean(facet.querySelector("[data-custom-option]:not([hidden])"));
    empty.textContent = text(next ? "stats.custom.noMatches" : "stats.custom.noOptions");
    const button = facet.querySelector("[data-custom-search-only]");
    button.hidden = !next || !searchSelectionEligible.get(key);
    button.disabled = !facet.querySelector("[data-custom-option]:not([hidden]) input:checked");
    panel.scrollTop = panelTop;
    if (outer) outer.scrollTop = outerTop;
  }, { signal: listeners.signal });

  root.addEventListener("click", event => {
    const button = event.target.closest("button");
    if (!button) return;
    if (button.dataset.customHelp) { openHelp(button.dataset.customHelp); return; }
    if (button.dataset.customSearchOnly && searchSelectionEligible.get(button.dataset.customSearchOnly)) {
      const key = button.dataset.customSearchOnly;
      state.filters[key] = [...button.closest(".custom-facet").querySelectorAll("[data-custom-option]:not([hidden]) input:checked")].map(input => JSON.parse(input.value));
      searchSelectionEligible.delete(key);
      changed();
      root.querySelector(`[data-custom-search="${key}"]`)?.focus({ preventScroll: true });
    } else if (button.hasAttribute("data-custom-reset")) {
      state = { ...DEFAULT_SELECTION, filters: {} }; searches.clear(); searchSelectionEligible.clear(); searchHeights.clear();
      facetOpen.delete("municipalityKey");
      lastSignature = "";
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
      context.setScope({ reset: true });
    } else if (button.hasAttribute("data-custom-retry")) draw();
    else if (button.dataset.customSort) {
      tableSort = { key: button.dataset.customSort, direction: tableSort.key === button.dataset.customSort ? tableSort.direction === 1 ? -1 : tableSort.direction === -1 ? 0 : 1 : 1 };
      renderTable();
      root.querySelector(`[data-custom-sort="${tableSort.key}"]`)?.focus({ preventScroll: true });
    }
  }, { signal: listeners.signal });

  root.addEventListener("toggle", event => {
    if (event.target.classList.contains("custom-controls")) controlsOpen = event.target.open;
    if (event.target.classList.contains("custom-period")) periodOpen = event.target.open;
    if (event.target.classList.contains("custom-impacts")) impactOpen = event.target.open;
    if (event.target.classList.contains("custom-time")) timeOpen = event.target.open;
    if (event.target.classList.contains("custom-values")) {
      valuesOpen = event.target.open;
      const wrap = root.querySelector(".custom-table-scroll");
      if (wrap) context.limitTable(wrap);
    }
    const key = event.target.dataset.customFacet;
    if (key) { if (event.target.open) facetOpen.add(key); else facetOpen.delete(key); }
  }, { capture: true, signal: listeners.signal });

  root.addEventListener("pointerdown", event => {
    const handle = event.target.closest("[data-custom-resize]");
    if (!handle || !desktop.matches || root.clientWidth < 760 || event.button !== 0) return;
    event.preventDefault();
    handle.focus({ preventScroll: true });
    resizing = { pointerId: event.pointerId, startX: event.clientX, startWidth: applyPanelWidth() };
    handle.setPointerCapture(event.pointerId);
    root.classList.add("is-resizing-custom");
  }, { signal: listeners.signal });
  root.addEventListener("pointermove", event => {
    if (!resizing || event.pointerId !== resizing.pointerId) return;
    preferredPanelWidth = clampCustomPanelWidth(resizing.startWidth + event.clientX - resizing.startX, root.clientWidth);
    applyPanelWidth();
  }, { signal: listeners.signal });
  const finishResize = event => {
    if (!resizing || (event.pointerId !== undefined && event.pointerId !== resizing.pointerId)) return;
    resizing = null;
    root.classList.remove("is-resizing-custom");
    savePanelWidth();
    if (renderAfterResize) { renderAfterResize = false; render(); }
  };
  root.addEventListener("pointerup", finishResize, { signal: listeners.signal });
  root.addEventListener("pointercancel", finishResize, { signal: listeners.signal });
  root.addEventListener("lostpointercapture", finishResize, { signal: listeners.signal });
  root.addEventListener("keydown", event => {
    if (!event.target.matches("[data-custom-resize]") || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const current = applyPanelWidth();
    const requested = event.key === "Home" ? CUSTOM_PANEL_MIN_WIDTH : event.key === "End" ? 520 : current + (event.key === "ArrowLeft" ? -20 : 20);
    preferredPanelWidth = clampCustomPanelWidth(requested, root.clientWidth);
    applyPanelWidth();
    savePanelWidth();
  }, { signal: listeners.signal });

  desktop.addEventListener("change", () => { controlsOpen = desktop.matches; lastSignature = ""; render(); }, { signal: listeners.signal });
  const observer = new ResizeObserver(() => {
    applyPanelWidth(); fitViewport(); chart?.resize();
    const wrap = root.querySelector(".custom-table-scroll");
    if (wrap) context.limitTable(wrap);
  });
  observer.observe(root);
  if (root.closest(".stats-view")) observer.observe(root.closest(".stats-view"));

  return {
    root,
    update(records, nextScope) { allRecords = records; scope = nextScope; render(); },
    destroy() { drawVersion++; resizing = null; root.classList.remove("is-resizing-custom"); helpAnimation?.cancel(); helpDialog?.close(); helpDialog?.remove(); chart?.destroy(); chart = null; observer.disconnect(); listeners.abort(); },
    getRows() { return tableRows.map(row => ({ ...row })); }
  };
}
