import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { renderToBuffer } from '@react-pdf/renderer'
import { OrcamentoPDFDocument } from '@/components/obras/OrcamentoPDFDocument'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    // Valida sessão do usuário
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const admin = createAdminClient()
    const { id } = await params

    // Verifica que a obra pertence à org do usuário
    const { data: profile } = await admin
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

    if (!profile?.organization_id) {
        return NextResponse.json({ error: 'Organização não encontrada.' }, { status: 403 })
    }

    const [{ data: obra }, { data: bdi }, { data: itens }, { data: cronogramas }] = await Promise.all([
        admin.from('obras').select('*').eq('id', id).eq('organization_id', profile.organization_id).single(),
        admin.from('bdi_config').select('bdi_total, impostos, margem_lucro, seguros, custos_indiretos').eq('obra_id', id).maybeSingle(),
        admin.from('orcamento_itens').select('*').eq('obra_id', id).order('etapa').order('created_at'),
        admin.from('cronograma').select('tarefa').eq('obra_id', id).order('data_prevista_inicio'),
    ])

    if (!obra) {
        return NextResponse.json({ error: 'Obra não encontrada.' }, { status: 404 })
    }

    // Busca branding da organização
    let branding = {
        nome_razao_social: '',
        cnpj: '',
        telefone: '',
        logo_url: '',
        cor_primaria: '#3C3489',
    }

    const { data: org } = await admin
        .from('organizations')
        .select('nome_razao_social, cnpj, telefone, logo_url, cor_primaria')
        .eq('id', profile.organization_id)
        .single()

    if (org) {
        branding = {
            nome_razao_social: org.nome_razao_social ?? '',
            cnpj: org.cnpj ?? '',
            telefone: org.telefone ?? '',
            logo_url: org.logo_url ?? '',
            cor_primaria: org.cor_primaria ?? '#3C3489',
        }
    }

    // Se há logo_url, baixa a imagem e converte para base64
    let logoBase64 = ''
    if (branding.logo_url) {
        try {
            const cleanUrl = branding.logo_url.split('?')[0]
            const res = await fetch(cleanUrl)
            if (res.ok) {
                const buffer = await res.arrayBuffer()
                const contentType = res.headers.get('content-type') || 'image/png'
                logoBase64 = `data:${contentType};base64,${Buffer.from(buffer).toString('base64')}`
            }
        } catch {
            // Falhou ao baixar logo — segue sem
        }
    }

    const rawBuffer = await renderToBuffer(
        OrcamentoPDFDocument({
            obra,
            bdi,
            itens: itens ?? [],
            cronogramas: cronogramas ?? [],
            branding: { ...branding, logo_url: logoBase64 },
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
