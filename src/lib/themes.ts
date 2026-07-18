export interface ThemeDefinition {
  id: string
  name: string
  description: string
  vars: Record<string, string>
}

export const THEME_STORAGE_KEY = 'pantry_theme_preview'

export const themes: ThemeDefinition[] = [
  {
    id: 'current',
    name: 'Current green',
    description: 'Green accent on slate',
    vars: {
      '--color-bg': '#0b1120',
      '--color-surface': '#0f172a',
      '--color-surface-elevated': '#1e293b',
      '--color-border': '#1e293b',
      '--color-border-muted': '#334155',
      '--color-text': '#f1f5f9',
      '--color-text-muted': '#94a3b8',
      '--color-text-label': '#94a3b8',
      '--color-accent': '#22c55e',
      '--color-accent-hover': '#16a34a',
      '--color-accent-muted': 'rgba(34, 197, 94, 0.15)',
    },
  },
  {
    id: 'teal',
    name: 'Teal',
    description: 'Cool teal on deep navy',
    vars: {
      '--color-bg': '#0a0f14',
      '--color-surface': '#141b24',
      '--color-surface-elevated': '#1c2633',
      '--color-border': '#243041',
      '--color-border-muted': '#2f3d52',
      '--color-text': '#e8eef4',
      '--color-text-muted': '#8b9cb0',
      '--color-text-label': '#8b9cb0',
      '--color-accent': '#2dd4bf',
      '--color-accent-hover': '#14b8a6',
      '--color-accent-muted': 'rgba(45, 212, 191, 0.15)',
    },
  },
  {
    id: 'coral',
    name: 'Coral',
    description: 'Warm coral on charcoal',
    vars: {
      '--color-bg': '#121212',
      '--color-surface': '#1e1e1e',
      '--color-surface-elevated': '#2a2a2a',
      '--color-border': '#333333',
      '--color-border-muted': '#404040',
      '--color-text': '#f5f5f5',
      '--color-text-muted': '#a3a3a3',
      '--color-text-label': '#a3a3a3',
      '--color-accent': '#ff6b6b',
      '--color-accent-hover': '#f05252',
      '--color-accent-muted': 'rgba(255, 107, 107, 0.15)',
    },
  },
  {
    id: 'blue',
    name: 'Blue',
    description: 'Bright blue on slate',
    vars: {
      '--color-bg': '#0f172a',
      '--color-surface': '#1e293b',
      '--color-surface-elevated': '#273549',
      '--color-border': '#334155',
      '--color-border-muted': '#475569',
      '--color-text': '#f1f5f9',
      '--color-text-muted': '#94a3b8',
      '--color-text-label': '#94a3b8',
      '--color-accent': '#3b82f6',
      '--color-accent-hover': '#2563eb',
      '--color-accent-muted': 'rgba(59, 130, 246, 0.15)',
    },
  },
  {
    id: 'purple',
    name: 'Purple',
    description: 'Vivid purple on black',
    vars: {
      '--color-bg': '#000000',
      '--color-surface': '#111111',
      '--color-surface-elevated': '#1a1a1a',
      '--color-border': '#262626',
      '--color-border-muted': '#333333',
      '--color-text': '#f5f5f5',
      '--color-text-muted': '#a3a3a3',
      '--color-text-label': '#a3a3a3',
      '--color-accent': '#a855f7',
      '--color-accent-hover': '#9333ea',
      '--color-accent-muted': 'rgba(168, 85, 247, 0.15)',
    },
  },
  {
    id: 'gold',
    name: 'Gold',
    description: 'Golden accent on warm dark',
    vars: {
      '--color-bg': '#1a1614',
      '--color-surface': '#252019',
      '--color-surface-elevated': '#2f2923',
      '--color-border': '#3d352c',
      '--color-border-muted': '#4a4238',
      '--color-text': '#f5f0eb',
      '--color-text-muted': '#a89f94',
      '--color-text-label': '#a89f94',
      '--color-accent': '#eab308',
      '--color-accent-hover': '#ca8a04',
      '--color-accent-muted': 'rgba(234, 179, 8, 0.15)',
    },
  },
  {
    id: 'mint',
    name: 'Mint',
    description: 'Fresh mint on dark blue-gray',
    vars: {
      '--color-bg': '#0f1419',
      '--color-surface': '#1a2332',
      '--color-surface-elevated': '#243044',
      '--color-border': '#2d3a4f',
      '--color-border-muted': '#3a4a63',
      '--color-text': '#ecfdf5',
      '--color-text-muted': '#94a3b8',
      '--color-text-label': '#94a3b8',
      '--color-accent': '#34d399',
      '--color-accent-hover': '#10b981',
      '--color-accent-muted': 'rgba(52, 211, 153, 0.15)',
    },
  },
]

export const DEFAULT_THEME_ID = 'purple'

export function getThemeById(id: string): ThemeDefinition {
  return themes.find((t) => t.id === id) ?? themes.find((t) => t.id === DEFAULT_THEME_ID)!
}

export function isValidThemeId(id: string): boolean {
  return themes.some((t) => t.id === id)
}

export function applyTheme(theme: ThemeDefinition) {
  const root = document.documentElement
  root.setAttribute('data-theme', theme.id)
  for (const [key, value] of Object.entries(theme.vars)) {
    root.style.setProperty(key, value)
  }
}

export function initThemeFromStorage() {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (stored && isValidThemeId(stored)) {
      applyTheme(getThemeById(stored))
      return
    }
  } catch {
    /* ignore */
  }
  applyTheme(getThemeById(DEFAULT_THEME_ID))
}
