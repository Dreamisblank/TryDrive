/**
 * Local sunrise/sunset, used to flip the site into dark mode after dark.
 *
 * Coordinates come from the browser's IANA timezone rather than the
 * Geolocation API: no permission prompt, no network request, and no location
 * data ever leaves the device. A timezone is only accurate to a few hundred
 * miles, which is far more precision than "has the sun set?" needs.
 */

/** Approximate centre of each timezone's populated area: [lat, lng]. */
const TIMEZONE_COORDS: Record<string, [number, number]> = {
  // Europe
  "Europe/London": [51.51, -0.13],
  "Europe/Dublin": [53.35, -6.26],
  "Europe/Lisbon": [38.72, -9.14],
  "Europe/Madrid": [40.42, -3.7],
  "Europe/Paris": [48.86, 2.35],
  "Europe/Brussels": [50.85, 4.35],
  "Europe/Amsterdam": [52.37, 4.9],
  "Europe/Berlin": [52.52, 13.4],
  "Europe/Zurich": [47.38, 8.54],
  "Europe/Vienna": [48.21, 16.37],
  "Europe/Rome": [41.9, 12.5],
  "Europe/Prague": [50.08, 14.44],
  "Europe/Warsaw": [52.23, 21.01],
  "Europe/Stockholm": [59.33, 18.07],
  "Europe/Oslo": [59.91, 10.75],
  "Europe/Copenhagen": [55.68, 12.57],
  "Europe/Helsinki": [60.17, 24.94],
  "Europe/Athens": [37.98, 23.73],
  "Europe/Bucharest": [44.43, 26.11],
  "Europe/Budapest": [47.5, 19.04],
  "Europe/Istanbul": [41.01, 28.98],
  "Europe/Moscow": [55.76, 37.62],
  "Europe/Kyiv": [50.45, 30.52],
  "Atlantic/Canary": [28.29, -16.62],
  "Asia/Nicosia": [35.17, 33.36],
  "Asia/Famagusta": [35.12, 33.94],

  // Americas
  "America/New_York": [40.71, -74.01],
  "America/Detroit": [42.33, -83.05],
  "America/Toronto": [43.65, -79.38],
  "America/Montreal": [45.5, -73.57],
  "America/Chicago": [41.88, -87.63],
  "America/Winnipeg": [49.9, -97.14],
  "America/Denver": [39.74, -104.99],
  "America/Edmonton": [53.55, -113.49],
  "America/Phoenix": [33.45, -112.07],
  "America/Los_Angeles": [34.05, -118.24],
  "America/Vancouver": [49.28, -123.12],
  "America/Anchorage": [61.22, -149.9],
  "America/Mexico_City": [19.43, -99.13],
  "America/Bogota": [4.71, -74.07],
  "America/Lima": [-12.05, -77.04],
  "America/Sao_Paulo": [-23.55, -46.63],
  "America/Argentina/Buenos_Aires": [-34.6, -58.38],
  "America/Santiago": [-33.45, -70.67],
  "Pacific/Honolulu": [21.31, -157.86],

  // Africa & Middle East
  "Africa/Casablanca": [33.57, -7.59],
  "Africa/Lagos": [6.52, 3.38],
  "Africa/Cairo": [30.04, 31.24],
  "Africa/Nairobi": [-1.29, 36.82],
  "Africa/Johannesburg": [-26.2, 28.05],
  "Asia/Jerusalem": [31.77, 35.21],
  "Asia/Dubai": [25.2, 55.27],
  "Asia/Riyadh": [24.71, 46.68],
  "Asia/Tehran": [35.69, 51.39],

  // Asia & Oceania
  "Asia/Karachi": [24.86, 67.01],
  "Asia/Kolkata": [19.08, 72.88],
  "Asia/Calcutta": [19.08, 72.88],
  "Asia/Dhaka": [23.81, 90.41],
  "Asia/Bangkok": [13.76, 100.5],
  "Asia/Jakarta": [-6.21, 106.85],
  "Asia/Singapore": [1.35, 103.82],
  "Asia/Kuala_Lumpur": [3.14, 101.69],
  "Asia/Manila": [14.6, 120.98],
  "Asia/Hong_Kong": [22.32, 114.17],
  "Asia/Shanghai": [31.23, 121.47],
  "Asia/Taipei": [25.03, 121.57],
  "Asia/Seoul": [37.57, 126.98],
  "Asia/Tokyo": [35.68, 139.69],
  "Australia/Perth": [-31.95, 115.86],
  "Australia/Adelaide": [-34.93, 138.6],
  "Australia/Brisbane": [-27.47, 153.03],
  "Australia/Melbourne": [-37.81, 144.96],
  "Australia/Sydney": [-33.87, 151.21],
  "Pacific/Auckland": [-36.85, 174.76],
};

