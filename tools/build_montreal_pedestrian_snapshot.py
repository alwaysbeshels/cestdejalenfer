#!/usr/bin/env python3
"""Reconstruit le trace reel des rues pietonnes de Montreal (equivalent Python de
tools/build-montreal-pedestrian-snapshot.mjs). Un futur agent doit executer ce
script tel quel plutot que de reimplementer sa propre version.

Source officielle: API CKAN (donnees.montreal.ca), dataset rues pietonnes et
partagees. Geometrie de rue nommee recuperee dans OpenStreetMap (Overpass), avec
repli sur le geocodage Nominatim quand Overpass ne retourne rien.

REGLE ABSOLUE: seuls les enregistrements dont MODE_IMPLANTATION est "Temporaire"
ou "Temporaire saisonniere" representent une rue carrossable fermee
temporairement aux autos. "Permanent" et "Temporaire a permanent" sont exclus
AVANT tout geocodage/Overpass (moins de requetes, moins de risque de ban).

Usage:
  python tools/build_montreal_pedestrian_snapshot.py [--only=RP0005,RP0022] [--preview] [--reuse-existing]
"""

import json
import math
import re
import sys
import time
import urllib.parse
import urllib.request
import urllib.error
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CKAN_URL = "https://donnees.montreal.ca/api/3/action/datastore_search?resource_id=ef2a8162-0644-47e7-bd03-bea33f14a5d2&limit=100"
OVERPASS_ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
]
OUT = ROOT / "data" / "montreal-pedestrian-snapshot.json"
CURATED = ROOT / "data" / "montreal-pedestrian-curated.json"
GEOCODE_CACHE = ROOT / "tools" / "montreal-pedestrian-geocode-cache.json"
NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
OVERPASS_MIN_DELAY_S = 30.0
OVERPASS_TIMEOUT_S = 18.0
NOMINATIM_DELAY_S = 1.1
# Tolerance de validation de longueur (le troncon reconstruit peut differer un peu).
LEN_TOLERANCE = 0.45

_last_overpass_request_at = 0.0


def wait_for_overpass_slot():
    global _last_overpass_request_at
    elapsed = time.monotonic() - _last_overpass_request_at
    if elapsed < OVERPASS_MIN_DELAY_S:
        time.sleep(OVERPASS_MIN_DELAY_S - elapsed)
    _last_overpass_request_at = time.monotonic()


def http_get_json(url, headers=None, timeout=30):
    request = urllib.request.Request(url, headers=headers or {})
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8"))


def http_post_json(url, data, headers, timeout):
    request = urllib.request.Request(url, data=data.encode("utf-8"), headers=headers, method="POST")
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8"))


def normalize_search_name(value):
    text = str(value or "")
    text = re.sub(r"\b(ave|av)\.?\b", "avenue", text, flags=re.IGNORECASE)
    text = re.sub(r"\bboul\.?\b", "boulevard", text, flags=re.IGNORECASE)
    text = re.sub(r"\bch\.?\b", "chemin", text, flags=re.IGNORECASE)
    text = re.sub(r"\brte\.?\b", "route", text, flags=re.IGNORECASE)
    text = re.sub(r"\bE\b", "Est", text)
    text = re.sub(r"\bO\b", "Ouest", text)
    text = text.replace(".", " ")
    text = re.sub(r"\s+", " ", text).strip()
    return text


