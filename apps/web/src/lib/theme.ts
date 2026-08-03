const STORAGE_KEY = 'torezani.theme';

export type Theme = 'light' | 'dark';

export function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  window.localStorage.setItem(STORAGE_KEY, theme);
}

export function loadTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  return (window.localStorage.getItem(STORAGE_KEY) as Theme) || 'light';
}
