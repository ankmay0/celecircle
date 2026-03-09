import { TrendingUp, Hash, UserPlus, Flame, ArrowRight, Zap, Star } from 'lucide-react'
import { Link } from 'react-router-dom'

const trendingTopics = [
  { tag: 'BollywoodEvents', count: '2.4k posts', hot: true },
  { tag: 'LiveMusic', count: '1.8k posts', hot: true },
  { tag: 'CelebCollabs', count: '1.2k posts', hot: false },
  { tag: 'DancePerformance', count: '980 posts', hot: false },
  { tag: 'EventPlanning', count: '750 posts', hot: false },
]

const suggestions = [
  { name: 'Priya Sharma', role: 'Classical Dancer', initials: 'PS', category: 'Artist', mutual: 3 },
  { name: 'Rahul Mehta', role: 'Event Organizer', initials: 'RM', category: 'Organizer', mutual: 7 },
  { name: 'Ananya Roy', role: 'Playback Singer', initials: 'AR', category: 'Artist', mutual: 2 },
]

const featuredGigs = [
  { title: 'Wedding Singer Needed', budget: '₹50,000', location: 'Mumbai' },
  { title: 'Corporate Event MC', budget: '₹30,000', location: 'Delhi' },
]

export function RightPanel() {
  return (
    <aside className="hidden xl:block w-[280px] flex-shrink-0">
      <div className="sticky top-[72px] space-y-3">
        {/* Trending */}
        <div className="card overflow-hidden">
          <div className="px-4 pt-4 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-text-primary">Trending</h3>
            </div>
            <Flame className="h-4 w-4 text-amber-500" />
          </div>
          <div className="px-2 pb-2">
            {trendingTopics.map(({ tag, count, hot }, i) => (
              <button key={tag} className="w-full text-left rounded-lg px-3 py-2 hover:bg-bg-secondary transition-colors group">
                <div className="flex items-center gap-2">
                  <Hash className="h-3.5 w-3.5 text-text-muted flex-shrink-0" />
                  <span className="text-sm font-medium text-text-primary group-hover:text-primary transition-colors truncate">
                    {tag}
                  </span>
                  {hot && <Zap className="h-3 w-3 text-amber-500 flex-shrink-0" />}
                </div>
                <p className="text-[11px] text-text-muted ml-[22px]">{count}</p>
                {i < trendingTopics.length - 1 && <div className="border-b border-border/50 mt-2 ml-[22px]" />}
              </button>
            ))}
          </div>
        </div>

        {/* People suggestions */}
        <div className="card overflow-hidden">
          <div className="px-4 pt-4 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-text-primary">People You May Know</h3>
            </div>
          </div>
          <div className="px-3 pb-3 space-y-2">
            {suggestions.map(({ name, role, initials, mutual }) => (
              <div key={name} className="flex items-center gap-3 rounded-lg p-2 hover:bg-bg-secondary transition-colors">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text-primary truncate">{name}</p>
                  <p className="text-xs text-text-secondary truncate">{role}</p>
                  {mutual > 0 && (
                    <p className="text-[10px] text-text-muted flex items-center gap-0.5 mt-0.5">
                      <Star className="h-2.5 w-2.5" />
                      {mutual} mutual connections
                    </p>
                  )}
                </div>
                <button className="rounded-full border border-primary px-3 py-1 text-[11px] font-semibold text-primary hover:bg-primary hover:text-white transition-all flex-shrink-0">
                  Connect
                </button>
              </div>
            ))}
          </div>
          <Link
            to="/network"
            className="flex items-center justify-center gap-1.5 border-t border-border py-2.5 text-xs font-medium text-text-secondary hover:text-primary hover:bg-bg-secondary transition-colors"
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Featured Gigs */}
        <div className="card overflow-hidden">
          <div className="px-4 pt-4 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary">Featured Gigs</h3>
            <span className="text-[10px] font-medium text-primary">NEW</span>
          </div>
          <div className="px-3 pb-3 space-y-2">
            {featuredGigs.map(({ title, budget, location }) => (
              <Link
                key={title}
                to="/gigs"
                className="block rounded-lg p-3 bg-bg-secondary/50 hover:bg-bg-secondary transition-colors border border-transparent hover:border-border"
              >
                <p className="text-sm font-medium text-text-primary truncate">{title}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xs font-semibold text-success">{budget}</span>
                  <span className="text-[10px] text-text-muted">•</span>
                  <span className="text-xs text-text-secondary">{location}</span>
                </div>
              </Link>
            ))}
          </div>
          <Link
            to="/gigs"
            className="flex items-center justify-center gap-1.5 border-t border-border py-2.5 text-xs font-medium text-text-secondary hover:text-primary hover:bg-bg-secondary transition-colors"
          >
            Browse all gigs <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="px-4 py-3 text-center">
          <p className="text-[10px] text-text-muted leading-relaxed">
            CeleCircle &copy; 2026 &middot; <button className="hover:underline">About</button> &middot; <button className="hover:underline">Help</button> &middot; <button className="hover:underline">Privacy</button>
          </p>
        </div>
      </div>
    </aside>
  )
}
