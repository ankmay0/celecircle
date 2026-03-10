import { useState, useRef, useEffect, useCallback } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Home,
  Users,
  Briefcase,
  MessageSquare,
  Bell,
  Search,
  ChevronDown,
  LogOut,
  User,
  LayoutDashboard,
  BadgeCheck,
  ShieldCheck,
  X,
  Loader2,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { usersApi } from '@/api/users'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { VerificationBadge } from '@/components/shared/VerificationBadge'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { cn } from '@/lib/utils'
import type { SearchResult } from '@/types'

const navItems = [
  { to: '/feed', icon: Home, label: 'Home' },
  { to: '/network', icon: Users, label: 'My Network' },
  { to: '/gigs', icon: Briefcase, label: 'Gigs' },
  { to: '/chat', icon: MessageSquare, label: 'Messaging' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
]

function SearchDropdown({
  results,
  loading,
  query,
  onSelect,
}: {
  results: SearchResult[]
  loading: boolean
  query: string
  onSelect: (r: SearchResult) => void
}) {
  if (!query || query.trim().length < 2) return null

  return (
    <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-border bg-card shadow-xl max-h-80 overflow-y-auto z-50">
      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : results.length === 0 ? (
        <div className="px-4 py-6 text-center">
          <Search className="h-8 w-8 text-text-muted mx-auto mb-2" />
          <p className="text-sm text-text-secondary">No results for "{query}"</p>
        </div>
      ) : (
        results.map((r) => (
          <button
            key={r.id}
            onClick={() => onSelect(r)}
            className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-bg-secondary transition-colors"
          >
            <UserAvatar
              src={r.profile_photo_url}
              firstName={r.name}
              lastName=""
              size="sm"
              verificationType={r.verification_type}
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium text-text-primary truncate">{r.name}</p>
                <VerificationBadge type={r.verification_type} size={13} />
              </div>
              <p className="text-xs text-text-secondary truncate">{r.category || r.email}</p>
            </div>
          </button>
        ))
      )}
    </div>
  )
}

