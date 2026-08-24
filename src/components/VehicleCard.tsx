import Link from "next/link";
import type { NormalizedVehicle } from "@/lib/rentsyst";

export default function VehicleCard({
  vehicle,
  driverAge,
  pickupDate,
  dropoffDate,
}: {
  vehicle: NormalizedVehicle;
  driverAge: number;
  pickupDate: string;
  dropoffDate: string;
}) {
  const c = vehicle.currencySymbol;
  const bookHref = `/book/${vehicle.id}?${new URLSearchParams({
    pickupDate,
    dropoffDate,
    driverAge: String(driverAge),
  }).toString()}`;

  return (
    <div className="flex flex-col items-center gap-4 rounded-3xl border border-orange-900/5 bg-white/90 p-4 shadow-sm backdrop-blur-sm sm:flex-row">
      <div className="flex h-20 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-orange-50">
        {vehicle.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={vehicle.image}
            alt={vehicle.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-xs text-orange-300">No image</span>
        )}
      </div>

      <div className="flex flex-1 flex-col items-center gap-1 text-center sm:items-start sm:text-left">
        <span className="inline-block rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-700">
          {vehicle.category}
        </span>
        <h3 className="text-lg font-semibold text-slate-900">{vehicle.name}</h3>
        <p className="text-sm text-slate-500">
          {vehicle.transmission} · {vehicle.seats} seats · {vehicle.fuel}
          {vehicle.minDriverAge !== null && ` · Min. age ${vehicle.minDriverAge}+`}
        </p>
        <p className="text-xs text-slate-400">{vehicle.company}</p>
      </div>

      <div className="flex flex-col items-center gap-2 sm:items-end">
        <div className="text-right">
          <div className="text-2xl font-bold text-slate-900">
            {c}
            {vehicle.totalPrice.toFixed(2)}
          </div>
          <div className="text-xs text-slate-500">
            {vehicle.cheapestInsurance
              ? "Total price incl. insurance"
              : "Total price (no insurance offered)"}
          </div>
        </div>
        <Link
          href={bookHref}
          className="rounded-full bg-orange-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-orange-700"
        >
          Book
        </Link>
      </div>
    </div>
  );
}
