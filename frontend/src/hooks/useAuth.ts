import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { authApi } from '@/api/auth'

export function useAuth() {
  const { token, user, setAuth, setUser, logout: storeLogout } = useAuthStore()
  const navigate = useNavigate()

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await authApi.login(email, password)
    localStorage.setItem('auth-token', data.access_token)
    const { data: userData } = await authApi.getMe()
    setAuth(data.access_token, userData)
    return userData
  }, [setAuth])

  const syncUser = useCallback(async () => {
    try {
      const { data } = await authApi.getMe()
      setUser(data)
      return data
    } catch {
      storeLogout()
      return null
    }
  }, [setUser, storeLogout])

  const logout = useCallback(() => {
    storeLogout()
    navigate('/login')
  }, [storeLogout, navigate])

  return {
    token,
    user,
    isAuthenticated: !!token,
    login,
    logout,
    syncUser,
  }
}
