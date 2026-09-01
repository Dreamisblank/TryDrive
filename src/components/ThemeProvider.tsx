"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  DEFAULT_THEME,
  THEME_KEY,
  applyTheme,
  isThemePreference,
  resolveTheme,
  type ResolvedTheme,
  type ThemePreference,
} from "@/lib/theme";

type ThemeContextValue = {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  setPreference: (next: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [preference, setPreferenceState] =
    useState<ThemePreference>(DEFAULT_THEME);
  const [resolved, setResolved] = useState<ResolvedTheme>("light");

  // Read the stored preference after hydration. The inline boot script in
  // layout.tsx has already painted the right colours by now; this just brings
  // React's state in line with the DOM.
  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(THEME_KEY);
    } catch {
      // Storage unavailable - fall back to the default.
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreferenceState(isThemePreference(stored) ? stored : DEFAULT_THEME);
  }, []);

  // Apply the preference, and re-apply when the inputs it depends on change:
  // the OS setting for "system", and the next sunrise/sunset for "auto".
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    function run() {
      const { theme, nextChange } = resolveTheme(preference);
      applyTheme(theme);
      setResolved(theme);

      if (nextChange) {
        // Wake up just after the boundary and re-resolve. Capped so a very
        // distant change (or a suspended laptop) still gets re-checked.
        const delay = Math.min(
          Math.max(nextChange.getTime() - Date.now() + 1000, 1000),
          6 * 60 * 60 * 1000,
        );
        timer = setTimeout(run, delay);
      }
    }

    run();

    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    const onSystemChange = () => {
      if (preference === "system" || preference === "auto") run();
    };
    media?.addEventListener("change", onSystemChange);

    // A laptop waking from sleep can have skipped straight past sunset.
    const onVisible = () => {
      if (document.visibilityState === "visible") run();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      if (timer) clearTimeout(timer);
      media?.removeEventListener("change", onSystemChange);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [preference]);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // Non-fatal: the choice just won't survive a reload.
    }
  }, []);

  const value = useMemo(
    () => ({ preference, resolved, setPreference }),
    [preference, resolved, setPreference],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
