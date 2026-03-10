import { Link } from 'react-router-dom'
import { Globe } from 'lucide-react'

const footerColumns = [
  {
    title: 'General',
    links: [
      { label: 'Sign Up', to: '/register' },
      { label: 'Help Center', to: '/help' },
      { label: 'About', to: '/about' },
      { label: 'Press', to: '/press' },
      { label: 'Blog', to: '/blog' },
      { label: 'Careers', to: '/careers' },
      { label: 'Developers', to: '/developers' },
    ],
  },
  {
    title: 'Explore CeleCircle',
    links: [
      { label: 'Discover Artists', to: '/network' },
      { label: 'Trending Celebrities', to: '/network' },
      { label: 'Events', to: '/events' },
      { label: 'Gigs', to: '/gigs' },
      { label: 'Marketplace', to: '/store' },
      { label: 'Top Creators', to: '/leaderboard' },
      { label: 'Top Organizers', to: '/leaderboard' },
      { label: 'Top Performers', to: '/leaderboard' },
    ],
  },
  {
    title: 'Business Solutions',
    links: [
      { label: 'Book Talent', to: '/bookings' },
      { label: 'Event Promotion', to: '/events' },
      { label: 'Brand Collaborations', to: '/gigs' },
      { label: 'Marketing Solutions', to: '/gigs' },
      { label: 'Talent Management', to: '/network' },
    ],
  },
  {
    title: 'Directories',
    links: [
      { label: 'Artists', to: '/network' },
      { label: 'Celebrities', to: '/network' },
      { label: 'Event Organizers', to: '/network' },
      { label: 'Event Managers', to: '/network' },
      { label: 'Agencies', to: '/network' },
      { label: 'Companies', to: '/network' },
      { label: 'Events', to: '/events' },
      { label: 'Posts', to: '/feed' },
      { label: 'People Search', to: '/network' },
    ],
  },
]

const bottomLinks = [
  { label: 'About', to: '/about' },
  { label: 'Accessibility', to: '/accessibility' },
  { label: 'User Agreement', to: '/terms' },
  { label: 'Privacy Policy', to: '/privacy' },
  { label: 'Cookie Policy', to: '/cookies' },
  { label: 'Copyright Policy', to: '/copyright' },
  { label: 'Brand Policy', to: '/brand' },
  { label: 'Guest Controls', to: '/guest-controls' },
  { label: 'Community Guidelines', to: '/guidelines' },
]

export function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
      {/* Main footer columns */}
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
          {/* Column 1: Logo */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-1 mb-4 lg:mb-0">
            <Link to="/" className="inline-block">
              <img
                src="/celecircle-logo.png"
                alt="CeleCircle"
                style={{ height: '80px' }}
                className="w-auto"
              />
            </Link>
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-xs">
              Connect with top artists, celebrities, and event organizers on one powerful platform.
            </p>
          </div>

          {/* Columns 2-5: Link groups */}
          {footerColumns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                {col.title}
              </h3>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-200 dark:border-gray-800">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              CeleCircle &copy; {new Date().getFullYear()}
            </span>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
              {bottomLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.to}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <button className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                <Globe className="h-3 w-3" />
                English
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
