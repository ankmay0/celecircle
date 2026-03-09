import apiClient from './client'
import type { AuthResponse, User } from '@/types'

export const authApi = {
  register(data: {
    email: string
    password: string
    role: string
    first_name: string
    last_name: string
    username: string
  }) {
    return apiClient.post<{ message: string; user_id: number }>('/auth/register', data)
  },

  checkUsername(username: string) {
    return apiClient.get<{ available: boolean }>('/auth/check-username', {
      params: { username },
    })
  },

  requestOtp(email: string) {
    return apiClient.post<{ message: string; otp?: string }>('/auth/request-otp', { email })
  },

  verifyOtp(email: string, otp: string) {
    return apiClient.post<{ message: string }>('/auth/verify-otp', { email, otp })
  },

  login(email: string, password: string) {
    return apiClient.post<AuthResponse>('/auth/login', { email, password })
  },

  getMe() {
    return apiClient.get<User>('/auth/me')
  },
}
