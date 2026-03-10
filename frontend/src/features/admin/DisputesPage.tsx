import { useState, useEffect, useCallback } from 'react'
import { AlertTriangle, Loader2, ExternalLink, CheckCircle2, Download } from 'lucide-react'
import { adminApi } from '@/api/admin'
import { cn, formatCurrency } from '@/lib/utils'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { StatusBadge } from '@/components/admin/StatusBadge'

interface Dispute {
  id: number
  booking_id: number
  raised_by_email: string
  reason: string
  description: string
  evidence_url: string | null
  status: string
  resolution_type: string | null
  resolution_notes: string | null
  artist_name: string
  total_amount: number
  created_at: string
}

interface DisputeDetail extends Dispute {
  [key: string]: unknown
}

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
]

const RESOLVE_ACTIONS = [
  { value: 'refund', label: 'Full Refund' },
  { value: 'partial', label: '50% Refund' },
  { value: 'release', label: 'Release Payment to Artist' },
  { value: 'close', label: 'Close Dispute' },
]

export function DisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const limit = 20

  const [resolveId, setResolveId] = useState<number | null>(null)
  const [resolveAction, setResolveAction] = useState('')
  const [resolveNotes, setResolveNotes] = useState('')
  const [resolveLoading, setResolveLoading] = useState(false)

  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [detail, setDetail] = useState<DisputeDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const fetchDisputes = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await adminApi.getDisputes({
        status: status || undefined,
        page,
        limit,
      })
      setDisputes(data.disputes || [])
      setTotal(data.total || 0)
    } catch {
      setDisputes([])
    } finally {
      setLoading(false)
    }
  }, [status, page])

  useEffect(() => {
    fetchDisputes()
  }, [fetchDisputes])

  useEffect(() => {
    setPage(1)
  }, [status])

  const handleExport = async () => {
    try {
      const res = await adminApi.exportDisputesCsv()
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = 'disputes_export.csv'
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      /* silent */
    }
  }

  const handleResolve = async () => {
    if (!resolveId || !resolveAction) return
    setResolveLoading(true)
    try {
      await adminApi.resolveDispute(resolveId, resolveAction, resolveNotes)
      setResolveId(null)
      setResolveAction('')
      setResolveNotes('')
      await fetchDisputes()
    } catch {
      /* silent */
    } finally {
      setResolveLoading(false)
    }
  }

  const handleRowClick = async (disputeId: number) => {
    if (expandedId === disputeId) {
      setExpandedId(null)
      setDetail(null)
      return
    }
    setExpandedId(disputeId)
    setDetailLoading(true)
    try {
      const res = await adminApi.getDisputeDetail(disputeId)
      setDetail(res.data)
    } catch {
      setDetail(null)
    } finally {
      setDetailLoading(false)
    }
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Disputes" description={`${total} total disputes`}>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-text-secondary hover:bg-bg-secondary transition-colors"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </AdminPageHeader>

      {/* Status Tabs */}
      <div className="card p-1.5">
        <div className="flex gap-1 overflow-x-auto">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatus(tab.value)}
              className={cn(
                'flex-shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-all whitespace-nowrap',
                status === tab.value
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-secondary hover:bg-bg-secondary',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Resolve Modal */}
      {resolveId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="card w-full max-w-md p-6">
            <h3 className="mb-4 text-base font-semibold text-text-primary">
              Resolve Dispute #{resolveId}
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
                    <option key={a.value} value={a.value}>
                      {a.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-muted">
                  Resolution Notes
                </label>
                <textarea
                  value={resolveNotes}
                  onChange={(e) => setResolveNotes(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  placeholder="Add notes about this resolution..."
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
      ) : disputes.length === 0 ? (
        <div className="card p-12 text-center">
          <AlertTriangle className="mx-auto mb-3 h-12 w-12 text-text-muted" />
          <h3 className="text-lg font-semibold text-text-primary">No disputes found</h3>
          <p className="mt-1 text-sm text-text-secondary">Try adjusting your status filter.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-bg-secondary/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">Booking #</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">Raised By</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">Artist</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">Reason</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-text-muted">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">Resolution</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">Created</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-text-muted">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {disputes.map((d) => (
                  <>
                    <tr
                      key={d.id}
                      onClick={() => handleRowClick(d.id)}
                      className="hover:bg-bg-secondary/30 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3 font-medium text-text-primary">#{d.id}</td>
                      <td className="px-4 py-3 text-text-secondary">#{d.booking_id}</td>
                      <td className="px-4 py-3 text-text-secondary max-w-[160px] truncate">
                        {d.raised_by_email}
                      </td>
                      <td className="px-4 py-3 text-text-secondary whitespace-nowrap">{d.artist_name}</td>
                      <td className="px-4 py-3 text-text-secondary max-w-[140px] truncate capitalize">
                        {d.reason}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-text-primary whitespace-nowrap">
                        {formatCurrency(d.total_amount)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={d.status} size="sm" />
                      </td>
                      <td className="px-4 py-3 text-text-secondary text-xs capitalize">
                        {d.resolution_type?.replace(/_/g, ' ') || '—'}
                      </td>
                      <td className="px-4 py-3 text-text-secondary whitespace-nowrap">
                        {formatDate(d.created_at)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {(d.status === 'open' || d.status === 'under_review') && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setResolveId(d.id)
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary/90 transition-colors"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Resolve
                          </button>
                        )}
                      </td>
                    </tr>

                    {/* Expanded Detail Row */}
                    {expandedId === d.id && (
                      <tr key={`detail-${d.id}`}>
                        <td colSpan={10} className="bg-bg-secondary/30 px-6 py-4">
                          {detailLoading ? (
                            <div className="flex justify-center py-4">
                              <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                  <p className="text-xs font-medium text-text-muted">Description</p>
                                  <p className="mt-1 text-sm text-text-primary">
                                    {detail?.description || d.description || '—'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-text-muted">Resolution Notes</p>
                                  <p className="mt-1 text-sm text-text-primary">
                                    {detail?.resolution_notes || d.resolution_notes || '—'}
                                  </p>
                                </div>
                              </div>
                              {(detail?.evidence_url || d.evidence_url) && (
                                <div>
                                  <p className="text-xs font-medium text-text-muted">Evidence</p>
                                  <a
                                    href={detail?.evidence_url || d.evidence_url || '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-1 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                                  >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    View Evidence
                                  </a>
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-5 py-3">
              <p className="text-xs text-text-muted">
                Page {page} of {totalPages} ({total} disputes)
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
