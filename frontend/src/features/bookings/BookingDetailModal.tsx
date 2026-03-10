import { useState, useEffect } from 'react'
import {
  X,
  CalendarDays,
  MapPin,
  Clock,
  Users,
  IndianRupee,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  CreditCard,
  FileText,
  Hotel,
  Car,
  Shield,
  QrCode,
} from 'lucide-react'
import { bookingsApi } from '@/api/bookings'
import { useAuthStore } from '@/stores/authStore'
import { UpiPaymentModal } from './UpiPaymentModal'
import { cn } from '@/lib/utils'
import type { BookingData, BookingPaymentData } from '@/api/bookings'

interface BookingDetailModalProps {
  booking: BookingData
  onClose: () => void
  onUpdate: () => void
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  pending: { label: 'Pending', color: 'text-amber-600 bg-amber-50', icon: Clock },
  awaiting_payment: { label: 'Awaiting Payment', color: 'text-blue-600 bg-blue-50', icon: CreditCard },
  payment_verification: { label: 'Payment Verification Pending', color: 'text-violet-600 bg-violet-50', icon: QrCode },
  confirmed: { label: 'Confirmed', color: 'text-emerald-600 bg-emerald-50', icon: CheckCircle2 },
  completed: { label: 'Completed', color: 'text-green-600 bg-green-50', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'text-red-600 bg-red-50', icon: XCircle },
  disputed: { label: 'Disputed', color: 'text-orange-600 bg-orange-50', icon: AlertCircle },
}

