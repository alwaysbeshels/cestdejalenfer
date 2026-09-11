import { writeFile } from "node:fs/promises";

const ENDPOINT = "https://jacquescartierchamplain.ca/fr/structures/archive-des-avis-de-travaux-et-chantiers/";
const BONAVENTURE_MAP_URL = "https://jacquescartierchamplain.ca/fr/circulation-routiere/secteur-bonaventure/";
const OUTPUT = "data/pjcci-work-advisories-snapshot.json";
const PAGE_SIZE = 10;

const HONORE_MERCIER_WAYS = [567465771];
const VERIFIED_PJCCI_WAYS = {
  "pont-clement": [700832388, 39180620, 677782935, 567717682],
  "gaetan-laberge-vers-sud": [1164875653, 1417416796, 429919712, 1074363189, 1074363198, 1074363830],
  "gaetan-laberge-vers-centre-ville": [1164875653, 1417416796, 429919712, 1074363189, 1074363198, 1074363830],
  "voies-victoria-clement-vers-sud": [1173070237, 1166103970, 111771062],
  "voies-victoria-clement-vers-centre-ville": [1173070237, 1166103970, 111771062],
  "sortie-3-vers-sud": [23027179]
};

function routeEndpoints(notice) {
  return null;
}

function bonaventureSegments(notice) {
  const base = {
    ...notice,
    segmentGeometryNote: "Tracé indicatif du secteur; l'avis PJCCI décrit des configurations de voies et non une fermeture complète de toute la ligne.",
    analysis: {
      sections: [],
      bullets: [],
      sourceText: decodeHtml(notice.description).replace(/\s+/g, " ").trim()
    }
  };
  return [
    {
      ...base,
      segmentId: "pont-clement",
      segmentTitle: "Pont Clément - voies réduites par direction",
      segmentStreets: "Secteur du pont Clément",
      segmentImpact: "Du 3 au 15 mars: 1 voie sur 2 ouverte par direction. Du 15 mars jusqu'à l'automne 2026: 2 voies ouvertes vers le pont Samuel-De Champlain et 1 voie sur 2 ouverte vers le centre-ville.",
      segmentDirection: "Deux directions concernées; les voies restantes demeurent ouvertes.",
      segmentDateStart: "2026-03-03",
      segmentDateEnd: "2026-10-31",
      segmentDateText: "Du 3 mars à l'automne 2026 (dates de fin exactes non publiées).",
      analysis: { ...base.analysis, sections: ["Secteur du pont Clément"], bullets: ["1 voie sur 2 ouverte par direction", "2 voies ouvertes vers le pont Samuel-De Champlain", "1 voie sur 2 ouverte vers le centre-ville"] },
      segmentEndpoints: [[-73.561, 45.478], [-73.548, 45.493]]
    },
    {
      ...base,
      segmentId: "voies-surelevees-vers-sud",
      segmentTitle: "Voies surélevées - vers le pont Samuel-De Champlain",
      segmentStreets: "Voies surélevées, entre le pont Victoria et la rue Wellington",
      segmentImpact: "2 voies sur 3 ouvertes par direction; une voie est retranchée dans cette direction.",
      segmentDirection: "Vers le pont Samuel-De Champlain.",
      segmentDateStart: "2026-03-06",
      segmentDateEnd: "2026-05-31",
      segmentDateText: "Du 6 mars jusqu'à mai 2026 (date exacte de fin non publiée).",
      analysis: { ...base.analysis, sections: ["Secteur des voies surélevées"], bullets: ["2 voies sur 3 ouvertes dans cette direction"] },
      segmentEndpoints: [[-73.562, 45.478], [-73.55, 45.49]]
    },
    {
      ...base,
      segmentId: "voies-surelevees-vers-centre-ville",
      segmentTitle: "Voies surélevées - vers le centre-ville",
      segmentStreets: "Voies surélevées, entre le pont Victoria et la rue Wellington",
      segmentImpact: "2 voies sur 3 ouvertes par direction; une voie est retranchée dans cette direction.",
      segmentDirection: "Vers le centre-ville.",
      segmentDateStart: "2026-03-06",
      segmentDateEnd: "2026-05-31",
      segmentDateText: "Du 6 mars jusqu'à mai 2026 (date exacte de fin non publiée).",
      analysis: { ...base.analysis, sections: ["Secteur des voies surélevées"], bullets: ["2 voies sur 3 ouvertes dans cette direction"] },
      segmentEndpoints: [[-73.55, 45.49], [-73.562, 45.478]]
    },
    {
      ...base,
      segmentId: "sortie-3-vers-sud",
      segmentTitle: "Sortie 3 - fermeture vers le pont Samuel-De Champlain",
      segmentStreets: "Sortie 3 de l'autoroute Bonaventure",
      segmentImpact: "Fermeture de la sortie 3 de l'autoroute en direction du pont Samuel-De Champlain.",
      segmentDirection: "Vers le pont Samuel-De Champlain.",
      segmentDateStart: "2026-01-01",
      segmentDateEnd: "2026-12-31",
      segmentDateText: "Entrave de longue durée pendant l'année 2026.",
      analysis: { ...base.analysis, sections: ["Secteur des voies surélevées"], bullets: ["Fermeture de la sortie 3 en direction du pont Samuel-De Champlain"] },
      segmentPoint: null,
      noGeometry: true,
      segmentGeometryNote: "La position est chargée depuis la carte interactive PJCCI; aucune coordonnée de remplacement n'est inventee."
    },
    {
      ...base,
      segmentId: "gaetan-laberge-vers-sud",
      segmentTitle: "Boulevard Gaétan-Laberge - vers le pont Samuel-De Champlain",
      segmentStreets: "Boulevard Gaétan-Laberge",
      segmentImpact: "1 voie sur 2 ouverte par direction; une voie est retranchée dans cette direction.",
      segmentDirection: "Vers le pont Samuel-De Champlain.",
      segmentDateStart: "2026-01-01",
      segmentDateEnd: "2026-12-31",
      segmentDateText: "Entrave de longue durée pendant l'année 2026.",
      analysis: { ...base.analysis, sections: ["Secteur du boulevard Gaétan-Laberge"], bullets: ["1 voie sur 2 ouverte dans cette direction"] },
      segmentEndpoints: [[-73.562, 45.466], [-73.541, 45.49]]
    },
    {
      ...base,
      segmentId: "gaetan-laberge-vers-centre-ville",
      segmentTitle: "Boulevard Gaétan-Laberge - vers le centre-ville",
      segmentStreets: "Boulevard Gaétan-Laberge",
      segmentImpact: "1 voie sur 2 ouverte par direction; une voie est retranchée dans cette direction.",
      segmentDirection: "Vers le centre-ville.",
      segmentDateStart: "2026-01-01",
      segmentDateEnd: "2026-12-31",
      segmentDateText: "Entrave de longue durée pendant l'année 2026.",
      analysis: { ...base.analysis, sections: ["Secteur du boulevard Gaétan-Laberge"], bullets: ["1 voie sur 2 ouverte dans cette direction"] },
      segmentEndpoints: [[-73.541, 45.49], [-73.562, 45.466]]
    },
    {
      ...base,
      segmentId: "voies-victoria-clement-vers-sud",
      segmentTitle: "Voies entre les ponts Victoria et Clément - vers le pont Samuel-De Champlain",
      segmentStreets: "Voies entre le pont Victoria et le pont Clément",
      segmentImpact: "2 voies sur 3 ouvertes en direction du pont Samuel-De Champlain.",
      segmentDirection: "Vers le pont Samuel-De Champlain.",
      segmentDateStart: "2026-01-01",
      segmentDateEnd: "2026-12-31",
      segmentDateText: "Entrave de longue durée pendant l'année 2026.",
      segmentComplement: "Attention: les travaux de reconfiguration imposent certaines modifications de la configuration des voies. Circulez prudemment et respectez la signalisation.",
      analysis: { ...base.analysis, sections: ["Secteur des voies entre le pont Victoria et le pont Clément"], bullets: ["2 voies sur 3 ouvertes en direction du pont Samuel-De Champlain", "Attention: respecter la signalisation"] },
      segmentEndpoints: [[-73.562, 45.478], [-73.548, 45.493]]
    },
    {
      ...base,
      segmentId: "voies-victoria-clement-vers-centre-ville",
      segmentTitle: "Voies entre les ponts Victoria et Clément - vers le centre-ville",
      segmentStreets: "Voies entre le pont Victoria et le pont Clément",
      segmentImpact: "3 voies ouvertes en direction du centre-ville, avec possibles exceptions selon les travaux.",
      segmentDirection: "Vers le centre-ville.",
      segmentDateStart: "2026-01-01",
      segmentDateEnd: "2026-12-31",
      segmentDateText: "Entrave de longue durée pendant l'année 2026.",
      segmentComplement: "Attention: les travaux de reconfiguration imposent certaines modifications de la configuration des voies. Circulez prudemment et respectez la signalisation.",
      analysis: { ...base.analysis, sections: ["Secteur des voies entre le pont Victoria et le pont Clément"], bullets: ["3 voies ouvertes en direction du centre-ville", "Attention: respecter la signalisation"] },
      segmentEndpoints: [[-73.548, 45.493], [-73.562, 45.478]]
    }
  ];
}

