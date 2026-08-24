import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="px-6 py-6">
      <Link
        href="/"
        className="text-4xl font-bold tracking-tight text-slate-900"
      >
        TryDrive
      </Link>
    </header>
  );
}
