import { Link } from 'react-router-dom'
import {
  Star,
  Shield,
  Users,
  Sparkles,
  ArrowRight,
  Music,
  Mic2,
  Drama,
  PartyPopper,
  CheckCircle2,
  Play,
} from 'lucide-react'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { useAuthStore } from '@/stores/authStore'

const features = [
  {
    icon: Star,
    title: 'For Artists & Celebrities',
    description: 'Showcase your talent, build your brand, and get discovered by top organizers worldwide.',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
  },
  {
    icon: Users,
    title: 'For Organizers',
    description: 'Find and book verified artists for your events with AI-powered recommendations.',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    icon: Shield,
    title: 'Secure & Trusted',
    description: 'Escrow payments, verified profiles, and dispute resolution for safe transactions.',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
]

const steps = [
  {
    number: '01',
    title: 'Create Your Profile',
    description: 'Build a stunning portfolio with videos, images, and your achievements.',
  },
  {
    number: '02',
    title: 'Discover & Connect',
    description: 'Browse gigs, connect with industry professionals, and grow your network.',
  },
  {
    number: '03',
    title: 'Get Booked & Paid',
    description: 'Receive bookings, negotiate terms, and get paid securely through escrow.',
  },
]

const categories = [
  { icon: Music, label: 'Live Bands', count: '240+' },
  { icon: Drama, label: 'Actors', count: '180+' },
  { icon: Mic2, label: 'Singers', count: '320+' },
  { icon: PartyPopper, label: 'Event Hosts', count: '150+' },
]

export function LandingPage() {
  const isAuthenticated = useAuthStore((s) => !!s.token)

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <img src="/celecircle-logo.png" alt="CeleCircle" style={{ height: '40px' }} className="w-auto" />
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {isAuthenticated ? (
              <Link to="/feed" className="btn-primary">
                Go to Feed <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn-ghost">Sign In</Link>
                <Link to="/register" className="btn-primary">Join Now</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gray-50 dark:bg-gray-900/50" />
        <div className="relative mx-auto max-w-6xl px-6 py-24 lg:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 mb-6">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">The #1 Platform for Celebrity Bookings</span>
            </div>
            <h1 className="text-5xl font-extrabold leading-tight tracking-tight text-text-primary lg:text-7xl">
              Connect. Create.{' '}
              <span className="text-primary">
                Celebrate.
              </span>
            </h1>
            <p className="mt-6 text-lg text-text-secondary leading-relaxed max-w-2xl">
              CeleCircle connects artists, celebrities, and event organizers on one powerful platform.
              Build your brand, discover talent, and create unforgettable experiences.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/register?role=artist" className="btn-primary !px-8 !py-3 !text-base">
                <Play className="h-4 w-4" /> Join as Artist
              </Link>
              <Link to="/register?role=organizer" className="btn-secondary !px-8 !py-3 !text-base">
                Join as Organizer
              </Link>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm text-text-secondary">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-success" /> Free to join</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-success" /> Verified profiles</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-success" /> Secure payments</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border bg-bg-secondary py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-text-primary">Why CeleCircle?</h2>
            <p className="mt-3 text-text-secondary max-w-xl mx-auto">
              Everything you need to connect, collaborate, and grow in the entertainment industry.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {features.map(({ icon: Icon, title, description, color, bg }) => (
              <div key={title} className="card p-6 hover:shadow-lg transition-shadow group">
                <div className={`h-12 w-12 rounded-xl ${bg} flex items-center justify-center mb-4`}>
                  <Icon className={`h-6 w-6 ${color}`} />
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-text-primary">How It Works</h2>
            <p className="mt-3 text-text-secondary">Three simple steps to get started</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map(({ number, title, description }) => (
              <div key={number} className="relative text-center">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary text-2xl font-extrabold mb-4">
                  {number}
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="border-t border-border bg-bg-secondary py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-text-primary">Explore Top Categories</h2>
          </div>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            {categories.map(({ icon: Icon, label, count }) => (
              <div
                key={label}
                className="card p-6 text-center hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer group"
              >
                <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                  <Icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold text-text-primary">{label}</h3>
                <p className="text-xs text-text-muted mt-1">{count} artists</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="card bg-gray-100 dark:bg-gray-800 p-12 text-center rounded-2xl border border-border">
            <h2 className="text-3xl font-bold text-text-primary mb-4">
              Ready to Elevate Your Next Event?
            </h2>
            <p className="text-text-secondary max-w-xl mx-auto mb-8">
              Join thousands of artists and organizers already using CeleCircle to create amazing experiences.
            </p>
            <div className="flex justify-center gap-4">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
              >
                Get Started Free <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/help"
                className="inline-flex items-center gap-2 rounded-full border border-border px-8 py-3 text-sm font-semibold text-text-primary hover:bg-bg-secondary transition-colors"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8">
        <div className="mx-auto max-w-6xl px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/celecircle-logo.png" alt="CeleCircle" style={{ height: '28px' }} className="w-auto" />
            <span className="text-xs text-text-muted">&copy; 2026</span>
          </div>
          <div className="flex gap-6 text-xs text-text-secondary">
            <Link to="/help" className="hover:text-text-primary transition-colors">Help Center</Link>
            <Link to="/terms" className="hover:text-text-primary transition-colors">Terms</Link>
            <Link to="/secure-payments" className="hover:text-text-primary transition-colors">Secure Payments</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
