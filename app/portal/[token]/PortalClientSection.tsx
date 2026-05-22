'use client'

import { useState, useRef } from 'react'

const COR = '#3C3489'
const COR_ATIVO_BG = '#EEEDFA'

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
  // Docs da construtora com visivel_cliente = true
  docsConstrutora: Doc[]
  // Docs do correspondente com visivel_cliente = true (aprovados pelo construtor)
  docsCorrespondente: Doc[]
  // Docs do próprio cliente (todos os que ele enviou)
  docsCliente: Doc[]
}

// Documentos pessoais/financeiros que o CLIENTE envia por fase
const DOCS_POR_FASE: Record<number, string[]> = {
  1: ['RG e CPF', 'Comprovante de renda (3 meses)', 'Comprovante de residência', 'Extrato bancário (3 meses)', 'Declaração de IR'],
  2: [],
  3: [],
  4: [],
  5: [],
  6: [],
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

export default function PortalClientSection({
  token, faseAtiva, docsConstrutora, docsCorrespondente, docsCliente,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pendingRef = useRef<{ fase: number | null; nomeTipo: string | null } | null>(null)

  const [uploadingKey, setUploadingKey] = useState<string | null>(null)
  const [doneKeys, setDoneKeys] = useState<Set<string>>(new Set())

  function isUploaded(nomeTipo: string): boolean {
    if (docsCliente.some((d) => d.nome_tipo === nomeTipo)) return true
    for (let f = 1; f <= 6; f++) {
      if (doneKeys.has(slotKey(f, nomeTipo))) return true
    }
    return false
  }

  function getDoc(nomeTipo: string): Doc | null {
    return docsCliente.find((d) => d.nome_tipo === nomeTipo) ?? null
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

  // Documentos da fase 1 (análise de crédito — documentos pessoais)
  const docsNecFase1 = DOCS_POR_FASE[1]
  const enviadosFase1 = docsNecFase1.filter((nt) => isUploaded(nt)).length

  return (
    <>
      {/* ── Documentos da construtora (visíveis ao cliente) ─── */}
      <div className="card">
        <div className="card-title">📥 Documentos da construtora</div>
        {docsConstrutora.length === 0 ? (
          <p style={{ fontSize: '13px', color: '#A09D97', textAlign: 'center', padding: '12px 0' }}>
            Nenhum documento disponível ainda.
          </p>
        ) : (
          docsConstrutora.map((doc) => (
            <div key={doc.id} className="doc-item">
              <div>📄</div>
              <div style={{ flex: 1 }}>
                <div className="doc-name">{doc.nome}</div>
                <div className="doc-sub">{new Date(doc.created_at).toLocaleDateString('pt-BR')}</div>
              </div>
              <a href={doc.url} target="_blank" rel="noopener noreferrer" className="btn-down">↓ Baixar</a>
            </div>
          ))
        )}
      </div>

      {/* ── Documentos do correspondente aprovados pelo construtor ─── */}
      {docsCorrespondente.length > 0 && (
        <div className="card">
          <div className="card-title">📋 Documentos do correspondente</div>
          {docsCorrespondente.map((doc) => (
            <div key={doc.id} className="doc-item">
              <div>📄</div>
              <div style={{ flex: 1 }}>
                <div className="doc-name">{doc.nome}</div>
                <div className="doc-sub">
                  {doc.nome_tipo ? `${doc.nome_tipo} · ` : ''}
                  {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                </div>
              </div>
              <a href={doc.url} target="_blank" rel="noopener noreferrer" className="btn-down">↓ Baixar</a>
            </div>
          ))}
        </div>
      )}

      {/* ── Meus documentos (upload pelo cliente) ─────────────────── */}
      <div className="card">
        <div className="card-title">📤 Meus documentos</div>
        <p style={{ fontSize: '12px', color: '#A09D97', marginBottom: '14px' }}>
          Envie seus documentos pessoais. A construtora os receberá e validará.
        </p>

        {/* Fase 1 — Documentos pessoais */}
        <div
          style={{
            border: `1px solid ${faseAtiva === 1 ? '#B8B3E8' : '#E2DFD8'}`,
            borderRadius: '8px',
            overflow: 'hidden',
            marginBottom: '8px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              background: faseAtiva === 1 ? COR_ATIVO_BG : '#FAFAF8',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {faseAtiva === 1 && (
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: COR, display: 'inline-block', flexShrink: 0 }} />
              )}
              <span style={{ fontSize: '13px', fontWeight: 600, color: faseAtiva === 1 ? COR : '#1A1916' }}>
                Fase 1 — {FASES_NOMES[1]}
              </span>
              {faseAtiva === 1 && (
                <span style={{ fontSize: '10px', background: COR, color: 'white', padding: '1px 7px', borderRadius: '20px' }}>
                  atual
                </span>
              )}
            </div>
            <span style={{
              fontSize: '11px',
              background: enviadosFase1 === docsNecFase1.length ? COR_ATIVO_BG : '#F2F0EC',
              color: enviadosFase1 === docsNecFase1.length ? COR : '#A09D97',
              padding: '2px 8px',
              borderRadius: '20px',
            }}>
              {enviadosFase1}/{docsNecFase1.length}
            </span>
          </div>

          <div style={{ padding: '12px 14px', borderTop: '1px solid #E2DFD8' }}>
            {docsNecFase1.map((nomeTipo, idx) => {
              const uploaded = isUploaded(nomeTipo)
              const doc = getDoc(nomeTipo)
              const key = slotKey(1, nomeTipo)
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
                    borderBottom: idx < docsNecFase1.length - 1 ? '1px solid #F0EDEA' : 'none',
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
                      onClick={() => triggerUpload(1, nomeTipo)}
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

            {/* Enviar outro na fase 1 */}
            <div style={{ marginTop: '10px' }}>
              <button
                type="button"
                disabled={uploadingKey === slotKey(1, null)}
                onClick={() => triggerUpload(1, null)}
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
                {uploadingKey === slotKey(1, null) ? 'Enviando...' : '+ Enviar outro documento'}
              </button>
            </div>
          </div>
        </div>

        {/* Documento avulso sem fase definida */}
        <div style={{ marginTop: '4px' }}>
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
            {uploadingKey === slotKey(null, null) ? 'Enviando...' : '📎 Enviar outro documento'}
          </button>
        </div>
      </div>

      {/* Input de arquivo oculto */}
      <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={handleFileChange} />
    </>
  )
}
