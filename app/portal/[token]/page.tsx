import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import PortalUploadForm from './PortalUploadForm'

const FASES = [
    { n: 1, titulo: 'Análise de crédito' },
    { n: 2, titulo: 'Terreno e projetos' },
    { n: 3, titulo: 'Documentação técnica' },
    { n: 4, titulo: 'Assinatura do contrato' },
    { n: 5, titulo: 'Execução da obra' },
    { n: 6, titulo: 'Legalização final' },
]

export default async function PortalPage({ params }: { params: { token: string } }) {
    const supabase = await createClient()
    const { token } = await params

    const { data: acesso } = await supabase
        .from('ac_acessos')
        .select('*, obras(*)')
        .eq('token', token)
        .eq('ativo', true)
        .single()

    if (!acesso) notFound()

    const obra = acesso.obras as Record<string, string>
    const isCliente = acesso.tipo === 'CLIENTE'
    const isCorrespond = acesso.tipo === 'CORRESPONDENTE'

    const [{ data: fases }, { data: checklist }, { data: documentos }] = await Promise.all([
        supabase.from('ac_fases').select('*').eq('obra_id', obra.id).order('fase_numero'),
        supabase.from('ac_checklist').select('*').eq('obra_id', obra.id),
        supabase.from('ac_documentos').select('*').eq('obra_id', obra.id).order('created_at', { ascending: false }),
    ])

    const faseAtiva = fases?.find(f => f.status === 'EM_ANDAMENTO')?.fase_numero ?? 1
    const totalConcluidos = checklist?.filter(c => c.concluido).length ?? 0
    const totalItens = checklist?.length ?? 0
    const progresso = totalItens > 0 ? Math.round((totalConcluidos / totalItens) * 100) : 0

    // Documentos visíveis para o cliente
    const docsVisiveis = isCliente
        ? documentos?.filter(d => d.visivel_cliente) ?? []
        : documentos ?? []

    const corHeader = isCliente ? '#3C3489' : '#0F6E56'

    return (
        <html lang="pt-BR">
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <title>{isCliente ? 'Sua obra' : 'Portal do correspondente'} — {obra.nome}</title>
                <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #F7F6F3; color: #1A1916; }
          .header { background: ${corHeader}; color: white; padding: 28px 24px 24px; }
          .header-label { font-size: 11px; opacity: 0.6; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 6px; }
          .header-title { font-size: 20px; font-weight: 600; margin-bottom: 4px; }
          .header-sub { font-size: 13px; opacity: 0.75; }
          .accent { height: 4px; background: ${isCliente ? '#7F77DD' : '#1D9E75'}; }
          .body { padding: 24px; max-width: 680px; margin: 0 auto; }
          .card { background: white; border: 1px solid #E2DFD8; border-radius: 12px; padding: 20px; margin-bottom: 16px; }
          .card-title { font-size: 13px; font-weight: 600; margin-bottom: 14px; color: #6B6860; text-transform: uppercase; letter-spacing: 0.4px; }
          .progress-track { height: 8px; background: #E2DFD8; border-radius: 4px; overflow: hidden; margin-bottom: 8px; }
          .progress-fill { height: 100%; background: ${corHeader}; border-radius: 4px; }
          .tl { padding-left: 24px; position: relative; }
          .tl::before { content: ''; position: absolute; left: 7px; top: 8px; bottom: 8px; width: 1px; background: #E2DFD8; }
          .tl-item { position: relative; padding-bottom: 16px; }
          .tl-item:last-child { padding-bottom: 0; }
          .tl-dot { position: absolute; left: -20px; top: 3px; width: 14px; height: 14px; border-radius: 50%; background: #E2DFD8; border: 2px solid #E2DFD8; display: flex; align-items: center; justify-content: center; }
          .tl-dot.done { background: #1D9E75; border-color: #1D9E75; }
          .tl-dot.done::after { content: '✓'; color: white; font-size: 8px; font-weight: 700; }
          .tl-dot.active { background: white; border-color: ${corHeader}; }
          .tl-dot.active::after { content: ''; width: 5px; height: 5px; border-radius: 50%; background: ${corHeader}; }
          .tl-label { font-size: 13px; font-weight: 500; }
          .tl-label.done { color: #A09D97; }
          .tl-label.active { color: ${corHeader}; }
          .tl-status { font-size: 11px; color: #A09D97; margin-top: 2px; }
          .tl-status.active { color: ${corHeader}; }
          .doc-item { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid #E2DFD8; }
          .doc-item:last-child { border-bottom: none; }
          .doc-name { font-size: 13px; flex: 1; }
          .doc-sub { font-size: 11px; color: #A09D97; margin-top: 2px; }
          .btn-down { padding: 6px 12px; background: #F2F0EC; border: 1px solid #E2DFD8; border-radius: 6px; font-size: 12px; font-weight: 500; color: #1A1916; text-decoration: none; display: inline-block; }
          .badge { display: inline-block; font-size: 11px; font-weight: 500; padding: 2px 8px; border-radius: 20px; }
          .badge-active { background: ${isCliente ? '#EEEDFE' : '#E1F5EE'}; color: ${corHeader}; }
          .badge-done { background: #E1F5EE; color: #0F6E56; }
          .badge-pending { background: #F2F0EC; color: #A09D97; }
          .footer { text-align: center; font-size: 12px; color: #A09D97; padding: 24px; }
          .upload-area { border: 1.5px dashed #C8C4BC; border-radius: 8px; padding: 24px; text-align: center; cursor: pointer; }
          .upload-area:hover { background: #F2F0EC; }
          .alert { background: #FAEEDA; border: 1px solid #FAC775; border-radius: 8px; padding: 12px 14px; font-size: 13px; color: #854F0B; margin-bottom: 16px; }
        `}</style>
            </head>
            <body>
                <div className="header">
                    <div className="header-label">{isCliente ? 'Portal do cliente' : 'Portal do correspondente'}</div>
                    <div className="header-title">
                        {isCliente ? `Olá, ${acesso.nome?.split(' ')[0] ?? 'cliente'}!` : `Olá, ${acesso.nome?.split(' ')[0] ?? 'correspondente'}!`}
                    </div>
                    <div className="header-sub">{obra.nome} · {obra.endereco}</div>
                </div>
                <div className="accent" />

                <div className="body">

                    {/* Card de progresso */}
                    <div className="card">
                        <div className="card-title">Andamento da obra</div>
                        <div className="progress-track">
                            <div className="progress-fill" style={{ width: `${progresso}%` }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                            <span style={{ color: corHeader, fontWeight: 600 }}>Fase {faseAtiva} de 6 — {FASES[faseAtiva - 1].titulo}</span>
                            <span style={{ color: '#A09D97' }}>{progresso}% concluído</span>
                        </div>
                    </div>

                    {/* Timeline de fases */}
                    <div className="card">
                        <div className="card-title">Etapas do processo</div>
                        <div className="tl">
                            {FASES.map(({ n, titulo }) => {
                                const fase = fases?.find(f => f.fase_numero === n)
                                const done = fase?.status === 'CONCLUIDA'
                                const active = fase?.status === 'EM_ANDAMENTO'
                                return (
                                    <div key={n} className="tl-item">
                                        <div className={`tl-dot ${done ? 'done' : active ? 'active' : ''}`} />
                                        <div className={`tl-label ${done ? 'done' : active ? 'active' : ''}`}>{n}. {titulo}</div>
                                        <div className={`tl-status ${active ? 'active' : ''}`}>
                                            {done ? 'Concluída' : active ? 'Em andamento' : 'Aguardando'}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Alerta para correspondente */}
                    {isCorrespond && (
                        <div className="alert">
                            📋 Fase atual: <strong>{FASES[faseAtiva - 1].titulo}</strong>. Envie os documentos necessários para dar prosseguimento ao processo.
                        </div>
                    )}

                    {/* Documentos */}
                    <div className="card">
                        <div className="card-title">
                            {isCliente ? 'Seus documentos' : 'Documentos desta obra'}
                        </div>
                        {docsVisiveis.length === 0 ? (
                            <p style={{ fontSize: '13px', color: '#A09D97', textAlign: 'center', padding: '16px 0' }}>
                                Nenhum documento disponível ainda.
                            </p>
                        ) : (
                            docsVisiveis.map((doc) => (
                                <div key={doc.id} className="doc-item">
                                    <div>📄</div>
                                    <div style={{ flex: 1 }}>
                                        <div className="doc-name">{doc.nome}</div>
                                        <div className="doc-sub">
                                            {doc.enviado_por === 'CONSTRUTOR' ? 'Enviado pelo construtor' : doc.enviado_por === 'CORRESPONDENTE' ? 'Correspondente' : 'Cliente'}
                                            {' · '}{new Date(doc.created_at).toLocaleDateString('pt-BR')}
                                        </div>
                                    </div>
                                    <a href={doc.url} target="_blank" rel="noopener noreferrer" className="btn-down">↓ Baixar</a>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Área de upload para correspondente */}
                    {isCorrespond && (
                        <div className="card">
                            <div className="card-title">Enviar documento ao construtor</div>
                            <p style={{ fontSize: '13px', color: '#6B6860', marginBottom: '16px' }}>
                                Selecione o arquivo abaixo para enviá-lo diretamente para o construtor. Todos os formatos são aceitos (PDF, imagens, ZIP, etc.).
                            </p>
                            <PortalUploadForm token={token} />
                        </div>
                    )}

                    <div className="footer">
                        Acesso restrito a esta obra · Rezende & Vidal Engenharia<br />
                        <span style={{ marginTop: '4px', display: 'block' }}>Este link é pessoal — não compartilhe com terceiros.</span>
                    </div>
                </div>
            </body>
        </html>
    )
}