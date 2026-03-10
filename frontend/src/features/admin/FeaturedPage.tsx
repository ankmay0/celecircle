import { useState, useEffect, useCallback } from 'react'
import { Star, Plus, Loader2, Trash2, Crown, TrendingUp, Award } from 'lucide-react'
import { adminApi } from '@/api/admin'
import { cn } from '@/lib/utils'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'

interface FeaturedUser {
  id: number
  user_id: number
  user_email: string
  user_name: string
  user_role: string
  category: string
  is_active: boolean
  created_at: string
  expires_at: string | null
}

const CATEGORY_OPTIONS = [
  { value: 'featured_artist', label: 'Featured Artist', icon: Award, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  { value: 'top_celebrity', label: 'Top Celebrity', icon: Crown, color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' },
  { value: 'trending', label: 'Trending', icon: TrendingUp, color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
]

const CATEGORY_BADGE: Record<string, { label: string; color: string; icon: typeof Star }> = {
  featured_artist: { label: 'Featured Artist', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Award },
  top_celebrity: { label: 'Top Celebrity', color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400', icon: Crown },
  trending: { label: 'Trending', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', icon: TrendingUp },
}

const ROLE_BADGE: Record<string, string> = {
  artist: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  organizer: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  admin: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

export function FeaturedPage() {
  const [featured, setFeatured] = useState<FeaturedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const limit = 25

  const [showCreate, setShowCreate] = useState(false)
  const [createUserId, setCreateUserId] = useState('')
  const [createCategory, setCreateCategory] = useState('featured_artist')
  const [createExpires, setCreateExpires] = useState('')
  const [createLoading, setCreateLoading] = useState(false)

  const [removeLoading, setRemoveLoading] = useState<number | null>(null)

  const fetchFeatured = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await adminApi.getFeaturedUsers({ page, limit })
      setFeatured(data.featured || [])
      setTotal(data.total || 0)
    } catch {
      setFeatured([])
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchFeatured()
  }, [fetchFeatured])

  const handleCreate = async () => {
    const userId = parseInt(createUserId, 10)
    if (!userId || isNaN(userId)) return
    setCreateLoading(true)
    try {
      await adminApi.featureUser(userId, createCategory, createExpires || undefined)
      setShowCreate(false)
      setCreateUserId('')
      setCreateCategory('featured_artist')
      setCreateExpires('')
      await fetchFeatured()
    } catch {
      /* silent */
    } finally {
      setCreateLoading(false)
    }
  }

  const handleRemove = async (id: number) => {
    if (!confirm('Remove this featured user?')) return
    setRemoveLoading(id)
    try {
      await adminApi.removeFeatured(id)
      await fetchFeatured()
    } catch {
      /* silent */
    } finally {
      setRemoveLoading(null)
    }
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Featured Users" description={`${total} featured users`}>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Feature User
        </button>
      </AdminPageHeader>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="card w-full max-w-md p-6">
            <h3 className="mb-4 text-base font-semibold text-text-primary">Feature a User</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-muted">User ID</label>
                <input
                  type="number"
                  value={createUserId}
                  onChange={(e) => setCreateUserId(e.target.value)}
                  className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Enter user ID"
                  min={1}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-muted">Category</label>
                <select
                  value={createCategory}
                  onChange={(e) => setCreateCategory(e.target.value)}
                  className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  {CATEGORY_OPTIONS.map((o) => (
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
                  setCreateUserId('')
                  setCreateCategory('featured_artist')
                  setCreateExpires('')
                }}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!createUserId || createLoading}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {createLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Feature
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : featured.length === 0 ? (
        <div className="card p-12 text-center">
          <Star className="mx-auto mb-3 h-12 w-12 text-text-muted" />
          <h3 className="text-lg font-semibold text-text-primary">No featured users</h3>
          <p className="mt-1 text-sm text-text-secondary">Feature your first user to highlight them on the platform.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-bg-secondary/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">Created</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">Expires</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-text-muted">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {featured.map((f) => {
                  const cat = CATEGORY_BADGE[f.category]
                  const CatIcon = cat?.icon || Star
                  return (
                    <tr key={f.id} className="hover:bg-bg-secondary/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-semibold text-primary">
                              {f.user_name?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          </div>
                          <span className="font-medium text-text-primary">{f.user_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-text-secondary text-xs max-w-[160px] truncate">{f.user_email}</td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize', ROLE_BADGE[f.user_role] || 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400')}>
                          {f.user_role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium', cat?.color || 'bg-gray-100 text-gray-600')}>
                          <CatIcon className="h-3 w-3" />
                          {cat?.label || f.category}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-xs">
                          <span className={cn('h-2 w-2 rounded-full', f.is_active ? 'bg-emerald-500' : 'bg-gray-400')} />
                          <span className={f.is_active ? 'text-emerald-600 dark:text-emerald-400' : 'text-text-muted'}>
                            {f.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-text-secondary whitespace-nowrap">{formatDate(f.created_at)}</td>
                      <td className="px-4 py-3 text-text-secondary whitespace-nowrap">{f.expires_at ? formatDate(f.expires_at) : '—'}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleRemove(f.id)}
                          disabled={removeLoading === f.id}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 dark:border-red-800 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                        >
                          {removeLoading === f.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                          Remove
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-5 py-3">
              <p className="text-xs text-text-muted">
                Page {page} of {totalPages} ({total} featured)
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
