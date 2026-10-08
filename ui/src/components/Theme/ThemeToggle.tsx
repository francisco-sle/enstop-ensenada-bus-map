import { Monitor, Moon, Sun } from 'lucide-react'
import { useThemeStore, type ThemePreference } from '../../store/themeStore'

const OPTIONS: { value: ThemePreference; label: string; Icon: typeof Sun }[] = [
  { value: 'system', label: 'Sistema', Icon: Monitor },
  { value: 'light', label: 'Claro', Icon: Sun },
  { value: 'dark', label: 'Oscuro', Icon: Moon },
]

/**
 * System / light / dark picker. `bar` is the icon-only frosted pill that sits
 * beside the desktop nav; `inline` is the labelled control for content cards.
 */
export function ThemeToggle({ variant }: { variant: 'bar' | 'inline' }) {
  const preference = useThemeStore((s) => s.preference)
  const setPreference = useThemeStore((s) => s.setPreference)
  const isBar = variant === 'bar'

  return (
    <div
      role="radiogroup"
      aria-label="Tema de color"
      className={
        isBar
          ? 'glass pointer-events-auto inline-flex items-center gap-0.5 rounded-full p-1'
          : 'inline-flex items-center gap-0.5 rounded-full bg-mist p-1'
      }
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const isActive = preference === value
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={label}
            title={label}
            onClick={() => setPreference(value)}
            className={[
              'flex items-center justify-center gap-1.5 rounded-full text-xs font-semibold cursor-pointer select-none transition-[color,background-color,transform] duration-300 active:scale-95',
              isBar ? 'w-9 h-9' : 'h-8 px-3',
              isActive
                ? isBar
                  ? 'bg-ink text-paper'
                  : 'bg-paper text-ink shadow-soft'
                : 'text-ink-soft hover:text-ink',
            ].join(' ')}
          >
            <Icon size={15} strokeWidth={2.2} />
            {!isBar && <span>{label}</span>}
          </button>
        )
      })}
    </div>
  )
}
