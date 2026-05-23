'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { HardHat, Loader2, CheckCircle, XCircle } from 'lucide-react'

type CouponStatus = { valid: boolean; desconto: number; message: string } | null

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [orgName, setOrgName] = useState('')
  const [cupom, setCupom] = useState('')
  const [couponStatus, setCouponStatus] = useState<CouponStatus>(null)
  const [checkingCoupon, setCheckingCoupon] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  async function handleCheckCoupon() {
    if (!cupom.trim()) return
    setCheckingCoupon(true)
    setCouponStatus(null)
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('codigo, ativo, valido_ate, max_usos, usos, desconto_pct')
        .eq('codigo', cupom.trim().toUpperCase())
        .single()

      if (error || !data) {
        setCouponStatus({ valid: false, desconto: 0, message: 'Cupom não encontrado.' })
        return
      }
      if (!data.ativo) {
        setCouponStatus({ valid: false, desconto: 0, message: 'Cupom inativo.' })
        return
      }
      if (data.valido_ate && new Date(data.valido_ate) < new Date()) {
        setCouponStatus({ valid: false, desconto: 0, message: 'Cupom expirado.' })
        return
      }
      if (data.max_usos && data.usos >= data.max_usos) {
        setCouponStatus({ valid: false, desconto: 0, message: 'Cupom esgotado.' })
        return
      }
      setCouponStatus({ valid: true, desconto: data.desconto_pct ?? 0, message: `Cupom válido! ${data.desconto_pct ?? 0}% de desconto` })
    } finally {
      setCheckingCoupon(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setLoading(true)

    try {
      // 1. Sign up
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password: senha,
      })
      if (signUpError) { setErro(signUpError.message); return }
      const userId = authData.user?.id
      if (!userId) { setErro('Erro ao criar usuário.'); return }

      // 2. Criar org + perfil + subscription via API (service role bypassa RLS)
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, nome, orgName }),
      })
      const json = await res.json()
      if (!res.ok) { setErro(json.error ?? 'Erro ao criar organização.'); return }

      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      setErro(err.message ?? 'Erro desconhecido.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-sidebar relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_oklch(0.65_0.19_42/0.15),_transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_oklch(0.55_0.15_200/0.1),_transparent_60%)]" />
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-orange-400 to-primary" />

      <div className="relative z-10 w-full max-w-sm px-4">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary shadow-lg shadow-primary/30 mb-4">
            <HardHat className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-sidebar-foreground tracking-tight">Grev</h1>
          <p className="text-sm text-sidebar-foreground/50 mt-1">o dono da obra</p>
        </div>

        <Card className="border-sidebar-border bg-sidebar-accent/30 backdrop-blur-sm shadow-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-sidebar-foreground text-lg">Criar sua conta</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome" className="text-sidebar-foreground/80">Nome completo</Label>
                <Input
                  id="nome"
                  type="text"
                  placeholder="Seu nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                  className="bg-sidebar-accent border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sidebar-foreground/80">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-sidebar-accent border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="senha" className="text-sidebar-foreground/80">Senha</Label>
                <Input
                  id="senha"
                  type="password"
                  placeholder="••••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                  minLength={6}
                  className="bg-sidebar-accent border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="orgName" className="text-sidebar-foreground/80">Nome da empresa / organização</Label>
                <Input
                  id="orgName"
                  type="text"
                  placeholder="Ex.: Construtora Silva"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  required
                  className="bg-sidebar-accent border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/30"
                />
              </div>

              {/* Coupon */}
              <div className="space-y-2">
                <Label htmlFor="cupom" className="text-sidebar-foreground/80">Código de desconto (opcional)</Label>
                <div className="flex gap-2">
                  <Input
                    id="cupom"
                    type="text"
                    placeholder="CUPOM123"
                    value={cupom}
                    onChange={(e) => { setCupom(e.target.value); setCouponStatus(null) }}
                    className="bg-sidebar-accent border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/30 uppercase"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={checkingCoupon || !cupom.trim()}
                    onClick={handleCheckCoupon}
                    className="shrink-0"
                  >
                    {checkingCoupon ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Aplicar'}
                  </Button>
                </div>
                {couponStatus && (
                  <p className={`flex items-center gap-1.5 text-xs ${couponStatus.valid ? 'text-green-600' : 'text-destructive'}`}>
                    {couponStatus.valid
                      ? <CheckCircle className="w-3.5 h-3.5" />
                      : <XCircle className="w-3.5 h-3.5" />}
                    {couponStatus.message}
                  </p>
                )}
              </div>

              {erro && (
                <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 px-3 py-2 rounded-md">
                  {erro}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Criando conta...</>
                ) : 'Criar conta grátis'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-sidebar-foreground/50 mt-4">
          Já tem conta?{' '}
          <Link href="/login" className="text-primary hover:underline font-medium">
            Entrar
          </Link>
        </p>

        <p className="text-center text-xs text-sidebar-foreground/30 mt-3">
          Ao criar sua conta, você concorda com nossa{' '}
          <Link href="/politica-de-privacidade" className="underline hover:text-sidebar-foreground/50">
            Política de Privacidade
          </Link>
        </p>
      </div>
    </div>
  )
}
