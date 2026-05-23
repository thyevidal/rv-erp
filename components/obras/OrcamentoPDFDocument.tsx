import { Document, Page, Text, View, Image, StyleSheet, Font } from '@react-pdf/renderer'

// ─── Fontes padrão PDF (sem download, sem base64 — já embutidas no motor PDF) ──
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'Helvetica' },
    { src: 'Helvetica-Bold', fontWeight: 'bold' },
    { src: 'Helvetica-Oblique', fontStyle: 'italic' },
    { src: 'Helvetica-BoldOblique', fontWeight: 'bold', fontStyle: 'italic' },
  ],
})

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
  descricao: string
  unidade: string
  quantidade: number
  valor_unitario: number
  valor_total: number
}

interface Cronograma {
  tarefa: string
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

const fmtN = (v?: number | null, dec = 2) =>
  v != null ? v.toFixed(dec) : '—'

// ─── Estilos estáticos (dinâmico vai inline no JSX) ───────────────────────────
const S = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#1a1a2e',
    backgroundColor: '#ffffff',
    paddingBottom: 52,
  },

  // ── Cabeçalho ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingVertical: 22,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logo: { width: 60, height: 36, objectFit: 'contain' },
  companyName: { fontSize: 14, fontWeight: 'bold', color: '#ffffff' },
  companyMeta: { fontSize: 8, color: '#ffffff', opacity: 0.85, marginTop: 2 },
  headerRight: { alignItems: 'flex-end' },
  docTitle: { fontSize: 11, fontWeight: 'bold', color: '#ffffff', letterSpacing: 1 },
  docSubtitle: { fontSize: 8, color: '#ffffff', opacity: 0.75, marginTop: 3 },

  // ── Barra de acento ──
  accentBar: { height: 4, marginHorizontal: 32, borderRadius: 2, marginBottom: 20 },

  // ── Mini-header (páginas 2+) ──
  miniHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 18,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginBottom: 16,
  },
  miniHeaderCompany: { fontSize: 8, fontWeight: 'bold', color: '#374151' },
  miniHeaderDoc: { fontSize: 8, color: '#6b7280' },

  // ── Corpo ──
  body: { paddingHorizontal: 32 },

  // ── Seção ──
  section: { marginBottom: 18 },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    paddingBottom: 5,
    borderBottomWidth: 1.5,
    marginBottom: 10,
  },

  // ── Info obra ──
  infoRow: { flexDirection: 'row', marginBottom: 5 },
  infoLabel: { width: 110, fontWeight: 'bold', color: '#374151' },
  infoValue: { flex: 1, color: '#111827' },

  // ── Tabela ──
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginBottom: 3,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
  },
  tableRowAlt: { backgroundColor: '#f9fafb' },
  colEtapa: { width: '18%', fontSize: 8 },
  colDesc: { flex: 1, fontSize: 8 },
  colUn: { width: '8%', fontSize: 8, textAlign: 'center' },
  colQtd: { width: '8%', fontSize: 8, textAlign: 'right' },
  colUnit: { width: '14%', fontSize: 8, textAlign: 'right' },
  colTotal: { width: '14%', fontSize: 8, textAlign: 'right' },
  thText: { fontWeight: 'bold', fontSize: 8, color: '#ffffff' },

  // ── Rodapé totais ──
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingTop: 8,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 8,
  },
  totalLabel: { fontWeight: 'bold', fontSize: 9, color: '#374151' },
  totalValue: { fontWeight: 'bold', fontSize: 10, width: 110, textAlign: 'right' },

  // ── BDI boxes ──
  bdiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  bdiBox: {
    width: '22%',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 6,
    padding: 8,
    alignItems: 'center',
  },
  bdiLabel: { fontSize: 7, color: '#6b7280', marginBottom: 4, textAlign: 'center' },
  bdiValue: { fontSize: 12, fontWeight: 'bold' },

  // ── Cronograma ──
  cronItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginBottom: 2,
    borderRadius: 4,
    gap: 6,
  },
  cronDot: { width: 5, height: 5, borderRadius: 3 },
  cronText: { flex: 1, fontSize: 8 },

  // ── Condições gerais ──
  condText: { fontSize: 8, color: '#374151', lineHeight: 1.5, marginBottom: 4 },

  // ── Footer ──
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  footerText: { fontSize: 7, color: '#9ca3af' },
  footerPage: { fontSize: 7, color: '#9ca3af' },
})

