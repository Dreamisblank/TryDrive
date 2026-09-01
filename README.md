# TryDrive

Car rental search and booking, built on Next.js 16 (App Router) and the
RentSyst Aggregator API. Deployed on Hostinger from `main`.

## Running locally

```bash
npm install
npm run dev
```

> Build with `npm run build`, which uses `--webpack` on purpose: Turbopack's
> native binary crashes on Hostinger's glibc, and plain SWC has a WASM
> fallback.

## Environment variables

Set these in `.env.local` for development, and in Hostinger's hPanel
(Advanced → Environment Variables) for production. **Changes only take effect
after the Node process restarts.**

| Variable | Required | Purpose |
| --- | --- | --- |
| `RENTSYST_CLIENT_ID` | yes | RentSyst Aggregator API credentials |
| `RENTSYST_CLIENT_SECRET` | yes | " |
| `ADMIN_PASSWORD` | yes | Gates `/admin` |
| `NEXT_PUBLIC_SUPABASE_URL` | no | Enables sign-in |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | no | " |

Auth is optional by design: with the two Supabase variables unset, the Sign in
button is hidden and booking is not gated, so the site behaves exactly as it
did before auth existed. Set both to switch it on.

Never put the Supabase `service_role` key here — it bypasses row-level
security and `NEXT_PUBLIC_` variables are shipped to the browser.

## Enabling sign-in

1. Create a project at [supabase.com](https://supabase.com). From
   **Project Settings → API**, copy the **Project URL** and the **anon /
   public** key into the two variables above.
1. Open **SQL Editor → New query**, paste the contents of
   [`supabase/schema.sql`](supabase/schema.sql) and run it. This creates the
   `profiles` and `bookings` tables, their row-level-security policies, the
   trigger that gives every new user a profile, and the function behind
   "Delete account". It is safe to re-run. Without it, sign-in still works but
   Settings and the Cars page have nowhere to read from.
2. In **Authentication → URL Configuration**, set the Site URL to
   `https://trydrive.co.uk` and add these redirect URLs:
   - `https://trydrive.co.uk/auth/callback`
   - `http://localhost:3000/auth/callback`
3. **Google** — in **Authentication → Providers → Google**, enable it and paste
   a Client ID and Secret from a Google Cloud OAuth 2.0 credential. That
   credential's authorised redirect URI must be the callback URL Supabase
   shows on that page (`https://<project>.supabase.co/auth/v1/callback`), not
   TryDrive's own.
4. **Email** — enabled by default; magic links work with no extra setup. The
   built-in mailer is rate-limited, so add SMTP under **Project Settings →
   Auth** before real traffic.
5. **Phone** — under **Authentication → Providers → Phone**, enable it and
   connect an SMS provider (Twilio, MessageBird, Vonage). This costs roughly a
   penny per message and needs an account with that provider. Until it's
   configured the phone option returns an error; Google and email still work.

## Currency

The header picker writes a `trydrive_currency` cookie, which the server reads
when calling RentSyst. Prices are always rendered in whatever currency
RentSyst returns rather than converted client-side, so an unsupported code
degrades to their default instead of mislabelling numbers. First-time visitors
are guessed from their browser locale, then timezone.

## Admin

`/admin` is password-gated via `src/proxy.ts` and deliberately unlinked from
the public site. It shows RentSyst connectivity and a local booking log
(`data/bookings.jsonl`), which is a flat file that resets on redeploy —
RentSyst has no "list all bookings" endpoint.

## Notes

- Next.js 16 renamed `middleware.ts` to `proxy.ts` (function `middleware` →
  `proxy`), and it runs on the Node runtime by default.
- Hostinger sits behind a CDN with a long `s-maxage`; purge the cache after
  every deploy or changes won't appear.
