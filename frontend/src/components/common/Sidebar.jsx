import { NavLink } from 'react-router-dom'
import clsx from 'clsx'

const NAV = [
  { to: '/dashboard', icon: '⬛', label: 'Live Dashboard' },
  { to: '/analytics', icon: '📊', label: 'Analytics' },
  { to: '/cameras',   icon: '📷', label: 'Cameras' },
  { to: '/alerts',    icon: '🚨', label: 'Alerts' },
]

export default function Sidebar() {
  return (
    <aside className="w-full lg:w-56 flex-shrink-0 bg-surface-secondary border-b border-surface-border lg:border-b-0 lg:border-r flex flex-col">
      {/* Logo */}
      <div className="p-5 border-b border-surface-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white font-bold text-sm">P</div>
          <div>
            <div className="text-sm font-bold text-white">Purplle AI</div>
            <div className="text-[10px] text-purple-400">Store Intelligence</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {NAV.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              isActive
                ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                : 'text-purple-300/70 hover:text-white hover:bg-surface-tertiary'
            )}
          >
            <span className="text-base">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-surface-border">
        <div className="text-[10px] text-purple-400/50 text-center">
          Hackathon Build · v1.0
        </div>
      </div>
    </aside>
  )
}
