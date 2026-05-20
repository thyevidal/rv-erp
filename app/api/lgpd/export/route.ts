import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  // Coleta todos os dados do usuário
  const [profileRes, estoquesRes, obrasRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('estoque_logs').select('*').eq('user_id', user.id),
    supabase.from('obras').select('id, nome, status, created_at').eq('user_id', user.id),
  ])

  const exportData = {
    exportado_em: new Date().toISOString(),
    usuario: {
      id: user.id,
      email: user.email,
      criado_em: user.created_at,
      ultimo_login: user.last_sign_in_at,
    },
    perfil: profileRes.data ?? null,
    obras_criadas: obrasRes.data ?? [],
    registros_estoque: estoquesRes.data ?? [],
  }

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="meus-dados-prumo-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  })
}
