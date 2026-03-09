import { useState, useEffect, useCallback } from 'react'
import {
  BadgeCheck,
  CheckCircle2,
  XCircle,
  Loader2,
  Search,
  Shield,
  Crown,
  Clock,
  Filter,
} from 'lucide-react'
import { adminApi } from '@/api/admin'
import { cn } from '@/lib/utils'

interface VerificationRequest {
  id: number
  name: string
  email: string
  role: string | null
  verification_type: string | null
  verification_payment_status: string | null
  verification_expiry: string | null
  created_at: string | null
}

const STATUS_TABS = [
  { value: 'pending', label: 'Pending', icon: Clock, color: 'text-amber-500' },
  { value: 'approved', label: 'Approved', icon: CheckCircle2, color: 'text-emerald-500' },
  { value: 'rejected', label: 'Rejected', icon: XCircle, color: 'text-red-500' },
  { value: 'all', label: 'All', icon: Filter, color: 'text-text-secondary' },
] as const

export function VerificationManagementPage() {
  const [requests, setRequests] = useState<VerificationRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('pending')
  const [searchQuery, setSearchQuery] = useState('')
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [total, setTotal] = useState(0)

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await adminApi.getVerificationRequests(statusFilter)
      setRequests(data.requests || [])
      setTotal(data.total || 0)
    } catch {
      setRequests([])
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const handleApprove = async (userId: number) => {
    setActionLoading(userId)
    try {
      await adminApi.approveVerification(userId)
      await fetchRequests()
    } catch {
      // silent
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (userId: number) => {
    setActionLoading(userId)
    try {
      await adminApi.cancelVerification(userId)
      await fetchRequests()
    } catch {
      // silent
    } finally {
      setActionLoading(null)
    }
  }

  const filteredRequests = searchQuery
    ? requests.filter(
        (r) =>
          r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.email.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : requests

  const getPlanBadge = (type: string | null) => {
    if (type === 'organizer_verified') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
          <Shield className="h-3 w-3" />
          Organizer
        </span>
      )
    }
    if (type === 'celebrity_verified') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 px-2.5 py-1 text-xs font-medium text-blue-700 dark:text-blue-400">
          <Crown className="h-3 w-3" />
          Celebrity
        </span>
      )
    }
    return <span className="text-xs text-text-muted">—</span>
  }

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/30 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-400">
            <Clock className="h-3 w-3" />
            Pending
          </span>
        )
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="h-3 w-3" />
            Approved
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 dark:bg-red-900/30 px-2.5 py-1 text-xs font-medium text-red-700 dark:text-red-400">
            <XCircle className="h-3 w-3" />
            Rejected
          </span>
        )
      default:
        return <span className="text-xs text-text-muted">{status || '—'}</span>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-400/30 to-amber-600/10 flex items-center justify-center">
              <BadgeCheck className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-text-primary">Verification Management</h1>
              <p className="text-sm text-text-secondary">
                Review and manage user verification requests ({total} total)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="card p-1.5">
        <div className="flex gap-1">
          {STATUS_TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = statusFilter === tab.value
            return (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-text-secondary hover:bg-bg-secondary',
                )}
              >
                <Icon className={cn('h-4 w-4', isActive ? 'text-white' : tab.color)} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
        />
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="card p-12 text-center animate-fade-in">
          <BadgeCheck className="h-12 w-12 text-text-muted mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-text-primary">No requests found</h3>
          <p className="text-sm text-text-secondary mt-1">
            {statusFilter === 'pending'
              ? 'No pending verification requests at the moment.'
              : `No ${statusFilter === 'all' ? '' : statusFilter} verification requests found.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((req) => (
            <div
              key={req.id}
              className="card p-5 animate-slide-up hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* User Info */}
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-primary">
                      {req.name?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-text-primary truncate">
                        {req.name}
                      </p>
                      {getPlanBadge(req.verification_type)}
                      {getStatusBadge(req.verification_payment_status)}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-xs text-text-secondary truncate">{req.email}</p>
                      {req.role && (
                        <span className="text-xs text-text-muted capitalize">
                          {req.role}
                        </span>
                      )}
                      {req.created_at && (
                        <span className="text-xs text-text-muted">
                          {new Date(req.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      )}
                    </div>
                    {req.verification_expiry && (
                      <p className="text-xs text-text-muted mt-1">
                        Expires:{' '}
                        {new Date(req.verification_expiry).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {req.verification_payment_status === 'pending' && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleApprove(req.id)}
                      disabled={actionLoading !== null}
                      className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      {actionLoading === req.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(req.id)}
                      disabled={actionLoading !== null}
                      className="flex items-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      {actionLoading === req.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
