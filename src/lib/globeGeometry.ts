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
