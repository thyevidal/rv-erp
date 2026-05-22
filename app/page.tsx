import Link from 'next/link'

export default function LandingPage() {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* NAVBAR */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 24px',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              backgroundColor: '#3C3489',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: '700',
              fontSize: '18px',
              letterSpacing: '-1px',
              flexShrink: 0,
            }}>G</div>
            <span style={{ color: '#3C3489', fontWeight: '700', fontSize: '18px' }}>Grev</span>
          </div>

          {/* Nav actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link href="/login" style={{ color: '#6b7280', fontSize: '14px', textDecoration: 'none', fontWeight: '500' }}>
              Entrar
            </Link>
            <Link href="/register" style={{
              backgroundColor: '#3C3489',
              color: 'white',
              padding: '8px 18px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              textDecoration: 'none',
            }}>
              Criar conta grátis
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section style={{
        backgroundColor: '#0F0E1A',
        backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(60,52,137,0.4) 0%, transparent 70%)',
        padding: '96px 24px 80px',
        textAlign: 'center',
      }}>
        {/* Badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '24px' }}>
          <span style={{
            backgroundColor: 'rgba(60,52,137,0.3)',
            border: '1px solid rgba(60,52,137,0.5)',
            color: '#a9a4e8',
            fontSize: '13px',
            fontWeight: '500',
            padding: '4px 14px',
            borderRadius: '999px',
          }}>
            Novo · Plano gratuito disponível
          </span>
        </div>

        <h1 style={{
          color: 'white',
          fontSize: 'clamp(48px, 8vw, 88px)',
          fontWeight: '800',
          lineHeight: '1.05',
          margin: '0 0 24px',
          letterSpacing: '-2px',
        }}>
          O dono da obra
        </h1>

        <p style={{
          color: '#9ca3af',
          fontSize: 'clamp(16px, 2vw, 20px)',
          maxWidth: '560px',
          margin: '0 auto 40px',
          lineHeight: '1.6',
        }}>
          Gerencie orçamentos, cronogramas, equipes e financeiro de todas as suas obras em um só lugar.
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/register" style={{
            backgroundColor: 'white',
            color: '#3C3489',
            padding: '14px 28px',
            borderRadius: '10px',
            fontSize: '15px',
            fontWeight: '700',
            textDecoration: 'none',
          }}>
            Criar conta grátis
          </Link>
          <a href="#como-funciona" style={{
            border: '1.5px solid rgba(255,255,255,0.3)',
            color: 'white',
            padding: '14px 28px',
            borderRadius: '10px',
            fontSize: '15px',
            fontWeight: '600',
            textDecoration: 'none',
          }}>
            Ver como funciona ↓
          </a>
        </div>

        {/* Gradient fade */}
        <div style={{
          marginTop: '80px',
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
        }} />
      </section>

      {/* COMO FUNCIONA */}
      <section id="como-funciona" style={{ backgroundColor: 'white', padding: '80px 24px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: '700', color: '#111827', margin: '0 0 8px' }}>Como funciona</h2>
            <p style={{ color: '#6b7280', fontSize: '16px', margin: 0 }}>Simples do início ao fim</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
            {[
              { num: '1', title: 'Crie sua obra', desc: 'Cadastre e configure em minutos, sem burocracia.' },
              { num: '2', title: 'Orce e planeje', desc: 'Monte orçamentos com BDI, cronograma e mapa de coleta.' },
              { num: '3', title: 'Acompanhe em tempo real', desc: 'Financeiro, estoque e agenda centralizados.' },
            ].map((step) => (
              <div key={step.num} style={{
                border: '1px solid #e5e7eb',
                borderRadius: '16px',
                padding: '32px 28px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: '#3C3489',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: '700',
                  fontSize: '16px',
                  marginBottom: '16px',
                }}>
                  {step.num}
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', margin: '0 0 8px' }}>{step.title}</h3>
                <p style={{ color: '#6b7280', fontSize: '15px', margin: 0, lineHeight: '1.6' }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FUNCIONALIDADES */}
      <section style={{ backgroundColor: '#F8F7FF', padding: '80px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: '700', color: '#111827', margin: '0 0 8px' }}>Tudo que você precisa</h2>
            <p style={{ color: '#6b7280', fontSize: '16px', margin: 0 }}>Módulos integrados para gestão completa da obra</p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '16px',
          }}>
            {[
              { emoji: '📊', title: 'Orçamento com BDI', desc: 'Monte orçamentos detalhados com composição de BDI e curva ABC.' },
              { emoji: '📅', title: 'Cronograma', desc: 'Planeje e acompanhe o progresso de cada etapa da obra.' },
              { emoji: '🗺️', title: 'Mapa de coleta', desc: 'Organize cotações e coletas de materiais por região.' },
              { emoji: '🏗️', title: 'Banco de insumos', desc: 'Base de dados completa de materiais e mão de obra.' },
              { emoji: '💰', title: 'Financeiro', desc: 'Controle entradas, saídas e fluxo de caixa por obra.' },
              { emoji: '📦', title: 'Estoque', desc: 'Gerencie materiais, alocações e devoluções.' },
              { emoji: '🗓️', title: 'Agenda', desc: 'Centralize compromissos, visitas e reuniões.' },
              { emoji: '🏦', title: 'Aquisição & Construção', desc: 'Processo Caixa FGTS do início ao fim.' },
            ].map((feat) => (
              <div key={feat.title} style={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '24px 20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}>
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>{feat.emoji}</div>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#111827', margin: '0 0 6px' }}>{feat.title}</h3>
                <p style={{ color: '#6b7280', fontSize: '13px', margin: 0, lineHeight: '1.5' }}>{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PLANOS */}
      <section style={{ backgroundColor: 'white', padding: '80px 24px' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: '700', color: '#111827', margin: '0 0 8px' }}>Escolha seu plano</h2>
            <p style={{ color: '#6b7280', fontSize: '16px', margin: 0 }}>Comece grátis e faça upgrade quando precisar</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {/* Plano Gratuito */}
            <div style={{
              border: '1px solid #e5e7eb',
              borderRadius: '20px',
              padding: '36px 32px',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
            }}>
              <div>
                <span style={{
                  backgroundColor: '#f3f4f6',
                  color: '#6b7280',
                  fontSize: '12px',
                  fontWeight: '600',
                  padding: '4px 10px',
                  borderRadius: '999px',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase' as const,
                }}>Gratuito</span>
                <div style={{ marginTop: '16px', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  <span style={{ fontSize: '48px', fontWeight: '800', color: '#111827', lineHeight: '1' }}>R$ 0</span>
                  <span style={{ color: '#9ca3af', fontSize: '15px' }}>/mês</span>
                </div>
              </div>

              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {['1 obra ativa', 'Dashboard e relatórios básicos', 'Configurações da conta', 'Suporte por e-mail'].map((item) => (
                  <li key={item} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#374151' }}>
                    <span style={{ color: '#3C3489', fontWeight: '700' }}>✓</span> {item}
                  </li>
                ))}
              </ul>

              <Link href="/register" style={{
                display: 'block',
                textAlign: 'center',
                border: '1.5px solid #3C3489',
                color: '#3C3489',
                padding: '12px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '600',
                textDecoration: 'none',
                marginTop: 'auto',
              }}>
                Começar grátis
              </Link>
            </div>

            {/* Plano Pro */}
            <div style={{
              border: '2px solid #3C3489',
              borderRadius: '20px',
              padding: '36px 32px',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              boxShadow: '0 8px 32px rgba(60,52,137,0.15)',
            }}>
              <div>
                <span style={{
                  backgroundColor: '#3C3489',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: '600',
                  padding: '4px 10px',
                  borderRadius: '999px',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase' as const,
                }}>Mais popular</span>
                <p style={{ fontSize: '20px', fontWeight: '700', color: '#111827', margin: '12px 0 0' }}>Pro</p>
                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  <span style={{ fontSize: '48px', fontWeight: '800', color: '#3C3489', lineHeight: '1' }}>R$ 350</span>
                  <span style={{ color: '#9ca3af', fontSize: '15px' }}>/mês</span>
                </div>
              </div>

              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  'Obras ilimitadas',
                  'Todos os módulos',
                  'Banco de insumos completo',
                  'Agenda e financeiro',
                  'Controle de estoque',
                  'Aquisição & Construção (Caixa)',
                  'Suporte prioritário',
                ].map((item) => (
                  <li key={item} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#374151' }}>
                    <span style={{ color: '#3C3489', fontWeight: '700' }}>✓</span> {item}
                  </li>
                ))}
              </ul>

              <Link href="/upgrade" style={{
                display: 'block',
                textAlign: 'center',
                backgroundColor: '#3C3489',
                color: 'white',
                padding: '12px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '600',
                textDecoration: 'none',
                marginTop: 'auto',
              }}>
                Fazer upgrade
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{ backgroundColor: '#3C3489', padding: '80px 24px', textAlign: 'center' }}>
        <h2 style={{ color: 'white', fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: '800', margin: '0 0 12px', letterSpacing: '-0.5px' }}>
          Comece agora. É grátis.
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '16px', margin: '0 0 32px' }}>
          Sem cartão de crédito. Cancele quando quiser.
        </p>
        <Link href="/register" style={{
          display: 'inline-block',
          backgroundColor: 'white',
          color: '#3C3489',
          padding: '14px 32px',
          borderRadius: '10px',
          fontSize: '15px',
          fontWeight: '700',
          textDecoration: 'none',
        }}>
          Criar conta grátis
        </Link>
      </section>

      {/* FOOTER */}
      <footer style={{
        backgroundColor: '#0F0E1A',
        padding: '32px 24px',
        textAlign: 'center',
        color: '#6b7280',
        fontSize: '13px',
      }}>
        <p style={{ margin: '0 0 8px' }}>© 2026 Grev · Desenvolvido para construtoras brasileiras</p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/politica-de-privacidade" style={{ color: '#6b7280', textDecoration: 'underline' }}>
            Política de Privacidade
          </Link>
          <a href="mailto:contato@grev.com.br" style={{ color: '#6b7280', textDecoration: 'underline' }}>
            contato@grev.com.br
          </a>
        </div>
      </footer>
    </div>
  )
}
