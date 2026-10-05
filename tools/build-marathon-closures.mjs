import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import path from "node:path";
import RBush from "rbush";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const snapshotFile = path.join(root, "data/Marathon-Beneva-Mtl-2026.json");
const PDF_URL = "https://couronsmtl.com/wp-content/uploads/2026/09/Depliant-Fermetures-de-rues-2026-web.pdf";
const SOURCE = "Marathon Beneva de Montreal - Fermetures officielles 2026";
const hash = value => createHash("sha256").update(value).digest("hex");
const project = coordinate => [coordinate[0] * 111320 * Math.cos(45.55 * Math.PI / 180), coordinate[1] * 111320];

export async function fetchPathReference(fetcher = fetch) {
  const elements = new Map();
  const requests = [];
  const sourceUrl = "https://api.openstreetmap.org/api/0.6/map.json";
  const boxes = [[-73.577, 45.553, -73.5635, 45.562], [-73.5635, 45.553, -73.55, 45.562], [-73.577, 45.562, -73.5635, 45.571], [-73.5635, 45.562, -73.55, 45.571]];
  for (const box of boxes) {
    const url = `${sourceUrl}?bbox=${box.join(",")}`;
    const response = await fetcher(url, { headers: { "User-Agent": "CarteEntraves-local-validation/1.0", Accept: "application/json" }, signal: AbortSignal.timeout(45000) });
    assert.ok(response.ok, `OSM request failed: HTTP ${response.status}`);
    const data = await response.json();
    assert.ok(Array.isArray(data.elements) && data.elements.length, "Missing OSM elements");
    for (const element of data.elements) elements.set(`${element.type}:${element.id}`, element);
    requests.push({ url, count: data.elements.length });
  }
  const paths = [...elements.values()].filter(element => element.type === "way" && ["path", "footway", "pedestrian", "cycleway"].includes(element.tags?.highway)).map(way => ({
    id: way.id, tags: way.tags, geometry: way.nodes.map(id => {
      const node = elements.get(`node:${id}`);
      assert.ok(node && Number.isFinite(node.lon) && Number.isFinite(node.lat), `Missing OSM node ${id}`);
      return { lon: node.lon, lat: node.lat };
    })
  }));
  assert.ok(paths.length, "No published park paths");
  return { sourceUrl, checkedAt: new Date().toISOString(), requests, elements: paths };
}

