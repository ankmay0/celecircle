import { useState, useEffect, useCallback } from 'react'
import { Search, Loader2, MoreHorizontal, UserX, UserCheck, Trash2, ExternalLink } from 'lucide-react'
import { adminApi } from '@/api/admin'
import { cn } from '@/lib/utils'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { StatusBadge } from '@/components/admin/StatusBadge'

interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  username: string
  role: string
  is_verified: boolean
  verification_type: string | null
  is_active: boolean
  name: string
  total_bookings: number
  created_at: string
}

const ROLE_OPTIONS = [
  { value: '', label: 'All Roles' },
  { value: 'artist', label: 'Artist' },
  { value: 'organizer', label: 'Organizer' },
  { value: 'admin', label: 'Admin' },
]

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [openMenu, setOpenMenu] = useState<number | null>(null)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const limit = 20

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await adminApi.getUsers({
        role: role || undefined,
        search: search || undefined,
        page,
        limit,
      })
      setUsers(data.users || [])
      setTotal(data.total || 0)
    } catch {
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [role, search, page])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  useEffect(() => {
    setPage(1)
  }, [role, search])

  const handleSuspend = async (userId: number) => {
    setActionLoading(userId)
    try {
      await adminApi.suspendUser(userId)
      await fetchUsers()
    } catch {
      /* silent */
    } finally {
      setActionLoading(null)
      setOpenMenu(null)
    }
  }

  const handleActivate = async (userId: number) => {
    setActionLoading(userId)
    try {
      await adminApi.activateUser(userId)
      await fetchUsers()
    } catch {
      /* silent */
    } finally {
      setActionLoading(null)
      setOpenMenu(null)
    }
  }

  const handleDelete = async (userId: number) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.'))
      return
    setActionLoading(userId)
    try {
      await adminApi.deleteUser(userId)
      await fetchUsers()
    } catch {
      /* silent */
    } finally {
      setActionLoading(null)
      setOpenMenu(null)
    }
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      <AdminPageHeader title="User Management" description={`${total} total users`} />

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
        >
          {ROLE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : users.length === 0 ? (
        <div className="card p-12 text-center">
          <UserX className="mx-auto mb-3 h-12 w-12 text-text-muted" />
          <h3 className="text-lg font-semibold text-text-primary">No users found</h3>
          <p className="mt-1 text-sm text-text-secondary">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-bg-secondary/50">
                  <th className="px-5 py-3 text-left text-xs font-medium text-text-muted">Name</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-text-muted">
                    Email
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-text-muted">Role</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-text-muted">
                    Verified
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-text-muted">
                    Active
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-text-muted">
                    Bookings
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-text-muted">
                    Joined
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-text-muted">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-bg-secondary/30 transition-colors">
                    <td className="px-5 py-3 font-medium text-text-primary whitespace-nowrap">
                      {u.name || `${u.first_name} ${u.last_name}`}
                    </td>
                    <td className="px-5 py-3 text-text-secondary">{u.email}</td>
                    <td className="px-5 py-3 text-text-secondary capitalize">{u.role}</td>
                    <td className="px-5 py-3">
                      {u.is_verified ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Verified
                        </span>
                      ) : (
                        <span className="text-xs text-text-muted">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge
                        status={u.is_active ? 'active' : 'suspended'}
                        size="sm"
                      />
                    </td>
                    <td className="px-5 py-3 text-right text-text-secondary">
                      {u.total_bookings}
                    </td>
                    <td className="px-5 py-3 text-text-secondary whitespace-nowrap">
                      {new Date(u.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="relative inline-block">
                        <button
                          onClick={() => setOpenMenu(openMenu === u.id ? null : u.id)}
                          className="rounded-lg p-1.5 text-text-muted hover:bg-bg-secondary transition-colors"
                        >
                          {actionLoading === u.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MoreHorizontal className="h-4 w-4" />
                          )}
                        </button>
                        {openMenu === u.id && (
                          <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-xl border border-border bg-card py-1 shadow-lg">
                            <a
                              href={`/profile/${u.id}`}
                              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-text-secondary hover:bg-bg-secondary transition-colors"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              View Profile
                            </a>
                            {u.is_active ? (
                              <button
                                onClick={() => handleSuspend(u.id)}
                                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-amber-600 hover:bg-bg-secondary transition-colors"
                              >
                                <UserX className="h-3.5 w-3.5" />
                                Suspend
                              </button>
                            ) : (
                              <button
                                onClick={() => handleActivate(u.id)}
                                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-emerald-600 hover:bg-bg-secondary transition-colors"
                              >
                                <UserCheck className="h-3.5 w-3.5" />
                                Activate
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(u.id)}
                              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-bg-secondary transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-5 py-3">
              <p className="text-xs text-text-muted">
                Page {page} of {totalPages} ({total} users)
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
