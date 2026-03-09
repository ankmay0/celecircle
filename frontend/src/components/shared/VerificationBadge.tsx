import { BadgeCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VerificationBadgeProps {
  type: string | null | undefined
  className?: string
  size?: number
}

export function VerificationBadge({ type, className, size = 16 }: VerificationBadgeProps) {
  if (!type) return null

  const isOrganizer = type === 'organizer_verified'

  return (
    <BadgeCheck
      className={cn(
        'inline-block flex-shrink-0',
        isOrganizer ? 'text-emerald-500' : 'text-blue-500',
        className,
      )}
      size={size}
      aria-label={isOrganizer ? 'Verified Organizer' : 'Verified Celebrity'}
    />
  )
}
