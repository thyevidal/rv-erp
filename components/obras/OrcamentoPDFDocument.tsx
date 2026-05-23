import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer'

// Font.register é chamado no API route (ensureFonts) antes de renderToBuffer

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface Obra {
  id: string
  nome: string
  cliente?: string
  endereco?: string
  cidade?: string
  uf?: string
  area_m2?: number
  prazo_dias?: number
  observacoes?: string
}

interface BdiConfig {
  bdi_total?: number
  impostos?: number
  margem_lucro?: number
  seguros?: number
  custos_indiretos?: number
}

interface OrcamentoItem {
  id: string
  etapa: string
  subetapa?: string
  descricao: string
  tipo: 'MATERIAL' | 'MAO_DE_OBRA'
  quantidade: number
  custo_unitario_aplicado: number
  total_custo: number
  total_venda: number  // preço de venda já com BDI embutido
}

interface Cronograma {
  tarefa: string
  data_prevista_inicio?: string
  data_prevista_fim?: string
}

interface Branding {
  nome_razao_social: string
  cnpj: string
  telefone: string
  logo_url: string
  cor_primaria: string
}

interface Props {
  obra: Obra
  bdi: BdiConfig | null
  itens: OrcamentoItem[]
  cronogramas: Cronograma[]
  branding: Branding
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function fmtDate(iso?: string | null) {
  if (!iso) return null
  const d = new Date(iso + 'T12:00:00')
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function spaced(str: string) {
  return str.split('').join(' ')
}

// ─── Estilos estáticos ────────────────────────────────────────────────────────
const S = StyleSheet.create({
  page: {
    fontFamily: 'Geist',
    fontSize: 9,
    color: '#1a1a2e',
    backgroundColor: '#ffffff',
    paddingBottom: 56,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    paddingVertical: 26,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  logo: { width: 56, height: 56, objectFit: 'contain' },
  logoPlaceholder: {
    width: 56, height: 56, borderRadius: 28,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center', alignItems: 'center',
  },
  companyName: { fontSize: 13, fontWeight: 'bold', color: '#ffffff' },
  companyTagline: { fontSize: 7.5, color: '#ffffff', opacity: 0.7, marginTop: 2, letterSpacing: 1 },
  headerRight: { alignItems: 'flex-end' },
  docType: { fontSize: 8, letterSpacing: 2, color: '#ffffff', opacity: 0.85 },
  docDate: { fontSize: 12, fontWeight: 'bold', color: '#ffffff', marginTop: 3 },

  // ── Separador ──
  separator: { height: 1, marginHorizontal: 40, backgroundColor: '#e5e7eb', marginBottom: 28 },
  separatorThin: { height: 0.5, backgroundColor: '#e5e7eb', marginBottom: 8 },

  // ── Bloco título da obra ──
  titleBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 40,
    marginBottom: 32,
  },
  obraTitle: { fontSize: 22, fontWeight: 'bold', color: '#1a1a2e', flex: 1, marginRight: 24 },
  obraSubtitle: { fontSize: 10, color: '#6b7280', marginTop: 4 },
  prazoBlock: { alignItems: 'flex-end', minWidth: 140 },
  prazoLabel: { fontSize: 7, letterSpacing: 2, color: '#6b7280', marginBottom: 4 },
  prazoValue: { fontSize: 10, fontWeight: 'bold', color: '#1a1a2e', textAlign: 'right' },

  // ── Intro ──
  intro: {
    paddingHorizontal: 40,
    marginBottom: 28,
    fontSize: 9.5,
    color: '#374151',
    lineHeight: 1.7,
  },

  // ── Seção ──
  sectionHeader: {
    paddingHorizontal: 40,
    marginBottom: 4,
  },
  sectionLabel: { fontSize: 7.5, letterSpacing: 2, color: '#6b7280' },
  sectionLine: { height: 1, backgroundColor: '#e5e7eb', marginHorizontal: 40, marginTop: 6, marginBottom: 18 },

  // ── Serviços 2 colunas ──
  servicesGrid: {
    paddingHorizontal: 40,
    flexDirection: 'row',
    gap: 24,
  },
  servicesCol: { flex: 1 },
  serviceItem: { flexDirection: 'row', marginBottom: 12, gap: 8 },
  serviceDot: { width: 5, height: 5, borderRadius: 3, marginTop: 2 },
  serviceText: { flex: 1, fontSize: 9, color: '#374151', lineHeight: 1.5 },

  // ── Footer ──
  footer: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderTopWidth: 0.5,
    borderTopColor: '#e5e7eb',
  },
  footerLeft: {},
  footerCompany: { fontSize: 8, fontWeight: 'bold', color: '#374151' },
  footerSub: { fontSize: 7, color: '#9ca3af', marginTop: 1 },
  footerDate: { fontSize: 8, color: '#9ca3af' },

  // ── Mini header (pág 2+) ──
  miniHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 28,
    paddingBottom: 10,
    marginBottom: 4,
  },
  miniCompany: { fontSize: 8.5, fontWeight: 'bold', color: '#374151' },
  miniObra: { fontSize: 8.5, color: '#6b7280' },

  // ── Tabela composição ──
  tableWrap: { paddingHorizontal: 40, marginBottom: 24 },
  tableHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 4,
  },
  tableHeadText: { fontSize: 8, fontWeight: 'bold', color: '#ffffff', letterSpacing: 1 },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
  },
  tableRowLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, flex: 1, marginRight: 16 },
  tableRowDot: { width: 7, height: 7, borderRadius: 4, marginTop: 2 },
  tableRowLabel: { fontSize: 9.5, fontWeight: 'bold', color: '#1a1a2e' },
  tableRowDesc: { fontSize: 8, color: '#6b7280', marginTop: 2 },
  tableRowValue: { fontSize: 11, fontWeight: 'bold', color: '#1a1a2e' },
  tableTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 4,
  },
  tableTotalLabel: { fontSize: 11, fontWeight: 'bold', color: '#ffffff' },
  tableTotalValue: { fontSize: 16, fontWeight: 'bold', color: '#ffffff' },

  // ── Info boxes ──
  infoBoxRow: { flexDirection: 'row', paddingHorizontal: 40, gap: 16, marginBottom: 28 },
  infoBox: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: '#e5e7eb',
    borderRadius: 6,
    padding: 16,
  },
  infoBoxLabel: { fontSize: 7, letterSpacing: 1.5, color: '#6b7280', marginBottom: 8 },
  infoBoxValue: { fontSize: 13, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 4 },
  infoBoxSub: { fontSize: 8, color: '#9ca3af' },

  // ── Condições gerais ──
  condicoes: { paddingHorizontal: 40 },
  condicaoRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 4,
  },
  condicaoDash: { fontSize: 9, color: '#9ca3af', width: 12 },
  condicaoText: { flex: 1, fontSize: 9, color: '#374151', lineHeight: 1.5 },
  condicaoWrap: {
    borderWidth: 0.5,
    borderColor: '#e5e7eb',
    borderRadius: 6,
    overflow: 'hidden',
  },
})

