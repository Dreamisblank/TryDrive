import "server-only";

import { cookies } from "next/headers";
import { CURRENCY_COOKIE, normalizeCurrency } from "./currency";

/**
 * The visitor's chosen currency, for pages that price against RentSyst.
 * Kept out of `currency.ts` so that module stays importable from client
 * components.
 */
export async function getSelectedCurrency(): Promise<string> {
  const cookieStore = await cookies();
  return normalizeCurrency(cookieStore.get(CURRENCY_COOKIE)?.value);
}
