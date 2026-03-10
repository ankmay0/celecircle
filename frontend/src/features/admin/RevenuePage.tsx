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
import { IndianRupee, TrendingUp, TrendingDown, Download, Loader2, Building2, Tag } from 'lucide-react'
import { adminApi } from '@/api/admin'
import { formatCurrency } from '@/lib/utils'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { StatCard } from '@/components/admin/StatCard'

interface FinanceData {
  total_platform_revenue: number
  monthly_revenue: number
  platform_fee_collected: number
  addon_margins_collected: number
  pending_payouts: number
  completed_payouts: number
  refunds_issued: number
  net_earnings: number
  monthly_trend: { month: string; label: string; revenue: number }[]
  revenue_by_city: { city: string; revenue: number }[]
  revenue_by_category: { category: string; revenue: number }[]
}

interface PayoutSummary {
  pending_count: number
  pending_total: number
  paid_count: number
  paid_total: number
  platform_margin: number
}

function downloadCsv(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  window.URL.revokeObjectURL(url)
}

export function RevenuePage() {
  const [finance, setFinance] = useState<FinanceData | null>(null)
  const [payout, setPayout] = useState<PayoutSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [finRes, payRes] = await Promise.all([
          adminApi.getFinance(),
          adminApi.getPayoutSummary(),
        ])
        setFinance(finRes.data)
        setPayout(payRes.data)
      } catch {
        /* silent */
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleExportRevenue = async () => {
    try {
      const res = await adminApi.exportRevenueCsv()
      downloadCsv(new Blob([res.data]), 'revenue_export.csv')
    } catch {
      /* silent */
    }
  }

  const handleExportBookings = async () => {
    try {
      const res = await adminApi.exportBookingsCsv()
      downloadCsv(new Blob([res.data]), 'bookings_export.csv')
    } catch {
      /* silent */
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!finance) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-text-secondary">
        <p>Failed to load revenue data.</p>
      </div>
    )
  }

  const cityData = (finance.revenue_by_city || []).slice(0, 10)

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Revenue">
        <button
          onClick={handleExportRevenue}
          className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-text-secondary hover:bg-bg-secondary transition-colors"
        >
          <Download className="h-4 w-4" />
          Export Revenue CSV
        </button>
        <button
          onClick={handleExportBookings}
          className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-text-secondary hover:bg-bg-secondary transition-colors"
        >
          <Download className="h-4 w-4" />
          Export Bookings CSV
        </button>
      </AdminPageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Total Platform Revenue"
          value={formatCurrency(finance.total_platform_revenue)}
          icon={IndianRupee}
        />
        <StatCard
          title="Monthly Revenue"
          value={formatCurrency(finance.monthly_revenue)}
          icon={TrendingUp}
        />
        <StatCard
          title="Net Earnings"
          value={formatCurrency(finance.net_earnings)}
          icon={TrendingUp}
        />
        <StatCard
          title="Refunds Issued"
          value={formatCurrency(finance.refunds_issued)}
          icon={TrendingDown}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Platform Fees"
          value={formatCurrency(finance.platform_fee_collected)}
          icon={Building2}
        />
        <StatCard
          title="Add-on Margins"
          value={formatCurrency(finance.addon_margins_collected)}
          icon={Tag}
        />
        <StatCard
          title="Pending Payouts"
          value={formatCurrency(finance.pending_payouts)}
          icon={IndianRupee}
        />
      </div>

      {/* Monthly Trend */}
      <div className="card p-6">
        <h2 className="mb-4 text-sm font-semibold text-text-primary">Monthly Revenue Trend</h2>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={finance.monthly_trend}>
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

      {/* Revenue by City & Category */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="mb-4 text-sm font-semibold text-text-primary">Revenue by City (Top 10)</h2>
          <ResponsiveContainer width="100%" height={Math.max(250, cityData.length * 40)}>
            <BarChart data={cityData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #e5e7eb)" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey="city" type="category" tick={{ fontSize: 12 }} width={100} />
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

        <div className="card p-6">
          <h2 className="mb-4 text-sm font-semibold text-text-primary">Revenue by Category</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={finance.revenue_by_category}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #e5e7eb)" />
              <XAxis dataKey="category" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value) => [formatCurrency(Number(value)), 'Revenue']}
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
      </div>

      {/* Payout Summary */}
      {payout && (
        <div>
          <h2 className="mb-4 text-sm font-semibold text-text-primary">Payout Summary</h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="card p-5">
              <p className="text-xs font-medium text-text-muted">Pending Payouts</p>
              <p className="mt-2 text-2xl font-bold text-text-primary">{payout.pending_count}</p>
              <p className="mt-1 text-sm text-text-secondary">{formatCurrency(payout.pending_total)}</p>
            </div>
            <div className="card p-5">
              <p className="text-xs font-medium text-text-muted">Completed Payouts</p>
              <p className="mt-2 text-2xl font-bold text-text-primary">{payout.paid_count}</p>
              <p className="mt-1 text-sm text-text-secondary">{formatCurrency(payout.paid_total)}</p>
            </div>
            <div className="card p-5">
              <p className="text-xs font-medium text-text-muted">Platform Margin</p>
              <p className="mt-2 text-2xl font-bold text-text-primary">{formatCurrency(payout.platform_margin)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
