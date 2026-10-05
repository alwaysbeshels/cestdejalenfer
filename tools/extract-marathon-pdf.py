import hashlib
import itertools
import json
import math
import re
import statistics
import sys

import pymupdf


def solve(matrix, values):
    augmented = [list(row) + [value] for row, value in zip(matrix, values)]
    for column in range(len(values)):
        pivot = max(range(column, len(values)), key=lambda row: abs(augmented[row][column]))
        augmented[column], augmented[pivot] = augmented[pivot], augmented[column]
        divisor = augmented[column][column]
        if abs(divisor) < 1e-12:
            raise ValueError("Singular calibration")
        augmented[column] = [value / divisor for value in augmented[column]]
        for row in range(len(values)):
            if row != column:
                factor = augmented[row][column]
                augmented[row] = [value - factor * reference for value, reference in zip(augmented[row], augmented[column])]
    return [row[-1] for row in augmented]


def fit(pairs):
    bases = [[point[0], point[1], 1] for point, target in pairs]
    matrix = [[sum(base[row] * base[column] for base in bases) for column in range(3)] for row in range(3)]
    return [solve(matrix, [sum(base[column] * pair[1][axis] for base, pair in zip(bases, pairs)) for column in range(3)]) for axis in range(2)]


def apply(transform, point):
    return [sum(coefficient * value for coefficient, value in zip(axis, [point[0], point[1], 1])) for axis in transform]


def project(coordinates):
    longitude, latitude = coordinates
    return [(longitude + 73.6) * math.pi / 180 * 6378137, (math.log(math.tan(math.pi / 4 + latitude * math.pi / 360)) - math.log(math.tan(math.pi / 4 + 45.53 * math.pi / 360))) * 6378137]


def distance(first, second):
    return math.hypot(first[0] - second[0], first[1] - second[1])


def course_point(course, kilometer):
    measures = course["routeDistancesKm"]
    target = kilometer * measures[-1] / course["publishedDistanceKm"]
    for index in range(1, len(measures)):
        if measures[index] >= target:
            fraction = (target - measures[index - 1]) / (measures[index] - measures[index - 1]) if measures[index] != measures[index - 1] else 0
            before, after = course["geometry"]["coordinates"][index - 1:index + 1]
            return project([before[axis] + fraction * (after[axis] - before[axis]) for axis in range(2)])
    return project(course["geometry"]["coordinates"][-1])


def path_segments(item):
    segments = []
    for command in item["items"]:
        if command[0] == "l":
            segments.append((list(command[1]), list(command[2])))
        elif command[0] == "c":
            start, first, second, end = [list(point) for point in command[1:]]
            previous = start
            for step in range(1, 13):
                fraction = step / 12
                current = [(1 - fraction) ** 3 * start[axis] + 3 * (1 - fraction) ** 2 * fraction * first[axis] + 3 * (1 - fraction) * fraction ** 2 * second[axis] + fraction ** 3 * end[axis] for axis in range(2)]
                segments.append((previous, current))
                previous = current
    return segments


def nearest_rows(point, segments):
    closest = {}
    for start, end, row, path_id in segments:
        delta = [end[axis] - start[axis] for axis in range(2)]
        squared = sum(value * value for value in delta)
        fraction = max(0, min(1, sum((point[axis] - start[axis]) * delta[axis] for axis in range(2)) / squared)) if squared else 0
        projected = [start[axis] + fraction * delta[axis] for axis in range(2)]
        gap = distance(point, projected)
        if row not in closest or gap < closest[row][0]:
            closest[row] = (gap, projected, row, path_id)
    return sorted(closest.values(), key=lambda match: match[0])


def time_value(text):
    match = re.fullmatch(r"\s*(\d{1,2})\s*[hH]\s*(\d{2})\s*", text)
    if not match:
        raise ValueError("Unexpected schedule text")
    return f"{int(match[1]):02}:{match[2]}"


