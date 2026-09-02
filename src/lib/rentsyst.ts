import "server-only";

const AUTH_URL = "https://api-aggregator.rentsyst.com/oauth2/token";
const COMPANY_URL = "https://api-aggregator.rentsyst.com/v1/company";
const RATES_URL = "https://api-aggregator.rentsyst.com/v1/rates";
const BOOKING_URL = "https://api-aggregator.rentsyst.com/v1/booking";
const ORDER_VIEW_URL = "https://api-aggregator.rentsyst.com/v1/order/view";

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.value;
  }

  const clientId = process.env.RENTSYST_CLIENT_ID;
  const clientSecret = process.env.RENTSYST_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("RentSyst credentials are not configured.");
  }

  const form = new FormData();
  form.set("grant_type", "client_credentials");
  form.set("client_id", clientId);
  form.set("client_secret", clientSecret);

  const response = await fetch(AUTH_URL, { method: "POST", body: form });
  if (!response.ok) {
    throw new Error(`RentSyst auth failed: ${response.status}`);
  }

  const data: { access_token: string; expires_in: number } =
    await response.json();

  cachedToken = {
    value: data.access_token,
    // Refresh a minute early to avoid edge-of-expiry failures.
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };

  return cachedToken.value;
}

/** Used by the admin dashboard as a live "is the API reachable" check. */
export async function checkRentSystConnection(): Promise<boolean> {
  try {
    await getAccessToken();
    return true;
  } catch {
    return false;
  }
}

export type RentSystLocation = {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  companyId: number;
  companyName: string;
};

let cachedLocations: { value: RentSystLocation[]; expiresAt: number } | null =
  null;

/**
 * Every pickup location across every company connected to this account.
 * Company/location lists change rarely, so a short in-memory cache avoids
 * re-fetching (a token exchange plus N company lookups) on every page load.
 */
