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
