import Link from "next/link";
import CurrencyPicker from "./CurrencyPicker";
import AccountMenu from "./AccountMenu";

// Deliberately not a cookie-reading server component: the currency and auth
// controls read their own state on the client, which keeps the pages that use
// this header (home, privacy, terms, partner) statically prerenderable.
export default function SiteHeader() {
  return (
    <header className="flex items-center justify-between gap-4 px-6 py-6">
      <Link
        href="/"
        className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100"
      >
        TryDrive
      </Link>

      <div className="flex items-center gap-1.5">
        <CurrencyPicker />
        <AccountMenu />
      </div>
    </header>
  );
}
