import type { Metadata } from "next";
import AdminSignOutButton from "@/components/AdminSignOutButton";
import { checkRentSystConnection } from "@/lib/rentsyst";
import { readBookingLog } from "@/lib/bookingLog";

export const metadata: Metadata = {
  title: "Admin — TryDrive",
  robots: { index: false, follow: false },
};

function formatTimestamp(iso: string) {
  const date = new Date(iso);
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminDashboardPage() {
  const [connected, bookings] = await Promise.all([
    checkRentSystConnection(),
    readBookingLog(),
  ]);

  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100">
      <header className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
        <h1 className="text-base font-semibold">TryDrive Admin</h1>
        <AdminSignOutButton />
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <div className="text-xs font-medium tracking-wide text-slate-500 uppercase">
              RentSyst API
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${
                  connected ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <span className="text-lg font-semibold">
                {connected ? "Connected" : "Unreachable"}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <div className="text-xs font-medium tracking-wide text-slate-500 uppercase">
              Bookings logged
            </div>
            <div className="mt-2 text-lg font-semibold">{bookings.length}</div>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-wide text-slate-400 uppercase">
            Recent bookings
          </h2>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Logged locally by this app when a booking is created - RentSyst&apos;s
          API doesn&apos;t offer a way to list all bookings. This log lives on
          the server&apos;s filesystem and may reset on redeploy.
        </p>

        {bookings.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-slate-800 bg-slate-900/50 p-10 text-center text-slate-500">
            No bookings logged yet.
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-900 text-xs tracking-wide text-slate-400 uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Time</th>
                  <th className="px-4 py-3 font-medium">Booking ID</th>
                  <th className="px-4 py-3 font-medium">Vehicle</th>
                  <th className="px-4 py-3 font-medium">Driver</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Portal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {bookings.map((b) => (
                  <tr key={b.bookingId + b.timestamp}>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-400">
                      {formatTimestamp(b.timestamp)}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-200">
                      {b.bookingId}
                    </td>
                    <td className="px-4 py-3 text-slate-200">{b.vehicleName}</td>
                    <td className="px-4 py-3 text-slate-400">
                      {b.driverName}
                      <div className="text-xs text-slate-500">
                        {b.driverEmail}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-200">
                      {b.currencySymbol}
                      {b.totalPrice.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={b.cabinetUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-400 hover:text-blue-300"
                      >
                        Open ↗
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