def extract_page(page, courses, reference_id):
    page_index = page.number
    spans = [span for block in page.get_text("dict")["blocks"] if "lines" in block for line in block["lines"] for span in line["spans"]]
    times = [span for span in spans if re.fullmatch(r"\s*\d{1,2}\s*[hH]\s*\d{2}\s*", span["text"])]
    ends = sorted([span for span in times if (637 if page_index == 0 else 923) < span["bbox"][0] < (670 if page_index == 0 else 950)], key=lambda span: span["bbox"][1])
    starts = sorted([span for span in times if (600 if page_index == 0 else 878) < span["bbox"][0] < (625 if page_index == 0 else 905)], key=lambda span: span["bbox"][1])
    assert len(ends) == (7 if page_index == 0 else 13) and len(starts) == 4, "Schedule structure changed"
    assert "HORAIRE RUES FERM" in page.get_text(), "Road closure heading missing"
    center = lambda span: (span["bbox"][1] + span["bbox"][3]) / 2
    partitions = []
    for boundaries in itertools.combinations(range(1, len(ends)), len(starts) - 1):
        limits = [0, *boundaries, len(ends)]
        score = sum((statistics.mean(center(span) for span in ends[limits[index]:limits[index + 1]]) - center(start)) ** 2 for index, start in enumerate(starts))
        partitions.append((score, limits))
    partitions.sort()
    score, limits = partitions[0]
    assert score < 4 and partitions[1][0] - score > 10, "Ambiguous merged start-time cells"
    drawings = page.get_drawings()
    rows = []
    segments = []
    for row_index, end in enumerate(ends):
        start_index = next(index for index in range(4) if limits[index] <= row_index < limits[index + 1])
        legends = [(index, item) for index, item in enumerate(drawings) if item.get("color") and max(item["color"]) - min(item["color"]) > 0.05 and item["rect"].x0 > (530 if page_index == 0 else 805) and item["rect"].x1 < (591 if page_index == 0 else 872) and abs(item["rect"].y0 - center(end)) < 2 and item["rect"].height < 1 and item["rect"].width > 25 and (item.get("width") or 0) > 2]
        assert len(legends) == 1, "Ambiguous schedule legend"
        legend_id, legend = legends[0]
        path_ids = []
        for path_id, item in enumerate(drawings):
            if path_id == legend_id or not item.get("color") or sum(abs(left - right) for left, right in zip(item["color"], legend["color"])) >= 0.001:
                continue
            if item["rect"].width <= 10 and item["rect"].height <= 10:
                continue
            if page_index == 1 and (item.get("width") or 0) < 2.8:
                continue
            path_ids.append(path_id)
            segments.extend((first, last, row_index, path_id) for first, last in path_segments(item))
        assert path_ids, "No closure path for schedule row"
        rows.append({"row": row_index, "startTime": time_value(starts[start_index]["text"]), "endTime": time_value(end["text"]), "legendObjectId": legend_id, "pathObjectIds": path_ids, "endTextBox": list(end["bbox"]), "startTextBox": list(starts[start_index]["bbox"])})
    reference = next(course for course in courses if course["id"] == reference_id)
    markers = [span for span in spans if span["font"] == "HelveticaNeue-Bold" and span["text"].strip().isdigit() and (1 <= int(span["text"].strip()) <= 9 if page_index == 0 else 22 <= int(span["text"].strip()) <= 42)]
    pairs = [(course_point(reference, int(span["text"].strip())), [(span["bbox"][0] + span["bbox"][2]) / 2, center(span)]) for span in markers]
    candidates = []
    for sample in itertools.combinations(pairs, 3):
        try:
            candidate = fit(sample)
        except ValueError:
            continue
        candidates.append((sum(min(distance(apply(candidate, point), target) ** 2, 100) for point, target in pairs), candidate))
    transform = min(candidates, key=lambda candidate: candidate[0])[1]
    transform = fit([(point, target) for point, target in pairs if distance(apply(transform, point), target) < 10])
    points = list({tuple(project(point)) for course in courses for point in course["geometry"]["coordinates"]})
    for iteration in range(18):
        associations = [(point, nearest_rows(apply(transform, point), segments)[0]) for point in points]
        transform = fit([(point, match[1]) for point, match in associations if match[0] < 12])
    gaps = [nearest_rows(apply(transform, point), segments)[0][0] for point in points]
    assert statistics.median(gaps) < 1 and max(gaps) < 4, "PDF/RTRT calibration failed"
    assignments = []
    for course in courses:
        coordinates = course["geometry"]["coordinates"]
        edges = []
        for index, (first, last) in enumerate(zip(coordinates, coordinates[1:])):
            matches = [nearest_rows(apply(transform, project([first[axis] + fraction * (last[axis] - first[axis]) for axis in range(2)])), segments) for fraction in [0.15, 0.35, 0.5, 0.65, 0.85]]
            candidate_rows = sorted({match[0][2] for match in matches})
            maximum = max(match[0][0] for match in matches)
            margin = min(match[1][0] - match[0][0] for match in matches)
            accepted = len(candidate_rows) == 1 and maximum <= 3.5 and margin >= 0.6
            edges.append({"index": index, "row": candidate_rows[0] if accepted else None, "candidateRows": candidate_rows, "maximumGapPdfPoints": round(maximum, 3), "marginPdfPoints": round(margin, 3)})
        assignments.append({"id": course["id"], "edges": edges})
    return {"page": page_index + 1, "date": "2026-10-10" if page_index == 0 else "2026-10-11", "rows": rows, "calibration": {"transform": transform, "markerCount": len(markers), "medianGapPdfPoints": statistics.median(gaps), "maximumGapPdfPoints": max(gaps)}, "courses": assignments}


def extract(pdf_path, snapshot_path):
    with open(pdf_path, "rb") as handle:
        pdf_bytes = handle.read()
    assert hashlib.sha256(pdf_bytes).hexdigest() == "07303c423b638b5b5b858e0d4b12515139acb39a8827bf7a9a8567324d156269", "PDF changed; review required"
    with open(snapshot_path, encoding="utf-8") as handle:
        snapshot = json.load(handle)
    document = pymupdf.open(stream=pdf_bytes, filetype="pdf")
    courses = snapshot["officialCourseReference"]["courses"]
    return {"pdfSha256": hashlib.sha256(pdf_bytes).hexdigest(), "pages": [extract_page(document[0], [course for course in courses if course["id"] in ["10k", "5k", "1k"]], "10k"), extract_page(document[1], [course for course in courses if course["id"] in ["marathon", "halfmarathon"]], "marathon")]}


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    print(json.dumps(extract(sys.argv[1], sys.argv[2]), ensure_ascii=False))