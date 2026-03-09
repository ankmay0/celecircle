import { useState, useEffect } from 'react'
import { BadgeCheck, Check, Crown, Loader2, Shield, Sparkles, Star } from 'lucide-react'
import { usersApi } from '@/api/users'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'

interface VerificationStatus {
  is_verified: boolean
  verification_type: string | null
  verification_payment_status: string | null
  verification_expiry: string | null
}

const plans = [
  {
    type: 'organizer_verified',
    title: 'Organizer / Event Manager',
    price: '₹50',
    period: '/month',
    color: 'emerald',
    badgeColor: 'text-emerald-500',
    bgGradient: 'from-emerald-500/20 to-emerald-600/5',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    hoverBorder: 'hover:border-emerald-400',
    btnClass: 'bg-emerald-600 hover:bg-emerald-700',
    icon: Shield,
    features: [
      'Green verification tick beside your name',
      'Badge on your profile photo',
      'Verified badge across all posts & comments',
      'Priority in search results',
      'Increased trust with artists',
      'Verified organizer label on your profile',
    ],
    roles: ['organizer'],
  },
  {
    type: 'celebrity_verified',
    title: 'Celebrity',
    price: '₹100',
    period: '/month',
    color: 'blue',
    badgeColor: 'text-blue-500',
    bgGradient: 'from-blue-500/20 to-blue-600/5',
    borderColor: 'border-blue-200 dark:border-blue-800',
    hoverBorder: 'hover:border-blue-400',
    btnClass: 'bg-blue-600 hover:bg-blue-700',
    icon: Crown,
    features: [
      'Blue verification tick beside your name',
      'Badge on your profile photo',
      'Verified badge across all posts & comments',
      'Priority in search & gig recommendations',
      'Verified celebrity label on your profile',
      'Stand out from other artists',
    ],
    roles: ['artist'],
  },
]

