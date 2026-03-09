import { useState, useRef, useEffect } from 'react'
import { ShieldCheck, Loader2 } from 'lucide-react'

interface OTPVerificationProps {
  email: string
  devOtp?: string
  onVerified: () => void
  onResend: () => Promise<string | undefined>
}

export function OTPVerification({ email, devOtp, onVerified, onResend }: OTPVerificationProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    inputs.current[0]?.focus()
  }, [])

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)
    if (value && index < 5) {
      inputs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setOtp(pasted.split(''))
      inputs.current[5]?.focus()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const code = otp.join('')
    if (code.length !== 6) {
      setError('Please enter the complete 6-digit code')
      return
    }
    setError('')
    setLoading(true)
    try {
      const { authApi } = await import('@/api/auth')
      await authApi.verifyOtp(email, code)
      onVerified()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResending(true)
    try {
      await onResend()
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="text-center">
      <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
        <ShieldCheck className="h-7 w-7 text-primary" />
      </div>
      <h2 className="text-xl font-bold text-text-primary mb-1">Verify Your Email</h2>
      <p className="text-sm text-text-secondary mb-6">
        We sent a 6-digit code to <strong className="text-text-primary">{email}</strong>
      </p>

      {devOtp && (
        <div className="mb-4 rounded-lg bg-amber-500/10 border border-amber-500/20 px-4 py-2 text-sm text-amber-700 dark:text-amber-400">
          Dev OTP: <strong>{devOtp}</strong>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg bg-danger/10 border border-danger/20 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputs.current[i] = el }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="h-12 w-12 rounded-lg border border-border bg-bg-primary text-center text-lg font-bold text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          ))}
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full !py-3 mb-4">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {loading ? 'Verifying...' : 'Verify Email'}
        </button>
      </form>

      <button
        onClick={handleResend}
        disabled={resending}
        className="text-sm text-text-secondary hover:text-primary transition-colors"
      >
        {resending ? 'Resending...' : "Didn't receive the code? Resend"}
      </button>
    </div>
  )
}
