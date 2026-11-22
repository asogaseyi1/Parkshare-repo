import { useCallback, useEffect, useSyncExternalStore } from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'parkshare-theme';
const DARK_QUERY = '(prefers-color-scheme: dark)';

/* --------------------------------------------------------------------------
   Module-level store so every useTheme() consumer — the toggle, the map
   styles, the Stripe card field — re-renders from one source of truth.
   -------------------------------------------------------------------------- */

const listeners = new Set<() => void>();

const readPreference = (): ThemePreference => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  } catch {
    /* storage unavailable (private mode) — fall back to system */
  }
  return 'system';
};

const systemTheme = (): ResolvedTheme =>
  typeof window !== 'undefined' && window.matchMedia?.(DARK_QUERY).matches ? 'dark' : 'light';

const resolveTheme = (preference: ThemePreference): ResolvedTheme =>
  preference === 'system' ? systemTheme() : preference;

let preference: ThemePreference = readPreference();
let resolved: ResolvedTheme = resolveTheme(preference);
// Snapshot must be referentially stable between notifications.
let snapshot = { preference, resolved };

const apply = () => {
  resolved = resolveTheme(preference);
  snapshot = { preference, resolved };
  document.documentElement.setAttribute('data-theme', resolved);
  // Drop the pre-hydration inline colour set by the script in index.html.
  document.documentElement.style.removeProperty('background-color');
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getSnapshot = () => snapshot;

export const setThemePreference = (next: ThemePreference) => {
  preference = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* ignore */
  }
  apply();
};

/**
 * Reads/writes the `data-theme` attribute that src/styles/tokens.css keys off.
 * The initial attribute comes from an inline script in public/index.html so the
 * first paint already matches; this hook keeps it in sync from then on.
 */
export function useTheme() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  // Follow the OS while the preference is "system".
  useEffect(() => {
    if (state.preference !== 'system') return;
    const media = window.matchMedia(DARK_QUERY);
    const onChange = () => apply();
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [state.preference]);

  const toggle = useCallback(() => {
    setThemePreference(resolved === 'dark' ? 'light' : 'dark');
  }, []);

  return {
    preference: state.preference,
    resolved: state.resolved,
    setPreference: setThemePreference,
    toggle,
  };
}

export default useTheme;
