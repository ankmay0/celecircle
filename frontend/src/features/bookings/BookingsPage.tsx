import { useState, useEffect, useCallback } from 'react'
import {
  CalendarCheck,
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
  CreditCard,
  AlertCircle,
  MapPin,
  CalendarDays,
  IndianRupee,
  Search,
  QrCode,
} from 'lucide-react'
import { bookingsApi } from '@/api/bookings'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import { BookingDetailModal } from './BookingDetailModal'
import { UpiPaymentModal } from './UpiPaymentModal'
import type { BookingData } from '@/api/bookings'

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'awaiting_payment', label: 'Awaiting Payment' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

const STATUS_BADGE: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: 'Pending', color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20', icon: Clock },
  awaiting_payment: { label: 'Awaiting Payment', color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20', icon: CreditCard },
  payment_verification: { label: 'Verification Pending', color: 'text-violet-600 bg-violet-50 dark:bg-violet-900/20', icon: QrCode },
  confirmed: { label: 'Confirmed', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20', icon: CheckCircle2 },
  completed: { label: 'Completed', color: 'text-green-600 bg-green-50 dark:bg-green-900/20', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'text-red-600 bg-red-50 dark:bg-red-900/20', icon: XCircle },
  disputed: { label: 'Disputed', color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20', icon: AlertCircle },
}

function formatCurrency(n: number) {
  return `₹${n.toLocaleString('en-IN')}`
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function BookingCard({
  booking,
  userRole,
  userId,
  onClick,
  onAction,
  onPayUpi,
}: {
  booking: BookingData
  userRole: string
  userId: number
  onClick: () => void
  onAction: () => void
  onPayUpi: (type: 'advance' | 'remaining') => void
}) {
  const [actionLoading, setActionLoading] = useState('')
  const isOrganizer = userId === booking.organizer_id
  const badgeKey = booking.payment_status === 'payment_pending' ? 'payment_verification' : booking.status
  const badge = STATUS_BADGE[badgeKey] || STATUS_BADGE.pending
  const BadgeIcon = badge.icon

  const handleQuickAction = async (e: React.MouseEvent, action: string) => {
    e.stopPropagation()
    setActionLoading(action)
    try {
      switch (action) {
        case 'accept':
          await bookingsApi.acceptBooking(booking.id)
          break
        case 'reject':
          await bookingsApi.rejectBooking(booking.id)
          break
        case 'cancel':
          await bookingsApi.cancelBooking(booking.id)
          break
        case 'pay-advance':
          await bookingsApi.payAdvance(booking.id)
          break
        case 'complete':
          await bookingsApi.markComplete(booking.id)
          break
      }
      onAction()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setActionLoading('')
    }
  }

  return (
    <div
      onClick={onClick}
      className="card p-4 hover:shadow-md hover:border-primary/20 transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-text-primary">{booking.event_type}</h3>
            <span className={cn('inline-flex items-center gap-1 text-[10px] font-medium rounded-full px-2 py-0.5', badge.color)}>
              <BadgeIcon className="h-3 w-3" />
              {badge.label}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-text-secondary flex-wrap">
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              {formatDate(booking.event_date)}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {booking.location}
            </span>
          </div>
          <p className="text-xs text-text-muted mt-1">
            {isOrganizer
              ? `Artist: ${booking.artist_name || 'N/A'} ${booking.artist_category ? `· ${booking.artist_category}` : ''}`
              : `Organizer: ${booking.organizer_name || 'N/A'}`}
          </p>
        </div>

        <div className="text-right flex-shrink-0">
          <p className="text-sm font-bold text-primary flex items-center gap-0.5 justify-end">
            <IndianRupee className="h-3 w-3" />
            {booking.total_amount.toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] text-text-muted mt-0.5">
            {booking.payment_status === 'fully_paid'
              ? 'Fully Paid'
              : booking.advance_paid > 0
                ? `Advance: ${formatCurrency(booking.advance_paid)}`
                : 'Unpaid'}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 mt-3 pt-3 border-t border-border flex-wrap" onClick={(e) => e.stopPropagation()}>
        {/* Artist quick actions */}
        {!isOrganizer && booking.status === 'pending' && userRole !== 'admin' && (
          <>
            <button
              onClick={(e) => handleQuickAction(e, 'accept')}
              disabled={!!actionLoading}
              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/30 transition-colors flex items-center gap-1"
            >
              {actionLoading === 'accept' ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
              Accept
            </button>
            <button
              onClick={(e) => handleQuickAction(e, 'reject')}
              disabled={!!actionLoading}
              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 transition-colors flex items-center gap-1"
            >
              {actionLoading === 'reject' ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
              Reject
            </button>
          </>
        )}

        {/* Organizer quick actions - UPI QR */}
        {isOrganizer && (booking.status === 'awaiting_payment' || booking.status === 'pending') && booking.payment_status !== 'payment_pending' && (
          <button
            onClick={(e) => { e.stopPropagation(); onPayUpi('advance') }}
            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 transition-colors flex items-center gap-1"
          >
            <QrCode className="h-3 w-3" />
            Pay via UPI
          </button>
        )}

        {isOrganizer && booking.payment_status === 'payment_pending' && booking.status !== 'confirmed' && (
          <span className="text-xs font-medium px-3 py-1.5 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-900/20 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Verification Pending
          </span>
        )}

        {(isOrganizer || (!isOrganizer && userRole !== 'admin')) && booking.status === 'confirmed' && (
          <button
            onClick={(e) => handleQuickAction(e, 'complete')}
            disabled={!!actionLoading || (isOrganizer && booking.organizer_completed) || (!isOrganizer && booking.artist_completed)}
            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 transition-colors flex items-center gap-1 disabled:opacity-50"
          >
            {actionLoading === 'complete' ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
            {(isOrganizer && booking.organizer_completed) || (!isOrganizer && booking.artist_completed) ? 'Marked' : 'Mark Complete'}
          </button>
        )}

        {isOrganizer && !['completed', 'cancelled'].includes(booking.status) && (
          <button
            onClick={(e) => handleQuickAction(e, 'cancel')}
            disabled={!!actionLoading}
            className="text-xs font-medium px-3 py-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-1 ml-auto"
          >
            {actionLoading === 'cancel' ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
            Cancel
          </button>
        )}

        <button
          className="text-xs font-medium px-3 py-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors ml-auto"
          onClick={onClick}
        >
          View Details
        </button>
      </div>
    </div>
  )
}

export function BookingsPage() {
  const user = useAuthStore((s) => s.user)
  const [bookings, setBookings] = useState<BookingData[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBooking, setSelectedBooking] = useState<BookingData | null>(null)
  const [upiBooking, setUpiBooking] = useState<{ booking: BookingData; type: 'advance' | 'remaining' } | null>(null)

  const loadBookings = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await bookingsApi.listBookings(statusFilter || undefined)
      setBookings(data)
    } catch {
      /* silent */
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    loadBookings()
  }, [loadBookings])

  const filtered = bookings.filter((b) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      b.event_type.toLowerCase().includes(q) ||
      b.location.toLowerCase().includes(q) ||
      (b.artist_name || '').toLowerCase().includes(q) ||
      (b.organizer_name || '').toLowerCase().includes(q)
    )
  })

  const sentCount = bookings.filter((b) => b.organizer_id === user?.id).length
  const receivedCount = bookings.filter((b) => b.artist_id === user?.id).length

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
              <CalendarCheck className="h-6 w-6 text-primary" />
              My Bookings
            </h1>
            <p className="text-sm text-text-secondary mt-0.5">
              {user?.role === 'artist'
                ? `${receivedCount} booking request${receivedCount !== 1 ? 's' : ''} received`
                : user?.role === 'organizer'
                  ? `${sentCount} booking${sentCount !== 1 ? 's' : ''} sent`
                  : `${bookings.length} total booking${bookings.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search bookings..."
              className="input-field !pl-9 !rounded-full !py-2 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="card px-2 py-1 flex gap-1 overflow-x-auto scrollbar-thin">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={cn(
              'px-4 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-colors',
              statusFilter === tab.value
                ? 'bg-primary text-white'
                : 'text-text-secondary hover:bg-bg-secondary hover:text-text-primary',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <CalendarCheck className="h-12 w-12 text-text-muted mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-text-primary">No bookings found</h3>
          <p className="text-sm text-text-secondary mt-1">
            {statusFilter
              ? 'No bookings match this filter. Try a different status.'
              : user?.role === 'organizer'
                ? 'Book an artist from their profile to get started.'
                : 'Booking requests will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => (
            <BookingCard
              key={b.id}
              booking={b}
              userRole={user?.role || ''}
              userId={user?.id || 0}
              onClick={() => setSelectedBooking(b)}
              onAction={loadBookings}
              onPayUpi={(type) => setUpiBooking({ booking: b, type })}
            />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onUpdate={loadBookings}
        />
      )}

      {/* UPI Payment Modal */}
      {upiBooking && (
        <UpiPaymentModal
          booking={upiBooking.booking}
          paymentType={upiBooking.type}
          onClose={() => setUpiBooking(null)}
          onSuccess={() => {
            setUpiBooking(null)
            loadBookings()
          }}
        />
      )}
    </div>
  )
}
