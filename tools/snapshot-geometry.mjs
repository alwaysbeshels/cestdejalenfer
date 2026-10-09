import assert from "node:assert/strict";

export function distanceMeters(first, second) {
  const radians = Math.PI / 180;
  const latitude = (second[1] - first[1]) * radians;
  const longitude = (second[0] - first[0]) * radians;
  const value = Math.sin(latitude / 2) ** 2 + Math.cos(first[1] * radians) * Math.cos(second[1] * radians) * Math.sin(longitude / 2) ** 2;
  return 12742000 * Math.asin(Math.sqrt(Math.min(1, value)));
}

export function lineMeasures(line) {
  const values = [0];
  for (let index = 1; index < line.length; index += 1) values.push(values.at(-1) + distanceMeters(line[index - 1], line[index]));
  return values;
}

export function projectOnLine(point, line, measures = lineMeasures(line)) {
  let best = null;
  const scale = Math.cos(point[1] * Math.PI / 180);
  for (let index = 1; index < line.length; index += 1) {
    const first = line[index - 1];
    const last = line[index];
    const delta = [(last[0] - first[0]) * scale, last[1] - first[1]];
    const squared = delta[0] ** 2 + delta[1] ** 2;
    const fraction = squared ? Math.max(0, Math.min(1, ((point[0] - first[0]) * scale * delta[0] + (point[1] - first[1]) * delta[1]) / squared)) : 0;
    const coordinate = first.map((value, axis) => value + fraction * (last[axis] - value));
    const gap = distanceMeters(point, coordinate);
    if (!best || gap < best.gap) best = { gap, measure: measures[index - 1] + fraction * (measures[index] - measures[index - 1]), coordinate, index, fraction };
  }
  assert.ok(best, "Projection requires a line");
  return best;
}

export function sliceLine(line, start, end, measures = lineMeasures(line)) {
  assert.ok(start >= -0.000001 && end <= measures.at(-1) + 0.000001 && end > start, "Invalid linear-reference interval");
  const pointAt = measure => {
    const exact = measures.findIndex(value => Math.abs(value - measure) < 0.000001);
    if (exact >= 0) return [...line[exact]];
    const index = measures.findIndex(value => value > measure);
    assert.ok(index > 0, "Linear-reference endpoint outside source");
    const fraction = (measure - measures[index - 1]) / (measures[index] - measures[index - 1]);
    return line[index - 1].map((value, axis) => value + fraction * (line[index][axis] - value));
  };
  return [pointAt(start), ...line.filter((point, index) => measures[index] > start + 0.000001 && measures[index] < end - 0.000001), pointAt(end)];
}

export function mergeIntervals(intervals) {
  const output = [];
  for (const interval of intervals.map(value => [...value]).sort((first, second) => first[0] - second[0])) {
    if (output.length && interval[0] <= output.at(-1)[1] + 0.000001) output.at(-1)[1] = Math.max(output.at(-1)[1], interval[1]);
    else output.push(interval);
  }
  return output;
}

export function pointInPolygon(point, polygon) {
  const insideRing = ring => {
    let inside = false;
    for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index++) {
      const first = ring[index];
      const second = ring[previous];
      if ((first[1] > point[1]) !== (second[1] > point[1])
        && point[0] < (second[0] - first[0]) * (point[1] - first[1]) / (second[1] - first[1]) + first[0]) inside = !inside;
    }
    return inside;
  };
  return insideRing(polygon[0]) && !polygon.slice(1).some(insideRing);
}

