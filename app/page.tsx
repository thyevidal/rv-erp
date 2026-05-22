import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#3C3489' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="9 22 9 12 15 12 15 22" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-lg font-bold" style={{ color: '#3C3489' }}>Grev</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Entrar
            </Link>
            <Link
              href="/register"
              className="text-sm font-medium text-white px-4 py-2 rounded-lg transition-colors"
              style={{ backgroundColor: '#3C3489' }}
            >
              Criar conta grátis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 70% 0%, rgba(60,52,137,0.08) 0%, transparent 60%)' }} />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-20 text-center">
          <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border" style={{ color: '#3C3489', backgroundColor: 'rgba(60,52,137,0.06)', borderColor: 'rgba(60,52,137,0.2)' }}>
            <span>Novo</span>
            <span className="text-gray-400">·</span>
            <span>Plano gratuito disponível</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
            Gerencie suas obras<br />
            <span style={{ color: '#3C3489' }}>com inteligência</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
            Do orçamento à legalização — tudo em um só lugar.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-xl text-white font-semibold text-base shadow-lg transition-all hover:opacity-90"
              style={{ backgroundColor: '#3C3489', boxShadow: '0 4px 24px rgba(60,52,137,0.25)' }}
            >
              Criar conta grátis
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-xl font-semibold text-base border transition-colors hover:bg-gray-50"
              style={{ color: '#3C3489', borderColor: '#3C3489' }}
            >
              Entrar
            </Link>
          </div>
          <p className="text-xs text-gray-400 mt-4">Sem cartão de crédito. Comece em segundos.</p>
        </div>
      </section>

      {/* Como funciona */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">Como funciona</h2>
            <p className="text-gray-500">Três passos para transformar a gestão das suas obras.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { n: '1', title: 'Crie sua obra', desc: 'Cadastre o projeto com endereço, status e responsáveis em menos de 1 minuto.' },
              { n: '2', title: 'Orce e planeje', desc: 'Monte o orçamento com banco de insumos, calcule BDI e defina o cronograma.' },
              { n: '3', title: 'Acompanhe em tempo real', desc: 'Monitore financeiro, estoque e agenda com dashboards atualizados ao vivo.' },
            ].map(({ n, title, desc }) => (
              <div key={n} className="flex flex-col items-center text-center">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold mb-5 shadow-md"
                  style={{ backgroundColor: '#3C3489' }}
                >
                  {n}
                </div>
                <h3 className="text-lg font-semibold mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Funcionalidades */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">Funcionalidades</h2>
            <p className="text-gray-500">Tudo que uma construtora precisa, num só sistema.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { emoji: '💰', title: 'Orçamento', desc: 'Monte orçamentos detalhados com banco de insumos e cálculo automático de BDI.' },
              { emoji: '📅', title: 'Cronograma', desc: 'Planeje tarefas, defina responsáveis e acompanhe o progresso de cada etapa.' },
              { emoji: '📦', title: 'Mapa de Coleta', desc: 'Compare fornecedores e gerencie cotações de materiais de forma eficiente.' },
              { emoji: '🏗️', title: 'Banco de Insumos', desc: 'Catálogo mestre de materiais com histórico de preços e fornecedores.' },
              { emoji: '📊', title: 'Financeiro', desc: 'Controle entradas e saídas, acompanhe saldo consolidado e saúde financeira.' },
              { emoji: '🗄️', title: 'Estoque', desc: 'Gerencie o estoque de materiais com movimentações e alertas de reposição.' },
              { emoji: '🗓️', title: 'Agenda', desc: 'Centralize reuniões, visitas e compromissos de todas as suas obras.' },
              { emoji: '📋', title: 'Aquisição & Construção', desc: 'Do pedido de compra à execução — controle cada fase da construção.' },
            ].map(({ emoji, title, desc }) => (
              <div key={title} className="rounded-2xl border border-gray-100 p-6 hover:border-indigo-100 hover:shadow-sm transition-all">
                <div className="text-3xl mb-3">{emoji}</div>
                <h3 className="font-semibold mb-1.5">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Planos */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">Planos</h2>
            <p className="text-gray-500">Comece grátis e faça upgrade quando precisar crescer.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Gratuito */}
            <div className="rounded-2xl border border-gray-200 bg-white p-8 flex flex-col">
              <div className="mb-6">
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Gratuito</p>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-extrabold">R$ 0</span>
                  <span className="text-gray-400 mb-1">/mês</span>
                </div>
              </div>
              <ul className="space-y-3 text-sm text-gray-600 flex-1 mb-8">
                {['1 obra', 'Dashboard', 'Configurações'].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="block text-center py-3 rounded-xl font-semibold text-sm border transition-colors hover:bg-gray-50"
                style={{ color: '#3C3489', borderColor: '#3C3489' }}
              >
                Começar grátis
              </Link>
            </div>

            {/* Pro */}
            <div className="rounded-2xl border-2 bg-white p-8 flex flex-col relative overflow-hidden" style={{ borderColor: '#3C3489' }}>
              <div className="absolute top-4 right-4">
                <span className="text-xs font-bold text-white px-2.5 py-1 rounded-full" style={{ backgroundColor: '#3C3489' }}>Popular</span>
              </div>
              <div className="mb-6">
                <p className="text-sm font-semibold uppercase tracking-wide mb-1" style={{ color: '#3C3489' }}>Pro</p>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-extrabold">R$ 350</span>
                  <span className="text-gray-400 mb-1">/mês</span>
                </div>
              </div>
              <ul className="space-y-3 text-sm text-gray-600 flex-1 mb-8">
                {['Obras ilimitadas', 'Todos os módulos', 'Financeiro', 'Estoque', 'Agenda', 'Banco de Insumos', 'Cronograma', 'Mapa de Coleta'].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#3C3489' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/upgrade"
                className="block text-center py-3 rounded-xl font-semibold text-sm text-white transition-colors hover:opacity-90"
                style={{ backgroundColor: '#3C3489' }}
              >
                Fazer upgrade
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20" style={{ backgroundColor: '#3C3489' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Comece agora, é grátis</h2>
          <p className="text-indigo-200 mb-8">Sem cartão de crédito. Sem burocracia. Só você e suas obras.</p>
          <Link
            href="/register"
            className="inline-flex items-center px-10 py-4 rounded-xl bg-white font-bold text-base transition-colors hover:bg-indigo-50"
            style={{ color: '#3C3489' }}
          >
            Criar minha conta grátis
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <span>© 2026 Grev</span>
          <div className="flex items-center gap-6">
            <Link href="/politica-de-privacidade" className="hover:text-gray-600 transition-colors">
              Política de Privacidade
            </Link>
            <a href="mailto:contato@grev.com.br" className="hover:text-gray-600 transition-colors">
              contato@grev.com.br
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
