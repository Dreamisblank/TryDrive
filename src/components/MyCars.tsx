"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { fetchBookings, type BookingRow } from "@/lib/profile";
import { getCurrency } from "@/lib/currency";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const panel =
  "mt-8 rounded-3xl border border-dashed border-orange-300 bg-white/70 p-10 text-center text-slate-500 backdrop-blur-sm dark:border-orange-800 dark:bg-neutral-900/60 dark:text-neutral-400";

export default function MyCars() {
  const { user, loading, configured, openSignIn } = useAuth();
  const [bookings, setBookings] = useState<BookingRow[] | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !user) {
      // Clearing state because the thing we read from (a signed-in
      // session) has gone away - the case this rule exempts.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBookings(null);
      return;
    }
    let active = true;
    fetchBookings(supabase).then((rows) => {
      if (active) setBookings(rows);
    });
    return () => {
      active = false;
    };
  }, [user]);

  if (!configured) {
    return <div className={panel}>Sign-in isn&apos;t configured yet.</div>;
  }

  if (loading) {
    return <div className={panel}>Loading…</div>;
  }

  if (!user) {
    return (
      <div className={panel}>
        <p>Sign in to see your bookings.</p>
        <button
          type="button"
          onClick={() => openSignIn()}
          className="mt-4 rounded-full bg-orange-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-orange-700"
        >
          Sign in
        </button>
      </div>
    );
  }

  if (bookings === null) {
    return <div className={panel}>Loading your bookings…</div>;
  }

  if (bookings.length === 0) {
    return (
      <div className={panel}>
        No bookings yet. Once you book a car it&apos;ll show up here.
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-3">
      {bookings.map((b) => {
        const symbol = getCurrency(b.currency ?? "EUR").symbol;
        return (
          <div
            key={b.id}
            className="flex flex-col gap-4 rounded-3xl border border-orange-900/5 bg-white/90 p-5 shadow-sm sm:flex-row sm:items-center dark:border-neutral-700/60 dark:bg-neutral-900/80"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-neutral-100">
                  {b.vehicle_name ?? "Vehicle"}
                </h2>
                <span className="rounded-full bg-orange-100 px-2.5 py-0.5 font-mono text-xs font-medium text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
                  {b.booking_ref}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-600 dark:text-neutral-300">
                {formatDate(b.pickup_datetime)} → {formatDate(b.return_datetime)}
              </p>
              {b.pickup_location && (
                <p className="text-sm text-slate-500 dark:text-neutral-400">
                  {b.pickup_location}
                </p>
              )}
              {b.insurance_name && (
                <p className="mt-1 text-xs text-slate-500 dark:text-neutral-400">
                  Insurance: {b.insurance_name}
                </p>
              )}
            </div>

            <div className="text-right">
              <div className="text-2xl font-bold text-slate-900 dark:text-neutral-100">
                {b.total_price == null ? "—" : `${symbol}${Number(b.total_price).toFixed(2)}`}
              </div>
              <div className="text-xs text-slate-500 dark:text-neutral-400">
                Booked {formatDate(b.created_at)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
