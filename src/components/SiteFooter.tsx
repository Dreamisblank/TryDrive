import Link from "next/link";

/** Sits in normal document flow at the bottom-left of each page's own
 *  content, like an ordinary page footer - only in view once someone
 *  scrolls (or on a short page) there, not fixed on top of everything. */
export default function SiteFooter() {
  return (
    <footer className="px-4 py-4">
      <p className="text-[11px] text-slate-400 dark:text-neutral-500">
        <Link href="/privacy" className="hover:text-slate-600 dark:hover:text-neutral-300">
          Privacy Policy
        </Link>
        <span className="mx-1.5">·</span>
        <Link href="/terms" className="hover:text-slate-600 dark:hover:text-neutral-300">
          Terms of Service
        </Link>
      </p>
    </footer>
  );
}
