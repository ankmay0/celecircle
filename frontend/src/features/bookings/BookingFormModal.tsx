import { useState, useEffect, useCallback } from 'react'
import {
  X,
  CalendarDays,
  MapPin,
  Clock,
  Users,
  FileText,
  Loader2,
  IndianRupee,
  Hotel,
  Car,
  Shield,
  CheckCircle2,
} from 'lucide-react'
import { bookingsApi } from '@/api/bookings'
import type { PriceCalculation, AddonPrices } from '@/api/bookings'
import { cn } from '@/lib/utils'

interface BookingFormModalProps {
  artistId: number
  artistName: string
  artistCategory?: string | null
  onClose: () => void
  onSuccess: () => void
}

export function BookingFormModal({
  artistId,
  artistName,
  artistCategory,
  onClose,
  onSuccess,
}: BookingFormModalProps) {
  const [eventType, setEventType] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [location, setLocation] = useState('')
  const [duration, setDuration] = useState('')
  const [audienceSize, setAudienceSize] = useState('')
  const [eventDetails, setEventDetails] = useState('')

  const [accSelected, setAccSelected] = useState(false)
  const [transportSelected, setTransportSelected] = useState(false)
  const [securitySelected, setSecuritySelected] = useState(false)

  const [addonPrices, setAddonPrices] = useState<AddonPrices | null>(null)
  const [pricing, setPricing] = useState<PriceCalculation | null>(null)
  const [pricingLoading, setPricingLoading] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    bookingsApi.getAddonPrices().then(({ data }) => setAddonPrices(data)).catch(() => {})
  }, [])

  const fetchPricing = useCallback(async () => {
    setPricingLoading(true)
    try {
      const { data } = await bookingsApi.calculatePrice(artistId, {
        accommodation: accSelected,
        transport: transportSelected,
        security: securitySelected,
      })
      setPricing(data)
    } catch {
      /* silent */
    } finally {
      setPricingLoading(false)
    }
  }, [artistId, accSelected, transportSelected, securitySelected])

  useEffect(() => {
    fetchPricing()
  }, [fetchPricing])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!eventType.trim() || !eventDate || !location.trim()) {
      setError('Please fill in event type, date, and location.')
      return
    }

    setSubmitting(true)
    try {
      await bookingsApi.createBooking({
        artist_id: artistId,
        event_date: new Date(eventDate).toISOString(),
        event_type: eventType.trim(),
        location: location.trim(),
        duration: duration.trim() || undefined,
        audience_size: audienceSize.trim() || undefined,
        event_details: eventDetails.trim() || undefined,
        accommodation_selected: accSelected,
        transport_selected: transportSelected,
        security_selected: securitySelected,
      })
      setSuccess(true)
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 1500)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create booking')
    } finally {
      setSubmitting(false)
    }
  }

  const formatCurrency = (n: number) => `₹${n.toLocaleString('en-IN')}`

  const today = new Date().toISOString().split('T')[0]

  if (success) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="card p-8 max-w-sm w-full text-center animate-fadeIn">
          <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-text-primary mb-2">Booking Request Sent!</h2>
          <p className="text-sm text-text-secondary">
            Your booking request has been sent to {artistName}. You'll be notified when they respond.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card z-10 flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-text-primary">Book {artistName}</h2>
            {artistCategory && (
              <p className="text-xs text-text-secondary">{artistCategory}</p>
            )}
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-bg-secondary transition-colors">
            <X className="h-5 w-5 text-text-muted" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Event Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1.5 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" /> Event Type *
              </label>
              <input
                type="text"
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                placeholder="e.g. Wedding, Corporate Event"
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1.5 flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" /> Event Date *
              </label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                min={today}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1.5 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> Event Location *
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Mumbai, India"
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1.5 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> Duration
              </label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g. 3 hours"
                className="input-field"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1.5 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" /> Audience Size
              </label>
              <input
                type="text"
                value={audienceSize}
                onChange={(e) => setAudienceSize(e.target.value)}
                placeholder="e.g. 200-500"
                className="input-field"
              />
            </div>
          </div>

          {/* Details */}
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1.5 block">
              Additional Details / Instructions
            </label>
            <textarea
              value={eventDetails}
              onChange={(e) => setEventDetails(e.target.value)}
              placeholder="Describe any special requirements, themes, or instructions..."
              rows={3}
              className="input-field resize-none"
            />
          </div>

          {/* Add-ons */}
          {addonPrices && (
            <div>
              <p className="text-xs font-semibold text-text-primary mb-3 uppercase tracking-wider">
                Optional Add-ons
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setAccSelected(!accSelected)}
                  className={cn(
                    'rounded-xl border p-3 text-left transition-all',
                    accSelected
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                      : 'border-border hover:border-primary/30',
                  )}
                >
                  <Hotel className={cn('h-5 w-5 mb-1.5', accSelected ? 'text-primary' : 'text-text-muted')} />
                  <p className="text-sm font-medium text-text-primary">Accommodation</p>
                  <p className="text-xs text-text-secondary">{formatCurrency(addonPrices.accommodation)}</p>
                </button>
                <button
                  type="button"
                  onClick={() => setTransportSelected(!transportSelected)}
                  className={cn(
                    'rounded-xl border p-3 text-left transition-all',
                    transportSelected
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                      : 'border-border hover:border-primary/30',
                  )}
                >
                  <Car className={cn('h-5 w-5 mb-1.5', transportSelected ? 'text-primary' : 'text-text-muted')} />
                  <p className="text-sm font-medium text-text-primary">Transport</p>
                  <p className="text-xs text-text-secondary">{formatCurrency(addonPrices.transport)}</p>
                </button>
                <button
                  type="button"
                  onClick={() => setSecuritySelected(!securitySelected)}
                  className={cn(
                    'rounded-xl border p-3 text-left transition-all',
                    securitySelected
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                      : 'border-border hover:border-primary/30',
                  )}
                >
                  <Shield className={cn('h-5 w-5 mb-1.5', securitySelected ? 'text-primary' : 'text-text-muted')} />
                  <p className="text-sm font-medium text-text-primary">Security</p>
                  <p className="text-xs text-text-secondary">{formatCurrency(addonPrices.security)}</p>
                </button>
              </div>
            </div>
          )}

          {/* Price Breakdown */}
          <div className="rounded-xl border border-border bg-bg-secondary/50 p-4">
            <p className="text-xs font-semibold text-text-primary mb-3 uppercase tracking-wider flex items-center gap-1.5">
              <IndianRupee className="h-3.5 w-3.5" /> Price Breakdown
            </p>
            {pricingLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : pricing ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Artist Fee</span>
                  <span className="text-text-primary font-medium">{formatCurrency(pricing.artist_fee)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Platform Fee</span>
                  <span className="text-text-primary font-medium">{formatCurrency(pricing.platform_fee)}</span>
                </div>
                {pricing.accommodation_selected && (
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Accommodation</span>
                    <span className="text-text-primary font-medium">{formatCurrency(pricing.accommodation_price)}</span>
                  </div>
                )}
                {pricing.transport_selected && (
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Transport</span>
                    <span className="text-text-primary font-medium">{formatCurrency(pricing.transport_price)}</span>
                  </div>
                )}
                {pricing.security_selected && (
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Security</span>
                    <span className="text-text-primary font-medium">{formatCurrency(pricing.security_price)}</span>
                  </div>
                )}
                <div className="border-t border-border pt-2 mt-2">
                  <div className="flex justify-between font-semibold">
                    <span className="text-text-primary">Total Amount</span>
                    <span className="text-primary text-base">{formatCurrency(pricing.total_amount)}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-text-secondary text-xs">Advance (50% artist fee + fees)</span>
                    <span className="text-text-primary text-xs font-medium">{formatCurrency(pricing.advance_amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary text-xs">Remaining after event</span>
                    <span className="text-text-primary text-xs font-medium">{formatCurrency(pricing.remaining_amount)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-text-muted text-center py-2">Unable to load pricing</p>
            )}
          </div>

          {error && (
            <p className="text-sm text-danger bg-danger/10 rounded-lg px-4 py-2">{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Send Booking Request
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
