import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Política de Privacidade — Grev',
  description: 'Política de Privacidade e Proteção de Dados do Grev, conforme a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).',
}

const ULTIMA_ATUALIZACAO = '21 de maio de 2026'
const EMAIL_CONTATO = 'contato@grev.com.br'

export default async function PoliticaPrivacidadePage() {
  const supabase = await createClient()
  const { data: doc } = await supabase
    .from('legal_documents')
    .select('conteudo, atualizado_em')
    .eq('tipo', 'politica-privacidade')
    .single()

  const updatedAt = doc?.atualizado_em
    ? new Date(doc.atualizado_em).toLocaleDateString('pt-BR', { dateStyle: 'long' })
    : ULTIMA_ATUALIZACAO

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/60 bg-card">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-sm font-semibold text-primary hover:underline">
            ← Voltar
          </Link>
          <span className="text-xs text-muted-foreground">Última atualização: {updatedAt}</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-10">
        {/* Título */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Política de Privacidade</h1>
          <p className="text-muted-foreground mt-2">
            Grev — o dono da obra<br />
            Em conformidade com a <strong>Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018)</strong>.
          </p>
        </div>

        {doc?.conteudo && doc.conteudo !== 'Política de Privacidade do Grev — em atualização.' ? (
          /* Dynamic content from DB */
          <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {doc.conteudo}
          </div>
        ) : (
          /* Static fallback content */
          <>
            <Section title="1. Quem somos">
              <p>
                O <strong>Grev</strong> é um sistema SaaS (Software como Serviço) de gestão de obras, orçamentos,
                cronogramas e documentação para construtoras brasileiras. O responsável pelo tratamento de dados é a
                empresa operadora do Grev, doravante denominada <strong>&quot;Controlador&quot;</strong>.
              </p>
              <p className="mt-3">
                Para dúvidas sobre esta política, entre em contato pelo e-mail:{' '}
                <a href={`mailto:${EMAIL_CONTATO}`} className="text-primary underline">{EMAIL_CONTATO}</a>
              </p>
            </Section>

            <Section title="2. Dados coletados">
              <p>Coletamos apenas os dados necessários para o funcionamento do sistema:</p>
              <ul className="list-disc pl-5 mt-3 space-y-2 text-sm">
                <li><strong>Dados de conta:</strong> nome, e-mail, senha (armazenada com hash seguro).</li>
                <li><strong>Dados da organização:</strong> nome da construtora.</li>
                <li><strong>Dados de obras:</strong> nome, endereço, status, datas, orçamentos, cronogramas.</li>
                <li><strong>Dados de colaboradores:</strong> nome, e-mail, função e permissões de acesso.</li>
                <li><strong>Dados de fornecedores e insumos:</strong> nome, contato, preços de referência.</li>
                <li><strong>Logs de acesso:</strong> IP, data/hora e ações realizadas no sistema (para segurança).</li>
              </ul>
            </Section>

            <Section title="3. Finalidade do tratamento">
              <p>Os dados são utilizados exclusivamente para:</p>
              <ul className="list-disc pl-5 mt-3 space-y-2 text-sm">
                <li>Autenticação e acesso ao sistema.</li>
                <li>Gestão de obras, orçamentos, cronogramas e documentação.</li>
                <li>Envio de notificações transacionais por e-mail.</li>
                <li>Cumprimento de obrigações legais e contratuais.</li>
                <li>Segurança e prevenção a fraudes.</li>
                <li>Melhoria contínua do sistema (dados agregados e anonimizados).</li>
              </ul>
            </Section>

            <Section title="4. Base legal (LGPD — Art. 7º)">
              <ul className="list-disc pl-5 mt-3 space-y-2 text-sm">
                <li><strong>Consentimento (Art. 7º, I):</strong> coletado no momento do cadastro.</li>
                <li><strong>Execução de contrato (Art. 7º, V):</strong> para prestação do serviço SaaS contratado.</li>
                <li><strong>Legítimo interesse (Art. 7º, IX):</strong> para segurança e prevenção a fraudes.</li>
                <li><strong>Cumprimento de obrigação legal (Art. 7º, II):</strong> quando exigido por lei.</li>
              </ul>
            </Section>

            <Section title="5. Compartilhamento de dados">
              <ul className="list-disc pl-5 mt-3 space-y-2 text-sm">
                <li><strong>Supabase (PostgreSQL):</strong> banco de dados e autenticação.</li>
                <li><strong>Vercel:</strong> hospedagem da aplicação web.</li>
                <li><strong>Autoridades públicas:</strong> quando obrigados por lei.</li>
              </ul>
            </Section>

            <Section title="6. Segurança">
              <ul className="list-disc pl-5 mt-3 space-y-2 text-sm">
                <li>Senhas armazenadas com hash seguro (bcrypt via Supabase Auth).</li>
                <li>Comunicação criptografada via HTTPS/TLS.</li>
                <li>Controle de acesso com Row Level Security (RLS).</li>
                <li>Backups automáticos.</li>
              </ul>
            </Section>

            <Section title="7. Direitos do titular (Art. 18, LGPD)">
              <p>Você tem direito a acessar, corrigir, portar e excluir seus dados. Entre em contato pelo e-mail:</p>
              <p className="mt-2">
                <a href={`mailto:${EMAIL_CONTATO}`} className="text-primary underline font-medium">{EMAIL_CONTATO}</a>
              </p>
            </Section>

            <Section title="8. Alterações nesta política">
              <p>
                Esta política pode ser atualizada periodicamente. O uso continuado do sistema após notificação implica concordância.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">Última atualização: {updatedAt}</p>
            </Section>
          </>
        )}
      </main>

      <footer className="border-t border-border/60 mt-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Grev · Todos os direitos reservados ·{' '}
          <a href={`mailto:${EMAIL_CONTATO}`} className="underline">{EMAIL_CONTATO}</a>
        </div>
      </footer>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold border-b border-border/60 pb-2">{title}</h2>
      <div className="text-sm text-muted-foreground leading-relaxed">{children}</div>
    </section>
  )
}
