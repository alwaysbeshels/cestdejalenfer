// Statistics view: computed in the browser from allClosures (js/app.js), no extra snapshot.
(() => {
  const container = document.querySelector("#statsView");
  if (!container || PEDESTRIAN_MODE) return;

  // French typography: keep « » and the space before : ; ! ? on the same line as their word.
  const translate = window.t;
  function t(key, language) {
    const text = String(translate(key, language));
    if ((language || currentLanguage()) !== "fr") return text;
    return text.replace(/« /g, "«\u00a0").replace(/ (»|:|;|!|\?)/g, "\u00a0$1");
  }

  const IMPACT_ORDER = ["critical", "major", "moderate", "parking"];
  const DAY_MS = 86400000;
  const CHART_TOP_LIMIT = 15;
  const MAX_VISIBLE_ROWS = 10;
  const ELONGATION_RATIO = 3;
  // Same Chart.js build and SRI hash as js/potholes-charts.mjs.
  const CHART_URL = "https://cdn.jsdelivr.net/npm/chart.js@4.5.1/dist/chart.umd.min.js";
  const CHART_INTEGRITY = "sha384-jb8JQMbMoBUzgWatfe6COACi2ljcDdZQ2OxczGA3bGNeWe+6DChMTBJemed7ZnvJ";
  const CHART_OTHER_COLOR = "#397b6d";
  const CHART_GRID_COLOR = "#e4e9e5";
  const CHART_VALUE_COLOR = "#243a31";
  // Pothole statistics palette, used where colours do not encode a traffic impact.
  const MANDATE_COLORS = { private: "#963e51", cityContractor: "#397b6d", utility: "#7198ac" };
  const AUTHORITY_GROUPS = {
    public: ["city", "publicOrg"],
    companies: ["cityContractor", "private", "utility"],
    other: ["citizen", "event", "citizenReport", "unknown"]
  };
  const AUTHORITY_GROUP_COLORS = { public: "#2c5f54", companies: "#6f2c3b", other: "#7d6a49" };
  const SECTORS = ["public", "private", "undetermined"];
  const SECTOR_COLORS = { public: "#2c5f54", private: "#963e51", undetermined: "#b9b3a6" };
  const ROAD_KIND_COLORS = { autoroute: "#1f5fa8", route: "#b07d2b", bridge: "#6b5aa6", street: "#b9b3a6" };
  const PUBLIC_OWNER = /hydro|\bHQ\b|\bcsem\b|commission des services [ée]lectriques/i;
  const PRIVATE_OWNER = /\bbell\b|[ée]nergir|vid[ée]otron|\bgaz\b|\btelus\b|\brogers\b/i;
  // Distinct hues (not shades of one colour) so neighbouring slices are easy to tell apart.
  const AUTHORITY_COLORS = {
    city: "#2b6c8f", publicOrg: "#3f9b5a",
    cityContractor: "#963e51", private: "#e07b39", utility: "#7a5ba6",
    citizen: "#a76b18", event: "#d4a72c", citizenReport: "#8d6e63", unknown: "#b9b3a6"
  };
  const DETAIL_PALETTE = ["#1f77b4", "#2ca02c", "#9467bd", "#e377c2", "#17becf", "#bcbd22", "#8c564b", "#ff7f0e", "#d62728", "#393b79", "#637939", "#843c39", "#7b4173", "#3182bd", "#e6550d", "#31a354", "#756bb1", "#636363"];
  const DETAIL_OTHERS_COLOR = "#d9d4c9";
  const DETAIL_NOUNS = { utility: "networks", cityContractor: "companies", private: "companies", city: "municipalities", publicOrg: "bodies" };
  const TABS = ["general", "roads", "private", "territory", "places", "how"];
  // "How it works" questions, grouped; general map questions stay in the FAQ and are not repeated here.
  const HOW_GROUPS = [
    ["data", ["source", "history", "changes", "modes", "duplicates"]],
    ["method", ["count", "km", "duration", "age", "responsible", "roads", "places"]],
    ["read", ["totals", "filters", "coverage"]]
  ];
  const TWO_COLUMN_MIN_WIDTH = 760;

  const MONTREAL_KINDS = new Set(["montreal-wfs", "uci-wfs", "seasonal-pedestrian-street", "montreal-pedestrian-opendata"]);
  // Sources whose street field is the bare street name, without a type word.
  const BARE_STREET_KINDS = new Set(["montreal-wfs", "mont-royal-snapshot"]);
  const REGIONAL_KINDS = new Set(["mobilite-montreal", "noovo-road-snapshot", "pjcci"]);
  const MTMD_KINDS = new Set(["quebec511-mtmd-wfs", "quebec511-event"]);
  const CURATED_KINDS = new Set(["mobilite-montreal", "seasonal-pedestrian-street", "linked-city-work"]);
  const STREET_EXCLUDED_KINDS = new Set(["uci-wfs", "pjcci"]);
  const EVENT_SNAPSHOT_KINDS = new Set(["uci-wfs", "noovo-road-snapshot"]);
  const AGE_BUCKETS = [[0, 30, "lessMonth"], [31, 182, "months1to6"], [183, 365, "months6to12"], [366, Infinity, "overYear"]];
  const AGE_COLORS = ["#a8d5c2", "#5fae8f", "#2f7d62", "#174a3a"];
  const SNAPSHOT_URLS = {
    "uci-wfs": "data/montreal-uci-closures-snapshot.json",
    "mont-royal-snapshot": "data/mont-royal-snapshot.json",
    "beaconsfield-snapshot": "data/beaconsfield-snapshot.json",
    "noovo-road-snapshot": "data/noovo-road-closures-snapshot.json",
    "citizen-report": "data/citizen-reports-snapshot.json",
    "pjcci": "data/pjcci-work-advisories-snapshot.json",
    "montreal-pedestrian-opendata": "data/montreal-pedestrian-snapshot.json"
  };
  // Official designations of named Quebec autoroutes; only matched after the word "autoroute".
  const NAMED_AUTOROUTES = [
    [/autoroute\s+d[ée]carie/i, 15],
    [/autoroute\s+des\s+laurentides/i, 15],
    [/autoroute\s+m[ée]tropolitaine/i, 40],
    [/autoroute\s+f[ée]lix-leclerc/i, 40],
    [/autoroute\s+transcanadienne/i, 40],
    [/autoroute\s+chomedey/i, 13],
    [/autoroute\s+jean-lesage/i, 20],
    [/autoroute\s+papineau/i, 19]
  ];
  const MONTREAL_AUTHORITY = {
    cityOfMontreal: "city",
    contractorCity: "cityContractor",
    company: "private",
    contractorRTU: "utility",
    csem: "utility",
    contractorPublicOrganization: "publicOrg",
    citizen: "citizen"
  };
  const COMPANY_TYPES = new Set(["private", "cityContractor", "utility"]);
  const UTILITY_PATTERN = /hydro|\bbell\b|[ée]nergir|vid[ée]otron|gaz m[ée]tro|\btelus\b|\brogers\b/i;
  const DURATION_BUCKETS = [[1, 1], [2, 7], [8, 30], [31, 90], [91, 365], [366, Infinity]];
  // A street type followed by a capitalized name, found anywhere in a published sentence (case-sensitive name).
  const STREET_PHRASE = /\b([Rr]ue|[Aa]venue|[Bb]oulevard|[Bb]oul\.|[Cc]hemin|[Mm]ont[ée]e|[Rr]ang|[Pp]lace|[Cc]roissant|[Cc][ôo]te|[Pp]romenade|[Tt]errasse|[Aa]ll[ée]e)\s+((?:de la |de l'|de l’|du |des |de |d'|d’)?[A-ZÀ-Ý0-9][\wÀ-ÿ'’.-]*(?:[ -][A-ZÀ-Ý0-9][\wÀ-ÿ'’.-]*)*)/;
  const ENGLISH_STREET_PHRASE = /\b([A-Z][\w'’-]*(?:\s[A-Z][\w'’-]*)*)\s+(Avenue|Street|Road|Drive|Boulevard)\b/;

  const statsLink = document.querySelector('.map-mode-nav a[data-view="stats"]');
  const autoLink = document.querySelector('.map-mode-nav a[data-language-page="map"]:not([data-view])');
  let renderQueued = false;
  let lastHtml = "";
  let chartSpecs = [];
  let charts = [];
  let chartLibrary = null;
  let chartLibraryFailed = false;
  const animatedChartKeys = new Set();
  const requestedTab = new URLSearchParams(window.location.search).get("tab");
  let activeTab = TABS.includes(requestedTab) ? requestedTab : "general";
  let resetScroll = false;

  function tf(key, values = {}) {
    return String(t(key)).replace(/\{(\w+)\}/g, (match, name) => (name in values ? values[name] : match));
  }

  function numberFormat(value, digits = 0) {
    return new Intl.NumberFormat(currentLanguage() === "en" ? "en-CA" : "fr-CA", {
      maximumFractionDigits: digits,
      minimumFractionDigits: digits
    }).format(value);
  }

  function percent(part, total) {
    return total ? `${numberFormat((part / total) * 100, part / total < 0.1 && part > 0 ? 1 : 0)} %` : "0 %";
  }

  function addDays(dateKey, days) {
    const date = parseDate(dateKey);
    date.setDate(date.getDate() + days);
    return formatInputDate(date);
  }

  function countBy(items, keyOf) {
    const groups = new Map();
    items.forEach((item) => {
      const key = keyOf(item);
      if (key === null || key === undefined || key === "") return;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(item);
    });
    return groups;
  }

  function severityCounts(items) {
    return items.reduce((counts, item) => {
      counts[item.severity] = (counts[item.severity] || 0) + 1;
      return counts;
    }, {});
  }

  function mostFrequent(values) {
    const counts = new Map();
    values.forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
  }

  // --- Classification -------------------------------------------------------

  function authorityType(closure) {
    const kind = closure.sourceKind || "";
    const responsible = String(closure.responsible || "");
    if (kind === "montreal-wfs") return MONTREAL_AUTHORITY[closure.siteAuthority] || "unknown";
    if (kind.startsWith("longueuil")) {
      const code = Number(closure.responsibleCode);
      if (code === 1) return "city";
      if (code === 2) return "publicOrg";
      if (code >= 3 && code <= 6) return "utility";
      if (code === 7) return "private";
      if (code === 8) {
        if (/^autre$/i.test(responsible.trim())) return "unknown";
        if (/scolaire|minist|gouvernement|soci[ée]t[ée] de transport/i.test(responsible)) return "publicOrg";
        return UTILITY_PATTERN.test(responsible) ? "utility" : "private";
      }
      return "unknown";
    }
    if (kind === "laval-mapserver") {
      if (/^ville\b/i.test(responsible)) return "city";
      if (/utilit/i.test(responsible)) return "utility";
      if (/\bMTQ\b|MTMD|minist/i.test(responsible)) return "publicOrg";
      if (/priv/i.test(responsible)) return "private";
      return "unknown";
    }
    if (kind === "uci-wfs") return "event";
    if (kind === "citizen-report") return "citizenReport";
    if (kind === "noovo-road-snapshot") return "unknown";
    if (MTMD_KINDS.has(kind) || kind === "pjcci") return "publicOrg";
    if (UTILITY_PATTERN.test(responsible)) return "utility";
    if (/\bCN\b|\bCP\b|canadien national/i.test(responsible)) return "private";
    if (/MTMD|\b511\b|minist|PJCCI|\bSTM\b|\bARTM\b/i.test(responsible)) return "publicOrg";
    return "city";
  }

  function organizationName(closure, type) {
    if (!COMPANY_TYPES.has(type)) return null;
    const kind = closure.sourceKind || "";
    const responsible = String(closure.responsible || "").trim();
    if (kind === "montreal-wfs") return String(closure.organization || "").trim() || null;
    if (kind.startsWith("longueuil")) {
      const code = Number(closure.responsibleCode);
      if (code >= 3 && code <= 6) return responsible;
      if (code === 8 && !/maison de production|compagnie priv|^autre$/i.test(responsible)) return responsible;
      return null;
    }
    if (responsible.includes(" / ")) return responsible.split(" / ")[0].trim();
    return UTILITY_PATTERN.test(responsible) ? responsible : null;
  }

  // Who does the work: the city's own crews or a public body, or a company (contractor included).
  function sectorBy(item) {
    if (["city", "publicOrg"].includes(item.type)) return "public";
    if (["cityContractor", "private", "citizen"].includes(item.type)) return "private";
    if (item.type !== "utility") return "undetermined";
    // Montreal utility permits (RTU, CSEM) are filed by the contractor doing the work.
    if (item.closure.sourceKind === "montreal-wfs") return "private";
    return PUBLIC_OWNER.test(item.closure.responsible || "") ? "public" : "private";
  }

  // Whom the work is for: a contractor mandated by the city works for the public sector.
  function sectorFor(item) {
    if (["city", "publicOrg", "cityContractor"].includes(item.type)) return "public";
    if (["private", "citizen"].includes(item.type)) return "private";
    if (item.type !== "utility") return "undetermined";
    if (item.closure.siteAuthority === "csem") return "public";
    const owner = `${item.organization || ""} ${item.closure.responsible || ""}`;
    const isPublic = PUBLIC_OWNER.test(owner);
    const isPrivate = PRIVATE_OWNER.test(owner);
    if (isPublic === isPrivate) return "undetermined";
    return isPublic ? "public" : "private";
  }

  function organizationKey(name) {
    return normalizeSearchText(name)
      .replace(/\b(inc|ltd|ltee|limitee|corp|corporation|senc)\b/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function routeNumberFromText(text) {
    if (/desserte|voie de service/i.test(text)) return null;
    const match = text.match(/\bA-(\d{1,3})\b/)
      || text.match(/\b[Aa]utoroute\s+(\d{1,3})\b/)
      || text.match(/\bR-(\d{3})\b/)
      || text.match(/\b[Rr]oute\s+(\d{3})\b/);
    if (match) return Number(match[1]);
    return NAMED_AUTOROUTES.find(([pattern]) => pattern.test(text))?.[1] ?? null;
  }

  // Only the road itself counts: "Chemin X, entre A-20 et Y" is not work on the A-20.
  function leadingSegment(text) {
    return String(text || "").split(/,|\bentre\b|\bbetween\b/i)[0];
  }

  function routeLabel(closure) {
    const raw = String(closure.routeNumber ?? "").trim();
    let number = /^\d{1,3}$/.test(raw) ? Number(raw) : null;
    if (number === null && closure.sourceKind === "montreal-wfs") {
      // The Montreal feed publishes highways as a bare geobase number, e.g. "40, entre 40 et 40".
      const street = leadingSegment(closure.streets).trim();
      if (/^\d{1,3}$/.test(street)) number = Number(street);
    }
    if (number === null) {
      number = routeNumberFromText(leadingSegment(closure.streets)) ?? routeNumberFromText(leadingSegment(closure.title));
    }
    if (!number) return null;
    // Quebec numbering: 1-99 and 400+ are autoroutes, 100-399 are numbered routes.
    return number < 100 || number >= 400 ? `A-${number}` : `R-${number}`;
  }

  // roadType from js/app.js also matches "Rue Bridge" or "rue du Pont"; require a named bridge/tunnel here.
  function isUpperNetwork(closure, route) {
    if (route?.startsWith("A-") || closure.roadType === "tunnel") return true;
    const kind = closure.sourceKind || "";
    if ((MTMD_KINDS.has(kind) || kind === "pjcci") && ["highway", "bridge"].includes(closure.roadType)) return true;
    return /(?<!sous le )\b(?:[Pp]ont|PONT|[Tt]unnel)\s+(?!(?:du|de|des|d')\b)[A-ZÀ-Ý]/.test(`${closure.title || ""} ${closure.streets || ""}`);
  }

  function municipalityLabel(closure) {
    const kind = closure.sourceKind || "";
    if (MONTREAL_KINDS.has(kind)) return "Montréal";
    if (kind === "citizen-report") return closure.municipality || closure.city || null;
    if (REGIONAL_KINDS.has(kind)) return t("stats.intermunicipal");
    if (MTMD_KINDS.has(kind)) {
      if (/^\s*entre\s/i.test(String(closure.streets || ""))) return t("stats.intermunicipal");
      const borough = String(closure.borough || "").split(/[\r\n]/)[0].trim();
      if (!borough || /^qu[ée]bec$/i.test(borough) || /^\d+$/.test(borough)) return null;
      return borough;
    }
    return closure.borough || null;
  }

  function boroughLabel(code) {
    const key = `abbreviation.${code}`;
    const label = t(key);
    return label === key ? code : label;
  }

  function streetName(closure) {
    if (STREET_EXCLUDED_KINDS.has(closure.sourceKind)) return null;
    const raw = String(closure.streets || "").trim().replace(/^À\s+[^,\n]+[,\n]\s*/i, "");
    if (BARE_STREET_KINDS.has(closure.sourceKind)) {
      const text = raw.split(/\s*(?:,|;|\(|\/|\s-\s|\bentre\b)/i)[0].trim();
      if (!text || text.length > 45 || /non publi|non-nomm|sans objet|non pr[ée]cis|^\d/i.test(text)) return null;
      return text;
    }
    for (const text of [raw, String(closure.title || "")]) {
      if (/non publi|g[ée]om[ée]trie/i.test(text)) continue;
      const french = text.match(STREET_PHRASE);
      if (french) {
        const type = french[1].charAt(0).toUpperCase() + french[1].slice(1).toLowerCase();
        return `${type} ${french[2].trim()}`.slice(0, 45);
      }
      const english = text.match(ENGLISH_STREET_PHRASE);
      if (english) return `${english[1]} ${english[2]}`.slice(0, 45);
    }
    return null;
  }

  function streetKey(name) {
    return normalizeSearchText(name)
      .replace(/^(rue|avenue|av|boulevard|boul|bd|blvd|chemin|ch|place|montee|cote|rang|croissant|terrasse|promenade|allee|impasse|carre|square|street|road)\s+/, "")
      .replace(/\s+(avenue|street|road|drive|boulevard)$/, "")
      .replace(/^(de la|de l|du|des|de|d)\s+/, "")
      .trim();
  }

  // --- Lengths ----------------------------------------------------------------

  function haversine([lon1, lat1], [lon2, lat2]) {
    const rad = Math.PI / 180;
    const dLat = (lat2 - lat1) * rad;
    const dLon = (lon2 - lon1) * rad;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
    return 6371008.8 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function lineLength(coordinates) {
    let total = 0;
    for (let index = 1; index < coordinates.length; index += 1) {
      total += haversine(coordinates[index - 1], coordinates[index]);
    }
    return total;
  }

  function convexHull(points) {
    const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lower = [];
    sorted.forEach((point) => {
      while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0) lower.pop();
      lower.push(point);
    });
    const upper = [];
    [...sorted].reverse().forEach((point) => {
      while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 0) upper.pop();
      upper.push(point);
    });
    return [...lower.slice(0, -1), ...upper.slice(0, -1)];
  }

  // Minimum-area oriented bounding rectangle (rotating calipers over the convex hull), in meters.
  function orientedRectangle(ring) {
    const valid = ring.filter((point) => Number.isFinite(point?.[0]) && Number.isFinite(point?.[1]));
    if (valid.length < 2) return null;
    const latitude = valid.reduce((sum, point) => sum + point[1], 0) / valid.length;
    const kx = 111320 * Math.cos(latitude * Math.PI / 180);
    const hull = convexHull(valid.map(([x, y]) => [x * kx, y * 110540]));
    if (hull.length < 2) return null;
    let best = null;
    hull.forEach((point, index) => {
      const next = hull[(index + 1) % hull.length];
      const length = Math.hypot(next[0] - point[0], next[1] - point[1]);
      if (!length) return;
      const ux = (next[0] - point[0]) / length;
      const uy = (next[1] - point[1]) / length;
      let minU = Infinity; let maxU = -Infinity; let minV = Infinity; let maxV = -Infinity;
      hull.forEach(([x, y]) => {
        const u = x * ux + y * uy;
        const v = -x * uy + y * ux;
        minU = Math.min(minU, u); maxU = Math.max(maxU, u);
        minV = Math.min(minV, v); maxV = Math.max(maxV, v);
      });
      const width = maxU - minU;
      const height = maxV - minV;
      if (!best || width * height < best.area) {
        best = { area: width * height, long: Math.max(width, height), short: Math.min(width, height) };
      }
    });
    return best;
  }

  function polygonEstimate(rings) {
    const rectangle = orientedRectangle(rings?.[0] || []);
    if (!rectangle || !rectangle.long) return null;
    return rectangle.short === 0 || rectangle.long / rectangle.short >= ELONGATION_RATIO ? rectangle.long : null;
  }

  // Geometries never change once loaded: measure each one only once.
  const lengthCache = new WeakMap();

  function lengthInfo(geometry) {
    if (geometry && typeof geometry === "object") {
      if (!lengthCache.has(geometry)) lengthCache.set(geometry, measureGeometry(geometry));
      return lengthCache.get(geometry);
    }
    return { kind: "none", meters: 0 };
  }

  function measureGeometry(geometry) {
    const type = geometry?.type;
    const coordinates = geometry?.coordinates;
    if (type === "LineString") return { kind: "line", meters: lineLength(coordinates || []) };
    if (type === "MultiLineString") return { kind: "line", meters: (coordinates || []).reduce((sum, line) => sum + lineLength(line), 0) };
    if (type === "Polygon" || type === "MultiPolygon") {
      const polygons = type === "Polygon" ? [coordinates] : (coordinates || []);
      const estimates = polygons.map(polygonEstimate).filter((value) => value !== null);
      return estimates.length
        ? { kind: "estimated", meters: estimates.reduce((sum, value) => sum + value, 0) }
        : { kind: "compact", meters: 0 };
    }
    return { kind: "none", meters: 0 };
  }

  function plannedDays(closure) {
    if (closure.sourceKind === "quebec511-event" || closure.sourceKind === "citizen-report") return null;
    if (!closure.startDate || !closure.endDate || closure.endDate >= "2099") return null;
    const start = parseDate(closure.startDate).valueOf();
    const end = parseDate(closure.endDate).valueOf();
    if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
    const days = Math.round((end - start) / DAY_MS) + 1;
    return days >= 1 ? days : null;
  }

  function median(values) {
    if (!values.length) return null;
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
  }

  // --- Computation --------------------------------------------------------------

  function computeStats() {
    const impacts = getActiveImpacts();
    const periods = getActiveTimePeriods();
    const range = getDateRange();
    const today = formatInputDate(new Date());
    const inSevenDays = addDays(today, 7);

    const candidates = allClosures.filter((closure) => impacts.has(closure.severity)
      && matchesTimePeriod(closure, periods)
      && !isCoveredByComplementaryClosure(closure));
    const items = candidates.filter((closure) => statsAllDates || overlapsDateRange(closure, range)).map((closure) => {
      const type = authorityType(closure);
      const route = routeLabel(closure);
      return { closure, type, route, organization: organizationName(closure, type), length: lengthInfo(closure.geometry) };
    });
    const undated = candidates.filter((closure) => closure.sourceKind !== "citizen-report" && !hasExpiredToday(closure));

    return {
      items,
      range,
      today,
      starting: undated.filter((closure) => closure.startDate > today && closure.startDate <= inSevenDays),
      ending: undated.filter((closure) => closure.startDate <= today && closure.endDate >= today && closure.endDate <= inSevenDays && closure.endDate < "2099")
    };
  }

  // --- Rendering helpers ----------------------------------------------------------

  // Lucide 0.468.0 paths, the icon set used by the pothole statistics tables.
  const SORT_ICONS = {
    none: '<path d="m21 16-4 4-4-4"/><path d="M17 20V4"/><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/>',
    asc: '<path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>',
    desc: '<path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>'
  };
  const SEARCH_ICON = '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>';
  const CHEVRON_ICON = '<path d="m6 9 6 6 6-6"/>';
  const MAP_PIN_ICON = '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>';
  let multiSelectCount = 0;
  const HTML_ENTITIES = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": "\"", "&#39;": "'" };
  const tableSorts = new Map();
  const cardFilters = new Map();

  function svgIcon(paths, className = "") {
    return `<svg class="${className}" aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
  }

  // escapeHtml() also applies French spelling fixes, which must not alter machine values.
  function escapeAttr(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[character]));
  }

  function plainText(html) {
    return String(html).replace(/<[^>]*>/g, " ").replace(/&(?:amp|lt|gt|quot|#39);/g, (entity) => HTML_ENTITIES[entity]);
  }

  function severityLabel(severity) {
    return (SEVERITY_META[severity] ?? SEVERITY_META.major).label();
  }

  function num(value, display = numberFormat(value)) {
    return { html: display, sort: value };
  }

  function infoButton(infoKey, title) {
    const label = escapeAttr(tf("stats.infoLabel", { title }));
    return `<button type="button" class="icon-help small stats-info" data-info="${infoKey}" aria-haspopup="dialog" aria-expanded="false" aria-label="${label}">i</button>`;
  }

  // Only http(s) links from the feeds become clickable, as in the map popups.
  function sourceLink(closure) {
    const label = escapeHtml(closure.source || "");
    if (!/^https?:\/\//i.test(String(closure.sourceUrl || ""))) return { html: label, sort: closure.source || "" };
    return { html: `<a href="${escapeAttr(closure.sourceUrl)}" target="_blank" rel="noreferrer">${label}</a>`, sort: closure.source || "" };
  }

  // pair: "left" (70 %) and "right" (30 %) cards share one row; row: "3" cards share a row of three.
  // stackBelow: below this grid width the card takes the full width instead of half (its table needs room).
  function card(key, titleKey, body, { noteKey = null, infoKey = null, wide = false, filters = null, pair = null, row = null, stackBelow = null } = {}) {
    return `<section class="stats-card${wide ? " is-wide" : ""}" data-card="${key}"${pair ? ` data-pair="${pair}"` : ""}${row ? ` data-row="${row}"` : ""}${stackBelow ? ` data-stack-below="${stackBelow}"` : ""}>
      <div class="stats-card-head"><div class="stats-card-title"><h2>${t(titleKey)}</h2>${infoKey ? infoButton(infoKey, t(titleKey)) : ""}</div>${filters ? filterBar(titleKey, filters) : ""}</div>
      ${noteKey ? `<p class="stats-note">${t(noteKey)}</p>` : ""}
      ${body}
    </section>`;
  }

  function filterBar(titleKey, filters) {
    const controls = filters.map((filter) => {
      if (filter.type === "search") {
        return `<label class="stats-filter-search">${svgIcon(SEARCH_ICON)}<input type="search" data-filter="search" placeholder="${escapeAttr(t("stats.filterSearch"))}" aria-label="${escapeAttr(tf("stats.filterSearchLabel", { title: t(titleKey) }))}"></label>`;
      }
      if (filter.type === "impact") {
        return `<div class="stats-chips" role="group" aria-label="${escapeAttr(t("stats.filterImpact"))}">${filter.values.map((severity) => `<button type="button" class="stats-chip" data-filter="impact" data-value="${severity}" aria-pressed="true"><i class="impact-dot ${severity}" aria-hidden="true"></i><span>${escapeHtml(severityLabel(severity))}</span></button>`).join("")}</div>`;
      }
      if (filter.type === "html") return filter.html;
      return multiSelect(filter);
    }).join("");
    return `<div class="stats-filters" role="group" aria-label="${escapeAttr(tf("stats.filtersLabel", { title: t(titleKey) }))}">${controls}<span class="stats-filter-count" aria-live="polite"></span></div>`;
  }

  // Multiple-choice dropdown; the "All" box is checked, unchecked or indeterminate.
  function multiSelect(filter) {
    const panelId = `stats-multi-${filter.name}-${multiSelectCount += 1}`;
    const label = t(filter.labelKey);
    const searchable = filter.options.length > 10;
    return `<div class="stats-multi" data-filter="multi" data-name="${filter.name}" data-label="${escapeAttr(label)}">
      <button type="button" class="stats-multi-button" aria-expanded="false" aria-controls="${panelId}"><span class="stats-multi-label">${escapeHtml(label)} :</span> <span class="stats-multi-summary">${escapeHtml(t("stats.filterAll"))}</span>${svgIcon(CHEVRON_ICON, "stats-multi-chevron")}</button>
      <fieldset class="stats-multi-panel" id="${panelId}" hidden>
        <legend class="visually-hidden">${escapeHtml(label)}</legend>
        ${searchable ? `<input type="search" class="stats-multi-search" placeholder="${escapeAttr(t("stats.filterSearch"))}" aria-label="${escapeAttr(tf("stats.filterSearchLabel", { title: label }))}">` : ""}
        <label class="stats-multi-all"><input type="checkbox" data-multi-all checked> <span>${escapeHtml(t("stats.filterAll"))}</span></label>
        <div class="stats-multi-options">${filter.options.map(([value, optionLabel]) => `<label data-search="${escapeAttr(normalizeSearchText(optionLabel))}"><input type="checkbox" value="${escapeAttr(value)}" checked> <span>${escapeHtml(optionLabel)}</span></label>`).join("")}</div>
      </fieldset>
    </div>`;
  }

  function cellHtml(cell, numeric, shrink = false) {
    const value = cell !== null && typeof cell === "object" ? cell : { html: cell };
    const sort = value.sort ?? null;
    const classes = [numeric ? "num" : "", value.nowrap ? "nowrap" : "", value.date ? "date" : "", shrink ? "shrink" : ""].filter(Boolean).join(" ");
    return `<td${classes ? ` class="${classes}"` : ""}${sort !== null ? ` data-sort="${escapeAttr(sort)}"` : ""}>${value.html}</td>`;
  }

  function rowCells(row) {
    return Array.isArray(row) ? row : row.cells;
  }

  // A row is a list of cells, or { cells, impact, filters: { name: value | [values] }, search, only }.
  // only: "page" rows show in the page only, "expanded" rows only in the enlarged panel.
  function rowHtml(row, index, numericColumns, shrinkColumns = []) {
    const meta = Array.isArray(row) ? { cells: row } : row;
    const search = normalizeSearchText(meta.search ?? meta.cells.map((cell) => plainText(cell !== null && typeof cell === "object" ? cell.html : cell)).join(" "));
    const filters = Object.entries(meta.filters || {}).map(([name, values]) => ` data-f-${name}="${escapeAttr([].concat(values).join("|"))}"`).join("");
    return `<tr data-i="${index}" data-search="${escapeAttr(search)}"${meta.impact ? ` data-impact="${meta.impact}"` : ""}${meta.only ? ` data-only="${meta.only}"` : ""}${filters}>${meta.cells.map((cell, column) => cellHtml(cell, numericColumns[column], shrinkColumns.includes(column))).join("")}</tr>`;
  }

  // A header is a translation key, or [key, infoKey] when the column needs a definition.
  // options.sort = [column, direction] states the order rows are generated in, so its arrow shows on load.
  // options.shrink lists columns kept as narrow as their content, leaving room for the other titles.
  function table(key, headers, rows, { sort = null, widths = null, maxRows = null, shrink = [] } = {}) {
    // Columns holding numbers are centred; text columns (location, source) wrap.
    const numericColumns = headers.map((header, column) => rows.length > 0 && rows.every((row) => typeof rowCells(row)[column]?.sort === "number"));
    const headerHtml = headers.map((header, index) => {
      const [labelKey, infoKey] = [].concat(header);
      const classes = [numericColumns[index] ? "num" : "", shrink.includes(index) ? "shrink" : ""].filter(Boolean).join(" ");
      return `<th scope="col"${classes ? ` class="${classes}"` : ""} aria-sort="none"><span class="stats-th"><button type="button" class="stats-sort" data-col="${index}"><span>${t(labelKey)}</span>${svgIcon(SORT_ICONS.none, "stats-sort-icon")}</button>${infoKey ? infoButton(infoKey, t(labelKey)) : ""}</span></th>`;
    }).join("");
    const colgroup = widths ? `<colgroup>${widths.map((width) => `<col style="width:${width}">`).join("")}</colgroup>` : "";
    return `<div class="stats-table-wrap" data-table="${key}"${sort ? ` data-default-col="${sort[0]}" data-default-dir="${sort[1]}"` : ""}${maxRows ? ` data-max-rows="${maxRows}"` : ""}><table class="stats-table${widths ? " has-widths" : ""}">${colgroup}
      <thead><tr>${headerHtml}</tr></thead>
      <tbody>${rows.map((row, index) => rowHtml(row, index, numericColumns, shrink)).join("")}<tr class="stats-no-result" hidden><td colspan="${headers.length}" class="stats-empty">${t(rows.length ? "stats.noMatch" : "stats.empty")}</td></tr></tbody>
    </table></div><p class="stats-scroll-hint" aria-hidden="true" hidden></p>`;
  }

  // Canvas charts keep an accessible summary and the exact figures in a table below.
  function chartBlock(spec, headers, rows, tableOptions = {}) {
    if (!spec.labels.length) return `<p class="stats-empty">${t("stats.empty")}</p>`;
    const index = chartSpecs.push(spec) - 1;
    // Bar charts need about 22 px per label, otherwise the names overlap.
    const minHeight = spec.type === "hbar" ? spec.labels.length * 22 + 60 : CHART_MIN_HEIGHT;
    const chart = `<div class="stats-chart" data-base-height="${spec.height}" data-min-height="${minHeight}" style="height:${spec.height}px"${chartLibraryFailed ? " hidden" : ""}><canvas data-chart="${index}" role="img" aria-label="${escapeHtml(spec.summary)}"></canvas></div>`;
    return `${spec.sideLegend ? `<div class="stats-chart-side">${chart}<div class="stats-legend-side">${spec.sideLegend}</div></div>` : chart}
      <details class="stats-chart-values"${chartLibraryFailed ? " open" : ""}><summary>${t("stats.chartValues")}</summary>${table(`${spec.key}-values`, headers, rows, tableOptions)}</details>`;
  }

  // One stacked series per impact type, with the map colours; the chart keeps the top entries only.
  function breakdownChart(key, titleKey, entries, total, labelHeader) {
    const impacts = IMPACT_ORDER.filter((severity) => entries.some((entry) => entry.counts[severity]));
    const charted = entries.slice(0, CHART_TOP_LIMIT);
    const spec = {
      key,
      type: "hbar",
      labels: charted.map((entry) => entry.label),
      totals: charted.map((entry) => entry.count),
      series: impacts.map((severity) => ({ label: severityLabel(severity), values: charted.map((entry) => entry.counts[severity] || 0), color: SEVERITY_META[severity].color })),
      height: Math.max(170, charted.length * 28 + 70),
      summary: `${t(titleKey)}. ${charted.map((entry) => `${entry.label} : ${numberFormat(entry.count)}`).join("; ")}`
    };
    const rows = entries.map((entry) => [escapeHtml(entry.label), num(entry.count), ...IMPACT_ORDER.map((severity) => num(entry.counts[severity] || 0)), ...(total ? [num(entry.count / total, percent(entry.count, total))] : [])]);
    const headers = [labelHeader, ...countHeaders(), ...(total ? ["stats.colShare"] : [])];
    return chartBlock(spec, headers, rows, { sort: [1, -1], shrink: [1] });
  }

  // Total first (then the estimated kilometres when asked), then all four impact types, even when empty.
  // Total first (then the estimated kilometres when asked), then all four impact types, even when empty.
  function countHeaders({ totalInfoKey = "stats.info.total", kmInfoKey = null } = {}) {
    return [["stats.colTotal", totalInfoKey], ...(kmInfoKey ? [["stats.colKm", kmInfoKey]] : []), ...IMPACT_ORDER.map((severity) => `stats.colImpact.${severity}`)];
  }

  function countCells(closures, kmItems = null) {
    const counts = severityCounts(closures);
    return [num(closures.length), ...(kmItems ? [kmCell(kmItems)] : []), ...IMPACT_ORDER.map((severity) => num(counts[severity] || 0))];
  }

  function kmCell(items) {
    const measured = items.filter((item) => item.length.meters > 0);
    const km = measured.reduce((sum, item) => sum + item.length.meters, 0) / 1000;
    return measured.length ? num(km, `${numberFormat(km, km < 10 ? 2 : 1)} km`) : { html: "—", sort: -1 };
  }

  function swatch(color) {
    return `<i class="stats-swatch" style="background:${color}" aria-hidden="true"></i>`;
  }

  // Stacked 100 % bar and its legend; parts = [{ label, value, color, dot? }].
  function stackBar(label, parts, total) {
    const shown = parts.filter((part) => part.value);
    const stacked = shown.map((part) => `<span class="stats-stack-part" style="flex:${part.value};background:${part.color}" title="${escapeAttr(`${part.label} : ${numberFormat(part.value)} (${percent(part.value, total)})`)}"></span>`).join("");
    const legend = shown.map((part) => `<li>${part.dot || swatch(part.color)}<span>${escapeHtml(part.label)}</span><strong>${numberFormat(part.value)}</strong><small>${percent(part.value, total)}</small></li>`).join("");
    return `<div class="stats-stack" role="img" aria-label="${escapeAttr(`${plainText(label)} : ${shown.map((part) => `${part.label} ${numberFormat(part.value)} (${percent(part.value, total)})`).join("; ")}`)}">${stacked}</div><ul class="stats-legend">${legend}</ul>`;
  }

  function kpiRow(cards) {
    return `<section class="stats-kpis">${cards.map(([icon, key, value]) => `<div class="stats-kpi"><span class="stats-kpi-icon" aria-hidden="true">${icon}</span><strong>${value}</strong><span>${t(key)}</span></div>`).join("")}</section>`;
  }

  function placeEntry(label, group) {
    return { label, count: group.length, counts: severityCounts(group.map((item) => item.closure)) };
  }

  // Day and month stay together so a narrow column breaks before the year.
  function dateLabel(key) {
    return formatDate(key).replace(" ", "\u00a0");
  }

  function closureCell(closure) {
    return `<span class="stats-closure-title">${escapeHtml(closure.title || "")}</span>
      <small>${escapeHtml(closure.streets || "")}</small>`;
  }

  function impactDot(severity) {
    return `<i class="impact-dot ${escapeHtml(severity)}" title="${escapeHtml(severityLabel(severity))}"></i>`;
  }

  function presentImpacts(closures) {
    const present = new Set(closures.map((closure) => closure.severity));
    return IMPACT_ORDER.filter((severity) => present.has(severity));
  }

  function closureRows(closures, dateField) {
    return [...closures]
      .sort((a, b) => String(a[dateField]).localeCompare(String(b[dateField])) || severityRank(a.severity) - severityRank(b.severity))
      .map((closure) => ({
        impact: closure.severity,
        filters: { source: normalizeSearchText(closure.source) },
        cells: [
          { html: `${impactDot(closure.severity)} ${closureCell(closure)}`, sort: closure.title || "" },
          { html: escapeHtml(dateLabel(closure[dateField])), sort: closure[dateField] || "", date: true },
          sourceLink(closure)
        ]
      }));
  }

  function sourceOptions(closures) {
    return [...new Map(closures.map((closure) => [normalizeSearchText(closure.source), closure.source])).entries()].sort((a, b) => a[1].localeCompare(b[1], "fr"));
  }

  // Calendar difference, both published days included: "1 an, 2 mois, 3 jours".
  function humanDuration(startKey, endKey) {
    const start = parseDate(startKey);
    const end = parseDate(endKey);
    end.setDate(end.getDate() + 1);
    let years = end.getFullYear() - start.getFullYear();
    let months = end.getMonth() - start.getMonth();
    let days = end.getDate() - start.getDate();
    if (days < 0) {
      months -= 1;
      days += new Date(end.getFullYear(), end.getMonth(), 0).getDate();
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }
    const part = (value, unit) => (value ? tf(`stats.unit.${unit}${value === 1 ? "One" : "Other"}`, { n: value }) : "");
    return [part(years, "year"), part(months, "month"), part(days, "day")].filter(Boolean).join(", ") || tf("stats.unit.dayOne", { n: 1 });
  }

  function periodLabel(range) {
    if (statsAllDates) return t("stats.scopeAll");
    const start = formatDate(formatInputDate(range.start));
    if (dateEndUsesOpenDefault) return tf("stats.periodFrom", { start });
    const end = formatDate(formatInputDate(range.end));
    return start === end ? tf("stats.periodDay", { date: start }) : tf("stats.periodRange", { start, end });
  }

  // Only an error stays in the header; loading is shown by the centred popup, like the map.
  function statusHtml() {
    return mapStatus.dataset.mode === "error" ? `<p class="stats-status is-error">${t("stats.error")}</p>` : "";
  }

  // --- Sections -----------------------------------------------------------------

  function kpis(stats) {
    const items = stats.items;
    const critical = items.filter((item) => item.closure.severity === "critical").length;
    const upper = items.filter((item) => isUpperNetwork(item.closure, item.route)).length;
    const km = items.reduce((sum, item) => sum + item.length.meters, 0) / 1000;
    const cards = [
      ["🚧", statsAllDates ? "stats.kpiTotalAll" : "stats.kpiTotal", numberFormat(items.length)],
      ["⛔", "stats.kpiCritical", numberFormat(critical)],
      ["🛣️", "stats.kpiUpper", numberFormat(upper)],
      ["📅", "stats.kpiStarting", numberFormat(stats.starting.length)],
      ["📏", "stats.kpiKm", `${numberFormat(km, 1)} km`]
    ];
    return kpiRow(cards);
  }

  function impactSection(stats, { row = null } = {}) {
    const total = stats.items.length;
    const counts = severityCounts(stats.items.map((item) => item.closure));
    const parts = IMPACT_ORDER.map((severity) => ({ label: severityLabel(severity), value: counts[severity] || 0, color: SEVERITY_META[severity].color, dot: impactDot(severity) }));
    return card("impact", "stats.impactTitle", total
      ? stackBar(t("stats.impactTitle"), parts, total)
      : `<p class="stats-empty">${t("stats.empty")}</p>`, { wide: !row, row, infoKey: "stats.info.impact" });
  }

  function roadKind(item) {
    if (item.route?.startsWith("A-")) return "autoroute";
    if (item.route) return "route";
    return isUpperNetwork(item.closure, item.route) ? "bridge" : "street";
  }

  function roadsKpis(stats) {
    const items = stats.items;
    const kinds = countBy(items, roadKind);
    const size = (kind) => kinds.get(kind)?.length || 0;
    const routed = items.filter((item) => item.route);
    const withDirection = routed.filter((item) => directionKey(item.closure) !== "unpublished").length;
    const upperCritical = items.filter((item) => item.closure.severity === "critical" && isUpperNetwork(item.closure, item.route)).length;
    return kpiRow([
      ["🛣️", "stats.kpiAutoroutes", numberFormat(size("autoroute"))],
      ["🔢", "stats.kpiRoutes", numberFormat(size("route"))],
      ["🌉", "stats.kpiBridges", numberFormat(size("bridge"))],
      ["⛔", "stats.kpiUpperCritical", numberFormat(upperCritical)],
      ["🧭", "stats.kpiDirection", percent(withDirection, routed.length)]
    ]);
  }

  function roadKindSection(stats, { row = null } = {}) {
    const total = stats.items.length;
    const kinds = countBy(stats.items, roadKind);
    const parts = ["autoroute", "route", "bridge", "street"].map((kind) => ({ label: t(`stats.roadKind.${kind}`), value: kinds.get(kind)?.length || 0, color: ROAD_KIND_COLORS[kind] }));
    return card("roadKind", "stats.roadKindTitle", total
      ? stackBar(t("stats.roadKindTitle"), parts, total)
      : `<p class="stats-empty">${t("stats.empty")}</p>`, { wide: !row, row, infoKey: "stats.info.roadKind" });
  }

  // Two rings: inner = public / companies / other, outer = the detailed responsible types.
  // Choosing one group zooms in: inner = its sub-types, outer = their detail (network, company, city, body).
  let authorityGroup = null;
  const DETAIL_LIMIT = 6;
  const NETWORK_PATTERNS = [
    ["Hydro-Québec", /hydro-?qu[ée]bec|\bHQ\b/i],
    ["Hydro Westmount", /hydro westmount/i],
    ["CSEM", /\bcsem\b|commission des services [ée]lectriques/i],
    ["Bell", /\bbell\b/i],
    ["Énergir", /[ée]nergir|gaz m[ée]tro|\bgaz\b/i],
    ["Vidéotron", /vid[ée]otron/i],
    ["Telus", /\btelus\b/i],
    ["Rogers", /\brogers\b/i]
  ];

  function authorityDetail(item) {
    const closure = item.closure;
    const kind = closure.sourceKind || "";
    const responsible = String(closure.responsible || "").trim();
    switch (item.type) {
      case "utility": {
        const text = `${item.organization || ""} ${responsible}`;
        const networks = NETWORK_PATTERNS.filter(([, pattern]) => pattern.test(text)).map(([name]) => name);
        if (closure.siteAuthority === "csem" && !networks.includes("CSEM")) networks.push("CSEM");
        if (networks.length === 1) return networks[0];
        return t(networks.length ? "stats.detail.severalNetworks" : "stats.detail.unnamedNetwork");
      }
      case "cityContractor":
      case "private":
        return item.organization || t("stats.detail.unnamedCompany");
      case "city":
        return municipalityLabel(closure) || t("stats.notPublished");
      case "publicOrg":
        if (MTMD_KINDS.has(kind) || /\bMTQ\b|MTMD|minist/i.test(responsible)) return "MTMD";
        if (kind === "pjcci" || /PJCCI/i.test(responsible)) return "PJCCI";
        if (kind.startsWith("longueuil") && Number(closure.responsibleCode) === 2) return "MTMD";
        return (kind === "montreal-wfs" ? closure.organization : "") || responsible || t("stats.notPublished");
      case "citizen":
        return t("stats.authority.citizen");
      default:
        return closure.source || t("stats.notPublished");
    }
  }

  // Top details of each sub-type; the rest is merged into "N other companies / networks / ...".
  function typeDetails(group, type) {
    const byDetail = [...countBy(group, (item) => normalizeSearchText(authorityDetail(item)) || "-").values()]
      .map((list) => ({ label: mostFrequent(list.map(authorityDetail)), items: list }))
      .sort((a, b) => b.items.length - a.items.length);
    if (byDetail.length <= DETAIL_LIMIT + 1) return byDetail;
    const rest = byDetail.slice(DETAIL_LIMIT);
    return [...byDetail.slice(0, DETAIL_LIMIT), { label: tf(`stats.detail.othersOf.${DETAIL_NOUNS[type] || "sources"}`, { n: numberFormat(rest.length) }), items: rest.flatMap((entry) => entry.items), others: true, rest }];
  }

  function authoritySection(stats) {
    const total = stats.items.length;
    const groups = countBy(stats.items, (item) => item.type);
    const groupOf = (type) => Object.keys(AUTHORITY_GROUPS).find((group) => AUTHORITY_GROUPS[group].includes(type));
    const types = Object.values(AUTHORITY_GROUPS).flatMap((list) => list.filter((type) => groups.has(type)).sort((a, b) => groups.get(b).length - groups.get(a).length));
    const groupKeys = Object.keys(AUTHORITY_GROUPS).filter((group) => types.some((type) => groupOf(type) === group));
    const groupCount = (group) => types.filter((type) => groupOf(type) === group).reduce((sum, type) => sum + groups.get(type).length, 0);
    if (authorityGroup && !groupKeys.includes(authorityGroup)) authorityGroup = null;
    const typeLabel = (type) => t(`stats.authority.${type}`);
    const groupLabel = (group) => t(`stats.authorityGroup.${group}`);
    const shownTypes = authorityGroup ? types.filter((type) => groupOf(type) === authorityGroup) : types;
    const base = authorityGroup ? groupCount(authorityGroup) : total;
    const typeItem = (type, index) => `<li data-arc="0:${index}">${swatch(AUTHORITY_COLORS[type])} <span>${escapeHtml(typeLabel(type))}</span> <small>${numberFormat(groups.get(type).length)} · ${percent(groups.get(type).length, base)}</small></li>`;
    let paletteIndex = 0;
    const details = authorityGroup ? shownTypes.flatMap((type) => typeDetails(groups.get(type), type).map((detail) => ({ ...detail, type, color: detail.others ? DETAIL_OTHERS_COLOR : DETAIL_PALETTE[paletteIndex++ % DETAIL_PALETTE.length] }))) : [];
    const spec = authorityGroup
      ? {
        key: `authority-${authorityGroup}`,
        type: "sunburst",
        labels: details.map((detail) => detail.label),
        values: details.map((detail) => detail.items.length),
        colors: details.map((detail) => detail.color),
        innerLabels: shownTypes.map(typeLabel),
        innerValues: shownTypes.map((type) => groups.get(type).length),
        innerColors: shownTypes.map((type) => AUTHORITY_COLORS[type]),
        sideLegend: `<p class="stats-legend-head">${swatch(AUTHORITY_GROUP_COLORS[authorityGroup])} <strong>${escapeHtml(groupLabel(authorityGroup))}</strong> <small>${escapeHtml(tf("stats.groupShare", { n: numberFormat(base), share: percent(base, total) }))}</small></p>
          <ul class="stats-legend stats-legend-list">${shownTypes.map((type, typeIndex) => `<li data-arc="1:${typeIndex}">${swatch(AUTHORITY_COLORS[type])} <strong>${escapeHtml(typeLabel(type))}</strong> <small>${percent(groups.get(type).length, base)}</small>
          <ul>${details.map((detail, index) => (detail.type === type ? `<li data-arc="0:${index}">${swatch(detail.color)} <span>${escapeHtml(detail.label)}</span> <small>${numberFormat(detail.items.length)} · ${percent(detail.items.length, base)}</small></li>` : "")).join("")}</ul></li>`).join("")}</ul>`,
        height: 380,
        summary: `${t("stats.authorityTitle")}, ${groupLabel(authorityGroup)}. ${details.map((detail) => `${typeLabel(detail.type)}, ${detail.label} : ${percent(detail.items.length, base)} (${numberFormat(detail.items.length)})`).join("; ")}`
      }
      : {
        key: "authority",
        type: "sunburst",
        labels: types.map(typeLabel),
        values: types.map((type) => groups.get(type).length),
        colors: types.map((type) => AUTHORITY_COLORS[type]),
        innerLabels: groupKeys.map(groupLabel),
        innerValues: groupKeys.map(groupCount),
        innerColors: groupKeys.map((group) => AUTHORITY_GROUP_COLORS[group]),
        sideLegend: `<ul class="stats-legend stats-legend-list">${groupKeys.map((group, groupIndex) => `<li data-arc="1:${groupIndex}">${swatch(AUTHORITY_GROUP_COLORS[group])} <strong>${escapeHtml(groupLabel(group))}</strong> <small>${percent(groupCount(group), total)}</small>
          <ul>${types.filter((type) => groupOf(type) === group).map((type) => typeItem(type, types.indexOf(type))).join("")}</ul></li>`).join("")}</ul>`,
        height: 380,
        summary: `${t("stats.authorityTitle")}. ${groupKeys.map((group) => `${groupLabel(group)} : ${percent(groupCount(group), total)}`).join("; ")}. ${types.map((type) => `${typeLabel(type)} : ${numberFormat(groups.get(type).length)}`).join("; ")}`
      };
    const critical = (list) => list.filter((item) => item.closure.severity === "critical").length;
    const detailRow = (detail, type, only = null) => ({ only, cells: [escapeHtml(detail.label), typeLabel(type), num(detail.items.length), num(detail.items.length / base, percent(detail.items.length, base)), num(critical(detail.items))] });
    // The enlarged panel lists each grouped company / network / body on its own row instead of "N others".
    const rows = authorityGroup
      ? details.flatMap((detail) => (detail.others
        ? [detailRow(detail, detail.type, "page"), ...detail.rest.map((entry) => detailRow(entry, detail.type, "expanded"))]
        : [detailRow(detail, detail.type)]))
      : [...shownTypes].sort((a, b) => groups.get(b).length - groups.get(a).length).map((type) => [typeLabel(type), groupLabel(groupOf(type)), num(groups.get(type).length), num(groups.get(type).length / base, percent(groups.get(type).length, base)), num(critical(groups.get(type)))]);
    const headers = authorityGroup ? ["stats.colDetail", "stats.colType", "stats.colCount", "stats.colShare", "stats.colCritical"] : ["stats.colType", "stats.colGroup", "stats.colCount", "stats.colShare", "stats.colCritical"];
    const segments = `<div class="stats-segments" role="group" aria-label="${escapeAttr(t("stats.filterAuthorityGroup"))}">${[null, ...groupKeys].map((group) => `<button type="button" class="stats-segment" data-filter="authority-group" data-value="${group || "all"}" aria-pressed="${String(authorityGroup === group)}">${group ? swatch(AUTHORITY_GROUP_COLORS[group]) : ""}<span>${escapeHtml(group ? groupLabel(group) : t("stats.filterAll"))}</span></button>`).join("")}</div>`;
    const filters = groupKeys.length > 1 ? [{ type: "html", html: segments }] : null;
    return card("authority", "stats.authorityTitle", chartBlock(spec, headers, rows, { sort: [2, -1] }), { infoKey: "stats.info.authority", pair: "left", filters });
  }

  // Time since the published start, up to today (or up to the end for work already finished).
  let ageOngoingOnly = true;

  function ageSection(stats, { row = null } = {}) {
    const today = parseDate(stats.today).valueOf();
    const ages = stats.items
      .filter(({ closure }) => closure.sourceKind !== "citizen-report" && closure.startDate && closure.startDate <= stats.today && (!ageOngoingOnly || !hasExpiredToday(closure)))
      .map(({ closure }) => {
        const end = closure.endDate && closure.endDate < stats.today ? parseDate(closure.endDate).valueOf() : today;
        return Math.round((end - parseDate(closure.startDate).valueOf()) / DAY_MS);
      })
      .filter(Number.isFinite);
    const parts = AGE_BUCKETS.map(([min, max, key], index) => ({ label: t(`stats.age.${key}`), value: ages.filter((age) => age >= min && age <= max).length, color: AGE_COLORS[index] }));
    const toggle = `<label class="stats-toggle"><input type="checkbox" data-filter="age-ongoing" data-value="1"${ageOngoingOnly ? " checked" : ""}><span>${escapeHtml(t("stats.ageOngoing"))}</span></label>`;
    return card("age", "stats.ageTitle", ages.length
      ? stackBar(t("stats.ageTitle"), parts, ages.length)
      : `<p class="stats-empty">${t("stats.empty")}</p>`, { infoKey: "stats.info.age", row, filters: [{ type: "html", html: toggle }] });
  }

  // Two bars: who does the work, and whom it is done for (a city contractor works for the public sector).
  function sectorSection(stats) {
    const total = stats.items.length;
    if (!total) return card("sector", "stats.sectorTitle", `<p class="stats-empty">${t("stats.empty")}</p>`, { wide: true });
    const bars = [["stats.sectorByTitle", "stats.info.sectorBy", sectorBy], ["stats.sectorForTitle", "stats.info.sectorFor", sectorFor]].map(([titleKey, infoKey, classify]) => {
      const counts = { public: 0, private: 0, undetermined: 0 };
      stats.items.forEach((item) => { counts[classify(item)] += 1; });
      const parts = SECTORS.map((sector) => ({ label: t(`stats.sector.${sector}`), value: counts[sector], color: SECTOR_COLORS[sector] }));
      return `<div class="stats-sector"><div class="stats-card-title"><h3>${t(titleKey)}</h3>${infoButton(infoKey, plainText(t(titleKey)))}</div>${stackBar(t(titleKey), parts, total)}</div>`;
    });
    return card("sector", "stats.sectorTitle", bars.join(""), { wide: true });
  }

  function mandateSection(stats) {
    const groups = countBy(stats.items.filter((item) => COMPANY_TYPES.has(item.type)), (item) => item.type);
    const types = [...COMPANY_TYPES].filter((type) => groups.has(type));
    const total = types.reduce((sum, type) => sum + groups.get(type).length, 0);
    const spec = {
      key: "mandate",
      type: "doughnut",
      labels: types.map((type) => t(`stats.forAccount.${type}`)),
      values: types.map((type) => groups.get(type).length),
      colors: types.map((type) => MANDATE_COLORS[type]),
      height: 230,
      summary: `${t("stats.mandateTitle")}. ${types.map((type) => `${t(`stats.forAccount.${type}`)} : ${percent(groups.get(type).length, total)} (${numberFormat(groups.get(type).length)})`).join("; ")}`
    };
    const rows = types.map((type) => {
      const group = groups.get(type);
      return [t(`stats.forAccount.${type}`), num(group.length), num(group.length / total, percent(group.length, total))];
    }).sort((a, b) => b[1].sort - a[1].sort);
    return card("mandate", "stats.mandateTitle", chartBlock(spec, ["stats.colMandate", "stats.colCount", "stats.colShare"], rows, { sort: [1, -1] }), { infoKey: "stats.info.company", pair: "right" });
  }

  function companySection(stats) {
    const companyItems = stats.items.filter((item) => COMPANY_TYPES.has(item.type));
    const named = companyItems.filter((item) => item.organization);
    const groups = countBy(named, (item) => organizationKey(item.organization));
    const accounts = new Set();
    const companies = [];
    const rows = [...groups.entries()]
      .sort((a, b) => b[1].length - a[1].length)
      .map(([key, group]) => {
        const name = mostFrequent(group.map((item) => item.organization));
        companies.push([key, name]);
        const types = [...new Set(group.map((item) => item.type))];
        types.forEach((type) => accounts.add(type));
        const forTypes = types.map((type) => t(`stats.forAccount.${type}`)).join(", ");
        return { filters: { account: types, company: key }, cells: [{ html: `${escapeHtml(name)}<small>${escapeHtml(forTypes)}</small>`, sort: name }, ...countCells(group.map((item) => item.closure), group)] };
      });
    const unnamed = companyItems.length - named.length;
    const footer = unnamed ? `<p class="stats-note">${tf("stats.companyUnnamed", { n: numberFormat(unnamed) })}</p>` : "";
    const filters = [
      { type: "select", name: "company", labelKey: "stats.filterCompany", options: companies.sort((a, b) => a[1].localeCompare(b[1], "fr")) },
      { type: "select", name: "account", labelKey: "stats.filterAccount", options: [...COMPANY_TYPES].filter((type) => accounts.has(type)).map((type) => [type, t(`stats.forAccount.${type}`)]) },
      { type: "search" }
    ];
    return card("company", "stats.companyTitle", table("company", ["stats.colCompany", ...countHeaders({ kmInfoKey: "stats.info.companyKm" })], rows, { sort: [1, -1] }) + footer, { infoKey: "stats.info.companyTable", wide: true, filters });
  }

  function routeCounts(group) {
    return countCells(group.map((item) => item.closure));
  }

  function routeBadge(route) {
    return { html: `<span class="stats-route ${route.startsWith("A-") ? "is-autoroute" : ""}">${escapeHtml(route)}</span>`, sort: route };
  }

  const ROUTE_COUNT_HEADERS = countHeaders();
  // Six titled columns need about 470 px per card: two cards side by side need a grid this wide.
  const ROUTE_STACK_BELOW = 1000;

  function routeSection(stats) {
    const groups = countBy(stats.items, (item) => item.route);
    const rows = [...groups.entries()]
      .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0], undefined, { numeric: true }))
      .map(([route, group]) => ({ filters: { kind: route.startsWith("A-") ? "autoroute" : "route" }, cells: [routeBadge(route), ...routeCounts(group)] }));
    const filters = [
      { type: "select", name: "kind", labelKey: "stats.filterRouteKind", options: [["autoroute", t("stats.axis.autoroute")], ["route", t("stats.axis.route")]] },
      { type: "search" }
    ];
    return card("route", "stats.routeTitle", table("route", ["stats.colRoute", ...ROUTE_COUNT_HEADERS], rows, { sort: [1, -1], shrink: [0, 1] }), { noteKey: "stats.routeIntro", infoKey: "stats.routeNote", filters, stackBelow: ROUTE_STACK_BELOW });
  }

  const CARDINALS = { nord: "north", sud: "south", est: "east", ouest: "west", north: "north", south: "south", east: "east", west: "west" };

  // Directions as published: MTMD has a dedicated field; curated notices name them in prose.
  function directionKey(closure) {
    const text = String(closure.direction || "");
    if (!text.trim() || /non publi|non pr[ée]cis|not published/i.test(text)) return "unpublished";
    if (/une direction à la fois|one direction at a time/i.test(text)) return "alternating";
    if (/deux directions|deux sens|both directions/i.test(text)) return "both";
    const firstClause = closure.sourceKind === "quebec511-mtmd-wfs" ? text : text.split(/[,.;]/)[0];
    const found = [...firstClause.matchAll(/(?<![-\w])(nord|sud|est|ouest|north|south|east|west)\b/gi)].map((match) => CARDINALS[match[1].toLowerCase()]);
    const unique = ["north", "south", "east", "west"].filter((cardinal) => found.includes(cardinal));
    return unique.length ? unique.join("-") : "other";
  }

  function directionLabel(key) {
    if (["unpublished", "alternating", "both", "other"].includes(key)) return t(`stats.direction.${key}`);
    return key.split("-").map((cardinal) => t(`stats.direction.${cardinal}`)).join(" / ");
  }

  function routeDirectionSection(stats) {
    const routed = stats.items.filter((item) => item.route);
    const published = routed.filter((item) => directionKey(item.closure) !== "unpublished");
    const groups = countBy(published, (item) => `${item.route}|${directionKey(item.closure)}`);
    const directions = new Set();
    const rows = [...groups.entries()]
      .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0], undefined, { numeric: true }))
      .map(([key, group]) => {
        const [route, direction] = key.split("|");
        directions.add(direction);
        const badge = routeBadge(route);
        // Route and direction share one column so the half-width table fits with its sort arrows.
        return {
          filters: { kind: route.startsWith("A-") ? "autoroute" : "route", direction },
          cells: [{ html: `${badge.html} ${escapeHtml(directionLabel(direction))}`, sort: `${route} ${directionLabel(direction)}` }, ...routeCounts(group)]
        };
      });
    const directionOrder = ["north", "south", "east", "west", "north-south", "east-west", "both", "alternating", "other"];
    const filters = [
      { type: "select", name: "kind", labelKey: "stats.filterRouteKind", options: [["autoroute", t("stats.axis.autoroute")], ["route", t("stats.axis.route")]] },
      { type: "select", name: "direction", labelKey: "stats.filterDirection", options: [...directions].sort((a, b) => (directionOrder.indexOf(a) + 99) % 99 - (directionOrder.indexOf(b) + 99) % 99).map((direction) => [direction, directionLabel(direction)]) },
      { type: "search" }
    ];
    const excluded = routed.length - published.length;
    const note = excluded ? `<p class="stats-note">${tf("stats.directionExcluded", { n: numberFormat(excluded) })}</p>` : "";
    return card("routeDirection", "stats.routeDirectionTitle", note + table("routeDirection", ["stats.colRouteDirection", ...ROUTE_COUNT_HEADERS], rows, { sort: [1, -1], shrink: [1] }), { infoKey: "stats.info.routeDirection", filters, stackBelow: ROUTE_STACK_BELOW });
  }

  function streetSection(stats) {
    const candidates = stats.items.filter((item) => !item.route?.startsWith("A-") && !STREET_EXCLUDED_KINDS.has(item.closure.sourceKind));
    const named = candidates
      .map((item) => ({ ...item, street: streetName(item.closure), municipality: municipalityLabel(item.closure) || t("stats.notPublished") }))
      .filter((item) => item.street && streetKey(item.street));
    const groups = countBy(named, (item) => `${normalizeSearchText(item.municipality)}|${streetKey(item.street)}`);
    const municipalities = new Map();
    const rows = [...groups.values()]
      .sort((a, b) => b.length - a.length)
      .map((group) => {
        const street = mostFrequent(group.map((item) => item.street));
        const municipalityKey = normalizeSearchText(group[0].municipality);
        municipalities.set(municipalityKey, group[0].municipality);
        return { filters: { municipality: municipalityKey }, cells: [{ html: `${escapeHtml(street)}<small>${escapeHtml(group[0].municipality)}</small>`, sort: street }, ...countCells(group.map((item) => item.closure), group)] };
      });
    const filters = [
      { type: "select", name: "municipality", labelKey: "stats.filterMunicipality", options: [...municipalities.entries()].sort((a, b) => a[1].localeCompare(b[1], "fr")) },
      { type: "search" }
    ];
    const unnamed = candidates.filter((item) => !streetName(item.closure));
    const bySource = [...countBy(unnamed, (item) => municipalityLabel(item.closure) || item.closure.source).entries()]
      .sort((a, b) => b[1].length - a[1].length).slice(0, 4)
      .map(([label, list]) => `${label} (${numberFormat(list.length)})`).join(", ");
    const note = unnamed.length ? `<p class="stats-note">${tf("stats.streetExcluded", { n: numberFormat(unnamed.length), list: bySource })}</p>` : "";
    return card("street", "stats.streetTitle", note + table("street", ["stats.colStreet", ...countHeaders({ kmInfoKey: "stats.info.streetKm" })], rows, { sort: [1, -1] }), { infoKey: "stats.streetNote", wide: true, filters });
  }

  function routeFromNumber(value) {
    const number = Number(value);
    return number < 100 || number >= 400 ? `A-${number}` : `R-${number}`;
  }

  function upperAxis(item) {
    const closure = item.closure;
    if (item.route) return { kind: item.route.startsWith("A-") ? "autoroute" : "route", label: item.route };
    const text = `${closure.title || ""} ${closure.streets || ""}`;
    const match = text.match(/(?<!sous le )\b([Pp]ont|PONT|[Tt]unnel)\s+((?!(?:du|de|des|d')\b)[A-ZÀ-Ý][^,/()]*?)(?=\s*(?:,|\/|\(|\)|\s-\s|\sentre\s|\svers\s|\sen direction|$))/);
    if (match) {
      const tunnel = /tunnel/i.test(match[1]);
      return { kind: tunnel ? "tunnel" : "bridge", label: `${tunnel ? "Tunnel" : "Pont"} ${match[2].trim()}`.slice(0, 48) };
    }
    if (closure.roadType === "tunnel") return { kind: "tunnel", label: `Tunnel ${leadingSegment(closure.streets).trim()}` };
    return { kind: "other", label: leadingSegment(closure.streets).trim() || closure.title || "" };
  }

  // Montreal publishes highways as "13, entre 13 et 13": say what is actually known instead.
  function upperLocation(closure) {
    const streets = String(closure.streets || "").trim();
    if (closure.sourceKind === "montreal-wfs") {
      const borough = boroughLabel(closure.borough);
      const match = streets.match(/^(.+?),\s*entre\s+(.+?)\s+et\s+(.+)$/i);
      if (!match) return { main: streets, sub: borough };
      const [, street, from, to] = match;
      const place = (value) => (/^\d{1,3}$/.test(value) ? routeFromNumber(value) : value);
      if (from === street && to === street) return { main: t("stats.locationUnpublished"), sub: borough };
      if (from === to) return { main: tf("stats.locationNear", { place: place(from) }), sub: borough };
      return { main: tf("stats.locationBetween", { from: place(from), to: place(to) }), sub: borough };
    }
    const work = closure.title && !closure.title.includes(streets) ? closure.title : "";
    return { main: streets || closure.title || "", sub: work };
  }

  function upperClosuresSection(stats) {
    const entries = new Map();
    stats.items
      .filter((item) => item.closure.severity === "critical" && isUpperNetwork(item.closure, item.route))
      .forEach((item) => {
        const closure = item.closure;
        const axis = upperAxis(item);
        const location = upperLocation(closure);
        const key = [axis.label, location.main, location.sub, closure.startDate, closure.endDate, closure.responsible, closure.source].join("|");
        if (entries.has(key)) entries.get(key).count += 1;
        else entries.set(key, { closure, axis, location, count: 1 });
      });
    const sources = new Map();
    const responsibles = new Map();
    const kinds = new Set();
    const rows = [...entries.values()]
      .sort((a, b) => String(a.closure.endDate).localeCompare(String(b.closure.endDate)))
      .map(({ closure, axis, location, count }) => {
        const responsible = closure.responsible || t("stats.notPublished");
        sources.set(normalizeSearchText(closure.source), closure.source);
        responsibles.set(normalizeSearchText(responsible), responsible);
        kinds.add(axis.kind);
        const end = closure.endDate >= "2099" ? t("stats.undetermined") : formatDate(closure.endDate);
        const badge = axis.kind === "autoroute" || axis.kind === "route"
          ? `<span class="stats-route ${axis.kind === "autoroute" ? "is-autoroute" : ""}">${escapeHtml(axis.label)}</span>`
          : `<strong>${escapeHtml(axis.label)}</strong>`;
        return {
          filters: { axis: axis.kind, source: normalizeSearchText(closure.source), responsible: normalizeSearchText(responsible) },
          cells: [
            { html: badge, sort: axis.label },
            { html: `${escapeHtml(location.main)}${location.sub ? `<small>${escapeHtml(location.sub)}</small>` : ""}${count > 1 ? `<small>${escapeHtml(tf("stats.duplicates", { n: count }))}</small>` : ""}`, sort: location.main },
            escapeHtml(responsible),
            { html: `${escapeHtml(closure.startDate ? dateLabel(closure.startDate) : "…")} → ${escapeHtml(closure.endDate >= "2099" ? end : dateLabel(closure.endDate))}`, sort: closure.endDate || "" },
            sourceLink(closure)
          ]
        };
      });
    const sorted = (map) => [...map.entries()].sort((a, b) => a[1].localeCompare(b[1], "fr"));
    const filters = [
      { type: "select", name: "axis", labelKey: "stats.filterAxis", options: ["autoroute", "route", "bridge", "tunnel", "other"].filter((kind) => kinds.has(kind)).map((kind) => [kind, t(`stats.axis.${kind}`)]) },
      { type: "select", name: "responsible", labelKey: "stats.filterResponsible", options: sorted(responsibles) },
      { type: "select", name: "source", labelKey: "stats.filterSource", options: sorted(sources) },
      { type: "search" }
    ];
    return card("upper", "stats.upperTitle", table("upper", [["stats.colAxis", "stats.info.axis"], "stats.colLocation", "stats.colResponsible", "stats.colPeriod", "stats.colSource"], rows, { sort: [3, 1], widths: ["12%", "30%", "20%", "20%", "18%"] }), { noteKey: "stats.upperNote", infoKey: "stats.info.upper", wide: true, filters });
  }

  function municipalitySection(stats) {
    const groups = countBy(stats.items, (item) => municipalityLabel(item.closure) || t("stats.notPublished"));
    const merged = countBy([...groups.entries()], ([label]) => normalizeSearchText(label));
    const entries = [...merged.values()]
      .map((pairs) => placeEntry(pairs[0][0], pairs.flatMap(([, list]) => list)))
      .sort((a, b) => b.count - a.count);
    return card("municipality", "stats.municipalityTitle", breakdownChart("municipality", "stats.municipalityTitle", entries, stats.items.length, "stats.colMunicipality"), { infoKey: "stats.info.municipality" });
  }

  function boroughSection(stats) {
    const groups = countBy(stats.items.filter((item) => item.closure.sourceKind === "montreal-wfs"), (item) => item.closure.borough);
    const entries = [...groups.entries()].map(([code, group]) => placeEntry(boroughLabel(code), group)).sort((a, b) => b.count - a.count);
    // The Montreal feed has no "limited access" type (blocked, trafficLane, trafficLaneAndParkingLane, parkingLane).
    const noteKey = entries.some((entry) => entry.counts.moderate) || !getActiveImpacts().has("moderate") ? null : "stats.boroughNoModerate";
    return card("borough", "stats.boroughTitle", breakdownChart("borough", "stats.boroughTitle", entries, 0, "stats.colBorough"), { noteKey, infoKey: "stats.boroughNote" });
  }

  // --- Public sector ----------------------------------------------------------------

  // The public body the work is done for: the municipality, a public body or a public utility.
  function publicOwner(item) {
    if (item.type === "city" || item.type === "cityContractor") return municipalityLabel(item.closure) || t("stats.notPublished");
    return authorityDetail(item);
  }

  function publicItems(stats) {
    return stats.items.filter((item) => sectorFor(item) === "public");
  }

  function publicOwnerSection(stats) {
    const list = publicItems(stats);
    const merged = countBy(list, (item) => normalizeSearchText(publicOwner(item)));
    const entries = [...merged.values()].map((group) => placeEntry(mostFrequent(group.map(publicOwner)), group)).sort((a, b) => b.count - a.count);
    return card("publicOwner", "stats.publicOwnerTitle", breakdownChart("publicOwner", "stats.publicOwnerTitle", entries, list.length, "stats.colPublicOwner"), { infoKey: "stats.info.publicOwner" });
  }

  // Only the Montreal feed says whether the City works with its own crews or through a contractor.
  function cityModeSection(stats) {
    const montreal = stats.items.filter((item) => item.closure.sourceKind === "montreal-wfs" && (item.type === "city" || item.type === "cityContractor"));
    const counts = { city: montreal.filter((item) => item.type === "city").length, cityContractor: montreal.filter((item) => item.type === "cityContractor").length };
    const types = ["city", "cityContractor"].filter((type) => counts[type]);
    const total = montreal.length;
    const label = (type) => t(`stats.cityMode.${type}`);
    const spec = {
      key: "cityMode",
      type: "doughnut",
      labels: types.map(label),
      values: types.map((type) => counts[type]),
      colors: types.map((type) => AUTHORITY_COLORS[type]),
      height: 200,
      summary: `${t("stats.cityModeTitle")}. ${types.map((type) => `${label(type)} : ${percent(counts[type], total)} (${numberFormat(counts[type])})`).join("; ")}`
    };
    const rows = types.map((type) => [label(type), num(counts[type]), num(counts[type] / total, percent(counts[type], total))]);
    return card("cityMode", "stats.cityModeTitle", chartBlock(spec, ["stats.colMode", "stats.colCount", "stats.colShare"], rows, { sort: [1, -1] }), { infoKey: "stats.info.cityMode" });
  }

  function cityModeBoroughSection(stats) {
    const montreal = stats.items.filter((item) => item.closure.sourceKind === "montreal-wfs" && (item.type === "city" || item.type === "cityContractor"));
    const entries = [...countBy(montreal, (item) => item.closure.borough).entries()]
      .map(([code, group]) => ({ label: boroughLabel(code), count: group.length, city: group.filter((item) => item.type === "city").length, contract: group.filter((item) => item.type === "cityContractor").length }))
      .sort((a, b) => b.count - a.count);
    // Compact: it fills the space beside the public bodies chart; the figures table lists every borough.
    const charted = entries.slice(0, 6);
    const spec = {
      key: "cityModeBorough",
      type: "hbar",
      labels: charted.map((entry) => entry.label),
      totals: charted.map((entry) => entry.count),
      series: [
        { label: t("stats.cityMode.city"), values: charted.map((entry) => entry.city), color: AUTHORITY_COLORS.city },
        { label: t("stats.cityMode.cityContractor"), values: charted.map((entry) => entry.contract), color: AUTHORITY_COLORS.cityContractor }
      ],
      height: Math.max(170, charted.length * 28 + 70),
      summary: `${t("stats.cityModeBoroughTitle")}. ${charted.map((entry) => `${entry.label} : ${percent(entry.contract, entry.count)}`).join("; ")}`
    };
    const rows = entries.map((entry) => [escapeHtml(entry.label), num(entry.count), num(entry.city), num(entry.contract), num(entry.contract / entry.count, percent(entry.contract, entry.count))]);
    return card("cityModeBorough", "stats.cityModeBoroughTitle", chartBlock(spec, ["stats.colBorough", "stats.colTotal", "stats.cityMode.city", "stats.cityMode.cityContractor", "stats.colContractShare"], rows, { sort: [1, -1], shrink: [1] }), { infoKey: "stats.info.cityModeBorough" });
  }

  // Same public / private split as the "On whose behalf" bar, measured side by side.
  function sectorCompareSection(stats) {
    const bySector = { public: [], private: [] };
    stats.items.forEach((item) => bySector[sectorFor(item)]?.push(item));
    const measure = (list) => {
      const days = list.map((item) => plannedDays(item.closure)).filter((value) => value !== null);
      const measured = list.filter((item) => item.length.meters > 0);
      const medianDays = median(days);
      const km = measured.length ? measured.reduce((sum, item) => sum + item.length.meters, 0) / measured.length / 1000 : null;
      return {
        count: num(list.length),
        critical: num(list.length ? list.filter((item) => item.closure.severity === "critical").length / list.length : 0, percent(list.filter((item) => item.closure.severity === "critical").length, list.length)),
        median: medianDays === null ? { html: "—", sort: -1 } : num(medianDays, escapeHtml(tf("stats.compare.days", { n: numberFormat(medianDays, medianDays % 1 ? 1 : 0) }))),
        km: km === null ? { html: "—", sort: -1 } : num(km, `${numberFormat(km, 2)} km`)
      };
    };
    const values = { public: measure(bySector.public), private: measure(bySector.private) };
    const rows = ["count", "critical", "median", "km"].map((key) => [t(`stats.compare.${key}`), values.public[key], values.private[key]]);
    return card("sectorCompare", "stats.sectorCompareTitle", table("sectorCompare", ["stats.colMeasure", "stats.sector.public", "stats.sector.private"], rows), { infoKey: "stats.info.sectorCompare", pair: "right" });
  }

  function publicLongestSection(stats) {
    const sorted = publicItems(stats).map((item) => ({ item, days: plannedDays(item.closure) })).filter((entry) => entry.days !== null).sort((a, b) => b.days - a.days);
    const longest = sorted.slice(0, LONGEST_LIMIT);
    const owners = new Map();
    const rows = longest.map(({ item, days }) => {
      const owner = publicOwner(item);
      owners.set(normalizeSearchText(owner), owner);
      return {
        impact: item.closure.severity,
        filters: { owner: normalizeSearchText(owner) },
        cells: [
          { html: `${impactDot(item.closure.severity)} ${closureCell(item.closure)}`, sort: item.closure.title || "" },
          escapeHtml(owner),
          { html: `${escapeHtml(dateLabel(item.closure.startDate))} → ${escapeHtml(dateLabel(item.closure.endDate))}`, sort: item.closure.endDate },
          num(days, escapeHtml(humanDuration(item.closure.startDate, item.closure.endDate))),
          kmCell([item])
        ]
      };
    });
    const filters = [
      { type: "impact", values: presentImpacts(longest.map((entry) => entry.item.closure)) },
      { type: "select", name: "owner", labelKey: "stats.filterPublicOwner", options: [...owners.entries()].sort((a, b) => a[1].localeCompare(b[1], "fr")) },
      { type: "search" }
    ];
    const limited = sorted.length > LONGEST_LIMIT ? `<p class="stats-note">${tf("stats.longestLimited", { shown: numberFormat(LONGEST_LIMIT), total: numberFormat(sorted.length) })}</p>` : "";
    return card("publicLongest", "stats.publicLongestTitle", limited + table("publicLongest", ["stats.colClosure", "stats.colPublicOwner", "stats.colPeriod", ["stats.colDuration", "stats.info.days"], "stats.colKm"], rows, { sort: [3, -1], widths: ["32%", "18%", "20%", "18%", "12%"], maxRows: 5 }), { infoKey: "stats.info.publicLongest", wide: true, filters });
  }

  // --- One territory: a municipality, or one Montreal borough ------------------------

  const initialParams = new URLSearchParams(window.location.search);
  let territoryMunicipality = initialParams.get("territory") || "";
  let territoryBorough = initialParams.get("borough") || "";

  function territoryOptions(stats) {
    const municipalities = [...countBy(stats.items, (item) => normalizeSearchText(municipalityLabel(item.closure) || "")).entries()]
      .map(([key, list]) => ({ key, label: mostFrequent(list.map((item) => municipalityLabel(item.closure))), count: list.length }))
      .sort((a, b) => a.label.localeCompare(b.label, "fr"));
    const boroughs = [...countBy(stats.items.filter((item) => item.closure.sourceKind === "montreal-wfs"), (item) => item.closure.borough).keys()]
      .map((code) => ({ key: code, label: boroughLabel(code) }))
      .sort((a, b) => a.label.localeCompare(b.label, "fr"));
    return { municipalities, boroughs };
  }

  // The requested territory is kept even while a source is still loading; only the shown one falls back.
  function territoryChoice(options) {
    const largest = [...options.municipalities].sort((a, b) => b.count - a.count)[0];
    const municipality = options.municipalities.some((entry) => entry.key === territoryMunicipality)
      ? territoryMunicipality
      : options.municipalities.find((entry) => entry.key === "montreal")?.key || largest?.key || "";
    const borough = municipality === "montreal" && options.boroughs.some((entry) => entry.key === territoryBorough) ? territoryBorough : "";
    return { municipality, borough };
  }

  function territoryScope(stats) {
    const options = territoryOptions(stats);
    const choice = territoryChoice(options);
    const matches = (closure) => normalizeSearchText(municipalityLabel(closure) || "") === choice.municipality
      && (!choice.borough || (closure.sourceKind === "montreal-wfs" && closure.borough === choice.borough));
    return {
      ...stats,
      options,
      choice,
      items: stats.items.filter((item) => matches(item.closure)),
      starting: stats.starting.filter(matches),
      ending: stats.ending.filter(matches)
    };
  }

  // Shown in the sticky tab dock, like the pothole borough selector, so it stays reachable while scrolling.
  function territoryControls(scoped) {
    const { municipalities, boroughs } = scoped.options;
    const { municipality, borough } = scoped.choice;
    const field = (labelKey, filter, optionsHtml) => `<label class="stats-select"><span>${escapeHtml(t(labelKey))}</span><span class="stats-select-box">${svgIcon(MAP_PIN_ICON)}<select data-filter="${filter}">${optionsHtml}</select>${svgIcon(CHEVRON_ICON)}</span></label>`;
    const municipalitySelect = field("stats.territoryMunicipality", "territory-municipality", municipalities.map((entry) => `<option value="${escapeAttr(entry.key)}"${entry.key === municipality ? " selected" : ""}>${escapeHtml(entry.label)}</option>`).join(""));
    const boroughSelect = municipality === "montreal" && boroughs.length
      ? field("stats.territoryBorough", "territory-borough", `<option value="">${escapeHtml(t("stats.territoryAllMontreal"))}</option>${boroughs.map((entry) => `<option value="${escapeAttr(entry.key)}"${entry.key === borough ? " selected" : ""}>${escapeHtml(entry.label)}</option>`).join("")}`)
      : "";
    const notes = [
      borough ? t("stats.territoryBoroughNote") : "",
      scoped.items.length < 5 ? t("stats.territoryFew") : ""
    ].filter(Boolean).map((text) => `<p class="stats-note">${text}</p>`).join("");
    return `<div class="stats-territory" role="group" aria-label="${escapeAttr(t("stats.territoryPicker"))}"><div class="stats-territory-selects">${municipalitySelect}${boroughSelect}</div>${notes}</div>`;
  }

  function datedItems(stats) {
    return stats.items.map((item) => ({ item, days: plannedDays(item.closure) })).filter((entry) => entry.days !== null);
  }

  function durationSection(stats) {
    const dated = datedItems(stats);
    const medianDays = median(dated.map((entry) => entry.days));
    const buckets = DURATION_BUCKETS.map(([min, max]) => ({
      label: max === Infinity ? tf("stats.durationOver", { n: min - 1 }) : min === max ? tf("stats.durationOne", { n: min }) : tf("stats.durationRange", { min, max }),
      order: min,
      count: dated.filter((entry) => entry.days >= min && entry.days <= max).length
    })).filter((entry) => entry.count);
    const summary = medianDays === null ? "" : `<p class="stats-highlight">${tf(medianDays === 1 ? "stats.durationMedianOne" : "stats.durationMedian", { n: numberFormat(medianDays, medianDays % 1 ? 1 : 0), count: numberFormat(dated.length) })}</p>`;
    const spec = {
      key: "duration",
      type: "vbar",
      labels: buckets.map((entry) => entry.label),
      totals: buckets.map((entry) => entry.count),
      series: [{ label: t("stats.colCount"), values: buckets.map((entry) => entry.count), color: CHART_OTHER_COLOR }],
      height: 260,
      summary: `${t("stats.durationTitle")}. ${buckets.map((entry) => `${entry.label} : ${numberFormat(entry.count)}`).join("; ")}`
    };
    const bucketRows = buckets.map((entry) => [{ html: escapeHtml(entry.label), sort: String(entry.order) }, num(entry.count), num(entry.count / dated.length, percent(entry.count, dated.length))]);
    return card("duration", "stats.durationTitle", `${summary}${chartBlock(spec, ["stats.colDuration", "stats.colCount", "stats.colShare"], bucketRows, { sort: [0, 1] })}`, { infoKey: "stats.durationNote" });
  }

  // Thousands of rows made every refresh slow; the longest ones are what this table is about.
  const LONGEST_LIMIT = 200;

  function longestSection(stats) {
    const sorted = datedItems(stats).sort((a, b) => b.days - a.days);
    const longest = sorted.slice(0, LONGEST_LIMIT);
    const rows = longest.map(({ item, days }) => ({
      impact: item.closure.severity,
      cells: [
        { html: `${impactDot(item.closure.severity)} ${closureCell(item.closure)}`, sort: item.closure.title || "" },
        { html: `${escapeHtml(dateLabel(item.closure.startDate))} → ${escapeHtml(dateLabel(item.closure.endDate))}`, sort: item.closure.endDate },
        num(days, escapeHtml(humanDuration(item.closure.startDate, item.closure.endDate)))
      ]
    }));
    const filters = [{ type: "impact", values: presentImpacts(longest.map((entry) => entry.item.closure)) }, { type: "search" }];
    const limited = sorted.length > LONGEST_LIMIT ? `<p class="stats-note">${tf("stats.longestLimited", { shown: numberFormat(LONGEST_LIMIT), total: numberFormat(sorted.length) })}</p>` : "";
    return card("longest", statsAllDates ? "stats.longestTitleAll" : "stats.longestTitle", limited + table("longest", ["stats.colClosure", "stats.colPeriod", ["stats.colDuration", "stats.info.days"]], rows, { sort: [2, -1], widths: ["45%", "27%", "28%"], maxRows: 5 }), { infoKey: "stats.longestNote", wide: true, filters });
  }

  function lengthSection(stats) {
    const byKind = (kind) => stats.items.filter((item) => item.length.kind === kind);
    const lines = byKind("line");
    const estimated = byKind("estimated");
    const without = stats.items.length - lines.length - estimated.length;
    const km = (list) => list.reduce((sum, item) => sum + item.length.meters, 0) / 1000;
    const rows = [
      [t("stats.lengthMeasured"), num(lines.length), num(km(lines), `${numberFormat(km(lines), 1)} km`)],
      [t("stats.lengthEstimated"), num(estimated.length), num(km(estimated), `${numberFormat(km(estimated), 1)} km`)],
      [t("stats.lengthNone"), num(without), { html: "—", sort: -1 }]
    ];
    return card("length", "stats.lengthTitle", table("length", ["stats.colGeometry", "stats.colCount", "stats.colLength"], rows), { noteKey: "stats.lengthNote" });
  }

  function upcomingSection(stats) {
    const closures = [...stats.starting, ...stats.ending];
    const filters = [
      { type: "impact", values: presentImpacts(closures) },
      { type: "select", name: "source", labelKey: "stats.filterSource", options: sourceOptions(closures) },
      { type: "search" }
    ];
    return card("upcoming", "stats.upcomingTitle", `<div class="stats-split">
      <div><h3>${t("stats.startingTitle")}</h3>
      ${table("starting", ["stats.colClosure", "stats.colStart", "stats.colSource"], closureRows(stats.starting, "startDate"), { sort: [1, 1] })}</div>
      <div><h3>${t("stats.endingTitle")}</h3>
      ${table("ending", ["stats.colClosure", "stats.colEnd", "stats.colSource"], closureRows(stats.ending, "endDate"), { sort: [1, 1] })}</div>
    </div>`, { noteKey: "stats.upcomingIntro", infoKey: "stats.upcomingNote", wide: true, filters });
  }

  // Everything received from each source, whatever the panel filters.
  function sourceSection() {
    const loadedBySource = countBy(allClosures, (closure) => closure.source || closure.sourceKind);
    const catalog = window.SOURCE_CATALOG || [];
    const kinds = new Set();
    const statuses = new Set();
    const rows = [...loadedBySource.entries()]
      .sort((a, b) => b[1].length - a[1].length)
      .map(([source, list]) => {
        const kind = list[0].sourceKind;
        let sourceType = "live";
        let typeLabel = t("stats.sourceLive");
        if (SNAPSHOT_URLS[kind]) {
          sourceType = "snapshot";
          const extractedAt = catalog.find((entry) => entry.url === SNAPSHOT_URLS[kind] && entry.extractedAt)?.extractedAt;
          typeLabel = extractedAt ? tf("stats.sourceSnapshotDate", { date: formatDate(extractedAt) }) : t("stats.sourceSnapshot");
        } else if (CURATED_KINDS.has(kind)) {
          sourceType = "curated";
          typeLabel = t("stats.sourceCurated");
        }
        kinds.add(sourceType);
        // Only a snapshot kept for a finished event can end; live, curated and municipal sources stay active.
        const status = EVENT_SNAPSHOT_KINDS.has(kind) && !list.some((closure) => !hasExpiredToday(closure)) ? "ended" : "active";
        statuses.add(status);
        return {
          filters: { kind: sourceType, status },
          cells: [
            { html: `${escapeHtml(source)}<small>${escapeHtml(typeLabel)}</small>`, sort: source },
            { html: `<span class="stats-badge is-${status}">${escapeHtml(t(`stats.status.${status}`))}</span>`, sort: status },
            ...countCells(list, list.map((closure) => ({ length: lengthInfo(closure.geometry) })))
          ]
        };
      });
    const typeLabels = { live: t("stats.sourceLive"), snapshot: t("stats.sourceSnapshot"), curated: t("stats.sourceCurated") };
    const filters = [
      { type: "select", name: "status", labelKey: "stats.filterStatus", options: ["active", "ended"].filter((status) => statuses.has(status)).map((status) => [status, t(`stats.status.${status}`)]) },
      { type: "select", name: "kind", labelKey: "stats.filterSourceType", options: ["live", "snapshot", "curated"].filter((kind) => kinds.has(kind)).map((kind) => [kind, typeLabels[kind]]) },
      { type: "search" }
    ];
    return card("source", "stats.sourceTitle", table("source", ["stats.colSource", ["stats.colStatus", "stats.info.sourceStatus"], ...countHeaders({ totalInfoKey: "stats.info.received", kmInfoKey: "stats.info.sourceKm" })], rows, { sort: [2, -1] }), { noteKey: "stats.sourceNote", wide: true, filters });
  }


  // --- Charts (same Chart.js styling as the pothole statistics) -------------------

  function loadChartLibrary() {
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

  // At most two lines per bar label: a third line would overlap the next bar (full name in the tooltip and table).
  function wrapLabel(value, width = 21) {
    const pattern = new RegExp(`.{1,${width}}(?:\\s|[-]|$)|.{1,${width}}`, "g");
    const lines = String(value).match(pattern)?.map((part) => part.trim()).filter(Boolean) || [String(value)];
    return lines.length > 2 ? [lines[0], `${lines[1]}…`] : lines;
  }

  function valueLabelsPlugin(spec, font) {
    return {
      id: "statsValues",
      afterDatasetsDraw(chart) {
        const context = chart.ctx;
        context.save();
        context.font = font;
        context.fillStyle = CHART_VALUE_COLOR;
        chart.getDatasetMeta(chart.data.datasets.length - 1).data.forEach((bar, index) => {
          const value = spec.totals[index];
          if (!value) return;
          const label = numberFormat(value);
          if (spec.type === "vbar") {
            context.textAlign = "center";
            context.textBaseline = "bottom";
            context.fillText(label, bar.x, bar.y - 5);
          } else {
            context.textAlign = "left";
            context.textBaseline = "middle";
            context.fillText(label, bar.x + 7, bar.y);
          }
        });
        context.restore();
      }
    };
  }

  function chartConfig(spec, animate) {
    const animation = animate ? { duration: 650, easing: "easeOutCubic" } : false;
    const font = `600 12px ${getComputedStyle(container).fontFamily}`;
    const legend = { position: "bottom", onClick: () => {}, labels: { boxWidth: 12, boxHeight: 12, padding: 14, font: { size: 11 } } };
    // Nested rings (sunburst): datasets[0] is the outer ring in Chart.js.
    if (spec.type === "sunburst") {
      const total = spec.values.reduce((sum, value) => sum + value, 0);
      const ring = (labels, values, colors, weight) => ({ data: values, labelsList: labels, backgroundColor: colors, borderColor: "#fff", borderWidth: 2, hoverOffset: 4, weight });
      const legendItem = (text, fillStyle, bold) => ({ text, fillStyle, strokeStyle: "#fff", lineWidth: 1, hidden: false, fontColor: CHART_VALUE_COLOR, ...(bold ? { font: { weight: "bold" } } : {}) });
      return {
        type: "doughnut",
        data: { labels: spec.labels, datasets: [ring(spec.labels, spec.values, spec.colors, 1.3), ring(spec.innerLabels, spec.innerValues, spec.innerColors, 1)] },
        plugins: [{
          id: "statsRingLabels",
          afterDatasetsDraw(chart) {
            const context = chart.ctx;
            context.save();
            context.font = font;
            context.fillStyle = "#fff";
            context.textAlign = "center";
            context.textBaseline = "middle";
            chart.data.datasets.forEach((dataset, datasetIndex) => {
              chart.getDatasetMeta(datasetIndex).data.forEach((arc, index) => {
                if (!total || dataset.data[index] / total < 0.07) return;
                const position = arc.tooltipPosition();
                context.fillText(percent(dataset.data[index], total), position.x, position.y);
              });
            });
            context.restore();
          }
        }],
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: "22%",
          animation,
          layout: { padding: 0 },
          plugins: {
            legend: {
              ...legend,
              display: !spec.sideLegend,
              labels: {
                ...legend.labels,
                padding: 8,
                generateLabels: () => [
                  ...spec.innerLabels.map((label, index) => legendItem(label, spec.innerColors[index], true)),
                  ...spec.labels.map((label, index) => legendItem(label, spec.colors[index], false))
                ]
              }
            },
            tooltip: { callbacks: { label: (context) => `${context.dataset.labelsList[context.dataIndex]}: ${numberFormat(context.raw)} (${percent(context.raw, total)})` } }
          }
        }
      };
    }
    if (spec.type === "doughnut") {
      const total = spec.values.reduce((sum, value) => sum + value, 0);
      return {
        type: "doughnut",
        data: { labels: spec.labels, datasets: [{ data: spec.values, backgroundColor: spec.colors, borderColor: "#fff", borderWidth: 3, hoverOffset: 5 }] },
        plugins: [{
          id: "statsShareLabels",
          afterDatasetsDraw(chart) {
            const context = chart.ctx;
            context.save();
            context.font = font;
            context.fillStyle = "#fff";
            context.textAlign = "center";
            context.textBaseline = "middle";
            chart.getDatasetMeta(0).data.forEach((arc, index) => {
              if (!total || spec.values[index] / total < 0.06) return;
              const position = arc.tooltipPosition();
              context.fillText(percent(spec.values[index], total), position.x, position.y);
            });
            context.restore();
          }
        }],
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: "60%",
          animation,
          layout: { padding: 8 },
          plugins: {
            legend: {
              ...legend,
              display: !spec.sideLegend,
              onHover: (event, item, legendBox) => highlightArc(legendBox.chart, 0, item.index),
              onLeave: (event, item, legendBox) => highlightArc(legendBox.chart, null)
            },
            tooltip: { callbacks: { label: (context) => `${context.label}: ${percent(context.raw, total)} (${numberFormat(context.raw)})` } }
          }
        }
      };
    }
    const vertical = spec.type === "vbar";
    const valueAxis = { stacked: true, min: 0, grid: { color: CHART_GRID_COLOR }, ticks: { precision: 0, maxTicksLimit: 5, callback: (value) => numberFormat(value) } };
    return {
      type: "bar",
      data: {
        labels: spec.labels,
        datasets: spec.series.map((serie) => ({ label: serie.label, data: serie.values, backgroundColor: serie.color, borderWidth: 0, borderRadius: 2, maxBarThickness: 30 }))
      },
      plugins: [valueLabelsPlugin(spec, font)],
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: vertical ? "x" : "y",
        animation,
        layout: { padding: vertical ? { top: 28, right: 10 } : { top: 4, right: 50 } },
        interaction: { mode: "nearest", intersect: true },
        plugins: {
          legend: { ...legend, display: spec.series.length > 1 },
          tooltip: { callbacks: { label: (context) => `${context.dataset.label}: ${numberFormat(context.raw)}` } }
        },
        scales: vertical
          ? { x: { grid: { display: false }, ticks: { autoSkip: false, maxRotation: 0, font: { size: 11 }, callback(value) { return wrapLabel(this.getLabelForValue(value), 8); } } }, y: { ...valueAxis, grace: "15%" } }
          : { x: valueAxis, y: { stacked: true, grid: { display: false }, ticks: { autoSkip: false, font: { size: 11 }, callback(value) { return wrapLabel(this.getLabelForValue(value)); } } } }
      }
    };
  }

  // Hovering a legend entry pops its slice out, as hovering the slice itself does.
  function highlightArc(chart, datasetIndex, index) {
    if (!chart) return;
    const elements = datasetIndex === null ? [] : [{ datasetIndex, index }];
    const arc = elements.length ? chart.getDatasetMeta(datasetIndex).data[index] : null;
    chart.setActiveElements(elements);
    chart.tooltip.setActiveElements(elements, arc ? arc.tooltipPosition() : { x: 0, y: 0 });
    chart.update();
  }

  function legendChart(entry) {
    const canvas = entry.closest(".stats-chart-side")?.querySelector("canvas");
    return canvas && window.Chart?.getChart(canvas);
  }

  container.addEventListener("pointerover", (event) => {
    const entry = event.target.closest("[data-arc]");
    if (!entry) return;
    const [datasetIndex, index] = entry.dataset.arc.split(":").map(Number);
    highlightArc(legendChart(entry), datasetIndex, index);
  });
  container.addEventListener("pointerout", (event) => {
    const entry = event.target.closest("[data-arc]");
    if (entry && !entry.contains(event.relatedTarget)) highlightArc(legendChart(entry), null);
  });

  function destroyCharts() {
    charts.forEach((chart) => chart.destroy());
    charts = [];
  }

  async function drawCharts() {
    const specs = chartSpecs;
    if (!container.querySelector("canvas[data-chart]")) return;
    let Chart;
    try {
      Chart = await loadChartLibrary();
    } catch {
      chartLibraryFailed = true;
      container.querySelectorAll(".stats-chart").forEach((element) => { element.hidden = true; });
      container.querySelectorAll(".stats-chart-values").forEach((details) => { details.open = true; });
      limitTableRows();
      return;
    }
    if (specs !== chartSpecs) return;
    chartLibraryFailed = false;
    Chart.defaults.font.family = getComputedStyle(container).fontFamily;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    container.querySelectorAll("canvas[data-chart]").forEach((canvas) => {
      const spec = specs[Number(canvas.dataset.chart)];
      const animate = !reducedMotion && !animatedChartKeys.has(spec.key);
      animatedChartKeys.add(spec.key);
      charts.push(new Chart(canvas, chartConfig(spec, animate)));
    });
  }

  // --- Tables: sorting, per-card filters, at most MAX_VISIBLE_ROWS visible rows -----

  // selectedImpacts === null and selects[name] === null mean "everything"; a Set lists the chosen values.
  function filterState(cardKey) {
    if (!cardFilters.has(cardKey)) cardFilters.set(cardKey, { search: "", selectedImpacts: null, selects: {} });
    return cardFilters.get(cardKey);
  }

  function filterActive(state) {
    return Boolean(state && (state.search.trim() || state.selectedImpacts || Object.values(state.selects).some(Boolean)));
  }

  function rowMatches(row, state, words) {
    if (!state) return true;
    if (!words.every((word) => row.dataset.search.includes(word))) return false;
    if (row.dataset.impact && state.selectedImpacts && !state.selectedImpacts.has(row.dataset.impact)) return false;
    return Object.entries(state.selects).every(([name, selected]) => !selected || (row.getAttribute(`data-f-${name}`) || "").split("|").some((value) => selected.has(value)));
  }

  function syncChips(cardElement, state) {
    cardElement.querySelectorAll('[data-filter="impact"]').forEach((chip) => {
      chip.setAttribute("aria-pressed", String(!state?.selectedImpacts || state.selectedImpacts.has(chip.dataset.value)));
    });
  }

  // First click keeps only that type; further clicks add or remove; never leave the list empty.
  function toggleImpact(cardElement, value) {
    const state = filterState(cardElement.dataset.card);
    const all = [...cardElement.querySelectorAll('[data-filter="impact"]')].map((chip) => chip.dataset.value);
    if (!state.selectedImpacts) state.selectedImpacts = new Set([value]);
    else if (state.selectedImpacts.has(value)) {
      if (state.selectedImpacts.size === 1) state.selectedImpacts = null;
      else state.selectedImpacts.delete(value);
    } else {
      state.selectedImpacts.add(value);
      if (all.every((impact) => state.selectedImpacts.has(impact))) state.selectedImpacts = null;
    }
    syncChips(cardElement, state);
  }

  function multiValues(multi) {
    return [...multi.querySelectorAll(".stats-multi-options input")].map((input) => input.value);
  }

  function syncMulti(multi, selected) {
    const options = [...multi.querySelectorAll(".stats-multi-options input")];
    options.forEach((input) => { input.checked = !selected || selected.has(input.value); });
    const allBox = multi.querySelector("[data-multi-all]");
    allBox.checked = !selected;
    allBox.indeterminate = Boolean(selected && selected.size > 0);
    const summary = multi.querySelector(".stats-multi-summary");
    if (!selected) summary.textContent = t("stats.filterAll");
    else if (!selected.size) summary.textContent = t("stats.filterNone");
    else if (selected.size === 1) summary.textContent = options.find((input) => selected.has(input.value))?.nextElementSibling.textContent || "";
    else summary.textContent = tf("stats.filterSelectedCount", { n: selected.size });
    multi.classList.toggle("is-active", Boolean(selected));
  }

  function changeMulti(multi, input) {
    const state = filterState(multi.closest(".stats-card").dataset.card);
    const name = multi.dataset.name;
    const values = multiValues(multi);
    if (input.matches("[data-multi-all]")) {
      state.selects[name] = input.checked ? null : new Set();
    } else {
      const selected = new Set(state.selects[name] ?? values);
      if (input.checked) selected.add(input.value);
      else selected.delete(input.value);
      state.selects[name] = selected.size === values.length ? null : selected;
    }
    syncMulti(multi, state.selects[name]);
  }

  function closeMultis(except = null) {
    container.querySelectorAll(".stats-multi-button[aria-expanded=\"true\"]").forEach((button) => {
      if (button.closest(".stats-multi") === except) return;
      button.setAttribute("aria-expanded", "false");
      button.nextElementSibling.hidden = true;
    });
  }

  function limitTable(wrap) {
    const rows = [...wrap.querySelector("tbody").rows].filter((row) => !row.hidden && !row.classList.contains("stats-no-result"));
    const maxRows = Number(wrap.dataset.maxRows) || MAX_VISIBLE_ROWS;
    const scrollable = rows.length > maxRows;
    const hint = wrap.nextElementSibling;
    const text = tf("stats.scrollHint", { visible: maxRows, total: numberFormat(rows.length) });
    wrap.classList.toggle("is-scrollable", scrollable);
    hint.hidden = !scrollable;
    hint.textContent = scrollable ? text : "";
    if (scrollable) {
      wrap.tabIndex = 0;
      wrap.setAttribute("role", "region");
      wrap.setAttribute("aria-label", text);
    } else {
      wrap.removeAttribute("tabindex");
      wrap.removeAttribute("role");
      wrap.removeAttribute("aria-label");
    }
    wrap.style.maxHeight = "";
    if (!scrollable || !wrap.getClientRects().length) return;
    const table = wrap.querySelector("table");
    const visibleHeight = rows[maxRows - 1].getBoundingClientRect().bottom - table.getBoundingClientRect().top;
    if (visibleHeight > 0) wrap.style.maxHeight = `${Math.ceil(visibleHeight + wrap.offsetHeight - wrap.clientHeight)}px`;
  }

  // The order rows are generated in, declared by table(..., { sort }).
  function currentSort(wrap) {
    if (tableSorts.has(wrap.dataset.table)) return tableSorts.get(wrap.dataset.table);
    return wrap.dataset.defaultCol === undefined ? { column: -1, direction: 0 } : { column: Number(wrap.dataset.defaultCol), direction: Number(wrap.dataset.defaultDir) };
  }

  function applyTable(wrap, state) {
    const body = wrap.querySelector("tbody");
    const noResult = body.querySelector(".stats-no-result");
    const rows = [...body.rows].filter((row) => row !== noResult);
    const words = normalizeSearchText(state?.search || "").split(" ").filter(Boolean);
    let shown = 0;
    const isExpanded = Boolean(wrap.closest(".is-expanded"));
    rows.forEach((row) => {
      const inMode = !row.dataset.only || (row.dataset.only === "expanded") === isExpanded;
      row.hidden = !inMode || !rowMatches(row, state, words);
      if (!row.hidden) shown += 1;
    });
    const sort = currentSort(wrap);
    const collator = new Intl.Collator(currentLanguage() === "en" ? "en-CA" : "fr-CA", { numeric: true, sensitivity: "base" });
    const value = (row) => {
      const cell = row.cells[sort.column];
      return cell ? (cell.dataset.sort ?? cell.textContent.trim()) : "";
    };
    rows.sort((a, b) => {
      if (sort.direction) {
        const left = value(a);
        const right = value(b);
        const numeric = left !== "" && right !== "" && Number.isFinite(Number(left)) && Number.isFinite(Number(right));
        const comparison = numeric ? Number(left) - Number(right) : collator.compare(left, right);
        if (comparison) return sort.direction * comparison;
      }
      return Number(a.dataset.i) - Number(b.dataset.i);
    });
    body.append(...rows, noResult);
    noResult.hidden = shown > 0;
    wrap.querySelectorAll("thead th").forEach((cell, index) => {
      const direction = sort.column === index ? sort.direction : 0;
      const button = cell.querySelector(".stats-sort");
      const column = button.querySelector("span").textContent;
      const action = tf(direction === 1 ? "stats.sortDescending" : "stats.sortAscending", { column });
      cell.setAttribute("aria-sort", direction === 1 ? "ascending" : direction === -1 ? "descending" : "none");
      cell.classList.toggle("is-sorted", direction !== 0);
      button.title = action;
      button.setAttribute("aria-label", action);
      button.querySelector("svg").innerHTML = SORT_ICONS[direction === 1 ? "asc" : direction === -1 ? "desc" : "none"];
    });
    limitTable(wrap);
    return { shown, total: rows.length };
  }

  function applyCard(cardElement) {
    const state = cardFilters.get(cardElement.dataset.card) || null;
    let shown = 0;
    let total = 0;
    cardElement.querySelectorAll(".stats-table-wrap").forEach((wrap) => {
      const result = applyTable(wrap, wrap.closest(".stats-chart-values") ? null : state);
      shown += result.shown;
      total += result.total;
    });
    const count = cardElement.querySelector(".stats-filter-count");
    if (count) count.textContent = filterActive(state) ? tf("stats.filterCount", { shown: numberFormat(shown), total: numberFormat(total) }) : "";
    if (expanded?.card === cardElement) fitExpanded(cardElement);
  }

  // Filter controls are rendered without state so identical data keeps identical HTML.
  function restoreControls() {
    container.querySelectorAll(".stats-card").forEach((cardElement) => {
      const state = cardFilters.get(cardElement.dataset.card);
      if (state) {
        const search = cardElement.querySelector('[data-filter="search"]');
        if (search) search.value = state.search;
        if (state.selectedImpacts) {
          const present = [...cardElement.querySelectorAll('[data-filter="impact"]')].map((chip) => chip.dataset.value);
          state.selectedImpacts = new Set([...state.selectedImpacts].filter((impact) => present.includes(impact)));
          if (!state.selectedImpacts.size || present.every((impact) => state.selectedImpacts.has(impact))) state.selectedImpacts = null;
        }
        syncChips(cardElement, state);
        cardElement.querySelectorAll(".stats-multi").forEach((multi) => {
          const selected = state.selects[multi.dataset.name];
          if (selected) {
            const values = multiValues(multi);
            const kept = new Set([...selected].filter((value) => values.includes(value)));
            // Values that disappeared after a data refresh fall back to "All" rather than an empty table.
            state.selects[multi.dataset.name] = (selected.size && !kept.size) || kept.size === values.length ? null : kept;
          }
          syncMulti(multi, state.selects[multi.dataset.name] ?? null);
        });
      }
      applyCard(cardElement);
    });
  }

  function limitTableRows() {
    container.querySelectorAll(".stats-table-wrap").forEach(limitTable);
    balanceColumns();
    if (expanded) fitExpanded(expanded.card);
  }

  // Side-by-side columns end at the same height: the shorter side's last chart grows (at most +60 %).
  function balanceColumns() {
    container.querySelectorAll(".stats-columns, .stats-pair").forEach((row) => {
      const sides = [...row.children];
      if (sides.length !== 2) return;
      row.querySelectorAll(".stats-chart[data-base-height]").forEach((chart) => { chart.style.height = `${chart.dataset.baseHeight}px`; });
      const heights = sides.map((side) => side.getBoundingClientRect().height);
      const gap = Math.abs(heights[0] - heights[1]);
      const chart = [...sides[heights[0] < heights[1] ? 0 : 1].querySelectorAll(".stats-chart:not([hidden])")].at(-1);
      if (gap < 8 || !chart) return;
      const base = Number(chart.dataset.baseHeight);
      chart.style.height = `${Math.round(base + Math.min(gap, base * 0.6))}px`;
    });
  }

  // --- Enlarged section: the card grows into a large panel over the page -------------

  const EXPAND_MIN_ROWS = 20;
  const EXPAND_ICON = '<path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="m21 3-7 7"/><path d="m3 21 7-7"/>';
  const COLLAPSE_ICON = '<path d="m14 10 7-7"/><path d="M20 10h-6V4"/><path d="m3 21 7-7"/><path d="M4 14h6v6"/>';
  let expanded = null;
  let expandedKey = null;
  let ignoreToggleUntil = 0;

  // Only charts with a figures table and tables much longer than their visible part.
  function addExpandButtons() {
    container.querySelectorAll(".stats-card").forEach((cardElement) => {
      const longest = Math.max(0, ...[...cardElement.querySelectorAll(".stats-table-wrap")]
        .filter((wrap) => !wrap.closest(".stats-chart-values"))
        .map((wrap) => wrap.querySelectorAll("tbody tr:not(.stats-no-result)").length));
      if (!cardElement.querySelector(".stats-chart-values") && longest < EXPAND_MIN_ROWS) return;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "stats-expand";
      cardElement.classList.add("has-expand");
      cardElement.prepend(button);
      syncExpandButton(cardElement, false);
    });
  }

  function syncExpandButton(cardElement, isExpanded) {
    const button = cardElement.querySelector(".stats-expand");
    const label = tf(isExpanded ? "stats.collapse" : "stats.expand", { title: cardElement.querySelector("h2")?.textContent || "" });
    button.innerHTML = svgIcon(isExpanded ? COLLAPSE_ICON : EXPAND_ICON);
    button.title = label;
    button.setAttribute("aria-label", label);
    button.setAttribute("aria-expanded", String(isExpanded));
  }

  // On wide screens the whole panel fits without scrolling: the chart gives up the missing height.
  const CHART_MIN_HEIGHT = 160;

  function fitExpanded(cardElement) {
    cardElement.querySelectorAll(".stats-chart[data-base-height]").forEach((chart) => { chart.style.height = `${chart.dataset.baseHeight}px`; });
    if (!window.matchMedia("(min-width: 881px)").matches) return;
    const overflow = () => cardElement.scrollHeight - cardElement.clientHeight;
    const chart = [...cardElement.querySelectorAll(".stats-chart:not([hidden])")].sort((a, b) => b.offsetHeight - a.offsetHeight)[0];
    // Table-only sections: the tables use all the panel height and scroll inside, header and filters stay put.
    if (!chart) {
      const room = Math.floor(window.innerHeight * 0.92) - cardElement.offsetHeight;
      cardElement.querySelectorAll(".stats-table-wrap.is-scrollable").forEach((wrap) => {
        wrap.style.maxHeight = `${Math.min(wrap.scrollHeight + (wrap.offsetHeight - wrap.clientHeight), wrap.offsetHeight + Math.max(0, room))}px`;
        const hint = wrap.nextElementSibling;
        if (hint?.classList.contains("stats-scroll-hint")) hint.hidden = true;
      });
    }
    if (overflow() > 0 && chart) chart.style.height = `${Math.max(Number(chart.dataset.minHeight) || CHART_MIN_HEIGHT, chart.offsetHeight - overflow())}px`;
    // A tall legend can keep the panel too high: the table then shows fewer rows, still scrolling inside.
    const wrap = [...cardElement.querySelectorAll(".stats-table-wrap.is-scrollable")].sort((a, b) => b.offsetHeight - a.offsetHeight)[0];
    if (overflow() > 0 && wrap) wrap.style.maxHeight = `${Math.max(CHART_MIN_HEIGHT, wrap.offsetHeight - overflow())}px`;
  }

  // FLIP animation: the card is laid out once at its final size, then only a GPU transform is animated.
  function flipFrom(cardElement, from) {
    const to = cardElement.getBoundingClientRect();
    cardElement.style.transformOrigin = "top left";
    cardElement.style.transform = `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${from.width / to.width}, ${from.height / to.height})`;
  }

  // Children's own transitions (hover colours) bubble too: wait for the card's transform only.
  function onTransformEnd(cardElement, callback) {
    const handler = (event) => {
      if (event.target !== cardElement || event.propertyName !== "transform") return;
      cardElement.removeEventListener("transitionend", handler);
      callback();
    };
    cardElement.addEventListener("transitionend", handler);
  }

  function expandCard(cardElement, { animate = true } = {}) {
    if (expanded) collapseCard({ animate: false });
    const rect = cardElement.getBoundingClientRect();
    const placeholder = document.createElement("div");
    placeholder.className = "stats-card-placeholder";
    placeholder.style.height = `${rect.height}px`;
    cardElement.before(placeholder);
    const backdrop = document.createElement("div");
    backdrop.className = "stats-expand-backdrop";
    backdrop.addEventListener("click", () => collapseCard());
    document.body.append(backdrop);
    const details = [...cardElement.querySelectorAll(".stats-chart-values")].map((element) => [element, element.open]);
    ignoreToggleUntil = performance.now() + 500;
    details.forEach(([element]) => { element.open = true; });
    cardElement.classList.add("is-floating", "is-expanded");
    cardElement.setAttribute("role", "dialog");
    cardElement.setAttribute("aria-modal", "true");
    cardElement.setAttribute("aria-label", cardElement.querySelector("h2")?.textContent || "");
    expanded = { card: cardElement, placeholder, backdrop, details };
    expandedKey = cardElement.dataset.card;
    syncExpandButton(cardElement, true);
    applyCard(cardElement);
    fitExpanded(cardElement);
    // Redraw the charts at their final size now, so no chart redraw happens during the animation.
    cardElement.querySelectorAll("canvas").forEach((canvas) => window.Chart?.getChart(canvas)?.resize());
    const smooth = animate && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!smooth) {
      backdrop.classList.add("is-visible");
      return;
    }
    flipFrom(cardElement, rect);
    cardElement.getBoundingClientRect();
    requestAnimationFrame(() => {
      cardElement.classList.add("is-animating");
      cardElement.style.transform = "";
      backdrop.classList.add("is-visible");
      onTransformEnd(cardElement, () => cardElement.classList.remove("is-animating"));
    });
  }

  function collapseCard({ animate = true, restoreFocus = true } = {}) {
    if (!expanded) return;
    const { card: cardElement, placeholder, backdrop, details } = expanded;
    expanded = null;
    expandedKey = null;
    const from = cardElement.getBoundingClientRect();
    // Put the card back in the page first (final layout, charts redrawn), then animate a transform only.
    cardElement.classList.remove("is-floating", "is-expanded", "is-animating");
    ["style", "role", "aria-modal", "aria-label"].forEach((name) => cardElement.removeAttribute(name));
    cardElement.querySelectorAll(".stats-chart[data-base-height]").forEach((chart) => { chart.style.height = `${chart.dataset.baseHeight}px`; });
    placeholder.remove();
    ignoreToggleUntil = performance.now() + 500;
    details.forEach(([element, open]) => { element.open = open; });
    syncExpandButton(cardElement, false);
    if (cardElement.isConnected) applyCard(cardElement);
    limitTableRows();
    cardElement.querySelectorAll("canvas").forEach((canvas) => window.Chart?.getChart(canvas)?.resize());
    const done = () => {
      cardElement.classList.remove("is-landing", "is-animating");
      cardElement.removeAttribute("style");
      backdrop.remove();
    };
    if (restoreFocus && cardElement.isConnected) cardElement.querySelector(".stats-expand")?.focus({ preventScroll: true });
    if (!animate || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !cardElement.isConnected) {
      done();
      return;
    }
    cardElement.classList.add("is-landing");
    flipFrom(cardElement, from);
    cardElement.getBoundingClientRect();
    requestAnimationFrame(() => {
      cardElement.classList.add("is-animating");
      cardElement.style.transform = "";
      backdrop.classList.remove("is-visible");
      let finished = false;
      const once = () => { if (!finished) { finished = true; done(); } };
      onTransformEnd(cardElement, once);
      setTimeout(once, 450);
    });
  }

  // Escape closes the panel (after an open bubble or dropdown); Tab stays inside it.
  document.addEventListener("keydown", (event) => {
    if (!expanded) return;
    if (event.key === "Escape" && !openInfoButton && !expanded.card.querySelector('.stats-multi-button[aria-expanded="true"]')) {
      collapseCard();
      return;
    }
    if (event.key !== "Tab") return;
    const focusables = [...expanded.card.querySelectorAll("button, a[href], input, select, summary, [tabindex='0']")].filter((element) => element.getClientRects().length && !element.disabled);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables.at(-1);
    if (event.shiftKey && (document.activeElement === first || !expanded.card.contains(document.activeElement))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (document.activeElement === last || !expanded.card.contains(document.activeElement))) {
      event.preventDefault();
      first.focus();
    }
  }, true);

  container.addEventListener("click", (event) => {
    const expandButton = event.target.closest(".stats-expand");
    if (expandButton) {
      const cardElement = expandButton.closest(".stats-card");
      if (expanded?.card === cardElement) collapseCard();
      else expandCard(cardElement);
      return;
    }
    const multiButton = event.target.closest(".stats-multi-button");
    if (multiButton) {
      const multi = multiButton.closest(".stats-multi");
      const open = multiButton.getAttribute("aria-expanded") !== "true";
      closeMultis(multi);
      multiButton.setAttribute("aria-expanded", String(open));
      multiButton.nextElementSibling.hidden = !open;
      return;
    }
    const sortButton = event.target.closest(".stats-sort");
    if (sortButton) {
      const wrap = sortButton.closest(".stats-table-wrap");
      const column = Number(sortButton.dataset.col);
      const current = currentSort(wrap);
      tableSorts.set(wrap.dataset.table, { column, direction: current.column === column ? -current.direction || 1 : 1 });
      applyCard(wrap.closest(".stats-card"));
      return;
    }
    const segment = event.target.closest('[data-filter="authority-group"]');
    if (segment) {
      authorityGroup = segment.dataset.value === "all" ? null : segment.dataset.value;
      render();
      return;
    }
    const chip = event.target.closest('[data-filter="impact"]');
    if (chip) {
      const cardElement = chip.closest(".stats-card");
      toggleImpact(cardElement, chip.dataset.value);
      applyCard(cardElement);
      return;
    }
    const info = event.target.closest(".stats-info");
    if (info) {
      event.stopPropagation();
      if (openInfoButton === info && !infoOpenedByHover) closeInfo();
      else openInfo(info, { moveFocus: true });
      return;
    }
    const tab = event.target.closest("[data-stats-tab]");
    if (tab && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
      event.preventDefault();
      if (tab.dataset.statsTab !== activeTab) {
        activeTab = tab.dataset.statsTab;
        resetScroll = true;
        syncUrl(true);
        render();
      }
    }
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".stats-multi")) closeMultis();
  });

  container.addEventListener("keydown", (event) => {
    const multi = event.target.closest(".stats-multi");
    if (event.key === "Escape" && multi && !multi.querySelector(".stats-multi-panel").hidden) {
      event.stopPropagation();
      closeMultis();
      multi.querySelector(".stats-multi-button").focus();
    }
  });

  container.addEventListener("input", (event) => {
    const optionSearch = event.target.closest(".stats-multi-search");
    if (optionSearch) {
      const words = normalizeSearchText(optionSearch.value).split(" ").filter(Boolean);
      optionSearch.closest(".stats-multi").querySelectorAll(".stats-multi-options label").forEach((label) => {
        label.hidden = !words.every((word) => label.dataset.search.includes(word));
      });
      return;
    }
    const input = event.target.closest('[data-filter="search"]');
    if (!input) return;
    const cardElement = input.closest(".stats-card");
    filterState(cardElement.dataset.card).search = input.value;
    applyCard(cardElement);
  });

  container.addEventListener("change", (event) => {
    if (event.target.matches('[data-filter="age-ongoing"]')) {
      ageOngoingOnly = event.target.checked;
      render();
      return;
    }
    if (event.target.matches('[data-filter="territory-municipality"], [data-filter="territory-borough"]')) {
      if (event.target.dataset.filter === "territory-municipality") {
        territoryMunicipality = event.target.value;
        territoryBorough = "";
      } else {
        territoryBorough = event.target.value;
      }
      resetScroll = false;
      render();
      return;
    }
    const multi = event.target.closest(".stats-multi");
    if (!multi || event.target.type !== "checkbox") return;
    changeMulti(multi, event.target);
    applyCard(multi.closest(".stats-card"));
  });

  function focusedControl() {
    const active = document.activeElement;
    if (!active || !container.contains(active)) return null;
    if (active.dataset.statsTab) return { card: null, selector: `[data-stats-tab="${active.dataset.statsTab}"]`, caret: null };
    const multi = active.closest(".stats-multi");
    if (multi) return { card: active.closest(".stats-card")?.dataset.card, selector: `.stats-multi[data-name="${multi.dataset.name}"] .stats-multi-button`, caret: null };
    if (!active.dataset.filter) return null;
    return {
      card: active.closest(".stats-card")?.dataset.card,
      selector: active.dataset.filter === "search" || active.tagName === "SELECT" ? `[data-filter="${active.dataset.filter}"]` : `[data-filter="${active.dataset.filter}"][data-value="${active.dataset.value}"]`,
      caret: active.selectionStart ?? null
    };
  }

  // --- Information bubbles ("i") ---------------------------------------------------

  // Fixed-position bubble outside the scrolling tables so it is never clipped.
  const infoPopover = document.createElement("div");
  infoPopover.className = "help-bubble stats-popover";
  infoPopover.setAttribute("role", "dialog");
  infoPopover.tabIndex = -1;
  infoPopover.hidden = true;
  document.body.append(infoPopover);
  let openInfoButton = null;
  let infoOpenedByHover = false;
  let infoCloseTimer = null;
  const hoverPointer = window.matchMedia("(hover: hover) and (pointer: fine)");

  function closeInfo({ restoreFocus = false } = {}) {
    clearTimeout(infoCloseTimer);
    if (!openInfoButton) return;
    const button = openInfoButton;
    openInfoButton = null;
    infoOpenedByHover = false;
    infoPopover.hidden = true;
    button.setAttribute("aria-expanded", "false");
    if (restoreFocus && button.isConnected) button.focus();
  }

  // Shown above the button like a usual tooltip, below only when there is no room above.
  function openInfo(button, { moveFocus = false, byHover = false } = {}) {
    clearTimeout(infoCloseTimer);
    if (openInfoButton !== button) {
      closeInfo();
      openInfoButton = button;
      infoPopover.setAttribute("aria-label", button.getAttribute("aria-label"));
      infoPopover.innerHTML = `<p>${t(button.dataset.info)}</p>`;
      infoPopover.hidden = false;
      const rect = button.getBoundingClientRect();
      const width = Math.min(340, window.innerWidth - 24);
      infoPopover.style.width = `${width}px`;
      infoPopover.style.left = `${Math.max(12, Math.min(rect.left + rect.width / 2 - width / 2, window.innerWidth - width - 12))}px`;
      const height = infoPopover.offsetHeight;
      const above = rect.top - height - 8;
      infoPopover.style.top = `${above >= 12 ? above : Math.min(rect.bottom + 8, window.innerHeight - height - 12)}px`;
      button.setAttribute("aria-expanded", "true");
    }
    infoOpenedByHover = byHover;
    if (moveFocus) infoPopover.focus({ preventScroll: true });
  }

  function scheduleHoverClose() {
    if (!infoOpenedByHover) return;
    clearTimeout(infoCloseTimer);
    infoCloseTimer = setTimeout(() => closeInfo(), 180);
  }

  container.addEventListener("pointerover", (event) => {
    const button = event.target.closest(".stats-info");
    if (!button || !hoverPointer.matches || event.pointerType !== "mouse") return;
    if (openInfoButton && openInfoButton !== button && !infoOpenedByHover) return;
    openInfo(button, { byHover: openInfoButton !== button || infoOpenedByHover });
  });
  container.addEventListener("pointerout", (event) => {
    const button = event.target.closest(".stats-info");
    if (button && button === openInfoButton && !infoPopover.contains(event.relatedTarget)) scheduleHoverClose();
  });
  infoPopover.addEventListener("pointerenter", () => clearTimeout(infoCloseTimer));
  infoPopover.addEventListener("pointerleave", scheduleHoverClose);

  document.addEventListener("click", (event) => {
    if (openInfoButton && !infoPopover.contains(event.target) && !event.target.closest(".stats-info")) closeInfo();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && openInfoButton) closeInfo({ restoreFocus: true });
  });
  container.addEventListener("scroll", () => closeInfo(), { passive: true });

  // --- Tabs and independent columns ------------------------------------------------

  function tabsHtml(stats) {
    return `<div class="stats-dock"><nav class="map-mode-nav stats-tabs" aria-label="${escapeAttr(t("stats.tabsLabel"))}">${TABS.map((tab) => {
      const url = new URL(window.location.href);
      url.searchParams.set("view", "stats");
      if (tab === "general") url.searchParams.delete("tab");
      else url.searchParams.set("tab", tab);
      return `<a href="${escapeAttr(url.pathname + url.search)}" data-stats-tab="${tab}"${tab === activeTab ? ' aria-current="page"' : ""}>${escapeHtml(t(`stats.tab.${tab}`))}</a>`;
    }).join("")}</nav>${activeTab === "territory" ? territoryControls(stats) : ""}<p class="stats-live-note">${t("stats.liveOnly")}</p></div>`;
  }

  function howSection() {
    const groups = HOW_GROUPS.map(([group, questions]) => `<section class="stats-how-group" aria-labelledby="stats-how-${group}">
      <h3 id="stats-how-${group}">${t(`stats.how.group.${group}`)}</h3>
      ${questions.map((key) => `<details><summary>${t(`stats.how.q.${key}`)}</summary><div class="stats-how-answer">${t(`stats.how.a.${key}`)}</div></details>`).join("")}
    </section>`).join("");
    return card("how", "stats.how.title", `<div class="stats-how"><p class="stats-how-intro">${t("stats.how.intro")}</p>${groups}</div>`, { wide: true });
  }

  function tabSections(stats) {
    switch (activeTab) {
      case "roads":
        return [roadKindSection(stats), routeSection(stats), routeDirectionSection(stats), upperClosuresSection(stats)];
      case "private":
        return [sectorSection(stats), publicOwnerSection(stats), cityModeSection(stats), cityModeBoroughSection(stats), publicLongestSection(stats), authoritySection(stats), mandateSection(stats), sectorCompareSection(stats), companySection(stats)];
      case "territory":
        return [impactSection(stats, { row: "3" }), roadKindSection(stats, { row: "3" }), ageSection(stats, { row: "3" }), sectorSection(stats), streetSection(stats), longestSection(stats), upcomingSection(stats)];
      case "places":
        return [municipalitySection(stats), boroughSection(stats), streetSection(stats)];
      case "how":
        return [howSection()];
      default:
        return [impactSection(stats), durationSection(stats), lengthSection(stats), ageSection(stats), longestSection(stats), upcomingSection(stats), sourceSection(stats)];
    }
  }

  let twoColumnLayout = null;
  let lastLayoutSignature = "";

  function layoutSignature(grid) {
    return `${grid.clientWidth >= TWO_COLUMN_MIN_WIDTH}|${grid.clientWidth >= ROUTE_STACK_BELOW}`;
  }

  // Each card goes under the shorter column, so a short card never leaves a gap beside a tall one.
  function layoutColumns() {
    const grid = container.querySelector(".stats-grid");
    if (!grid) return;
    const cards = [...grid.querySelectorAll(".stats-card")].sort((a, b) => Number(a.dataset.order) - Number(b.dataset.order));
    grid.replaceChildren();
    twoColumnLayout = grid.clientWidth >= TWO_COLUMN_MIN_WIDTH;
    lastLayoutSignature = layoutSignature(grid);
    let columns = null;
    let pairRow = null;
    let rowGroup = null;
    cards.forEach((cardElement) => {
      if (twoColumnLayout && cardElement.dataset.row === "3") {
        if (!rowGroup || rowGroup.children.length >= 3) {
          rowGroup = document.createElement("div");
          rowGroup.className = "stats-row3";
          grid.append(rowGroup);
        }
        rowGroup.append(cardElement);
        columns = null;
        return;
      }
      rowGroup = null;
      if (twoColumnLayout && cardElement.dataset.pair === "left") {
        pairRow = document.createElement("div");
        pairRow.className = "stats-pair";
        const rightColumn = document.createElement("div");
        rightColumn.className = "stats-col";
        pairRow.append(cardElement, rightColumn);
        grid.append(pairRow);
        columns = null;
        return;
      }
      // Every following "right" card stacks in the narrow column beside the left one.
      if (twoColumnLayout && cardElement.dataset.pair === "right" && pairRow) {
        pairRow.lastElementChild.append(cardElement);
        return;
      }
      pairRow = null;
      if (!twoColumnLayout || cardElement.classList.contains("is-wide") || grid.clientWidth < Number(cardElement.dataset.stackBelow || 0)) {
        grid.append(cardElement);
        columns = null;
        return;
      }
      if (!columns) {
        const group = document.createElement("div");
        group.className = "stats-columns";
        columns = [document.createElement("div"), document.createElement("div")];
        columns.forEach((column) => { column.className = "stats-col"; group.append(column); });
        grid.append(group);
      }
      (columns[0].offsetHeight <= columns[1].offsetHeight ? columns[0] : columns[1]).append(cardElement);
    });
  }

  // Centred in the statistics area, like the map's loading popup is centred on the map.
  function positionLoading() {
    const popup = container.querySelector(".stats-loading");
    if (!popup) return;
    const rect = container.getBoundingClientRect();
    popup.style.left = `${rect.left + rect.width / 2}px`;
    popup.style.top = `${rect.top + rect.height / 2}px`;
  }

  // While sources keep arriving, rebuilding every table and chart for each one only slows the page down.
  const LOADING_RENDER_GAP = 700;
  let lastLoadingRender = 0;
  let loadingRenderTimer = null;

  function render() {
    if (!statsViewActive) return;
    const loadingNow = !mapStatus || !["ready", "error"].includes(mapStatus.dataset.mode);
    clearTimeout(loadingRenderTimer);
    if (loadingNow && lastHtml && performance.now() - lastLoadingRender < LOADING_RENDER_GAP) {
      loadingRenderTimer = setTimeout(render, LOADING_RENDER_GAP);
      return;
    }
    if (loadingNow) lastLoadingRender = performance.now();
    if (renderQueued) return;
    renderQueued = true;
    requestAnimationFrame(() => {
      renderQueued = false;
      if (!statsViewActive) return;
      const stats = activeTab === "territory" ? territoryScope(computeStats()) : computeStats();
      if (activeTab === "territory") syncUrl(true);
      chartSpecs = [];
      multiSelectCount = 0;
      const loading = !["ready", "error"].includes(mapStatus.dataset.mode);
      // The explanation tab does not depend on the data: stable HTML keeps opened questions open while feeds load.
      const isHow = activeTab === "how";
      const html = `<div class="stats-inner">
        ${loading && !isHow ? `<div class="map-status stats-loading" role="status" data-mode="loading">${escapeHtml(t("map.loading"))}</div>` : ""}
        ${tabsHtml(stats)}
        <header class="stats-header">
          <p class="eyebrow">${t("map.region")}</p>
          <div class="stats-title-row"><h1>${t("stats.title")} \u2014 ${escapeHtml(t(`stats.tab.${activeTab}`))}</h1>${activeTab === "roads" ? infoButton("stats.info.roadTypes", t("stats.tab.roads")) : ""}</div>
          ${isHow ? "" : `<p class="stats-scope">${escapeHtml(periodLabel(stats.range))}</p>
          ${statusHtml()}`}
        </header>
        ${activeTab === "general" ? `<p class="stats-disclaimer">${t("stats.disclaimer")}</p>${kpis(stats)}` : ""}
        ${activeTab === "roads" ? roadsKpis(stats) : ""}
        ${activeTab === "territory" ? kpis(stats) : ""}
        <div class="stats-grid">${tabSections(stats).join("")}</div>
      </div>`;
      // The periodic 30 s refresh usually yields identical output: keep charts, filters and scroll.
      if (html === lastHtml) return;
      lastHtml = html;
      // A data refresh replaces an open bubble's button: return focus to its new copy.
      const focus = openInfoButton
        ? { card: openInfoButton.closest(".stats-card")?.dataset.card || null, selector: `.stats-info[data-info="${openInfoButton.dataset.info}"]`, caret: null }
        : focusedControl();
      closeInfo();
      const scrollTop = resetScroll ? 0 : container.scrollTop;
      resetScroll = false;
      destroyCharts();
      // A data refresh or a filter inside the enlarged panel rebuilds the card: reopen it without animation.
      const reopenKey = expandedKey;
      if (expanded) collapseCard({ animate: false, restoreFocus: false });
      container.innerHTML = html;
      container.querySelectorAll(".stats-card").forEach((cardElement, index) => { cardElement.dataset.order = String(index); });
      restoreControls();
      layoutColumns();
      addExpandButtons();
      balanceColumns();
      positionLoading();
      container.scrollTop = scrollTop;
      const reopened = reopenKey && container.querySelector(`.stats-card[data-card="${reopenKey}"].has-expand`);
      if (reopened) expandCard(reopened, { animate: false });
      if (focus) {
        const control = container.querySelector(focus.card ? `[data-card="${focus.card}"] ${focus.selector}` : focus.selector);
        control?.focus({ preventScroll: true });
        if (focus.caret !== null) control?.setSelectionRange?.(focus.caret, focus.caret);
      }
      drawCharts();
    });
  }

  let resizeQueued = false;
  window.addEventListener("resize", () => {
    if (!statsViewActive || resizeQueued) return;
    resizeQueued = true;
    requestAnimationFrame(() => {
      resizeQueued = false;
      closeInfo();
      const grid = container.querySelector(".stats-grid");
      if (grid && layoutSignature(grid) !== lastLayoutSignature) {
        const reopenKey = expandedKey;
        if (expanded) collapseCard({ animate: false, restoreFocus: false });
        layoutColumns();
        const reopened = reopenKey && container.querySelector(`.stats-card[data-card="${reopenKey}"]`);
        if (reopened) expandCard(reopened, { animate: false });
      }
      positionLoading();
      limitTableRows();
      if (expanded) fitExpanded(expanded.card);
    });
  });
  // "toggle" does not bubble; a capture listener still sees the figures tables being opened.
  // The enlarge animation opens them itself and has already sized its tables: skip that relayout.
  container.addEventListener("toggle", () => {
    if (performance.now() < ignoreToggleUntil) return;
    limitTableRows();
  }, true);

  // --- View switching -------------------------------------------------------------

  function syncUrl(active) {
    const url = new URL(window.location.href);
    if (active) url.searchParams.set("view", "stats");
    else url.searchParams.delete("view");
    if (active && activeTab !== "general") url.searchParams.set("tab", activeTab);
    else url.searchParams.delete("tab");
    if (active && statsAllDates) url.searchParams.set("dates", "all");
    else url.searchParams.delete("dates");
    if (active && activeTab === "territory" && territoryMunicipality) url.searchParams.set("territory", territoryMunicipality);
    else url.searchParams.delete("territory");
    if (active && activeTab === "territory" && territoryBorough) url.searchParams.set("borough", territoryBorough);
    else url.searchParams.delete("borough");
    window.history.replaceState(window.history.state, "", url);
  }

  // "Period" (default) keeps what is active in the date range, as the map does; "all" ignores the dates.
  const dateModeInputs = [...document.querySelectorAll('input[name="statsDateMode"]')];

  function syncDateMode() {
    dateModeInputs.forEach((input) => { input.checked = input.value === (statsAllDates ? "all" : "period"); });
    document.body.classList.toggle("stats-dates-all", statsAllDates);
  }

  dateModeInputs.forEach((input) => input.addEventListener("change", () => {
    if (!input.checked) return;
    statsAllDates = input.value === "all";
    syncDateMode();
    if (!statsViewActive) return;
    syncUrl(true);
    updateView({ fit: false });
  }));

  statsAllDates = new URLSearchParams(window.location.search).get("dates") === "all";
  syncDateMode();

  // Panel "i" of the period choice: opens on mouse hover, toggles on click/tap, closes outside or with Escape.
  const dateModeHelp = document.querySelector("#dateModeHelp");
  const dateModeHelpBubble = document.querySelector("#dateModeHelpBubble");
  let dateModeHelpPinned = false;

  function showDateModeHelp(show, pinned = false) {
    dateModeHelpPinned = show && pinned;
    dateModeHelpBubble.hidden = !show;
    dateModeHelp.setAttribute("aria-expanded", String(show));
  }

  if (dateModeHelp && dateModeHelpBubble) {
    dateModeHelp.addEventListener("click", () => showDateModeHelp(!dateModeHelpPinned, true));
    dateModeHelp.addEventListener("pointerenter", (event) => {
      if (event.pointerType === "mouse" && dateModeHelpBubble.hidden) showDateModeHelp(true);
    });
    dateModeHelp.addEventListener("pointerleave", (event) => {
      if (event.pointerType === "mouse" && !dateModeHelpPinned) showDateModeHelp(false);
    });
    document.addEventListener("click", (event) => {
      if (!dateModeHelp.contains(event.target) && !dateModeHelpBubble.contains(event.target)) showDateModeHelp(false);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !dateModeHelpBubble.hidden) {
        showDateModeHelp(false);
        dateModeHelp.focus();
      }
    });
  }

  // Only Dates, Time of work and Impact types stay in the panel in this view: open them on desktop.
  let panelSectionsBeforeStats = null;

  function syncPanelSections(active) {
    const sections = [...document.querySelectorAll("#sidePanel .controls > details.filter-section:not(.map-only)")];
    if (active && !panelSectionsBeforeStats && window.matchMedia("(min-width: 881px)").matches) {
      panelSectionsBeforeStats = sections.map((section) => section.open);
      sections.forEach((section) => { section.open = true; });
    } else if (!active && panelSectionsBeforeStats) {
      sections.forEach((section, index) => { section.open = panelSectionsBeforeStats[index]; });
      panelSectionsBeforeStats = null;
    }
  }

  function setStatsView(active, { updateUrl = true } = {}) {
    statsViewActive = active;
    // Fetch the chart library while the data sources are still loading.
    if (active) loadChartLibrary().catch(() => {});
    closeInfo();
    syncPanelSections(active);
    document.body.classList.toggle("view-stats", active);
    container.hidden = !active;
    autoLink?.toggleAttribute("aria-current", !active);
    if (!active) autoLink?.setAttribute("aria-current", "page");
    statsLink?.toggleAttribute("aria-current", active);
    if (active) statsLink?.setAttribute("aria-current", "page");
    document.body.dataset.documentTitle = active ? "stats.documentTitle" : "document.mapTitle";
    document.title = t(document.body.dataset.documentTitle);
    if (updateUrl) syncUrl(active);
    if (window.matchMedia("(max-width: 880px)").matches) setMobileMenuOpen(false);
    if (!active) map.invalidateSize(true);
    updateView({ fit: false });
    if (active) container.scrollTop = 0;
  }

  function isPlainClick(event) {
    return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
  }

  statsLink?.addEventListener("click", (event) => {
    if (!isPlainClick(event)) return;
    event.preventDefault();
    if (!statsViewActive) setStatsView(true);
  });

  autoLink?.addEventListener("click", (event) => {
    if (!statsViewActive || !isPlainClick(event)) return;
    event.preventDefault();
    setStatsView(false);
  });

  window.addEventListener("languagechange", () => {
    if (!statsViewActive) return;
    syncUrl(true);
    document.title = t("stats.documentTitle");
    render();
  });

  window.STATS_VIEW = { render };

  if (new URLSearchParams(window.location.search).get("view") === "stats") {
    setStatsView(true, { updateUrl: false });
  }
})();
