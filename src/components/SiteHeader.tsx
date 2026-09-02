import Link from "next/link";
import CurrencyPicker from "./CurrencyPicker";
import AccountMenu from "./AccountMenu";

// Deliberately not a cookie-reading server component: the currency and auth
// controls read their own state on the client, which keeps the pages that use
// this header (home, privacy, terms, partner) statically prerenderable.
export default function SiteHeader() {
  return (
    <header className="flex items-center justify-between gap-2 px-4 py-4 sm:gap-4 sm:px-6 sm:py-6">
      <Link
        href="/"
        className="shrink-0 text-2xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-neutral-100"
      >
        TryDrive
      </Link>

      <div className="flex min-w-0 items-center gap-1 sm:gap-1.5">
        <CurrencyPicker />
        <AccountMenu />
      </div>
    </header>
  );
}
