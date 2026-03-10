import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  MapPin,
  Calendar,
  Star,
  Briefcase,
  Globe,
  Edit3,
  Loader2,
  Award,
  Clock,
  TrendingUp,
  Eye,
  Users,
  UserCheck,
  Image as ImageIcon,
  ExternalLink,
} from 'lucide-react'
import { usersApi } from '@/api/users'
import { connectionsApi } from '@/api/connections'
import { useAuthStore } from '@/stores/authStore'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { VerificationBadge } from '@/components/shared/VerificationBadge'
import { formatDate, formatCurrency, cn } from '@/lib/utils'
import type { Profile } from '@/types'

type TabId = 'about' | 'portfolio' | 'reviews'

export function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabId>('about')
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)

  useEffect(() => {
    async function load() {
      try {
        const [profileRes, followersRes, followingRes] = await Promise.all([
          usersApi.getMyProfile(),
          connectionsApi.getFollowers(),
          connectionsApi.getFollowing(),
        ])
        setProfile(profileRes.data)
        setFollowersCount(followersRes.data.length)
        setFollowingCount(followingRes.data.length)
      } catch {
        // Profile may not exist yet
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

  if (!profile) {
    return (
      <div className="card p-12 text-center">
        <h2 className="text-xl font-bold text-text-primary mb-2">Complete Your Profile</h2>
        <p className="text-text-secondary mb-6">Set up your profile to get discovered</p>
        <Link to="/setup-profile" className="btn-primary">
          <Edit3 className="h-4 w-4" /> Setup Profile
        </Link>
      </div>
    )
  }

  const portfolioImages: string[] = profile.portfolio_images ? JSON.parse(profile.portfolio_images) : []
  const portfolioVideos: string[] = profile.portfolio_videos ? JSON.parse(profile.portfolio_videos) : []
  const portfolioLinks: string[] = profile.portfolio_links ? JSON.parse(profile.portfolio_links) : []

  const stats = [
    { icon: Briefcase, label: 'Total Hires', value: profile.total_hires },
    { icon: Star, label: 'Avg Rating', value: profile.average_rating.toFixed(1) },
    { icon: Award, label: 'Reviews', value: profile.total_reviews },
    { icon: TrendingUp, label: 'AI Score', value: profile.ai_score.toFixed(0) },
  ]

  const tabs: { id: TabId; label: string }[] = [
    { id: 'about', label: 'About' },
    { id: 'portfolio', label: 'Portfolio' },
    { id: 'reviews', label: 'Reviews' },
  ]

  return (
    <div className="space-y-4">
      {/* Profile Header */}
      <div className="card overflow-hidden">
        <div className="h-32 bg-gray-200 dark:bg-gray-700" />
        <div className="px-6 pb-6 -mt-10">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <UserAvatar
              src={profile.profile_photo_url}
              firstName={user?.first_name}
              lastName={user?.last_name}
              size="xl"
              className="ring-4 ring-card"
              verificationType={user?.verification_type}
            />
            <div className="flex-1 sm:pb-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-text-primary">{profile.name}</h1>
                <VerificationBadge type={profile.verification_type} size={18} />
              </div>
              <p className="text-sm text-text-secondary">{profile.category}</p>
              {profile.location && (
                <p className="text-xs text-text-muted flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3" /> {profile.location}
                </p>
              )}
            </div>
            <Link to="/setup-profile" className="btn-secondary !px-4 !py-2 self-start">
              <Edit3 className="h-4 w-4" /> Edit Profile
            </Link>
          </div>
        </div>
      </div>

      {/* Profile views + Followers/Following */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4 text-center">
          <Eye className="h-5 w-5 text-text-muted mx-auto mb-1" />
          <p className="text-lg font-bold text-text-primary">--</p>
          <p className="text-xs text-text-secondary">Profile views</p>
        </div>
        <Link to="/network" className="card p-4 text-center hover:ring-1 hover:ring-primary/30 transition-all">
          <UserCheck className="h-5 w-5 text-primary mx-auto mb-1" />
          <p className="text-lg font-bold text-primary">{followersCount}</p>
          <p className="text-xs text-text-secondary">Followers</p>
        </Link>
        <Link to="/network" className="card p-4 text-center hover:ring-1 hover:ring-primary/30 transition-all">
          <Users className="h-5 w-5 text-primary mx-auto mb-1" />
          <p className="text-lg font-bold text-primary">{followingCount}</p>
          <p className="text-xs text-text-secondary">Following</p>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map(({ icon: Icon, label, value }) => (
          <div key={label} className="card p-4 text-center">
            <Icon className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-lg font-bold text-text-primary">{value}</p>
            <p className="text-xs text-text-secondary">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="flex border-b border-border">
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                'flex-1 py-3 text-sm font-medium transition-colors relative',
                activeTab === id ? 'text-primary' : 'text-text-secondary hover:text-text-primary',
              )}
            >
              {label}
              {activeTab === id && (
                <span className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full bg-primary" />
              )}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'about' && (
            <div className="space-y-6">
              {profile.bio && (
                <div>
                  <h3 className="text-sm font-semibold text-text-primary mb-2">Bio</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{profile.bio}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-text-primary mb-2">Details</h3>
                  <div className="space-y-2 text-sm text-text-secondary">
                    <p className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-text-muted" />
                      {profile.experience_years} years experience
                    </p>
                    {profile.languages && (
                      <p className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-text-muted" />
                        {profile.languages}
                      </p>
                    )}
                    <p className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-text-muted" />
                      {profile.response_time_avg > 0
                        ? `${profile.response_time_avg.toFixed(0)}h avg response`
                        : 'Quick responder'}
                    </p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text-primary mb-2">Pricing</h3>
                  <p className="text-lg font-bold text-primary">
                    {formatCurrency(profile.min_price)} - {formatCurrency(profile.max_price)}
                  </p>
                  <p className="text-xs text-text-muted mt-1">per event</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-text-muted">
                  Member since {formatDate(profile.created_at)}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'portfolio' && (
            <div className="space-y-6">
              {portfolioImages.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" /> Photos
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {portfolioImages.map((url, i) => (
                      <img key={i} src={url} alt="" className="rounded-lg h-40 w-full object-cover bg-bg-secondary" loading="lazy" />
                    ))}
                  </div>
                </div>
              )}
              {portfolioVideos.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-text-primary mb-3">Videos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {portfolioVideos.map((url, i) => (
                      <video key={i} src={url} controls className="rounded-lg w-full" />
                    ))}
                  </div>
                </div>
              )}
              {portfolioLinks.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-text-primary mb-3">External Links</h3>
                  <div className="space-y-2">
                    {portfolioLinks.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <ExternalLink className="h-4 w-4" /> {url}
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {portfolioImages.length === 0 && portfolioVideos.length === 0 && portfolioLinks.length === 0 && (
                <p className="text-center text-text-secondary py-8">No portfolio items yet</p>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="text-center py-8">
              <Star className="h-8 w-8 text-text-muted mx-auto mb-2" />
              <p className="text-text-secondary">Reviews will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
