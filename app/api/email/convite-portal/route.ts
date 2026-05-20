import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail, templateConvitePortal } from '@/lib/email'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { email, nomeObra, token, tipo } = await req.json() as {
    email: string
    nomeObra: string
    token: string
    tipo: 'CLIENTE' | 'CORRESPONDENTE'
  }

  if (!email || !nomeObra || !token || !tipo) {
    return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://prumoerp.com.br'
  const link = `${appUrl}/portal/${token}`
  const subject = tipo === 'CLIENTE' ? `Acompanhe sua obra — ${nomeObra}` : `Portal do Correspondente — ${nomeObra}`

  try {
    await sendEmail(email, subject, templateConvitePortal(nomeObra, link, tipo))
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
