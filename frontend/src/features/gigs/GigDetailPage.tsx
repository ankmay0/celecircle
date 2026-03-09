import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  MapPin,
  Calendar,
  IndianRupee,
  Briefcase,
  Globe,
  Clock,
  Loader2,
  Send,
  Users,
  CheckCircle2,
  XCircle,
  ArrowLeft,
} from 'lucide-react'
import { gigsApi } from '@/api/gigs'
import { useAuthStore } from '@/stores/authStore'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { formatDate, formatCurrency, cn } from '@/lib/utils'
import type { Gig, Application } from '@/types'

export function GigDetailPage() {
  const { id } = useParams<{ id: string }>()
  const user = useAuthStore((s) => s.user)
  const [gig, setGig] = useState<Gig | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [showApply, setShowApply] = useState(false)
  const [proposal, setProposal] = useState('')
  const [quote, setQuote] = useState('')
  const [applying, setApplying] = useState(false)
  const [applied, setApplied] = useState(false)

  const gigId = Number(id)
  const isOrganizer = user?.role === 'organizer'
  const isOwnGig = gig?.organizer_id === user?.id

  const loadGig = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await gigsApi.getGig(gigId)
      setGig(data)
      if (isOrganizer) {
        try {
          const { data: apps } = await gigsApi.getApplications(gigId)
          setApplications(apps)
        } catch {
          // May not have permission
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [gigId, isOrganizer])

  useEffect(() => {
    loadGig()
  }, [loadGig])

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault()
    setApplying(true)
    try {
      await gigsApi.applyToGig(gigId, { proposal, quote: Number(quote) })
      setApplied(true)
      setShowApply(false)
    } catch {
      // silent
    } finally {
      setApplying(false)
    }
  }

  const handleApplicationStatus = async (appId: number, status: string) => {
    try {
      await gigsApi.updateApplication(appId, status)
      setApplications((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, status: status as Application['status'] } : a)),
      )
    } catch {
      // silent
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!gig) {
    return (
      <div className="card p-12 text-center">
        <p className="text-text-secondary">Gig not found</p>
        <Link to="/gigs" className="btn-primary mt-4 inline-flex">Back to Gigs</Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Link to="/gigs" className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-primary transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Gigs
      </Link>

      {/* Gig Details */}
      <div className="card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={cn(
                'rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase',
                gig.status === 'open' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-bg-tertiary text-text-muted',
              )}>
                {gig.status}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-text-primary">{gig.title}</h1>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-lg font-bold text-primary">
              <IndianRupee className="h-4 w-4" />
              {formatCurrency(gig.budget_min)} - {formatCurrency(gig.budget_max)}
            </div>
            <p className="text-xs text-text-muted">Budget range</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-sm text-text-secondary">
          <span className="flex items-center gap-1.5"><Briefcase className="h-4 w-4 text-text-muted" /> {gig.category}</span>
          <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-text-muted" /> {gig.location}</span>
          <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4 text-text-muted" /> {formatDate(gig.event_date)}</span>
          {gig.required_languages && (
            <span className="flex items-center gap-1.5"><Globe className="h-4 w-4 text-text-muted" /> {gig.required_languages}</span>
          )}
          {gig.required_experience > 0 && (
            <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-text-muted" /> {gig.required_experience}+ years</span>
          )}
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-semibold text-text-primary mb-2">Description</h3>
          <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{gig.description}</p>
        </div>

        <div className="mt-4 pt-4 border-t border-border text-xs text-text-muted">
          Posted {formatDate(gig.created_at)}
        </div>
      </div>

      {/* Apply Section (Artist) */}
      {user?.role === 'artist' && gig.status === 'open' && !isOwnGig && (
        <div className="card p-6">
          {applied ? (
            <div className="text-center py-4">
              <CheckCircle2 className="h-8 w-8 text-success mx-auto mb-2" />
              <p className="font-semibold text-text-primary">Application Submitted!</p>
              <p className="text-sm text-text-secondary mt-1">The organizer will review your application</p>
            </div>
          ) : showApply ? (
            <form onSubmit={handleApply} className="space-y-4">
              <h3 className="text-sm font-semibold text-text-primary">Apply to this Gig</h3>
              <div>
                <label className="text-sm font-medium text-text-primary mb-1.5 block">Your Proposal</label>
                <textarea
                  value={proposal}
                  onChange={(e) => setProposal(e.target.value)}
                  className="input-field min-h-[100px] resize-none"
                  placeholder="Describe why you're a great fit for this gig..."
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-text-primary mb-1.5 block">Your Quote (INR)</label>
                <input
                  type="number"
                  value={quote}
                  onChange={(e) => setQuote(e.target.value)}
                  className="input-field"
                  placeholder="Enter your price"
                  min={0}
                  required
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowApply(false)} className="btn-ghost border border-border flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={applying} className="btn-primary flex-1">
                  {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {applying ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          ) : (
            <button onClick={() => setShowApply(true)} className="btn-primary w-full">
              <Send className="h-4 w-4" /> Apply Now
            </button>
          )}
        </div>
      )}

      {/* Applications (Organizer) */}
      {isOwnGig && applications.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-semibold text-text-primary">
              Applications ({applications.length})
            </h3>
          </div>
          <div className="space-y-3">
            {applications.map((app) => (
              <div key={app.id} className="rounded-lg border border-border p-4">
                <div className="flex items-start gap-3">
                  <UserAvatar
                    src={app.artist?.profile_photo_url}
                    firstName={app.artist?.first_name}
                    lastName={app.artist?.last_name}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-text-primary">
                        {app.artist?.first_name} {app.artist?.last_name}
                      </p>
                      <span className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase',
                        app.status === 'pending' && 'bg-amber-500/10 text-amber-600',
                        app.status === 'accepted' && 'bg-emerald-500/10 text-emerald-600',
                        app.status === 'rejected' && 'bg-danger/10 text-danger',
                      )}>
                        {app.status}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary mt-1">{app.proposal}</p>
                    <p className="text-sm font-semibold text-primary mt-2">{formatCurrency(app.quote)}</p>
                  </div>
                </div>
                {app.status === 'pending' && (
                  <div className="flex gap-2 mt-3 ml-13">
                    <button
                      onClick={() => handleApplicationStatus(app.id, 'accepted')}
                      className="btn-primary !px-4 !py-1.5 !text-xs"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Accept
                    </button>
                    <button
                      onClick={() => handleApplicationStatus(app.id, 'rejected')}
                      className="btn-ghost border border-border !px-4 !py-1.5 !text-xs text-danger"
                    >
                      <XCircle className="h-3.5 w-3.5" /> Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
