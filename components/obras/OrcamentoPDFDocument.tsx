import { Document, Page, Text, View, Image, StyleSheet, Font } from '@react-pdf/renderer'
import path from 'path'

// Registra fonte local — incluída no bundle via outputFileTracingIncludes no next.config.ts
Font.register({
  family: 'Inter',
  fonts: [
    { src: path.join(process.cwd(), 'public/fonts/inter-regular.woff2'), fontWeight: 'normal' },
    { src: path.join(process.cwd(), 'public/fonts/inter-bold.woff2'), fontWeight: 'bold' },
  ],
})

// ─── Estilos estáticos no nível de módulo (StyleSheet.create fora de funções) ─
const S = StyleSheet.create({
  page: { fontFamily: 'Inter', fontSize: 9, backgroundColor: '#ffffff', paddingBottom: 40 },
  // Header
  header: { paddingHorizontal: 32, paddingTop: 28, paddingBottom: 0 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logo: { height: 44, maxWidth: 120, objectFit: 'contain' },
  logoPlaceholder: { height: 44, width: 44, borderRadius: 4, justifyContent: 'center', alignItems: 'center' },
  logoPlaceholderText: { fontWeight: 'bold', fontSize: 18, color: '#ffffff' },
  companyName: { fontWeight: 'bold', fontSize: 11, color: '#ffffff' },
  companyInfo: { fontSize: 8, color: '#ffffff', opacity: 0.8 },
  docTitle: { fontWeight: 'bold', fontSize: 13, color: '#ffffff', textAlign: 'right', letterSpacing: 1.5 },
  docDate: { fontSize: 9, color: '#ffffff', opacity: 0.9, textAlign: 'right', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#ffffff', opacity: 0.25, marginTop: 16, marginBottom: 14 },
  headerBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingBottom: 20 },
  obraName: { fontWeight: 'bold', fontSize: 17, color: '#ffffff' },
  obraEndereco: { fontSize: 9, color: '#ffffff', opacity: 0.85, marginTop: 3 },
  prazoLabel: { fontSize: 7, color: '#ffffff', opacity: 0.75, letterSpacing: 1 },
  prazoValue: { fontWeight: 'bold', fontSize: 10, color: '#ffffff', marginTop: 2 },
  accentBar: { height: 5 },
  // Mini-header páginas 2+
  miniHeaderWrap: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 32, paddingVertical: 8 },
  miniHeaderName: { fontWeight: 'bold', fontSize: 8, color: '#ffffff' },
  miniHeaderObra: { fontSize: 8, color: '#ffffff', opacity: 0.8 },
  miniAccentBar: { height: 3 },
  // Body
  body: { paddingHorizontal: 32, paddingTop: 20 },
  intro: { fontSize: 9.5, color: '#444444', lineHeight: 1.6, marginBottom: 20 },
  sectionTitle: { fontWeight: 'bold', fontSize: 8, letterSpacing: 1.2, marginBottom: 8, marginTop: 16, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  // Serviços
  servicosList: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 4 },
  servicoItem: { flexDirection: 'row', alignItems: 'center', width: '50%', paddingVertical: 2, paddingRight: 8 },
  servicoDot: { width: 5, height: 5, borderRadius: 3, marginRight: 6, flexShrink: 0 },
  servicoText: { fontSize: 9, color: '#374151', flex: 1 },
  // Tabela
  table: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 4, overflow: 'hidden', marginBottom: 14 },
  tableHeader: { flexDirection: 'row', paddingVertical: 7, paddingHorizontal: 12 },
  tableHeaderText: { fontWeight: 'bold', fontSize: 8, color: '#ffffff', letterSpacing: 0.8 },
  tableRow: { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 12, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  tableRowAlt: { backgroundColor: '#f9fafb' },
  colDesc: { flex: 1, flexDirection: 'row', alignItems: 'flex-start' },
  colValue: { width: 100, alignItems: 'flex-end' },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 2, marginRight: 8, flexShrink: 0 },
  dotMao: { backgroundColor: '#6366f1' },
  dotMaterial: { backgroundColor: '#10b981' },
  dotImposto: { backgroundColor: '#f59e0b' },
  itemDesc: { fontWeight: 'bold', fontSize: 9, color: '#111827' },
  itemSub: { fontSize: 7.5, color: '#6b7280', marginTop: 2 },
  itemValue: { fontWeight: 'bold', fontSize: 10, color: '#111827' },
  impostoRow: { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 12, alignItems: 'center', backgroundColor: '#fffbeb', borderTopWidth: 1, borderTopColor: '#fde68a' },
  impostoLabel: { fontWeight: 'bold', fontSize: 9, color: '#92400e' },
  impostoValue: { fontWeight: 'bold', fontSize: 10, color: '#92400e' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12, borderTopWidth: 1.5, borderTopColor: '#d1d5db' },
  totalLabel: { fontWeight: 'bold', fontSize: 11, color: '#111827' },
  totalValue: { fontWeight: 'bold', fontSize: 14 },
  // Info grid
  infoGrid: { flexDirection: 'row', marginBottom: 14, marginTop: 4 },
  infoBox: { flex: 1, borderWidth: 1, borderRadius: 6, padding: 12, marginRight: 5 },
  infoBoxLast: { flex: 1, borderWidth: 1, borderRadius: 6, padding: 12, marginLeft: 5 },
  infoBoxLabel: { fontSize: 7.5, color: '#6b7280', marginBottom: 4 },
  infoBoxValue: { fontWeight: 'bold', fontSize: 11, color: '#111827' },
  infoBoxValueAccent: { fontWeight: 'bold', fontSize: 14 },
  infoBoxSub: { fontSize: 7.5, color: '#9ca3af', marginTop: 3 },
  // Condições
  conditions: {},
  conditionItem: { flexDirection: 'row', marginBottom: 4 },
  conditionDash: { color: '#9ca3af', fontSize: 9, marginRight: 6 },
  conditionText: { fontSize: 9, color: '#4b5563', flex: 1 },
  // Footer
  footer: { position: 'absolute', bottom: 20, left: 32, right: 32, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 8 },
  footerText: { fontSize: 7.5, color: '#9ca3af' },
  footerPage: { fontSize: 7.5, color: '#9ca3af' },
})

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
function fmtDate(d: string | null | undefined) {
  if (!d) return '—'
  const p = d.split('T')[0].split('-')
  return `${p[2]}/${p[1]}/${p[0]}`
}
function lighten(hex: string, amount: number) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const m = (c: number) => Math.round(c + (255 - c) * amount)
  const h = (n: number) => n.toString(16).padStart(2, '0')
  return `#${h(m(r))}${h(m(g))}${h(m(b))}`
}

