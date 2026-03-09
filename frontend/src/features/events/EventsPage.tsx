import { useState } from 'react'
import {
  Calendar,
  MapPin,
  Clock,
  Ticket,
  Star,
  Search,
  CheckCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type EventType = 'all' | 'meet-greet' | 'concert' | 'fan-meetup' | 'workshop'

interface Event {
  id: number
  title: string
  celebrity: string
  celebrityInitials: string
  type: EventType
  date: string
  time: string
  location: string
  price: number
  originalPrice?: number
  spots: number
  spotsLeft: number
  rating: number
  gradient: string
  isBooked: boolean
}

const demoEvents: Event[] = [
  { id: 1, title: 'Meet & Greet with Priya Sharma', celebrity: 'Priya Sharma', celebrityInitials: 'PS', type: 'meet-greet', date: 'Mar 25, 2026', time: '4:00 PM', location: 'Mumbai, Maharashtra', price: 4999, spots: 50, spotsLeft: 12, rating: 4.9, gradient: 'from-rose-500/30 to-pink-600/10', isBooked: false },
  { id: 2, title: 'Live Concert: Rahul Mehta', celebrity: 'Rahul Mehta', celebrityInitials: 'RM', type: 'concert', date: 'Apr 2, 2026', time: '7:00 PM', location: 'Delhi, NCR', price: 1999, originalPrice: 2999, spots: 500, spotsLeft: 145, rating: 4.8, gradient: 'from-blue-500/30 to-indigo-600/10', isBooked: false },
  { id: 3, title: 'Dance Workshop by Ananya', celebrity: 'Ananya Roy', celebrityInitials: 'AR', type: 'workshop', date: 'Mar 30, 2026', time: '10:00 AM', location: 'Bangalore, Karnataka', price: 999, spots: 30, spotsLeft: 8, rating: 5.0, gradient: 'from-violet-500/30 to-purple-600/10', isBooked: true },
  { id: 4, title: 'Fan Meetup: Bollywood Lovers', celebrity: 'Community', celebrityInitials: 'BL', type: 'fan-meetup', date: 'Apr 10, 2026', time: '5:00 PM', location: 'Mumbai, Maharashtra', price: 0, spots: 100, spotsLeft: 67, rating: 4.5, gradient: 'from-amber-500/30 to-orange-600/10', isBooked: false },
  { id: 5, title: 'Exclusive VIP Night with Vikram', celebrity: 'Vikram Singh', celebrityInitials: 'VS', type: 'meet-greet', date: 'Apr 15, 2026', time: '8:00 PM', location: 'Jaipur, Rajasthan', price: 9999, spots: 20, spotsLeft: 3, rating: 4.9, gradient: 'from-emerald-500/30 to-teal-600/10', isBooked: false },
  { id: 6, title: 'Music Production Workshop', celebrity: 'Neha Kapoor', celebrityInitials: 'NK', type: 'workshop', date: 'Apr 20, 2026', time: '2:00 PM', location: 'Online (Zoom)', price: 499, spots: 200, spotsLeft: 89, rating: 4.7, gradient: 'from-cyan-500/30 to-blue-600/10', isBooked: false },
]

const typeLabels: Record<string, string> = {
  'meet-greet': 'Meet & Greet',
  concert: 'Concert',
  'fan-meetup': 'Fan Meetup',
  workshop: 'Workshop',
}

const typeColors: Record<string, string> = {
  'meet-greet': 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  concert: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'fan-meetup': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  workshop: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
}

export function EventsPage() {
  const [events, setEvents] = useState(demoEvents)
  const [filter, setFilter] = useState<EventType>('all')
  const [search, setSearch] = useState('')

  const filtered = events.filter((e) => {
    if (filter !== 'all' && e.type !== filter) return false
    if (search && !e.title.toLowerCase().includes(search.toLowerCase()) && !e.celebrity.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const handleBook = (eventId: number) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId
          ? { ...e, isBooked: true, spotsLeft: e.spotsLeft - 1 }
          : e,
      ),
    )
  }

  const filters: { value: EventType; label: string }[] = [
    { value: 'all', label: 'All Events' },
    { value: 'meet-greet', label: 'Meet & Greet' },
    { value: 'concert', label: 'Concerts' },
    { value: 'fan-meetup', label: 'Fan Meetups' },
    { value: 'workshop', label: 'Workshops' },
  ]

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Ticket className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-bold text-text-primary">Events & Bookings</h1>
            </div>
            <p className="text-xs text-text-secondary mt-0.5">
              Book tickets for meet & greets, concerts, workshops, and fan meetups
            </p>
          </div>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events..."
            className="input-field !pl-10"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {filters.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-xs font-medium transition-all border',
                filter === value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-text-secondary hover:bg-bg-secondary',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {filtered.map((event) => {
          const spotsPercentage = ((event.spots - event.spotsLeft) / event.spots) * 100
          const isAlmostFull = event.spotsLeft <= event.spots * 0.2
          return (
            <div key={event.id} className="card overflow-hidden hover:shadow-md transition-shadow animate-fade-in">
              <div className={cn('relative h-36 bg-gradient-to-br flex items-center justify-center', event.gradient)}>
                <Calendar className="h-12 w-12 text-white/20" />
                <div className="absolute top-3 left-3">
                  <span className={cn('rounded-full px-2.5 py-0.5 text-[10px] font-semibold', typeColors[event.type])}>
                    {typeLabels[event.type]}
                  </span>
                </div>
                {isAlmostFull && !event.isBooked && (
                  <div className="absolute top-3 right-3">
                    <span className="rounded-full bg-rose-500 text-white px-2.5 py-0.5 text-[10px] font-semibold animate-pulse">
                      Only {event.spotsLeft} left!
                    </span>
                  </div>
                )}
                {event.isBooked && (
                  <div className="absolute top-3 right-3">
                    <span className="flex items-center gap-1 rounded-full bg-emerald-500 text-white px-2.5 py-0.5 text-[10px] font-semibold">
                      <CheckCircle2 className="h-2.5 w-2.5" /> Booked
                    </span>
                  </div>
                )}
              </div>

              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-primary text-[10px] font-bold">
                    {event.celebrityInitials}
                  </div>
                  <span className="text-xs text-text-secondary">{event.celebrity}</span>
                  <div className="flex items-center gap-0.5 ml-auto">
                    <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                    <span className="text-xs font-medium text-text-primary">{event.rating}</span>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-text-primary">{event.title}</h3>

                <div className="flex flex-col gap-1.5 mt-2.5">
                  <span className="flex items-center gap-1.5 text-xs text-text-secondary">
                    <Calendar className="h-3 w-3 text-text-muted" /> {event.date}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-text-secondary">
                    <Clock className="h-3 w-3 text-text-muted" /> {event.time}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-text-secondary">
                    <MapPin className="h-3 w-3 text-text-muted" /> {event.location}
                  </span>
                </div>

                {/* Spots progress */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[10px] text-text-muted mb-1">
                    <span>{event.spots - event.spotsLeft}/{event.spots} booked</span>
                    <span>{event.spotsLeft} spots left</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-bg-tertiary overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all', isAlmostFull ? 'bg-rose-500' : 'bg-primary')}
                      style={{ width: `${spotsPercentage}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                  <div>
                    {event.price === 0 ? (
                      <span className="text-sm font-bold text-emerald-600">Free</span>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className="text-base font-bold text-text-primary">₹{event.price.toLocaleString()}</span>
                        {event.originalPrice && (
                          <span className="text-xs text-text-muted line-through">₹{event.originalPrice.toLocaleString()}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => !event.isBooked && handleBook(event.id)}
                    disabled={event.isBooked || event.spotsLeft === 0}
                    className={cn(
                      'rounded-full px-4 py-1.5 text-xs font-medium transition-all',
                      event.isBooked
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 cursor-default'
                        : event.spotsLeft === 0
                        ? 'bg-bg-tertiary text-text-muted cursor-not-allowed'
                        : 'bg-primary text-white hover:bg-primary-hover',
                    )}
                  >
                    {event.isBooked ? 'Booked ✓' : event.spotsLeft === 0 ? 'Sold Out' : 'Book Now'}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
