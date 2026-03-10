import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  MapPin,
  Star,
  Briefcase,
  Globe,
  Calendar,
  Loader2,
  UserPlus,
  UserMinus,
  MessageSquare,
  Award,
  TrendingUp,
  Clock,
  Image as ImageIcon,
  ExternalLink,
  CalendarCheck,
  IndianRupee,
} from 'lucide-react'
import { usersApi } from '@/api/users'
import { connectionsApi } from '@/api/connections'
import { useAuthStore } from '@/stores/authStore'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { VerificationBadge } from '@/components/shared/VerificationBadge'
import { BookingFormModal } from '@/features/bookings/BookingFormModal'
import { formatCurrency, cn, assetUrl } from '@/lib/utils'
import type { Profile } from '@/types'

type TabId = 'about' | 'portfolio'

export function ViewProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const currentUser = useAuthStore((s) => s.user)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<TabId>('about')
  const [showBookingForm, setShowBookingForm] = useState(false)

  const userId = Number(id)

  const loadProfile = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await usersApi.getProfileByUserId(userId)
      setProfile(data)
      const { data: status } = await connectionsApi.getStatus(userId)
      setIsFollowing(status.is_following)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  const handleFollow = async () => {
    setFollowLoading(true)
    try {
      if (isFollowing) {
        await connectionsApi.unfollow(userId)
      } else {
        await connectionsApi.follow(userId)
      }
      setIsFollowing(!isFollowing)
    } catch {
      // silent
    } finally {
      setFollowLoading(false)
    }
  }

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
        <p className="text-text-secondary">Profile not found</p>
      </div>
    )
  }

  const portfolioImages: string[] = profile.portfolio_images ? JSON.parse(profile.portfolio_images) : []
  const portfolioVideos: string[] = profile.portfolio_videos ? JSON.parse(profile.portfolio_videos) : []
  const portfolioLinks: string[] = profile.portfolio_links ? JSON.parse(profile.portfolio_links) : []
  const isOwn = currentUser?.id === userId

  const stats = [
    { icon: Briefcase, label: 'Hires', value: profile.total_hires },
    { icon: Star, label: 'Rating', value: profile.average_rating.toFixed(1) },
    { icon: Award, label: 'Reviews', value: profile.total_reviews },
    { icon: TrendingUp, label: 'AI Score', value: profile.ai_score.toFixed(0) },
  ]

  const tabs: { id: TabId; label: string }[] = [
    { id: 'about', label: 'About' },
    { id: 'portfolio', label: 'Portfolio' },
  ]

  return (
    <div className="space-y-4">
      <div className="card overflow-hidden">
        <div className="h-32 bg-gray-200 dark:bg-gray-700" />
        <div className="px-6 pb-6 -mt-10">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <UserAvatar
              src={assetUrl(profile.profile_photo_url)}
              firstName={profile.name.split(' ')[0]}
              lastName={profile.name.split(' ')[1]}
              size="xl"
              className="ring-4 ring-card"
              verificationType={profile.verification_type}
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
            {!isOwn && (
              <div className="flex gap-2 self-start flex-wrap">
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={isFollowing ? 'btn-secondary !px-4 !py-2' : 'btn-primary !px-4 !py-2'}
                >
                  {followLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isFollowing ? (
                    <UserMinus className="h-4 w-4" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
                <button
                  onClick={() => {
                    if (isFollowing) {
                      navigate(`/chat/${userId}`)
                    } else {
                      alert('You need to follow this user before you can message them.')
                    }
                  }}
                  className={cn(
                    'btn-ghost border border-border !rounded-full !px-4 !py-2',
                    !isFollowing && 'opacity-50 cursor-not-allowed',
                  )}
                  title={isFollowing ? 'Send a message' : 'Follow this user to send a message'}
                >
                  <MessageSquare className="h-4 w-4" /> Message
                </button>
                {currentUser?.role !== 'artist' && (
                  <button
                    onClick={() => setShowBookingForm(true)}
                    className="btn-primary !px-4 !py-2 !bg-emerald-600 hover:!bg-emerald-700"
                  >
                    <CalendarCheck className="h-4 w-4" /> Book Now
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Starting price + Book CTA for organizers */}
      {!isOwn && currentUser?.role !== 'artist' && profile.min_price > 0 && (
        <div className="card p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
              <IndianRupee className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-text-muted">Starting from</p>
              <p className="text-lg font-bold text-text-primary">
                {formatCurrency(profile.min_price)}
                <span className="text-xs text-text-muted font-normal ml-1">per event</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowBookingForm(true)}
            className="btn-primary !bg-emerald-600 hover:!bg-emerald-700 !px-5"
          >
            <CalendarCheck className="h-4 w-4" /> Book Now
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map(({ icon: Icon, label, value }) => (
          <div key={label} className="card p-4 text-center">
            <Icon className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-lg font-bold text-text-primary">{value}</p>
            <p className="text-xs text-text-secondary">{label}</p>
          </div>
        ))}
      </div>

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
                    <p className="flex items-center gap-2"><Calendar className="h-4 w-4 text-text-muted" /> {profile.experience_years} years experience</p>
                    {profile.languages && <p className="flex items-center gap-2"><Globe className="h-4 w-4 text-text-muted" /> {profile.languages}</p>}
                    <p className="flex items-center gap-2"><Clock className="h-4 w-4 text-text-muted" /> {profile.response_time_avg > 0 ? `${profile.response_time_avg.toFixed(0)}h avg response` : 'Quick responder'}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text-primary mb-2">Pricing</h3>
                  <p className="text-lg font-bold text-primary">{formatCurrency(profile.min_price)} - {formatCurrency(profile.max_price)}</p>
                  <p className="text-xs text-text-muted mt-1">per event</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'portfolio' && (
            <div className="space-y-6">
              {portfolioImages.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Photos</h3>
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
                    {portfolioVideos.map((url, i) => <video key={i} src={url} controls className="rounded-lg w-full" />)}
                  </div>
                </div>
              )}
              {portfolioLinks.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-text-primary mb-3">Links</h3>
                  <div className="space-y-2">
                    {portfolioLinks.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
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
        </div>
      </div>
      {/* Booking Form Modal */}
      {showBookingForm && profile && (
        <BookingFormModal
          artistId={userId}
          artistName={profile.name}
          artistCategory={profile.category}
          onClose={() => setShowBookingForm(false)}
          onSuccess={() => setShowBookingForm(false)}
        />
      )}
    </div>
  )
}
