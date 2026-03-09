import apiClient from './client'

export const adminApi = {
  getVerificationRequests(status = 'pending', page = 1, limit = 50) {
    return apiClient.get('/admin/verification-requests', {
      params: { status, page, limit },
    })
  },

  approveVerification(userId: number) {
    return apiClient.put(`/admin/users/${userId}/verification/approve`)
  },

  cancelVerification(userId: number) {
    return apiClient.put(`/admin/users/${userId}/verification/cancel`)
  },
}
