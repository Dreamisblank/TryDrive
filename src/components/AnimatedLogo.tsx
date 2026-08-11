"use client";

import Lottie, { type LottieRefCurrentProps } from "lottie-react";
import { useRef } from "react";
import carAnimation from "@/lottie/car-logo.json";

export default function AnimatedLogo() {
  const lottieRef = useRef<LottieRefCurrentProps>(null);

  return (
    <span
      className="h-8 w-8"
      onMouseEnter={() => lottieRef.current?.play()}
      onMouseLeave={() => lottieRef.current?.stop()}
    >
      <Lottie
        lottieRef={lottieRef}
        animationData={carAnimation}
        autoplay={false}
        loop
        className="h-full w-full"
      />
    </span>
  );
}
