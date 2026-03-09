import { BadgeCheck } from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'

interface UserAvatarProps {
  src?: string | null
  firstName?: string | null
  lastName?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  verificationType?: string | null
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
  xl: 'h-20 w-20 text-2xl',
}

const badgeSizes = {
  sm: { size: 12, className: '-bottom-0.5 -right-0.5 ring-1' },
  md: { size: 14, className: '-bottom-0.5 -right-0.5 ring-[1.5px]' },
  lg: { size: 16, className: '-bottom-0.5 -right-0.5 ring-2' },
  xl: { size: 20, className: '-bottom-0 -right-0 ring-2' },
}

export function UserAvatar({ src, firstName, lastName, size = 'md', className, verificationType }: UserAvatarProps) {
  const initials = getInitials(firstName ?? undefined, lastName ?? undefined)

  const badgeOverlay = verificationType ? (
    <span
      className={cn(
        'absolute rounded-full bg-card flex items-center justify-center ring-card',
        badgeSizes[size].className,
      )}
    >
      <BadgeCheck
        size={badgeSizes[size].size}
        className={cn(
          verificationType === 'organizer_verified' ? 'text-emerald-500' : 'text-blue-500',
        )}
      />
    </span>
  ) : null

  if (src) {
    return (
      <div className={cn('relative flex-shrink-0', sizeClasses[size])}>
        <img
          src={src}
          alt={`${firstName || ''} ${lastName || ''}`}
          className={cn('rounded-full object-cover w-full h-full', className)}
        />
        {badgeOverlay}
      </div>
    )
  }

  return (
    <div className={cn('relative flex-shrink-0', sizeClasses[size])}>
      <div
        className={cn(
          'rounded-full w-full h-full flex items-center justify-center bg-primary/10 text-primary font-semibold',
          className,
        )}
      >
        {initials}
      </div>
      {badgeOverlay}
    </div>
  )
}
