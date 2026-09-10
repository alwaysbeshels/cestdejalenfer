import { writeFile } from "node:fs/promises";

const ENDPOINT = "https://jacquescartierchamplain.ca/fr/structures/archive-des-avis-de-travaux-et-chantiers/";
const OUTPUT = "data/pjcci-work-advisories-snapshot.json";
const PAGE_SIZE = 10;

const HONORE_MERCIER_WAYS = [567465771];

function routeEndpoints(notice) {
  const text = `${notice.title} ${(notice.tags || []).join(" ")}`;
  if (/honor[eé]-mercier/i.test(text)) return [[-73.6521, 45.4228], [-73.6601, 45.4060]];
  if (/bonaventure/i.test(text) && /parc d|pointe-saint-charles/i.test(text)) return [[-73.56, 45.479], [-73.542, 45.49]];
  if (/bonaventure/i.test(text)) return [[-73.561, 45.478], [-73.521, 45.503]];
  return null;
}

async function routeGeometry(notice) {
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
for (const notice of currentOrFuture) {
  notice.geometry = /honor[eé]-mercier/i.test(`${notice.title} ${(notice.tags || []).join(" ")}`)
    ? await honoreMercierGeometry()
    : await routeGeometry(notice);
  console.log(`Trace ${notice.title.slice(0, 70)}: ${notice.geometry?.coordinates?.length || 0} points`);
}
await writeFile(OUTPUT, `${JSON.stringify({
  extractedAt: new Date().toISOString(),
  sourceUrl: ENDPOINT,
  asOf: today,
  total: currentOrFuture.length,
  notices: currentOrFuture
}, null, 2)}\n`, "utf8");
console.log(`Snapshot PJCCI: ${currentOrFuture.length} avis actifs ou futurs (sur ${unique.length} archives)`);
