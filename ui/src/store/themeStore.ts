import { create } from 'zustand'

export type ThemePreference = 'system' | 'light' | 'dark'
export type ResolvedTheme = 'light' | 'dark'

// Keep in sync with the bootstrap script in index.html, which applies the
// theme before first paint to avoid a flash of the wrong palette.
export const THEME_STORAGE_KEY = 'enstop-theme'

// Browser chrome color per theme — matches --color-canvas in index.css.
// Keep in sync with the bootstrap script in index.html.
const THEME_COLORS: Record<ResolvedTheme, string> = {
  light: '#F4F6F8',
  dark: '#0D151C',
}

const darkQuery = window.matchMedia('(prefers-color-scheme: dark)')

function readPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  } catch {
    // Storage blocked (private mode, disabled cookies) — fall back to the OS setting.
  }
  return 'system'
}

function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference !== 'system') return preference
  return darkQuery.matches ? 'dark' : 'light'
}

function applyTheme(theme: ResolvedTheme) {
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  root.style.colorScheme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[theme])
}

interface ThemeState {
  preference: ThemePreference
  resolved: ResolvedTheme
  setPreference: (preference: ThemePreference) => void
}

const initialPreference = readPreference()

export const useThemeStore = create<ThemeState>((set) => ({
  preference: initialPreference,
  resolved: resolveTheme(initialPreference),
  setPreference: (preference) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, preference)
    } catch {
      // Non-persistent session — the choice still applies until reload.
    }
    set({ preference, resolved: resolveTheme(preference) })
  },
}))

applyTheme(useThemeStore.getState().resolved)

useThemeStore.subscribe((state, prev) => {
  if (state.resolved !== prev.resolved) applyTheme(state.resolved)
})

darkQuery.addEventListener('change', () => {
  const { preference } = useThemeStore.getState()
  if (preference === 'system') useThemeStore.setState({ resolved: resolveTheme(preference) })
})
