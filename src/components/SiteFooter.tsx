import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="w-full px-4 py-4 text-center sm:px-6 sm:py-3 sm:text-left">
      <p className="text-[11px] text-slate-400 dark:text-slate-500">
        <Link href="/privacy" className="hover:text-slate-600 dark:hover:text-slate-300">
          Privacy Policy
        </Link>
        <span className="mx-1.5">·</span>
        <Link href="/terms" className="hover:text-slate-600 dark:hover:text-slate-300">
          Terms of Service
        </Link>
        <span className="mx-1.5">·</span>
        <Link href="/partner" className="hover:text-slate-600 dark:hover:text-slate-300">
          Partner
        </Link>
      </p>
    </footer>
  );
}
