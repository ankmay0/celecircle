import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  BadgeCheck,
  CalendarCheck,
  CreditCard,
  AlertTriangle,
  BarChart3,
  IndianRupee,
  Shield,
  HeadphonesIcon,
  Megaphone,
  Star,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { label: 'Users', path: '/admin/users', icon: Users },
  { label: 'Verifications', path: '/admin/verifications', icon: BadgeCheck },
  { label: 'Bookings', path: '/admin/bookings', icon: CalendarCheck },
  { label: 'Payments', path: '/admin/payments', icon: CreditCard },
  { label: 'Disputes', path: '/admin/disputes', icon: AlertTriangle },
  { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
  { label: 'Revenue', path: '/admin/revenue', icon: IndianRupee },
  { label: 'Moderation', path: '/admin/moderation', icon: Shield },
  { label: 'Support', path: '/admin/support', icon: HeadphonesIcon },
  { label: 'Announcements', path: '/admin/announcements', icon: Megaphone },
  { label: 'Featured', path: '/admin/featured', icon: Star },
] as const

export function AdminSidebar() {
  const { pathname } = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  const isActive = (path: string) =>
    path === '/admin' ? pathname === '/admin' : pathname.startsWith(path)

  return (
    <aside
      className={cn(
        'sticky top-14 flex h-[calc(100vh-56px)] flex-col border-r border-border bg-card transition-[width] duration-200',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      <div className="flex items-center justify-end px-3 py-2">
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-primary"
        >
          {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 scrollbar-thin">
        {NAV_ITEMS.map(({ label, path, icon: Icon }) => (
          <Link
            key={path}
            to={path}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive(path)
                ? 'bg-primary/10 text-primary'
                : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary',
              collapsed && 'justify-center px-0',
            )}
            title={collapsed ? label : undefined}
          >
            <Icon className="h-[18px] w-[18px] shrink-0" />
            {!collapsed && <span>{label}</span>}
          </Link>
        ))}
      </nav>

      <div
        className={cn(
          'border-t border-border px-4 py-3',
          collapsed && 'px-2 text-center',
        )}
      >
        {!collapsed ? (
          <p className="text-xs text-text-muted">Admin Panel &middot; v1.0</p>
        ) : (
          <p className="text-[10px] text-text-muted">v1.0</p>
        )}
      </div>
    </aside>
  )
}
