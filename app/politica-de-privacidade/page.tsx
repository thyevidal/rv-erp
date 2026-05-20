import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Política de Privacidade — Prumo ERP',
  description: 'Política de Privacidade e Proteção de Dados do Prumo ERP, conforme a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).',
}

const ULTIMA_ATUALIZACAO = '30 de abril de 2026'
const EMAIL_DPO = 'privacidade@prumoconstrutoras.com.br'
const EMAIL_CONTATO = 'contato@prumoconstrutoras.com.br'

export default function PoliticaPrivacidadePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/60 bg-card">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/login" className="text-sm font-semibold text-primary hover:underline">
            ← Voltar ao sistema
          </Link>
          <span className="text-xs text-muted-foreground">Última atualização: {ULTIMA_ATUALIZACAO}</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-10">
        {/* Título */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Política de Privacidade</h1>
          <p className="text-muted-foreground mt-2">
            Prumo ERP — Sistema de Gestão para Construtoras<br />
            Em conformidade com a <strong>Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018)</strong>.
          </p>
        </div>

        <Section title="1. Quem somos">
          <p>
            O <strong>Prumo ERP</strong> é um sistema SaaS (Software como Serviço) de gestão de obras, orçamentos,
            cronogramas e documentação para construtoras brasileiras. O responsável pelo tratamento de dados é a
            empresa operadora do Prumo, doravante denominada <strong>"Controlador"</strong>.
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
            <li><strong>Dados da organização:</strong> nome da construtora, CNPJ (quando fornecido).</li>
            <li><strong>Dados de obras:</strong> nome, endereço, status, datas, orçamentos, cronogramas.</li>
            <li><strong>Dados de colaboradores:</strong> nome, e-mail, função e permissões de acesso.</li>
            <li><strong>Dados de fornecedores e insumos:</strong> nome, contato, preços de referência.</li>
            <li><strong>Dados de correspondentes e clientes:</strong> nome, e-mail (para envio do portal de acompanhamento).</li>
            <li><strong>Documentos:</strong> arquivos enviados por usuários para o sistema de armazenamento.</li>
            <li><strong>Logs de acesso:</strong> IP, data/hora e ações realizadas no sistema (para segurança).</li>
            <li><strong>Consentimento LGPD:</strong> registro da data e hora do aceite desta política.</li>
          </ul>
        </Section>

        <Section title="3. Finalidade do tratamento">
          <p>Os dados são utilizados exclusivamente para:</p>
          <ul className="list-disc pl-5 mt-3 space-y-2 text-sm">
            <li>Autenticação e acesso ao sistema.</li>
            <li>Gestão de obras, orçamentos, cronogramas e documentação.</li>
            <li>Comunicação com correspondentes e clientes via portal público.</li>
            <li>Envio de notificações transacionais por e-mail (convites, alertas de sistema).</li>
            <li>Cumprimento de obrigações legais e contratuais.</li>
            <li>Segurança e prevenção a fraudes.</li>
            <li>Melhoria contínua do sistema (dados agregados e anonimizados).</li>
          </ul>
        </Section>

        <Section title="4. Base legal (LGPD — Art. 7º)">
          <p>O tratamento de dados pessoais é realizado com base nas seguintes hipóteses legais:</p>
          <ul className="list-disc pl-5 mt-3 space-y-2 text-sm">
            <li><strong>Consentimento (Art. 7º, I):</strong> coletado no momento do cadastro, para uso do sistema e comunicações.</li>
            <li><strong>Execução de contrato (Art. 7º, V):</strong> para prestação do serviço SaaS contratado.</li>
            <li><strong>Legítimo interesse (Art. 7º, IX):</strong> para segurança, logs de auditoria e prevenção a fraudes.</li>
            <li><strong>Cumprimento de obrigação legal (Art. 7º, II):</strong> quando exigido por lei ou autoridade competente.</li>
          </ul>
        </Section>

        <Section title="5. Compartilhamento de dados">
          <p>
            Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros para fins comerciais.
            Os dados podem ser compartilhados apenas com:
          </p>
          <ul className="list-disc pl-5 mt-3 space-y-2 text-sm">
            <li><strong>Supabase (PostgreSQL):</strong> banco de dados e autenticação, hospedado em infraestrutura segura.</li>
            <li><strong>Vercel:</strong> hospedagem da aplicação web, com servidores nos EUA (adequação por cláusulas contratuais padrão).</li>
            <li><strong>Resend:</strong> serviço de envio de e-mails transacionais.</li>
            <li><strong>Autoridades públicas:</strong> quando obrigados por lei, ordem judicial ou regulação aplicável.</li>
          </ul>
          <p className="mt-3 text-sm">
            Todos os fornecedores de tecnologia são avaliados quanto às suas práticas de proteção de dados e atendem
            aos requisitos de segurança aplicáveis.
          </p>
        </Section>

        <Section title="6. Retenção de dados">
          <ul className="list-disc pl-5 space-y-2 text-sm">
            <li>
              <strong>Dados de conta ativa:</strong> mantidos durante toda a vigência do contrato.
            </li>
            <li>
              <strong>Após encerramento da conta:</strong> os dados são excluídos ou anonimizados em até
              <strong> 30 dias</strong>, salvo obrigação legal de retenção maior.
            </li>
            <li>
              <strong>Logs de auditoria:</strong> retidos por até 12 meses para fins de segurança.
            </li>
            <li>
              <strong>Backup:</strong> cópias de segurança são mantidas por até 90 dias.
            </li>
          </ul>
        </Section>

        <Section title="7. Direitos do titular (Art. 18, LGPD)">
          <p>Você tem direito a:</p>
          <ul className="list-disc pl-5 mt-3 space-y-2 text-sm">
            <li><strong>Confirmação e acesso:</strong> saber quais dados temos sobre você.</li>
            <li><strong>Correção:</strong> solicitar a correção de dados incompletos, inexatos ou desatualizados.</li>
            <li><strong>Anonimização, bloqueio ou eliminação:</strong> de dados desnecessários ou tratados em desconformidade.</li>
            <li><strong>Portabilidade:</strong> receber seus dados em formato estruturado (JSON).</li>
            <li><strong>Eliminação:</strong> solicitar a exclusão de dados tratados com consentimento.</li>
            <li><strong>Revogação do consentimento:</strong> a qualquer momento, sem prejuízo dos tratamentos já realizados.</li>
            <li><strong>Oposição:</strong> se discordar de algum tratamento realizado.</li>
          </ul>
          <p className="mt-3 text-sm">
            Para exercer seus direitos, acesse <strong>Configurações → Meus Dados (LGPD)</strong> dentro do sistema,
            ou entre em contato pelo e-mail do DPO abaixo.
          </p>
        </Section>

        <Section title="8. Segurança">
          <p>
            Adotamos medidas técnicas e organizacionais para proteger seus dados:
          </p>
          <ul className="list-disc pl-5 mt-3 space-y-2 text-sm">
            <li>Senhas armazenadas com hash seguro (bcrypt via Supabase Auth).</li>
            <li>Comunicação criptografada via HTTPS/TLS.</li>
            <li>Controle de acesso baseado em papéis (RBAC) com Row Level Security (RLS).</li>
            <li>Tokens de acesso ao portal com validade limitada.</li>
            <li>Backups automáticos com retenção de 90 dias.</li>
          </ul>
        </Section>

        <Section title="9. Cookies e rastreamento">
          <p>
            O Prumo ERP utiliza apenas cookies essenciais para autenticação e manutenção da sessão do usuário.
            Não utilizamos cookies de rastreamento, publicidade ou análise comportamental de terceiros.
          </p>
        </Section>

        <Section title="10. Encarregado de Dados (DPO)">
          <p>
            O responsável pelo tratamento de dados pessoais (DPO) pode ser contactado pelo e-mail:
          </p>
          <p className="mt-2">
            <a href={`mailto:${EMAIL_DPO}`} className="text-primary underline font-medium">{EMAIL_DPO}</a>
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Prazo de resposta: até 15 dias úteis, conforme Art. 18, §5º da LGPD.
          </p>
        </Section>

        <Section title="11. Alterações nesta política">
          <p>
            Esta política pode ser atualizada periodicamente. Mudanças relevantes serão comunicadas por e-mail
            ou notificação dentro do sistema. O uso continuado do sistema após a notificação implica concordância
            com as alterações.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Última atualização: {ULTIMA_ATUALIZACAO}
          </p>
        </Section>

        <Section title="12. Autoridade supervisora">
          <p>
            Em caso de reclamações não resolvidas, você pode contatar a{' '}
            <strong>Autoridade Nacional de Proteção de Dados (ANPD)</strong>:{' '}
            <a href="https://www.gov.br/anpd" target="_blank" rel="noopener noreferrer" className="text-primary underline">
              www.gov.br/anpd
            </a>
          </p>
        </Section>
      </main>

      <footer className="border-t border-border/60 mt-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Prumo ERP · Todos os direitos reservados ·{' '}
          <a href={`mailto:${EMAIL_DPO}`} className="underline">{EMAIL_DPO}</a>
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
