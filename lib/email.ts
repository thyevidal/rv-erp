import { Resend } from 'resend'

// Inicialização lazy — não instancia no nível do módulo para não quebrar o build
// quando RESEND_API_KEY não está definida (ex.: build do Vercel sem a variável).
function getResend() {
  return new Resend(process.env.RESEND_API_KEY!)
}

const FROM = process.env.EMAIL_FROM ?? 'Prumo ERP <onboarding@resend.dev>'

/**
 * Envia um e-mail via Resend.
 * Em desenvolvimento (sem RESEND_API_KEY), apenas loga no console.
 */
export async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY não configurada. E-mail não enviado.')
    console.log('[email] Para:', to)
    console.log('[email] Assunto:', subject)
    return
  }

  const { error } = await getResend().emails.send({ from: FROM, to, subject, html })

  if (error) {
    console.error('[email] Erro ao enviar:', error)
    throw new Error(error.message)
  }
}

// ── Templates ─────────────────────────────────────────────────────────────

export function templateBoasVindas(nome: string) {
  return `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1a1a1a">
      <div style="background:#3C3489;padding:28px 24px;border-radius:8px 8px 0 0">
        <h1 style="color:#fff;font-size:20px;margin:0">Bem-vindo ao Prumo ERP</h1>
      </div>
      <div style="background:#fff;border:1px solid #e2e8f0;border-top:none;padding:28px 24px;border-radius:0 0 8px 8px">
        <p>Olá, <strong>${nome}</strong>!</p>
        <p>Sua conta foi criada com sucesso no <strong>Prumo ERP</strong>. Você já pode acessar o sistema e começar a gerenciar suas obras.</p>
        <p style="margin-top:24px">
          <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://prumoerp.com.br'}/login"
             style="background:#3C3489;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600">
            Acessar o sistema
          </a>
        </p>
        <p style="margin-top:24px;font-size:13px;color:#6b7280">
          Se você não criou esta conta, ignore este e-mail.
        </p>
      </div>
      <p style="text-align:center;font-size:11px;color:#9ca3af;margin-top:16px">
        Prumo ERP · <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://prumoerp.com.br'}/politica-de-privacidade" style="color:#9ca3af">Política de Privacidade</a>
      </p>
    </div>
  `
}

export function templateConvitePortal(nomeObra: string, link: string, tipo: 'CLIENTE' | 'CORRESPONDENTE') {
  const titulo = tipo === 'CLIENTE' ? 'Acompanhe sua obra' : 'Portal do Correspondente'
  const descricao = tipo === 'CLIENTE'
    ? 'Você recebeu acesso ao portal de acompanhamento da sua obra.'
    : 'Você recebeu acesso ao portal do correspondente para envio de documentos e acompanhamento do processo.'

  return `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1a1a1a">
      <div style="background:#0F6E56;padding:28px 24px;border-radius:8px 8px 0 0">
        <h1 style="color:#fff;font-size:20px;margin:0">${titulo}</h1>
      </div>
      <div style="background:#fff;border:1px solid #e2e8f0;border-top:none;padding:28px 24px;border-radius:0 0 8px 8px">
        <p>${descricao}</p>
        <p><strong>Obra:</strong> ${nomeObra}</p>
        <p style="margin-top:24px">
          <a href="${link}"
             style="background:#0F6E56;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600">
            Acessar portal
          </a>
        </p>
        <p style="margin-top:16px;font-size:13px;color:#6b7280">
          Este link é pessoal — não compartilhe com terceiros.
        </p>
      </div>
      <p style="text-align:center;font-size:11px;color:#9ca3af;margin-top:16px">
        Prumo ERP · <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://prumoerp.com.br'}/politica-de-privacidade" style="color:#9ca3af">Política de Privacidade</a>
      </p>
    </div>
  `
}
