import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { RightPanel } from './RightPanel'
import { MobileNav } from './MobileNav'

export function AppLayout() {
  return (
    <div className="min-h-screen bg-bg-secondary">
      <Header />
      <div className="mx-auto flex max-w-[1280px] gap-6 px-4 py-4">
        <Sidebar />
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
        <RightPanel />
      </div>
      <MobileNav />
      <div className="h-16 lg:hidden" />
    </div>
  )
}
