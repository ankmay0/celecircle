import { useState, useEffect } from 'react'
import { Bell, Check, CheckCheck, ThumbsUp, MessageCircle, UserPlus, Briefcase, Loader2, Sparkles } from 'lucide-react'
import { formatDate, cn } from '@/lib/utils'

interface Notification {
  id: number
  title: string
  message: string
  type: string
  is_read: boolean
  link: string | null
  created_at: string
}

const typeIcons: Record<string, typeof Bell> = {
  like: ThumbsUp,
  comment: MessageCircle,
  follow: UserPlus,
  gig: Briefcase,
  default: Bell,
}

const typeColors: Record<string, string> = {
  like: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  comment: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  follow: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
  gig: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  default: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

const demoNotifications: Notification[] = [
  { id: 1, title: 'New Like', message: 'Priya Sharma liked your post about the upcoming concert.', type: 'like', is_read: false, link: null, created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
  { id: 2, title: 'New Comment', message: 'Rahul Mehta commented: "Great performance!"', type: 'comment', is_read: false, link: null, created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
  { id: 3, title: 'New Follower', message: 'Ananya Roy started following you.', type: 'follow', is_read: false, link: null, created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
  { id: 4, title: 'Gig Application', message: 'You received a new application for "Wedding Singer Needed".', type: 'gig', is_read: true, link: null, created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() },
  { id: 5, title: 'New Like', message: 'Vikram Singh liked your portfolio update.', type: 'like', is_read: true, link: null, created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
  { id: 6, title: 'Gig Update', message: 'The gig "Corporate Event MC" has been updated.', type: 'gig', is_read: true, link: null, created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString() },
]

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  useEffect(() => {
    setTimeout(() => {
      setNotifications(demoNotifications)
      setLoading(false)
    }, 500)
  }, [])

  const markAsRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    )
  }

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
  }

  const filtered = filter === 'unread'
    ? notifications.filter((n) => !n.is_read)
    : notifications

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-text-primary">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-xs text-text-secondary mt-0.5">{unreadCount} unread</p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
            >
              <CheckCheck className="h-3.5 w-3.5" /> Mark all as read
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {(['all', 'unread'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'rounded-full px-4 py-1.5 text-sm font-medium transition-all border',
                filter === f
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-text-secondary hover:bg-bg-secondary',
              )}
            >
              {f === 'all' ? 'All' : `Unread (${unreadCount})`}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-16 text-center animate-fade-in">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary">
            {filter === 'unread' ? 'All Caught Up!' : 'No Notifications Yet'}
          </h3>
          <p className="text-sm text-text-secondary mt-1">
            {filter === 'unread'
              ? "You've read all your notifications."
              : 'Notifications about your activity will appear here.'}
          </p>
          {filter === 'unread' && (
            <button onClick={() => setFilter('all')} className="btn-secondary mt-4 !text-xs">
              View All Notifications
            </button>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden divide-y divide-border">
          {filtered.map((notification) => {
            const Icon = typeIcons[notification.type] || typeIcons.default
            const colorClass = typeColors[notification.type] || typeColors.default
            return (
              <div
                key={notification.id}
                onClick={() => markAsRead(notification.id)}
                className={cn(
                  'flex items-start gap-3 px-4 py-3.5 transition-colors cursor-pointer hover:bg-bg-secondary',
                  !notification.is_read && 'bg-primary/[0.03]',
                )}
              >
                <div className={cn('rounded-full p-2 flex-shrink-0 mt-0.5', colorClass)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn(
                      'text-sm leading-relaxed',
                      notification.is_read ? 'text-text-secondary' : 'text-text-primary font-medium',
                    )}>
                      {notification.message}
                    </p>
                    {!notification.is_read && (
                      <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                  <p className="text-[11px] text-text-muted mt-1">
                    {formatDate(notification.created_at)}
                  </p>
                </div>
                {!notification.is_read && (
                  <button
                    onClick={(e) => { e.stopPropagation(); markAsRead(notification.id) }}
                    className="rounded-full p-1.5 hover:bg-bg-tertiary text-text-muted transition-colors flex-shrink-0"
                    title="Mark as read"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
