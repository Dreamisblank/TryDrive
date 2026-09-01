import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import AuthErrorBanner from "@/components/AuthErrorBanner";
import AuthProvider from "@/components/AuthProvider";
import ThemeProvider from "@/components/ThemeProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TryDrive — Find your rental car",
  description:
    "Search rental cars by pickup location, dates, and driver age to compare available options and pricing.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffedd5" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1120" },
  ],
};

/** Runs before first paint to avoid a white flash on a dark-mode load. */
const themeBootScript = `
(function () {
  try {
    if (localStorage.getItem("trydrive_theme") === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.style.colorScheme = "dark";
    }
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        {/* next/script rather than a raw <script>: an inline script inside the
            React tree isn't executed on the client and breaks hydration.
            beforeInteractive is injected into the server HTML and runs before
            any Next.js module, which is what avoids the flash. */}
        <Script id="theme-boot" strategy="beforeInteractive">
          {themeBootScript}
        </Script>
        <ThemeProvider>
          <AuthProvider>
            <AuthErrorBanner />
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
