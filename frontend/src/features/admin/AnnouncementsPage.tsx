import { useState, useEffect, useCallback } from 'react'
import { Megaphone, Plus, Loader2, ToggleLeft, ToggleRight, Trash2, Users, Star } from 'lucide-react'
import { adminApi } from '@/api/admin'
import { cn } from '@/lib/utils'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'

interface Announcement {
  id: number
  title: string
  message: string
  target_audience: string
  is_active: boolean
  admin_email: string
  created_at: string
  expires_at: string | null
}

const TARGET_OPTIONS = [
  { value: 'all', label: 'All Users', icon: Users },
  { value: 'artists', label: 'Artists', icon: Star },
  { value: 'organizers', label: 'Organizers', icon: Megaphone },
]

const TARGET_BADGE: Record<string, string> = {
  all: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  artists: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  organizers: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
}

export function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const limit = 25

  const [showCreate, setShowCreate] = useState(false)
  const [createTitle, setCreateTitle] = useState('')
  const [createMessage, setCreateMessage] = useState('')
  const [createTarget, setCreateTarget] = useState('all')
  const [createExpires, setCreateExpires] = useState('')
  const [createLoading, setCreateLoading] = useState(false)

  const [toggleLoading, setToggleLoading] = useState<number | null>(null)
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null)

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await adminApi.getAnnouncements({ page, limit })
      setAnnouncements(data.announcements || [])
      setTotal(data.total || 0)
    } catch {
      setAnnouncements([])
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchAnnouncements()
  }, [fetchAnnouncements])

  const handleCreate = async () => {
    if (!createTitle.trim() || !createMessage.trim()) return
    setCreateLoading(true)
    try {
      await adminApi.createAnnouncement(
        createTitle,
        createMessage,
        createTarget,
        createExpires || undefined,
      )
      setShowCreate(false)
      setCreateTitle('')
      setCreateMessage('')
      setCreateTarget('all')
      setCreateExpires('')
      await fetchAnnouncements()
    } catch {
      /* silent */
    } finally {
      setCreateLoading(false)
    }
  }

  const handleToggle = async (ann: Announcement) => {
    setToggleLoading(ann.id)
    try {
      await adminApi.updateAnnouncement(ann.id, { is_active: !ann.is_active })
      await fetchAnnouncements()
    } catch {
      /* silent */
    } finally {
      setToggleLoading(null)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this announcement?')) return
    setDeleteLoading(id)
    try {
      await adminApi.deleteAnnouncement(id)
      await fetchAnnouncements()
    } catch {
      /* silent */
    } finally {
      setDeleteLoading(null)
    }
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Announcements" description={`${total} total announcements`}>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Announcement
        </button>
      </AdminPageHeader>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="card w-full max-w-lg p-6">
            <h3 className="mb-4 text-base font-semibold text-text-primary">New Announcement</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-muted">Title</label>
                <input
                  type="text"
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Announcement title"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-muted">Message</label>
                <textarea
                  value={createMessage}
                  onChange={(e) => setCreateMessage(e.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  placeholder="Write your announcement..."
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-muted">Target Audience</label>
                <select
                  value={createTarget}
                  onChange={(e) => setCreateTarget(e.target.value)}
                  className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  {TARGET_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-muted">Expires At (optional)</label>
                <input
                  type="date"
                  value={createExpires}
                  onChange={(e) => setCreateExpires(e.target.value)}
                  className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowCreate(false)
                  setCreateTitle('')
                  setCreateMessage('')
                  setCreateTarget('all')
                  setCreateExpires('')
                }}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!createTitle.trim() || !createMessage.trim() || createLoading}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {createLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Publish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="card p-12 text-center">
          <Megaphone className="mx-auto mb-3 h-12 w-12 text-text-muted" />
          <h3 className="text-lg font-semibold text-text-primary">No announcements yet</h3>
          <p className="mt-1 text-sm text-text-secondary">Create your first announcement to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((ann) => (
            <div key={ann.id} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h4 className="text-sm font-semibold text-text-primary">{ann.title}</h4>
                    <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize', TARGET_BADGE[ann.target_audience] || TARGET_BADGE.all)}>
                      {ann.target_audience}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs">
                      <span className={cn('h-2 w-2 rounded-full', ann.is_active ? 'bg-emerald-500' : 'bg-gray-400')} />
                      <span className={ann.is_active ? 'text-emerald-600 dark:text-emerald-400' : 'text-text-muted'}>
                        {ann.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm text-text-secondary line-clamp-2">{ann.message}</p>
                  <div className="mt-2 flex items-center gap-4 text-xs text-text-muted">
                    <span>By {ann.admin_email}</span>
                    <span>Created {formatDate(ann.created_at)}</span>
                    {ann.expires_at && <span>Expires {formatDate(ann.expires_at)}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleToggle(ann)}
                    disabled={toggleLoading === ann.id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-bg-secondary transition-colors disabled:opacity-50"
                    title={ann.is_active ? 'Deactivate' : 'Activate'}
                  >
                    {toggleLoading === ann.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : ann.is_active ? (
                      <ToggleRight className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <ToggleLeft className="h-3.5 w-3.5" />
                    )}
                    {ann.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleDelete(ann.id)}
                    disabled={deleteLoading === ann.id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 dark:border-red-800 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                  >
                    {deleteLoading === ann.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-1 py-3">
              <p className="text-xs text-text-muted">
                Page {page} of {totalPages} ({total} announcements)
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className={cn(
                    'rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors',
                    page <= 1
                      ? 'cursor-not-allowed text-text-muted'
                      : 'text-text-secondary hover:bg-bg-secondary',
                  )}
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className={cn(
                    'rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors',
                    page >= totalPages
                      ? 'cursor-not-allowed text-text-muted'
                      : 'text-text-secondary hover:bg-bg-secondary',
                  )}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
