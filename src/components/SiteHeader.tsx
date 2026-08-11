import Link from "next/link";
import AnimatedLogo from "@/components/AnimatedLogo";

export default function SiteHeader() {
  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
      <Link
        href="/"
        className="flex items-center gap-2 text-lg font-semibold tracking-tight text-slate-900"
      >
        <AnimatedLogo />
        TryDrive
      </Link>
    </header>
  );
}
