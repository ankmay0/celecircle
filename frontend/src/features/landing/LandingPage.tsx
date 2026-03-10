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
import { Footer } from '@/components/layout/Footer'
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
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-950/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <img src="/celecircle-logo.png" alt="CeleCircle" style={{ height: '80px' }} className="w-auto" />
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {isAuthenticated ? (
              <Link to="/feed" className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
                Go to Feed <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">Sign In</Link>
                <Link to="/register" className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">Join Now</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-white dark:bg-gray-950">
        <div className="mx-auto max-w-6xl px-6 py-24 lg:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 px-4 py-1.5 mb-6">
              <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">The #1 Platform for Celebrity Bookings</span>
            </div>
            <h1 className="text-5xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-white lg:text-7xl">
              Connect. Create.{' '}
              <span className="text-blue-600 dark:text-blue-400">
                Celebrate.
              </span>
            </h1>
            <p className="mt-6 text-lg text-gray-600 dark:text-gray-400 leading-relaxed max-w-2xl">
              CeleCircle connects artists, celebrities, and event organizers on one powerful platform.
              Build your brand, discover talent, and create unforgettable experiences.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/register?role=artist" className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-8 py-3 text-base font-semibold text-white hover:bg-blue-700 transition-colors">
                <Play className="h-4 w-4" /> Join as Artist
              </Link>
              <Link to="/register?role=organizer" className="inline-flex items-center gap-2 rounded-full border border-gray-300 dark:border-gray-700 px-8 py-3 text-base font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                Join as Organizer
              </Link>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Free to join</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Verified profiles</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Secure payments</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Why CeleCircle?</h2>
            <p className="mt-3 text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
              Everything you need to connect, collaborate, and grow in the entertainment industry.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {features.map(({ icon: Icon, title, description, color, bg }) => (
              <div key={title} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 hover:shadow-lg transition-shadow group">
                <div className={`h-12 w-12 rounded-xl ${bg} flex items-center justify-center mb-4`}>
                  <Icon className={`h-6 w-6 ${color}`} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white dark:bg-gray-950">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">How It Works</h2>
            <p className="mt-3 text-gray-600 dark:text-gray-400">Three simple steps to get started</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map(({ number, title, description }) => (
              <div key={number} className="relative text-center">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-2xl font-extrabold mb-4">
                  {number}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Explore Top Categories</h2>
          </div>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            {categories.map(({ icon: Icon, label, count }) => (
              <div
                key={label}
                className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 text-center hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer group"
              >
                <div className="mx-auto h-14 w-14 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-3 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
                  <Icon className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{label}</h3>
                <p className="text-xs text-gray-400 mt-1">{count} artists</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-white dark:bg-gray-950">
        <div className="mx-auto max-w-6xl px-6">
          <div className="bg-gray-50 dark:bg-gray-900 p-12 text-center rounded-2xl border border-gray-200 dark:border-gray-800">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Ready to Elevate Your Next Event?
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto mb-8">
              Join thousands of artists and organizers already using CeleCircle to create amazing experiences.
            </p>
            <div className="flex justify-center gap-4">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-8 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                Get Started Free <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/help"
                className="inline-flex items-center gap-2 rounded-full border border-gray-300 dark:border-gray-700 px-8 py-3 text-sm font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
