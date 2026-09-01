import { getDarkWindow } from "./sun";

export type ThemePreference = "light" | "dark" | "system" | "auto";
export type ResolvedTheme = "light" | "dark";

export const THEME_KEY = "trydrive_theme";
/**
 * The last resolved value, so the inline boot script can paint the right
 * colours before React loads without re-running the sunset maths.
 */
export const THEME_RESOLVED_KEY = "trydrive_theme_resolved";

export const DEFAULT_THEME: ThemePreference = "auto";

export function isThemePreference(value: unknown): value is ThemePreference {
  return (
    value === "light" || value === "dark" || value === "system" || value === "auto"
  );
}

function systemPrefersDark(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-color-scheme: dark)").matches === true
  );
}

export type Resolution = {
  theme: ResolvedTheme;
  /** When to re-resolve, for "auto". Null means nothing scheduled. */
  nextChange: Date | null;
};

export function resolveTheme(preference: ThemePreference): Resolution {
  if (preference === "light") return { theme: "light", nextChange: null };
  if (preference === "dark") return { theme: "dark", nextChange: null };

  if (preference === "system") {
    return { theme: systemPrefersDark() ? "dark" : "light", nextChange: null };
  }

  // "auto": follow the sun where the user is. If we can't work that out
  // (unknown timezone, or polar day/night), defer to the OS preference
  // rather than guessing.
  const window_ = getDarkWindow();
  if (!window_) {
    return { theme: systemPrefersDark() ? "dark" : "light", nextChange: null };
  }
  return {
    theme: window_.isDark ? "dark" : "light",
    nextChange: window_.nextChange,
  };
}

export function applyTheme(theme: ResolvedTheme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
  try {
    localStorage.setItem(THEME_RESOLVED_KEY, theme);
  } catch {
    // Private browsing / storage disabled - the theme still applies for
    // this page view, we just can't pre-paint the next one.
  }
}
