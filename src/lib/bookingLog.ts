import "server-only";
import { promises as fs } from "fs";
import path from "path";

// RentSyst's API has no "list my bookings" endpoint - only a single-order
// lookup by an internal numeric id we don't reliably have. This is our own
// record of what was submitted through this site, kept as a flat file
// since there's no database. It lives outside git (see .gitignore) and is
// only as durable as the server's filesystem between deploys.
const LOG_PATH = path.join(process.cwd(), "data", "bookings.jsonl");

export type BookingLogEntry = {
  timestamp: string;
  bookingId: string;
  clientId: number;
  vehicleId: number;
  vehicleName: string;
  totalPrice: number;
  currencySymbol: string;
  driverName: string;
  driverEmail: string;
  cabinetUrl: string;
};

export async function appendBookingLog(entry: BookingLogEntry): Promise<void> {
  try {
    await fs.mkdir(path.dirname(LOG_PATH), { recursive: true });
    await fs.appendFile(LOG_PATH, JSON.stringify(entry) + "\n", "utf8");
  } catch (err) {
    // Never let logging failure break the actual booking response.
    console.error(
      "Failed to write booking log:",
      err instanceof Error ? err.message : err,
    );
  }
}

export async function readBookingLog(): Promise<BookingLogEntry[]> {
  try {
    const raw = await fs.readFile(LOG_PATH, "utf8");
    return raw
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line) as BookingLogEntry)
      .reverse();
  } catch {
    return [];
  }
}