export function VerificationPage() {
  const user = useAuthStore((s) => s.user)
  const [status, setStatus] = useState<VerificationStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [subscribing, setSubscribing] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    try {
      const { data } = await usersApi.getVerificationStatus()
      setStatus(data)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  const handleSubscribe = async (planType: string) => {
    setSubscribing(planType)
    try {
      await usersApi.subscribeVerification(planType)
      setSuccess(true)
      await fetchStatus()
    } catch {
      // silent
    } finally {
      setSubscribing(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (status?.is_verified) {
    const activePlan = plans.find((p) => p.type === status.verification_type)
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <div className="card p-8 text-center animate-fade-in">
          <div className={cn(
            'mx-auto h-20 w-20 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-5',
            activePlan?.bgGradient || 'from-primary/20 to-secondary/20',
          )}>
            <BadgeCheck className={cn('h-10 w-10', activePlan?.badgeColor || 'text-primary')} />
          </div>
          <h2 className="text-2xl font-bold text-text-primary">You're Verified!</h2>
          <p className="text-sm text-text-secondary mt-2 leading-relaxed">
            Your <span className="font-semibold">{activePlan?.title}</span> verification is active.
            Your badge is visible across the entire platform.
          </p>
          {status.verification_expiry && (
            <p className="text-xs text-text-muted mt-3">
              Expires: {new Date(status.verification_expiry).toLocaleDateString('en-IN', {
                year: 'numeric', month: 'long', day: 'numeric',
              })}
            </p>
          )}
          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-bg-secondary px-5 py-2.5">
            <BadgeCheck className={cn('h-5 w-5', activePlan?.badgeColor)} />
            <span className="text-sm font-semibold text-text-primary">{activePlan?.title}</span>
          </div>
        </div>
      </div>
    )
  }

  if (status?.verification_payment_status === 'pending') {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <div className="card p-8 text-center animate-fade-in">
          <div className="mx-auto h-20 w-20 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/5 flex items-center justify-center mb-5">
            <Loader2 className="h-10 w-10 text-amber-500 animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary">Verification Pending</h2>
          <p className="text-sm text-text-secondary mt-2 leading-relaxed max-w-sm mx-auto">
            Your verification request has been submitted. Your badge will become active
            once the payment is confirmed by an admin.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-amber-100 dark:bg-amber-900/30 px-5 py-2.5">
            <Loader2 className="h-4 w-4 text-amber-600 animate-spin" />
            <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
              Awaiting Confirmation
            </span>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <div className="card p-8 text-center animate-fade-in">
          <div className="mx-auto h-20 w-20 rounded-2xl bg-gradient-to-br from-success/20 to-success/5 flex items-center justify-center mb-5">
            <Check className="h-10 w-10 text-success" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary">Request Submitted!</h2>
          <p className="text-sm text-text-secondary mt-2 leading-relaxed max-w-sm mx-auto">
            Your verification request has been submitted successfully.
            Your badge will become active after admin confirmation.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Hero */}
      <div className="card p-8 text-center animate-fade-in">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-400/30 to-amber-600/10 flex items-center justify-center mb-4">
          <Sparkles className="h-8 w-8 text-amber-500" />
        </div>
        <h1 className="text-2xl font-bold text-text-primary">Get Verified on CeleCircle</h1>
        <p className="text-sm text-text-secondary mt-2 max-w-md mx-auto leading-relaxed">
          {user?.role === 'organizer'
            ? 'Stand out with a green verification badge. Show artists and the community that you\'re a trusted organizer. Your badge appears everywhere — posts, comments, messages, search results, and your profile photo.'
            : 'Stand out with a blue verification badge. Show fans and the community that you\'re an authentic celebrity. Your badge appears everywhere — posts, comments, messages, search results, and your profile photo.'}
        </p>
      </div>

      {/* Plan - show only the one matching user's role */}
      <div className="max-w-md mx-auto">
        {plans
          .filter((plan) => plan.roles.includes(user?.role || ''))
          .map((plan) => {
            const Icon = plan.icon
            return (
              <div
                key={plan.type}
                className={cn(
                  'card overflow-hidden border-2 transition-all animate-slide-up',
                  plan.borderColor,
                  plan.hoverBorder,
                )}
              >
                <div className={cn('p-6 bg-gradient-to-br', plan.bgGradient)}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={cn(
                      'h-10 w-10 rounded-xl flex items-center justify-center',
                      plan.color === 'emerald' ? 'bg-emerald-100 dark:bg-emerald-900/50' : 'bg-blue-100 dark:bg-blue-900/50',
                    )}>
                      <Icon className={cn('h-5 w-5', plan.badgeColor)} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-text-primary">{plan.title}</h3>
                      <div className="flex items-center gap-1">
                        <BadgeCheck className={cn('h-4 w-4', plan.badgeColor)} />
                        <span className="text-xs text-text-muted">
                          {plan.color === 'emerald' ? 'Green' : 'Blue'} verification tick
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-3xl font-bold text-text-primary">{plan.price}</span>
                    <span className="text-sm text-text-secondary">{plan.period}</span>
                  </div>
                </div>

                <div className="p-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm text-text-secondary">
                        <Check className={cn('h-4 w-4 flex-shrink-0 mt-0.5', plan.badgeColor)} />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSubscribe(plan.type)}
                    disabled={subscribing !== null}
                    className={cn(
                      'mt-6 w-full flex items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed',
                      plan.btnClass,
                    )}
                  >
                    {subscribing === plan.type ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Star className="h-4 w-4" />
                    )}
                    {subscribing === plan.type ? 'Processing...' : 'Subscribe Now'}
                  </button>
                </div>
              </div>
            )
          })}
      </div>

      {/* FAQ */}
      <div className="card p-6 animate-fade-in">
        <h3 className="text-lg font-bold text-text-primary mb-4">How it works</h3>
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold flex-shrink-0">1</div>
            <div>
              <p className="text-sm font-medium text-text-primary">Choose your plan</p>
              <p className="text-xs text-text-secondary mt-0.5">Select the plan that matches your role on the platform.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold flex-shrink-0">2</div>
            <div>
              <p className="text-sm font-medium text-text-primary">Submit & Pay</p>
              <p className="text-xs text-text-secondary mt-0.5">Complete the subscription. Payment is confirmed by admin.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold flex-shrink-0">3</div>
            <div>
              <p className="text-sm font-medium text-text-primary">Badge goes live</p>
              <p className="text-xs text-text-secondary mt-0.5">
                Your verification badge appears everywhere — beside your name,
                on your profile photo, in posts, comments, messages, and search results.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
