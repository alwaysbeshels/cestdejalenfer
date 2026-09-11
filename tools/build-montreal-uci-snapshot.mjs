import { writeFile } from "node:fs/promises";

const SOURCE_URL = "https://services.montreal.ca/cartes/uci";
const WFS_URL = "https://api.montreal.ca/api/it-platforms/geomatic/wfs-feature/v1/ls-montreal/ows";
const OUTPUT = "data/montreal-uci-closures-snapshot.json";
const selectedDate = process.argv.find((argument) => argument.startsWith("--date="))?.slice("--date=".length) || null;

const LAYERS = [
  {
    key: "restrictions",
    typeName: "uci-2026-vdm-restrictions-circulation_v2",
    description: "Restrictions et fermetures de circulation"
  },
  {
    key: "routes",
    typeName: "uci-2026-vdm-parcours_v2",
    description: "Parcours de l'evenement UCI"
  }
];

if (selectedDate && !/^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
  throw new Error("La date doit etre au format AAAA-MM-JJ, par exemple --date=2026-09-22.");
}

function dateOnly(value) {
  return String(value || "").slice(0, 10);
}

function hasPublishedDate(feature, layer) {
  const properties = feature.properties || {};
  return layer.key === "restrictions"
    ? Boolean(properties.date_debut) && Boolean(properties.date_fin)
    : Boolean(properties.date);
}

function appliesOnDate(feature, layer) {
  if (!selectedDate) return true;
  const properties = feature.properties || {};
  if (layer.key === "restrictions") {
    return dateOnly(properties.date_debut) <= selectedDate && selectedDate <= dateOnly(properties.date_fin);
  }
  return dateOnly(properties.date) === selectedDate;
}

async function fetchLayer(layer) {
  const query = new URLSearchParams({
    service: "WFS",
    version: "1.0.0",
    request: "GetFeature",
    typeName: `ls-montreal:${layer.typeName}`,
    outputFormat: "application/json"
  });
  const url = `${WFS_URL}?${query}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${layer.key}: ${response.status} ${response.statusText}`);

  const geojson = await response.json();
  if (geojson.type !== "FeatureCollection" || !Array.isArray(geojson.features)) {
    throw new Error(`${layer.key}: reponse WFS GeoJSON invalide`);
  }

  const datedFeatures = geojson.features.filter((feature) => hasPublishedDate(feature, layer));
  const features = datedFeatures.filter((feature) => appliesOnDate(feature, layer));
  return {
    typeName: layer.typeName,
    description: layer.description,
    requestUrl: url,
    totalFeatures: features.length,
    sourceTotalFeatures: Number(geojson.totalFeatures ?? geojson.features.length),
    excludedWithoutDate: geojson.features.length - datedFeatures.length,
    geojson: {
      type: "FeatureCollection",
      features
    }
  };
}

async function main() {
  const layers = await Promise.all(LAYERS.map(async (layer) => [layer.key, await fetchLayer(layer)]));
  const snapshot = {
    extractedAt: new Date().toISOString(),
    source: "Ville de Montreal - carte UCI 2026",
    sourceUrl: SOURCE_URL,
    note: "Donnees GeoJSON officielles brutes des couches WFS UCI; aucune geometrie ni attribut n'est modifie.",
    selectedDate,
    layers: Object.fromEntries(layers)
  };

  await writeFile(OUTPUT, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  for (const [key, layer] of layers) console.log(`${key}: ${layer.totalFeatures} objets retenus sur ${layer.sourceTotalFeatures}`);
  console.log(`Saved ${OUTPUT}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});