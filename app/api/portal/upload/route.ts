import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const admin = createAdminClient()

  const formData = await req.formData()
  const token = formData.get('token') as string | null
  const file = formData.get('file') as File | null
  const faseNumeroRaw = formData.get('fase_numero') as string | null
  const nomeTipo = formData.get('nome_tipo') as string | null
  const faseNumero = faseNumeroRaw ? parseInt(faseNumeroRaw, 10) : null

  if (!token || !file || file.size === 0) {
    return NextResponse.json({ error: 'Token e arquivo são obrigatórios.' }, { status: 400 })
  }

  // Validar token
  const { data: acesso } = await admin
    .from('ac_acessos')
    .select('id, obra_id, tipo, obras(nome)')
    .eq('token', token)
    .eq('ativo', true)
    .single()

  if (!acesso || acesso.tipo !== 'CORRESPONDENTE') {
    return NextResponse.json({ error: 'Token inválido ou sem permissão de envio.' }, { status: 403 })
  }

  // Fazer upload no Storage
  const ext = file.name.split('.').pop()
  const path = `${acesso.obra_id}/correspondente/${Date.now()}-${file.name}`
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const { error: storageErr } = await admin.storage
    .from('ac-documentos')
    .upload(path, buffer, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    })

  if (storageErr) {
    return NextResponse.json({ error: storageErr.message }, { status: 500 })
  }

  const { data: { publicUrl } } = admin.storage.from('ac-documentos').getPublicUrl(path)

  // Registrar na tabela de documentos
  const { error: dbErr } = await admin.from('ac_documentos').insert({
    obra_id: acesso.obra_id,
    nome: file.name,
    url: publicUrl,
    enviado_por: 'CORRESPONDENTE',
    visivel_cliente: false,
    fase_numero: faseNumero,
    nome_tipo: nomeTipo,
  })

  if (dbErr) {
    return NextResponse.json({ error: dbErr.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
