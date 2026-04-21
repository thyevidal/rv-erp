'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Settings, User, Lock, Building2, Info, Loader2, CheckCircle2
} from 'lucide-react'

export default function ConfiguracoesPage() {
  const supabase = createClient()
  const [user, setUser] = useState<{ email?: string; id?: string } | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)

  // Senha
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmSenha, setConfirmSenha] = useState('')
  const [loadingSenha, setLoadingSenha] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user ?? null)
      setLoadingUser(false)
    })
  }, [])

  async function handleAlterarSenha(e: React.FormEvent) {
    e.preventDefault()
    if (novaSenha.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres.')
      return
    }
    if (novaSenha !== confirmSenha) {
      toast.error('As senhas não coincidem.')
      return
    }
    setLoadingSenha(true)
    const { error } = await supabase.auth.updateUser({ password: novaSenha })
    setLoadingSenha(false)
    if (error) {
      toast.error('Erro ao alterar senha: ' + error.message)
      return
    }
    toast.success('Senha alterada com sucesso!')
    setNovaSenha('')
    setConfirmSenha('')
  }

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary" />
          Configurações
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gerencie seu perfil e preferências do sistema.
        </p>
      </div>

      {/* Perfil */}
      <Card className="border-border/60">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            Perfil do Usuário
          </CardTitle>
          <CardDescription>Informações da sua conta no sistema.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingUser ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/40">
                <div>
                  <p className="text-xs text-muted-foreground">E-mail</p>
                  <p className="font-medium text-sm mt-0.5">{user?.email ?? '—'}</p>
                </div>
                <Badge variant="secondary" className="text-xs gap-1">
                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                  Verificado
                </Badge>
              </div>
              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/40">
                <div>
                  <p className="text-xs text-muted-foreground">ID do Usuário</p>
                  <p className="font-mono text-xs mt-0.5 text-muted-foreground">{user?.id ?? '—'}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alterar Senha */}
      <Card className="border-border/60">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" />
            Alterar Senha
          </CardTitle>
          <CardDescription>
            Escolha uma senha forte com pelo menos 6 caracteres.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAlterarSenha} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="nova-senha">Nova Senha</Label>
              <Input
                id="nova-senha"
                type="password"
                placeholder="••••••••"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-senha">Confirmar Nova Senha</Label>
              <Input
                id="confirm-senha"
                type="password"
                placeholder="••••••••"
                value={confirmSenha}
                onChange={(e) => setConfirmSenha(e.target.value)}
                required
              />
              {confirmSenha && novaSenha !== confirmSenha && (
                <p className="text-xs text-destructive mt-1">As senhas não coincidem.</p>
              )}
            </div>
            <Button type="submit" disabled={loadingSenha} className="gap-2">
              {loadingSenha
                ? <><Loader2 className="w-4 h-4 animate-spin" />Salvando...</>
                : 'Salvar Nova Senha'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Sobre o Sistema */}
      <Card className="border-border/60">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" />
            Sobre o Sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: 'Sistema', value: 'ERP Rezende & Vidal' },
            { label: 'Versão', value: 'v1.0.0 MVP' },
            { label: 'Stack', value: 'Next.js 16 · Supabase · Tailwind CSS · Shadcn/UI' },
            { label: 'Módulos ativos', value: 'Obras · Orçamento · Curva ABC · Cronograma · Mapa de Coleta · Estoque' },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-start justify-between py-2 text-sm border-b last:border-0">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-medium text-right max-w-xs">{value}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
