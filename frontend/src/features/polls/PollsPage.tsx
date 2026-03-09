import { useState } from 'react'
import {
  BarChart3,
  Plus,
  Clock,
  Users,
  CheckCircle2,
  Vote,
  TrendingUp,
  Sparkles,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface PollOption {
  id: string
  text: string
  votes: number
}

interface Poll {
  id: number
  author: string
  authorInitials: string
  question: string
  options: PollOption[]
  totalVotes: number
  endsIn: string
  isActive: boolean
  myVote: string | null
  category: string
}

const demoPolls: Poll[] = [
  {
    id: 1, author: 'Priya Sharma', authorInitials: 'PS',
    question: 'What type of content should I post more?',
    options: [
      { id: 'a', text: 'Behind-the-scenes videos', votes: 342 },
      { id: 'b', text: 'Dance tutorials', votes: 289 },
      { id: 'c', text: 'Life vlogs', votes: 178 },
      { id: 'd', text: 'Music covers', votes: 234 },
    ],
    totalVotes: 1043, endsIn: '2 days', isActive: true, myVote: null, category: 'Content',
  },
  {
    id: 2, author: 'Rahul Mehta', authorInitials: 'RM',
    question: 'Where should the next fan meetup be?',
    options: [
      { id: 'a', text: 'Mumbai', votes: 456 },
      { id: 'b', text: 'Delhi', votes: 389 },
      { id: 'c', text: 'Bangalore', votes: 234 },
      { id: 'd', text: 'Kolkata', votes: 178 },
    ],
    totalVotes: 1257, endsIn: '5 days', isActive: true, myVote: null, category: 'Events',
  },
  {
    id: 3, author: 'Ananya Roy', authorInitials: 'AR',
    question: 'Which design should I pick for my new merch?',
    options: [
      { id: 'a', text: 'Minimalist logo', votes: 567 },
      { id: 'b', text: 'Colorful abstract', votes: 432 },
      { id: 'c', text: 'Vintage retro', votes: 345 },
    ],
    totalVotes: 1344, endsIn: 'Ended', isActive: false, myVote: 'a', category: 'Merch',
  },
  {
    id: 4, author: 'Vikram Singh', authorInitials: 'VS',
    question: 'What genre should my next single be?',
    options: [
      { id: 'a', text: 'Pop', votes: 234 },
      { id: 'b', text: 'Rock', votes: 189 },
      { id: 'c', text: 'Classical fusion', votes: 312 },
      { id: 'd', text: 'EDM', votes: 145 },
    ],
    totalVotes: 880, endsIn: '1 day', isActive: true, myVote: null, category: 'Music',
  },
]

export function PollsPage() {
  const [polls, setPolls] = useState(demoPolls)
  const [filter, setFilter] = useState<'active' | 'ended' | 'all'>('all')
  const [showCreate, setShowCreate] = useState(false)

  const filtered = filter === 'all'
    ? polls
    : filter === 'active'
    ? polls.filter((p) => p.isActive)
    : polls.filter((p) => !p.isActive)

  const handleVote = (pollId: number, optionId: string) => {
    setPolls((prev) =>
      prev.map((p) => {
        if (p.id !== pollId || p.myVote) return p
        return {
          ...p,
          myVote: optionId,
          totalVotes: p.totalVotes + 1,
          options: p.options.map((o) =>
            o.id === optionId ? { ...o, votes: o.votes + 1 } : o,
          ),
        }
      }),
    )
  }

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Vote className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-bold text-text-primary">Polls & Voting</h1>
            </div>
            <p className="text-xs text-text-secondary mt-0.5">
              Vote on celebrity decisions and make your voice heard
            </p>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn-primary !text-xs !px-4 !py-2">
            <Plus className="h-3.5 w-3.5" /> Create Poll
          </button>
        </div>

        <div className="flex items-center gap-2">
          {(['all', 'active', 'ended'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-xs font-medium transition-all border capitalize',
                filter === f
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-text-secondary hover:bg-bg-secondary',
              )}
            >
              {f === 'all' ? `All (${polls.length})` : f === 'active' ? `Active (${polls.filter((p) => p.isActive).length})` : `Ended (${polls.filter((p) => !p.isActive).length})`}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filtered.map((poll) => {
          const maxVotes = Math.max(...poll.options.map((o) => o.votes))
          const hasVoted = poll.myVote !== null
          return (
            <div key={poll.id} className="card p-5 animate-fade-in hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-primary text-xs font-bold">
                    {poll.authorInitials}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-text-primary">{poll.author}</p>
                    <span className="text-[10px] text-text-muted">{poll.category}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {poll.isActive ? (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                      <Clock className="h-2.5 w-2.5" /> {poll.endsIn}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 rounded-full bg-bg-tertiary px-2.5 py-0.5 text-[10px] font-medium text-text-muted">
                      <CheckCircle2 className="h-2.5 w-2.5" /> Ended
                    </span>
                  )}
                </div>
              </div>

              <h3 className="text-sm font-bold text-text-primary mb-3">{poll.question}</h3>

              <div className="space-y-2">
                {poll.options.map((option) => {
                  const pct = poll.totalVotes > 0 ? Math.round((option.votes / poll.totalVotes) * 100) : 0
                  const isWinner = option.votes === maxVotes && !poll.isActive
                  const isMyVote = poll.myVote === option.id
                  return (
                    <button
                      key={option.id}
                      onClick={() => poll.isActive && !hasVoted && handleVote(poll.id, option.id)}
                      disabled={!poll.isActive || hasVoted}
                      className={cn(
                        'relative w-full text-left rounded-xl border p-3 overflow-hidden transition-all',
                        !hasVoted && poll.isActive
                          ? 'border-border hover:border-primary hover:bg-primary/5 cursor-pointer'
                          : 'border-border cursor-default',
                        isMyVote && 'border-primary bg-primary/5',
                        isWinner && '!border-emerald-400 bg-emerald-50 dark:bg-emerald-900/10',
                      )}
                    >
                      {hasVoted && (
                        <div
                          className={cn(
                            'absolute inset-y-0 left-0 transition-all',
                            isMyVote ? 'bg-primary/10' : 'bg-bg-secondary/80',
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      )}
                      <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {isMyVote && <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />}
                          <span className={cn('text-sm', isMyVote ? 'font-semibold text-primary' : 'text-text-primary')}>
                            {option.text}
                          </span>
                          {isWinner && <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />}
                        </div>
                        {hasVoted && (
                          <span className={cn('text-xs font-bold', isMyVote ? 'text-primary' : 'text-text-muted')}>
                            {pct}%
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="flex items-center gap-3 mt-3 pt-2 border-t border-border">
                <span className="flex items-center gap-1 text-xs text-text-muted">
                  <Users className="h-3 w-3" /> {poll.totalVotes.toLocaleString()} votes
                </span>
                <span className="flex items-center gap-1 text-xs text-text-muted">
                  <BarChart3 className="h-3 w-3" /> {poll.options.length} options
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Create Poll Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={(e) => { if (e.target === e.currentTarget) setShowCreate(false) }}>
          <div className="w-full max-w-md rounded-2xl bg-card border border-border shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="text-lg font-semibold text-text-primary">Create a Poll</h3>
              <button onClick={() => setShowCreate(false)} className="rounded-full p-1.5 hover:bg-bg-secondary transition-colors">
                <X className="h-5 w-5 text-text-secondary" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-text-secondary mb-1 block">Question</label>
                <input type="text" placeholder="Ask your fans..." className="input-field" />
              </div>
              <div>
                <label className="text-xs font-medium text-text-secondary mb-1 block">Options</label>
                <div className="space-y-2">
                  <input type="text" placeholder="Option 1" className="input-field" />
                  <input type="text" placeholder="Option 2" className="input-field" />
                  <input type="text" placeholder="Option 3 (optional)" className="input-field" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-text-secondary mb-1 block">Duration</label>
                <select className="input-field">
                  <option>1 day</option>
                  <option>3 days</option>
                  <option>7 days</option>
                  <option>14 days</option>
                </select>
              </div>
            </div>
            <div className="px-5 py-3 border-t border-border flex justify-end gap-2">
              <button onClick={() => setShowCreate(false)} className="btn-ghost">Cancel</button>
              <button onClick={() => setShowCreate(false)} className="btn-primary">
                <Sparkles className="h-4 w-4" /> Create Poll
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
