import Link from "next/link";

/** Fixed to the viewport's bottom-left corner on every page, rather than
 *  sitting in normal document flow - on short pages (errors, empty states,
 *  loading), a flow-positioned footer ends up floating mid-screen instead
 *  of anchored to the bottom like the rest of the site's chrome. No
 *  background of its own - transparent, so it always sits directly on the
 *  page's own gradient like the rest of the site's chrome (header, etc.)
 *  instead of showing up as a mismatched patch of colour. */
export default function SiteFooter({
  liftedOnMobile = false,
}: {
  /** Raises the footer above a page's own floating bottom bar (e.g. the
   *  offer detail page's booking bar) on mobile, where that bar spans the
   *  full width and would otherwise sit on top of these links. Desktop's
   *  floating bar is a centered pill that never reaches the left edge, so
   *  no lift is needed there. */
  liftedOnMobile?: boolean;
}) {
  return (
    <footer
      className={`fixed left-0 z-40 px-4 py-2.5 ${liftedOnMobile ? "bottom-20 sm:bottom-0" : "bottom-0"}`}
    >
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