// ─── Componente principal ─────────────────────────────────────────────────────
export function OrcamentoPDFDocument({ obra, bdi, itens, cronogramas, branding }: Props) {
  const cor = branding.cor_primaria || '#3C3489'
  const hoje = new Date()
  const dataDoc = hoje.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

  // Datas do cronograma
  const datasValidas = cronogramas
    .flatMap(c => [c.data_prevista_inicio, c.data_prevista_fim])
    .filter(Boolean) as string[]
  const dataInicio = datasValidas.length > 0
    ? fmtDate(datasValidas.reduce((a, b) => a < b ? a : b))
    : null
  const dataFim = datasValidas.length > 0
    ? fmtDate(datasValidas.reduce((a, b) => a > b ? a : b))
    : null
  const prazoTexto = dataInicio && dataFim
    ? `${dataInicio} até ${dataFim}`
    : obra.prazo_dias ? `${obra.prazo_dias} dias` : null

  // Composição por tipo — preço de venda (total_venda já inclui BDI)
  const totalMaoDeObra = itens
    .filter(i => i.tipo === 'MAO_DE_OBRA')
    .reduce((s, i) => s + (i.total_venda || 0), 0)
  const totalMaterial = itens
    .filter(i => i.tipo === 'MATERIAL')
    .reduce((s, i) => s + (i.total_venda || 0), 0)
  const totalGeral = totalMaoDeObra + totalMaterial

  // Composição para a tabela (apenas linhas com valor > 0)
  const composicao = [
    { label: 'Mão de Obra e Serviços', desc: 'Execução dos serviços e empreitadas', valor: totalMaoDeObra },
    { label: 'Materiais e Insumos', desc: 'Fornecimento de materiais e insumos', valor: totalMaterial },
  ].filter(c => c.valor > 0)

  // Serviços (do cronograma) divididos em 2 colunas
  const tarefas = cronogramas.map(c => c.tarefa).filter(Boolean)
  const metade = Math.ceil(tarefas.length / 2)
  const colEsq = tarefas.slice(0, metade)
  const colDir = tarefas.slice(metade)

  // Condições gerais
  const condicoes = [
    'Esta proposta tem validade de 30 dias a partir da data de emissão.',
    'Os valores apresentados estão sujeitos a revisão em caso de alteração de escopo.',
    'O prazo de execução inicia-se após a assinatura do contrato e liberação da obra.',
    'Condições de pagamento a serem definidas em contrato.',
    'Eventuais serviços extras não previstos nesta proposta serão orçados separadamente.',
  ]

  // Sub-componentes
  const Header = () => (
    <View style={[S.header, { backgroundColor: cor }]}>
      <View style={S.headerLeft}>
        {branding.logo_url ? (
          <Image src={branding.logo_url} style={S.logo} />
        ) : (
          <View style={S.logoPlaceholder}>
            <Text style={{ color: '#ffffff', fontSize: 20, fontWeight: 'bold' }}>
              {(branding.nome_razao_social || 'E').charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View>
          <Text style={S.companyName}>{branding.nome_razao_social || 'Empresa'}</Text>
          {(branding.cnpj || branding.telefone) && (
            <Text style={S.companyTagline}>
              {[branding.cnpj, branding.telefone].filter(Boolean).join('  ·  ')}
            </Text>
          )}
        </View>
      </View>
      <View style={S.headerRight}>
        <Text style={S.docType}>{spaced('PROPOSTA COMERCIAL')}</Text>
        <Text style={S.docDate}>Emitido em {dataDoc}</Text>
      </View>
    </View>
  )

  const MiniHeader = () => (
    <View style={S.miniHeader}>
      <Text style={S.miniCompany}>{branding.nome_razao_social || 'Empresa'}</Text>
      <Text style={S.miniObra}>{obra.nome}</Text>
    </View>
  )

  const Footer = () => (
    <View style={S.footer} fixed>
      <View style={S.footerLeft}>
        <Text style={S.footerCompany}>{branding.nome_razao_social || 'Empresa'}</Text>
        <Text style={S.footerSub}>Documento gerado pelo sistema interno ERP</Text>
      </View>
      <Text style={S.footerDate}>Emitido em {dataDoc}</Text>
    </View>
  )

  return (
    <Document
      title={`Proposta Comercial — ${obra.nome}`}
      author={branding.nome_razao_social || 'Empresa'}
    >
      {/* ══ PÁGINA 1 ══ */}
      <Page size="A4" style={S.page}>
        <Header />
        <View style={S.separator} />

        {/* Título da obra */}
        <View style={S.titleBlock}>
          <View style={{ flex: 1, marginRight: 24 }}>
            <Text style={S.obraTitle}>{obra.nome}</Text>
            {(obra.cliente || obra.cidade) && (
              <Text style={S.obraSubtitle}>
                {[obra.cliente, obra.cidade, obra.uf].filter(Boolean).join('  ·  ')}
              </Text>
            )}
          </View>
          {prazoTexto && (
            <View style={S.prazoBlock}>
              <Text style={[S.prazoLabel, { color: cor }]}>{spaced('PRAZO PREVISTO')}</Text>
              <Text style={S.prazoValue}>{prazoTexto}</Text>
            </View>
          )}
        </View>

        {/* Parágrafo intro */}
        <Text style={S.intro}>
          {'Apresentamos a seguir a proposta comercial para execução dos serviços referentes à obra '}
          {`"${obra.nome}"`}
          {obra.cliente ? `, para ${obra.cliente}` : ''}
          {obra.cidade ? `, localizada em ${[obra.cidade, obra.uf].filter(Boolean).join('/')}` : ''}
          {'. Os valores abaixo contemplam todos os materiais, mão de obra e encargos necessários para a conclusão dos serviços conforme escopo acordado.'}
        </Text>

        {/* Serviços a executar */}
        {tarefas.length > 0 && (
          <>
            <View style={S.sectionHeader}>
              <Text style={[S.sectionLabel, { color: cor }]}>{spaced('SERVIÇOS A EXECUTAR')}</Text>
            </View>
            <View style={[S.sectionLine, { backgroundColor: cor, opacity: 0.25 }]} />

            <View style={S.servicesGrid}>
              <View style={S.servicesCol}>
                {colEsq.map((t, i) => (
                  <View key={i} style={S.serviceItem}>
                    <View style={[S.serviceDot, { backgroundColor: cor }]} />
                    <Text style={S.serviceText}>{t}</Text>
                  </View>
                ))}
              </View>
              <View style={S.servicesCol}>
                {colDir.map((t, i) => (
                  <View key={i} style={S.serviceItem}>
                    <View style={[S.serviceDot, { backgroundColor: cor }]} />
                    <Text style={S.serviceText}>{t}</Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}

        <Footer />
      </Page>

      {/* ══ PÁGINA 2 ══ */}
      <Page size="A4" style={S.page}>
        <MiniHeader />
        <View style={[S.separatorThin, { marginHorizontal: 40, marginBottom: 20 }]} />

        {/* Composição do orçamento */}
        <View style={S.sectionHeader}>
          <Text style={[S.sectionLabel, { color: cor }]}>{spaced('COMPOSIÇÃO DO ORÇAMENTO')}</Text>
        </View>
        <View style={[S.sectionLine, { backgroundColor: cor, opacity: 0.25 }]} />

        <View style={S.tableWrap}>
          {/* Cabeçalho da tabela */}
          <View style={[S.tableHead, { backgroundColor: cor }]}>
            <Text style={S.tableHeadText}>{spaced('DESCRIÇÃO')}</Text>
            <Text style={S.tableHeadText}>{spaced('VALOR')}</Text>
          </View>

          {/* Linhas por tipo (Mão de Obra / Materiais) */}
          {composicao.map(({ label, desc, valor }, idx) => (
            <View key={idx} style={S.tableRow}>
              <View style={S.tableRowLeft}>
                <View style={[S.tableRowDot, { backgroundColor: cor }]} />
                <View>
                  <Text style={S.tableRowLabel}>{label}</Text>
                  <Text style={S.tableRowDesc}>{desc}</Text>
                </View>
              </View>
              <Text style={S.tableRowValue}>{fmt(valor)}</Text>
            </View>
          ))}

          {/* Total geral */}
          <View style={[S.tableTotalRow, { backgroundColor: cor, marginTop: 2 }]}>
            <Text style={S.tableTotalLabel}>Total Geral</Text>
            <Text style={S.tableTotalValue}>{fmt(totalGeral)}</Text>
          </View>
        </View>

        {/* Info boxes */}
        <View style={S.infoBoxRow}>
          {prazoTexto && (
            <View style={S.infoBox}>
              <Text style={[S.infoBoxLabel, { color: cor }]}>{spaced('PRAZO DE EXECUÇÃO')}</Text>
              <Text style={S.infoBoxValue}>{prazoTexto}</Text>
              <Text style={S.infoBoxSub}>Sujeito a condições e aprovações</Text>
            </View>
          )}
          <View style={S.infoBox}>
            <Text style={[S.infoBoxLabel, { color: cor }]}>{spaced('VALOR TOTAL DA PROPOSTA')}</Text>
            <Text style={[S.infoBoxValue, { color: cor }]}>{fmt(totalGeral)}</Text>
            <Text style={S.infoBoxSub}>Inclui materiais, mão de obra e encargos</Text>
          </View>
        </View>

        {/* Condições gerais */}
        <View style={S.sectionHeader}>
          <Text style={[S.sectionLabel, { color: cor }]}>{spaced('CONDIÇÕES GERAIS')}</Text>
        </View>
        <View style={[S.sectionLine, { backgroundColor: cor, opacity: 0.25 }]} />

        <View style={S.condicoes}>
          <View style={S.condicaoWrap}>
            {condicoes.map((c, i) => (
              <View key={i} style={[S.condicaoRow, i % 2 === 1 ? { backgroundColor: '#f9fafb' } : {}]}>
                <Text style={S.condicaoDash}>—</Text>
                <Text style={S.condicaoText}>{c}</Text>
              </View>
            ))}
          </View>
        </View>

        <Footer />
      </Page>
    </Document>
  )
}