function mapEntryForSegment(segmentId, mapEntraves) {
  const keys = {
    "sortie-3-vers-sud": "34",
    "gaetan-laberge-vers-sud": "64",
    "gaetan-laberge-vers-centre-ville": "64",
    "voies-victoria-clement-vers-sud": "65",
    "voies-victoria-clement-vers-centre-ville": "65",
    "pont-clement": "66"
  };
  const key = keys[segmentId];
  return key ? { key, entry: mapEntraves[key] || null } : null;
}

function analyzeNoticeAsSegments(notice) {
  const text = decodeHtml(notice.description).replace(/\s+/g, " ").trim();
  const title = decodeHtml(notice.title);
  if (/parc d.?entreprises de la pointe-saint-charles/i.test(title)) {
    return [{
      ...notice,
      segmentId: "pepsc-access-bonaventure",
      segmentTitle: "PEPSC - accès à l'autoroute Bonaventure fermé",
      segmentStreets: "Accès à l'autoroute Bonaventure depuis le parc d'entreprises de la Pointe-Saint-Charles",
      segmentImpact: "Circulation réservée aux entreprises locales; tout accès à l'autoroute Bonaventure depuis le PEPSC est fermé.",
      segmentDirection: "Accès du PEPSC vers l'autoroute Bonaventure.",
      segmentDateStart: "2025-11-27",
      segmentDateEnd: "2026-12-31",
      segmentDateText: "Avis en vigueur dès novembre 2025; fin publiée au 31 décembre 2026.",
      noGeometry: true,
      analysis: { sections: ["Secteur du PEPSC"], bullets: ["Circulation réservée aux entreprises locales", "Accès à l'A-Bonaventure fermé"], sourceText: text }
    }];
  }
  if (/honor[eé]-mercier/i.test(title)) {
    return [{
      ...notice,
      segmentId: "honore-mercier-rive-sud",
      segmentTitle: "Pont Honoré-Mercier - une voie fermée vers la Rive-Sud",
      segmentStreets: "Pont Honoré-Mercier, partie centrale",
      segmentImpact: "Fermeture d'une voie sur deux en direction de la Rive-Sud.",
      segmentDirection: "Vers la Rive-Sud.",
      segmentDateStart: "2026-09-12",
      segmentDateEnd: "2026-09-14",
      segmentDateText: "Du 12 septembre à 3 h au 14 septembre à 5 h.",
      analysis: { sections: ["Partie centrale du pont"], bullets: ["Fermeture d'une voie sur deux vers la Rive-Sud"], sourceText: text }
    }];
  }
  return [{
    ...notice,
    segmentId: `notice-${String(notice.url).replace(/[^a-z0-9]+/gi, "-")}`,
    analysis: { sections: [], bullets: [text], sourceText: text }
  }];
}

