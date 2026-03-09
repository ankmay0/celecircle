import apiClient from './client'
import type { Gig, GigCreate, Application } from '@/types'

export const gigsApi = {
  getGigs(params?: { skip?: number; limit?: number; category?: string; status?: string; search?: string }) {
    return apiClient.get<Gig[]>('/gigs', { params })
  },

  getGig(gigId: number) {
    return apiClient.get<Gig>(`/gigs/${gigId}`)
  },

  createGig(data: GigCreate) {
    return apiClient.post<Gig>('/gigs', data)
  },

  updateGig(gigId: number, data: Partial<GigCreate>) {
    return apiClient.put<Gig>(`/gigs/${gigId}`, data)
  },

  deleteGig(gigId: number) {
    return apiClient.delete(`/gigs/${gigId}`)
  },

  applyToGig(gigId: number, data: { proposal: string; quote: number }) {
    return apiClient.post<Application>(`/gigs/${gigId}/applications`, { gig_id: gigId, ...data })
  },

  getApplications(gigId: number) {
    return apiClient.get<Application[]>(`/gigs/${gigId}/applications`)
  },

  updateApplication(applicationId: number, status: string) {
    return apiClient.put<Application>(`/gigs/applications/${applicationId}`, { status })
  },
}