def read_geocode_cache():
    try:
        return json.loads(GEOCODE_CACHE.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def write_geocode_cache(cache):
    GEOCODE_CACHE.write_text(json.dumps(cache, indent=2, ensure_ascii=False), encoding="utf-8")


def haversine(a, b):
    r = 6371000.0
    p1 = math.radians(a[1])
    p2 = math.radians(b[1])
    dlat = math.radians(b[1] - a[1])
    dlon = math.radians(b[0] - a[0])
    h = math.sin(dlat / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlon / 2) ** 2
    return 2 * r * math.asin(math.sqrt(h))


def line_length(coords):
    return sum(haversine(coords[i], coords[i + 1]) for i in range(len(coords) - 1))


def geocode_street(name, lat, lon, cache):
    normalized = normalize_search_name(name)
    key = normalized.lower()
    if not normalized:
        return None
    if key in cache:
        return cache[key]

    params = {
        "format": "jsonv2",
        "addressdetails": "1",
        "polygon_geojson": "1",
        "limit": "10",
        "q": f"{normalized}, Montréal, Québec",
    }
    if lat and lon:
        # Sans viewbox, Nominatim ne retourne que 10 segments au hasard parmi tous ceux
        # d'une longue rue (elle est decoupee par quartier) et peut rater celui qui
        # croise reellement la fermeture. Le bounded force le segment geographiquement pertinent.
        delta = 0.01
        params["viewbox"] = f"{lon - delta},{lat + delta},{lon + delta},{lat - delta}"
        params["bounded"] = "1"
    url = f"{NOMINATIM_URL}?{urllib.parse.urlencode(params)}"
    headers = {"User-Agent": "CestDejaLEnfer/1.0 (snapshot builder)"}
    try:
        results = http_get_json(url, headers=headers, timeout=20)
        candidates = []
        for result in results:
            point = [float(result["lon"]), float(result["lat"])]
            distance = haversine([lon, lat], point) if lat and lon else 0
            geometry = result.get("geojson")
            candidates.append({
                "point": point,
                "displayName": result.get("display_name"),
                "type": result.get("type"),
                "geometry": geometry,
                "distance": distance,
                # Un candidat rue (LineString) prime toujours sur un POI ponctuel
                # (commerce, station, arrondissement) meme s'il est plus proche.
                "isLine": geometry is not None and geometry.get("type") in ("LineString", "MultiLineString"),
            })
        candidates.sort(key=lambda item: (not item["isLine"], item["distance"]))
        cache[key] = candidates[0] if candidates else None
        time.sleep(NOMINATIM_DELAY_S)
        return cache[key]
    except Exception as error:  # noqa: BLE001 - report and continue like the JS version
        cache[key] = None
        print(f"Geocoding failed for {normalized}: {error}")
        return None


def prefetch_geocodes(records, cache):
    names = {}
    for record in records:
        street = core_name(record.get("TOPONYME"))
        # Garder le prefixe de type de rue (rue/boul./place) dans la requete
        # Nominatim: sans lui, Nominatim matche un POI generique au lieu de la rue.
        cross1_raw = str(record.get("LIMITES_1") or "").strip()
        cross2_raw = str(record.get("LIMITES_2") or "").strip()
        for name in (street, cross1_raw, cross2_raw):
            normalized = normalize_search_name(name)
            if normalized:
                names[normalized.lower()] = (normalized, record.get("LATITUDE"), record.get("LONGITUDE"))

    print(f"Prefetch geocoding: {len(names)} street names")
    for normalized, lat, lon in names.values():
        geocode_street(normalized, lat, lon, cache)
    write_geocode_cache(cache)
    print(f"Geocoding cache ready: {len(cache)} entries")


def overpass(query, tries=2):
    last_error = None
    for _attempt in range(tries):
        for endpoint in OVERPASS_ENDPOINTS:
            try:
                wait_for_overpass_slot()
                headers = {
                    "User-Agent": "CestDejaLEnfer/1.0",
                    "Content-Type": "application/x-www-form-urlencoded",
                }
                body = "data=" + urllib.parse.quote(query)
                return http_post_json(endpoint, body, headers, OVERPASS_TIMEOUT_S)
            except Exception as error:  # noqa: BLE001
                last_error = error
    raise last_error if last_error else RuntimeError("Overpass unavailable")


def escape_regex(value):
    return re.escape(str(value))


def core_name(toponyme):
    return re.sub(r"\s+", " ", str(toponyme or "").split("\n")[0]).strip()


def clean_cross(limit):
    text = str(limit or "").strip()
    return re.sub(r"^(rue|ave|av|avenue|boul|boulevard|ch|chemin|place|pl)\.?\s+", "", text, flags=re.IGNORECASE).strip()


def is_automobile_relevant_pedestrian_record(mode_implantation):
    # Seule une pietonnisation temporaire peut representer une rue carrossable
    # fermee aux autos pour une periode bornee. Les sites permanents ne sont pas
    # des restrictions automobiles et doivent rester hors de ce snapshot.
    mode = str(mode_implantation or "").lower()
    return bool(re.search(r"temporaire", mode)) and not re.search(r"temporaire\s+[àa]\s+permanent", mode)


def stitch(segments):
    segs = [list(s) for s in segments if len(s) >= 2]
    if not segs:
        return []
    poly = segs.pop(0)
    changed = True
    while segs and changed:
        changed = False
        for i, s in enumerate(segs):
            if haversine(poly[-1], s[0]) < 8:
                poly = poly + s[1:]
                segs.pop(i)
                changed = True
                break
            if haversine(poly[-1], s[-1]) < 8:
                poly = poly + list(reversed(s))[1:]
                segs.pop(i)
                changed = True
                break
            if haversine(poly[0], s[-1]) < 8:
                poly = s + poly[1:]
                segs.pop(i)
                changed = True
                break
            if haversine(poly[0], s[0]) < 8:
                poly = list(reversed(s)) + poly[1:]
                segs.pop(i)
                changed = True
                break
    return poly


def name_matches(tag_name, wanted):
    a = str(tag_name or "").lower()
    b = str(wanted or "").lower()
    return bool(a) and bool(b) and (b in a or a in b)


def closest_point_on_polyline(poly, point):
    latitude_scale = math.cos(math.radians(point[1]))
    best = {"index": 0, "distance": math.inf, "point": poly[0]}
    for i in range(len(poly) - 1):
        a = poly[i]
        b = poly[i + 1]
        ax = (a[0] - point[0]) * latitude_scale
        ay = a[1] - point[1]
        bx = (b[0] - point[0]) * latitude_scale
        by = b[1] - point[1]
        dx = bx - ax
        dy = by - ay
        denominator = dx * dx + dy * dy
        t = max(0.0, min(1.0, -(ax * dx + ay * dy) / denominator)) if denominator else 0.0
        projected = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
        distance = haversine(projected, point)
        if distance < best["distance"]:
            best = {"index": i, "distance": distance, "point": projected}
    return best


def line_intersection(a, b, c, d):
    denominator = (a[0] - b[0]) * (c[1] - d[1]) - (a[1] - b[1]) * (c[0] - d[0])
    if abs(denominator) < 1e-12:
        return None
    factor_a = a[0] * b[1] - a[1] * b[0]
    factor_b = c[0] * d[1] - c[1] * d[0]
    x = (factor_a * (c[0] - d[0]) - (a[0] - b[0]) * factor_b) / denominator
    y = (factor_a * (c[1] - d[1]) - (a[1] - b[1]) * factor_b) / denominator

    def between(value, first, second):
        return min(first, second) - 1e-7 <= value <= max(first, second) + 1e-7

    if between(x, a[0], b[0]) and between(y, a[1], b[1]) and between(x, c[0], d[0]) and between(y, c[1], d[1]):
        return [x, y]
    return None


def polyline_intersections(first, second):
    intersections = []
    for i in range(len(first) - 1):
        for j in range(len(second) - 1):
            point = line_intersection(first[i], first[i + 1], second[j], second[j + 1])
            if point:
                intersections.append(point)
    return intersections


def reconstruct(street, cross1, cross2, lat, lon, geocode_cache, cross1_geocode_name=None, cross2_geocode_name=None):
    # Geocoder avec le prefixe de type de rue conserve (rue/boul./place...): le retirer
    # fait matcher Nominatim sur un POI generique (station, commerce, parti politique)
    # au lieu de la vraie rue, comme confirme en comparant les reponses avec/sans prefixe.
    cross1_geocode_name = cross1_geocode_name or cross1
    cross2_geocode_name = cross2_geocode_name or cross2
    s = escape_regex(street)
    c1 = escape_regex(cross1)
    c2 = escape_regex(cross2)
    query = f"""
[out:json][timeout:45];
(
  way(around:650,{lat},{lon})["highway"]["name"~"{s}",i];
  way(around:650,{lat},{lon})["highway"]["name"~"{c1}",i];
  way(around:650,{lat},{lon})["highway"]["name"~"{c2}",i];
);
out geom;
"""
    res = {"elements": []}
    try:
        res = overpass(query)
    except Exception as error:  # noqa: BLE001
        print(f"Overpass unavailable for {street}: {error}")

    street_segs, cross1_segs, cross2_segs = [], [], []
    for element in res.get("elements", []):
        if element.get("type") != "way" or not element.get("geometry"):
            continue
        coords = [[p["lon"], p["lat"]] for p in element["geometry"]]
        nm = (element.get("tags") or {}).get("name", "")
        if name_matches(nm, street):
            street_segs.append(coords)
        if name_matches(nm, cross1):
            cross1_segs.append(coords)
        if name_matches(nm, cross2):
            cross2_segs.append(coords)

    if not street_segs:
        street_point = geocode_street(street, lat, lon, geocode_cache)
        if street_point:
            geometry = street_point.get("geometry") or {}
            if geometry.get("type") == "LineString":
                street_segs.append(geometry["coordinates"])
            elif geometry.get("type") == "MultiLineString":
                street_segs.extend(geometry["coordinates"])
            try:
                point = street_point["point"]
                fallback = overpass(
                    f'[out:json][timeout:45];\nway(around:250,{point[1]},{point[0]})["highway"]["name"~"{s}",i];\nout geom;'
                )
            except Exception as error:  # noqa: BLE001
                fallback = {"elements": []}
                print(f"Overpass fallback unavailable for {street}: {error}")
            for element in fallback.get("elements", []):
                if element.get("type") == "way" and element.get("geometry"):
                    street_segs.append([[p["lon"], p["lat"]] for p in element["geometry"]])

    if not street_segs:
        return None, "street not found after geocoding"

    poly = stitch(street_segs)
    if len(poly) < 2:
        return None, "stitch failed"

    cross_points = []
    for cross, cross_geocode_name, segments in (
        (cross1, cross1_geocode_name, cross1_segs),
        (cross2, cross2_geocode_name, cross2_segs),
    ):
        if segments:
            nearest = None
            for segment in segments:
                for point in segment:
                    projection = closest_point_on_polyline(poly, point)
                    if nearest is None or projection["distance"] < nearest["distance"]:
                        nearest = {"point": point, "distance": projection["distance"]}
            cross_points.append(nearest)
        else:
            result = geocode_street(cross_geocode_name, lat, lon, geocode_cache)
            if not result:
                return None, f"cross missing after geocoding ({cross})"
            geometry = result.get("geometry") or {}
            if geometry.get("type") == "LineString":
                cross_geometry = geometry["coordinates"]
            elif geometry.get("type") == "MultiLineString":
                cross_geometry = [pt for seg in geometry["coordinates"] for pt in seg]
            else:
                cross_geometry = None
            intersections = polyline_intersections(poly, cross_geometry) if cross_geometry else []
            if intersections:
                cross_points.append({"point": intersections[0], "distance": 0})
            else:
                cross_points.append({
                    "point": result["point"],
                    "distance": closest_point_on_polyline(poly, result["point"])["distance"],
                })

    projected = []
    for item in cross_points:
        projection = closest_point_on_polyline(poly, item["point"])
        projected.append({**item, **projection})

    if any(item["distance"] > 80 for item in projected):
        distances = ",".join(str(round(item["distance"])) for item in projected)
        return None, f"intersections too far after geocoding ({distances}m)"
    if projected[0]["index"] == projected[1]["index"]:
        return None, "same intersection index"

    first, second = (projected[0], projected[1]) if projected[0]["index"] < projected[1]["index"] else (projected[1], projected[0])
    sub = [list(first["point"])] + [list(p) for p in poly[first["index"] + 1: second["index"] + 1]] + [list(second["point"])]
    if len(sub) < 2:
        return None, "empty segment"
    return sub, line_length(sub)


def parse_args(argv):
    only = None
    preview = "--preview" in argv
    reuse_existing = "--reuse-existing" in argv
    for arg in argv:
        if arg.startswith("--only="):
            only = [value for value in arg[len("--only="):].split(",") if value]
    return only, preview, reuse_existing


def main():
    only, preview, reuse_existing = parse_args(sys.argv[1:])
    curated_records = json.loads(CURATED.read_text(encoding="utf-8"))
    geocode_cache = read_geocode_cache()

    if reuse_existing:
        existing = json.loads(OUT.read_text(encoding="utf-8"))
        records = [r for r in existing.get("records", []) if is_automobile_relevant_pedestrian_record(r.get("modeImplantation"))]
        existing.update({
            "extractedAt": time.strftime("%Y-%m-%dT%H:%M:%S.000Z", time.gmtime()),
            "records": records,
            "filteredRecordCount": len(records),
            "curatedRecords": curated_records,
        })
        OUT.write_text(json.dumps(existing, indent=2, ensure_ascii=False), encoding="utf-8")
        print(f"Updated {OUT} with {len(curated_records)} curated records while reusing existing CKAN geometries.")
        return

    all_records = http_get_json(CKAN_URL, headers={"User-Agent": "Mozilla/5.0"})["result"]["records"]
    records = [r for r in all_records if not only or r.get("ID_PROJET") in only]
    records = [r for r in records if is_automobile_relevant_pedestrian_record(r.get("MODE_IMPLANTATION"))]
    print(f"CKAN automobile-relevant temporary records: {len(records)}")

    prefetch_geocodes(records, geocode_cache)

    out_records = []
    validated = 0
    point_only = 0

    for idx, r in enumerate(records):
        street = core_name(r.get("TOPONYME"))
        type_axe = str(r.get("TYPE_AXE") or "").strip()
        street_full = f"{type_axe} {street}".strip() if type_axe else street
        cross1 = clean_cross(r.get("LIMITES_1"))
        cross2 = clean_cross(r.get("LIMITES_2"))
        cross1_raw = str(r.get("LIMITES_1") or "").strip()
        cross2_raw = str(r.get("LIMITES_2") or "").strip()
        lat = r.get("LATITUDE")
        lon = r.get("LONGITUDE")
        published = r.get("LONGUEUR_TRONCON")
        nom = str(r.get("NOM_PROJET") or street).strip()

        geometry = None
        geom_note = "point"
        if lat and lon and cross1 and cross2:
            try:
                sub, info = reconstruct(street_full, cross1, cross2, lat, lon, geocode_cache, cross1_raw, cross2_raw)
            except Exception as error:  # noqa: BLE001
                sub, info = None, str(error)
            time.sleep(1)
            if sub and isinstance(info, (int, float)):
                if not published or abs(info - float(published)) <= float(published) * LEN_TOLERANCE:
                    geometry = {"type": "LineString", "coordinates": [[round(c[0], 6), round(c[1], 6)] for c in sub]}
                    geom_note = f"validated ({round(info)}m vs {published}m)"
                else:
                    geom_note = f"length mismatch ({round(info)}m vs {published}m)"
            else:
                geom_note = f"point ({info})"

        rec = {
            "id": f"montreal-pieton-{str(r.get('ID_PROJET') or '').lower()}",
            "projectId": r.get("ID_PROJET"),
            "title": nom,
            "streetName": street_full,
            "limits": [r.get("LIMITES_1"), r.get("LIMITES_2")],
            "publishedLengthMeters": published,
            "typeRepartage": r.get("TYPE_REPARTAGE"),
            "modeImplantation": r.get("MODE_IMPLANTATION"),
            "borough": r.get("ARRONDISSEMENT"),
            "dateOuverture": r.get("DATE_OUVERTURE"),
            "sourceUrl": "https://donnees.montreal.ca/dataset/rues-pietonnes-et-partagees",
            "geometryStatus": geom_note,
        }
        if geometry:
            rec["geometry"] = geometry
            validated += 1
        else:
            rec["geometry"] = {"type": "Point", "coordinates": [round(lon, 6), round(lat, 6)]} if lat and lon else None
            point_only += 1
        rec["point"] = [round(lon, 6), round(lat, 6)] if lat and lon else None
        out_records.append(rec)
        print(f"[{str(idx + 1).rjust(2)}/{len(records)}] {nom[:40].ljust(40)} -> {geom_note}")

    snapshot = {
        "extractedAt": time.strftime("%Y-%m-%dT%H:%M:%S.000Z", time.gmtime()),
        "sourceApi": CKAN_URL,
        "geometrySource": "OpenStreetMap (Overpass) - rue nommee entre limites publiees, validee par LONGUEUR_TRONCON",
        "validatedLineCount": validated,
        "pointOnlyCount": point_only,
        "records": out_records,
        "filteredRecordCount": len(out_records),
        "curatedRecords": curated_records,
    }
    if not preview:
        OUT.write_text(json.dumps(snapshot, indent=2, ensure_ascii=False), encoding="utf-8")
    write_geocode_cache(geocode_cache)
    if preview:
        print(f"\nPreview: {validated} validated lines, {point_only} point-only.")
    else:
        print(f"\nSaved {OUT}: {validated} validated lines, {point_only} point-only.")


if __name__ == "__main__":
    try:
        main()
    except Exception as error:  # noqa: BLE001
        print(error, file=sys.stderr)
        sys.exit(1)
