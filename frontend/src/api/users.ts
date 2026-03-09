import apiClient from './client'
import type { Profile, ProfileCreate, ProfileUpdate, SearchResult } from '@/types'

export const usersApi = {
  createProfile(data: ProfileCreate) {
    return apiClient.post<Profile>('/users/profiles', data)
  },

  getMyProfile() {
    return apiClient.get<Profile>('/users/profiles/me')
  },

  updateProfile(data: ProfileUpdate) {
    return apiClient.put<Profile>('/users/profiles/me', data)
  },

  getProfileById(profileId: number) {
    return apiClient.get<Profile>(`/users/profiles/${profileId}`)
  },

  getProfileByUserId(userId: number) {
    return apiClient.get<Profile>(`/users/profiles/user/${userId}`)
  },

  searchProfiles(query: string) {
    return apiClient.get<Profile[]>('/users/profiles', { params: { search: query } })
  },

  searchUsers(query: string) {
    return apiClient.get<SearchResult[]>('/users/search', { params: { q: query } })
  },

  uploadProfilePhoto(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient.post<{ url: string }>('/users/me/profile-photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  getVerificationPlans() {
    return apiClient.get('/users/verification/plans')
  },

  getVerificationStatus() {
    return apiClient.get('/users/verification/status')
  },

  subscribeVerification(verificationType: string) {
    return apiClient.post('/users/verification/subscribe', { verification_type: verificationType })
  },
}
