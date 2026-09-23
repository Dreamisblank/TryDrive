import "server-only";
import type { PickupLocation } from "./locations";

/**
 * Discover Cars DemandAPI client.
 *
 * Every shape below was captured from real responses (see the curl session
 * used to build this), not just the vendor's endpoint list - the exceptions
 * are called out inline with "unverified:".
 */

const API_BASE = "https://demandapi.discovercars.com";

function authHeaders(): HeadersInit {
  const apiKey = process.env.DISCOVERCARS_API_KEY;
  if (!apiKey) {
    throw new Error("DISCOVERCARS_API_KEY is not configured.");
  }
  return { Authorization: `Bearer ${apiKey}` };
}

async function parseErrorBody(response: Response): Promise<string> {
  const body: { message?: string } = await response.json().catch(() => ({}));
  return body.message ?? response.statusText;
}

// --------------------------------------------------------------------------
// Locations
// --------------------------------------------------------------------------

// Real shape of one /v1/locations/search result, e.g. searching "malaga":
// {"place_id":"...","place":"Malaga Airport (AGP)","region":"Malaga",
//  "country":"Spain","iata":"AGP","lat":0,"lng":0}
// `iata` is "" when the place isn't an airport; `lat`/`lng` can be 0,0 for
// some airport entries (the API resolves those from `iata` at offer-search
// time instead), so a place is usable as long as EITHER iata OR a non-zero
// lat/lng is present.
type DiscoverCarsPlace = {
  place_id: string;
  place: string;
  region: string;
  country: string;
  iata: string;
  lat: number;
  lng: number;
};

function normalizePlace(place: DiscoverCarsPlace): PickupLocation {
  const subtitleParts = [place.region, place.country].filter(
    (part, index, all) => part && all.indexOf(part) === index,
  );

  return {
    id: place.place_id,
    name: place.place,
    subtitle: subtitleParts.length > 0 ? subtitleParts.join(", ") : undefined,
    latitude: place.lat,
    longitude: place.lng,
    iata: place.iata || undefined,
  };
}

/**
 * Type-ahead location search backing the search bar's autocomplete - called
 * per-keystroke via /api/locations, not preloaded, since /v1/locations
 * (the full list, no search) is a ~2MB response covering the whole world.
 */
