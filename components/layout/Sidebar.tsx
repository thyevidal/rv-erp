'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, HardHat, Package, Settings, LogOut, ChevronRight,
  Building2, Trash2, Users, PanelLeftClose, PanelLeftOpen, Calendar,
  DollarSign, Box, Lock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useEffect, useState } from 'react'
import type { Profile } from '@/types'
import { usePlan } from '@/hooks/usePlan'

const COLLAPSED_KEY = 'sidebar-collapsed'

const mainNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true, proOnly: false },
  { href: '/dashboard/obras', label: 'Obras', icon: HardHat, exact: false, proOnly: false },
  { href: '/dashboard/agenda', label: 'Agenda', icon: Calendar, exact: false, proOnly: true },
  { href: '/dashboard/financeiro', label: 'Financeiro', icon: DollarSign, exact: false, proOnly: true },
  { href: '/dashboard/estoque', label: 'Estoque', icon: Box, exact: false, proOnly: true },
  { href: '/dashboard/insumos', label: 'Banco de Insumos', icon: Package, exact: false, proOnly: true },
  { href: '/dashboard/configuracoes', label: 'Configurações', icon: Settings, exact: false, proOnly: false },
]

export default function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [collapsed, setCollapsed] = useState(false)
  const planStatus = usePlan()

  useEffect(() => {
    const saved = localStorage.getItem(COLLAPSED_KEY)
    if (saved === 'true') setCollapsed(true)
  }, [])

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem(COLLAPSED_KEY, String(next))
      return next
    })
  }

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        setProfile(data as Profile)
      }
    }
    loadProfile()
  }, [supabase])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  const isObrasSection =
    pathname.startsWith('/dashboard/obras') || pathname === '/dashboard/lixeira'

  const allItems = [
    ...mainNavItems,
    ...(profile?.role === 'admin'
      ? [{ href: '/dashboard/configuracoes/membros', label: 'Membros', icon: Users, exact: false, proOnly: false }]
      : []),
  ]

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'relative flex flex-col min-h-screen bg-sidebar border-r border-sidebar-border transition-all duration-200',
          collapsed ? 'w-[60px]' : 'w-64',
          className,
        )}
      >
        {/* Logo + collapse */}
        <div
          className={cn(
            'flex items-center border-b border-sidebar-border shrink-0',
            collapsed ? 'justify-center px-0 py-4 flex-col gap-2' : 'px-4 py-4 justify-between gap-2',
          )}
        >
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary shadow-md shadow-primary/30 shrink-0">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-sidebar-foreground leading-tight truncate">Grev</p>
              <p className="text-xs text-sidebar-foreground/40 leading-tight">o dono da obra</p>
            </div>
          )}
          <button
            onClick={toggleCollapsed}
            className="text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors shrink-0"
            title={collapsed ? 'Expandir menu' : 'Minimizar menu'}
          >
            {collapsed
              ? <PanelLeftOpen className="w-4 h-4" />
              : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className={cn('flex-1 py-4 space-y-0.5', collapsed ? 'px-1.5' : 'px-3')}>
          {!collapsed && (
            <p className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/30 px-3 pb-2">
              Menu Principal
            </p>
          )}

          {allItems.map((item) => {
            const active = isActive(item.href, item.exact)
            const Icon = item.icon
            const isObras = item.href === '/dashboard/obras'
            const locked = item.proOnly && planStatus.isFree && !planStatus.loading

            return (
              <div key={item.href}>
                <NavItem
                  href={item.href}
                  label={item.label}
                  icon={Icon}
                  active={active || (isObras && isObrasSection)}
                  collapsed={collapsed}
                  locked={locked}
                />

                {/* Sub-item Lixeira sob Obras */}
                {isObras && isObrasSection && !collapsed && (
                  <div className="ml-4 mt-0.5 space-y-0.5 border-l border-sidebar-border/60 pl-3">
                    <Link href="/dashboard/lixeira">
                      <div
                        className={cn(
                          'flex items-center gap-2.5 px-2 py-2 rounded-lg text-xs font-medium transition-all',
                          pathname === '/dashboard/lixeira'
                            ? 'bg-primary/10 text-primary'
                            : 'text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent',
                        )}
                      >
                        <Trash2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Lixeira</span>
                      </div>
                    </Link>
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Footer logout */}
        <div className={cn('py-3 border-t border-sidebar-border', collapsed ? 'px-1.5' : 'px-3')}>
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center p-2.5 rounded-lg text-sidebar-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Sair do sistema</TooltipContent>
            </Tooltip>
          ) : (
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-sidebar-foreground/50 hover:text-destructive hover:bg-destructive/10 text-sm"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              Sair do sistema
            </Button>
          )}
        </div>
      </aside>
    </TooltipProvider>
  )
}

function NavItem({
  href,
  label,
  icon: Icon,
  active,
  collapsed,
  locked,
}: {
  href: string
  label: string
  icon: React.ElementType
  active: boolean
  collapsed: boolean
  locked?: boolean
}) {
  const content = (
    <Link href={href}>
      <div
        className={cn(
          'flex items-center gap-3 rounded-lg text-sm font-medium transition-all',
          collapsed ? 'justify-center p-2.5' : 'px-3 py-2.5',
          active
            ? 'bg-primary text-primary-foreground shadow-sm'
            : locked
              ? 'text-sidebar-foreground/40 hover:bg-sidebar-accent'
              : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent',
        )}
      >
        <Icon className="w-4 h-4 shrink-0" />
        {!collapsed && (
          <>
            <span className="flex-1">{label}</span>
            {locked
              ? <Lock className="w-3 h-3 opacity-50" />
              : active && <ChevronRight className="w-3 h-3 opacity-60" />}
          </>
        )}
      </div>
    </Link>
  )

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right">
          {locked ? `${label} — Disponível no plano Pro` : label}
        </TooltipContent>
      </Tooltip>
    )
  }

  return content
}
