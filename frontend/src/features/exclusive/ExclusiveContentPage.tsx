import { useState } from 'react'
import {
  Lock,
  Play,
  Image,
  Crown,
  Eye,
  Heart,
  Clock,
  Sparkles,
  Filter,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type ContentType = 'all' | 'video' | 'photo' | 'update'

interface ExclusiveItem {
  id: number
  celebrity: string
  celebrityInitials: string
  title: string
  description: string
  type: 'video' | 'photo' | 'update'
  isLocked: boolean
  likes: number
  views: number
  time: string
  gradient: string
  tier: 'silver' | 'gold' | 'superfan'
}

const demoContent: ExclusiveItem[] = [
  { id: 1, celebrity: 'Priya Sharma', celebrityInitials: 'PS', title: 'Behind the scenes: New Album Recording', description: 'An exclusive look at the recording studio session for my upcoming album...', type: 'video', isLocked: false, likes: 342, views: 1200, time: '2h ago', gradient: 'from-rose-500/30 to-pink-600/10', tier: 'silver' },
  { id: 2, celebrity: 'Rahul Mehta', celebrityInitials: 'RM', title: 'Exclusive: Concert Stage Setup', description: 'See how we set up the massive stage for the Mumbai concert before anyone else...', type: 'photo', isLocked: true, likes: 189, views: 890, time: '5h ago', gradient: 'from-blue-500/30 to-indigo-600/10', tier: 'gold' },
  { id: 3, celebrity: 'Ananya Roy', celebrityInitials: 'AR', title: 'Personal Update: My Journey So Far', description: 'A heartfelt update about my career journey and what\'s coming next...', type: 'update', isLocked: false, likes: 567, views: 2300, time: '1d ago', gradient: 'from-violet-500/30 to-purple-600/10', tier: 'silver' },
  { id: 4, celebrity: 'Vikram Singh', celebrityInitials: 'VS', title: 'Early Release: New Single Preview', description: 'Listen to a 30-second preview of my new single before the official release!', type: 'video', isLocked: true, likes: 423, views: 1800, time: '1d ago', gradient: 'from-amber-500/30 to-orange-600/10', tier: 'superfan' },
  { id: 5, celebrity: 'Neha Kapoor', celebrityInitials: 'NK', title: 'Private Rehearsal Photos', description: 'Exclusive photos from my dance rehearsal for the upcoming show...', type: 'photo', isLocked: true, likes: 256, views: 960, time: '2d ago', gradient: 'from-emerald-500/30 to-teal-600/10', tier: 'gold' },
  { id: 6, celebrity: 'Amit Patel', celebrityInitials: 'AP', title: 'Life Update: Big News Coming!', description: 'Something exciting is in the works. Here\'s a sneak peek for my loyal fans...', type: 'update', isLocked: false, likes: 789, views: 3400, time: '3d ago', gradient: 'from-cyan-500/30 to-blue-600/10', tier: 'silver' },
]

const tierLabels = {
  silver: { label: 'Silver+', color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-gray-800' },
  gold: { label: 'Gold+', color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
  superfan: { label: 'Superfan', color: 'text-violet-600', bg: 'bg-violet-100 dark:bg-violet-900/30' },
}

const typeIcon = {
  video: Play,
  photo: Image,
  update: Sparkles,
}

export function ExclusiveContentPage() {
  const [filter, setFilter] = useState<ContentType>('all')
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set())

  const filtered = filter === 'all'
    ? demoContent
    : demoContent.filter((c) => c.type === filter)

  const toggleLike = (id: number) => {
    setLikedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const filters: { value: ContentType; label: string; icon: typeof Play }[] = [
    { value: 'all', label: 'All', icon: Filter },
    { value: 'video', label: 'Videos', icon: Play },
    { value: 'photo', label: 'Photos', icon: Image },
    { value: 'update', label: 'Updates', icon: Sparkles },
  ]

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" />
            <h1 className="text-xl font-bold text-text-primary">Exclusive Content</h1>
          </div>
          <span className="text-xs text-text-muted">{demoContent.length} items</span>
        </div>
        <p className="text-xs text-text-secondary mb-4">
          Behind-the-scenes, early releases, and private updates from your favorite celebrities
        </p>

        <div className="flex items-center gap-2 flex-wrap">
          {filters.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all border',
                filter === value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-text-secondary hover:bg-bg-secondary',
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {filtered.map((item) => {
          const TypeIcon = typeIcon[item.type]
          const tier = tierLabels[item.tier]
          const isLiked = likedIds.has(item.id)
          return (
            <div key={item.id} className="card overflow-hidden hover:shadow-md transition-shadow animate-fade-in group">
              {/* Media preview */}
              <div className={cn('relative h-44 bg-gradient-to-br flex items-center justify-center', item.gradient)}>
                {item.isLocked ? (
                  <div className="text-center">
                    <div className="h-12 w-12 rounded-full bg-black/30 backdrop-blur flex items-center justify-center mx-auto">
                      <Lock className="h-6 w-6 text-white" />
                    </div>
                    <p className="text-xs text-white/80 mt-2 font-medium">
                      Unlock with {tier.label}
                    </p>
                  </div>
                ) : (
                  <TypeIcon className="h-12 w-12 text-white/40 group-hover:scale-110 transition-transform" />
                )}
                <div className="absolute top-3 left-3">
                  <span className={cn('rounded-full px-2.5 py-0.5 text-[10px] font-semibold', tier.bg, tier.color)}>
                    {tier.label}
                  </span>
                </div>
                <div className="absolute top-3 right-3">
                  <span className="rounded-full bg-black/40 backdrop-blur px-2 py-0.5 text-[10px] text-white font-medium flex items-center gap-1">
                    <TypeIcon className="h-2.5 w-2.5" />
                    {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                  </span>
                </div>
              </div>

              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-primary text-[10px] font-bold">
                    {item.celebrityInitials}
                  </div>
                  <span className="text-xs font-medium text-text-secondary">{item.celebrity}</span>
                  <span className="text-[10px] text-text-muted flex items-center gap-0.5">
                    <Clock className="h-2.5 w-2.5" /> {item.time}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-text-primary">{item.title}</h3>
                <p className="text-xs text-text-secondary mt-1 line-clamp-2">{item.description}</p>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleLike(item.id)}
                      className={cn(
                        'flex items-center gap-1 text-xs transition-colors',
                        isLiked ? 'text-rose-500' : 'text-text-muted hover:text-rose-500',
                      )}
                    >
                      <Heart className={cn('h-3.5 w-3.5', isLiked && 'fill-current')} />
                      {item.likes + (isLiked ? 1 : 0)}
                    </button>
                    <span className="flex items-center gap-1 text-xs text-text-muted">
                      <Eye className="h-3.5 w-3.5" /> {item.views.toLocaleString()}
                    </span>
                  </div>
                  {item.isLocked ? (
                    <button className="rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium hover:bg-primary/20 transition-colors">
                      Unlock
                    </button>
                  ) : (
                    <button className="rounded-full bg-bg-secondary text-text-secondary px-3 py-1 text-xs font-medium hover:bg-bg-tertiary transition-colors">
                      View
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
