import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  DEFAULT_THEME_ID,
  THEME_STORAGE_KEY,
  applyTheme,
  getThemeById,
  isValidThemeId,
  type ThemeDefinition,
} from '@/lib/themes'

interface ThemeContextValue {
  themeId: string
  theme: ThemeDefinition
  setTheme: (id: string) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function readStoredThemeId(): string {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (stored && isValidThemeId(stored)) return stored
  } catch {
    /* ignore */
  }
  return DEFAULT_THEME_ID
}

function applyThemeToDocument(theme: ThemeDefinition) {
  applyTheme(theme)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState(readStoredThemeId)

  const setTheme = useCallback((id: string) => {
    const nextId = isValidThemeId(id) ? id : DEFAULT_THEME_ID
    setThemeId(nextId)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextId)
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    applyThemeToDocument(getThemeById(themeId))
  }, [themeId])

  const theme = getThemeById(themeId)

  return (
    <ThemeContext.Provider value={{ themeId, theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
