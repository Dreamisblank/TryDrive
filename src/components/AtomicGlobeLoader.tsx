"use client";

import dynamic from "next/dynamic";

const AtomicGlobe = dynamic(() => import("@/components/AtomicGlobe"), {
  ssr: false,
});

export default function AtomicGlobeLoader() {
  return <AtomicGlobe />;
}
