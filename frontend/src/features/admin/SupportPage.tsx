import { useState, useEffect, useCallback } from 'react'
import { HeadphonesIcon, Loader2, MessageSquare, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { adminApi } from '@/api/admin'
import { cn } from '@/lib/utils'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { StatusBadge } from '@/components/admin/StatusBadge'

interface Ticket {
  id: number
  user_email: string
  user_name: string
  subject: string
  description: string
  issue_type: string
  priority: string
  status: string
  admin_email: string | null
  admin_response: string | null
  created_at: string
  updated_at: string
}

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
]

const ISSUE_TYPE_OPTIONS = [
  { value: '', label: 'All Issues' },
  { value: 'payment', label: 'Payment' },
  { value: 'booking', label: 'Booking' },
  { value: 'technical', label: 'Technical' },
  { value: 'account', label: 'Account' },
]

const PRIORITY_OPTIONS = [
  { value: '', label: 'All Priorities' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
]

const PRIORITY_COLORS: Record<string, string> = {
  critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  low: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

export function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [issueType, setIssueType] = useState('')
  const [priority, setPriority] = useState('')
  const limit = 25

  const [respondTicket, setRespondTicket] = useState<Ticket | null>(null)
  const [response, setResponse] = useState('')
  const [responseStatus, setResponseStatus] = useState('in_progress')
  const [respondLoading, setRespondLoading] = useState(false)
  const [closeLoading, setCloseLoading] = useState<number | null>(null)

  const fetchTickets = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await adminApi.getSupportTickets({
        status: status || undefined,
        issue_type: issueType || undefined,
        priority: priority || undefined,
        page,
        limit,
      })
      setTickets(data.tickets || [])
      setTotal(data.total || 0)
    } catch {
      setTickets([])
    } finally {
      setLoading(false)
    }
  }, [status, issueType, priority, page])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  useEffect(() => {
    setPage(1)
  }, [status, issueType, priority])

  const handleRespond = async () => {
    if (!respondTicket || !response.trim()) return
    setRespondLoading(true)
    try {
      await adminApi.respondToTicket(respondTicket.id, response, responseStatus)
      setRespondTicket(null)
      setResponse('')
      setResponseStatus('in_progress')
      await fetchTickets()
    } catch {
      /* silent */
    } finally {
      setRespondLoading(false)
    }
  }

  const handleClose = async (ticketId: number) => {
    if (!confirm('Close this ticket?')) return
    setCloseLoading(ticketId)
    try {
      await adminApi.closeTicket(ticketId)
      await fetchTickets()
    } catch {
      /* silent */
    } finally {
      setCloseLoading(null)
    }
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Support Tickets" description={`${total} total tickets`} />

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <HeadphonesIcon className="h-4 w-4 text-text-muted" />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-xl border border-border bg-card px-4 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <select
            value={issueType}
            onChange={(e) => setIssueType(e.target.value)}
            className="rounded-xl border border-border bg-card px-4 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            {ISSUE_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="rounded-xl border border-border bg-card px-4 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            {PRIORITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Respond Modal */}
      {respondTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="card w-full max-w-lg p-6">
            <h3 className="mb-4 text-base font-semibold text-text-primary">
              Respond to Ticket #{respondTicket.id}
            </h3>
            <div className="space-y-4">
              <div className="rounded-xl bg-bg-secondary/60 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-text-primary">{respondTicket.subject}</p>
                  <span className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-medium', PRIORITY_COLORS[respondTicket.priority] || PRIORITY_COLORS.low)}>
                    {respondTicket.priority}
                  </span>
                </div>
                <p className="text-xs text-text-secondary">{respondTicket.description}</p>
                <p className="text-xs text-text-muted">From: {respondTicket.user_name} ({respondTicket.user_email})</p>
              </div>
              {respondTicket.admin_response && (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-text-muted">Previous Response</label>
                  <div className="rounded-xl border border-border bg-bg-secondary/30 px-4 py-3 text-sm text-text-secondary">
                    {respondTicket.admin_response}
                  </div>
                </div>
              )}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-muted">Your Response</label>
                <textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  placeholder="Type your response..."
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-muted">Set Status</label>
                <select
                  value={responseStatus}
                  onChange={(e) => setResponseStatus(e.target.value)}
                  className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => {
                  setRespondTicket(null)
                  setResponse('')
                  setResponseStatus('in_progress')
                }}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRespond}
                disabled={!response.trim() || respondLoading}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {respondLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Send Response
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="card p-12 text-center">
          <AlertCircle className="mx-auto mb-3 h-12 w-12 text-text-muted" />
          <h3 className="text-lg font-semibold text-text-primary">No tickets found</h3>
          <p className="mt-1 text-sm text-text-secondary">Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-bg-secondary/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">Subject</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">Issue Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">Admin</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">Updated</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-text-muted">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-bg-secondary/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-text-primary">#{t.id}</td>
                    <td className="px-4 py-3 text-text-secondary max-w-[140px] truncate">{t.user_name}</td>
                    <td className="px-4 py-3 text-text-secondary max-w-[200px] truncate">{t.subject.length > 40 ? t.subject.slice(0, 40) + '…' : t.subject}</td>
                    <td className="px-4 py-3 text-text-secondary capitalize">{t.issue_type}</td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium', PRIORITY_COLORS[t.priority] || PRIORITY_COLORS.low)}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={t.status} size="sm" /></td>
                    <td className="px-4 py-3 text-text-secondary text-xs">{t.admin_email || '—'}</td>
                    <td className="px-4 py-3 text-text-secondary whitespace-nowrap">{formatDate(t.updated_at)}</td>
                    <td className="px-4 py-3 text-right">
                      {t.status !== 'closed' && (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setRespondTicket(t)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary/90 transition-colors"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            Respond
                          </button>
                          <button
                            onClick={() => handleClose(t.id)}
                            disabled={closeLoading === t.id}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-bg-secondary transition-colors disabled:opacity-50"
                          >
                            {closeLoading === t.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                            Close
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-5 py-3">
              <p className="text-xs text-text-muted">
                Page {page} of {totalPages} ({total} tickets)
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className={cn(
                    'rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors',
                    page <= 1
                      ? 'cursor-not-allowed text-text-muted'
                      : 'text-text-secondary hover:bg-bg-secondary',
                  )}
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className={cn(
                    'rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors',
                    page >= totalPages
                      ? 'cursor-not-allowed text-text-muted'
                      : 'text-text-secondary hover:bg-bg-secondary',
                  )}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
