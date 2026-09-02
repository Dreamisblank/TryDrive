"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Step = "providers" | "phone" | "phone-code" | "email" | "email-sent";

const fieldClass =
  "w-full rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-neutral-100 outline-none transition focus:border-orange-400";

const providerButtonClass =
  "flex w-full items-center gap-3 rounded-2xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-3.5 text-left text-[15px] font-medium text-slate-900 dark:text-neutral-100 transition hover:border-orange-300 dark:hover:border-orange-700 hover:bg-orange-50/60 dark:hover:bg-orange-950/30 disabled:cursor-not-allowed disabled:opacity-60";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className="h-5 w-5">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-orange-500">
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-3.5 w-3.5">
        <path
          d="M12 3c-4.97 0-9 3.36-9 7.5 0 2.36 1.31 4.46 3.36 5.83-.14 1.2-.6 2.3-1.32 3.19a.4.4 0 0 0 .35.66c1.9-.24 3.4-1 4.42-1.78.71.13 1.44.2 2.19.2 4.97 0 9-3.36 9-7.5S16.97 3 12 3Z"
          fill="#fff"
        />
      </svg>
    </span>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5 text-slate-700 dark:text-neutral-300">
      <rect
        x="2.75"
        y="4.75"
        width="18.5"
        height="14.5"
        rx="2.75"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="m3.5 7.5 7.6 5.2a1.6 1.6 0 0 0 1.8 0l7.6-5.2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function AuthModal({
  onClose,
  onSignedIn,
}: {
  onClose: () => void;
  onSignedIn: () => void;
}) {
  const pathname = usePathname();
  const [step, setStep] = useState<Step>("providers");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    // Stop the page behind the modal from scrolling.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  const withSupabase = useCallback(
    async (fn: (client: NonNullable<ReturnType<typeof getSupabaseBrowserClient>>) => Promise<void>) => {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        setError("Sign-in isn't configured yet.");
        return;
      }
      setBusy(true);
      setError(null);
      try {
        await fn(supabase);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Something went wrong. Try again.",
        );
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  async function handleGoogle() {
    await withSupabase(async (supabase) => {
      const next = encodeURIComponent(pathname || "/");
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${next}`,
        },
      });
      if (error) throw new Error(error.message);
      // On success the browser navigates away to Google.
    });
  }

  async function handleSendPhoneCode(event: React.FormEvent) {
    event.preventDefault();
    await withSupabase(async (supabase) => {
      const { error } = await supabase.auth.signInWithOtp({ phone });
      if (error) throw new Error(error.message);
      setStep("phone-code");
    });
  }

  async function handleVerifyPhoneCode(event: React.FormEvent) {
    event.preventDefault();
    await withSupabase(async (supabase) => {
      const { error } = await supabase.auth.verifyOtp({
        phone,
        token: code,
        type: "sms",
      });
      if (error) throw new Error(error.message);
      onSignedIn();
    });
  }

  async function handleSendMagicLink(event: React.FormEvent) {
    event.preventDefault();
    await withSupabase(async (supabase) => {
      const next = encodeURIComponent(pathname || "/");
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${next}`,
        },
      });
      if (error) throw new Error(error.message);
      setStep("email-sent");
    });
  }

  function back() {
    setError(null);
    setCode("");
    setStep("providers");
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (!dialogRef.current?.contains(event.target as Node)) onClose();
      }}
    >
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        className="relative w-full max-w-[420px] overflow-hidden rounded-3xl bg-white dark:bg-neutral-900 shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full text-slate-500 dark:text-neutral-400 transition hover:bg-white/70 dark:hover:bg-neutral-800/70 hover:text-slate-900 dark:hover:text-white"
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4.5 w-4.5">
            <path
              d="m6 6 12 12M18 6 6 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {/* Decorative header, echoing the particle globe on the homepage. */}
        {/* Dots and gradient are layered in one `background-image` on purpose:
            a Tailwind gradient class here would be overwritten by the inline
            pattern, since both set the same property. */}
        <div className="auth-modal-banner h-32 w-full" aria-hidden="true" />

        <div className="px-7 pt-6 pb-7">
          {step === "providers" && (
            <>
              <p className="text-sm text-slate-500 dark:text-neutral-400">Sign in.</p>
              <h2
                id="auth-modal-title"
                className="mt-1 text-[26px] leading-tight font-bold tracking-tight text-slate-900 dark:text-neutral-100"
              >
                Book your entire trip
                <br />
                in 2.4 seconds
              </h2>

              <div className="mt-6 space-y-3">
                <button
                  type="button"
                  onClick={handleGoogle}
                  disabled={busy}
                  className={providerButtonClass}
                >
                  <GoogleIcon />
                  Continue with Google
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setStep("phone");
                  }}
                  disabled={busy}
                  className={providerButtonClass}
                >
                  <PhoneIcon />
                  Continue with phone number
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setStep("email");
                  }}
                  disabled={busy}
                  className={providerButtonClass}
                >
                  <MailIcon />
                  Continue with email
                </button>
              </div>
            </>
          )}

          {step === "phone" && (
            <form onSubmit={handleSendPhoneCode}>
              <h2
                id="auth-modal-title"
                className="text-[22px] font-bold tracking-tight text-slate-900 dark:text-neutral-100"
              >
                What&apos;s your number?
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-neutral-400">
                We&apos;ll text you a 6-digit code.
              </p>
              <input
                type="tel"
                autoFocus
                required
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+44 7700 900000"
                className={`${fieldClass} mt-5`}
              />
              <p className="mt-2 text-xs text-slate-400 dark:text-neutral-500">
                Include your country code, e.g. +44.
              </p>
              <ModalActions busy={busy} onBack={back} label="Send code" />
            </form>
          )}

          {step === "phone-code" && (
            <form onSubmit={handleVerifyPhoneCode}>
              <h2
                id="auth-modal-title"
                className="text-[22px] font-bold tracking-tight text-slate-900 dark:text-neutral-100"
              >
                Enter your code
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-neutral-400">
                Sent to <span className="font-medium text-slate-700 dark:text-neutral-200">{phone}</span>
              </p>
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                required
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="123456"
                className={`${fieldClass} mt-5 text-center text-lg tracking-[0.4em]`}
              />
              <ModalActions
                busy={busy}
                onBack={() => {
                  setError(null);
                  setCode("");
                  setStep("phone");
                }}
                label="Verify"
              />
            </form>
          )}

          {step === "email" && (
            <form onSubmit={handleSendMagicLink}>
              <h2
                id="auth-modal-title"
                className="text-[22px] font-bold tracking-tight text-slate-900 dark:text-neutral-100"
              >
                What&apos;s your email?
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-neutral-400">
                We&apos;ll send you a one-click sign-in link.
              </p>
              <input
                type="email"
                autoFocus
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className={`${fieldClass} mt-5`}
              />
              <ModalActions busy={busy} onBack={back} label="Send link" />
            </form>
          )}

          {step === "email-sent" && (
            <div className="py-2 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/40">
                <MailIcon />
              </div>
              <h2
                id="auth-modal-title"
                className="mt-4 text-[22px] font-bold tracking-tight text-slate-900 dark:text-neutral-100"
              >
                Check your inbox
              </h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-neutral-400">
                We sent a sign-in link to{" "}
                <span className="font-medium text-slate-700 dark:text-neutral-200">{email}</span>. Open
                it on this device to finish signing in.
              </p>
              <button
                type="button"
                onClick={back}
                className="mt-5 text-sm font-medium text-orange-700 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300"
              >
                Use a different method
              </button>
            </div>
          )}

          {error && (
            <p className="mt-4 rounded-xl bg-red-50 dark:bg-red-950/30 px-3 py-2 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          {step === "providers" && (
            <p className="mt-6 text-center text-xs leading-relaxed text-slate-400 dark:text-neutral-500">
              By continuing you agree to our{" "}
              <Link href="/terms" className="underline hover:text-slate-600 dark:hover:text-neutral-300">
                Terms
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="underline hover:text-slate-600 dark:hover:text-neutral-300">
                Privacy Policy
              </Link>
              .
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function ModalActions({
  busy,
  onBack,
  label,
}: {
  busy: boolean;
  onBack: () => void;
  label: string;
}) {
  return (
    <div className="mt-5 flex items-center gap-3">
      <button
        type="button"
        onClick={onBack}
        className="rounded-full px-4 py-2.5 text-sm font-medium text-slate-500 dark:text-neutral-400 transition hover:text-slate-800 dark:hover:text-neutral-100"
      >
        Back
      </button>
      <button
        type="submit"
        disabled={busy}
        className="flex-1 rounded-full bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:opacity-60"
      >
        {busy ? "Please wait…" : label}
      </button>
    </div>
  );
}
