export type ThemePreference = "light" | "dark";

export const THEME_KEY = "trydrive_theme";

export const DEFAULT_THEME: ThemePreference = "light";

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === "light" || value === "dark";
}

export function applyTheme(theme: ThemePreference) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}
