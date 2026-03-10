import apiClient from './client'

export const adminApi = {
  getDashboard() {
    return apiClient.get('/admin/dashboard')
  },

  getUsers(params?: { role?: string; verified?: boolean; active?: boolean; search?: string; page?: number; limit?: number }) {
    return apiClient.get('/admin/users', { params })
  },

  verifyUser(userId: number) {
    return apiClient.put(`/admin/users/${userId}/verify`)
  },

  approveVerification(userId: number) {
    return apiClient.put(`/admin/users/${userId}/verification/approve`)
  },

  cancelVerification(userId: number) {
    return apiClient.put(`/admin/users/${userId}/verification/cancel`)
  },

  getVerificationRequests(status = 'pending', page = 1, limit = 50) {
    return apiClient.get('/admin/verification-requests', { params: { status, page, limit } })
  },

  suspendUser(userId: number) {
    return apiClient.put(`/admin/users/${userId}/suspend`)
  },

  activateUser(userId: number) {
    return apiClient.put(`/admin/users/${userId}/activate`)
  },

  deleteUser(userId: number) {
    return apiClient.delete(`/admin/users/${userId}`)
  },

  getBookings(params?: { status?: string; payment_status?: string; artist_search?: string; organizer_search?: string; city?: string; date_from?: string; date_to?: string; sort_by?: string; sort_dir?: string; page?: number; limit?: number }) {
    return apiClient.get('/admin/bookings', { params })
  },

  getBookingDetail(bookingId: number) {
    return apiClient.get(`/admin/bookings/${bookingId}`)
  },

  overrideBookingStatus(bookingId: number, newStatus: string) {
    return apiClient.put(`/admin/bookings/${bookingId}/status`, null, { params: { new_status: newStatus } })
  },

  cancelBooking(bookingId: number) {
    return apiClient.put(`/admin/bookings/${bookingId}/cancel`)
  },

  completeBooking(bookingId: number) {
    return apiClient.put(`/admin/bookings/${bookingId}/complete`)
  },

  issueRefund(bookingId: number) {
    return apiClient.post(`/admin/bookings/${bookingId}/refund`)
  },

  getPayments(params?: { status?: string; payment_type?: string; page?: number; limit?: number }) {
    return apiClient.get('/admin/payments', { params })
  },

  exportPaymentsCsv() {
    return apiClient.get('/admin/payments/export', { responseType: 'blob' })
  },

  getPricing() {
    return apiClient.get('/admin/pricing')
  },

  updatePricing(updates: Record<string, string | number | boolean>) {
    return apiClient.put('/admin/pricing', updates)
  },

  getDisputes(params?: { status?: string; page?: number; limit?: number }) {
    return apiClient.get('/admin/disputes', { params })
  },

  getDisputeDetail(disputeId: number) {
    return apiClient.get(`/admin/disputes/${disputeId}`)
  },

  resolveDispute(disputeId: number, action: string, resolutionNotes: string) {
    return apiClient.put(`/admin/disputes/${disputeId}/resolve`, null, { params: { action, resolution_notes: resolutionNotes } })
  },

  getRevenueReport() {
    return apiClient.get('/admin/reports/revenue')
  },

  getTopArtists(limit = 10) {
    return apiClient.get('/admin/reports/top-artists', { params: { limit } })
  },

  getCategoryReport() {
    return apiClient.get('/admin/reports/categories')
  },

  getAddonReport() {
    return apiClient.get('/admin/reports/addons')
  },

  getFinance() {
    return apiClient.get('/admin/finance')
  },

  getAuditLogs(params?: { action_type?: string; page?: number; limit?: number }) {
    return apiClient.get('/admin/audit-logs', { params })
  },

  getAnalytics() {
    return apiClient.get('/admin/analytics')
  },

  getArtistAnalytics(artistId: number) {
    return apiClient.get(`/admin/analytics/artist/${artistId}`)
  },

  getOrganizerAnalytics(organizerId: number) {
    return apiClient.get(`/admin/analytics/organizer/${organizerId}`)
  },

  getPayouts(params?: { status?: string; page?: number; limit?: number }) {
    return apiClient.get('/admin/payouts', { params })
  },

  getPayoutSummary() {
    return apiClient.get('/admin/payouts/summary')
  },

  releasePayout(bookingId: number) {
    return apiClient.post(`/admin/payouts/${bookingId}/release`)
  },

  exportBookingsCsv(dateFrom?: string, dateTo?: string) {
    return apiClient.get('/admin/reports/export/bookings', { params: { date_from: dateFrom, date_to: dateTo }, responseType: 'blob' })
  },

  exportRevenueCsv(dateFrom?: string, dateTo?: string) {
    return apiClient.get('/admin/reports/export/revenue', { params: { date_from: dateFrom, date_to: dateTo }, responseType: 'blob' })
  },

  exportDisputesCsv(dateFrom?: string, dateTo?: string) {
    return apiClient.get('/admin/reports/export/disputes', { params: { date_from: dateFrom, date_to: dateTo }, responseType: 'blob' })
  },

  confirmBookingPayment(bookingId: number) {
    return apiClient.post(`/bookings/${bookingId}/confirm-payment`)
  },

  confirmRemainingPayment(bookingId: number) {
    return apiClient.post(`/bookings/${bookingId}/confirm-remaining`)
  },

  getReportedContent(params?: { status?: string; content_type?: string; page?: number; limit?: number }) {
    return apiClient.get('/admin/moderation', { params })
  },

  resolveReport(reportId: number, action: string, notes?: string) {
    return apiClient.put(`/admin/moderation/${reportId}/resolve`, null, { params: { action, notes } })
  },

  deletePost(postId: number) {
    return apiClient.delete(`/admin/posts/${postId}`)
  },

  deleteComment(commentId: number) {
    return apiClient.delete(`/admin/comments/${commentId}`)
  },

  getSupportTickets(params?: { status?: string; issue_type?: string; priority?: string; page?: number; limit?: number }) {
    return apiClient.get('/admin/support', { params })
  },

  getSupportTicket(ticketId: number) {
    return apiClient.get(`/admin/support/${ticketId}`)
  },

  respondToTicket(ticketId: number, response: string, newStatus = 'in_progress') {
    return apiClient.put(`/admin/support/${ticketId}/respond`, null, { params: { response, new_status: newStatus } })
  },

  closeTicket(ticketId: number) {
    return apiClient.put(`/admin/support/${ticketId}/close`)
  },

  getAnnouncements(params?: { page?: number; limit?: number }) {
    return apiClient.get('/admin/announcements', { params })
  },

  createAnnouncement(title: string, message: string, targetAudience = 'all', expiresAt?: string) {
    return apiClient.post('/admin/announcements', null, { params: { title, message, target_audience: targetAudience, expires_at: expiresAt } })
  },

  updateAnnouncement(id: number, params: { title?: string; message?: string; target_audience?: string; is_active?: boolean }) {
    return apiClient.put(`/admin/announcements/${id}`, null, { params })
  },

  deleteAnnouncement(id: number) {
    return apiClient.delete(`/admin/announcements/${id}`)
  },

  getFeaturedUsers(params?: { page?: number; limit?: number }) {
    return apiClient.get('/admin/featured', { params })
  },

  featureUser(userId: number, category: string, expiresAt?: string) {
    return apiClient.post('/admin/featured', null, { params: { user_id: userId, category, expires_at: expiresAt } })
  },

  removeFeatured(featuredId: number) {
    return apiClient.delete(`/admin/featured/${featuredId}`)
  },
}
