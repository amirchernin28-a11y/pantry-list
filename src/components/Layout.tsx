import { Link, Outlet, useLocation } from 'react-router-dom'
import type { AppContext } from '@/App'

const tabs = [
  { path: '/', label: 'Inventory', icon: '📦' },
  { path: '/shopping', label: 'Shopping', icon: '🛒' },
  { path: '/settings', label: 'Settings', icon: '⚙️' },
]

export function Layout({ context }: { context: AppContext }) {
  const location = useLocation()

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col">
      <main className="flex-1 px-4 pb-24 pt-4">
        <Outlet context={context} />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 border-t border-slate-800 bg-slate-950/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg">
          {tabs.map((tab) => {
            const active = location.pathname === tab.path
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={`flex flex-1 flex-col items-center gap-0.5 py-3 text-xs font-medium transition-colors ${
                  active ? 'text-brand-500' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="text-xl">{tab.icon}</span>
                {tab.label}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
