import { useState, useEffect, useCallback } from 'react'
import { Loader2, Download, CreditCard } from 'lucide-react'
import { adminApi } from '@/api/admin'
import { cn, formatCurrency } from '@/lib/utils'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { StatusBadge } from '@/components/admin/StatusBadge'

interface Payment {
  id: number
  booking_id: number
  payment_type: string
  amount: number
  status: string
  transaction_id: string | null
  paid_at: string | null
  created_at: string
  artist_name: string
  organizer_email: string
}

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'refunded', label: 'Refunded' },
]

const TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'advance', label: 'Advance' },
  { value: 'remaining', label: 'Remaining' },
]

export function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [paymentType, setPaymentType] = useState('')
  const limit = 25

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await adminApi.getPayments({
        status: status || undefined,
        payment_type: paymentType || undefined,
        page,
        limit,
      })
      setPayments(data.payments || [])
      setTotal(data.total || 0)
    } catch {
      setPayments([])
    } finally {
      setLoading(false)
    }
  }, [status, paymentType, page])

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  useEffect(() => {
    setPage(1)
  }, [status, paymentType])

  const handleExport = async () => {
    try {
      const res = await adminApi.exportPaymentsCsv()
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = 'payments_export.csv'
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      /* silent */
    }
  }

  const formatDate = (d: string | null) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Payment Management" description={`${total} total payments`}>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-text-secondary hover:bg-bg-secondary transition-colors"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </AdminPageHeader>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          value={paymentType}
          onChange={(e) => setPaymentType(e.target.value)}
          className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
        >
          {TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : payments.length === 0 ? (
        <div className="card p-12 text-center">
          <CreditCard className="mx-auto mb-3 h-12 w-12 text-text-muted" />
          <h3 className="text-lg font-semibold text-text-primary">No payments found</h3>
          <p className="mt-1 text-sm text-text-secondary">Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-bg-secondary/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">
                    Booking #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">
                    Artist
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">
                    Organizer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">Type</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-text-muted">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">
                    Transaction ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">
                    Paid At
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-bg-secondary/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-text-primary">#{p.id}</td>
                    <td className="px-4 py-3 text-text-secondary">#{p.booking_id}</td>
                    <td className="px-4 py-3 text-text-secondary whitespace-nowrap">
                      {p.artist_name}
                    </td>
                    <td className="px-4 py-3 text-text-secondary max-w-[160px] truncate">
                      {p.organizer_email}
                    </td>
                    <td className="px-4 py-3 text-text-secondary capitalize">{p.payment_type}</td>
                    <td className="px-4 py-3 text-right font-medium text-text-primary whitespace-nowrap">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={p.status} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-text-muted text-xs font-mono max-w-[140px] truncate">
                      {p.transaction_id || '—'}
                    </td>
                    <td className="px-4 py-3 text-text-secondary whitespace-nowrap">
                      {formatDate(p.paid_at)}
                    </td>
                    <td className="px-4 py-3 text-text-secondary whitespace-nowrap">
                      {formatDate(p.created_at)}
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
                Page {page} of {totalPages} ({total} payments)
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
