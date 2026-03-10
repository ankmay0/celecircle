import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Briefcase,
  Users,
  Star,
  TrendingUp,
  Eye,
  MessageSquare,
  Plus,
  ArrowRight,
  Loader2,
  Calendar,
  Clock,
  CalendarCheck,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { usersApi } from '@/api/users'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { VerificationBadge } from '@/components/shared/VerificationBadge'
import type { Profile } from '@/types'

export function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const { data } = await usersApi.getMyProfile()
        setProfile(data)
      } catch {
        // Profile may not exist
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const isArtist = user?.role === 'artist'

  const statsCards = isArtist
    ? [
        { icon: Briefcase, label: 'Total Hires', value: profile?.total_hires || 0, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { icon: Star, label: 'Avg Rating', value: profile?.average_rating?.toFixed(1) || '0.0', color: 'text-amber-500', bg: 'bg-amber-500/10' },
        { icon: Eye, label: 'Profile Views', value: '—', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        { icon: TrendingUp, label: 'AI Score', value: profile?.ai_score?.toFixed(0) || '0', color: 'text-violet-500', bg: 'bg-violet-500/10' },
      ]
    : [
        { icon: Briefcase, label: 'Gigs Posted', value: '—', color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { icon: Users, label: 'Artists Hired', value: '—', color: 'text-amber-500', bg: 'bg-amber-500/10' },
        { icon: MessageSquare, label: 'Messages', value: '—', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        { icon: Calendar, label: 'Upcoming Events', value: '—', color: 'text-violet-500', bg: 'bg-violet-500/10' },
      ]

  const quickActions = isArtist
    ? [
        { to: '/bookings', icon: CalendarCheck, label: 'My Bookings', desc: 'View and manage booking requests' },
        { to: '/gigs', icon: Briefcase, label: 'Browse Gigs', desc: 'Find your next opportunity' },
        { to: '/profile', icon: Eye, label: 'View Profile', desc: 'See how others see you' },
        { to: '/chat', icon: MessageSquare, label: 'Messages', desc: 'Check your conversations' },
      ]
    : [
        { to: '/bookings', icon: CalendarCheck, label: 'My Bookings', desc: 'Track your artist bookings' },
        { to: '/gigs/new', icon: Plus, label: 'Post a Gig', desc: 'Find the perfect artist' },
        { to: '/gigs', icon: Briefcase, label: 'My Gigs', desc: 'Manage your gig listings' },
        { to: '/chat', icon: MessageSquare, label: 'Messages', desc: 'Talk to artists' },
      ]

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="card overflow-hidden">
        <div className="bg-gray-100 dark:bg-gray-800 p-6">
          <div className="flex items-center gap-4">
            <UserAvatar
              src={user?.profile_photo_url}
              firstName={user?.first_name}
              lastName={user?.last_name}
              size="lg"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-text-primary">
                  Welcome back, {user?.first_name}!
                </h1>
                <VerificationBadge type={user?.verification_type} size={18} />
              </div>
              <p className="text-sm text-text-secondary mt-0.5">
                {isArtist
                  ? "Here's an overview of your artist profile"
                  : "Manage your events and find talent"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {!profile && (
        <div className="card border-dashed border-2 border-primary/30 bg-primary/5 p-6 text-center">
          <Clock className="h-8 w-8 text-primary mx-auto mb-2" />
          <h3 className="font-semibold text-text-primary">Complete Your Profile</h3>
          <p className="text-sm text-text-secondary mt-1 mb-4">
            Set up your profile to get discovered by {isArtist ? 'organizers' : 'artists'}
          </p>
          <Link to="/setup-profile" className="btn-primary">
            Setup Profile <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsCards.map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className="card p-5 hover:shadow-md transition-shadow">
            <div className={`h-10 w-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-text-primary">{value}</p>
            <p className="text-xs text-text-secondary mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-text-primary mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {quickActions.map(({ to, icon: Icon, label, desc }) => (
            <Link
              key={to}
              to={to}
              className="card p-4 flex items-center gap-4 hover:shadow-md hover:border-primary/20 transition-all group"
            >
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary">{label}</p>
                <p className="text-xs text-text-secondary">{desc}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-text-muted group-hover:text-primary transition-colors" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
