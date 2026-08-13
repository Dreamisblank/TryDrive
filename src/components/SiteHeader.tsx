import Image from "next/image";
import Link from "next/link";
import logo from "@/app/icon.png";

export default function SiteHeader() {
  return (
    <header className="fixed top-0 left-0 z-20 px-6 py-6">
      <Link
        href="/"
        className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900"
      >
        TryDrive
        <Image src={logo} alt="" priority className="h-20 w-20" />
      </Link>
    </header>
  );
}
