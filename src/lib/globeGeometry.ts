import { feature } from "topojson-client";
import land from "world-atlas/land-110m.json";

type Ring = [number, number][];
type Polygon = Ring[];

const DEG = Math.PI / 180;

export function latLngToVector3(
  lat: number,
  lng: number,
  radius = 1,
): [number, number, number] {
  const latR = lat * DEG;
  const lngR = lng * DEG;
  return [
    radius * Math.cos(latR) * Math.cos(lngR),
    radius * Math.sin(latR),
    radius * Math.cos(latR) * Math.sin(lngR),
  ];
}

export function vector3ToLatLng(
  x: number,
  y: number,
  z: number,
): { lat: number; lng: number } {
  return {
    lat: Math.asin(y) / DEG,
    lng: Math.atan2(z, x) / DEG,
  };
}

// Roughly evenly-spaced points on a sphere (no pole clustering, unlike a
// uniform lat/lng grid).
function fibonacciSpherePoints(count: number): [number, number, number][] {
  const points: [number, number, number][] = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = goldenAngle * i;
    points.push([Math.cos(theta) * radiusAtY, y, Math.sin(theta) * radiusAtY]);
  }
  return points;
}

function pointInRing(lng: number, lat: number, ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersects =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

type Bbox = { minLng: number; maxLng: number; minLat: number; maxLat: number };

function ringBbox(ring: Ring): Bbox {
  let minLng = Infinity;
  let maxLng = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;
  for (const [lng, lat] of ring) {
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }
  return { minLng, maxLng, minLat, maxLat };
}

function pointOnLand(
  lng: number,
  lat: number,
  polygons: Polygon[],
  bboxes: Bbox[],
): boolean {
  for (let p = 0; p < polygons.length; p++) {
    const bbox = bboxes[p];
    if (
      lng < bbox.minLng ||
      lng > bbox.maxLng ||
      lat < bbox.minLat ||
      lat > bbox.maxLat
    ) {
      continue;
    }
    const rings = polygons[p];
    if (!pointInRing(lng, lat, rings[0])) continue;
    let inHole = false;
    for (let h = 1; h < rings.length; h++) {
      if (pointInRing(lng, lat, rings[h])) {
        inHole = true;
        break;
      }
    }
    if (!inHole) return true;
  }
  return false;
}

/**
 * Builds unit-sphere xyz positions for particles landing on continents,
 * sampled from a baked-in low-res coastline dataset (world-atlas, bundled
 * at build time - no runtime network request).
 */
type LandFeatureCollection = {
  features: [{ geometry: { coordinates: Polygon[] } }];
};

export function buildLandParticlePositions(candidateCount: number): Float32Array {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const topology = land as any;
  const geo = feature(
    topology,
    topology.objects.land,
  ) as unknown as LandFeatureCollection;
  const polygons = geo.features[0].geometry.coordinates;
  const bboxes = polygons.map((poly) => ringBbox(poly[0]));

  const candidates = fibonacciSpherePoints(candidateCount);
  const positions: number[] = [];

  for (const [x, y, z] of candidates) {
    const { lat, lng } = vector3ToLatLng(x, y, z);
    if (pointOnLand(lng, lat, polygons, bboxes)) {
      positions.push(x, y, z);
    }
  }

  return new Float32Array(positions);
}

function slerpUnitVectors(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] {
  const dot = Math.min(1, Math.max(-1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
  const theta = Math.acos(dot) * t;
  const relX = b[0] - a[0] * dot;
  const relY = b[1] - a[1] * dot;
  const relZ = b[2] - a[2] * dot;
  const relLen = Math.sqrt(relX * relX + relY * relY + relZ * relZ) || 1;
  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);
  return [
    a[0] * cosT + (relX / relLen) * sinT,
    a[1] * cosT + (relY / relLen) * sinT,
    a[2] * cosT + (relZ / relLen) * sinT,
  ];
}

export type LatLng = { lat: number; lng: number };

function appendArc(
  a: [number, number, number],
  b: [number, number, number],
  segments: number,
  maxHeight: number,
  arcSeed: number,
  out: { positions: number[]; progress: number[]; seed: number[] },
) {
  let prev: [number, number, number] | null = null;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const [sx, sy, sz] = slerpUnitVectors(a, b, t);
    const height = 1 + maxHeight * Math.sin(Math.PI * t);
    const point: [number, number, number] = [sx * height, sy * height, sz * height];

    if (prev) {
      out.positions.push(prev[0], prev[1], prev[2], point[0], point[1], point[2]);
      out.progress.push((i - 1) / segments, t);
      out.seed.push(arcSeed, arcSeed);
    }
    prev = point;
  }
}

/**
 * Builds a single LineSegments-ready buffer set for great-circle arcs
 * between random pairs of airports (not tied to any single origin), each
 * lifted above the sphere surface. All arcs share one geometry (one draw
 * call); aProgress (0-1 along the arc) and aSeed (per-arc phase offset)
 * let a shader animate a traveling pulse along each line without any
 * per-frame CPU work.
 */
export function buildRandomFlightArcs(
  airports: LatLng[],
  arcCount: number,
  segments = 48,
  maxHeight = 0.22,
): { positions: Float32Array; progress: Float32Array; seed: Float32Array } {
  const out = { positions: [] as number[], progress: [] as number[], seed: [] as number[] };
  const usedPairs = new Set<string>();
  let created = 0;
  let attempts = 0;

  while (created < arcCount && attempts < arcCount * 20) {
    attempts++;
    const i = Math.floor(Math.random() * airports.length);
    const j = Math.floor(Math.random() * airports.length);
    if (i === j) continue;
    const key = i < j ? `${i}-${j}` : `${j}-${i}`;
    if (usedPairs.has(key)) continue;
    usedPairs.add(key);

    const a = latLngToVector3(airports[i].lat, airports[i].lng, 1);
    const b = latLngToVector3(airports[j].lat, airports[j].lng, 1);
    appendArc(a, b, segments, maxHeight, created / arcCount, out);
    created++;
  }

  return {
    positions: new Float32Array(out.positions),
    progress: new Float32Array(out.progress),
    seed: new Float32Array(out.seed),
  };
}
