import { useState, useEffect, useCallback } from 'react'
import { Shield, Loader2, AlertTriangle, CheckCircle2, MessageSquare } from 'lucide-react'
import { adminApi } from '@/api/admin'
import { cn } from '@/lib/utils'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { StatusBadge } from '@/components/admin/StatusBadge'

interface Report {
  id: number
  reporter_email: string
  content_type: string
  content_id: number
  reason: string
  description: string
  status: string
  admin_notes: string | null
  resolved_by_email: string | null
  created_at: string
}

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'dismissed', label: 'Dismissed' },
]

const CONTENT_TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'post', label: 'Post' },
  { value: 'comment', label: 'Comment' },
  { value: 'user', label: 'User' },
  { value: 'message', label: 'Message' },
]

const RESOLVE_ACTIONS = [
  { value: 'remove', label: 'Remove Content' },
  { value: 'warn', label: 'Warn User' },
  { value: 'ban', label: 'Ban User' },
  { value: 'dismiss', label: 'Dismiss Report' },
]

export function ModerationPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [contentType, setContentType] = useState('')
  const limit = 25

  const [resolveId, setResolveId] = useState<number | null>(null)
  const [resolveAction, setResolveAction] = useState('')
  const [resolveNotes, setResolveNotes] = useState('')
  const [resolveLoading, setResolveLoading] = useState(false)

  const fetchReports = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await adminApi.getReportedContent({
        status: status || undefined,
        content_type: contentType || undefined,
        page,
        limit,
      })
      setReports(data.reports || [])
      setTotal(data.total || 0)
    } catch {
      setReports([])
    } finally {
      setLoading(false)
    }
  }, [status, contentType, page])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  useEffect(() => {
    setPage(1)
  }, [status, contentType])

  const handleResolve = async () => {
    if (!resolveId || !resolveAction) return
    setResolveLoading(true)
    try {
      await adminApi.resolveReport(resolveId, resolveAction, resolveNotes || undefined)
      setResolveId(null)
      setResolveAction('')
      setResolveNotes('')
      await fetchReports()
    } catch {
      /* silent */
    } finally {
      setResolveLoading(false)
    }
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Content Moderation" description={`${total} total reports`} />

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-text-muted" />
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
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-text-muted" />
            <select
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
              className="rounded-xl border border-border bg-card px-4 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              {CONTENT_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Resolve Modal */}
      {resolveId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="card w-full max-w-md p-6">
            <h3 className="mb-4 text-base font-semibold text-text-primary">
              Resolve Report #{resolveId}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-muted">Action</label>
                <select
                  value={resolveAction}
                  onChange={(e) => setResolveAction(e.target.value)}
                  className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="">Select action</option>
                  {RESOLVE_ACTIONS.map((a) => (
                    <option key={a.value} value={a.value}>{a.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-muted">Notes</label>
                <textarea
                  value={resolveNotes}
                  onChange={(e) => setResolveNotes(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  placeholder="Add notes about this action..."
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => {
                  setResolveId(null)
                  setResolveAction('')
                  setResolveNotes('')
                }}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleResolve}
                disabled={!resolveAction || resolveLoading}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {resolveLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Submit
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
      ) : reports.length === 0 ? (
        <div className="card p-12 text-center">
          <AlertTriangle className="mx-auto mb-3 h-12 w-12 text-text-muted" />
          <h3 className="text-lg font-semibold text-text-primary">No reports found</h3>
          <p className="mt-1 text-sm text-text-secondary">Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-bg-secondary/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">Reporter</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">Content Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">Content ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">Reason</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">Resolved By</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">Created</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-text-muted">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reports.map((r) => (
                  <tr key={r.id} className="hover:bg-bg-secondary/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-text-primary">#{r.id}</td>
                    <td className="px-4 py-3 text-text-secondary max-w-[160px] truncate">{r.reporter_email}</td>
                    <td className="px-4 py-3 text-text-secondary capitalize">{r.content_type}</td>
                    <td className="px-4 py-3 text-text-secondary">#{r.content_id}</td>
                    <td className="px-4 py-3 text-text-secondary max-w-[140px] truncate">{r.reason}</td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} size="sm" /></td>
                    <td className="px-4 py-3 text-text-secondary text-xs">{r.resolved_by_email || '—'}</td>
                    <td className="px-4 py-3 text-text-secondary whitespace-nowrap">{formatDate(r.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      {r.status === 'pending' && (
                        <button
                          onClick={() => setResolveId(r.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary/90 transition-colors"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Resolve
                        </button>
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
                Page {page} of {totalPages} ({total} reports)
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
