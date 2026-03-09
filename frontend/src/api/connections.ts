import apiClient from './client'

export const connectionsApi = {
  follow(userId: number) {
    return apiClient.post(`/connections/${userId}/follow`)
  },

  unfollow(userId: number) {
    return apiClient.delete(`/connections/${userId}/unfollow`)
  },

  getFollowers() {
    return apiClient.get('/connections/followers')
  },

  getFollowing() {
    return apiClient.get('/connections/following')
  },

  getStatus(userId: number) {
    return apiClient.get<{ is_following: boolean }>(`/connections/${userId}/status`)
  },

  getPendingRequests() {
    return apiClient.get('/connections/pending')
  },

  getConnections() {
    return apiClient.get('/connections/following')
  },
}
