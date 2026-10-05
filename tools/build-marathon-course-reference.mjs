import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { chromium } from "playwright";

const EVENT = "CM-BENEVA-MONTREAL-2026";
const MAP_URL = `https://api.rtrt.me/events/${EVENT}/map`;
const CONFIG_URL = `https://api.rtrt.me/events/${EVENT}/conf`;
const PAGE_URL = `https://track.rtrt.me/map/${EVENT}`;
const PDF_URL = "https://couronsmtl.com/wp-content/uploads/2026/09/Depliant-Fermetures-de-rues-2026-web.pdf";
const SCHEDULES = {
  "1mile": { date: "2026-10-09", raceStartTime: "18:00", page: "le-mile" },
  "1k": { date: "2026-10-10", raceStartTime: "11:15", page: "1km" },
  "5k": { date: "2026-10-10", raceStartTime: "08:30", page: "5km" },
  "10k": { date: "2026-10-10", raceStartTime: "09:45", page: "10km" },
  "halfmarathon": { date: "2026-10-11", raceStartTime: "07:45", page: "21km" },
  "marathon": { date: "2026-10-11", raceStartTime: "07:45", page: "42km-2" }
};

export function extractMarathonCourses(mapResponse, configuration, checkedAt) {
  const source = mapResponse.list?.find(entry => entry._id === EVENT);
  const courses = source?.layers?.courses;
  assert.ok(source?.publish === 1 && Array.isArray(courses), "Published event map missing");
  assert.equal(configuration._id, EVENT, "Event configuration mismatch");
  assert.equal(configuration.conf?.timeZone, "America/Montreal", "Unexpected published time zone");
  assert.deepEqual(courses.map(course => course._id).sort(), Object.keys(SCHEDULES).sort(), "Expected exactly six named courses");
  return {
    source: "RTRT.me - Marathon Beneva de Montreal 2026",
    sourceUrl: PAGE_URL,
    geometrySourceUrl: MAP_URL,
    configurationSourceUrl: CONFIG_URL,
    noticeUrl: PDF_URL,
    checkedAt,
    sourceUpdatedAt: new Date(source.tsu * 1000).toISOString(),
    timeZone: configuration.conf.timeZone,
    warning: "Published race routes, not road-closure geometry. Race start times are not road-closure start or end times.",
    courses: courses.map(course => {
      assert.equal(course.isPublic, 1, `Private course: ${course._id}`);
      assert.ok(Array.isArray(course.polymap) && course.polymap.length > 1, `Missing course line: ${course._id}`);
      const coordinates = course.polymap.map(point => {
        assert.ok(Number.isFinite(point.lng) && Number.isFinite(point.lat)
          && point.lng >= -74.8 && point.lng <= -72.8 && point.lat >= 45 && point.lat <= 46.3, `Invalid course coordinate: ${course._id}`);
        return [point.lng, point.lat];
      });
      const schedule = SCHEDULES[course._id];
      return {
        id: course._id,
        sourceKey: course.key,
        title: configuration.vconf.courses[course._id],
        date: schedule.date,
        raceStartTime: schedule.raceStartTime,
        scheduleSourceUrl: `https://couronsmtl.com/courses/marathon/${schedule.page}/`,
        scheduleCheckedAt: "2026-10-05",
        scheduleNote: "Horaire de depart de course publie, sujet a changement; ce n'est pas un horaire de fermeture de rue.",
        publishedDistanceKm: course.km,
        geometryRole: "race-course",
        geometry: { type: "LineString", coordinates },
        routeDistancesKm: course.polymap.map(point => point.distance?.km ?? null)
      };
    })
  };
}

export function addCourseReference(snapshot, reference) {
  assert.ok(Array.isArray(snapshot.roadClosures?.objects), "Original Waze closures missing");
  const result = { ...snapshot, officialCourseReference: reference };
  for (const [key, value] of Object.entries(snapshot)) {
    if (key !== "officialCourseReference") assert.deepEqual(result[key], value, `Original collection changed: ${key}`);
  }
  return result;
}

async function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const snapshotFile = path.join(root, "data/Marathon-Beneva-Mtl-2026.json");
  const browser = await chromium.launch({ headless: true });
  let responses;
  try {
    const page = await browser.newPage();
    const pending = [MAP_URL, CONFIG_URL].map(url => page.waitForResponse(response => response.url() === url && response.status() === 200));
    await page.goto(PAGE_URL, { waitUntil: "domcontentloaded" });
    responses = await Promise.all(pending.map(async response => (await response).json()));
  } finally {
    await browser.close();
  }
  const reference = extractMarathonCourses(...responses, new Date().toISOString());
  const original = JSON.parse(readFileSync(snapshotFile, "utf8"));
  const originalClosures = createHash("sha256").update(JSON.stringify(original.roadClosures)).digest("hex");
  const result = addCourseReference(original, reference);
  writeFileSync(snapshotFile, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify({ checkedAt: reference.checkedAt, originalClosuresSha256: originalClosures,
    originalClosures: result.roadClosures.objects.length,
    courses: reference.courses.map(course => ({ id: course.id, date: course.date, raceStartTime: course.raceStartTime, coordinates: course.geometry.coordinates.length })) }, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}