async function routeGeometry(notice) {
  if (notice.segmentGeometry) return notice.segmentGeometry;
  if (notice.noGeometry) return null;
  const endpoints = routeEndpoints(notice);
  if (!endpoints) return null;
  const coordinates = endpoints.map(([lon, lat]) => `${lon},${lat}`).join(";");
  const url = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson&steps=false`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`OSRM ${response.status}`);
  const data = await response.json();
  return data.routes?.[0]?.geometry || null;
}

async function osmWayGeometry(wayId) {
  const response = await fetch(`https://api.openstreetmap.org/api/0.6/way/${wayId}/full`);
  if (!response.ok) throw new Error(`OSM ${response.status}`);
  const xml = await response.text();
  const nodes = new Map([...xml.matchAll(/<node\b[^>]*\bid="(\d+)"[^>]*\blat="([^"]+)"[^>]*\blon="([^"]+)"[^>]*\/>/g)]
    .map((match) => [match[1], [Number(match[3]), Number(match[2])]]));
  const way = xml.match(new RegExp(`<way\\b[^>]*\\bid="${wayId}"[^>]*>[\\s\\S]*?<\\/way>`))?.[0] || "";
  const tags = Object.fromEntries([...way.matchAll(/<tag k="([^"]+)" v="([^"]*)"\s*\/>/g)].map((match) => [match[1], match[2]]));
  if (tags.name !== "Pont Honoré-Mercier" || tags.oneway !== "yes") return null;
  return [...way.matchAll(/<nd ref="(\d+)"\s*\/>/g)].map((match) => nodes.get(match[1])).filter(Boolean);
}

