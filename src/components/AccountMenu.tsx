"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import SettingsModal, { type SettingsTab } from "./SettingsModal";
import { avatarUrlFor, displayNameFor, initialFor } from "@/lib/profile";

function CarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-[18px] w-[18px]">
      <path
        d="M5 16.5h14M6.5 16.5v1.25a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1V16.5m14 0v1.25a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1V16.5M4 16.5l1.3-5.2a2 2 0 0 1 1.94-1.51h9.52a2 2 0 0 1 1.94 1.51L20 16.5M7 13.5h.01M17 13.5h.01"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-[18px] w-[18px]">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HelpIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-[18px] w-[18px]">
      <path
        d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-[18px] w-[18px]">
      <path
        d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Avatar({
  url,
  initial,
  className,
}: {
  url: string | null;
  initial: string;
  className: string;
}) {
  // Google's avatar URLs can fail (expired link, blocked hotlink, offline).
  // Fall back to the initial rather than leaving an empty circle.
  const [failed, setFailed] = useState(false);

  if (url && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={`${className} object-cover`}
      />
    );
  }
  return (
    <span
      className={`${className} flex items-center justify-center bg-orange-600 font-semibold text-white`}
    >
      {initial}
    </span>
  );
}

const rowClass =
  "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-orange-50 dark:text-slate-200 dark:hover:bg-orange-950/40";

export default function AccountMenu() {
  const { user, profile, configured, openSignIn, signOut } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab | null>(null);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // Nothing to sign in to until the Supabase keys are set.
  if (!configured) return null;

  if (!user) {
    return (
      <button
        type="button"
        onClick={() => openSignIn()}
        className="rounded-full bg-orange-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-orange-700"
      >
        Sign in
      </button>
    );
  }

  const avatarUrl = avatarUrlFor(user);
  const name = displayNameFor(user, profile);
  const initial = initialFor(user, profile);

  function openSettings(tab: SettingsTab) {
    setOpen(false);
    setSettingsTab(tab);
  }

  return (
    <>
      <div ref={wrapperRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label="Account menu"
          className="block h-9 w-9 overflow-hidden rounded-full ring-1 ring-slate-200 transition hover:ring-orange-400 dark:ring-slate-700"
        >
          <Avatar url={avatarUrl} initial={initial} className="h-9 w-9 rounded-full" />
        </button>

        {open && (
          <div
            role="menu"
            className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-orange-900/5 bg-white py-1.5 shadow-xl dark:border-slate-700/60 dark:bg-slate-900"
          >
            <button
              type="button"
              onClick={() => openSettings("account")}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-orange-50 dark:hover:bg-orange-950/40"
            >
              <Avatar
                url={avatarUrl}
                initial={initial}
                className="h-10 w-10 shrink-0 rounded-full"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {name}
                </span>
                <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                  {user.email ?? user.phone}
                </span>
              </span>
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4 text-slate-400">
                <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>

            <div className="my-1.5 h-px bg-slate-100 dark:bg-slate-800" />

            <Link href="/account/cars" onClick={() => setOpen(false)} className={rowClass} role="menuitem">
              <CarIcon />
              Cars
            </Link>
            <button type="button" onClick={() => openSettings("settings")} className={rowClass} role="menuitem">
              <GearIcon />
              Settings
            </button>

            <div className="my-1.5 h-px bg-slate-100 dark:bg-slate-800" />

            <button type="button" onClick={() => openSettings("help")} className={rowClass} role="menuitem">
              <HelpIcon />
              Get help
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                setConfirmLogout(true);
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
            >
              <LogoutIcon />
              Log out
            </button>
          </div>
        )}
      </div>

      {settingsTab && (
        <SettingsModal
          initialTab={settingsTab}
          onClose={() => setSettingsTab(null)}
          onRequestLogout={() => {
            setSettingsTab(null);
            setConfirmLogout(true);
          }}
        />
      )}

      {confirmLogout && (
        <LogoutConfirm
          onCancel={() => setConfirmLogout(false)}
          onConfirm={async () => {
            setConfirmLogout(false);
            await signOut();
            router.push("/");
            router.refresh();
          }}
        />
      )}
    </>
  );
}

function LogoutConfirm({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onCancel} />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="logout-title"
        className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900"
      >
        <div className="px-6 pt-6 pb-5">
          <h2 id="logout-title" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Log out?
          </h2>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            You&apos;ll need to sign back in to book a car and see your trips.
          </p>
        </div>
        <div className="flex justify-end gap-2 bg-slate-50 px-6 py-4 dark:bg-slate-800/60">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}