export async function searchLocations(query: string): Promise<PickupLocation[]> {
  if (query.trim().length < 2) return [];

  const url = new URL(`${API_BASE}/v1/locations/search`);
  url.searchParams.set("term", query.trim());

  const response = await fetch(url, {
    headers: authHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Discover Cars location search failed (${response.status}): ${await parseErrorBody(response)}`,
    );
  }

  const body: { data: DiscoverCarsPlace[] } = await response.json();
  return (body.data ?? []).map(normalizePlace);
}

// --------------------------------------------------------------------------
// Offers
// --------------------------------------------------------------------------

export type OfferSearchParams = {
  location: Pick<PickupLocation, "iata" | "latitude" | "longitude">;
  /** ISO 8601 */
  pickupAt: string;
  dropoffAt: string;
  driverAge: number;
  /** ISO 3166-1 alpha-2, e.g. "GB" - required by the API. */
  driverResidence: string;
  currency: string;
};

// Real shape of one offer from POST /v1/offers / GET /v1/offers/:id.
// Trimmed to the fields this app actually uses - the raw response carries
// more (opening_hours, pickup/dropoff instructions, rating_detailed, etc.)
// that can be added here if a future screen needs them.
type DiscoverCarsOffer = {
  offer_id: string;
  pickup: { pickup_at: string; location: string };
  dropoff: { dropoff_at: string; location: string };
  car: {
    name: string;
    sipp: string;
    category: string;
    image: string | null;
    seats: number;
    doors: number;
    bags: number;
    transmission: string;
    fuel: string;
  };
  supplier: {
    name: string;
    logo: string | null;
    rating: number | null;
    review_count: number | null;
  };
  price: {
    total: number;
    currency: string;
    pay_now: number;
    pay_later: number;
  };
  deposit: { min: number; max: number; currency: string } | null;
  mileage: { unlimited: boolean; included_limit: number | null; unit: string };
  cancellation: { type: string; details?: { hours_before_pickup: number } };
  instant_confirmation: boolean;
  /** Deep link to Discover Cars' own checkout - already carries this
   *  account's affiliate tracking (utm_source, affpartner, a_aid all come
   *  back set to "trydrive"). This is how a booking actually gets
   *  attributed - there's no separate booking-creation call for this
   *  integration tier. */
  url: { web: string; rental_conditions: string };
};

export type NormalizedOffer = {
  offerId: string;
  vehicleName: string;
  category: string;
  transmission: string;
  seats: number;
  fuel: string;
  imageUrl: string | null;
  supplierName: string;
  supplierLogo: string | null;
  supplierRating: number | null;
  supplierReviewCount: number | null;
  pickupAt: string;
  pickupLocationName: string;
  dropoffAt: string;
  dropoffLocationName: string;
  totalPrice: number;
  currency: string;
  freeCancellation: boolean;
  unlimitedMileage: boolean;
  includedMileageLimit: number | null;
  mileageUnit: string;
  depositAmount: number | null;
  depositCurrency: string | null;
  bookingUrl: string;
};

function normalizeOffer(offer: DiscoverCarsOffer): NormalizedOffer {
  return {
    offerId: offer.offer_id,
    vehicleName: offer.car.name,
    category: offer.car.category,
    transmission: offer.car.transmission,
    seats: offer.car.seats,
    fuel: offer.car.fuel,
    imageUrl: offer.car.image,
    supplierName: offer.supplier.name,
    supplierLogo: offer.supplier.logo,
    supplierRating: offer.supplier.rating,
    supplierReviewCount: offer.supplier.review_count,
    pickupAt: offer.pickup.pickup_at,
    pickupLocationName: offer.pickup.location,
    dropoffAt: offer.dropoff.dropoff_at,
    dropoffLocationName: offer.dropoff.location,
    totalPrice: offer.price.total,
    currency: offer.price.currency,
    freeCancellation: offer.cancellation.type === "free",
    unlimitedMileage: offer.mileage.unlimited,
    includedMileageLimit: offer.mileage.included_limit,
    mileageUnit: offer.mileage.unit,
    depositAmount: offer.deposit?.min ?? null,
    depositCurrency: offer.deposit?.currency ?? null,
    bookingUrl: offer.url.web,
  };
}

/** How many offers were seen may be very large (1000+ for a single busy
 *  airport) - the API has no server-side pagination, so callers get
 *  everything back sorted by price; slice for display as needed. */
export async function searchOffers(
  params: OfferSearchParams,
): Promise<NormalizedOffer[]> {
  const pickupLocation = params.location.iata
    ? { iata: params.location.iata }
    : { lat: params.location.latitude, lng: params.location.longitude };

  const response = await fetch(`${API_BASE}/v1/offers`, {
    method: "POST",
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      driver: { residence: params.driverResidence, age: params.driverAge },
      currency: params.currency,
      pickup_at: params.pickupAt,
      dropoff_at: params.dropoffAt,
      pickup_location: pickupLocation,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Discover Cars offer search failed (${response.status}): ${await parseErrorBody(response)}`,
    );
  }

  const body: { data: DiscoverCarsOffer[] } = await response.json();
  return (body.data ?? [])
    .map(normalizeOffer)
    .sort((a, b) => a.totalPrice - b.totalPrice);
}

export async function getOffer(offerId: string): Promise<NormalizedOffer | null> {
  const response = await fetch(`${API_BASE}/v1/offers/${encodeURIComponent(offerId)}`, {
    headers: authHeaders(),
    cache: "no-store",
  });

  if (response.status === 404) return null;

  if (!response.ok) {
    throw new Error(
      `Discover Cars offer lookup failed (${response.status}): ${await parseErrorBody(response)}`,
    );
  }

  const body: { data: DiscoverCarsOffer } = await response.json();
  return normalizeOffer(body.data);
}
