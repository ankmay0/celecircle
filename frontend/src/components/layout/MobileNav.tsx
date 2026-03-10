import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Home,
  MessageSquare,
  Bell,
  Briefcase,
  Menu,
  X,
  LayoutDashboard,
  Users,
  Ticket,
  Crown,
  ShoppingBag,
  Trophy,
  Vote,
  BarChart3,
  User,
  Bookmark,
  BadgeCheck,
  Sparkles,
  CalendarCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const bottomItems = [
  { to: '/feed', icon: Home, label: 'Home' },
  { to: '/gigs', icon: Briefcase, label: 'Gigs' },
  { to: '/chat', icon: MessageSquare, label: 'Messages' },
  { to: '/notifications', icon: Bell, label: 'Alerts' },
]

const menuItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/bookings', icon: CalendarCheck, label: 'Bookings' },
  { to: '/network', icon: Users, label: 'My Network' },
  { to: '/community', icon: Users, label: 'Community' },
  { to: '/events', icon: Ticket, label: 'Events' },
  { to: '/exclusive', icon: Crown, label: 'Exclusive Content' },
  { to: '/store', icon: ShoppingBag, label: 'Store' },
  { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
  { to: '/polls', icon: Vote, label: 'Polls' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/profile', icon: User, label: 'Profile' },
  { to: '/saved', icon: Bookmark, label: 'Saved' },
  { to: '/get-verified', icon: BadgeCheck, label: 'Get Verified' },
  { to: '/gigs/new', icon: Sparkles, label: 'Post a Gig' },
]

export function MobileNav() {
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      {/* Overlay + Slide-up menu */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMenuOpen(false)}
        >
          <div
            className="absolute bottom-0 left-0 right-0 max-h-[75vh] overflow-y-auto rounded-t-2xl border-t border-border bg-card animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card px-5 py-3 z-10">
              <span className="text-sm font-semibold text-text-primary">Menu</span>
              <button
                onClick={() => setMenuOpen(false)}
                className="rounded-full p-1.5 hover:bg-bg-secondary transition-colors"
              >
                <X className="h-5 w-5 text-text-secondary" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-1 p-3">
              {menuItems.map(({ to, icon: Icon, label }) => {
                const active = location.pathname === to
                return (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 rounded-xl px-2 py-3.5 text-[11px] font-medium transition-colors',
                      active
                        ? 'bg-primary/10 text-primary'
                        : 'text-text-secondary hover:bg-bg-secondary',
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-center leading-tight">{label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-lg lg:hidden">
        <div className="flex items-center justify-around px-2 py-1">
          {bottomItems.map(({ to, icon: Icon, label }) => {
            const active = location.pathname === to
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-3 py-1.5 text-[10px] font-medium transition-colors',
                  active ? 'text-primary' : 'text-text-secondary',
                )}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            )
          })}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={cn(
              'flex flex-col items-center gap-0.5 px-3 py-1.5 text-[10px] font-medium transition-colors',
              menuOpen ? 'text-primary' : 'text-text-secondary',
            )}
          >
            <Menu className="h-5 w-5" />
            More
          </button>
        </div>
      </nav>
    </>
  )
}
