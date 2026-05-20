import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { LayoutDashboard, CreditCard, Tag, Building2, Users } from 'lucide-react'

const NAV = [
  { href: '/admin/organizacoes', label: 'Organizações', icon: Building2 },
  { href: '/admin/usuarios', label: 'Usuários', icon: Users },
  { href: '/admin/planos', label: 'Planos', icon: CreditCard },
  { href: '/admin/cupons', label: 'Cupons', icon: Tag },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_superuser')
    .eq('id', user.id)
    .single()

  if (!profile?.is_superuser) redirect('/dashboard')

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-56 border-r border-border/60 bg-card flex flex-col shrink-0">
        <div className="px-5 py-5 border-b border-border/60">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-primary" />
            <span className="font-bold text-sm">Prumo Admin</span>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-border/60">
          <Link href="/dashboard" className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground">
            ← Voltar ao sistema
          </Link>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 p-8 overflow-auto">
        {children}
      </main>
    </div>
  )
}