async function verifiedPjcciGeometry(segmentId) {
  const wayIds = VERIFIED_PJCCI_WAYS[segmentId];
  if (!wayIds) return null;
  const lines = [];
  for (const wayId of wayIds) {
    const response = await fetch(`https://api.openstreetmap.org/api/0.6/way/${wayId}/full`, { headers: { "User-Agent": "MontrealRoadClosuresSnapshot/1.0" } });
    if (!response.ok) throw new Error(`OSM way ${wayId} ${response.status}`);
    const xml = await response.text();
    const nodes = new Map([...xml.matchAll(/<node\b[^>]*\bid="(\d+)"[^>]*\blat="([^"]+)"[^>]*\blon="([^"]+)"[^>]*(?:\/>|>)/g)]
      .map((match) => [match[1], [Number(match[3]), Number(match[2])]]));
    const way = xml.match(/<way\b[\s\S]*?<\/way>/)?.[0] || "";
    const coordinates = [...way.matchAll(/<nd ref="(\d+)"\s*\/>/g)].map((match) => nodes.get(match[1])).filter(Boolean);
    if (coordinates.length >= 2) lines.push(coordinates);
  }
  return lines.length === 1
    ? { type: "LineString", coordinates: lines[0] }
    : lines.length > 1
      ? { type: "MultiLineString", coordinates: lines }
      : null;
}

async function honoreMercierGeometry() {
  const ways = await Promise.all(HONORE_MERCIER_WAYS.map(osmWayGeometry));
  const [bridge] = ways;
  if (!bridge?.length) return null;
  // This OSM bridge way is already oriented toward the Rive-Sud.
  return {
    type: "LineString",
    coordinates: bridge
  };
}

function decodeHtml(value) {
  return String(value || "")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

async function loadBonaventureMapEntraves() {
  const response = await fetch(BONAVENTURE_MAP_URL);
  if (!response.ok) throw new Error(`Carte PJCCI ${response.status}`);
  const html = await response.text();
  const encoded = html.match(/<div[^>]+id="map"[^>]+entrave="([^"]+)"/i)?.[1];
  if (!encoded) throw new Error("Attribut entrave absent de la carte PJCCI");
  return JSON.parse(decodeHtml(encoded));
}

async function loadPage(limit, all) {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded; charset=UTF-8", "x-requested-with": "XMLHttpRequest" },
    body: new URLSearchParams({ request: "loadmore", articlelimit: String(limit), all: String(all) })
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
}

const first = await loadPage(0, 0);
const total = Number(first.all || 0);
const notices = [];
for (let limit = 0; limit < total; limit += PAGE_SIZE) {
  const page = await loadPage(limit, total);
  notices.push(...(page.archive || []));
  console.log(`[${Math.min(limit + PAGE_SIZE, total)}/${total}] avis recuperes`);
}

const unique = [...new Map(notices.map((notice) => [notice.url, notice])).values()];
const today = new Date().toISOString().slice(0, 10);
const currentOrFuture = unique.filter((notice) => String(notice.datefin || notice.anneFin || "").slice(0, 10) >= today);
let bonaventureMapEntraves = {};
try {
  bonaventureMapEntraves = await loadBonaventureMapEntraves();
} catch (error) {
  console.warn(`Carte PJCCI non chargee: ${error.message}`);
}
const expandedNotices = currentOrFuture.flatMap((notice) => /mobilisation des chantiers.*bonaventure/i.test(notice.title)
  ? bonaventureSegments(notice)
  : analyzeNoticeAsSegments(notice));
