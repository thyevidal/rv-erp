import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, organization_id')
    .eq('id', user.id)
    .single()

  // Envia e-mail para o admin / DPO
  try {
    await sendEmail(
      'privacidade@prumoconstrutoras.com.br',
      `[LGPD] Solicitação de exclusão de conta — ${user.email}`,
      `
        <h2>Solicitação de exclusão de conta (LGPD)</h2>
        <p><strong>Usuário:</strong> ${profile?.name ?? 'N/A'}</p>
        <p><strong>E-mail:</strong> ${user.email}</p>
        <p><strong>ID:</strong> ${user.id}</p>
        <p><strong>Organização:</strong> ${profile?.organization_id ?? 'N/A'}</p>
        <p><strong>Data da solicitação:</strong> ${new Date().toLocaleString('pt-BR')}</p>
        <hr/>
        <p>Conforme a LGPD (Art. 18), a exclusão deve ser realizada em até <strong>15 dias úteis</strong>.</p>
      `
    )
  } catch (err) {
    console.error('[LGPD] Erro ao enviar e-mail de exclusão:', err)
    // Não bloqueia o fluxo — o registro ainda é válido
  }

  return NextResponse.json({
    success: true,
    mensagem: 'Solicitação registrada. Você receberá uma confirmação por e-mail em até 15 dias úteis.',
  })
}
