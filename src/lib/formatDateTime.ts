/** Local calendar date (not toISOString, which shifts to UTC and can land
 *  on the wrong day depending on the browser's timezone offset). */
export function toIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00`);
  date.setDate(date.getDate() + days);
  return toIso(date);
}

// A rental API may evaluate the submitted date/time server-side without a
// timezone, so a same-timezone "tomorrow" can still land in the past
// there. A 2-day buffer comfortably clears that kind of skew.
export function earliestPickupIso(): string {
  return addDays(toIso(new Date()), 2);
}

/** "2026-10-10T10:00:00" or "...+03:00" -> "10:00". Ignores any offset - the
 *  API echoes back local time at the pickup/dropoff location, not UTC. */
export function formatTime(iso: string): string {
  const match = iso.match(/T(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : iso;
}

/** "2026-10-10T10:00:00" -> "10 Oct" */
export function formatShortDate(iso: string): string {
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return iso;
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const [, , month, day] = match;
  return `${Number(day)} ${months[Number(month) - 1]}`;
}

/** Whole rental days between two ISO datetimes, rounded up. */
export function rentalDays(pickupIso: string, dropoffIso: string): number {
  const pickup = new Date(pickupIso.replace(/([+-]\d{2}:\d{2})$/, ""));
  const dropoff = new Date(dropoffIso.replace(/([+-]\d{2}:\d{2})$/, ""));
  return Math.max(1, Math.round((dropoff.getTime() - pickup.getTime()) / 86400000));
}

/** "2026-09-25" -> "25 Sep 2026", for the date-picker trigger button. */
export function formatLongDate(iso: string): string {
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return iso;
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const [, year, month, day] = match;
  return `${Number(day)} ${months[Number(month) - 1]} ${year}`;
}

export type PriceTier = "low" | "mid" | "high";

/**
 * Illustrative only - Discover Cars has no calendar/price-by-date endpoint,
 * so there's no cheap way to show a real per-day price without running a
 * full offers search (a multi-MB response) for every visible date. This is
 * a day-of-week heuristic instead: weekend pickups genuinely do skew
 * pricier for rental demand generally, but this is NOT the real price for
 * any specific search. Swap this out if/when a real per-day price source
 * exists.
 */
export function heuristicPriceTier(iso: string): PriceTier {
  const day = new Date(`${iso}T00:00:00`).getDay(); // 0=Sun..6=Sat
  if (day === 5 || day === 6) return "high";
  if (day === 0 || day === 1) return "mid";
  return "low";
}
