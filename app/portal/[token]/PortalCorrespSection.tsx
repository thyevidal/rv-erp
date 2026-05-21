'use client'

import { useState, useRef } from 'react'

const COR = '#0F6E56'
const COR_ATIVO_BG = '#E1F5EE'

type Doc = {
  id: string
  nome: string
  url: string
  nome_tipo: string | null
  fase_numero: number | null
  created_at: string
}

interface Props {
  token: string
  faseAtiva: number
  docsConstrutora: Doc[]      // enviado_por = 'CONSTRUTOR'
  docsCorrespondente: Doc[]   // enviado_por = 'CORRESPONDENTE'
}

// Documentos esperados por fase (processo FGTS/Caixa)
const DOCS_POR_FASE: Record<number, string[]> = {
  1: ['RG e CPF', 'Comprovante de renda (3 meses)', 'Comprovante de residência', 'Extrato bancário (3 meses)', 'Declaração de IR'],
  2: ['Matrícula atualizada do terreno', 'Projeto aprovado pela prefeitura', 'ART ou RRT do projeto'],
  3: ['Memorial descritivo', 'Orçamento detalhado da obra', 'Cronograma físico-financeiro'],
  4: [],   // Documentos desta fase são da construtora
  5: ['Fotos da medição', 'Notas fiscais de materiais', 'Relatório de medição'],
  6: ['Habite-se', 'CND da obra', 'Averbação da construção'],
}

const FASES_NOMES: Record<number, string> = {
  1: 'Análise de crédito',
  2: 'Terreno e projetos',
  3: 'Documentação técnica',
  4: 'Assinatura do contrato',
  5: 'Execução da obra',
  6: 'Legalização final',
}

function slotKey(fase: number | null, nomeTipo: string | null) {
  return `${fase ?? 'avulso'}-${nomeTipo ?? 'outro'}`
}

