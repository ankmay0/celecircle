import axios from 'axios'
import { BACKEND_URL } from '@/lib/utils'

const apiClient = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth-token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth-token')
      localStorage.removeItem('auth-storage')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    const message =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      'Something went wrong'
    return Promise.reject(new Error(typeof message === 'string' ? message : JSON.stringify(message)))
  },
)

export default apiClient
