import { NextResponse } from "next/server";
import { createBooking } from "@/lib/rentsyst";

type BookingRequestBody = {
  vehicleId: number;
  pickupLocationId: number;
  returnLocationId: number;
  pickupDatetime: string;
  returnDatetime: string;
  insuranceId?: number;
  driver: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    birthdate?: string;
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
      driver: {
        firstName: driver!.firstName,
        lastName: driver!.lastName,
        email: driver!.email,
        phone: driver!.phone,
        birthdate: driver!.birthdate,
      },
      comment: body.comment,
    });
    return NextResponse.json(result);
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
