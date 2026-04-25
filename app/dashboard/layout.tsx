import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import MobileHeader from '@/components/layout/MobileHeader'
import { Toaster } from '@/components/ui/sonner'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden">
      <MobileHeader />
      <Sidebar className="hidden md:flex w-64 shrink-0" />
      <main className="flex-1 overflow-y-auto overflow-x-hidden bg-background">
        <div className="max-w-7xl mx-auto p-6">
          {children}
        </div>
      </main>
      <Toaster />
    </div>
  )
}