export function Header() {
  const { user, logout } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [showSearch, setShowSearch] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showMobileSearch, setShowMobileSearch] = useState(false)

  const searchRef = useRef<HTMLDivElement>(null)
  const mobileSearchRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>(undefined)

  const performSearch = useCallback((query: string) => {
    setSearchQuery(query)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    if (query.trim().length < 2) {
      setSearchResults([])
      setShowSearch(false)
      setSearchLoading(false)
      return
    }
    setSearchLoading(true)
    setShowSearch(true)
    searchTimeout.current = setTimeout(async () => {
      try {
        const { data } = await usersApi.searchUsers(query)
        setSearchResults(data)
      } catch {
        setSearchResults([])
      } finally {
        setSearchLoading(false)
      }
    }, 300)
  }, [])

  const handleSelectResult = useCallback(
    (r: SearchResult) => {
      navigate(`/profile/${r.id}`)
      setShowSearch(false)
      setSearchQuery('')
      setSearchResults([])
      setShowMobileSearch(false)
    },
    [navigate],
  )

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSearch(false)
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(e.target as Node)) {
        /* keep mobile search open, user has to click X */
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[1280px] items-center gap-2 px-4">
        <Link to="/feed" className="flex items-center gap-2 flex-shrink-0">
          <img src="/celecircle-logo.png" alt="CeleCircle" style={{ height: '55px' }} className="w-auto" />
        </Link>

        {/* Desktop search */}
        <div ref={searchRef} className="relative hidden md:block flex-1 max-w-[280px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => performSearch(e.target.value)}
            onFocus={() => {
              if (searchQuery.trim().length >= 2) setShowSearch(true)
            }}
            className="h-9 w-full rounded-lg bg-bg-secondary pl-9 pr-4 text-sm text-text-primary placeholder:text-text-muted outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
          {showSearch && (
            <SearchDropdown
              results={searchResults}
              loading={searchLoading}
              query={searchQuery}
              onSelect={handleSelectResult}
            />
          )}
        </div>

        <nav className="hidden lg:flex items-center gap-1 ml-auto">
          {navItems.map(({ to, icon: Icon, label }) => {
            const active = location.pathname === to || location.pathname.startsWith(to + '/')
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-4 py-1.5 text-xs font-medium transition-colors relative',
                  active ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary',
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="hidden xl:block">{label}</span>
                {active && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-text-primary" />
                )}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-2 ml-auto lg:ml-3">
          <ThemeToggle className="hidden md:flex" />

          <div ref={profileRef} className="relative">
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-1.5 rounded-full py-1 pl-1 pr-2 hover:bg-bg-secondary transition-colors"
            >
              <UserAvatar
                src={user?.profile_photo_url}
                firstName={user?.first_name}
                lastName={user?.last_name}
                size="sm"
                verificationType={user?.verification_type}
              />
              <ChevronDown className="h-3.5 w-3.5 text-text-secondary" />
            </button>

            {showProfile && (
              <div className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-border bg-card shadow-xl overflow-hidden z-50">
                <div className="p-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      src={user?.profile_photo_url}
                      firstName={user?.first_name}
                      lastName={user?.last_name}
                      size="lg"
                      verificationType={user?.verification_type}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="font-semibold text-text-primary truncate">
                          {user?.first_name} {user?.last_name}
                        </p>
                        <VerificationBadge type={user?.verification_type} size={14} />
                      </div>
                      <p className="text-xs text-text-secondary capitalize">{user?.role}</p>
                    </div>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setShowProfile(false)}
                    className="mt-3 block w-full rounded-full border border-primary py-1.5 text-center text-xs font-semibold text-primary hover:bg-primary-light transition-colors"
                  >
                    View Profile
                  </Link>
                </div>

                <div className="p-2">
                  <Link
                    to="/dashboard"
                    onClick={() => setShowProfile(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-text-secondary hover:bg-bg-secondary transition-colors"
                  >
                    <LayoutDashboard className="h-4 w-4" /> Dashboard
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => setShowProfile(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-text-secondary hover:bg-bg-secondary transition-colors"
                  >
                    <User className="h-4 w-4" /> Profile
                  </Link>
                  <Link
                    to="/get-verified"
                    onClick={() => setShowProfile(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                  >
                    <BadgeCheck className="h-4 w-4" /> Get Verified
                  </Link>
                  {user?.role === 'admin' && (
                    <Link
                      to="/admin/verification"
                      onClick={() => setShowProfile(false)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
                    >
                      <ShieldCheck className="h-4 w-4" /> Verification Requests
                    </Link>
                  )}
                </div>

                <div className="border-t border-border p-2">
                  <ThemeToggle className="mb-2 w-full md:hidden" />
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-danger hover:bg-bg-secondary transition-colors"
                  >
                    <LogOut className="h-4 w-4" /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile search toggle */}
          <button
            className="md:hidden flex items-center justify-center h-9 w-9 rounded-lg hover:bg-bg-secondary text-text-secondary"
            onClick={() => setShowMobileSearch(!showMobileSearch)}
          >
            {showMobileSearch ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile search bar */}
      {showMobileSearch && (
        <div ref={mobileSearchRef} className="md:hidden border-t border-border px-4 py-2 relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search people..."
              value={searchQuery}
              onChange={(e) => performSearch(e.target.value)}
              autoFocus
              className="h-9 w-full rounded-lg bg-bg-secondary pl-9 pr-9 text-sm text-text-primary placeholder:text-text-muted outline-none focus:ring-2 focus:ring-primary/30"
            />
            {searchQuery && (
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                onClick={() => {
                  setSearchQuery('')
                  setSearchResults([])
                }}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {searchQuery.trim().length >= 2 && (
            <SearchDropdown
              results={searchResults}
              loading={searchLoading}
              query={searchQuery}
              onSelect={handleSelectResult}
            />
          )}
        </div>
      )}
    </header>
  )
}
