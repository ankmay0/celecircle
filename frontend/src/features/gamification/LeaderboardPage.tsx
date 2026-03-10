import { useState } from 'react'
import {
  Trophy,
  Medal,
  Star,
  Flame,
  TrendingUp,
  Crown,
  Zap,
  Award,
  Target,
  Heart,
  MessageCircle,
  Share2,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { cn, assetUrl } from '@/lib/utils'

type Tab = 'leaderboard' | 'badges' | 'my-rank'

interface LeaderboardEntry {
  rank: number
  name: string
  initials: string
  points: number
  level: string
  levelColor: string
  streak: number
  avatar?: string
}

interface Badge {
  id: string
  name: string
  description: string
  icon: typeof Trophy
  color: string
  bgColor: string
  earned: boolean
  progress?: number
}

const fanLevels = [
  { name: 'Bronze Fan', min: 0, max: 500, color: 'text-amber-700', bgColor: 'bg-amber-100 dark:bg-amber-900/30', icon: Star },
  { name: 'Silver Fan', min: 500, max: 2000, color: 'text-gray-500', bgColor: 'bg-gray-100 dark:bg-gray-800', icon: Medal },
  { name: 'Gold Fan', min: 2000, max: 5000, color: 'text-yellow-500', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30', icon: Trophy },
  { name: 'Superfan', min: 5000, max: Infinity, color: 'text-violet-500', bgColor: 'bg-violet-100 dark:bg-violet-900/30', icon: Crown },
]

const demoLeaderboard: LeaderboardEntry[] = [
  { rank: 1, name: 'Priya Sharma', initials: 'PS', points: 8420, level: 'Superfan', levelColor: 'text-violet-500', streak: 45 },
  { rank: 2, name: 'Rahul Mehta', initials: 'RM', points: 7150, level: 'Superfan', levelColor: 'text-violet-500', streak: 32 },
  { rank: 3, name: 'Ananya Roy', initials: 'AR', points: 5890, level: 'Superfan', levelColor: 'text-violet-500', streak: 28 },
  { rank: 4, name: 'Vikram Singh', initials: 'VS', points: 4320, level: 'Gold Fan', levelColor: 'text-yellow-500', streak: 21 },
  { rank: 5, name: 'Neha Kapoor', initials: 'NK', points: 3760, level: 'Gold Fan', levelColor: 'text-yellow-500', streak: 18 },
  { rank: 6, name: 'Amit Patel', initials: 'AP', points: 2890, level: 'Gold Fan', levelColor: 'text-yellow-500', streak: 15 },
  { rank: 7, name: 'Sanya Gupta', initials: 'SG', points: 1950, level: 'Silver Fan', levelColor: 'text-gray-500', streak: 12 },
  { rank: 8, name: 'Karan Joshi', initials: 'KJ', points: 1420, level: 'Silver Fan', levelColor: 'text-gray-500', streak: 9 },
  { rank: 9, name: 'Meera Nair', initials: 'MN', points: 890, level: 'Silver Fan', levelColor: 'text-gray-500', streak: 7 },
  { rank: 10, name: 'Dev Sharma', initials: 'DS', points: 450, level: 'Bronze Fan', levelColor: 'text-amber-700', streak: 4 },
]

const demoBadges: Badge[] = [
  { id: 'first-post', name: 'First Post', description: 'Created your first post', icon: Zap, color: 'text-blue-500', bgColor: 'bg-blue-100 dark:bg-blue-900/30', earned: true },
  { id: 'social-butterfly', name: 'Social Butterfly', description: 'Connected with 10 people', icon: Heart, color: 'text-rose-500', bgColor: 'bg-rose-100 dark:bg-rose-900/30', earned: true },
  { id: 'commenter', name: 'Active Commenter', description: 'Left 50 comments', icon: MessageCircle, color: 'text-emerald-500', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30', earned: true, progress: 100 },
  { id: 'sharer', name: 'Content Sharer', description: 'Shared 25 posts', icon: Share2, color: 'text-violet-500', bgColor: 'bg-violet-100 dark:bg-violet-900/30', earned: false, progress: 60 },
  { id: 'streak-7', name: '7-Day Streak', description: 'Active 7 days in a row', icon: Flame, color: 'text-orange-500', bgColor: 'bg-orange-100 dark:bg-orange-900/30', earned: true },
  { id: 'streak-30', name: '30-Day Streak', description: 'Active 30 days in a row', icon: Flame, color: 'text-red-500', bgColor: 'bg-red-100 dark:bg-red-900/30', earned: false, progress: 40 },
  { id: 'event-goer', name: 'Event Enthusiast', description: 'Attended 5 live events', icon: Star, color: 'text-amber-500', bgColor: 'bg-amber-100 dark:bg-amber-900/30', earned: false, progress: 20 },
  { id: 'top-fan', name: 'Top Fan', description: 'Reached Top 10 on leaderboard', icon: Trophy, color: 'text-yellow-500', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30', earned: false, progress: 0 },
  { id: 'trendsetter', name: 'Trendsetter', description: 'Post got 100+ likes', icon: TrendingUp, color: 'text-cyan-500', bgColor: 'bg-cyan-100 dark:bg-cyan-900/30', earned: false, progress: 75 },
]

const myPoints = 1650
const myRank = 8
const myLevel = fanLevels.find((l) => myPoints >= l.min && myPoints < l.max) || fanLevels[0]
const nextLevel = fanLevels[fanLevels.indexOf(myLevel) + 1]

export function LeaderboardPage() {
  const user = useAuthStore((s) => s.user)
  const [tab, setTab] = useState<Tab>('leaderboard')

  const tabs = [
    { value: 'leaderboard' as const, label: 'Leaderboard', icon: Trophy },
    { value: 'badges' as const, label: 'Badges', icon: Award },
    { value: 'my-rank' as const, label: 'My Rank', icon: Target },
  ]

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />
    return <span className="text-sm font-bold text-text-muted w-5 text-center">{rank}</span>
  }

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-text-primary">Gamification</h1>
            <p className="text-xs text-text-secondary mt-0.5">
              Earn points, collect badges, and climb the leaderboard
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-amber-100 dark:bg-amber-900/30 px-3 py-1.5">
            <Zap className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-bold text-amber-700 dark:text-amber-400">{myPoints.toLocaleString()} pts</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {tabs.map(({ value, label, icon: Icon }) => (
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
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      {tab === 'leaderboard' && (
        <>
          {/* Top 3 podium */}
          <div className="grid grid-cols-3 gap-3">
            {[demoLeaderboard[1], demoLeaderboard[0], demoLeaderboard[2]].map((entry, idx) => {
              const isFirst = idx === 1
              return (
                <div
                  key={entry.rank}
                  className={cn(
                    'card p-4 text-center animate-slide-up',
                    isFirst && 'ring-2 ring-yellow-400/50 shadow-lg',
                  )}
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="mb-2">{getRankBadge(entry.rank)}</div>
                  <div className={cn(
                    'mx-auto rounded-full flex items-center justify-center font-bold text-white',
                    isFirst ? 'h-14 w-14 text-lg bg-gradient-to-br from-yellow-400 to-amber-500' : 'h-11 w-11 text-sm bg-gradient-to-br from-primary/70 to-secondary/70',
                  )}>
                    {entry.initials}
                  </div>
                  <p className={cn('font-semibold text-text-primary mt-2 truncate', isFirst ? 'text-sm' : 'text-xs')}>
                    {entry.name}
                  </p>
                  <p className={cn('font-bold mt-0.5', entry.levelColor, isFirst ? 'text-sm' : 'text-xs')}>
                    {entry.points.toLocaleString()} pts
                  </p>
                  <span className={cn('inline-block rounded-full px-2 py-0.5 text-[10px] font-medium mt-1', entry.levelColor)}>
                    {entry.level}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Rest of leaderboard */}
          <div className="card overflow-hidden">
            {demoLeaderboard.slice(3).map((entry) => (
              <div
                key={entry.rank}
                className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-bg-secondary transition-colors"
              >
                <span className="w-8 text-center text-sm font-bold text-text-muted">{entry.rank}</span>
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
                  {entry.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{entry.name}</p>
                  <p className={cn('text-xs', entry.levelColor)}>{entry.level}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-text-primary">{entry.points.toLocaleString()}</p>
                  <p className="text-[10px] text-text-muted flex items-center gap-0.5 justify-end">
                    <Flame className="h-2.5 w-2.5 text-orange-500" /> {entry.streak}d streak
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Badges */}
      {tab === 'badges' && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {demoBadges.map((badge) => {
            const Icon = badge.icon
            return (
              <div
                key={badge.id}
                className={cn(
                  'card p-4 transition-shadow animate-fade-in',
                  badge.earned ? 'hover:shadow-md' : 'opacity-60',
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn('rounded-xl p-2.5 flex-shrink-0', badge.bgColor)}>
                    <Icon className={cn('h-5 w-5', badge.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-text-primary">{badge.name}</p>
                      {badge.earned && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
                    </div>
                    <p className="text-xs text-text-secondary mt-0.5">{badge.description}</p>
                    {!badge.earned && badge.progress !== undefined && (
                      <div className="mt-2">
                        <div className="h-1.5 rounded-full bg-bg-tertiary overflow-hidden">
                          <div
                            className={cn('h-full rounded-full transition-all', badge.earned ? 'bg-success' : 'bg-primary')}
                            style={{ width: `${badge.progress}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-text-muted mt-0.5">{badge.progress}% complete</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* My Rank */}
      {tab === 'my-rank' && (
        <div className="space-y-4">
          <div className="card p-6 text-center animate-fade-in">
            <UserAvatar
              src={assetUrl(user?.profile_photo_url)}
              firstName={user?.first_name}
              lastName={user?.last_name}
              size="xl"
              verificationType={user?.verification_type}
              className="mx-auto"
            />
            <h2 className="text-lg font-bold text-text-primary mt-3">
              {user?.first_name} {user?.last_name}
            </h2>
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className={cn('flex items-center gap-1 font-semibold text-sm', myLevel.color)}>
                {<myLevel.icon className="h-4 w-4" />} {myLevel.name}
              </span>
            </div>
            <div className="flex items-center justify-center gap-6 mt-4">
              <div>
                <p className="text-2xl font-bold text-primary">{myPoints.toLocaleString()}</p>
                <p className="text-xs text-text-muted">Total Points</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div>
                <p className="text-2xl font-bold text-text-primary">#{myRank}</p>
                <p className="text-xs text-text-muted">Global Rank</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div>
                <p className="text-2xl font-bold text-orange-500">12</p>
                <p className="text-xs text-text-muted">Day Streak</p>
              </div>
            </div>

            {nextLevel && (
              <div className="mt-6 max-w-xs mx-auto">
                <div className="flex items-center justify-between text-xs text-text-muted mb-1">
                  <span>{myLevel.name}</span>
                  <span>{nextLevel.name}</span>
                </div>
                <div className="h-2.5 rounded-full bg-bg-tertiary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all"
                    style={{ width: `${((myPoints - myLevel.min) / (nextLevel.min - myLevel.min)) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-text-muted mt-1">
                  {nextLevel.min - myPoints} more points to {nextLevel.name}
                </p>
              </div>
            )}
          </div>

          {/* How to earn points */}
          <div className="card p-5">
            <h3 className="text-sm font-bold text-text-primary mb-3">How to Earn Points</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                { action: 'Create a post', pts: '+10', icon: Zap },
                { action: 'Like a post', pts: '+2', icon: Heart },
                { action: 'Comment on a post', pts: '+5', icon: MessageCircle },
                { action: 'Share a post', pts: '+3', icon: Share2 },
                { action: 'Daily login streak', pts: '+15', icon: Flame },
                { action: 'Attend a live event', pts: '+50', icon: Star },
              ].map(({ action, pts, icon: Icon }) => (
                <div key={action} className="flex items-center gap-3 rounded-lg bg-bg-secondary/50 p-3">
                  <Icon className="h-4 w-4 text-text-muted flex-shrink-0" />
                  <span className="text-xs text-text-secondary flex-1">{action}</span>
                  <span className="text-xs font-bold text-success">{pts}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Fan Levels */}
          <div className="card p-5">
            <h3 className="text-sm font-bold text-text-primary mb-3">Fan Levels</h3>
            <div className="space-y-2">
              {fanLevels.map((level) => {
                const Icon = level.icon
                const isCurrent = level.name === myLevel.name
                return (
                  <div
                    key={level.name}
                    className={cn(
                      'flex items-center gap-3 rounded-lg p-3',
                      isCurrent ? 'bg-primary/5 ring-1 ring-primary/20' : 'bg-bg-secondary/50',
                    )}
                  >
                    <div className={cn('rounded-lg p-2', level.bgColor)}>
                      <Icon className={cn('h-4 w-4', level.color)} />
                    </div>
                    <div className="flex-1">
                      <p className={cn('text-sm font-medium', isCurrent ? 'text-primary' : 'text-text-primary')}>
                        {level.name} {isCurrent && '← You'}
                      </p>
                      <p className="text-[11px] text-text-muted">
                        {level.max === Infinity ? `${level.min.toLocaleString()}+ points` : `${level.min.toLocaleString()} – ${level.max.toLocaleString()} points`}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
