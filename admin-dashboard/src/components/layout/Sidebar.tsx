import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Users, Building, Calendar, FileText, History } from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/users', icon: Users, label: 'Users' },
  { to: '/venues', icon: Building, label: 'Venues' },
  { to: '/bookings', icon: Calendar, label: 'Bookings' },
  { to: '/content', icon: FileText, label: 'Content' },
  { to: '/audit-log', icon: History, label: 'Audit Log' },
]

export function Sidebar() {
  return (
    <aside className="w-64 border-r bg-background min-h-screen">
      <nav className="space-y-1 p-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
