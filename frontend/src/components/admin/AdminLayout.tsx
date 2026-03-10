import { Outlet, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { AdminSidebar } from './AdminSidebar'
import { AdminHeader } from './AdminHeader'

export function AdminLayout() {
  const user = useAuthStore((s) => s.user)
  if (!user || user.role !== 'admin') return <Navigate to="/feed" replace />

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <AdminHeader />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 overflow-auto p-6 lg:p-8" style={{ minHeight: 'calc(100vh - 56px)' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
