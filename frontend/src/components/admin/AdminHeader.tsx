import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { assetUrl, getInitials } from '@/lib/utils'

export function AdminHeader() {
  const user = useAuthStore((s) => s.user)

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <Link to="/admin" className="flex items-center gap-2">
          <img
            src="/celecircle-logo.png"
            alt="CeleCircle"
            className="h-7 w-7 rounded-md object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none'
            }}
          />
          <span className="text-lg font-bold text-text-primary">CeleCircle</span>
        </Link>
        <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
          Admin
        </span>
      </div>

      <div className="flex items-center gap-4">
        <Link
          to="/feed"
          className="flex items-center gap-1.5 text-sm text-text-secondary transition-colors hover:text-text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Platform
        </Link>

        {user && (
          <div className="flex items-center gap-2">
            {user.profile_photo_url ? (
              <img
                src={assetUrl(user.profile_photo_url)}
                alt=""
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
                {getInitials(user.first_name ?? undefined, user.last_name ?? undefined)}
              </div>
            )}
            <span className="hidden text-sm font-medium text-text-primary sm:block">
              {user.first_name ?? user.email}
            </span>
          </div>
        )}
      </div>
    </header>
  )
}