export async function getLocations(): Promise<RentSystLocation[]> {
  if (cachedLocations && cachedLocations.expiresAt > Date.now()) {
    return cachedLocations.value;
  }

  const token = await getAccessToken();

  const companiesResponse = await fetch(COMPANY_URL, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!companiesResponse.ok) {
    throw new Error(`RentSyst company list failed: ${companiesResponse.status}`);
  }
  const companiesBody: { data: { id: number; name: string }[] } =
    await companiesResponse.json();

  const perCompany = await Promise.all(
    companiesBody.data.map(async (company) => {
      const response = await fetch(`${COMPANY_URL}/${company.id}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!response.ok) return [];

      const body: {
        data: {
          company: { id: number; name: string };
          locations: {
            id: number;
            name: string;
            address: string;
            latitude: string;
            longitude: string;
          }[];
        };
      } = await response.json();

      return body.data.locations.map((loc) => ({
        id: loc.id,
        name: loc.name,
        address: loc.address,
        latitude: Number(loc.latitude),
        longitude: Number(loc.longitude),
        companyId: body.data.company.id,
        companyName: body.data.company.name,
      }));
    }),
  );

  const locations = perCompany
    .flat()
    .sort((a, b) => a.name.localeCompare(b.name));

  cachedLocations = { value: locations, expiresAt: Date.now() + 10 * 60 * 1000 };

  return locations;
}

type RentSystOption = {
  id: number;
  name: string;
  price: number;
  price_type: string;
  max_quantity: number;
  total_price: number;
};

type RentSystInsurance = {
  id: number;
  name: string;
  description: string;
  price: number;
  total_price: number;
  price_type: string;
  is_default: boolean | number | null;
};

type RentSystVehicle = {
  vehicle: {
    id: number;
    brand: string;
    mark: string;
    transmission: string;
    seats: number;
    doors: number;
    fuel: string;
    year: number;
    group: string;
    pictures: string[];
  };
  currency: { iso_code: string; symbol: string };
  extras: {
    options: RentSystOption[];
    insurances: RentSystInsurance[];
  };
  prices: { rental: number; delivery: number | null };
  requirements?: { min_driver_age?: number };
  company: { id: number; name: string };
  locations: {
    pickup: { id: number };
    return: { id: number };
  };
};

type RentSystSearchResponse = {
  vehicles: RentSystVehicle[];
  pagination: { totalCount: number; itemsPerPage: string; currentPage: string };
};

export type NormalizedVehicle = {
  id: number;
  name: string;
  category: string;
  transmission: string;
  seats: number;
  doors: number;
  fuel: string;
  image: string | null;
  currencySymbol: string;
  rentalPrice: number;
  cheapestInsurance: { id: number; name: string; price: number } | null;
  ageSurcharge: { name: string; minAge: number; maxAge: number; price: number } | null;
  totalPrice: number;
  minDriverAge: number | null;
  company: string;
  insuranceOptions: {
    id: number;
    name: string;
    price: number;
    description: string;
  }[];
  pickupLocationId: number;
  returnLocationId: number;
};

export type SearchLocationParams = {
  id: number;
  latitude: number;
  longitude: number;
};

export type SearchVehiclesParams = {
  pickupDate: string;
  dropoffDate: string;
  driverAge: number;
  /** Pickup/return location, taken from getLocations(). */
  location: SearchLocationParams;
  /**
   * ISO code, lowercased for the API. RentSyst is the source of truth: it
   * echoes back the currency it actually priced in, and we render that, so an
   * unsupported code falls back to their default instead of mislabelling
   * prices.
   */
  currency?: string;
};

export type SearchVehiclesResult = {
  vehicles: NormalizedVehicle[];
  categories: string[];
  excludedForMinAge: number;
};

function cleanCategory(raw: string): string {
  return raw.replace(/^\/+|\/+$/g, "").trim() || "Other";
}

// Matches option names like "Young Driver (18-21)" and pulls out the age range.
function parseAgeBracket(
  name: string,
): { minAge: number; maxAge: number } | null {
  const match = name.match(/\((\d{1,2})\s*-\s*(\d{1,2})\)/);
  if (!match) return null;
  return { minAge: Number(match[1]), maxAge: Number(match[2]) };
}

function normalizeVehicle(
  entry: RentSystVehicle,
  driverAge: number,
): { normalized: NormalizedVehicle; eligible: boolean } {
  const v = entry.vehicle;
  const minDriverAge = entry.requirements?.min_driver_age ?? null;
  const eligible = minDriverAge === null || driverAge >= minDriverAge;

  const insurances = entry.extras.insurances ?? [];
  const cheapestInsurance = insurances.length
    ? insurances.reduce((min, cur) =>
        cur.total_price < min.total_price ? cur : min,
      )
    : null;

  let ageSurcharge: NormalizedVehicle["ageSurcharge"] = null;
  for (const option of entry.extras.options ?? []) {
    const bracket = parseAgeBracket(option.name);
    if (
      bracket &&
      driverAge >= bracket.minAge &&
      driverAge <= bracket.maxAge
    ) {
      ageSurcharge = {
        name: option.name,
        minAge: bracket.minAge,
        maxAge: bracket.maxAge,
        price: option.total_price,
      };
      break;
    }
  }

  const totalPrice =
    entry.prices.rental +
    (cheapestInsurance?.total_price ?? 0) +
    (ageSurcharge?.price ?? 0);

  return {
    eligible,
    normalized: {
      id: v.id,
      name: `${v.brand} ${v.mark}`,
      category: cleanCategory(v.group),
      transmission: v.transmission,
      seats: v.seats,
      doors: v.doors,
      fuel: v.fuel,
      image: v.pictures?.[0] ?? null,
      currencySymbol: entry.currency?.symbol ?? "€",
      rentalPrice: entry.prices.rental,
      cheapestInsurance: cheapestInsurance
        ? {
            id: cheapestInsurance.id,
            name: cheapestInsurance.name,
            price: cheapestInsurance.total_price,
          }
        : null,
      ageSurcharge,
      totalPrice,
      minDriverAge,
      company: entry.company?.name ?? "",
      insuranceOptions: insurances.map((i) => ({
        id: i.id,
        name: i.name,
        price: i.total_price,
        description: i.description,
      })),
      pickupLocationId: entry.locations.pickup.id,
      returnLocationId: entry.locations.return.id,
    },
  };
}

export async function searchVehicles(
  params: SearchVehiclesParams,
): Promise<SearchVehiclesResult> {
  const token = await getAccessToken();
  const pickupLocation = `${params.location.latitude},${params.location.longitude}`;

  const query = new URLSearchParams({
    per_page: "20",
    pickup_location: pickupLocation,
    return_location: pickupLocation,
    pickup_datetime: `${params.pickupDate} 10:00:00`,
    return_datetime: `${params.dropoffDate} 10:00:00`,
    page: "0",
    order_by: "price",
    pickup_delivery: "0",
    return_delivery: "0",
    currency: (params.currency ?? "EUR").toLowerCase(),
  });

  const response = await fetch(`${RATES_URL}?${query.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!response.ok) {
    const body: { message?: string; errors?: Record<string, string[]> } =
      await response.json().catch(() => ({}));
    const detail = body.errors
      ? Object.values(body.errors).flat().join(" ")
      : body.message;
    throw new Error(
      detail
        ? `RentSyst search failed (${response.status}): ${detail}`
        : `RentSyst search failed: ${response.status}`,
    );
  }

  const data: RentSystSearchResponse = await response.json();

  const eligible: NormalizedVehicle[] = [];
  let excludedForMinAge = 0;

  for (const entry of data.vehicles ?? []) {
    const { normalized, eligible: isEligible } = normalizeVehicle(
      entry,
      params.driverAge,
    );
    if (isEligible) {
      eligible.push(normalized);
    } else {
      excludedForMinAge += 1;
    }
  }

  eligible.sort((a, b) => a.totalPrice - b.totalPrice);

  const categories = Array.from(new Set(eligible.map((v) => v.category))).sort();

  return { vehicles: eligible, categories, excludedForMinAge };
}

export type VehicleDetailsResult = {
  vehicle: NormalizedVehicle;
  eligible: boolean;
};

/**
 * Looks up a single vehicle by id for the booking/detail page, instead of
 * re-running the full search and filtering client-side.
 */
export async function getVehicleDetails(
  vehicleId: number,
  params: SearchVehiclesParams,
): Promise<VehicleDetailsResult | null> {
  const token = await getAccessToken();
  const pickupLocation = `${params.location.latitude},${params.location.longitude}`;
  const pickupLocationId = String(params.location.id);

  const query = new URLSearchParams({
    pickup_location: pickupLocation,
    return_location: pickupLocation,
    pickup_location_id: pickupLocationId,
    return_location_id: pickupLocationId,
    pickup_datetime: `${params.pickupDate} 10:00:00`,
    return_datetime: `${params.dropoffDate} 10:00:00`,
    pickup_delivery: "0",
    return_delivery: "0",
    currency: (params.currency ?? "EUR").toLowerCase(),
  });

  const response = await fetch(
    `${RATES_URL}/${vehicleId}?${query.toString()}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const body: { message?: string; errors?: Record<string, string[]> } =
      await response.json().catch(() => ({}));
    const detail = body.errors
      ? Object.values(body.errors).flat().join(" ")
      : body.message;
    throw new Error(
      detail
        ? `RentSyst vehicle lookup failed (${response.status}): ${detail}`
        : `RentSyst vehicle lookup failed: ${response.status}`,
    );
  }

  const entry: RentSystVehicle = await response.json();
  const { normalized, eligible } = normalizeVehicle(entry, params.driverAge);
  return { vehicle: normalized, eligible };
}

export type CreateBookingParams = {
  vehicleId: number;
  pickupLocationId: number;
  returnLocationId: number;
  pickupDatetime: string; // "YYYY-MM-DD HH:mm:ss"
  returnDatetime: string;
  insuranceId?: number;
  /** Must match the currency the quote was shown in. */
  currency?: string;
  driver: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    birthdate?: string; // YYYY-MM-DD
  };
  comment?: string;
};

export type CreateBookingResult = {
  bookingId: string;
  clientId: number;
  cabinetUrl: string;
};

export async function createBooking(
  params: CreateBookingParams,
): Promise<CreateBookingResult> {
  const token = await getAccessToken();

  const form = new FormData();
  form.set("vehicle_id", String(params.vehicleId));
  form.set("pickup_location_id", String(params.pickupLocationId));
  form.set("return_location_id", String(params.returnLocationId));
  form.set("pickup_datetime", params.pickupDatetime);
  form.set("return_datetime", params.returnDatetime);
  form.set("drivers[0][first_name]", params.driver.firstName);
  form.set("drivers[0][last_name]", params.driver.lastName);
  form.set("drivers[0][email]", params.driver.email);
  form.set("drivers[0][phone]", params.driver.phone);
  if (params.driver.birthdate) {
    form.set("drivers[0][birthdate]", params.driver.birthdate);
  }
  if (params.insuranceId) {
    form.set("extras[insurance]", String(params.insuranceId));
  }
  if (params.comment) {
    form.set("comment", params.comment);
  }
  form.set("pickup_delivery", "0");
  form.set("return_delivery", "0");
  form.set("currency", (params.currency ?? "EUR").toLowerCase());

  const response = await fetch(BOOKING_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  const body: {
    message?: string;
    errors?: Record<string, string[]>;
    data?: { booking_id: string; client_id: number; cabinet_url: string };
  } = await response.json().catch(() => ({}));

  if (!response.ok || !body.data) {
    const detail = body.errors
      ? Object.values(body.errors).flat().join(" ")
      : body.message;
    throw new Error(
      detail
        ? `RentSyst booking failed (${response.status}): ${detail}`
        : `RentSyst booking failed: ${response.status}`,
    );
  }

  return {
    bookingId: body.data.booking_id,
    clientId: body.data.client_id,
    cabinetUrl: body.data.cabinet_url,
  };
}

/**
 * RentSyst's /v1/rates quote never includes taxes, and doesn't reflect
 * mandatory fees (e.g. delivery) that get applied once a booking actually
 * exists - the quoted price and the real invoice can genuinely differ.
 * This looks up the authoritative total straight from the created order so
 * the confirmation screen and the admin log show what was actually charged,
 * not our pre-booking estimate.
 */
export async function getOrderTotal(bookingId: string): Promise<number | null> {
  try {
    const token = await getAccessToken();
    const response = await fetch(
      `${ORDER_VIEW_URL}?id=${encodeURIComponent(bookingId)}`,
      { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
    );
    if (!response.ok) return null;

    const body: { data?: { totals?: { total: number } } } = await response
      .json()
      .catch(() => ({}));
    return body.data?.totals?.total ?? null;
  } catch {
    return null;
  }
}
