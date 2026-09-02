import AtomicGlobeLoader from "@/components/AtomicGlobeLoader";
import CarSearchForm from "@/components/CarSearchForm";
import HeroHeadline from "@/components/HeroHeadline";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import SkyBackground from "@/components/SkyBackground";
import { getLocations } from "@/lib/rentsyst";

export default async function Home() {
  let locations: Awaited<ReturnType<typeof getLocations>> = [];
  try {
    locations = await getLocations();
  } catch (err) {
    console.error("Failed to load RentSyst locations:", err);
  }

  return (
    <div className="flex min-h-dvh flex-1 flex-col">
      <SkyBackground />
      <AtomicGlobeLoader />
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <HeroHeadline />

        <div className="mt-10 w-full">
          <CarSearchForm locations={locations} />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