function formatCurrency(n: number) {
  return `₹${n.toLocaleString('en-IN')}`
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function BookingDetailModal({ booking, onClose, onUpdate }: BookingDetailModalProps) {
  const user = useAuthStore((s) => s.user)
  const [payments, setPayments] = useState<BookingPaymentData[]>([])
  const [paymentsLoading, setPaymentsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState('')
  const [upiPaymentType, setUpiPaymentType] = useState<'advance' | 'remaining' | null>(null)

  const isOrganizer = user?.id === booking.organizer_id
  const isArtist = user?.id === booking.artist_id
  const isAdmin = user?.role === 'admin'
  const statusKey = booking.payment_status === 'payment_pending' ? 'payment_verification' : booking.status
  const status = STATUS_CONFIG[statusKey] || STATUS_CONFIG.pending
  const StatusIcon = status.icon

  useEffect(() => {
    bookingsApi
      .getPayments(booking.id)
      .then(({ data }) => setPayments(data))
      .catch(() => {})
      .finally(() => setPaymentsLoading(false))
  }, [booking.id])

  const handleAction = async (action: string) => {
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
        case 'pay-remaining':
          await bookingsApi.payRemaining(booking.id)
          break
        case 'complete':
          await bookingsApi.markComplete(booking.id)
          break
      }
      onUpdate()
      onClose()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setActionLoading('')
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card z-10 flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-text-primary">Booking #{booking.id}</h2>
            <span className={cn('inline-flex items-center gap-1 text-xs font-medium rounded-full px-2.5 py-1', status.color)}>
              <StatusIcon className="h-3 w-3" />
              {status.label}
            </span>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-bg-secondary transition-colors">
            <X className="h-5 w-5 text-text-muted" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Event Info */}
          <div>
            <p className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-3">Event Details</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-text-muted mt-0.5" />
                <div>
                  <p className="text-xs text-text-muted">Event Type</p>
                  <p className="text-sm font-medium text-text-primary">{booking.event_type}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CalendarDays className="h-4 w-4 text-text-muted mt-0.5" />
                <div>
                  <p className="text-xs text-text-muted">Date</p>
                  <p className="text-sm font-medium text-text-primary">{formatDate(booking.event_date)}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-text-muted mt-0.5" />
                <div>
                  <p className="text-xs text-text-muted">Location</p>
                  <p className="text-sm font-medium text-text-primary">{booking.location}</p>
                </div>
              </div>
              {booking.duration && (
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-text-muted mt-0.5" />
                  <div>
                    <p className="text-xs text-text-muted">Duration</p>
                    <p className="text-sm font-medium text-text-primary">{booking.duration}</p>
                  </div>
                </div>
              )}
              {booking.audience_size && (
                <div className="flex items-start gap-2">
                  <Users className="h-4 w-4 text-text-muted mt-0.5" />
                  <div>
                    <p className="text-xs text-text-muted">Audience Size</p>
                    <p className="text-sm font-medium text-text-primary">{booking.audience_size}</p>
                  </div>
                </div>
              )}
            </div>
            {booking.event_details && (
              <div className="mt-3 p-3 rounded-lg bg-bg-secondary">
                <p className="text-xs text-text-muted mb-1">Additional Details</p>
                <p className="text-sm text-text-primary whitespace-pre-wrap">{booking.event_details}</p>
              </div>
            )}
          </div>

          {/* People */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-text-muted mb-1">Organizer</p>
              <p className="text-sm font-semibold text-text-primary">{booking.organizer_name || 'N/A'}</p>
              {booking.organizer_email && (
                <p className="text-xs text-text-secondary">{booking.organizer_email}</p>
              )}
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-text-muted mb-1">Artist</p>
              <p className="text-sm font-semibold text-text-primary">{booking.artist_name || 'N/A'}</p>
              {booking.artist_category && (
                <p className="text-xs text-text-secondary">{booking.artist_category}</p>
              )}
            </div>
          </div>

          {/* Pricing Breakdown */}
          <div className="rounded-xl border border-border p-4">
            <p className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <IndianRupee className="h-3.5 w-3.5" /> Pricing
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Artist Fee</span>
                <span className="text-text-primary font-medium">{formatCurrency(booking.artist_fee)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Platform Fee</span>
                <span className="text-text-primary font-medium">{formatCurrency(booking.platform_fee)}</span>
              </div>
              {booking.accommodation_selected && (
                <div className="flex justify-between">
                  <span className="text-text-secondary flex items-center gap-1"><Hotel className="h-3 w-3" /> Accommodation</span>
                  <span className="text-text-primary font-medium">{formatCurrency(booking.accommodation_price)}</span>
                </div>
              )}
              {booking.transport_selected && (
                <div className="flex justify-between">
                  <span className="text-text-secondary flex items-center gap-1"><Car className="h-3 w-3" /> Transport</span>
                  <span className="text-text-primary font-medium">{formatCurrency(booking.transport_price)}</span>
                </div>
              )}
              {booking.security_selected && (
                <div className="flex justify-between">
                  <span className="text-text-secondary flex items-center gap-1"><Shield className="h-3 w-3" /> Security</span>
                  <span className="text-text-primary font-medium">{formatCurrency(booking.security_price)}</span>
                </div>
              )}
              <div className="border-t border-border pt-2 mt-2 space-y-1">
                <div className="flex justify-between font-semibold">
                  <span className="text-text-primary">Total</span>
                  <span className="text-primary">{formatCurrency(booking.total_amount)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-text-secondary">Advance Paid</span>
                  <span className={cn('font-medium', booking.advance_paid > 0 ? 'text-emerald-600' : 'text-text-muted')}>
                    {formatCurrency(booking.advance_paid)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-text-secondary">Remaining</span>
                  <span className="font-medium text-text-primary">{formatCurrency(booking.remaining_amount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment History */}
          <div>
            <p className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-3">Payment History</p>
            {paymentsLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : payments.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-4">No payments yet</p>
            ) : (
              <div className="space-y-2">
                {payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-text-primary capitalize">{p.payment_type} Payment</p>
                      <p className="text-xs text-text-muted">
                        {p.transaction_id} {p.paid_at ? `· ${formatDate(p.paid_at)}` : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-text-primary">{formatCurrency(p.amount)}</p>
                      <p className={cn(
                        'text-[10px] font-medium uppercase',
                        p.status === 'paid' ? 'text-emerald-600' : 'text-amber-600',
                      )}>
                        {p.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
            {/* Artist actions */}
            {isArtist && booking.status === 'pending' && (
              <>
                <button
                  onClick={() => handleAction('accept')}
                  disabled={!!actionLoading}
                  className="btn-primary flex-1"
                >
                  {actionLoading === 'accept' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Accept
                </button>
                <button
                  onClick={() => handleAction('reject')}
                  disabled={!!actionLoading}
                  className="flex-1 rounded-lg px-4 py-2.5 text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                >
                  {actionLoading === 'reject' ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                  Reject
                </button>
              </>
            )}

            {/* Organizer payment actions - UPI QR flow */}
            {isOrganizer && (booking.status === 'awaiting_payment' || booking.status === 'pending') && booking.payment_status !== 'payment_pending' && (
              <button
                onClick={() => setUpiPaymentType('advance')}
                className="btn-primary flex-1"
              >
                <QrCode className="h-4 w-4" />
                Pay Advance via UPI ({formatCurrency(booking.advance_amount)})
              </button>
            )}

            {isOrganizer && booking.payment_status === 'payment_pending' && booking.status !== 'confirmed' && (
              <div className="flex-1 rounded-lg px-4 py-2.5 text-sm font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-600 flex items-center justify-center gap-2">
                <Clock className="h-4 w-4" />
                Payment Verification Pending
              </div>
            )}

            {isOrganizer && booking.status === 'confirmed' && booking.remaining_amount > 0 && booking.payment_status !== 'fully_paid' && (
              <button
                onClick={() => setUpiPaymentType('remaining')}
                className="btn-primary flex-1"
              >
                <QrCode className="h-4 w-4" />
                Pay Remaining via UPI ({formatCurrency(booking.remaining_amount)})
              </button>
            )}

            {/* Mark complete */}
            {(isOrganizer || isArtist) && booking.status === 'confirmed' && (
              <button
                onClick={() => handleAction('complete')}
                disabled={!!actionLoading || (isOrganizer && booking.organizer_completed) || (isArtist && booking.artist_completed)}
                className="btn-secondary flex-1"
              >
                {actionLoading === 'complete' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {(isOrganizer && booking.organizer_completed) || (isArtist && booking.artist_completed)
                  ? 'Marked Complete'
                  : 'Mark Complete'}
              </button>
            )}

            {/* Cancel */}
            {isOrganizer && !['completed', 'cancelled'].includes(booking.status) && (
              <button
                onClick={() => handleAction('cancel')}
                disabled={!!actionLoading}
                className="rounded-lg px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
              >
                {actionLoading === 'cancel' ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                Cancel Booking
              </button>
            )}

            {/* Admin confirm payment */}
            {isAdmin && booking.payment_status === 'payment_pending' && (
              <button
                onClick={async () => {
                  setActionLoading('confirm-payment')
                  try {
                    await bookingsApi.confirmPayment(booking.id)
                    onUpdate()
                    onClose()
                  } catch (err: unknown) {
                    alert(err instanceof Error ? err.message : 'Failed')
                  } finally {
                    setActionLoading('')
                  }
                }}
                disabled={!!actionLoading}
                className="btn-primary flex-1"
              >
                {actionLoading === 'confirm-payment' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Confirm Payment (Admin)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* UPI Payment Modal */}
      {upiPaymentType && (
        <UpiPaymentModal
          booking={booking}
          paymentType={upiPaymentType}
          onClose={() => setUpiPaymentType(null)}
          onSuccess={() => {
            setUpiPaymentType(null)
            onUpdate()
            onClose()
          }}
        />
      )}
    </div>
  )
}
