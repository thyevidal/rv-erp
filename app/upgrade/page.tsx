'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function UpgradePage() {
  const [copied, setCopied] = useState(false)
  const pixKey = 'thyevidal@gmail.com'

  function handleCopy() {
    navigator.clipboard.writeText(pixKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-sm font-bold" style={{ color: '#3C3489' }}>Grev</Link>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">← Voltar</Link>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold mb-2">Ativar o plano Pro</h1>
            <p className="text-gray-500">Desbloqueie todos os módulos por R$ 350/mês</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Step 1 - PIX */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0" style={{ backgroundColor: '#3C3489' }}>1</div>
                <h2 className="font-semibold">Faça um PIX de R$ 350,00 para:</h2>
              </div>
              <div className="ml-11">
                <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Chave PIX (Nubank)</p>
                    <p className="font-mono font-semibold text-gray-900">{pixKey}</p>
                  </div>
                  <button
                    onClick={handleCopy}
                    className="shrink-0 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all"
                    style={{ backgroundColor: copied ? '#16a34a' : '#3C3489' }}
                  >
                    {copied ? '✓ Copiado!' : 'Copiar'}
                  </button>
                </div>
              </div>
            </div>

            {/* Step 2 - WhatsApp */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0" style={{ backgroundColor: '#3C3489' }}>2</div>
                <h2 className="font-semibold">Após o pagamento, entre em contato no WhatsApp:</h2>
              </div>
              <div className="ml-11 space-y-3">
                <a
                  href="https://wa.me/5584996958721?text=Ol%C3%A1!%20Quero%20ativar%20o%20plano%20Pro%20do%20Grev."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-sm transition-colors hover:opacity-90"
                  style={{ backgroundColor: '#25D366' }}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.553 4.1 1.522 5.825L.057 23.999l6.305-1.654A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.848 0-3.58-.498-5.073-1.37l-.363-.215-3.742.981.998-3.648-.236-.374A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                  </svg>
                  Falar no WhatsApp
                </a>
                <p className="text-sm text-gray-500">
                  Informe: seu nome, e-mail cadastrado no Grev e o comprovante de pagamento.
                </p>
              </div>
            </div>

            {/* Step 3 - Ativação */}
            <div className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0" style={{ backgroundColor: '#3C3489' }}>3</div>
                <div>
                  <h2 className="font-semibold">Ativação em até 24 horas</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Após confirmação do pagamento, seu plano Pro será ativado e você terá acesso a todos os módulos.</p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Dúvidas? Fale conosco em{' '}
            <a href="mailto:contato@grev.com.br" className="underline hover:text-gray-600">contato@grev.com.br</a>
          </p>
        </div>
      </main>
    </div>
  )
}