for (const notice of expandedNotices) {
  if (notice.segmentId && VERIFIED_PJCCI_WAYS[notice.segmentId]) {
    notice.segmentGeometry = await verifiedPjcciGeometry(notice.segmentId);
    notice.segmentGeometrySource = `OpenStreetMap ways ${VERIFIED_PJCCI_WAYS[notice.segmentId].join(", ")}`;
    notice.noGeometry = !notice.segmentGeometry;
  }
  const mapMatch = mapEntryForSegment(notice.segmentId, bonaventureMapEntraves);
  if (mapMatch?.entry) {
    notice.mapEntryKey = mapMatch.key;
    notice.mapEntryId = mapMatch.entry.id || mapMatch.key;
    notice.mapSourceTitle = decodeHtml(mapMatch.entry.titre);
    notice.mapStartDate = String(mapMatch.entry.datedebut || "").slice(0, 10);
    notice.mapEndDate = String(mapMatch.entry.datefin || "").slice(0, 10);
    notice.mapPoint = [Number(mapMatch.entry.lng), Number(mapMatch.entry.lat)];
    notice.segmentPoint = notice.mapPoint;
    notice.noGeometry = true;
  }
  if (notice.segmentId === "sortie-3-vers-sud" && bonaventureMapEntraves[34]) {
    const mapEntry = bonaventureMapEntraves[34];
    notice.segmentPoint = [Number(mapEntry.lng), Number(mapEntry.lat)];
    notice.mapPointSource = `PJCCI carte interactive, entrave ${mapEntry.id || 34}`;
    notice.segmentGeometryNote = "Ligne OSM verifiee et recoupee avec le point officiel de la carte interactive PJCCI (entrave 34).";
  }
  notice.geometry = /honor[eé]-mercier/i.test(`${notice.title} ${(notice.tags || []).join(" ")}`)
    ? await honoreMercierGeometry()
    : await routeGeometry(notice);
  if (!notice.geometry && !notice.segmentPoint) {
    notice.noGeometry = true;
    notice.geometryNote = "Aucune geometrie verifiee n'est publiee pour cet avis; aucune coordonnee n'est inventee.";
  }
  if (/bonaventure/i.test(`${notice.title} ${(notice.tags || []).join(" ")}`) && notice.geometry) {
    notice.geometrySource = notice.segmentGeometrySource || "OSRM corridor from published Bonaventure sector endpoints";
    notice.geometryNote = notice.segmentGeometryNote || "Tracé indicatif du corridor Bonaventure; l'avis décrit plusieurs secteurs et configurations de voies, pas une fermeture complète de toute la ligne.";
  } else if (notice.segmentGeometryNote) {
    notice.geometryNote = notice.segmentGeometryNote;
  }
  console.log(`Trace ${notice.title.slice(0, 70)}: ${notice.geometry?.coordinates?.length || 0} points`);
}
const interactiveMapEntraves = Object.fromEntries(Object.entries(bonaventureMapEntraves).map(([key, entry]) => [key, {
  id: entry.id || key,
  title: decodeHtml(entry.titre),
  startDate: String(entry.datedebut || "").slice(0, 10),
  endDate: String(entry.datefin || "").slice(0, 10),
  point: [Number(entry.lng), Number(entry.lat)],
  raw: entry
}]));
await writeFile(OUTPUT, `${JSON.stringify({
  extractedAt: new Date().toISOString(),
  sourceUrl: ENDPOINT,
  interactiveMapUrl: BONAVENTURE_MAP_URL,
  asOf: today,
  total: expandedNotices.length,
  parentNoticeTotal: currentOrFuture.length,
  interactiveMapEntraves,
  validation: {
    geometryPolicy: "Aucune coordonnee inventee; geometrie publiee, OSM verifiee ou point de la carte PJCCI seulement.",
    archiveAvis: currentOrFuture.length,
    interactiveMapEntraves: Object.keys(bonaventureMapEntraves).length,
    segmentsMatchedToMap: expandedNotices.filter((notice) => notice.mapEntryId).length,
    unmatchedMapKeys: Object.keys(bonaventureMapEntraves).filter((key) => !expandedNotices.some((notice) => notice.mapEntryKey === key))
  },
  notices: expandedNotices
}, null, 2)}\n`, "utf8");
console.log(`Snapshot PJCCI: ${currentOrFuture.length} avis actifs ou futurs (sur ${unique.length} archives)`);
