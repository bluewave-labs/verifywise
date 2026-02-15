import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";

export type ThemeMode = "light" | "dark" | "system";

interface ThemeContextProps {
  themeMode: ThemeMode;
  resolvedTheme: "light" | "dark";
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const STORAGE_KEY = "verifywise_theme";

const getSystemTheme = (): "light" | "dark" =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

export const ThemeContext = createContext<ThemeContextProps>({
  themeMode: "light",
  resolvedTheme: "light",
  setThemeMode: () => {},
  toggleTheme: () => {},
});

export const ThemeContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
    return "light";
  });

  const [systemTheme, setSystemTheme] = useState<"light" | "dark">(getSystemTheme);

  const resolvedTheme = useMemo(
    () => (themeMode === "system" ? systemTheme : themeMode),
    [themeMode, systemTheme],
  );

  // Listen for OS theme changes
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setSystemTheme(e.matches ? "dark" : "light");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Persist and set data-theme attribute
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, themeMode);
    document.documentElement.setAttribute("data-theme", resolvedTheme);

    // Add transitioning class briefly for smooth transition
    document.documentElement.setAttribute("data-theme-transitioning", "");
    const timer = setTimeout(() => {
      document.documentElement.removeAttribute("data-theme-transitioning");
    }, 300);
    return () => clearTimeout(timer);
  }, [themeMode, resolvedTheme]);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeModeState((prev) => {
      const current = prev === "system" ? systemTheme : prev;
      return current === "light" ? "dark" : "light";
    });
  }, [systemTheme]);

  const value = useMemo(
    () => ({ themeMode, resolvedTheme, setThemeMode, toggleTheme }),
    [themeMode, resolvedTheme, setThemeMode, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