export type SunTimes = { sunrise: Date; sunset: Date };

function toJulian(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5;
}

function fromJulian(julian: number): Date {
  return new Date((julian - 2440587.5) * 86400000);
}

/**
 * Sunrise and sunset for a given date and place, via the standard sunrise
 * equation. Returns null inside the polar circles when the sun doesn't cross
 * the horizon at all that day, so callers must handle that.
 */
export function getSunTimes(
  date: Date,
  lat: number,
  lng: number,
): SunTimes | null {
  const rad = Math.PI / 180;

  const n = Math.round(toJulian(date) - 2451545.0 + 0.0008);
  const meanSolarNoon = n + 0.0009 - lng / 360;

  const meanAnomaly = (357.5291 + 0.98560028 * meanSolarNoon) % 360;
  const center =
    1.9148 * Math.sin(meanAnomaly * rad) +
    0.02 * Math.sin(2 * meanAnomaly * rad) +
    0.0003 * Math.sin(3 * meanAnomaly * rad);

  const eclipticLng = (meanAnomaly + center + 180 + 102.9372) % 360;

  const transit =
    2451545.0 +
    meanSolarNoon +
    0.0053 * Math.sin(meanAnomaly * rad) -
    0.0069 * Math.sin(2 * eclipticLng * rad);

  const sinDeclination = Math.sin(eclipticLng * rad) * Math.sin(23.44 * rad);
  const cosDeclination = Math.cos(Math.asin(sinDeclination));

  // -0.833° accounts for atmospheric refraction and the sun's disc.
  const cosHourAngle =
    (Math.sin(-0.833 * rad) - Math.sin(lat * rad) * sinDeclination) /
    (Math.cos(lat * rad) * cosDeclination);

  // Polar day or polar night: no sunrise/sunset today.
  if (cosHourAngle > 1 || cosHourAngle < -1) return null;

  const hourAngle = Math.acos(cosHourAngle) / rad;

  return {
    sunrise: fromJulian(transit - hourAngle / 360),
    sunset: fromJulian(transit + hourAngle / 360),
  };
}

/** Approximate coordinates for the browser's timezone, if we know it. */
export function getLocalCoords(): [number, number] | null {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return TIMEZONE_COORDS[tz] ?? null;
  } catch {
    return null;
  }
}

export type DarkWindow = {
  isDark: boolean;
  /** When the current light/dark state next flips, if known. */
  nextChange: Date | null;
};

/**
 * Whether it's currently dark where the user is, plus when that next changes
 * so the caller can schedule a flip without polling.
 *
 * Returns null when we can't tell (unknown timezone, or polar day/night), so
 * the caller can fall back to the OS preference rather than guessing.
 */
export function getDarkWindow(now: Date = new Date()): DarkWindow | null {
  const coords = getLocalCoords();
  if (!coords) return null;

  const [lat, lng] = coords;
  const today = getSunTimes(now, lat, lng);
  if (!today) return null;

  if (now < today.sunrise) {
    // Before dawn: still dark, flips light at sunrise.
    return { isDark: true, nextChange: today.sunrise };
  }
  if (now < today.sunset) {
    // Daytime: flips dark at sunset.
    return { isDark: false, nextChange: today.sunset };
  }

  // After sunset: dark until tomorrow's sunrise.
  const tomorrow = getSunTimes(
    new Date(now.getTime() + 86400000),
    lat,
    lng,
  );
  return { isDark: true, nextChange: tomorrow?.sunrise ?? null };
}