// ─── Componente ───────────────────────────────────────────────────────────────
export function OrcamentoPDFDocument({ obra, bdi, itens, cronogramas, branding }: Props) {
  const cor = branding.cor_primaria || '#3C3489'
  const dataDoc = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

  // Totais
  const totalBruto = itens.reduce((s, i) => s + (i.valor_total || 0), 0)
  const bdiPct = bdi?.bdi_total ?? 0
  const totalComBdi = totalBruto * (1 + bdiPct / 100)

  // Agrupar itens por etapa
  const etapas = Array.from(new Set(itens.map(i => i.etapa)))

  // Condições gerais
  const condicoes = [
    'Este orçamento tem validade de 30 (trinta) dias corridos a partir da data de emissão.',
    'Os valores indicados são estimativas baseadas no escopo informado e podem sofrer ajustes mediante vistoria técnica.',
    'O BDI (Benefícios e Despesas Indiretas) já está incluso no valor final quando aplicável.',
    'Prazo de execução conforme cronograma apresentado, contado a partir do início efetivo das obras.',
    'Pagamentos conforme cronograma físico-financeiro a ser acordado entre as partes.',
    'Qualquer alteração de escopo deverá ser formalizada por aditivo contratual.',
  ]

  const Header = () => (
    <View style={[S.header, { backgroundColor: cor }]}>
      <View style={S.headerLeft}>
        {branding.logo_url ? (
          <Image src={branding.logo_url} style={S.logo} />
        ) : (
          <View style={[S.logo, { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 6, justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: 'bold' }}>
              {(branding.nome_razao_social || 'E').charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View>
          <Text style={S.companyName}>{branding.nome_razao_social || 'Empresa'}</Text>
          {(branding.cnpj || branding.telefone) && (
            <Text style={S.companyMeta}>
              {[branding.cnpj, branding.telefone].filter(Boolean).join('  ·  ')}
            </Text>
          )}
        </View>
      </View>
      <View style={S.headerRight}>
        <Text style={S.docTitle}>ORÇAMENTO</Text>
        <Text style={S.docSubtitle}>{dataDoc}</Text>
      </View>
    </View>
  )

  const AccentBar = () => (
    <View style={[S.accentBar, { backgroundColor: cor, opacity: 0.35 }]} />
  )

  const MiniHeader = () => (
    <View style={S.miniHeader}>
      <Text style={S.miniHeaderCompany}>{branding.nome_razao_social || 'Empresa'}</Text>
      <Text style={S.miniHeaderDoc}>Orçamento · {obra.nome} · {dataDoc}</Text>
    </View>
  )

  const Footer = () => (
    <View style={S.footer} fixed>
      <Text style={S.footerText}>
        {branding.nome_razao_social || 'Empresa'} — Documento gerado automaticamente
      </Text>
      <Text style={S.footerPage} render={({ pageNumber, totalPages }) =>
        `Pág. ${pageNumber} / ${totalPages}`
      } />
    </View>
  )

  return (
    <Document
      title={`Orçamento — ${obra.nome}`}
      author={branding.nome_razao_social || 'Empresa'}
    >
      {/* ── PÁGINA 1 ── */}
      <Page size="A4" style={S.page}>
        <Header />
        <AccentBar />

        <View style={S.body}>

          {/* Identificação da obra */}
          <View style={S.section}>
            <Text style={[S.sectionTitle, { color: cor, borderBottomColor: cor }]}>
              Identificação da Obra
            </Text>
            <View style={S.infoRow}>
              <Text style={S.infoLabel}>Obra:</Text>
              <Text style={S.infoValue}>{obra.nome}</Text>
            </View>
            {obra.cliente && (
              <View style={S.infoRow}>
                <Text style={S.infoLabel}>Cliente:</Text>
                <Text style={S.infoValue}>{obra.cliente}</Text>
              </View>
            )}
            {(obra.endereco || obra.cidade) && (
              <View style={S.infoRow}>
                <Text style={S.infoLabel}>Localização:</Text>
                <Text style={S.infoValue}>
                  {[obra.endereco, obra.cidade, obra.uf].filter(Boolean).join(', ')}
                </Text>
              </View>
            )}
            {obra.area_m2 && (
              <View style={S.infoRow}>
                <Text style={S.infoLabel}>Área total:</Text>
                <Text style={S.infoValue}>{fmtN(obra.area_m2)} m²</Text>
              </View>
            )}
            {obra.prazo_dias && (
              <View style={S.infoRow}>
                <Text style={S.infoLabel}>Prazo estimado:</Text>
                <Text style={S.infoValue}>{obra.prazo_dias} dias</Text>
              </View>
            )}
            {obra.observacoes && (
              <View style={S.infoRow}>
                <Text style={S.infoLabel}>Observações:</Text>
                <Text style={S.infoValue}>{obra.observacoes}</Text>
              </View>
            )}
          </View>

          {/* Resumo financeiro + BDI */}
          {bdi && (
            <View style={S.section}>
              <Text style={[S.sectionTitle, { color: cor, borderBottomColor: cor }]}>
                BDI — Benefícios e Despesas Indiretas
              </Text>
              <View style={S.bdiGrid}>
                {bdi.impostos != null && (
                  <View style={S.bdiBox}>
                    <Text style={S.bdiLabel}>Impostos</Text>
                    <Text style={[S.bdiValue, { color: cor }]}>{fmtN(bdi.impostos)}%</Text>
                  </View>
                )}
                {bdi.margem_lucro != null && (
                  <View style={S.bdiBox}>
                    <Text style={S.bdiLabel}>Margem de Lucro</Text>
                    <Text style={[S.bdiValue, { color: cor }]}>{fmtN(bdi.margem_lucro)}%</Text>
                  </View>
                )}
                {bdi.seguros != null && (
                  <View style={S.bdiBox}>
                    <Text style={S.bdiLabel}>Seguros / Riscos</Text>
                    <Text style={[S.bdiValue, { color: cor }]}>{fmtN(bdi.seguros)}%</Text>
                  </View>
                )}
                {bdi.custos_indiretos != null && (
                  <View style={S.bdiBox}>
                    <Text style={S.bdiLabel}>Custos Indiretos</Text>
                    <Text style={[S.bdiValue, { color: cor }]}>{fmtN(bdi.custos_indiretos)}%</Text>
                  </View>
                )}
                <View style={[S.bdiBox, { backgroundColor: cor, borderColor: cor }]}>
                  <Text style={[S.bdiLabel, { color: '#fff' }]}>BDI Total</Text>
                  <Text style={[S.bdiValue, { color: '#fff' }]}>{fmtN(bdi.bdi_total)}%</Text>
                </View>
              </View>
            </View>
          )}

        </View>
        <Footer />
      </Page>

      {/* ── PÁGINA 2+ — Tabela de itens ── */}
      {itens.length > 0 && (
        <Page size="A4" style={S.page}>
          <MiniHeader />

          <View style={S.body}>
            <View style={S.section}>
              <Text style={[S.sectionTitle, { color: cor, borderBottomColor: cor }]}>
                Planilha Orçamentária
              </Text>

              {/* Cabeçalho da tabela */}
              <View style={[S.tableHeader, { backgroundColor: cor }]}>
                <Text style={[S.colEtapa, S.thText]}>Etapa</Text>
                <Text style={[S.colDesc, S.thText]}>Descrição</Text>
                <Text style={[S.colUn, S.thText]}>Un.</Text>
                <Text style={[S.colQtd, S.thText]}>Qtd.</Text>
                <Text style={[S.colUnit, S.thText]}>Vl. Unit.</Text>
                <Text style={[S.colTotal, S.thText]}>Vl. Total</Text>
              </View>

              {/* Itens agrupados por etapa */}
              {etapas.map((etapa) => {
                const etapaItens = itens.filter(i => i.etapa === etapa)
                const subtotal = etapaItens.reduce((s, i) => s + (i.valor_total || 0), 0)
                return (
                  <View key={etapa} wrap={false}>
                    {/* Linha de grupo */}
                    <View style={[S.tableRow, { backgroundColor: '#f3f4f6' }]}>
                      <Text style={[S.colEtapa, { fontWeight: 'bold', color: cor }]}>{etapa}</Text>
                      <Text style={[S.colDesc, { fontWeight: 'bold', color: '#374151' }]}>
                        {etapaItens.length} {etapaItens.length === 1 ? 'item' : 'itens'}
                      </Text>
                      <Text style={S.colUn} />
                      <Text style={S.colQtd} />
                      <Text style={S.colUnit} />
                      <Text style={[S.colTotal, { fontWeight: 'bold', color: cor }]}>{fmt(subtotal)}</Text>
                    </View>
                    {/* Itens */}
                    {etapaItens.map((item, idx) => (
                      <View key={item.id} style={[S.tableRow, idx % 2 === 1 ? S.tableRowAlt : {}]}>
                        <Text style={[S.colEtapa, { color: '#9ca3af' }]}>—</Text>
                        <Text style={S.colDesc}>{item.descricao}</Text>
                        <Text style={S.colUn}>{item.unidade}</Text>
                        <Text style={S.colQtd}>{fmtN(item.quantidade)}</Text>
                        <Text style={S.colUnit}>{fmt(item.valor_unitario || 0)}</Text>
                        <Text style={S.colTotal}>{fmt(item.valor_total || 0)}</Text>
                      </View>
                    ))}
                  </View>
                )
              })}

              {/* Rodapé totais */}
              <View style={S.totalRow}>
                <Text style={S.totalLabel}>Custo Direto:</Text>
                <Text style={S.totalValue}>{fmt(totalBruto)}</Text>
              </View>
              {bdiPct > 0 && (
                <>
                  <View style={[S.totalRow, { borderTopWidth: 0, paddingTop: 2, marginTop: 0 }]}>
                    <Text style={S.totalLabel}>BDI ({fmtN(bdiPct)}%):</Text>
                    <Text style={S.totalValue}>{fmt(totalComBdi - totalBruto)}</Text>
                  </View>
                  <View style={[S.totalRow, { borderTopWidth: 1.5, borderTopColor: cor, paddingTop: 8, marginTop: 4 }]}>
                    <Text style={[S.totalLabel, { fontSize: 10, color: cor }]}>TOTAL GERAL:</Text>
                    <Text style={[S.totalValue, { fontSize: 12, color: cor }]}>{fmt(totalComBdi)}</Text>
                  </View>
                </>
              )}
              {bdiPct === 0 && (
                <View style={[S.totalRow, { borderTopWidth: 1.5, borderTopColor: cor, paddingTop: 8, marginTop: 4 }]}>
                  <Text style={[S.totalLabel, { fontSize: 10, color: cor }]}>TOTAL GERAL:</Text>
                  <Text style={[S.totalValue, { fontSize: 12, color: cor }]}>{fmt(totalBruto)}</Text>
                </View>
              )}
            </View>
          </View>

          <Footer />
        </Page>
      )}

      {/* ── PÁGINA — Cronograma + Condições ── */}
      <Page size="A4" style={S.page}>
        <MiniHeader />

        <View style={S.body}>
          {/* Cronograma */}
          {cronogramas.length > 0 && (
            <View style={S.section}>
              <Text style={[S.sectionTitle, { color: cor, borderBottomColor: cor }]}>
                Cronograma de Execução
              </Text>
              {cronogramas.map((c, idx) => (
                <View key={idx} style={[S.cronItem, idx % 2 === 0 ? {} : { backgroundColor: '#f9fafb' }]}>
                  <View style={[S.cronDot, { backgroundColor: cor }]} />
                  <Text style={S.cronText}>{c.tarefa}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Condições gerais */}
          <View style={S.section}>
            <Text style={[S.sectionTitle, { color: cor, borderBottomColor: cor }]}>
              Condições Gerais
            </Text>
            {condicoes.map((c, idx) => (
              <View key={idx} style={{ flexDirection: 'row', marginBottom: 5, gap: 6 }}>
                <Text style={{ color: cor, fontSize: 8 }}>›</Text>
                <Text style={S.condText}>{c}</Text>
              </View>
            ))}
          </View>

          {/* Assinaturas */}
          <View style={[S.section, { marginTop: 32 }]}>
            <Text style={[S.sectionTitle, { color: cor, borderBottomColor: cor }]}>
              Aprovação
            </Text>
            <View style={{ flexDirection: 'row', gap: 24, marginTop: 12 }}>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <View style={{ borderTopWidth: 1, borderTopColor: '#374151', width: '80%', marginBottom: 6 }} />
                <Text style={{ fontSize: 8, color: '#374151', fontWeight: 'bold' }}>
                  {branding.nome_razao_social || 'Empresa'}
                </Text>
                <Text style={{ fontSize: 7, color: '#6b7280' }}>Contratada</Text>
              </View>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <View style={{ borderTopWidth: 1, borderTopColor: '#374151', width: '80%', marginBottom: 6 }} />
                <Text style={{ fontSize: 8, color: '#374151', fontWeight: 'bold' }}>
                  {obra.cliente || 'Cliente'}
                </Text>
                <Text style={{ fontSize: 7, color: '#6b7280' }}>Contratante</Text>
              </View>
            </View>
          </View>
        </View>

        <Footer />
      </Page>
    </Document>
  )
}
