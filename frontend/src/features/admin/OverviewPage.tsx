import { useState, useEffect } from 'react'
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  Users,
  UserCheck,
  CalendarCheck,
  IndianRupee,
  TrendingUp,
  BadgeCheck,
  Loader2,
  Clock,
} from 'lucide-react'
import { adminApi } from '@/api/admin'
import { formatCurrency } from '@/lib/utils'
import { StatCard } from '@/components/admin/StatCard'
import { StatusBadge } from '@/components/admin/StatusBadge'

interface DashboardData {
  total_users: number
  total_artists: number
  total_organizers: number
  verified_users: number
  total_bookings: number
  confirmed_bookings: number
  total_revenue: number
  platform_fees: number
  pending_payouts: number
  monthly_revenue: { month: string; revenue: number }[]
  monthly_bookings: { month: string; count: number }[]
  recent_bookings: {
    id: number
    artist_name: string
    event_type: string
    event_date: string
    total_amount: number
    status: string
  }[]
}

export function OverviewPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await adminApi.getDashboard()
        setData(res.data)
      } catch {
        /* silent */
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-text-secondary">
        <p>Failed to load dashboard data.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* User & Booking Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard title="Total Users" value={data.total_users} icon={Users} />
        <StatCard title="Artists" value={data.total_artists} icon={UserCheck} />
        <StatCard title="Organizers" value={data.total_organizers} icon={Users} />
        <StatCard title="Verified Users" value={data.verified_users} icon={BadgeCheck} />
        <StatCard title="Total Bookings" value={data.total_bookings} icon={CalendarCheck} />
        <StatCard title="Confirmed" value={data.confirmed_bookings} icon={CalendarCheck} />
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(data.total_revenue)}
          icon={IndianRupee}
        />
        <StatCard
          title="Platform Fees"
          value={formatCurrency(data.platform_fees)}
          icon={TrendingUp}
        />
        <StatCard
          title="Pending Payouts"
          value={formatCurrency(data.pending_payouts)}
          icon={Clock}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Monthly Revenue */}
        <div className="card p-6">
          <h2 className="mb-4 text-sm font-semibold text-text-primary">Monthly Revenue</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.monthly_revenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #e5e7eb)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid var(--color-border, #e5e7eb)',
                  fontSize: '13px',
                }}
              />
              <Bar dataKey="revenue" fill="var(--color-primary, #6366f1)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Bookings */}
        <div className="card p-6">
          <h2 className="mb-4 text-sm font-semibold text-text-primary">Monthly Bookings</h2>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data.monthly_bookings}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #e5e7eb)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: number) => [value, 'Bookings']}
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid var(--color-border, #e5e7eb)',
                  fontSize: '13px',
                }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="var(--color-primary, #6366f1)"
                fill="var(--color-primary, #6366f1)"
                fillOpacity={0.15}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Bookings Table */}
      <div className="card overflow-hidden">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-sm font-semibold text-text-primary">Recent Bookings</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg-secondary/50">
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted">Artist</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted">
                  Event Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted">Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-text-muted">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.recent_bookings?.map((b) => (
                <tr key={b.id} className="hover:bg-bg-secondary/30 transition-colors">
                  <td className="px-6 py-3 font-medium text-text-primary">#{b.id}</td>
                  <td className="px-6 py-3 text-text-secondary">{b.artist_name}</td>
                  <td className="px-6 py-3 text-text-secondary capitalize">{b.event_type}</td>
                  <td className="px-6 py-3 text-text-secondary">
                    {new Date(b.event_date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-6 py-3 text-right font-medium text-text-primary">
                    {formatCurrency(b.total_amount)}
                  </td>
                  <td className="px-6 py-3">
                    <StatusBadge status={b.status} size="sm" />
                  </td>
                </tr>
              ))}
              {(!data.recent_bookings || data.recent_bookings.length === 0) && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-text-muted">
                    No recent bookings
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
