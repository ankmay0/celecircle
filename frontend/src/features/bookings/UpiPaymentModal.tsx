import { useState } from 'react'
import {
  X,
  IndianRupee,
  CalendarDays,
  MapPin,
  CheckCircle2,
  Loader2,
  Upload,
  Smartphone,
  ShieldCheck,
  Clock,
} from 'lucide-react'
import { bookingsApi } from '@/api/bookings'
import type { BookingData } from '@/api/bookings'

interface UpiPaymentModalProps {
  booking: BookingData
  paymentType: 'advance' | 'remaining'
  onClose: () => void
  onSuccess: () => void
}

function formatCurrency(n: number) {
  return `₹${n.toLocaleString('en-IN')}`
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

type Step = 'qr' | 'confirm' | 'done'

export function UpiPaymentModal({ booking, paymentType, onClose, onSuccess }: UpiPaymentModalProps) {
  const [step, setStep] = useState<Step>('qr')
  const [transactionId, setTransactionId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const amount = paymentType === 'advance' ? booking.advance_amount : booking.remaining_amount

  const handleConfirmPayment = async () => {
    if (!transactionId.trim()) {
      setError('Please enter your UPI transaction ID.')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      if (paymentType === 'advance') {
        await bookingsApi.payAdvance(booking.id, 'upi')
      } else {
        await bookingsApi.payRemaining(booking.id)
      }
      setStep('done')
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 2000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit payment confirmation')
    } finally {
      setSubmitting(false)
    }
  }

  if (step === 'done') {
    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="card p-8 max-w-sm w-full text-center">
          <div className="h-16 w-16 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mx-auto mb-4">
            <Clock className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-text-primary mb-2">Payment Submitted!</h2>
          <p className="text-sm text-text-secondary">
            Your payment confirmation has been submitted. The admin will verify your payment and confirm your booking shortly.
          </p>
          <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 bg-amber-50 dark:bg-amber-900/20 rounded-full px-3 py-1.5">
            <Clock className="h-3 w-3" />
            Payment Verification Pending
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="card w-full max-w-lg max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card z-10 flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-bold text-text-primary">
            {step === 'qr' ? 'Pay via UPI' : 'Confirm Payment'}
          </h2>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-bg-secondary transition-colors">
            <X className="h-5 w-5 text-text-muted" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Booking Summary */}
          <div className="rounded-xl border border-border p-4 space-y-2">
            <p className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-2">Booking Summary</p>
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Artist</span>
              <span className="text-text-primary font-medium">{booking.artist_name || 'N/A'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary flex items-center gap-1"><CalendarDays className="h-3 w-3" /> Event Date</span>
              <span className="text-text-primary font-medium">{formatDate(booking.event_date)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary flex items-center gap-1"><MapPin className="h-3 w-3" /> Location</span>
              <span className="text-text-primary font-medium">{booking.location}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Event</span>
              <span className="text-text-primary font-medium">{booking.event_type}</span>
            </div>
            <div className="border-t border-border pt-2 mt-2 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Artist Fee</span>
                <span className="text-text-primary font-medium">{formatCurrency(booking.artist_fee)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Platform Fee</span>
                <span className="text-text-primary font-medium">{formatCurrency(booking.platform_fee)}</span>
              </div>
              {booking.accommodation_selected && (
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Accommodation</span>
                  <span className="text-text-primary font-medium">{formatCurrency(booking.accommodation_price)}</span>
                </div>
              )}
              {booking.transport_selected && (
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Transport</span>
                  <span className="text-text-primary font-medium">{formatCurrency(booking.transport_price)}</span>
                </div>
              )}
              {booking.security_selected && (
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Security</span>
                  <span className="text-text-primary font-medium">{formatCurrency(booking.security_price)}</span>
                </div>
              )}
              <div className="border-t border-border pt-2 mt-1">
                <div className="flex justify-between font-semibold text-base">
                  <span className="text-text-primary flex items-center gap-1">
                    <IndianRupee className="h-4 w-4" />
                    {paymentType === 'advance' ? 'Advance Amount' : 'Remaining Amount'}
                  </span>
                  <span className="text-primary">{formatCurrency(amount)}</span>
                </div>
              </div>
            </div>
          </div>

          {step === 'qr' && (
            <>
              {/* QR Code Section */}
              <div className="text-center space-y-4">
                <div className="rounded-xl border border-border bg-bg-secondary/30 p-5">
                  <p className="text-sm font-medium text-text-primary mb-3">
                    Scan the QR code to complete payment using any UPI app
                  </p>

                  <div className="inline-block rounded-2xl bg-white p-3 shadow-lg">
                    <img
                      src="/upi-qr.png"
                      alt="UPI QR Code"
                      className="w-56 h-56 object-contain"
                    />
                  </div>

                  <p className="text-lg font-bold text-primary mt-3">
                    Pay {formatCurrency(amount)}
                  </p>

                  {/* UPI App Icons */}
                  <div className="flex items-center justify-center gap-4 mt-4">
                    <div className="flex flex-col items-center gap-1">
                      <div className="h-10 w-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                        <Smartphone className="h-5 w-5 text-violet-600" />
                      </div>
                      <span className="text-[10px] text-text-muted">PhonePe</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <Smartphone className="h-5 w-5 text-blue-600" />
                      </div>
                      <span className="text-[10px] text-text-muted">Google Pay</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <div className="h-10 w-10 rounded-xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
                        <Smartphone className="h-5 w-5 text-sky-600" />
                      </div>
                      <span className="text-[10px] text-text-muted">Paytm</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <div className="h-10 w-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <Smartphone className="h-5 w-5 text-text-muted" />
                      </div>
                      <span className="text-[10px] text-text-muted">Any UPI</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-text-muted justify-center">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  Secure payment via UPI
                </div>
              </div>

              {/* Action */}
              <div className="flex gap-3">
                <button onClick={onClose} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button
                  onClick={() => setStep('confirm')}
                  className="btn-primary flex-1 !bg-emerald-600 hover:!bg-emerald-700"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  I Have Completed Payment
                </button>
              </div>
            </>
          )}

          {step === 'confirm' && (
            <>
              {/* Confirmation Form */}
              <div className="space-y-4">
                <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10 p-4">
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-1">
                    Confirm your payment details
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-500">
                    Please enter your UPI transaction ID to verify your payment. Your booking will be confirmed after admin verification.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1.5 block">
                    UPI Transaction ID *
                  </label>
                  <input
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="e.g. 423957829345"
                    className="input-field"
                    required
                  />
                  <p className="text-[10px] text-text-muted mt-1">
                    You can find this in your UPI app's transaction history
                  </p>
                </div>

                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1.5 block">
                    Payment Screenshot (Optional)
                  </label>
                  <label className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-4 cursor-pointer hover:border-primary/30 hover:bg-bg-secondary/50 transition-all">
                    <Upload className="h-5 w-5 text-text-muted" />
                    <span className="text-sm text-text-secondary">Click to upload screenshot</span>
                    <input type="file" accept="image/*" className="hidden" />
                  </label>
                </div>

                {error && (
                  <p className="text-sm text-danger bg-danger/10 rounded-lg px-4 py-2">{error}</p>
                )}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep('qr')} className="btn-secondary flex-1">
                  Back
                </button>
                <button
                  onClick={handleConfirmPayment}
                  disabled={submitting}
                  className="btn-primary flex-1"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Confirm Payment
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
