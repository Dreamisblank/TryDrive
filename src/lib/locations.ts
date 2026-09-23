/**
 * Provider-agnostic pickup location shape for the search bar. Discover
 * Cars' locations are geographic points (airports/cities) shared across
 * many suppliers - offers, not locations, carry the supplier name - so
 * unlike the old RentSyst shape there's no per-location company here.
 */
export type PickupLocation = {
  id: string;
  name: string;
  /** Secondary line for disambiguation, e.g. "Malaga, Spain". */
  subtitle?: string;
  latitude?: number;
  longitude?: number;
  /** IATA airport code, when the place is an airport. Preferred over
   *  lat/lng for offer search since some airport entries carry 0,0. */
  iata?: string;
};

const LAST_LOCATION_KEY = "trydrive_last_location";

/** Remembers the last location someone actually searched, so the search
 *  bar can pre-fill it when they come back to the homepage. Browser-only -
 *  callers must only touch this after mount. */
export function saveLastLocation(location: PickupLocation): void {
  try {
    localStorage.setItem(LAST_LOCATION_KEY, JSON.stringify(location));
  } catch {
    // Storage unavailable (private browsing, disabled) - non-fatal, the
    // search bar just won't remember it next time.
  }
}

export function getLastLocation(): PickupLocation | null {
  try {
    const raw = localStorage.getItem(LAST_LOCATION_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof (parsed as PickupLocation).id === "string" &&
      typeof (parsed as PickupLocation).name === "string"
    ) {
      return parsed as PickupLocation;
    }
    return null;
  } catch {
    return null;
  }
}
