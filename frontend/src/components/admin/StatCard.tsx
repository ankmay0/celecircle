import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ElementType
  trend?: string
  trendUp?: boolean
  className?: string
}

export function StatCard({ title, value, icon: Icon, trend, trendUp, className }: StatCardProps) {
  return (
    <div className={cn('rounded-xl border border-border bg-card p-5', className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium text-text-muted">{title}</p>
          <p className="text-2xl font-bold text-text-primary">{value}</p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1 text-xs font-medium">
          {trendUp !== undefined && (
            trendUp
              ? <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              : <TrendingDown className="h-3.5 w-3.5 text-red-500" />
          )}
          <span className={cn(trendUp ? 'text-emerald-600' : 'text-red-500')}>
            {trend}
          </span>
        </div>
      )}
    </div>
  )
}
