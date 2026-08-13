import "server-only";

const AUTH_URL = "https://api-aggregator.rentsyst.com/oauth2/token";
const RATES_URL = "https://api-aggregator.rentsyst.com/v1/rates";

// Demo account inventory only exists around Larnaca, Cyprus.
const DEMO_PICKUP_LOCATION = "34.916,33.620";

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
  cheapestInsurance: { name: string; price: number } | null;
  ageSurcharge: { name: string; minAge: number; maxAge: number; price: number } | null;
  totalPrice: number;
  minDriverAge: number | null;
  company: string;
  insuranceOptions: { name: string; price: number; description: string }[];
};

export type SearchVehiclesParams = {
  pickupDate: string;
  dropoffDate: string;
  driverAge: number;
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
        ? { name: cheapestInsurance.name, price: cheapestInsurance.total_price }
        : null,
      ageSurcharge,
      totalPrice,
      minDriverAge,
      company: entry.company?.name ?? "",
      insuranceOptions: insurances.map((i) => ({
        name: i.name,
        price: i.total_price,
        description: i.description,
      })),
    },
  };
}

export async function searchVehicles(
  params: SearchVehiclesParams,
): Promise<SearchVehiclesResult> {
  const token = await getAccessToken();

  const query = new URLSearchParams({
    per_page: "20",
    pickup_location: DEMO_PICKUP_LOCATION,
    return_location: DEMO_PICKUP_LOCATION,
    pickup_datetime: `${params.pickupDate} 10:00:00`,
    return_datetime: `${params.dropoffDate} 10:00:00`,
    page: "0",
    order_by: "price",
    pickup_delivery: "0",
    return_delivery: "0",
    currency: "eur",
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
