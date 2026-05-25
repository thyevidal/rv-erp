import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { renderToBuffer, Font } from '@react-pdf/renderer'
import { OrcamentoPDFDocument } from '@/components/obras/OrcamentoPDFDocument'
import { GEIST_REGULAR_TTF } from '@/lib/pdf-font-data'

// Registra fonte real (TTF base64) antes de cada render
// STANDARD_FONTS da react-pdf (src:'Helvetica') falha no Turbopack/serverless
let fontsRegistered = false
function ensureFonts() {
    if (fontsRegistered) return
    Font.register({
        family: 'Geist',
        fonts: [
            { src: GEIST_REGULAR_TTF },
            { src: GEIST_REGULAR_TTF, fontWeight: 'bold' },
        ],
    })
    fontsRegistered = true
}

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

    const [{ data: obra }, { data: bdiRow }, { data: itens }, { data: cronogramas }] = await Promise.all([
        admin.from('obras').select('*').eq('id', id).eq('organization_id', profile.organization_id).single(),
        // Não selecionamos bdi_total (coluna GENERATED — PostgREST pode retornar null)
        // Calculamos nós mesmos a partir dos componentes individuais
        admin.from('bdi_config').select('impostos, margem_lucro, seguros, custos_indiretos').eq('obra_id', id).maybeSingle(),
        admin.from('orcamento_itens').select('id, etapa, subetapa, descricao, tipo, unidade, quantidade, custo_unitario_aplicado').eq('obra_id', id).order('etapa').order('created_at'),
        admin.from('cronograma').select('tarefa, data_prevista_inicio, data_prevista_fim').eq('obra_id', id).order('data_prevista_inicio'),
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
    // react-pdf <Image> suporta apenas PNG e JPEG — SVG não é suportado
    let logoBase64 = ''
    if (branding.logo_url) {
        try {
            const cleanUrl = branding.logo_url.split('?')[0]
            const res = await fetch(cleanUrl)
            if (res.ok) {
                const contentType = res.headers.get('content-type') || ''
                // Ignora SVG — react-pdf não suporta SVG no componente <Image>
                if (!contentType.includes('svg')) {
                    const buffer = await res.arrayBuffer()
                    logoBase64 = `data:${contentType || 'image/png'};base64,${Buffer.from(buffer).toString('base64')}`
                }
            }
        } catch {
            // Falhou ao baixar logo — segue sem
        }
    }

    // Calcula BDI aqui — evita dependência de coluna GENERATED (bdi_total pode vir null via PostgREST)
    const bdiPct = bdiRow
        ? (bdiRow.impostos ?? 0) + (bdiRow.margem_lucro ?? 0) + (bdiRow.seguros ?? 0) + (bdiRow.custos_indiretos ?? 0)
        : 0

    ensureFonts()

    const rawBuffer = await renderToBuffer(
        OrcamentoPDFDocument({
            obra,
            bdiPct,
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
