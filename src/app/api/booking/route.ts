import { NextResponse } from "next/server";
import { createBooking, getOrderTotal } from "@/lib/rentsyst";
import { getSelectedCurrency } from "@/lib/currencyServer";
import { getCurrentUser } from "@/lib/supabase/server";
import { isAuthConfigured } from "@/lib/supabase/config";
import { appendBookingLog } from "@/lib/bookingLog";

type BookingRequestBody = {
  vehicleId: number;
  pickupLocationId: number;
  returnLocationId: number;
  pickupDatetime: string;
  returnDatetime: string;
  insuranceId?: number;
  vehicleName?: string;
  totalPrice?: number;
  currencySymbol?: string;
  driver: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    birthdate: string;
  };
  comment?: string;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export async function POST(request: Request) {
  let body: Partial<BookingRequestBody>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // Enforce sign-in on the server too: the client-side gate is only UX, and a
  // POST here creates a real order. Skipped entirely while Supabase is
  // unconfigured so the site keeps working as it did before auth existed.
  if (isAuthConfigured()) {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Please sign in to complete your booking." },
        { status: 401 },
      );
    }
  }

  const driver = body.driver;
  const missing: string[] = [];
  if (!body.vehicleId) missing.push("vehicleId");
  if (!body.pickupLocationId) missing.push("pickupLocationId");
  if (!body.returnLocationId) missing.push("returnLocationId");
  if (!isNonEmptyString(body.pickupDatetime)) missing.push("pickupDatetime");
  if (!isNonEmptyString(body.returnDatetime)) missing.push("returnDatetime");
  if (!driver || !isNonEmptyString(driver.firstName)) missing.push("driver.firstName");
  if (!driver || !isNonEmptyString(driver.lastName)) missing.push("driver.lastName");
  if (!driver || !isNonEmptyString(driver.email)) missing.push("driver.email");
  if (!driver || !isNonEmptyString(driver.phone)) missing.push("driver.phone");
  if (!driver || !isNonEmptyString(driver.birthdate))
    missing.push("driver.birthdate");

  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Missing required field(s): ${missing.join(", ")}` },
      { status: 400 },
    );
  }

  try {
    const result = await createBooking({
      vehicleId: Number(body.vehicleId),
      pickupLocationId: Number(body.pickupLocationId),
      returnLocationId: Number(body.returnLocationId),
      pickupDatetime: body.pickupDatetime!,
      returnDatetime: body.returnDatetime!,
      insuranceId: body.insuranceId ? Number(body.insuranceId) : undefined,
      // Read server-side from the same cookie that priced the quote, rather
      // than trusting a currency supplied by the client.
      currency: await getSelectedCurrency(),
      driver: {
        firstName: driver!.firstName,
        lastName: driver!.lastName,
        email: driver!.email,
        phone: driver!.phone,
        birthdate: driver!.birthdate,
      },
      comment: body.comment,
    });

    // RentSyst's quote never includes taxes or the mandatory delivery fee,
    // so the real total is only known once the order exists. Fall back to
    // our pre-booking estimate if the lookup fails for any reason - the
    // booking itself already succeeded, so we shouldn't fail the request
    // over this.
    const confirmedTotal = await getOrderTotal(result.bookingId);
    const totalPrice =
      confirmedTotal ??
      (typeof body.totalPrice === "number" ? body.totalPrice : 0);

    await appendBookingLog({
      timestamp: new Date().toISOString(),
      bookingId: result.bookingId,
      clientId: result.clientId,
      vehicleId: Number(body.vehicleId),
      vehicleName: body.vehicleName || "Unknown vehicle",
      totalPrice,
      currencySymbol: body.currencySymbol || "€",
      driverName: `${driver!.firstName} ${driver!.lastName}`,
      driverEmail: driver!.email,
      cabinetUrl: result.cabinetUrl,
    });

    return NextResponse.json({ ...result, totalPrice });
  } catch (err) {
    console.error(
      "Booking creation failed:",
      err instanceof Error ? err.message : err,
    );
    const message = err instanceof Error ? err.message : "";
    return NextResponse.json(
      {
        error: message.startsWith("RentSyst")
          ? message
          : "Couldn't create the booking. Please try again.",
      },
      { status: 502 },
    );
  }
}
