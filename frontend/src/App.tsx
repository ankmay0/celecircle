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
import { VerificationManagementPage } from '@/features/admin/VerificationManagementPage'
import { BookingsPage } from '@/features/bookings/BookingsPage'

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
            <Route path="/admin/verification" element={<VerificationManagementPage />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
