import apiClient from './client'

export interface BookingData {
  id: number
  organizer_id: number
  artist_id: number
  event_date: string
  event_type: string
  location: string
  duration: string | null
  audience_size: string | null
  event_details: string | null
  artist_fee: number
  platform_fee: number
  accommodation_selected: boolean
  accommodation_price: number
  transport_selected: boolean
  transport_price: number
  security_selected: boolean
  security_price: number
  total_amount: number
  advance_amount: number
  advance_paid: number
  remaining_amount: number
  status: string
  payment_status: string
  organizer_completed: boolean
  artist_completed: boolean
  created_at: string
  updated_at: string
  artist_name?: string
  artist_category?: string
  artist_location?: string
  artist_rating?: number
  organizer_name?: string
  organizer_email?: string
  // pay-advance response extras
  payment_method?: string
  transaction_id?: string
  advance_amount_due?: number
}

export interface BookingCreatePayload {
  artist_id: number
  event_date: string
  event_type: string
  location: string
  duration?: string
  audience_size?: string
  event_details?: string
  accommodation_selected?: boolean
  transport_selected?: boolean
  security_selected?: boolean
}

export interface PriceCalculation {
  artist_fee: number
  platform_fee: number
  accommodation_selected: boolean
  accommodation_price: number
  transport_selected: boolean
  transport_price: number
  security_selected: boolean
  security_price: number
  total_amount: number
  advance_amount: number
  remaining_amount: number
  default_addon_prices?: Record<string, number>
}

export interface AddonPrices {
  accommodation: number
  transport: number
  security: number
}

export interface BookingPaymentData {
  id: number
  booking_id: number
  payment_type: string
  amount: number
  status: string
  transaction_id: string | null
  created_at: string
  paid_at: string | null
}

export interface ArtistEarnings {
  total_earned: number
  pending_payout: number
  completed_bookings: number
  active_bookings: number
  total_bookings: number
}

export interface InvoiceData {
  invoice_number: string
  booking_id: number
  date: string
  event_date: string
  event_type: string
  location: string
  duration: string | null
  organizer_name: string
  organizer_email: string
  artist_name: string
  artist_category: string
  artist_fee: number
  platform_fee: number
  accommodation_selected: boolean
  accommodation_price: number
  transport_selected: boolean
  transport_price: number
  security_selected: boolean
  security_price: number
  addon_total: number
  total_amount: number
  advance_paid: number
  remaining_amount: number
  status: string
  payment_status: string
  payments: { type: string; amount: number; transaction_id: string; paid_at: string }[]
}

export const bookingsApi = {
  calculatePrice(
    artistId: number,
    addons?: { accommodation?: boolean; transport?: boolean; security?: boolean },
  ) {
    return apiClient.get<PriceCalculation>('/bookings/calculate-price', {
      params: {
        artist_id: artistId,
        accommodation_selected: addons?.accommodation || false,
        transport_selected: addons?.transport || false,
        security_selected: addons?.security || false,
      },
    })
  },

  getAddonPrices() {
    return apiClient.get<AddonPrices>('/bookings/addon-prices')
  },

  createBooking(data: BookingCreatePayload) {
    return apiClient.post<BookingData>('/bookings', data)
  },

  listBookings(statusFilter?: string) {
    return apiClient.get<BookingData[]>('/bookings', {
      params: statusFilter ? { status: statusFilter } : undefined,
    })
  },

  getBooking(id: number) {
    return apiClient.get<BookingData>(`/bookings/${id}`)
  },

  acceptBooking(id: number) {
    return apiClient.put<BookingData>(`/bookings/${id}/accept`)
  },

  rejectBooking(id: number) {
    return apiClient.put<BookingData>(`/bookings/${id}/reject`)
  },

  cancelBooking(id: number) {
    return apiClient.put<BookingData>(`/bookings/${id}/cancel`)
  },

  payAdvance(id: number, paymentMethod = 'upi') {
    return apiClient.post<BookingData>(`/bookings/${id}/pay-advance`, null, {
      params: { payment_method: paymentMethod },
    })
  },

  payRemaining(id: number) {
    return apiClient.post<BookingData>(`/bookings/${id}/pay-remaining`)
  },

  markComplete(id: number) {
    return apiClient.put<BookingData>(`/bookings/${id}/complete`)
  },

  disputeBooking(id: number) {
    return apiClient.put<BookingData>(`/bookings/${id}/dispute`)
  },

  getAvailability(artistId: number) {
    return apiClient.get<{ blocked_dates: string[] }>(`/bookings/artist/availability/${artistId}`)
  },

  getEarnings() {
    return apiClient.get<ArtistEarnings>('/bookings/artist/earnings')
  },

  getInvoice(id: number) {
    return apiClient.get<InvoiceData>(`/bookings/${id}/invoice`)
  },

  getPayments(id: number) {
    return apiClient.get<BookingPaymentData[]>(`/bookings/${id}/payments`)
  },

  confirmPayment(id: number) {
    return apiClient.post<BookingData>(`/bookings/${id}/confirm-payment`)
  },
}
