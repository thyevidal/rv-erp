import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { LayoutDashboard, Building2, Users, CreditCard, Tag, FileText, ClipboardList } from 'lucide-react'

const NAV_GROUPS = [
  {
    label: 'GERAL',
    items: [{ href: '/admin', label: 'Visão Geral', icon: LayoutDashboard }],
  },
  {
    label: 'GESTÃO',
    items: [
      { href: '/admin/organizacoes', label: 'Organizações', icon: Building2 },
      { href: '/admin/usuarios', label: 'Usuários', icon: Users },
    ],
  },
  {
    label: 'COMERCIAL',
    items: [
      { href: '/admin/planos', label: 'Planos', icon: CreditCard },
      { href: '/admin/cupons', label: 'Cupons', icon: Tag },
    ],
  },
  {
    label: 'CONTEÚDO',
    items: [{ href: '/admin/documentos', label: 'Documentos', icon: FileText }],
  },
  {
    label: 'REGISTROS',
    items: [{ href: '/admin/auditoria', label: 'Auditoria', icon: ClipboardList }],
  },
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
            <span className="font-bold text-sm">Grev Admin</span>
            <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary text-primary-foreground">ADMIN</span>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
          {NAV_GROUPS.map(({ label, items }) => (
            <div key={label}>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 px-3 pb-1.5">{label}</p>
              <div className="space-y-0.5">
                {items.map(({ href, label: itemLabel, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <Icon className="w-4 h-4" />
                    {itemLabel}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="p-3 border-t border-border/60">
          <Link href="/dashboard" className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground">
            ← Voltar ao app
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
