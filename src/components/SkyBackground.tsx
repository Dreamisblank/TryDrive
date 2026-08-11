export default function SkyBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10"
      style={{
        backgroundImage: [
          "radial-gradient(50% 40% at 12% 15%, rgba(251,146,60,0.28) 0%, transparent 70%)",
          "radial-gradient(45% 38% at 88% 10%, rgba(249,115,22,0.20) 0%, transparent 70%)",
          "radial-gradient(55% 45% at 50% 50%, rgba(253,186,116,0.18) 0%, transparent 70%)",
          "radial-gradient(50% 42% at 10% 85%, rgba(251,146,60,0.22) 0%, transparent 70%)",
          "radial-gradient(48% 40% at 92% 88%, rgba(249,115,22,0.20) 0%, transparent 70%)",
          "linear-gradient(to bottom, #fff7ed 0%, #ffffff 55%, #fff7ed 100%)",
        ].join(", "),
      }}
    />
  );
}