// ─── Interfaces ───────────────────────────────────────────────────────────────
interface BdiConfig { bdi_total: number; impostos: number; margem_lucro: number; seguros: number; custos_indiretos: number }
interface Branding { nome_razao_social: string; cnpj: string; telefone: string; logo_url: string; cor_primaria: string }
interface Props {
  obra: Record<string, any>
  bdi: BdiConfig | null
  itens: Array<{ tipo: 'MATERIAL' | 'MAO_DE_OBRA'; quantidade: number; custo_unitario_aplicado: number }>
  cronogramas: Array<{ tarefa: string }> | null
  branding: Branding
}

// ─── Componente ───────────────────────────────────────────────────────────────
export function OrcamentoPDFDocument({ obra, bdi, itens, cronogramas, branding }: Props) {
  const cor = /^#[0-9A-Fa-f]{6}$/.test(branding.cor_primaria) ? branding.cor_primaria : '#3C3489'
  const corClara = lighten(cor, 0.5)
  const corSuave = lighten(cor, 0.85)
  const nomeEmpresa = branding.nome_razao_social || 'Grev'
  const logoSrc = branding.logo_url || ''

  const bdiTotal = bdi?.bdi_total ?? 0
  const impostosPct = bdi?.impostos ?? 0
  const margemPct = bdi?.margem_lucro ?? 0
  const segCiPct = (bdi?.seguros ?? 0) + (bdi?.custos_indiretos ?? 0)

  const custoMat = itens.filter(i => i.tipo === 'MATERIAL').reduce((a, i) => a + i.quantidade * i.custo_unitario_aplicado, 0)
  const custoMO = itens.filter(i => i.tipo === 'MAO_DE_OBRA').reduce((a, i) => a + i.quantidade * i.custo_unitario_aplicado, 0)
  const custoTotal = custoMat + custoMO
  const totalVenda = bdiTotal < 100 ? custoTotal / (1 - bdiTotal / 100) : custoTotal
  const linhaMat = custoMat + totalVenda * (segCiPct / 100)
  const linhaMO = custoMO + totalVenda * (margemPct / 100)
  const linhaImp = totalVenda * (impostosPct / 100)

  const dataEmissao = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
  const cronList = cronogramas && cronogramas.length > 0 ? cronogramas : null

  return (
    <Document title={`Orçamento — ${obra.nome}`} author={nomeEmpresa}>
      <Page size="A4" style={S.page}>

        {/* HEADER */}
        <View style={[S.header, { backgroundColor: cor }]}>
          <View style={S.headerTop}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {logoSrc
                ? <Image src={logoSrc} style={S.logo} />
                : <View style={[S.logoPlaceholder, { backgroundColor: corClara, marginRight: 10 }]}>
                    <Text style={S.logoPlaceholderText}>{nomeEmpresa.charAt(0).toUpperCase()}</Text>
                  </View>
              }
              <View style={{ marginLeft: logoSrc ? 10 : 0 }}>
                <Text style={S.companyName}>{nomeEmpresa}</Text>
                {(branding.cnpj || branding.telefone)
                  ? <Text style={S.companyInfo}>{[branding.cnpj, branding.telefone].filter(Boolean).join('  ·  ')}</Text>
                  : null}
              </View>
            </View>
            <View>
              <Text style={S.docTitle}>PROPOSTA COMERCIAL</Text>
              <Text style={S.docDate}>Emitido em {dataEmissao}</Text>
            </View>
          </View>

          <View style={S.divider} />

          <View style={S.headerBottom}>
            <View>
              <Text style={S.obraName}>{obra.nome}</Text>
              {obra.endereco ? <Text style={S.obraEndereco}>{obra.endereco}</Text> : null}
            </View>
            {(obra.data_inicio || obra.data_fim) ? (
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={S.prazoLabel}>PRAZO PREVISTO</Text>
                <Text style={S.prazoValue}>{fmtDate(obra.data_inicio)} → {fmtDate(obra.data_fim)}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Barra de acento */}
        <View style={[S.accentBar, { backgroundColor: corClara }]} />

        {/* Mini-header fixo páginas 2+ */}
        <View fixed render={({ pageNumber }) => pageNumber <= 1 ? null : (
          <>
            <View style={[S.miniHeaderWrap, { backgroundColor: cor }]}>
              <Text style={S.miniHeaderName}>{nomeEmpresa}</Text>
              <Text style={S.miniHeaderObra}>{obra.nome}</Text>
            </View>
            <View style={[S.miniAccentBar, { backgroundColor: corClara }]} />
          </>
        )} />

        {/* BODY */}
        <View style={S.body}>

          {/* Intro */}
          <Text style={S.intro}>
            {`Apresentamos a seguir a proposta comercial para execução dos serviços referentes à obra "${obra.nome}"${obra.endereco ? `, localizada em ${obra.endereco}` : ''}. Os valores abaixo contemplam todos os materiais, mão de obra e encargos necessários para a conclusão dos serviços conforme escopo acordado.`}
          </Text>

          {/* Serviços */}
          {cronList && (
            <View wrap={false}>
              <Text style={[S.sectionTitle, { color: cor }]}>SERVIÇOS A EXECUTAR</Text>
              <View style={S.servicosList}>
                {cronList.map((t, i) => (
                  <View key={i} style={S.servicoItem}>
                    <View style={[S.servicoDot, { backgroundColor: corClara }]} />
                    <Text style={S.servicoText}>{t.tarefa}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Tabela de orçamento */}
          <View wrap={false}>
            <Text style={[S.sectionTitle, { color: cor }]}>COMPOSIÇÃO DO ORÇAMENTO</Text>
            <View style={S.table}>
              <View style={[S.tableHeader, { backgroundColor: cor }]}>
                <View style={S.colDesc}><Text style={S.tableHeaderText}>Descrição</Text></View>
                <View style={S.colValue}><Text style={S.tableHeaderText}>Valor</Text></View>
              </View>

              <View style={S.tableRow}>
                <View style={S.colDesc}>
                  <View style={[S.dot, S.dotMao]} />
                  <View>
                    <Text style={S.itemDesc}>Mão de Obra e Serviços</Text>
                    <Text style={S.itemSub}>Execução dos serviços e empreitadas · inclui margem de resultado</Text>
                  </View>
                </View>
                <View style={S.colValue}><Text style={S.itemValue}>{fmt(linhaMO)}</Text></View>
              </View>

              <View style={[S.tableRow, S.tableRowAlt]}>
                <View style={S.colDesc}>
                  <View style={[S.dot, S.dotMaterial]} />
                  <View>
                    <Text style={S.itemDesc}>Materiais e Insumos</Text>
                    <Text style={S.itemSub}>Fornecimento de materiais · inclui seguros e custos operacionais</Text>
                  </View>
                </View>
                <View style={S.colValue}><Text style={S.itemValue}>{fmt(linhaMat)}</Text></View>
              </View>

              <View style={S.impostoRow}>
                <View style={S.colDesc}>
                  <View style={[S.dot, S.dotImposto]} />
                  <View>
                    <Text style={S.impostoLabel}>Impostos e Encargos Fiscais</Text>
                    <Text style={S.itemSub}>Tributos incidentes sobre o faturamento</Text>
                  </View>
                </View>
                <View style={S.colValue}><Text style={S.impostoValue}>{fmt(linhaImp)}</Text></View>
              </View>

              <View style={[S.totalRow, { backgroundColor: corSuave }]}>
                <Text style={S.totalLabel}>Total Geral</Text>
                <Text style={[S.totalValue, { color: cor }]}>{fmt(totalVenda)}</Text>
              </View>
            </View>
          </View>

          {/* Info boxes */}
          <View style={S.infoGrid} wrap={false}>
            <View style={[S.infoBox, { borderColor: '#e5e7eb' }]}>
              <Text style={S.infoBoxLabel}>Prazo de Execução</Text>
              <Text style={S.infoBoxValue}>
                {obra.data_inicio && obra.data_fim ? `${fmtDate(obra.data_inicio)} até ${fmtDate(obra.data_fim)}` : 'A definir'}
              </Text>
              <Text style={S.infoBoxSub}>Sujeito a condições climáticas e aprovações</Text>
            </View>
            <View style={[S.infoBoxLast, { borderColor: corClara, backgroundColor: corSuave }]}>
              <Text style={S.infoBoxLabel}>Valor Total da Proposta</Text>
              <Text style={[S.infoBoxValueAccent, { color: cor }]}>{fmt(totalVenda)}</Text>
              <Text style={S.infoBoxSub}>Inclui materiais, mão de obra e encargos fiscais</Text>
            </View>
          </View>

          {/* Condições gerais */}
          <View wrap={false}>
            <Text style={[S.sectionTitle, { color: cor }]}>CONDIÇÕES GERAIS</Text>
            <View style={S.conditions}>
              {[
                'Esta proposta tem validade de 30 dias a partir da data de emissão.',
                'Os valores apresentados estão sujeitos a revisão em caso de alteração de escopo.',
                'O prazo de execução inicia-se após a assinatura do contrato e liberação da obra.',
                'Condições de pagamento a serem definidas em contrato.',
                'Eventuais serviços extras não previstos nesta proposta serão orçados separadamente.',
              ].map((c, i) => (
                <View key={i} style={S.conditionItem}>
                  <Text style={S.conditionDash}>—</Text>
                  <Text style={S.conditionText}>{c}</Text>
                </View>
              ))}
            </View>
          </View>

        </View>

        {/* Footer fixo */}
        <View fixed style={S.footer}>
          <Text style={S.footerText}>{nomeEmpresa} · Proposta Comercial · {dataEmissao}</Text>
          <Text style={S.footerPage} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>

      </Page>
    </Document>
  )
}