export function clipLineToPolygon(line, polygon) {
  const pieces = [];
  for (let index = 1; index < line.length; index += 1) {
    const first = line[index - 1];
    const last = line[index];
    const delta = last.map((value, axis) => value - first[axis]);
    const cuts = [0, 1];
    for (const ring of polygon) for (let edge = 1; edge < ring.length; edge += 1) {
      const start = ring[edge - 1];
      const other = ring[edge].map((value, axis) => value - start[axis]);
      const gap = start.map((value, axis) => value - first[axis]);
      const denominator = delta[0] * other[1] - delta[1] * other[0];
      if (Math.abs(denominator) < 1e-18) continue;
      const fraction = (gap[0] * other[1] - gap[1] * other[0]) / denominator;
      const edgeFraction = (gap[0] * delta[1] - gap[1] * delta[0]) / denominator;
      if (fraction > 0 && fraction < 1 && edgeFraction >= 0 && edgeFraction <= 1) cuts.push(fraction);
    }
    const ordered = [...new Set(cuts)].sort((left, right) => left - right);
    const at = fraction => first.map((value, axis) => value + fraction * delta[axis]);
    for (let cut = 1; cut < ordered.length; cut += 1) {
      if (!pointInPolygon(at((ordered[cut - 1] + ordered[cut]) / 2), polygon)) continue;
      const start = at(ordered[cut - 1]);
      const end = at(ordered[cut]);
      if (distanceMeters(start, end) < 0.0001) continue;
      if (pieces.length && pieces.at(-1).at(-1).every((value, axis) => Math.abs(value - start[axis]) < 1e-12)) pieces.at(-1).push(end);
      else pieces.push([start, end]);
    }
  }
  return pieces;
}

export function directedRoadPath(features, starts, ends) {
  const graph = new Map();
  for (const feature of features) {
    const properties = feature.properties;
    assert.ok([0, 1, -1].includes(properties.sensCir), `Unknown circulation code: ${properties.id}`);
    const start = properties.noNoeudDebut;
    const end = properties.noNoeudFin;
    const edges = properties.sensCir === 1 ? [[start, end, true]] : properties.sensCir === -1 ? [[end, start, false]] : [[start, end, true], [end, start, false]];
    const length = lineMeasures(feature.geometry.coordinates).at(-1);
    for (const [from, to, forward] of edges) {
      if (!graph.has(from)) graph.set(from, []);
      graph.get(from).push({ to, feature, forward, length });
    }
  }
  const targets = new Set(ends);
  const distances = new Map(starts.map(node => [node, 0]));
  const previous = new Map();
  const queue = starts.map(node => ({ node, distance: 0 }));
  let destination = null;
  while (queue.length) {
    queue.sort((first, second) => first.distance - second.distance);
    const current = queue.shift();
    if (current.distance !== distances.get(current.node)) continue;
    if (targets.has(current.node)) { destination = current.node; break; }
    for (const edge of graph.get(current.node) || []) {
      const distance = current.distance + edge.length;
      if (distance >= (distances.get(edge.to) ?? Infinity)) continue;
      distances.set(edge.to, distance);
      previous.set(edge.to, { node: current.node, edge });
      queue.push({ node: edge.to, distance });
    }
  }
  assert.notEqual(destination, null, "No continuous permitted path through the named official roads");
  const nodes = [destination];
  const edges = [];
  while (previous.has(nodes[0])) {
    const step = previous.get(nodes[0]);
    nodes.unshift(step.node);
    edges.unshift({ id: step.edge.feature.properties.id, forward: step.edge.forward, feature: step.edge.feature });
  }
  return { nodes, edges, length: distances.get(destination) };
}

export function directedRoadCorridor(features, starts, ends) {
  const graph = new Map();
  for (const feature of features) {
    const { noNoeudDebut: start, noNoeudFin: end, sensCir: direction } = feature.properties;
    assert.ok([0, 1, -1].includes(direction), "Unknown circulation code");
    const edges = direction === 1 ? [[start, end]] : direction === -1 ? [[end, start]] : [[start, end], [end, start]];
    for (const [from, to] of edges) {
      if (!graph.has(from)) graph.set(from, []);
      graph.get(from).push({ to, feature });
    }
  }
  const targets = new Set(ends);
  const selected = new Map();
  let examined = 0;
  const visit = (node, visited, path) => {
    assert.ok(examined++ < 100000, "Access network too complex; manual review required");
    if (targets.has(node)) {
      path.forEach(feature => selected.set(feature.properties.id, feature));
      return;
    }
    for (const edge of graph.get(node) || []) {
      if (visited.has(edge.to)) continue;
      visited.add(edge.to);
      path.push(edge.feature);
      visit(edge.to, visited, path);
      path.pop();
      visited.delete(edge.to);
    }
  };
  starts.forEach(start => visit(start, new Set([start]), []));
  assert.ok(selected.size, "No verified access corridor");
  return [...selected.values()];
}