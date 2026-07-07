import {
  createContext,
  use,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type Theme = "light" | "dark" | "system";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolved: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = "simontini-theme";
const TRANSITION_MS = 320;
const VALID_THEMES: string[] = ["light", "dark", "system"];

function isTheme(v: unknown): v is Theme {
  return typeof v === "string" && VALID_THEMES.includes(v);
}

function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  const raw = localStorage.getItem(STORAGE_KEY);
  return isTheme(raw) ? raw : "system";
}

function systemPrefersDark(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function resolveTheme(theme: Theme, sysDark: boolean): "light" | "dark" {
  if (theme !== "system") return theme;
  return sysDark ? "dark" : "light";
}

function applyResolved(resolved: "light" | "dark") {
  const root = window.document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(resolved);
  root.style.colorScheme = resolved;
}

/**
 * Enable the cross-fade transition, then swap the theme on the next frame so
 * the browser has registered the starting computed values first. Without the
 * rAF gap, adding the transition class and changing the value in the same
 * frame produces a snap/flicker instead of a transition.
 */
function withTransition(root: HTMLElement, fn: () => void) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    fn();
    return;
  }
  root.classList.add("theme-transitioning");
  // Force the transition styles to apply before the theme value changes.
  requestAnimationFrame(() => {
    fn();
    window.setTimeout(
      () => root.classList.remove("theme-transitioning"),
      TRANSITION_MS,
    );
  });
}

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => readStoredTheme());
  const [sysDark, setSysDark] = useState<boolean>(() => systemPrefersDark());

  // Track OS-level dark preference so `system` mode re-resolves live.
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = (e: MediaQueryListEvent) => {
      setSysDark(e.matches);
      if (theme !== "system") return;
      const root = window.document.documentElement;
      withTransition(root, () => applyResolved(e.matches ? "dark" : "light"));
    };
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [theme]);

  // The inline script in index.html already applied the theme class before
  // paint. Skip the first run so we never re-flip on mount; only apply on
  // actual user-driven theme changes.
  const didInit = useRef(false);
  useEffect(() => {
    if (!didInit.current) {
      didInit.current = true;
      return;
    }
    const root = window.document.documentElement;
    withTransition(root, () => applyResolved(resolveTheme(theme, sysDark)));
    // sysDark intentionally excluded: this effect only reacts to user-driven
    // theme changes; the OS-preference listener handles system-dark shifts.
    // eslint-disable-next-line react-hooks/exhaustive-deps, react-doctor/exhaustive-deps
  }, [theme]);

  // Derive `resolved` from `theme` + `sysDark` instead of mirroring it in
  // state (react-doctor no-derived-state).
  const resolved = useMemo(
    () => resolveTheme(theme, sysDark),
    [theme, sysDark],
  );

  const setTheme = (next: Theme) => {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage may be unavailable */
    }
    setThemeState(next);
  };

  // Memoize the context value so consumers don't redraw on every render
  // (react-doctor jsx-no-constructed-context-values).
  const value = useMemo<ThemeContextValue>(
    () => ({ theme, setTheme, resolved }),
    [theme, resolved],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = use(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}