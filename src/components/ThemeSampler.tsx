import { useTheme } from '@/context/ThemeContext'
import { themes } from '@/lib/themes'

function ThemePreviewCard({
  name,
  accent,
  bg,
  surface,
  selected,
  onSelect,
}: {
  name: string
  accent: string
  bg: string
  surface: string
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative rounded-xl border p-3 text-left transition-colors ${
        selected
          ? 'border-accent ring-2 ring-accent ring-offset-2 ring-offset-app'
          : 'border-app hover:border-app-muted'
      }`}
      style={{ backgroundColor: surface }}
      aria-pressed={selected}
      aria-label={`Preview ${name} theme`}
    >
      {selected && (
        <span
          className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{ backgroundColor: accent }}
          aria-hidden
        >
          ✓
        </span>
      )}

      <div className="overflow-hidden rounded-lg border border-black/20">
        <div className="flex h-6" style={{ backgroundColor: bg }}>
          <div className="ml-auto mr-1 mt-1 h-2 w-8 rounded-sm" style={{ backgroundColor: accent }} />
        </div>
        <div className="space-y-1.5 p-2" style={{ backgroundColor: surface }}>
          <div className="h-1.5 w-3/4 rounded-full bg-white/20" />
          <div className="flex items-center gap-1">
            <div
              className="rounded px-2 py-0.5 text-[10px] font-medium text-white"
              style={{ backgroundColor: accent }}
            >
              Add
            </div>
            <div className="h-1.5 flex-1 rounded-full bg-white/10" />
          </div>
        </div>
      </div>

      <p className="mt-2 text-sm font-medium text-app">{name}</p>
    </button>
  )
}

export function ThemeSampler() {
  const { themeId, setTheme } = useTheme()

  return (
    <section className="rounded-2xl border border-app bg-surface p-5">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-label">Try a color theme</h3>
      <p className="mt-1 text-sm text-muted">
        Tap to preview — your choice is saved on this device
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {themes.map((theme) => (
          <ThemePreviewCard
            key={theme.id}
            name={theme.name}
            accent={theme.vars['--color-accent']}
            bg={theme.vars['--color-bg']}
            surface={theme.vars['--color-surface']}
            selected={themeId === theme.id}
            onSelect={() => setTheme(theme.id)}
          />
        ))}
      </div>
    </section>
  )
}