export function updateSourceVerification(catalog, checkedAt) {
  const entries = catalog.split("\n").filter(line => line.includes(`name: ${JSON.stringify(SOURCE)},`));
  assert.equal(entries.length, 1, "Expected one marathon PDF catalog entry");
  assert.match(entries[0], /extractedAt: "[^"]+"/);
  return catalog.replace(entries[0], entries[0].replace(/extractedAt: "[^"]+"/, `extractedAt: ${JSON.stringify(checkedAt)}`));
}

function createReferenceIndex(streets, paths) {
  const segments = [];
  const add = (coordinates, reference) => {
    for (let index = 1; index < coordinates.length; index++) {
      const first = project(coordinates[index - 1]);
      const last = project(coordinates[index]);
      const delta = last.map((value, axis) => value - first[axis]);
      const length = Math.hypot(...delta);
      if (!length) continue;
      segments.push({ minX: Math.min(first[0], last[0]), minY: Math.min(first[1], last[1]), maxX: Math.max(first[0], last[0]), maxY: Math.max(first[1], last[1]), first, delta, length, ...reference });
    }
  };
  for (const street of streets.rues) {
    if (!street.rue || /voie pi[eé]tonni[eè]re|autoroute/i.test(street.classeDescription)) continue;
    add(street.coordinates, { kind: "road", name: street.rue, referenceId: `geobase:${street.id}`, referenceType: street.classeDescription });
  }
  for (const way of paths.elements) {
    if (["sidewalk", "crossing"].includes(way.tags.footway)) continue;
    if (way.tags.highway === "cycleway" && !["yes", "designated"].includes(way.tags.foot)) continue;
    assert.ok(["path", "footway", "pedestrian", "cycleway"].includes(way.tags.highway));
    add(way.geometry.map(point => [point.lon, point.lat]), { kind: "path", name: way.tags.name || "", referenceId: `osm:way:${way.id}`, referenceType: way.tags.highway });
  }
  return new RBush().load(segments);
}

function classifyEdge(index, firstCoordinate, lastCoordinate) {
  const first = project(firstCoordinate);
  const last = project(lastCoordinate);
  const delta = last.map((value, axis) => value - first[axis]);
  const length = Math.hypot(...delta);
  if (!length) return null;
  const matches = [0.2, 0.5, 0.8].map(fraction => {
    const point = first.map((value, axis) => value + fraction * delta[axis]);
    const candidates = index.search({ minX: point[0] - 20, minY: point[1] - 20, maxX: point[0] + 20, maxY: point[1] + 20 }).flatMap(segment => {
      const alignment = Math.abs(delta.reduce((total, value, axis) => total + value * segment.delta[axis], 0)) / (length * segment.length);
      if (alignment < Math.cos(30 * Math.PI / 180)) return [];
      const position = Math.max(0, Math.min(1, point.reduce((total, value, axis) => total + (value - segment.first[axis]) * segment.delta[axis], 0) / segment.length ** 2));
      const distance = Math.hypot(...point.map((value, axis) => value - segment.first[axis] - position * segment.delta[axis]));
      return distance <= (segment.kind === "path" ? 10 : 20) ? [{ ...segment, distance }] : [];
    }).sort((left, right) => left.distance - right.distance);
    const best = candidates[0];
    if (!best) return null;
    if (candidates.some(candidate => `${candidate.kind}:${candidate.name}` !== `${best.kind}:${best.name}` && candidate.distance - best.distance < 2)) return null;
    return best;
  });
  const accepted = matches.filter(Boolean);
  if (accepted.length < 2 || new Set(accepted.map(match => `${match.kind}:${match.name}`)).size !== 1) return null;
  return { kind: accepted[0].kind, name: accepted[0].name, referenceIds: [...new Set(accepted.map(match => match.referenceId))], referenceTypes: [...new Set(accepted.map(match => match.referenceType))], maximumDistanceMeters: Math.max(...accepted.map(match => match.distance)) };
}

export function buildClosures(snapshot, extraction, streets, paths, pdfCheckedAt) {
  const index = createReferenceIndex(streets, paths);
  const courses = new Map(snapshot.officialCourseReference.courses.map(course => [course.id, course]));
  const grouped = new Map();
  const review = [];
  const coverage = [];
  for (const page of extraction.pages) {
    for (const assignment of page.courses) {
      const course = courses.get(assignment.id);
      assert.equal(course.date, page.date);
      let section = null;
      let mapped = 0;
      for (const edge of assignment.edges) {
        const reference = classifyEdge(index, ...course.geometry.coordinates.slice(edge.index, edge.index + 2));
        if (edge.row === null || !reference) {
          review.push({ courseId: course.id, date: course.date, firstCoordinateIndex: edge.index, lastCoordinateIndex: edge.index + 1, candidateRows: edge.candidateRows, reason: edge.row === null ? "schedule-boundary" : "unconfirmed-road-or-path", maximumGapPdfPoints: edge.maximumGapPdfPoints });
          section = null;
          continue;
        }
        mapped++;
        const key = JSON.stringify([page.date, edge.row, reference.kind, reference.name]);
        const window = page.rows.find(row => row.row === edge.row);
        if (!grouped.has(key)) grouped.set(key, { id: `marathon-pdf-${page.date}-${hash(key).slice(0, 12)}`, kind: reference.kind, streetName: reference.name, source: SOURCE, sourceUrl: PDF_URL, startDate: page.date, endDate: page.date, startTime: window.startTime, endTime: window.endTime, timeZone: "America/Montreal", closureEvidence: "HORAIRE RUES FERMÉES", pdfPage: page.page, pdfRow: edge.row, pdfPathObjectIds: window.pathObjectIds, courseIds: [], sections: [] });
        const record = grouped.get(key);
        if (!record.courseIds.includes(course.id)) record.courseIds.push(course.id);
        if (!section || section.key !== key || section.lastCoordinateIndex !== edge.index) {
          section = { key, courseId: course.id, firstCoordinateIndex: edge.index, lastCoordinateIndex: edge.index + 1, referenceIds: [], referenceTypes: [], maximumGapPdfPoints: 0, maximumReferenceDistanceMeters: 0 };
          record.sections.push(section);
        }
        section.lastCoordinateIndex = edge.index + 1;
        section.referenceIds = [...new Set([...section.referenceIds, ...reference.referenceIds])];
        section.referenceTypes = [...new Set([...section.referenceTypes, ...reference.referenceTypes])];
        section.maximumGapPdfPoints = Math.max(section.maximumGapPdfPoints, edge.maximumGapPdfPoints);
        section.maximumReferenceDistanceMeters = Math.max(section.maximumReferenceDistanceMeters, reference.maximumDistanceMeters);
      }
      coverage.push({ courseId: course.id, mappedEdges: mapped, totalEdges: assignment.edges.length });
    }
  }
  const records = [...grouped.values()].map(record => {
    const lines = [...new Map(record.sections.map(section => {
      delete section.key;
      const coordinates = courses.get(section.courseId).geometry.coordinates.slice(section.firstCoordinateIndex, section.lastCoordinateIndex + 1);
      return [JSON.stringify(coordinates), coordinates];
    })).values()];
    return { ...record, geometryRole: "pdf-closure-matched-to-rtrt", geometry: lines.length === 1 ? { type: "LineString", coordinates: lines[0] } : { type: "MultiLineString", coordinates: lines } };
  });
  assert.ok(records.some(record => record.kind === "road" && record.startDate === "2026-10-11"), "Sunday road closures missing");
  assert.ok(records.some(record => record.kind === "path" && record.startDate === "2026-10-10"), "Park paths missing");
  return {
    schemaVersion: 1, source: SOURCE, sourceUrl: PDF_URL, pdfSha256: extraction.pdfSha256, pdfCheckedAt,
    generatedAt: new Date().toISOString(), timeZone: "America/Montreal",
    geometrySourceUrl: snapshot.officialCourseReference.geometrySourceUrl,
    geometryCheckedAt: snapshot.officialCourseReference.checkedAt,
    classificationReferences: { roads: { sourceUrl: streets.source, retrievedAt: streets.recupereLe, sha256: streets.empreinte }, paths: { sourceUrl: paths.sourceUrl, checkedAt: paths.checkedAt, requests: paths.requests, attribution: "OpenStreetMap contributors (ODbL)" } },
    method: "PDF closure legend linked to its vector strokes; kilometer-marker affine calibration and five interior samples per RTRT edge. Road/path identity requires at least two aligned reference matches. Cycleways require published pedestrian access. Motorway names require separate confirmation and are not assigned by proximity. Coordinates are untouched consecutive RTRT vertices; ambiguous edges are not drawn.",
    schedule: extraction.pages.map(({ page, date, rows, calibration }) => ({ page, date, rows, calibration })), coverage, records, review,
    unresolvedCourses: [],
    excludedDates: [{ date: "2026-10-09", reason: "Indoor exhibition; no closure to add, as clarified by the user on 2026-10-05.", basis: "user-clarification" }]
  };
}

export function mergeMarathonPedestrianSnapshot(previous, marathon) {
  const reference = marathon.officialClosureReference;
  assert.equal(reference?.schemaVersion, 1, "Missing verified marathon closure reference");
  const key = "marathon-pdf";
  const records = reference.records.filter(record => record.kind === "path").map(record => {
    const lines = record.geometry.type === "LineString" ? [record.geometry.coordinates] : record.geometry.coordinates;
    const longest = lines.reduce((first, second) => first.length >= second.length ? first : second);
    return {
      id: `pedestrian-${record.id}`, title: "Marathon Beneva de Montreal 2026", streets: record.streetName,
      category: "event", sourceKind: "pedestrian-marathon-pdf", source: reference.source, sourceUrl: reference.sourceUrl,
      sourceKey: key, sourceCheckedAt: reference.pdfCheckedAt, responsible: "Marathon Beneva de Montreal", borough: "Montréal",
      pedestrianArea: "path", affectedUsers: ["pedestrians"], automobileImpact: false,
      startDate: record.startDate, endDate: record.endDate, startTime: record.startTime, endTime: record.endTime,
      openEnded: false, periods: ["day"], severity: "critical", impact: record.closureEvidence,
      impactKey: "marathon.pathImpact", geometryNoteKey: "marathon.pdfGeometry", scheduleTextKey: "marathon.pdfScope",
      geometry: record.geometry, point: longest[Math.floor(longest.length / 2)],
      side: { code: "not-applicable", published: null, geometryStatus: "pdf-matched-course" },
      evidence: { kind: "pdf-vector-and-published-path", text: record.closureEvidence, pdfPage: record.pdfPage, pdfRow: record.pdfRow, courseIds: record.courseIds, sections: record.sections },
      details: [
        { labelKey: "marathon.courses", value: record.courseIds.map(id => marathon.officialCourseReference.courses.find(course => course.id === id).title).join("; ") },
        { labelKey: "marathon.pdfReference", value: `${record.pdfPage} / ${record.pdfRow + 1}` },
        { labelKey: "marathon.geometrySource", value: reference.geometrySourceUrl }
      ]
    };
  });
  const result = {
    ...previous, generatedAt: new Date().toISOString(),
    records: [...previous.records.filter(record => record.sourceKey !== key), ...records].sort((first, second) => first.id.localeCompare(second.id)),
    sources: [...previous.sources.filter(source => source.key !== key), { key, url: "data/Marathon-Beneva-Mtl-2026.json", status: "local-snapshot", checkedAt: null, sourceExtractedAt: reference.pdfCheckedAt, received: reference.records.length, retained: records.length, reviewCount: 0 }]
  };
  assert.deepEqual(result.records.filter(record => record.sourceKey !== key), [...previous.records.filter(record => record.sourceKey !== key)].sort((first, second) => first.id.localeCompare(second.id)), "Other pedestrian records changed");
  assert.deepEqual(result.sources.filter(source => source.key !== key), previous.sources.filter(source => source.key !== key), "Other source verification dates changed");
  return result;
}

async function main() {
  const snapshot = JSON.parse(readFileSync(snapshotFile, "utf8"));
  const paths = process.argv[2] ? JSON.parse(readFileSync(process.argv[2], "utf8")) : await fetchPathReference();
  const streets = JSON.parse(readFileSync(path.join(root, "tools/cache-nids-de-poule/rues-statistiques.json"), "utf8"));
  const temporary = mkdtempSync(path.join(tmpdir(), "marathon-pdf-"));
  try {
    const response = await fetch(PDF_URL, { signal: AbortSignal.timeout(60000) });
    assert.ok(response.ok, `PDF request failed: HTTP ${response.status}`);
    const pdfFile = path.join(temporary, "closures.pdf");
    writeFileSync(pdfFile, Buffer.from(await response.arrayBuffer()));
    const pdfCheckedAt = new Date().toISOString();
    const extracted = spawnSync("python", [path.join(root, "tools/extract-marathon-pdf.py"), pdfFile, snapshotFile], { encoding: "utf8", maxBuffer: 8 * 1024 * 1024 });
    assert.equal(extracted.status, 0, extracted.stderr || extracted.error?.message);
    const reference = buildClosures(snapshot, JSON.parse(extracted.stdout), streets, paths, pdfCheckedAt);
    const result = { ...snapshot, officialClosureReference: reference };
    for (const [key, value] of Object.entries(snapshot)) if (key !== "officialClosureReference") assert.deepEqual(result[key], value, `Existing data changed: ${key}`);
    const catalogFile = path.join(root, "data/sources.js");
    const catalog = updateSourceVerification(readFileSync(catalogFile, "utf8"), reference.pdfCheckedAt);
    writeFileSync(snapshotFile, `${JSON.stringify(result, null, 2)}\n`);
    writeFileSync(catalogFile, catalog);
    console.log(JSON.stringify({ originalWazeClosures: result.roadClosures.objects.length, originalWazeSha256: hash(JSON.stringify(result.roadClosures)), pdfCheckedAt, records: reference.records.length, byKind: Object.fromEntries(["road", "path"].map(kind => [kind, reference.records.filter(record => record.kind === kind).length])), coverage: reference.coverage, reviewEdges: reference.review.length }, null, 2));
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}