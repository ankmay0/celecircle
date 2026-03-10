import { useState, useEffect } from 'react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { BarChart3, TrendingUp, Users, IndianRupee, Loader2, Star } from 'lucide-react'
import { adminApi } from '@/api/admin'
import { formatCurrency } from '@/lib/utils'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { StatCard } from '@/components/admin/StatCard'

interface Artist {
  artist_id: number
  name: string
  category: string
  bookings: number
  revenue: number
  rating: number
}

interface Organizer {
  organizer_id: number
  name: string
  email: string
  bookings: number
  total_spend: number
}

interface AnalyticsData {
  total_bookings: number
  conversion_rate: number
  average_booking_value: number
  addon_attachment_rate: number
  top_artists: Artist[]
  top_organizers: Organizer[]
  revenue_by_region: { region: string; revenue: number }[]
  revenue_by_month: { month: string; label: string; revenue: number }[]
}

export function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await adminApi.getAnalytics()
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
        <p>Failed to load analytics data.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Analytics" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="Total Bookings" value={data.total_bookings} icon={BarChart3} />
        <StatCard title="Conversion Rate" value={`${data.conversion_rate}%`} icon={TrendingUp} />
        <StatCard
          title="Avg Booking Value"
          value={formatCurrency(data.average_booking_value)}
          icon={IndianRupee}
        />
        <StatCard title="Add-on Rate" value={`${data.addon_attachment_rate}%`} icon={Users} />
      </div>

      {/* Revenue Trend */}
      <div className="card p-6">
        <h2 className="mb-4 text-sm font-semibold text-text-primary">Revenue Trend</h2>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data.revenue_by_month}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #e5e7eb)" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value) => [formatCurrency(Number(value)), 'Revenue']}
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid var(--color-border, #e5e7eb)',
                fontSize: '13px',
              }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="var(--color-primary, #6366f1)"
              fill="var(--color-primary, #6366f1)"
              fillOpacity={0.15}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Top Artists & Top Organizers */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card overflow-hidden">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-sm font-semibold text-text-primary">Top Artists</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-bg-secondary/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">Category</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-text-muted">Bookings</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-text-muted">Revenue</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-text-muted">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.top_artists.map((a, i) => (
                  <tr key={a.artist_id} className="hover:bg-bg-secondary/30 transition-colors">
                    <td className="px-4 py-3 text-text-muted">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-text-primary whitespace-nowrap">{a.name}</td>
                    <td className="px-4 py-3 text-text-secondary capitalize">{a.category}</td>
                    <td className="px-4 py-3 text-right text-text-secondary">{a.bookings}</td>
                    <td className="px-4 py-3 text-right font-medium text-text-primary whitespace-nowrap">
                      {formatCurrency(a.revenue)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex items-center gap-1 text-text-secondary">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        {a.rating.toFixed(1)}
                      </span>
                    </td>
                  </tr>
                ))}
                {data.top_artists.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-text-muted">
                      No artist data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-sm font-semibold text-text-primary">Top Organizers</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-bg-secondary/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">Email</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-text-muted">Bookings</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-text-muted">Spend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.top_organizers.map((o, i) => (
                  <tr key={o.organizer_id} className="hover:bg-bg-secondary/30 transition-colors">
                    <td className="px-4 py-3 text-text-muted">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-text-primary whitespace-nowrap">{o.name}</td>
                    <td className="px-4 py-3 text-text-secondary max-w-[180px] truncate">{o.email}</td>
                    <td className="px-4 py-3 text-right text-text-secondary">{o.bookings}</td>
                    <td className="px-4 py-3 text-right font-medium text-text-primary whitespace-nowrap">
                      {formatCurrency(o.total_spend)}
                    </td>
                  </tr>
                ))}
                {data.top_organizers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-text-muted">
                      No organizer data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Revenue by Region */}
      <div className="card p-6">
        <h2 className="mb-4 text-sm font-semibold text-text-primary">Revenue by Region</h2>
        <ResponsiveContainer width="100%" height={Math.max(250, data.revenue_by_region.length * 40)}>
          <BarChart data={data.revenue_by_region} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #e5e7eb)" />
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis dataKey="region" type="category" tick={{ fontSize: 12 }} width={100} />
            <Tooltip
              formatter={(value) => [formatCurrency(Number(value)), 'Revenue']}
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid var(--color-border, #e5e7eb)',
                fontSize: '13px',
              }}
            />
            <Bar dataKey="revenue" fill="var(--color-primary, #6366f1)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
