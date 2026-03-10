import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from '@/components/shared/ProtectedRoute'
import { LandingPage } from '@/features/landing/LandingPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { RegisterPage } from '@/features/auth/RegisterPage'
import { FeedPage } from '@/features/feed/FeedPage'
import { ProfilePage } from '@/features/profile/ProfilePage'
import { ViewProfilePage } from '@/features/profile/ViewProfilePage'
import { SetupProfilePage } from '@/features/profile/SetupProfilePage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { BrowseGigsPage } from '@/features/gigs/BrowseGigsPage'
import { PostGigPage } from '@/features/gigs/PostGigPage'
import { GigDetailPage } from '@/features/gigs/GigDetailPage'
import { MessagingPage } from '@/features/messaging/MessagingPage'
import { NetworkPage } from '@/features/network/NetworkPage'
import { NotificationsPage } from '@/features/notifications/NotificationsPage'
import { SavedPage } from '@/features/saved/SavedPage'
import { VerificationPage } from '@/features/verification/VerificationPage'
import { CommunityPage } from '@/features/community/CommunityPage'
import { LeaderboardPage } from '@/features/gamification/LeaderboardPage'
import { ExclusiveContentPage } from '@/features/exclusive/ExclusiveContentPage'
import { PollsPage } from '@/features/polls/PollsPage'
import { StorePage } from '@/features/store/StorePage'
import { AnalyticsPage } from '@/features/analytics/AnalyticsPage'
import { EventsPage } from '@/features/events/EventsPage'
import { BookingsPage } from '@/features/bookings/BookingsPage'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { OverviewPage as AdminOverviewPage } from '@/features/admin/OverviewPage'
import { UsersPage as AdminUsersPage } from '@/features/admin/UsersPage'
import { VerificationManagementPage } from '@/features/admin/VerificationManagementPage'
import { BookingsAdminPage } from '@/features/admin/BookingsAdminPage'
import { PaymentsPage as AdminPaymentsPage } from '@/features/admin/PaymentsPage'
import { AnalyticsPage as AdminAnalyticsPage } from '@/features/admin/AnalyticsPage'
import { RevenuePage } from '@/features/admin/RevenuePage'
import { DisputesPage } from '@/features/admin/DisputesPage'
import { ModerationPage } from '@/features/admin/ModerationPage'
import { SupportPage } from '@/features/admin/SupportPage'
import { AnnouncementsPage } from '@/features/admin/AnnouncementsPage'
import { FeaturedPage } from '@/features/admin/FeaturedPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Setup profile (protected, no layout shell) */}
          <Route
            path="/setup-profile"
            element={
              <ProtectedRoute>
                <SetupProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Protected routes with app layout */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/feed" element={<FeedPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/:id" element={<ViewProfilePage />} />
            <Route path="/gigs" element={<BrowseGigsPage />} />
            <Route path="/gigs/new" element={<PostGigPage />} />
            <Route path="/gigs/:id" element={<GigDetailPage />} />
            <Route path="/chat" element={<MessagingPage />} />
            <Route path="/chat/:userId" element={<MessagingPage />} />
            <Route path="/network" element={<NetworkPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/saved" element={<SavedPage />} />
            <Route path="/get-verified" element={<VerificationPage />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/exclusive" element={<ExclusiveContentPage />} />
            <Route path="/polls" element={<PollsPage />} />
            <Route path="/store" element={<StorePage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/bookings" element={<BookingsPage />} />
          </Route>

          {/* Admin routes with dedicated admin layout */}
          <Route
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/admin" element={<AdminOverviewPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/verifications" element={<VerificationManagementPage />} />
            <Route path="/admin/bookings" element={<BookingsAdminPage />} />
            <Route path="/admin/payments" element={<AdminPaymentsPage />} />
            <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
            <Route path="/admin/revenue" element={<RevenuePage />} />
            <Route path="/admin/disputes" element={<DisputesPage />} />
            <Route path="/admin/moderation" element={<ModerationPage />} />
            <Route path="/admin/support" element={<SupportPage />} />
            <Route path="/admin/announcements" element={<AnnouncementsPage />} />
            <Route path="/admin/featured" element={<FeaturedPage />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
