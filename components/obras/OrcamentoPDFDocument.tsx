import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
} from '@react-pdf/renderer'

const styles = StyleSheet.create({
    page: {
        fontFamily: 'Helvetica',
        backgroundColor: '#ffffff',
        paddingBottom: 60,
        paddingTop: 44,
    },
    pageBreakSpacer: {
        height: 36,
    },
    pageWrap: {
        paddingTop: 36,
    },

    // Header
    header: {
        backgroundColor: '#1a1a1a',
        paddingHorizontal: 48,
        paddingTop: 36,
        paddingBottom: 32,
        marginTop: -44,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    brandBlock: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    brandIcon: {
        width: 40,
        height: 40,
        backgroundColor: '#e07b2a',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    brandIconText: {
        color: '#ffffff',
        fontSize: 22,
        fontFamily: 'Helvetica-Bold',
    },
    brandName: {
        color: '#ffffff',
        fontSize: 18,
        fontFamily: 'Helvetica-Bold',
    },
    brandSub: {
        color: '#888888',
        fontSize: 9,
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginTop: 3,
    },
    docLabel: {
        alignItems: 'flex-end',
    },
    docLabelTitle: {
        color: '#888888',
        fontSize: 9,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    docLabelDate: {
        color: '#cccccc',
        fontSize: 10,
        marginTop: 4,
    },
    headerDivider: {
        borderTopWidth: 1,
        borderTopColor: '#333333',
        marginBottom: 20,
    },
    headerBottom: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    obraName: {
        color: '#ffffff',
        fontSize: 16,
        fontFamily: 'Helvetica-Bold',
    },
    obraEndereco: {
        color: '#888888',
        fontSize: 10,
        marginTop: 4,
    },
    prazoBlock: {
        alignItems: 'flex-end',
    },
    prazoLabel: {
        color: '#666666',
        fontSize: 8,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    prazoValue: {
        color: '#cccccc',
        fontSize: 10,
        marginTop: 3,
    },
    accentBar: {
        height: 4,
        backgroundColor: '#e07b2a',
    },

    // Body
    body: {
        paddingHorizontal: 48,
        paddingTop: 32,
        paddingBottom: 20,
        backgroundColor: '#ffffff',
    },

    intro: {
        fontSize: 11,
        color: '#444444',
        lineHeight: 1.7,
        marginBottom: 28,
    },

    sectionTitle: {
        fontSize: 8,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        color: '#888888',
        marginBottom: 12,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#eeeeee',
    },

    // Serviços (cronograma)
    servicosList: {
        marginBottom: 28,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    servicoItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        width: '48%',
        marginBottom: 6,
    },
    servicoDot: {
        width: 5,
        height: 5,
        borderRadius: 3,
        backgroundColor: '#e07b2a',
        marginTop: 4,
        marginRight: 8,
        flexShrink: 0,
    },
    servicoText: {
        fontSize: 10,
        color: '#333333',
        flex: 1,
        lineHeight: 1.4,
    },

    // Tabela
    table: {
        marginBottom: 24,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f8f8f6',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderBottomWidth: 2,
        borderBottomColor: '#e8e8e8',
    },
    tableHeaderText: {
        fontSize: 8,
        letterSpacing: 1,
        textTransform: 'uppercase',
        color: '#888888',
        fontFamily: 'Helvetica-Bold',
    },
    tableRow: {
        flexDirection: 'row',
        paddingHorizontal: 14,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        alignItems: 'center',
    },
    totalRow: {
        flexDirection: 'row',
        paddingHorizontal: 14,
        paddingVertical: 16,
        backgroundColor: '#1a1a1a',
        alignItems: 'center',
    },
    colDesc: { flex: 1, flexDirection: 'row', alignItems: 'flex-start' },
    colValue: { width: 120, alignItems: 'flex-end' },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 10,
        marginTop: 3,
        flexShrink: 0,
    },
    dotMaterial: { backgroundColor: '#e07b2a' },
    dotMao: { backgroundColor: '#555555' },
    itemDesc: {
        fontSize: 11,
        color: '#1a1a1a',
        fontFamily: 'Helvetica-Bold',
    },
    itemSub: {
        fontSize: 9,
        color: '#888888',
        marginTop: 3,
    },
    itemValue: {
        fontSize: 12,
        color: '#1a1a1a',
        fontFamily: 'Helvetica-Bold',
        textAlign: 'right',
    },
    totalLabel: {
        fontSize: 12,
        color: '#ffffff',
        fontFamily: 'Helvetica-Bold',
        flex: 1,
    },
    totalValue: {
        fontSize: 15,
        color: '#e07b2a',
        fontFamily: 'Helvetica-Bold',
        width: 120,
        textAlign: 'right',
    },

    // Info boxes
    infoGrid: {
        flexDirection: 'row',
        gap: 14,
        marginBottom: 24,
    },
    infoBox: {
        flex: 1,
        backgroundColor: '#f8f8f6',
        borderWidth: 1,
        borderColor: '#ebebeb',
        borderRadius: 6,
        padding: 16,
    },
    infoBoxLabel: {
        fontSize: 8,
        letterSpacing: 1,
        textTransform: 'uppercase',
        color: '#888888',
        marginBottom: 6,
    },
    infoBoxValue: {
        fontSize: 11,
        color: '#1a1a1a',
        fontFamily: 'Helvetica-Bold',
    },
    infoBoxValueAccent: {
        fontSize: 15,
        color: '#e07b2a',
        fontFamily: 'Helvetica-Bold',
    },
    infoBoxSub: {
        fontSize: 9,
        color: '#888888',
        marginTop: 4,
    },

    // Condições
    conditions: {
        backgroundColor: '#f8f8f6',
        borderWidth: 1,
        borderColor: '#ebebeb',
        borderRadius: 6,
        padding: 18,
    },
    conditionItem: {
        flexDirection: 'row',
        marginBottom: 7,
    },
    conditionDash: {
        fontSize: 10,
        color: '#e07b2a',
        marginRight: 8,
    },
    conditionText: {
        fontSize: 10,
        color: '#555555',
        lineHeight: 1.5,
        flex: 1,
    },

    // Footer
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 48,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#ebebeb',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#ffffff',
    },
    footerBrand: {
        fontSize: 10,
        color: '#1a1a1a',
        fontFamily: 'Helvetica-Bold',
    },
    footerSub: {
        fontSize: 9,
        color: '#aaaaaa',
        marginTop: 2,
    },
    footerDate: {
        fontSize: 9,
        color: '#aaaaaa',
    },
})

function formatCurrency(value: number) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function calcVenda(custo: number, bdiTotal: number) {
    if (bdiTotal >= 100) return custo
    return custo / (1 - bdiTotal / 100)
}

function formatDate(dateStr: string | null | undefined) {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('pt-BR')
}

interface Props {
    obra: Record<string, string>
    bdi: Record<string, number> | null
    itens: Array<{
        tipo: 'MATERIAL' | 'MAO_DE_OBRA'
        quantidade: number
        custo_unitario_aplicado: number
    }>
    cronogramas: Array<{ tarefa: string }> | null
}

export function OrcamentoPDFDocument({ obra, bdi, itens, cronogramas }: Props) {
    const bdiTotal = bdi?.bdi_total ?? 0

    const custoMaterial = itens
        .filter((i) => i.tipo === 'MATERIAL')
        .reduce((a, i) => a + i.quantidade * i.custo_unitario_aplicado, 0)

    const custoMaoObra = itens
        .filter((i) => i.tipo === 'MAO_DE_OBRA')
        .reduce((a, i) => a + i.quantidade * i.custo_unitario_aplicado, 0)

    const vendaMaterial = calcVenda(custoMaterial, bdiTotal)
    const vendaMaoObra = calcVenda(custoMaoObra, bdiTotal)
    const totalVenda = vendaMaterial + vendaMaoObra

    const dataEmissao = new Date().toLocaleDateString('pt-BR', {
        day: '2-digit', month: 'long', year: 'numeric',
    })

    const temCronograma = cronogramas && cronogramas.length > 0

    const condicoes = [
        'Esta proposta tem validade de 30 dias a partir da data de emissão.',
        'Os valores apresentados estão sujeitos a revisão em caso de alteração de escopo.',
        'O prazo de execução inicia-se após a assinatura do contrato e liberação da obra.',
        'Condições de pagamento a serem definidas em contrato.',
        'Eventuais serviços extras não previstos nesta proposta serão orçados separadamente.',
    ]

    return (
        <Document title={`Orçamento — ${obra.nome}`} author="Rezende & Vidal">
            <Page size="A4" style={styles.page}>

                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerTop}>
                        <View style={styles.brandBlock}>
                            <View style={styles.brandIcon}>
                                <Text style={styles.brandIconText}>R</Text>
                            </View>
                            <View>
                                <Text style={styles.brandName}>Rezende & Vidal</Text>
                                <Text style={styles.brandSub}>Engenharia e Construção</Text>
                            </View>
                        </View>
                        <View style={styles.docLabel}>
                            <Text style={styles.docLabelTitle}>Proposta Comercial</Text>
                            <Text style={styles.docLabelDate}>Emitido em {dataEmissao}</Text>
                        </View>
                    </View>

                    <View style={styles.headerDivider} />

                    <View style={styles.headerBottom}>
                        <View>
                            <Text style={styles.obraName}>{obra.nome}</Text>
                            {obra.endereco ? <Text style={styles.obraEndereco}>{obra.endereco}</Text> : null}
                        </View>
                        {(obra.data_inicio || obra.data_fim) ? (
                            <View style={styles.prazoBlock}>
                                <Text style={styles.prazoLabel}>Prazo previsto</Text>
                                <Text style={styles.prazoValue}>
                                    {formatDate(obra.data_inicio)} → {formatDate(obra.data_fim)}
                                </Text>
                            </View>
                        ) : null}
                    </View>
                </View>

                <View style={styles.accentBar} />

                <View style={styles.miniHeaderAccent} fixed render={({ pageNumber }) => pageNumber === 1 ? null : <View />} />

                {/* Body */}
                <View style={styles.body}>

                    {/* Intro */}
                    <Text style={styles.intro}>
                        {`Apresentamos a seguir a proposta comercial para execução dos serviços referentes à obra "${obra.nome}"${obra.endereco ? `, localizada em ${obra.endereco}` : ''}. Os valores abaixo contemplam todos os materiais, mão de obra e encargos necessários para a conclusão dos serviços conforme escopo acordado.`}
                    </Text>

                    {/* Serviços do cronograma */}
                    {temCronograma && (
                        <View wrap={false}>
                            <Text style={styles.sectionTitle}>Serviços a Executar</Text>
                            <View style={styles.servicosList}>
                                {cronogramas!.map((t, i) => (
                                    <View key={i} style={styles.servicoItem}>
                                        <View style={styles.servicoDot} />
                                        <Text style={styles.servicoText}>{t.tarefa}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Tabela de valores */}
                    <View wrap={false}>
                        <Text style={styles.sectionTitle}>Composição do Orçamento</Text>
                        <View style={styles.table}>
                            <View style={styles.tableHeader}>
                                <View style={styles.colDesc}>
                                    <Text style={styles.tableHeaderText}>Descrição</Text>
                                </View>
                                <View style={styles.colValue}>
                                    <Text style={styles.tableHeaderText}>Valor</Text>
                                </View>
                            </View>

                            <View style={styles.tableRow}>
                                <View style={styles.colDesc}>
                                    <View style={[styles.dot, styles.dotMaterial]} />
                                    <View>
                                        <Text style={styles.itemDesc}>Materiais e Insumos</Text>
                                        <Text style={styles.itemSub}>Fornecimento de todos os materiais necessários à execução</Text>
                                    </View>
                                </View>
                                <View style={styles.colValue}>
                                    <Text style={styles.itemValue}>{formatCurrency(vendaMaterial)}</Text>
                                </View>
                            </View>

                            <View style={styles.tableRow}>
                                <View style={styles.colDesc}>
                                    <View style={[styles.dot, styles.dotMao]} />
                                    <View>
                                        <Text style={styles.itemDesc}>Mão de Obra e Serviços</Text>
                                        <Text style={styles.itemSub}>Execução de todos os serviços e empreitadas contratadas</Text>
                                    </View>
                                </View>
                                <View style={styles.colValue}>
                                    <Text style={styles.itemValue}>{formatCurrency(vendaMaoObra)}</Text>
                                </View>
                            </View>

                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>Total Geral</Text>
                                <Text style={styles.totalValue}>{formatCurrency(totalVenda)}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Info boxes */}
                    <View style={styles.infoGrid} wrap={false}>
                        <View style={styles.infoBox}>
                            <Text style={styles.infoBoxLabel}>Prazo de Execução</Text>
                            <Text style={styles.infoBoxValue}>
                                {obra.data_inicio && obra.data_fim
                                    ? `${formatDate(obra.data_inicio)} até ${formatDate(obra.data_fim)}`
                                    : 'A definir'}
                            </Text>
                            <Text style={styles.infoBoxSub}>Sujeito a condições climáticas e aprovações</Text>
                        </View>
                        <View style={styles.infoBox}>
                            <Text style={styles.infoBoxLabel}>Valor Total da Proposta</Text>
                            <Text style={styles.infoBoxValueAccent}>{formatCurrency(totalVenda)}</Text>
                            <Text style={styles.infoBoxSub}>Inclui materiais, mão de obra e encargos</Text>
                        </View>
                    </View>

                    {/* Condições */}
                    <View wrap={false}>
                        <Text style={styles.sectionTitle}>Condições Gerais</Text>
                        <View style={styles.conditions}>
                            {condicoes.map((c, i) => (
                                <View key={i} style={styles.conditionItem}>
                                    <Text style={styles.conditionDash}>—</Text>
                                    <Text style={styles.conditionText}>{c}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                </View>

                {/* Footer fixo */}
                <View style={styles.footer} fixed>
                    <View>
                        <Text style={styles.footerBrand}>Rezende & Vidal Engenharia</Text>
                        <Text style={styles.footerSub}>Documento gerado pelo sistema interno ERP</Text>
                    </View>
                    <Text style={styles.footerDate}>Emitido em {dataEmissao}</Text>
                </View>

            </Page>
        </Document>
    )
}