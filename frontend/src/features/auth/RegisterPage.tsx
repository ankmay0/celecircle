import { useState, useCallback, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, UserPlus, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/stores/authStore'
import { OTPVerification } from './OTPVerification'

type Step = 'register' | 'otp'

export function RegisterPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const [step, setStep] = useState<Step>('register')
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    password: '',
    role: searchParams.get('role') === 'organizer' ? 'organizer' : 'artist',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const [devOtp, setDevOtp] = useState<string | undefined>()
  const usernameTimeout = useRef<ReturnType<typeof setTimeout>>(undefined)

  const checkUsername = useCallback((username: string) => {
    if (usernameTimeout.current) clearTimeout(usernameTimeout.current)
    if (username.length < 4) {
      setUsernameStatus('idle')
      return
    }
    setUsernameStatus('checking')
    usernameTimeout.current = setTimeout(async () => {
      try {
        const { data } = await authApi.checkUsername(username)
        setUsernameStatus(data.available ? 'available' : 'taken')
      } catch {
        setUsernameStatus('idle')
      }
    }, 400)
  }, [])

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (field === 'username') checkUsername(value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (usernameStatus === 'taken') return
    setError('')
    setLoading(true)
    try {
      await authApi.register(form)
      const otpRes = await authApi.requestOtp(form.email)
      setDevOtp(otpRes.data.otp)
      setStep('otp')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const handleOtpVerified = async () => {
    try {
      const { data } = await authApi.login(form.email, form.password)
      const { data: user } = await authApi.getMe()
      setAuth(data.access_token, user)
      navigate('/setup-profile', { replace: true })
    } catch {
      navigate('/login', { replace: true })
    }
  }

  const handleResendOtp = async () => {
    const res = await authApi.requestOtp(form.email)
    setDevOtp(res.data.otp)
    return res.data.otp
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-secondary px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <img src="/celecircle-logo.png" alt="CeleCircle" style={{ height: '48px' }} className="w-auto" />
          </Link>
          {step === 'register' && (
            <>
              <h1 className="text-2xl font-bold text-text-primary">Create Account</h1>
              <p className="text-sm text-text-secondary mt-1">Join the celebrity network</p>
            </>
          )}
        </div>

        <div className="card p-8">
          {step === 'otp' ? (
            <OTPVerification
              email={form.email}
              devOtp={devOtp}
              onVerified={handleOtpVerified}
              onResend={handleResendOtp}
            />
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-danger/10 border border-danger/20 px-4 py-3 text-sm text-danger">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">First Name</label>
                  <input
                    type="text"
                    value={form.first_name}
                    onChange={(e) => handleChange('first_name', e.target.value)}
                    className="input-field"
                    placeholder="John"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">Last Name</label>
                  <input
                    type="text"
                    value={form.last_name}
                    onChange={(e) => handleChange('last_name', e.target.value)}
                    className="input-field"
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Username</label>
                <div className="relative">
                  <input
                    type="text"
                    value={form.username}
                    onChange={(e) => handleChange('username', e.target.value)}
                    className="input-field pr-10"
                    placeholder="johndoe"
                    pattern="^[a-zA-Z0-9._#@]{4,30}$"
                    title="4-30 characters: letters, numbers, . _ # @"
                    required
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {usernameStatus === 'checking' && <Loader2 className="h-4 w-4 animate-spin text-text-muted" />}
                    {usernameStatus === 'available' && <CheckCircle2 className="h-4 w-4 text-success" />}
                    {usernameStatus === 'taken' && <XCircle className="h-4 w-4 text-danger" />}
                  </div>
                </div>
                {usernameStatus === 'taken' && (
                  <p className="mt-1 text-xs text-danger">Username is already taken</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="input-field"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    className="input-field pr-10"
                    placeholder="Min 6 characters"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">I am a...</label>
                <div className="grid grid-cols-2 gap-3">
                  {(['artist', 'organizer'] as const).map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => handleChange('role', role)}
                      className={`rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all ${
                        form.role === role
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border text-text-secondary hover:border-text-muted'
                      }`}
                    >
                      {role === 'artist' ? 'Artist / Celebrity' : 'Organizer / Recruiter'}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || usernameStatus === 'taken'}
                className="btn-primary w-full !py-3"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          )}
        </div>

        {step === 'register' && (
          <p className="mt-6 text-center text-sm text-text-secondary">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
