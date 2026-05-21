'use client'

import { useState, useRef } from 'react'

interface Props {
  token: string
}

export default function PortalUploadForm({ token }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [status, setStatus] = useState<{ msg: string; color: string } | null>(null)
  const [loading, setLoading] = useState(false)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    setFileName(file ? file.name : null)
    setStatus(null)
  }

  async function handleUpload() {
    if (!inputRef.current?.files?.length) {
      setStatus({ msg: '⚠️ Selecione um arquivo primeiro.', color: '#854F0B' })
      return
    }
    setLoading(true)
    setStatus(null)

    const fd = new FormData()
    fd.append('token', token)
    fd.append('file', inputRef.current.files[0])

    try {
      const res = await fetch('/api/portal/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (res.ok) {
        setStatus({ msg: '✅ Documento enviado com sucesso! A página será atualizada.', color: '#0F6E56' })
        setTimeout(() => window.location.reload(), 1800)
      } else {
        setStatus({ msg: `❌ Erro: ${json.error}`, color: '#B91C1C' })
        setLoading(false)
      }
    } catch {
      setStatus({ msg: '❌ Falha de conexão. Tente novamente.', color: '#B91C1C' })
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Área clicável para selecionar arquivo */}
      <div
        className="upload-area"
        onClick={() => inputRef.current?.click()}
        style={{ cursor: 'pointer' }}
      >
        <div style={{ fontSize: '13px', color: '#6B6860' }}>
          {fileName ? `📄 ${fileName}` : '📎 Clique aqui para selecionar o arquivo'}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <button
        type="button"
        disabled={loading}
        style={{
          padding: '10px 20px',
          background: loading ? '#6B9E92' : '#0F6E56',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer',
          width: '100%',
        }}
        onClick={handleUpload}
      >
        {loading ? 'Enviando...' : 'Enviar documento'}
      </button>

      {status && (
        <div style={{ fontSize: '12px', textAlign: 'center', color: status.color }}>
          {status.msg}
        </div>
      )}
    </div>
  )
}
