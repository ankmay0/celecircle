import {
  TrendingUp,
  Users,
  Eye,
  Heart,
  MessageCircle,
  BarChart3,
  ArrowUp,
  ArrowDown,
  Star,
  Activity,
  Globe,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCard {
  label: string
  value: string
  change: number
  icon: typeof TrendingUp
  color: string
  bgColor: string
}

const stats: StatCard[] = [
  { label: 'Profile Views', value: '12,456', change: 23, icon: Eye, color: 'text-blue-500', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  { label: 'Total Followers', value: '8,234', change: 12, icon: Users, color: 'text-violet-500', bgColor: 'bg-violet-100 dark:bg-violet-900/30' },
  { label: 'Post Impressions', value: '45,678', change: -5, icon: TrendingUp, color: 'text-emerald-500', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30' },
  { label: 'Engagement Rate', value: '8.2%', change: 18, icon: Heart, color: 'text-rose-500', bgColor: 'bg-rose-100 dark:bg-rose-900/30' },
]

const topPosts = [
  { title: 'New album announcement!', likes: 1234, comments: 89, shares: 45, impressions: 15600 },
  { title: 'Behind the scenes at Mumbai concert', likes: 987, comments: 67, shares: 34, impressions: 12300 },
  { title: 'Thank you 10K followers!', likes: 856, comments: 123, shares: 56, impressions: 11800 },
  { title: 'Dance rehearsal video', likes: 756, comments: 45, shares: 23, impressions: 9400 },
]

const topFans = [
  { name: 'Priya Sharma', initials: 'PS', interactions: 234, level: 'Superfan' },
  { name: 'Rahul Mehta', initials: 'RM', interactions: 189, level: 'Gold Fan' },
  { name: 'Ananya Roy', initials: 'AR', interactions: 156, level: 'Gold Fan' },
  { name: 'Vikram Singh', initials: 'VS', interactions: 123, level: 'Silver Fan' },
  { name: 'Neha Kapoor', initials: 'NK', interactions: 98, level: 'Silver Fan' },
]

const demographics = [
  { label: '18-24', pct: 35, color: 'bg-blue-500' },
  { label: '25-34', pct: 42, color: 'bg-violet-500' },
  { label: '35-44', pct: 15, color: 'bg-amber-500' },
  { label: '45+', pct: 8, color: 'bg-emerald-500' },
]

const topLocations = [
  { city: 'Mumbai', pct: 28 },
  { city: 'Delhi', pct: 22 },
  { city: 'Bangalore', pct: 18 },
  { city: 'Kolkata', pct: 12 },
  { city: 'Chennai', pct: 8 },
]

const weeklyActivity = [
  { day: 'Mon', value: 65 },
  { day: 'Tue', value: 80 },
  { day: 'Wed', value: 45 },
  { day: 'Thu', value: 90 },
  { day: 'Fri', value: 75 },
  { day: 'Sat', value: 95 },
  { day: 'Sun', value: 60 },
]

export function AnalyticsPage() {
  return (
    <div className="space-y-4">
      <div className="card p-5">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold text-text-primary">Fan Analytics</h1>
        </div>
        <p className="text-xs text-text-secondary mt-0.5">
          Understand your audience, track engagement, and grow your community
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          const isPositive = stat.change >= 0
          return (
            <div key={stat.label} className="card p-4 animate-fade-in hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className={cn('rounded-xl p-2', stat.bgColor)}>
                  <Icon className={cn('h-4 w-4', stat.color)} />
                </div>
                <span className={cn(
                  'flex items-center gap-0.5 text-xs font-medium',
                  isPositive ? 'text-emerald-600' : 'text-rose-500',
                )}>
                  {isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                  {Math.abs(stat.change)}%
                </span>
              </div>
              <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
              <p className="text-xs text-text-muted mt-0.5">{stat.label}</p>
            </div>
          )
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Weekly Activity */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold text-text-primary">Weekly Activity</h3>
          </div>
          <div className="flex items-end gap-2 h-32">
            {weeklyActivity.map(({ day, value }) => (
              <div key={day} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full rounded-t-md bg-gradient-to-t from-primary to-primary/60 transition-all hover:opacity-80" style={{ height: `${value}%` }} />
                <span className="text-[10px] text-text-muted">{day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Age Demographics */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold text-text-primary">Audience Age</h3>
          </div>
          <div className="space-y-3">
            {demographics.map(({ label, pct, color }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="text-xs text-text-muted w-10">{label}</span>
                <div className="flex-1 h-3 rounded-full bg-bg-tertiary overflow-hidden">
                  <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs font-medium text-text-primary w-8 text-right">{pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Locations */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold text-text-primary">Top Locations</h3>
          </div>
          <div className="space-y-2.5">
            {topLocations.map(({ city, pct }, i) => (
              <div key={city} className="flex items-center gap-3">
                <span className="text-xs font-bold text-text-muted w-4">{i + 1}</span>
                <span className="text-sm text-text-primary flex-1">{city}</span>
                <span className="text-xs font-medium text-primary">{pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Most Active Fans */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Star className="h-4 w-4 text-amber-500" />
            <h3 className="text-sm font-bold text-text-primary">Most Active Fans</h3>
          </div>
          <div className="space-y-2.5">
            {topFans.map((fan, i) => (
              <div key={fan.name} className="flex items-center gap-3">
                <span className="text-xs font-bold text-text-muted w-4">{i + 1}</span>
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-primary text-[10px] font-bold flex-shrink-0">
                  {fan.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{fan.name}</p>
                  <p className="text-[10px] text-text-muted">{fan.level}</p>
                </div>
                <span className="text-xs font-medium text-primary">{fan.interactions} acts</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Posts */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold text-text-primary">Top Performing Posts</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-text-muted pb-2">Post</th>
                <th className="text-right text-xs font-medium text-text-muted pb-2">Likes</th>
                <th className="text-right text-xs font-medium text-text-muted pb-2">Comments</th>
                <th className="text-right text-xs font-medium text-text-muted pb-2">Shares</th>
                <th className="text-right text-xs font-medium text-text-muted pb-2">Impressions</th>
              </tr>
            </thead>
            <tbody>
              {topPosts.map((post, i) => (
                <tr key={i} className="border-b border-border last:border-0 hover:bg-bg-secondary/50 transition-colors">
                  <td className="py-2.5 pr-4">
                    <p className="text-sm text-text-primary truncate max-w-[200px]">{post.title}</p>
                  </td>
                  <td className="py-2.5 text-right text-text-secondary">
                    <span className="flex items-center justify-end gap-1"><Heart className="h-3 w-3 text-rose-400" /> {post.likes.toLocaleString()}</span>
                  </td>
                  <td className="py-2.5 text-right text-text-secondary">
                    <span className="flex items-center justify-end gap-1"><MessageCircle className="h-3 w-3 text-blue-400" /> {post.comments}</span>
                  </td>
                  <td className="py-2.5 text-right text-text-secondary">{post.shares}</td>
                  <td className="py-2.5 text-right font-medium text-text-primary">{post.impressions.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
