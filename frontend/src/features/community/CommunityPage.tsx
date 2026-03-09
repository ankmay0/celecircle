import { useState } from 'react'
import {
  Users,
  MessageSquare,
  Image,
  Trophy,
  Search,
  Plus,
  Heart,
  MessageCircle,
  Star,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type Tab = 'clubs' | 'discussions' | 'fan-art' | 'challenges'

interface FanClub {
  id: number
  name: string
  description: string
  members: number
  coverColor: string
  initials: string
  isJoined: boolean
  category: string
}

interface Discussion {
  id: number
  author: string
  authorInitials: string
  club: string
  title: string
  content: string
  likes: number
  replies: number
  time: string
}

interface FanArt {
  id: number
  author: string
  authorInitials: string
  title: string
  likes: number
  comments: number
  color: string
}

interface Challenge {
  id: number
  title: string
  description: string
  participants: number
  daysLeft: number
  reward: string
  difficulty: string
}

const demoClubs: FanClub[] = [
  { id: 1, name: 'Bollywood Beats', description: 'For fans of Bollywood music and dance', members: 1250, coverColor: 'from-rose-500 to-pink-600', initials: 'BB', isJoined: true, category: 'Music' },
  { id: 2, name: 'Comedy Kings', description: 'Stand-up comedy fans unite', members: 890, coverColor: 'from-amber-500 to-orange-600', initials: 'CK', isJoined: false, category: 'Comedy' },
  { id: 3, name: 'Dance Revolution', description: 'All forms of dance and choreography', members: 2100, coverColor: 'from-violet-500 to-purple-600', initials: 'DR', isJoined: true, category: 'Dance' },
  { id: 4, name: 'Indie Music Lovers', description: 'Independent artists and their music', members: 560, coverColor: 'from-emerald-500 to-teal-600', initials: 'IM', isJoined: false, category: 'Music' },
  { id: 5, name: 'Film Buffs', description: 'Movie discussions, reviews, and trivia', members: 3200, coverColor: 'from-blue-500 to-indigo-600', initials: 'FB', isJoined: false, category: 'Film' },
  { id: 6, name: 'Event Planners Hub', description: 'Tips and tricks for organizing events', members: 430, coverColor: 'from-cyan-500 to-blue-600', initials: 'EP', isJoined: true, category: 'Events' },
]

const demoDiscussions: Discussion[] = [
  { id: 1, author: 'Priya S.', authorInitials: 'PS', club: 'Bollywood Beats', title: 'Best Bollywood songs of 2025?', content: 'What are your top picks for the best Bollywood songs released this year? I think the new AR Rahman album is incredible...', likes: 45, replies: 23, time: '2h ago' },
  { id: 2, author: 'Rahul M.', authorInitials: 'RM', club: 'Dance Revolution', title: 'Tips for beginners in classical dance', content: 'Starting my journey in Bharatanatyam. Any tips from experienced dancers here?', likes: 32, replies: 18, time: '4h ago' },
  { id: 3, author: 'Ananya R.', authorInitials: 'AR', club: 'Film Buffs', title: 'Underrated indie films to watch', content: 'Let\'s create a list of indie films that deserve more recognition...', likes: 67, replies: 41, time: '6h ago' },
]

const demoFanArt: FanArt[] = [
  { id: 1, author: 'Vikram S.', authorInitials: 'VS', title: 'Digital portrait of Arijit Singh', likes: 234, comments: 18, color: 'from-rose-400/30 to-rose-600/10' },
  { id: 2, author: 'Neha K.', authorInitials: 'NK', title: 'Abstract dance illustration', likes: 189, comments: 12, color: 'from-violet-400/30 to-violet-600/10' },
  { id: 3, author: 'Amit P.', authorInitials: 'AP', title: 'Concert poster design', likes: 156, comments: 9, color: 'from-amber-400/30 to-amber-600/10' },
  { id: 4, author: 'Riya D.', authorInitials: 'RD', title: 'Bollywood collage art', likes: 312, comments: 27, color: 'from-blue-400/30 to-blue-600/10' },
  { id: 5, author: 'Sanjay G.', authorInitials: 'SG', title: 'Classical musician sketch', likes: 98, comments: 5, color: 'from-emerald-400/30 to-emerald-600/10' },
  { id: 6, author: 'Meera L.', authorInitials: 'ML', title: 'Event stage design concept', likes: 145, comments: 11, color: 'from-cyan-400/30 to-cyan-600/10' },
]

const demoChallenges: Challenge[] = [
  { id: 1, title: 'Dance Cover Challenge', description: 'Record a 30-second dance cover of any trending song and share it!', participants: 234, daysLeft: 5, reward: '500 CeleCoins + Gold Badge', difficulty: 'Medium' },
  { id: 2, title: 'Fan Art Week', description: 'Create original fan art of your favorite celebrity. Best artwork wins!', participants: 156, daysLeft: 12, reward: '1000 CeleCoins + Featured Profile', difficulty: 'Easy' },
  { id: 3, title: 'Trivia Master', description: 'Answer 20 Bollywood trivia questions correctly in under 5 minutes.', participants: 412, daysLeft: 3, reward: '300 CeleCoins + Trivia Badge', difficulty: 'Hard' },
]

const tabs = [
  { value: 'clubs' as const, label: 'Fan Clubs', icon: Users },
  { value: 'discussions' as const, label: 'Discussions', icon: MessageSquare },
  { value: 'fan-art' as const, label: 'Fan Art', icon: Image },
  { value: 'challenges' as const, label: 'Challenges', icon: Trophy },
]

export function CommunityPage() {
  const [tab, setTab] = useState<Tab>('clubs')
  const [clubs, setClubs] = useState(demoClubs)
  const [search, setSearch] = useState('')

  const toggleJoin = (clubId: number) => {
    setClubs((prev) =>
      prev.map((c) =>
        c.id === clubId
          ? { ...c, isJoined: !c.isJoined, members: c.isJoined ? c.members - 1 : c.members + 1 }
          : c,
      ),
    )
  }

  const filteredClubs = clubs.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-text-primary">Community</h1>
            <p className="text-xs text-text-secondary mt-0.5">
              Join fan clubs, discuss, share art, and take on challenges
            </p>
          </div>
          <button className="btn-primary !text-xs !px-4 !py-2">
            <Plus className="h-3.5 w-3.5" /> Create Club
          </button>
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

      {/* Fan Clubs */}
      {tab === 'clubs' && (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search fan clubs..."
              className="input-field !pl-10"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredClubs.map((club) => (
              <div key={club.id} className="card overflow-hidden hover:shadow-md transition-shadow animate-fade-in">
                <div className={cn('h-20 bg-gradient-to-r', club.coverColor)} />
                <div className="p-4 -mt-6">
                  <div className="h-12 w-12 rounded-xl bg-card shadow-lg flex items-center justify-center text-lg font-bold text-text-primary border border-border">
                    {club.initials}
                  </div>
                  <h3 className="text-sm font-bold text-text-primary mt-2">{club.name}</h3>
                  <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">{club.description}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-[11px] text-text-muted flex items-center gap-1">
                      <Users className="h-3 w-3" /> {club.members.toLocaleString()} members
                    </span>
                    <button
                      onClick={() => toggleJoin(club.id)}
                      className={cn(
                        'rounded-full px-3 py-1 text-xs font-medium transition-all',
                        club.isJoined
                          ? 'bg-bg-secondary text-text-secondary hover:bg-danger/10 hover:text-danger'
                          : 'bg-primary text-white hover:bg-primary-hover',
                      )}
                    >
                      {club.isJoined ? 'Joined' : 'Join'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Discussions */}
      {tab === 'discussions' && (
        <div className="space-y-3">
          {demoDiscussions.map((d) => (
            <div key={d.id} className="card p-4 hover:shadow-md transition-shadow animate-fade-in">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
                  {d.authorInitials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs text-text-muted mb-1">
                    <span className="font-medium text-text-primary">{d.author}</span>
                    <span>in</span>
                    <span className="font-medium text-primary">{d.club}</span>
                    <span>•</span>
                    <span>{d.time}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-text-primary">{d.title}</h3>
                  <p className="text-xs text-text-secondary mt-1 line-clamp-2">{d.content}</p>
                  <div className="flex items-center gap-4 mt-2.5">
                    <button className="flex items-center gap-1 text-xs text-text-muted hover:text-rose-500 transition-colors">
                      <Heart className="h-3.5 w-3.5" /> {d.likes}
                    </button>
                    <button className="flex items-center gap-1 text-xs text-text-muted hover:text-primary transition-colors">
                      <MessageCircle className="h-3.5 w-3.5" /> {d.replies} replies
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fan Art */}
      {tab === 'fan-art' && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {demoFanArt.map((art) => (
            <div key={art.id} className="card overflow-hidden hover:shadow-md transition-shadow animate-fade-in group cursor-pointer">
              <div className={cn('h-48 bg-gradient-to-br flex items-center justify-center', art.color)}>
                <Image className="h-12 w-12 text-text-muted/30 group-hover:scale-110 transition-transform" />
              </div>
              <div className="p-3">
                <p className="text-sm font-medium text-text-primary truncate">{art.title}</p>
                <p className="text-xs text-text-secondary mt-0.5">by {art.author}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="flex items-center gap-1 text-xs text-text-muted">
                    <Heart className="h-3 w-3" /> {art.likes}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-text-muted">
                    <MessageCircle className="h-3 w-3" /> {art.comments}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Challenges */}
      {tab === 'challenges' && (
        <div className="space-y-3">
          {demoChallenges.map((ch) => (
            <div key={ch.id} className="card p-5 hover:shadow-md transition-shadow animate-fade-in">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Trophy className="h-4 w-4 text-amber-500" />
                    <h3 className="text-sm font-bold text-text-primary">{ch.title}</h3>
                    <span className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] font-medium',
                      ch.difficulty === 'Easy' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      ch.difficulty === 'Medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                      'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
                    )}>
                      {ch.difficulty}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">{ch.description}</p>
                  <div className="flex items-center gap-4 mt-3">
                    <span className="flex items-center gap-1 text-xs text-text-muted">
                      <Users className="h-3 w-3" /> {ch.participants} joined
                    </span>
                    <span className="text-xs text-text-muted">
                      {ch.daysLeft} days left
                    </span>
                    <span className="flex items-center gap-1 text-xs text-amber-600">
                      <Star className="h-3 w-3" /> {ch.reward}
                    </span>
                  </div>
                </div>
                <button className="btn-primary !text-xs !px-4 !py-2 flex-shrink-0">
                  Join
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
