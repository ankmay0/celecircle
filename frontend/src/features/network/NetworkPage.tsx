import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Search, UserPlus, UserCheck, UserMinus, Users, Loader2, Sparkles } from 'lucide-react'
import { usersApi } from '@/api/users'
import { connectionsApi } from '@/api/connections'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { VerificationBadge } from '@/components/shared/VerificationBadge'
import { cn } from '@/lib/utils'

type Tab = 'followers' | 'following' | 'discover'

interface FollowUser {
  user_id: number
  email: string
  name: string | null
  category: string | null
  profile_photo_url: string | null
  verification_type: string | null
  role: string
  followed_at: string | null
}

export function NetworkPage() {
  const [tab, setTab] = useState<Tab>('followers')
  const [search, setSearch] = useState('')
  const [discoverUsers, setDiscoverUsers] = useState<any[]>([])
  const [followers, setFollowers] = useState<FollowUser[]>([])
  const [following, setFollowing] = useState<FollowUser[]>([])
  const [loading, setLoading] = useState(true)
  const [followingIds, setFollowingIds] = useState<Set<number>>(new Set())

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      if (tab === 'followers') {
        const { data } = await connectionsApi.getFollowers()
        setFollowers(data)
      } else if (tab === 'following') {
        const { data } = await connectionsApi.getFollowing()
        setFollowing(data)
        setFollowingIds(new Set(data.map((u: FollowUser) => u.user_id)))
      } else {
        const { data } = await usersApi.searchUsers(search || '')
        setDiscoverUsers(data)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [tab, search])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleFollow = async (userId: number) => {
    try {
      await connectionsApi.follow(userId)
      setFollowingIds((prev) => new Set([...prev, userId]))
    } catch {
      // silent
    }
  }

  const handleUnfollow = async (userId: number) => {
    try {
      await connectionsApi.unfollow(userId)
      setFollowingIds((prev) => {
        const next = new Set(prev)
        next.delete(userId)
        return next
      })
      if (tab === 'following') {
        setFollowing((prev) => prev.filter((u) => u.user_id !== userId))
      }
    } catch {
      // silent
    }
  }

  const tabs = [
    { value: 'followers' as const, label: 'Followers', icon: Users, count: followers.length },
    { value: 'following' as const, label: 'Following', icon: UserCheck, count: following.length },
    { value: 'discover' as const, label: 'Discover', icon: UserPlus, count: null },
  ]

  const renderFollowCard = (person: FollowUser) => (
    <div key={person.user_id} className="card p-4 hover:shadow-md transition-shadow animate-fade-in">
      <div className="flex items-center gap-3">
        <Link to={`/profile/${person.user_id}`}>
          <UserAvatar
            src={person.profile_photo_url}
            firstName={person.name}
            lastName=""
            verificationType={person.verification_type}
          />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <Link
              to={`/profile/${person.user_id}`}
              className="text-sm font-semibold text-text-primary hover:text-primary hover:underline transition-colors truncate"
            >
              {person.name || person.email.split('@')[0]}
            </Link>
            <VerificationBadge type={person.verification_type} size={14} />
          </div>
          <p className="text-xs text-text-secondary truncate">
            {person.category || person.role}
          </p>
        </div>
        {tab === 'following' ? (
          <button
            onClick={() => handleUnfollow(person.user_id)}
            className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:border-danger hover:text-danger hover:bg-danger/5 transition-all"
          >
            <UserMinus className="h-3.5 w-3.5" /> Unfollow
          </button>
        ) : (
          !followingIds.has(person.user_id) ? (
            <button
              onClick={() => handleFollow(person.user_id)}
              className="btn-secondary !px-4 !py-1.5 !text-xs"
            >
              <UserPlus className="h-3.5 w-3.5" /> Follow
            </button>
          ) : (
            <span className="flex items-center gap-1 rounded-full bg-bg-secondary px-3 py-1.5 text-xs font-medium text-text-secondary">
              <UserCheck className="h-3.5 w-3.5" /> Following
            </span>
          )
        )}
      </div>
    </div>
  )

  const renderDiscoverCard = (person: any) => (
    <div key={person.id} className="card p-4 hover:shadow-md transition-shadow animate-fade-in">
      <div className="flex items-center gap-3">
        <Link to={`/profile/${person.id}`}>
          <UserAvatar
            src={person.profile_photo_url}
            firstName={person.name}
            lastName=""
            verificationType={person.verification_type}
          />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <Link
              to={`/profile/${person.id}`}
              className="text-sm font-semibold text-text-primary hover:text-primary hover:underline transition-colors truncate"
            >
              {person.name}
            </Link>
            <VerificationBadge type={person.verification_type} size={14} />
          </div>
          <p className="text-xs text-text-secondary truncate">
            {person.category || person.email}
          </p>
        </div>
        {followingIds.has(person.id) ? (
          <span className="flex items-center gap-1 rounded-full bg-bg-secondary px-3 py-1.5 text-xs font-medium text-text-secondary">
            <UserCheck className="h-3.5 w-3.5" /> Following
          </span>
        ) : (
          <button
            onClick={() => handleFollow(person.id)}
            className="btn-secondary !px-4 !py-1.5 !text-xs"
          >
            <UserPlus className="h-3.5 w-3.5" /> Follow
          </button>
        )}
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <h1 className="text-xl font-bold text-text-primary mb-4">My Network</h1>

        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {tabs.map(({ value, label, icon: Icon, count }) => (
            <button
              key={value}
              onClick={() => setTab(value)}
              className={cn(
                'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all border',
                tab === value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-text-secondary hover:bg-bg-secondary',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
              {count !== null && tab !== value && count > 0 && (
                <span className="rounded-full bg-bg-tertiary px-1.5 py-0.5 text-[10px] font-bold">
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === 'discover' && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, role, or skill..."
              className="input-field !pl-10"
            />
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-3">
          {tab === 'followers' && (
            followers.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {followers.map(renderFollowCard)}
              </div>
            ) : (
              <div className="card p-12 text-center animate-fade-in">
                <Users className="h-12 w-12 text-text-muted mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-text-primary">No Followers Yet</h3>
                <p className="text-sm text-text-secondary mt-1">
                  When people follow you, they'll appear here.
                </p>
              </div>
            )
          )}

          {tab === 'following' && (
            following.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {following.map(renderFollowCard)}
              </div>
            ) : (
              <div className="card p-12 text-center animate-fade-in">
                <UserCheck className="h-12 w-12 text-text-muted mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-text-primary">Not Following Anyone</h3>
                <p className="text-sm text-text-secondary mt-1">
                  Discover artists and organizers to follow!
                </p>
                <button onClick={() => setTab('discover')} className="btn-primary mt-4">
                  <Sparkles className="h-4 w-4" /> Discover People
                </button>
              </div>
            )
          )}

          {tab === 'discover' && (
            discoverUsers.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {discoverUsers.map(renderDiscoverCard)}
              </div>
            ) : (
              <div className="card p-12 text-center animate-fade-in">
                <UserPlus className="h-12 w-12 text-text-muted mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-text-primary">No People Found</h3>
                <p className="text-sm text-text-secondary mt-1">
                  {search ? `No results for "${search}". Try a different search.` : 'Check back later for new suggestions.'}
                </p>
              </div>
            )
          )}
        </div>
      )}
    </div>
  )
}
