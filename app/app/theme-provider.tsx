import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

export type Theme = "dark" | "light";

export const THEME_STORAGE_KEY = "syncparty.theme";

export interface ThemeContextValue {
  theme: Theme;
  toggle(): void;
}

export interface ThemeDoc {
  documentElement: {
    classList: { add(cssClass: string): void; remove(cssClass: string): void };
  };
}

export interface ThemeStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function readStoredTheme(storage: ThemeStorage | null): Theme | null {
  const raw = storage?.getItem(THEME_STORAGE_KEY) ?? null;
  return raw === "dark" || raw === "light" ? raw : null;
}

export function resolveInitialTheme(
  prefersLight: boolean,
  stored: Theme | null,
): Theme {
  if (stored === "dark" || stored === "light") return stored;
  return prefersLight ? "light" : "dark";
}

export function nextTheme(theme: Theme): Theme {
  return theme === "dark" ? "light" : "dark";
}

export function persistTheme(
  storage: ThemeStorage | null,
  theme: Theme,
): void {
  storage?.setItem(THEME_STORAGE_KEY, theme);
}

export function applyThemeClass(doc: ThemeDoc, theme: Theme): void {
  if (theme === "light") {
    doc.documentElement.classList.add("light");
  } else {
    doc.documentElement.classList.remove("light");
  }
}

function defaultStorage(): ThemeStorage | null {
  return typeof localStorage === "undefined" ? null : localStorage;
}

function prefersLightScheme(): boolean {
  if (typeof matchMedia === "undefined") return false;
  return matchMedia("(prefers-color-scheme: light)").matches;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  toggle: () => {},
});

export function ThemeProvider({ children }: { children?: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() =>
    resolveInitialTheme(prefersLightScheme(), readStoredTheme(defaultStorage()))
  );

  useEffect(() => {
    applyThemeClass(document, theme);
  }, [theme]);

  const toggle = () => {
    setTheme((current) => {
      const next = nextTheme(current);
      persistTheme(defaultStorage(), next);
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
