import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: string
  size?: 'sm' | 'md'
}

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  pending:          { bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-500' },
  confirmed:        { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  completed:        { bg: 'bg-green-50',   text: 'text-green-700',   dot: 'bg-green-500' },
  cancelled:        { bg: 'bg-red-50',     text: 'text-red-700',     dot: 'bg-red-500' },
  disputed:         { bg: 'bg-orange-50',  text: 'text-orange-700',  dot: 'bg-orange-500' },
  active:           { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  suspended:        { bg: 'bg-red-50',     text: 'text-red-700',     dot: 'bg-red-500' },
  paid:             { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  refunded:         { bg: 'bg-violet-50',  text: 'text-violet-700',  dot: 'bg-violet-500' },
  open:             { bg: 'bg-blue-50',    text: 'text-blue-700',    dot: 'bg-blue-500' },
  resolved:         { bg: 'bg-green-50',   text: 'text-green-700',   dot: 'bg-green-500' },
  under_review:     { bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-500' },
  awaiting_payment: { bg: 'bg-blue-50',    text: 'text-blue-700',    dot: 'bg-blue-500' },
  payment_pending:  { bg: 'bg-violet-50',  text: 'text-violet-700',  dot: 'bg-violet-500' },
}

const DEFAULT_COLOR = { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-500' }

function formatLabel(status: string): string {
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const key = status.toLowerCase().replace(/\s+/g, '_')
  const colors = STATUS_COLORS[key] ?? DEFAULT_COLOR

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        colors.bg,
        colors.text,
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
      )}
    >
      <span className={cn('shrink-0 rounded-full', colors.dot, size === 'sm' ? 'h-1.5 w-1.5' : 'h-2 w-2')} />
      {formatLabel(status)}
    </span>
  )
}
