/**
 * Currency selection.
 *
 * The chosen currency is stored in a plain (non-httpOnly) cookie so that both
 * the client picker and the server components that call RentSyst can read it.
 * RentSyst is the source of truth for prices: we pass the code through as its
 * `currency` query param and render back whatever currency it actually
 * returns, so an unsupported code degrades to their default rather than
 * showing wrong numbers.
 */

export const CURRENCY_COOKIE = "trydrive_currency";

export type Currency = {
  code: string;
  symbol: string;
  label: string;
};

export const CURRENCIES: Currency[] = [
  { code: "EUR", symbol: "€", label: "Euro" },
  { code: "GBP", symbol: "£", label: "British Pound" },
  { code: "USD", symbol: "$", label: "US Dollar" },
  { code: "CHF", symbol: "CHF", label: "Swiss Franc" },
  { code: "CAD", symbol: "CA$", label: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", label: "Australian Dollar" },
];

export const DEFAULT_CURRENCY = "EUR";

/** Country code -> currency, for the countries our inventory realistically serves. */
const COUNTRY_TO_CURRENCY: Record<string, string> = {
  GB: "GBP",
  US: "USD",
  CH: "CHF",
  CA: "CAD",
  AU: "AUD",
  NZ: "AUD",
  // Eurozone
  CY: "EUR", IE: "EUR", FR: "EUR", DE: "EUR", ES: "EUR", IT: "EUR",
  PT: "EUR", NL: "EUR", BE: "EUR", AT: "EUR", GR: "EUR", FI: "EUR",
  LU: "EUR", MT: "EUR", SK: "EUR", SI: "EUR", EE: "EUR", LV: "EUR",
  LT: "EUR", HR: "EUR",
};

/**
 * Timezone -> country, used only when the browser locale carries no region
 * (e.g. a bare "en"). Deliberately small: it covers the common cases and
 * anything unlisted just falls back to the default.
 */
const TIMEZONE_TO_COUNTRY: Record<string, string> = {
  "Europe/London": "GB",
  "Europe/Dublin": "IE",
  "Europe/Zurich": "CH",
  "Europe/Paris": "FR",
  "Europe/Berlin": "DE",
  "Europe/Madrid": "ES",
  "Europe/Rome": "IT",
  "Europe/Lisbon": "PT",
  "Europe/Amsterdam": "NL",
  "Europe/Brussels": "BE",
  "Europe/Vienna": "AT",
  "Europe/Athens": "GR",
  "Asia/Nicosia": "CY",
  "America/New_York": "US",
  "America/Chicago": "US",
  "America/Denver": "US",
  "America/Los_Angeles": "US",
  "America/Toronto": "CA",
  "America/Vancouver": "CA",
  "Australia/Sydney": "AU",
  "Australia/Melbourne": "AU",
  "Pacific/Auckland": "NZ",
};

export function isSupportedCurrency(code: string | undefined): boolean {
  return !!code && CURRENCIES.some((c) => c.code === code);
}

export function normalizeCurrency(code: string | undefined): string {
  return isSupportedCurrency(code) ? code! : DEFAULT_CURRENCY;
}

export function getCurrency(code: string): Currency {
  return CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];
}

/**
 * Best-effort guess at the visitor's currency from their own browser settings.
 * Uses no geolocation API and no network call — locale region first, then
 * timezone. Browser-only.
 */
export function detectCurrency(): string {
  if (typeof navigator === "undefined") return DEFAULT_CURRENCY;

  for (const tag of navigator.languages ?? [navigator.language]) {
    const region = tag?.split("-")[1]?.toUpperCase();
    if (region && COUNTRY_TO_CURRENCY[region]) {
      return COUNTRY_TO_CURRENCY[region];
    }
  }

  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const country = TIMEZONE_TO_COUNTRY[tz];
    if (country && COUNTRY_TO_CURRENCY[country]) {
      return COUNTRY_TO_CURRENCY[country];
    }
  } catch {
    // Intl unavailable — fall through to the default.
  }

  return DEFAULT_CURRENCY;
}
