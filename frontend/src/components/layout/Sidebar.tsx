import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Home,
  Users,
  Briefcase,
  MessageSquare,
  Bell,
  User,
  Bookmark,
  LayoutDashboard,
  FileText,
  Sparkles,
  Trophy,
  Crown,
  Vote,
  ShoppingBag,
  BarChart3,
  Ticket,
  ShieldCheck,
  UserCheck,
  UserPlus,
  CalendarCheck,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { connectionsApi } from '@/api/connections'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { VerificationBadge } from '@/components/shared/VerificationBadge'
import { cn, assetUrl } from '@/lib/utils'

const links = [
  { to: '/feed', icon: Home, label: 'Home' },
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/network', icon: Users, label: 'My Network' },
  { to: '/gigs', icon: Briefcase, label: 'Gigs' },
  { to: '/bookings', icon: CalendarCheck, label: 'Bookings' },
  { to: '/chat', icon: MessageSquare, label: 'Messaging' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/community', icon: Users, label: 'Community' },
  { to: '/events', icon: Ticket, label: 'Events' },
  { to: '/exclusive', icon: Crown, label: 'Exclusive' },
  { to: '/store', icon: ShoppingBag, label: 'Store' },
  { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
  { to: '/polls', icon: Vote, label: 'Polls' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/profile', icon: User, label: 'Profile' },
  { to: '/saved', icon: Bookmark, label: 'Saved' },
]

export function Sidebar() {
  const user = useAuthStore((s) => s.user)
  const location = useLocation()
  const [followersCount, setFollowersCount] = useState<number | null>(null)
  const [followingCount, setFollowingCount] = useState<number | null>(null)

  useEffect(() => {
    async function loadCounts() {
      try {
        const [followersRes, followingRes] = await Promise.all([
          connectionsApi.getFollowers(),
          connectionsApi.getFollowing(),
        ])
        setFollowersCount(followersRes.data.length)
        setFollowingCount(followingRes.data.length)
      } catch {
        /* silent */
      }
    }
    loadCounts()
  }, [])

  return (
    <aside className="hidden lg:block w-[240px] flex-shrink-0">
      <div className="sticky top-[72px] space-y-3">
        {/* Profile card */}
        <div className="card overflow-hidden">
          <div className="h-16 bg-gray-200 dark:bg-gray-700" />
          <div className="px-4 pb-4 -mt-6">
            <Link to="/profile">
              <UserAvatar
                src={assetUrl(user?.profile_photo_url)}
                firstName={user?.first_name}
                lastName={user?.last_name}
                size="lg"
                className="ring-3 ring-card"
                verificationType={user?.verification_type}
              />
            </Link>
            <div className="mt-2">
              <div className="flex items-center gap-1">
                <Link to="/profile" className="font-semibold text-sm text-text-primary hover:underline">
                  {user?.first_name} {user?.last_name}
                </Link>
                <VerificationBadge type={user?.verification_type} size={14} />
              </div>
              <p className="text-xs text-text-secondary capitalize mt-0.5">{user?.role}</p>
            </div>

            {/* Followers / Following */}
            <div className="grid grid-cols-2 gap-1 mt-3 pt-3 border-t border-border">
              <Link to="/network" className="group rounded-lg px-2 py-1.5 hover:bg-bg-secondary transition-colors text-center">
                <div className="flex items-center justify-center gap-1.5 text-text-muted">
                  <UserCheck className="h-3 w-3" />
                  <span className="text-[10px]">Followers</span>
                </div>
                <p className="text-sm font-bold text-primary mt-0.5 group-hover:underline">
                  {followersCount ?? 0}
                </p>
              </Link>
              <Link to="/network" className="group rounded-lg px-2 py-1.5 hover:bg-bg-secondary transition-colors text-center">
                <div className="flex items-center justify-center gap-1.5 text-text-muted">
                  <UserPlus className="h-3 w-3" />
                  <span className="text-[10px]">Following</span>
                </div>
                <p className="text-sm font-bold text-primary mt-0.5 group-hover:underline">
                  {followingCount ?? 0}
                </p>
              </Link>
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div className="card p-2 space-y-0.5">
          <Link
            to="/gigs/new"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
          >
            <Sparkles className="h-[18px] w-[18px]" />
            Post a Gig
          </Link>
          <Link
            to="/gigs"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-text-secondary hover:bg-bg-secondary hover:text-text-primary transition-colors"
          >
            <FileText className="h-[18px] w-[18px]" />
            Browse Gigs
          </Link>
        </div>

        {/* Navigation */}
        <nav className="card p-2">
          {links.map(({ to, icon: Icon, label }) => {
            const active = location.pathname === to
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-secondary hover:bg-bg-secondary hover:text-text-primary',
                )}
              >
                <Icon className={cn('h-[18px] w-[18px]', active && 'text-primary')} />
                {label}
                {active && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
              </Link>
            )
          })}
        </nav>

        {/* Admin section */}
        {user?.role === 'admin' && (
          <div className="card p-2">
            <p className="px-3 py-1.5 text-[10px] font-semibold text-text-muted uppercase tracking-wider">
              Admin
            </p>
            <Link
              to="/admin"
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                location.pathname.startsWith('/admin')
                  ? 'bg-primary/10 text-primary'
                  : 'text-text-secondary hover:bg-bg-secondary hover:text-text-primary',
              )}
            >
              <ShieldCheck className={cn('h-[18px] w-[18px]', location.pathname.startsWith('/admin') && 'text-primary')} />
              Admin Dashboard
              {location.pathname.startsWith('/admin') && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
            </Link>
          </div>
        )}
      </div>
    </aside>
  )
}
