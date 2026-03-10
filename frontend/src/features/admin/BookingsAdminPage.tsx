import { useState, useEffect, useCallback } from 'react'
import {
  Loader2,
  MoreHorizontal,
  Download,
  XCircle,
  CheckCircle2,
  RefreshCw,
  ArrowRightLeft,
  CalendarX,
} from 'lucide-react'
import { adminApi } from '@/api/admin'
import { cn, formatCurrency } from '@/lib/utils'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { StatusBadge } from '@/components/admin/StatusBadge'

interface Booking {
  id: number
  organizer_id: number
  organizer_email: string
  organizer_name: string
  artist_id: number
  artist_name: string
  event_date: string
  event_type: string
  location: string
  artist_fee: number
  platform_fee: number
  total_amount: number
  advance_paid: number
  remaining_amount: number
  status: string
  payment_status: string
  created_at: string
}

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'awaiting_payment', label: 'Awaiting Payment' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

export function BookingsAdminPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [openMenu, setOpenMenu] = useState<number | null>(null)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [overrideId, setOverrideId] = useState<number | null>(null)
  const [overrideStatus, setOverrideStatus] = useState('')
  const limit = 20

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await adminApi.getBookings({
        status: status || undefined,
        page,
        limit,
      })
      setBookings(data.bookings || [])
      setTotal(data.total || 0)
    } catch {
      setBookings([])
    } finally {
      setLoading(false)
    }
  }, [status, page])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  useEffect(() => {
    setPage(1)
  }, [status])

  const handleExport = async () => {
    try {
      const res = await adminApi.exportBookingsCsv()
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = 'bookings_export.csv'
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      /* silent */
    }
  }

  const runAction = async (action: () => Promise<unknown>, bookingId: number) => {
    setActionLoading(bookingId)
    try {
      await action()
      await fetchBookings()
    } catch {
      /* silent */
    } finally {
      setActionLoading(null)
      setOpenMenu(null)
    }
  }

  const handleOverrideSubmit = async () => {
    if (!overrideId || !overrideStatus) return
    await runAction(() => adminApi.overrideBookingStatus(overrideId, overrideStatus), overrideId)
    setOverrideId(null)
    setOverrideStatus('')
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Booking Management" description={`${total} total bookings`}>
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

      {/* Override Status Modal */}
      {overrideId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="card w-full max-w-sm p-6">
            <h3 className="mb-4 text-base font-semibold text-text-primary">
              Override Status — Booking #{overrideId}
            </h3>
            <select
              value={overrideStatus}
              onChange={(e) => setOverrideStatus(e.target.value)}
              className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary mb-4"
            >
              <option value="">Select status</option>
              {['pending', 'awaiting_payment', 'confirmed', 'completed', 'cancelled'].map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setOverrideId(null)
                  setOverrideStatus('')
                }}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleOverrideSubmit}
                disabled={!overrideStatus}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                Confirm
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
      ) : bookings.length === 0 ? (
        <div className="card p-12 text-center">
          <CalendarX className="mx-auto mb-3 h-12 w-12 text-text-muted" />
          <h3 className="text-lg font-semibold text-text-primary">No bookings found</h3>
          <p className="mt-1 text-sm text-text-secondary">
            Try adjusting your status filter.
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-bg-secondary/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">
                    Artist
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">
                    Organizer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">
                    Event Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">
                    Location
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-text-muted">
                    Total
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-text-muted">
                    Platform Fee
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">
                    Payment
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-text-muted">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-bg-secondary/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-text-primary">#{b.id}</td>
                    <td className="px-4 py-3 text-text-secondary whitespace-nowrap">
                      {b.artist_name}
                    </td>
                    <td className="px-4 py-3 text-text-secondary whitespace-nowrap">
                      {b.organizer_name}
                    </td>
                    <td className="px-4 py-3 text-text-secondary whitespace-nowrap">
                      {new Date(b.event_date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3 text-text-secondary max-w-[140px] truncate">
                      {b.location}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-text-primary whitespace-nowrap">
                      {formatCurrency(b.total_amount)}
                    </td>
                    <td className="px-4 py-3 text-right text-text-secondary whitespace-nowrap">
                      {formatCurrency(b.platform_fee)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={b.status} size="sm" />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={b.payment_status} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="relative inline-block">
                        <button
                          onClick={() => setOpenMenu(openMenu === b.id ? null : b.id)}
                          className="rounded-lg p-1.5 text-text-muted hover:bg-bg-secondary transition-colors"
                        >
                          {actionLoading === b.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MoreHorizontal className="h-4 w-4" />
                          )}
                        </button>
                        {openMenu === b.id && (
                          <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-xl border border-border bg-card py-1 shadow-lg">
                            {b.status !== 'cancelled' && (
                              <button
                                onClick={() =>
                                  runAction(() => adminApi.cancelBooking(b.id), b.id)
                                }
                                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-bg-secondary transition-colors"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                Cancel
                              </button>
                            )}
                            {b.status !== 'completed' && (
                              <button
                                onClick={() =>
                                  runAction(() => adminApi.completeBooking(b.id), b.id)
                                }
                                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-emerald-600 hover:bg-bg-secondary transition-colors"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Complete
                              </button>
                            )}
                            <button
                              onClick={() =>
                                runAction(() => adminApi.issueRefund(b.id), b.id)
                              }
                              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-violet-600 hover:bg-bg-secondary transition-colors"
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                              Refund
                            </button>
                            <button
                              onClick={() => {
                                setOverrideId(b.id)
                                setOpenMenu(null)
                              }}
                              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-text-secondary hover:bg-bg-secondary transition-colors"
                            >
                              <ArrowRightLeft className="h-3.5 w-3.5" />
                              Override Status
                            </button>
                          </div>
                        )}
                      </div>
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
                Page {page} of {totalPages} ({total} bookings)
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
