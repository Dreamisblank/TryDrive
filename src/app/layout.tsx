import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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

/**
 * Runs before first paint to avoid a white flash on a dark-mode load. It only
 * replays the theme resolved on the previous visit; ThemeProvider re-runs the
 * real sunset calculation once React is up and corrects it if needed.
 */
const themeBootScript = `
(function () {
  try {
    var pref = localStorage.getItem("trydrive_theme") || "auto";
    var dark;
    if (pref === "dark") dark = true;
    else if (pref === "light") dark = false;
    else {
      var last = localStorage.getItem("trydrive_theme_resolved");
      dark = last
        ? last === "dark"
        : window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    if (dark) {
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
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
