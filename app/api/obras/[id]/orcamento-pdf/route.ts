import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { OrcamentoPDFDocument } from '@/components/obras/OrcamentoPDFDocument'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createClient()
    const { id } = await params

    const [{ data: obra }, { data: bdi }, { data: itens }, { data: cronogramas }] = await Promise.all([
        supabase.from('obras').select('*').eq('id', id).single(),
        supabase.from('bdi_config').select('*').eq('obra_id', id).maybeSingle(),
        supabase.from('orcamento_itens').select('*').eq('obra_id', id).order('etapa').order('created_at'),
        supabase.from('cronograma').select('tarefa').eq('obra_id', id).order('data_prevista_inicio'),
    ])

    if (!obra) {
        return NextResponse.json({ error: 'Obra não encontrada' }, { status: 404 })
    }

    const rawBuffer = await renderToBuffer(
        OrcamentoPDFDocument({
            obra,
            bdi,
            itens: itens ?? [],
            cronogramas: cronogramas ?? [],
        })
    )

    const buffer = new Uint8Array(rawBuffer)

    return new NextResponse(buffer, {
        headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="orcamento-${obra.nome.replace(/\s+/g, '-')}.pdf"`,
        },
    })
}