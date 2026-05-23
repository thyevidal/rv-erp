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
  Settings, User, Lock, Building2, Loader2, CheckCircle2,
  ShieldCheck, Download, Trash2, ExternalLink,
} from 'lucide-react'
import Link from 'next/link'

export default function ConfiguracoesPage() {
  const supabase = createClient()
  const [user, setUser] = useState<{ email?: string; id?: string } | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)

  // Senha
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmSenha, setConfirmSenha] = useState('')
  const [loadingSenha, setLoadingSenha] = useState(false)

  // LGPD
  const [loadingExport, setLoadingExport] = useState(false)
  const [loadingExclusao, setLoadingExclusao] = useState(false)
  const [exclusaoSolicitada, setExclusaoSolicitada] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user ?? null)
      setLoadingUser(false)
    })
  }, [])

  async function handleExportarDados() {
    setLoadingExport(true)
    try {
      const res = await fetch('/api/lgpd/export')
      if (!res.ok) { toast.error('Erro ao exportar dados.'); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `meus-dados-prumo-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Dados exportados com sucesso!')
    } finally {
      setLoadingExport(false)
    }
  }

  async function handleSolicitarExclusao() {
    if (!confirm('Tem certeza? Sua conta e todos os dados vinculados serão excluídos em até 15 dias úteis. Esta ação não pode ser desfeita.')) return
    setLoadingExclusao(true)
    try {
      const res = await fetch('/api/lgpd/solicitar-exclusao', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Erro ao processar solicitação.'); return }
      setExclusaoSolicitada(true)
      toast.success(data.mensagem)
    } finally {
      setLoadingExclusao(false)
    }
  }

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
    <div className="space-y-8 w-full max-w-2xl">
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

      {/* Meus Dados — LGPD */}
      <Card className="border-border/60">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            Meus Dados (LGPD)
          </CardTitle>
          <CardDescription>
            Seus direitos conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Dados armazenados */}
          <div className="text-sm space-y-2">
            <p className="font-medium">Dados que armazenamos sobre você:</p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground text-xs">
              <li>Dados de conta: nome, e-mail e hash de senha.</li>
              <li>Organização vinculada e nível de acesso.</li>
              <li>Obras criadas por você e registros de estoque.</li>
              <li>Data e hora de aceite da Política de Privacidade.</li>
              <li>Logs de acesso para fins de segurança.</li>
            </ul>
            <Link
              href="/politica-de-privacidade"
              target="_blank"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
            >
              <ExternalLink className="w-3 h-3" />
              Ver Política de Privacidade completa
            </Link>
          </div>

          <Separator />

          {/* Exportar dados */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Exportar meus dados</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Baixe um arquivo JSON com todos os seus dados armazenados no sistema (portabilidade — Art. 18, V).
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 shrink-0"
              onClick={handleExportarDados}
              disabled={loadingExport}
            >
              {loadingExport ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              Exportar
            </Button>
          </div>

          <Separator />

          {/* Solicitar exclusão */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-destructive">Solicitar exclusão da conta</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Solicite a exclusão de todos os seus dados. O prazo de atendimento é de até <strong>15 dias úteis</strong> (Art. 18, VI).
              </p>
              {exclusaoSolicitada && (
                <p className="text-xs text-green-600 mt-1 font-medium">
                  ✓ Solicitação enviada. Você será contactado em até 15 dias úteis.
                </p>
              )}
            </div>
            <Button
              size="sm"
              variant="destructive"
              className="gap-1.5 shrink-0"
              onClick={handleSolicitarExclusao}
              disabled={loadingExclusao || exclusaoSolicitada}
            >
              {loadingExclusao ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              {exclusaoSolicitada ? 'Solicitado' : 'Solicitar Exclusão'}
            </Button>
          </div>
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
            { label: 'Sistema', value: 'GREV — O DONO DA OBRA' },
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