export default function PortalCorrespSection({
  token, faseAtiva, docsConstrutora, docsCorrespondente,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pendingRef = useRef<{ fase: number | null; nomeTipo: string | null } | null>(null)

  const [uploadingKey, setUploadingKey] = useState<string | null>(null)
  const [doneKeys, setDoneKeys] = useState<Set<string>>(new Set())
  // Fases expandidas: começa com a fase ativa + fase 1 se diferente
  const [expanded, setExpanded] = useState<Set<number>>(
    new Set([1, faseAtiva].filter((n) => n >= 1 && n <= 6)),
  )

  function toggle(n: number) {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(n) ? next.delete(n) : next.add(n)
      return next
    })
  }

  function isUploaded(nomeTipo: string): boolean {
    // Verificar tanto no estado local (upload acabou de ocorrer) quanto nos docs já salvos
    if (docsCorrespondente.some((d) => d.nome_tipo === nomeTipo)) return true
    // Checa se qualquer fase+nomeTipo está marcado como done
    for (let f = 1; f <= 6; f++) {
      if (doneKeys.has(slotKey(f, nomeTipo))) return true
    }
    return false
  }

  function getDoc(nomeTipo: string): Doc | null {
    return docsCorrespondente.find((d) => d.nome_tipo === nomeTipo) ?? null
  }

  function triggerUpload(fase: number | null, nomeTipo: string | null) {
    pendingRef.current = { fase, nomeTipo }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
      fileInputRef.current.click()
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    const slot = pendingRef.current
    if (!file || !slot) return

    const key = slotKey(slot.fase, slot.nomeTipo)
    setUploadingKey(key)

    const fd = new FormData()
    fd.append('token', token)
    fd.append('file', file)
    if (slot.fase !== null) fd.append('fase_numero', String(slot.fase))
    if (slot.nomeTipo) fd.append('nome_tipo', slot.nomeTipo)

    try {
      const res = await fetch('/api/portal/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (res.ok) {
        setDoneKeys((prev) => new Set([...prev, key]))
        setUploadingKey(null)
        setTimeout(() => window.location.reload(), 900)
      } else {
        setUploadingKey(null)
        alert(`Erro ao enviar: ${json.error}`)
      }
    } catch {
      setUploadingKey(null)
      alert('Falha de conexão. Tente novamente.')
    }
  }

  // Fases a exibir: 1 até faseAtiva+1 (máx 6)
  const fasesVisiveis = Array.from({ length: 6 }, (_, i) => i + 1).filter(
    (n) => n <= Math.min(faseAtiva + 1, 6),
  )

  return (
    <>
      {/* ── Documentos da construtora (recebidos) ─────────────────── */}
      <div className="card">
        <div className="card-title">📥 Recebido da construtora</div>
        {docsConstrutora.length === 0 ? (
          <p style={{ fontSize: '13px', color: '#A09D97', textAlign: 'center', padding: '12px 0' }}>
            Nenhum documento enviado pela construtora ainda.
          </p>
        ) : (
          docsConstrutora.map((doc) => (
            <div key={doc.id} className="doc-item">
              <div>📄</div>
              <div style={{ flex: 1 }}>
                <div className="doc-name">{doc.nome}</div>
                <div className="doc-sub">
                  {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                </div>
              </div>
              <a href={doc.url} target="_blank" rel="noopener noreferrer" className="btn-down">
                ↓ Baixar
              </a>
            </div>
          ))
        )}
      </div>

      {/* ── Seus documentos (por fase) ─────────────────────────────── */}
      <div className="card">
        <div className="card-title">📤 Seus documentos enviados</div>
        <p style={{ fontSize: '12px', color: '#A09D97', marginBottom: '14px' }}>
          Clique em uma fase para expandir. A fase atual está destacada. Envie os documentos necessários em cada etapa.
        </p>

        {fasesVisiveis.map((n) => {
          const docsNec = DOCS_POR_FASE[n] ?? []
          const isAtiva = n === faseAtiva
          const isExp = expanded.has(n)
          const enviados = docsNec.filter((nt) => isUploaded(nt)).length
          // Docs avulsos desta fase (sem nome_tipo reconhecido ou sem nome_tipo)
          const avulsos = docsCorrespondente.filter(
            (d) => d.fase_numero === n && (!d.nome_tipo || !docsNec.includes(d.nome_tipo)),
          )

          return (
            <div
              key={n}
              style={{
                marginBottom: '8px',
                border: `1px solid ${isAtiva ? '#A8D5C5' : '#E2DFD8'}`,
                borderRadius: '8px',
                overflow: 'hidden',
              }}
            >
              {/* Cabeçalho da fase */}
              <button
                type="button"
                onClick={() => toggle(n)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: isAtiva ? COR_ATIVO_BG : isExp ? '#FAFAF8' : 'white',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isAtiva && (
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: COR, display: 'inline-block', flexShrink: 0 }} />
                  )}
                  <span style={{ fontSize: '13px', fontWeight: 600, color: isAtiva ? COR : '#1A1916' }}>
                    Fase {n} — {FASES_NOMES[n]}
                  </span>
                  {isAtiva && (
                    <span style={{ fontSize: '10px', background: COR, color: 'white', padding: '1px 7px', borderRadius: '20px' }}>
                      atual
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {docsNec.length > 0 && (
                    <span style={{
                      fontSize: '11px',
                      background: enviados === docsNec.length ? COR_ATIVO_BG : '#F2F0EC',
                      color: enviados === docsNec.length ? COR : '#A09D97',
                      padding: '2px 8px',
                      borderRadius: '20px',
                    }}>
                      {enviados}/{docsNec.length}
                    </span>
                  )}
                  <span style={{ fontSize: '10px', color: '#A09D97' }}>{isExp ? '▲' : '▼'}</span>
                </div>
              </button>

              {/* Conteúdo expandido */}
              {isExp && (
                <div style={{ padding: '12px 14px', borderTop: '1px solid #E2DFD8' }}>
                  {n === 4 && docsNec.length === 0 ? (
                    <p style={{ fontSize: '12px', color: '#A09D97', fontStyle: 'italic' }}>
                      Os documentos desta fase são providenciados pela construtora.
                    </p>
                  ) : (
                    <>
                      {/* Lista de documentos necessários */}
                      {docsNec.map((nomeTipo, idx) => {
                        const uploaded = isUploaded(nomeTipo)
                        const doc = getDoc(nomeTipo)
                        const key = slotKey(n, nomeTipo)
                        const loading = uploadingKey === key
                        const justDone = doneKeys.has(key)

                        return (
                          <div
                            key={nomeTipo}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              padding: '8px 0',
                              borderBottom: idx < docsNec.length - 1 ? '1px solid #F0EDEA' : 'none',
                            }}
                          >
                            <span style={{ fontSize: '15px', minWidth: '20px' }}>
                              {uploaded || justDone ? '✅' : '⬜'}
                            </span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '13px', color: uploaded ? '#A09D97' : '#1A1916' }}>
                                {nomeTipo}
                              </div>
                              {doc && (
                                <div style={{ fontSize: '11px', color: '#A09D97', marginTop: '2px' }}>
                                  {doc.nome} ·{' '}
                                  <a href={doc.url} target="_blank" rel="noopener noreferrer" style={{ color: COR }}>
                                    ver arquivo
                                  </a>
                                </div>
                              )}
                            </div>
                            {!uploaded && !justDone && (
                              <button
                                type="button"
                                disabled={!!loading}
                                onClick={() => triggerUpload(n, nomeTipo)}
                                style={{
                                  padding: '5px 12px',
                                  background: loading ? '#A09D97' : COR,
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  fontWeight: 500,
                                  cursor: loading ? 'not-allowed' : 'pointer',
                                  whiteSpace: 'nowrap',
                                  flexShrink: 0,
                                }}
                              >
                                {loading ? '⏳' : '↑ Enviar'}
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </>
                  )}

                  {/* Documentos avulsos já enviados nesta fase */}
                  {avulsos.length > 0 && (
                    <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed #E2DFD8' }}>
                      <div style={{ fontSize: '11px', color: '#A09D97', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                        Outros documentos desta fase
                      </div>
                      {avulsos.map((doc) => (
                        <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', fontSize: '12px' }}>
                          <span>📎</span>
                          <span style={{ flex: 1, color: '#6B6860' }}>{doc.nome}</span>
                          <a href={doc.url} target="_blank" rel="noopener noreferrer" style={{ color: COR, fontSize: '11px' }}>
                            ver
                          </a>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Botão "enviar outro desta fase" */}
                  <div style={{ marginTop: '10px' }}>
                    <button
                      type="button"
                      disabled={uploadingKey === slotKey(n, null)}
                      onClick={() => triggerUpload(n, null)}
                      style={{
                        width: '100%',
                        padding: '6px 12px',
                        background: 'transparent',
                        color: '#A09D97',
                        border: '1px dashed #C8C4BC',
                        borderRadius: '6px',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      {uploadingKey === slotKey(n, null) ? 'Enviando...' : '+ Enviar outro documento desta fase'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {/* Documento avulso sem fase definida */}
        <div style={{ marginTop: '12px' }}>
          <button
            type="button"
            disabled={uploadingKey === slotKey(null, null)}
            onClick={() => triggerUpload(null, null)}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: 'transparent',
              color: '#6B6860',
              border: '1px dashed #C8C4BC',
              borderRadius: '6px',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            {uploadingKey === slotKey(null, null) ? 'Enviando...' : '📎 Enviar documento avulso (sem fase específica)'}
          </button>
        </div>
      </div>

      {/* Input de arquivo oculto — compartilhado por todos os botões */}
      <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={handleFileChange} />
    </>
  )
}
