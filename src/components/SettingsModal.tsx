"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { useTheme } from "./ThemeProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  avatarUrlFor,
  displayNameFor,
  fetchBookings,
  initialFor,
  profileCompletion,
  updateProfile,
  type BookingRow,
  type Profile,
} from "@/lib/profile";
import {
  CURRENCIES,
  CURRENCY_COOKIE,
  DEFAULT_CURRENCY,
  getCurrency,
  normalizeCurrency,
} from "@/lib/currency";
import type { ThemePreference } from "@/lib/theme";

export type SettingsTab =
  | "account"
  | "details"
  | "notifications"
  | "settings"
  | "help";

const TABS: { id: SettingsTab; label: string }[] = [
  { id: "account", label: "Account" },
  { id: "details", label: "Details" },
  { id: "notifications", label: "Notifications" },
  { id: "settings", label: "Settings" },
];

const card =
  "rounded-2xl border border-slate-200 bg-white dark:border-slate-700/60 dark:bg-slate-900";
const label = "text-xs font-medium text-slate-500 dark:text-slate-400";
const input =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-orange-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

export default function SettingsModal({
  initialTab = "account",
  onClose,
  onRequestLogout,
}: {
  initialTab?: SettingsTab;
  onClose: () => void;
  onRequestLogout: () => void;
}) {
  const [tab, setTab] = useState<SettingsTab>(initialTab);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        className="relative flex h-[min(90vh,640px)] w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900"
      >
        {/* Sidebar */}
        <nav className="flex w-48 shrink-0 flex-col justify-between border-r border-slate-200 bg-slate-50/60 p-3 dark:border-slate-700/60 dark:bg-slate-800/40">
          <div className="space-y-0.5">
            <h2 className="px-3 pt-2 pb-3 text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Settings
            </h2>
            {TABS.map((t) => (
              <SidebarButton
                key={t.id}
                active={tab === t.id}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </SidebarButton>
            ))}
          </div>

          <div className="space-y-0.5">
            <SidebarButton active={tab === "help"} onClick={() => setTab("help")}>
              Get help
            </SidebarButton>
            <button
              type="button"
              onClick={onRequestLogout}
              className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
            >
              Log out
            </button>
          </div>
        </nav>

        {/* Panel */}
        {/* Extra top padding (vs. the p-6 used on the other sides) clears
            the close button below, which sits at top-3 - without it, the
            first row of content overlapped the button's hitbox. */}
        <div className="flex-1 overflow-y-auto px-6 pt-14 pb-6">
          {tab === "account" && <AccountPanel onGoToDetails={() => setTab("details")} />}
          {tab === "details" && <DetailsPanel />}
          {tab === "notifications" && <NotificationsPanel />}
          {tab === "settings" && <SettingsPanel />}
          {tab === "help" && <HelpPanel />}
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-4 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
            <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function SidebarButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${
        active
          ? "bg-orange-100 font-semibold text-orange-800 dark:bg-orange-900/40 dark:text-orange-300"
          : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
      }`}
    >
      {children}
    </button>
  );
}

/* -------------------------------------------------------------- Account -- */

function AccountPanel({ onGoToDetails }: { onGoToDetails: () => void }) {
  const { user, profile } = useAuth();
  const [bookings, setBookings] = useState<BookingRow[] | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !user) return;
    let active = true;
    fetchBookings(supabase).then((rows) => {
      if (active) setBookings(rows);
    });
    return () => {
      active = false;
    };
  }, [user]);

  const completion = profileCompletion(profile);

  // Totals are only meaningful within a single currency, so group by it
  // rather than adding pounds to euros.
  const totals = useMemo(() => {
    const byCurrency = new Map<string, number>();
    for (const b of bookings ?? []) {
      if (b.total_price == null) continue;
      const code = b.currency ?? DEFAULT_CURRENCY;
      byCurrency.set(code, (byCurrency.get(code) ?? 0) + Number(b.total_price));
    }
    return [...byCurrency.entries()];
  }, [bookings]);

  return (
    <div className="space-y-5">
      <div className={`${card} flex items-center gap-4 p-5`}>
        {avatarUrlFor(user) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrlFor(user)!}
            alt=""
            referrerPolicy="no-referrer"
            className="h-14 w-14 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-600 text-lg font-semibold text-white">
            {initialFor(user, profile)}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">
            {displayNameFor(user, profile)}
          </p>
          <p className="truncate text-sm text-slate-500 dark:text-slate-400">
            {user?.email ?? user?.phone}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className={`${card} p-4`}>
          <p className={label}>Total spent</p>
          <p className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">
            {totals.length === 0
              ? "—"
              : totals
                  .map(([code, sum]) => `${getCurrency(code).symbol}${sum.toFixed(2)}`)
                  .join(" · ")}
          </p>
        </div>
        <div className={`${card} p-4`}>
          <p className={label}>Bookings</p>
          <p className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">
            {bookings === null ? "—" : bookings.length}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onGoToDetails}
        className={`${card} flex w-full items-center gap-4 p-4 text-left transition hover:border-orange-300 dark:hover:border-orange-700`}
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
            <rect x="3" y="5" width="18" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
            <path d="M7 10h4M7 14h7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </span>
        <span className="flex-1">
          <span className="block text-sm font-semibold text-slate-900 dark:text-slate-100">
            Add driver details
          </span>
          <span className="block text-xs text-slate-500 dark:text-slate-400">
            {completion}% complete
          </span>
        </span>
        <span className="text-sm font-medium text-orange-700 dark:text-orange-400">
          {completion === 100 ? "View" : "Complete"}
        </span>
      </button>
    </div>
  );
}

/* -------------------------------------------------------------- Details -- */

const DETAIL_GROUPS: {
  heading: string;
  fields: { key: keyof Profile; label: string; type?: string }[];
}[] = [
  {
    heading: "Personal information",
    fields: [
      { key: "full_name", label: "Legal name" },
      { key: "date_of_birth", label: "Date of birth", type: "date" },
      { key: "gender", label: "Gender" },
      { key: "phone", label: "Phone number", type: "tel" },
    ],
  },
  {
    heading: "Driving licence",
    fields: [
      { key: "licence_number", label: "Licence number" },
      { key: "licence_country", label: "Issuing country" },
      { key: "licence_expiry", label: "Expiry", type: "date" },
    ],
  },
  {
    heading: "Passport",
    fields: [
      { key: "passport_number", label: "Passport number" },
      { key: "passport_country", label: "Passport country" },
      { key: "passport_expiry", label: "Passport expiry", type: "date" },
    ],
  },
];

function DetailsPanel() {
  const { user, profile, refreshProfile } = useAuth();
  const [draft, setDraft] = useState<Partial<Profile>>({});
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const value = (key: keyof Profile) =>
    (draft[key] as string | undefined) ??
    ((profile?.[key] as string | null) ?? "");

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !user) return;

    setSaving(true);
    setStatus(null);
    // Blank date inputs must go back as null, not "", or Postgres rejects them.
    const patch = Object.fromEntries(
      Object.entries(draft).map(([k, v]) => [k, v === "" ? null : v]),
    );
    const { error } = await updateProfile(supabase, user.id, patch);
    setSaving(false);

    if (error) {
      setStatus(
        error.includes("relation") || error.includes("does not exist")
          ? "The database tables aren't set up yet — run supabase/schema.sql."
          : error,
      );
      return;
    }
    setDraft({});
    setStatus("Saved.");
    await refreshProfile();
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {DETAIL_GROUPS.map((group) => (
        <div key={group.heading}>
          <p className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
            {group.heading}
          </p>
          <div className={`${card} divide-y divide-slate-100 dark:divide-slate-800`}>
            {group.fields.map((f) => (
              <div key={String(f.key)} className="flex items-center gap-4 p-3.5">
                <label className={`${label} w-40 shrink-0`} htmlFor={String(f.key)}>
                  {f.label}
                </label>
                <input
                  id={String(f.key)}
                  type={f.type ?? "text"}
                  value={value(f.key)}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, [f.key]: e.target.value }))
                  }
                  className={input}
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving || Object.keys(draft).length === 0}
          className="rounded-full bg-orange-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
        {status && (
          <p className="text-sm text-slate-500 dark:text-slate-400">{status}</p>
        )}
      </div>
    </form>
  );
}

/* -------------------------------------------------------- Notifications -- */

const NOTIFICATIONS: { key: keyof Profile; title: string; description: string }[] = [
  {
    key: "notify_booking_email",
    title: "Booking confirmations",
    description: "Your reference and pickup details after you book.",
  },
  {
    key: "notify_price_alerts",
    title: "Price alerts",
    description: "Price changes on cars and routes you're watching.",
  },
  {
    key: "notify_marketing",
    title: "Marketing emails",
    description: "Product news, offers and travel tips. We never share your email.",
  },
];

function NotificationsPanel() {
  const { user, profile, refreshProfile } = useAuth();
  const [pending, setPending] = useState<keyof Profile | null>(null);

  async function toggle(key: keyof Profile, next: boolean) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !user) return;
    setPending(key);
    await updateProfile(supabase, user.id, { [key]: next } as Partial<Profile>);
    await refreshProfile();
    setPending(null);
  }

  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
        Email
      </p>
      <div className={`${card} divide-y divide-slate-100 dark:divide-slate-800`}>
        {NOTIFICATIONS.map((n) => {
          const on = Boolean(profile?.[n.key]);
          return (
            <div key={String(n.key)} className="flex items-center gap-4 p-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {n.title}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {n.description}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={on}
                aria-label={n.title}
                disabled={pending === n.key}
                onClick={() => toggle(n.key, !on)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-50 ${
                  on ? "bg-orange-600" : "bg-slate-300 dark:bg-slate-700"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                    on ? "left-[22px]" : "left-0.5"
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- Settings -- */

const THEME_OPTIONS: { id: ThemePreference; label: string }[] = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
  { id: "auto", label: "Sunset" },
  { id: "system", label: "System" },
];

function SettingsPanel() {
  const { user, signOut } = useAuth();
  const { preference, resolved, setPreference } = useTheme();
  const router = useRouter();
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const match = document.cookie.match(
      new RegExp(`(?:^|; )${CURRENCY_COOKIE}=([^;]*)`),
    );
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrency(normalizeCurrency(match ? decodeURIComponent(match[1]) : undefined));
  }, []);

  function chooseCurrency(code: string) {
    document.cookie = `${CURRENCY_COOKIE}=${code}; path=/; max-age=31536000; SameSite=Lax`;
    setCurrency(code);
    router.refresh();
  }

  async function handleDelete() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setDeleting(true);
    setError(null);
    const { error } = await supabase.rpc("delete_own_account");
    if (error) {
      setDeleting(false);
      setError(
        error.message.includes("does not exist")
          ? "Account deletion isn't set up yet — run supabase/schema.sql."
          : error.message,
      );
      return;
    }
    await signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className={`${card} divide-y divide-slate-100 dark:divide-slate-800`}>
        <div className="flex items-center gap-4 p-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Theme</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {preference === "auto"
                ? `Following your local sunset — currently ${resolved}.`
                : "How TryDrive looks on this device."}
            </p>
          </div>
          <div className="flex rounded-full bg-slate-100 p-0.5 dark:bg-slate-800">
            {THEME_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setPreference(opt.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  preference === opt.id
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 p-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Currency</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Used to price every car you search.
            </p>
          </div>
          <select
            value={currency}
            onChange={(e) => chooseCurrency(e.target.value)}
            aria-label="Currency"
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.symbol} {c.code}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-4 p-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Account ID</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Share with support to identify your account.
            </p>
          </div>
          <code className="font-mono text-xs text-slate-400 dark:text-slate-500">
            {user?.id.slice(0, 8).toUpperCase()}
          </code>
        </div>
      </div>

      <div className={`${card} p-4`}>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-red-600 dark:text-red-400">
              Delete account
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Removes your profile and booking history. Cannot be undone.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setConfirmDelete((v) => !v)}
            className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            Delete
          </button>
        </div>

        {confirmDelete && (
          <div className="mt-4 rounded-xl bg-red-50 p-4 dark:bg-red-950/30">
            <p className="text-sm text-red-800 dark:text-red-300">
              This permanently deletes your account. Bookings already made with
              the rental company are not cancelled — contact them directly.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-full bg-red-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                {deleting ? "Deleting…" : "Yes, delete my account"}
              </button>
            </div>
          </div>
        )}

        {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- Help -- */

function HelpPanel() {
  return (
    <div className="space-y-4">
      <div className={`${card} p-6`}>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Get help
        </h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Questions about a booking, a refund or your account? Email us and
          we&apos;ll get back to you.
        </p>
        <a
          href="mailto:help@trydrive.co.uk"
          className="mt-4 inline-block rounded-full bg-orange-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-orange-700"
        >
          help@trydrive.co.uk
        </a>
      </div>

      <div className={`${card} p-6`}>
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
          Already booked?
        </p>
        <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
          Changes and cancellations are handled by the rental company that owns
          the car, not by TryDrive. Your booking reference is on the Cars page.
        </p>
      </div>
    </div>
  );
}
