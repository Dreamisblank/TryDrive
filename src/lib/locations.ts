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

const LAST_SEARCH_KEY = "trydrive_last_search";

export type LastSearch = {
  location: PickupLocation;
  pickupDate: string;
  dropoffDate: string;
  driverAge: string;
};

/** Remembers the last search someone actually ran (location, dates, driver
 *  age), so the search bar can pre-fill it when they come back. Browser-only
 *  - callers must only touch this after mount. */
export function saveLastSearch(search: LastSearch): void {
  try {
    localStorage.setItem(LAST_SEARCH_KEY, JSON.stringify(search));
  } catch {
    // Storage unavailable (private browsing, disabled) - non-fatal, the
    // search bar just won't remember it next time.
  }
}

export function getLastSearch(): LastSearch | null {
  try {
    const raw = localStorage.getItem(LAST_SEARCH_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof (parsed as LastSearch).location === "object" &&
      typeof (parsed as LastSearch).location?.id === "string" &&
      typeof (parsed as LastSearch).location?.name === "string" &&
      typeof (parsed as LastSearch).pickupDate === "string" &&
      typeof (parsed as LastSearch).dropoffDate === "string" &&
      typeof (parsed as LastSearch).driverAge === "string"
    ) {
      return parsed as LastSearch;
    }
    return null;
  } catch {
    return null;
  }
}
