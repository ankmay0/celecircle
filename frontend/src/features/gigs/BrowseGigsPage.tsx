import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  MapPin,
  Calendar,
  IndianRupee,
  Briefcase,
  Filter,
  Plus,
  Loader2,
  Clock,
} from 'lucide-react'
import { gigsApi } from '@/api/gigs'
import { useAuthStore } from '@/stores/authStore'
import { formatDate, formatCurrency, cn } from '@/lib/utils'
import type { Gig } from '@/types'

const categoryFilters = ['All', 'Singer', 'Dancer', 'Actor', 'Comedian', 'Anchor/Host', 'Musician', 'DJ', 'Band']

export function BrowseGigsPage() {
  const user = useAuthStore((s) => s.user)
  const [gigs, setGigs] = useState<Gig[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [showFilters, setShowFilters] = useState(false)

  const fetchGigs = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = { status: 'open' }
      if (search) params.search = search
      if (category !== 'All') params.category = category
      const { data } = await gigsApi.getGigs(params)
      setGigs(data)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [search, category])

  useEffect(() => {
    const t = setTimeout(fetchGigs, 300)
    return () => clearTimeout(t)
  }, [fetchGigs])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">Browse Gigs</h1>
        {user?.role === 'organizer' && (
          <Link to="/gigs/new" className="btn-primary">
            <Plus className="h-4 w-4" /> Post a Gig
          </Link>
        )}
      </div>

      {/* Search & Filter */}
      <div className="card p-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search gigs by title, location..."
              className="input-field pl-9"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn('btn-ghost border border-border !rounded-lg', showFilters && 'bg-primary/10 text-primary')}
          >
            <Filter className="h-4 w-4" /> Filters
          </button>
        </div>

        {showFilters && (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs font-medium text-text-secondary mb-2">Category</p>
            <div className="flex flex-wrap gap-2">
              {categoryFilters.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-medium transition-all',
                    category === cat
                      ? 'bg-primary text-white'
                      : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary',
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Gig List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : gigs.length === 0 ? (
        <div className="card p-12 text-center">
          <Briefcase className="h-10 w-10 text-text-muted mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-text-primary">No gigs found</h3>
          <p className="text-sm text-text-secondary mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          {gigs.map((gig) => (
            <Link
              key={gig.id}
              to={`/gigs/${gig.id}`}
              className="card p-5 block hover:shadow-md hover:border-primary/20 transition-all group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-text-primary group-hover:text-primary transition-colors">
                    {gig.title}
                  </h3>
                  <p className="text-sm text-text-secondary mt-1 line-clamp-2">{gig.description}</p>
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-text-muted">
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-3.5 w-3.5" /> {gig.category}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {gig.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" /> {formatDate(gig.event_date)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> Posted {formatDate(gig.created_at)}
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="flex items-center gap-1 text-sm font-bold text-primary">
                    <IndianRupee className="h-3.5 w-3.5" />
                    {formatCurrency(gig.budget_min)} - {formatCurrency(gig.budget_max)}
                  </div>
                  <span className={cn(
                    'mt-2 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase',
                    gig.status === 'open' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-bg-tertiary text-text-muted',
                  )}>
                    {gig.status}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
