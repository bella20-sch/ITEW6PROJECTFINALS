export const THEME_STORAGE_KEY = 'ite-w6-theme'

/** Apply saved or system preference to `<html data-theme>` (does not write storage). */
export function initThemeFromStorage() {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    let theme = 'light'
    if (stored === 'dark') theme = 'dark'
    else if (stored === 'light') theme = 'light'
    else if (window.matchMedia?.('(prefers-color-scheme: dark)')?.matches) theme = 'dark'
    document.documentElement.setAttribute('data-theme', theme)
  } catch {
    document.documentElement.setAttribute('data-theme', 'light')
  }
}

export function getTheme() {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'
}

/** Persist and apply theme. */
export function setTheme(theme) {
  const t = theme === 'dark' ? 'dark' : 'light'
  document.documentElement.setAttribute('data-theme', t)
  try {
    localStorage.setItem(THEME_STORAGE_KEY, t)
  } catch {
    /* ignore */
  }
}
