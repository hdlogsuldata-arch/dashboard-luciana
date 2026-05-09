/**
 * CHART REGISTRY — HDLOG Dashboard
 *
 * Este arquivo é o CONTRATO entre o sistema de gráficos e o CRUD de atribuição.
 *
 * Para o colega que fará o CRUD:
 *   - Itere CHART_REGISTRY para listar gráficos disponíveis (com seção e descrição)
 *   - Use CHART_IDS para referenciar gráficos de forma type-safe no código
 *   - Itere KPI_REGISTRY para listar KPIs disponíveis para os 4 slots da home
 *   - Use KPI_IDS da mesma forma
 *
 * Para adicionar um novo gráfico/KPI no futuro:
 *   - Adicione a entrada no objeto de IDs e no array de registry
 *   - Nenhuma outra mudança é necessária no ChartCard ou KpiCard
 */

import type { ChartMetadata, KpiMetadata } from "./types";

// ---------------------------------------------------------------------------
// CHART IDs
// ---------------------------------------------------------------------------

export const CHART_IDS = {
  // Financeiro — Contas a Receber (caixa_240)
  FIN_001: "FIN_001", // Aging de Inadimplência
  FIN_002: "FIN_002", // Top 10 Devedores
  FIN_003: "FIN_003", // Inadimplência por Classificação ABC
  FIN_004: "FIN_004", // Inadimplência por Unidade Responsável
  FIN_005: "FIN_005", // Inadimplência por Estado
  FIN_006: "FIN_006", // Distribuição por Banco/Carteira

  // Financeiro — Contas a Pagar (caixa_202)
  FIN_007: "FIN_007", // Despesas por Categoria
  FIN_008: "FIN_008", // Top 10 Fornecedores
  FIN_009: "FIN_009", // Despesas por Unidade Pagadora
  FIN_010: "FIN_010", // Status de Pagamentos

  // Financeiro — Receita de Frete (cliente_203)
  FIN_011: "FIN_011", // Receita de Frete por Classificação ABC
  FIN_012: "FIN_012", // Top 10 Clientes por Receita
  FIN_013: "FIN_013", // Volume de CTRCs por Cliente

  // Operacional — Performance de Entregas (cliente_017)
  OPR_001: "OPR_001", // On-Time Delivery Rate
  OPR_002: "OPR_002", // Distribuição de Performance (histograma)
  OPR_003: "OPR_003", // Performance por Cliente
  OPR_004: "OPR_004", // Performance por Estado de Destino
  OPR_005: "OPR_005", // Motivo de Não Entrega no Prazo

  // Operacional — Pipeline de Faturamento (ctrc_231)
  OPR_006: "OPR_006", // Pipeline de Faturamento por Cliente
  OPR_008: "OPR_008", // CTRCs por Última Ocorrência

  // Frota — Composição (tabelas_245)
  FLT_001: "FLT_001", // Composição da Frota por Tipo
  FLT_002: "FLT_002", // Frota Própria vs Agregado vs Carreteiro
  FLT_003: "FLT_003", // Distribuição por Fabricante
  FLT_004: "FLT_004", // Idade da Frota (ano de fabricação)
  FLT_005: "FLT_005", // Frota por Tipo de Combustível

  // Frota — Operação (tabelas_245)
  FLT_006: "FLT_006", // Localização Atual da Frota por Unidade
  FLT_007: "FLT_007", // Taxa de Rastreamento
  FLT_008: "FLT_008", // Vencimento de Seguros por Mês
  FLT_009: "FLT_009", // Capacidade Total por Tipo de Veículo
  FLT_010: "FLT_010", // Hodômetro Médio por Tipo
} as const;

export type ChartId = (typeof CHART_IDS)[keyof typeof CHART_IDS];

// ---------------------------------------------------------------------------
// CHART REGISTRY
// ---------------------------------------------------------------------------

export const CHART_REGISTRY: ChartMetadata[] = [
  // ── Financeiro / Contas a Receber ──────────────────────────────────────
  {
    id: CHART_IDS.FIN_001,
    title: "Aging de Inadimplência",
    section: "financeiro",
    defaultType: "bar",
    supportedTypes: ["bar", "donut", "line"],
    dataSource: "caixa_240",
    apiEndpoint: "/api/charts/financeiro",
    metricFormat: "brl",
    description: "Saldo vencido distribuído por faixa de atraso (0–30d, 31–60d, 61–90d, 91–180d, >180d)",
  },
  {
    id: CHART_IDS.FIN_002,
    title: "Top 10 Devedores",
    section: "financeiro",
    defaultType: "bar",
    supportedTypes: ["bar"],
    dataSource: "caixa_240",
    apiEndpoint: "/api/charts/financeiro",
    metricFormat: "brl",
    description: "Clientes com maior saldo devedor em aberto",
  },
  {
    id: CHART_IDS.FIN_003,
    title: "Inadimplência por ABC",
    section: "financeiro",
    defaultType: "bar",
    supportedTypes: ["bar", "donut"],
    dataSource: "caixa_240",
    apiEndpoint: "/api/charts/financeiro",
    metricFormat: "brl",
    description: "Saldo vencido agrupado por classificação ABC do cliente",
  },
  {
    id: CHART_IDS.FIN_004,
    title: "Inadimplência por Unidade",
    section: "financeiro",
    defaultType: "bar",
    supportedTypes: ["bar", "donut"],
    dataSource: "caixa_240",
    apiEndpoint: "/api/charts/financeiro",
    metricFormat: "brl",
    description: "Saldo vencido por unidade responsável pela cobrança",
  },
  {
    id: CHART_IDS.FIN_005,
    title: "Inadimplência por Estado",
    section: "financeiro",
    defaultType: "bar",
    supportedTypes: ["bar"],
    dataSource: "caixa_240",
    apiEndpoint: "/api/charts/financeiro",
    metricFormat: "brl",
    description: "Saldo vencido por UF do pagador",
  },
  {
    id: CHART_IDS.FIN_006,
    title: "Distribuição por Banco",
    section: "financeiro",
    defaultType: "donut",
    supportedTypes: ["donut", "bar"],
    dataSource: "caixa_240",
    apiEndpoint: "/api/charts/financeiro",
    metricFormat: "brl",
    description: "Como os títulos vencidos estão distribuídos por banco/carteira",
  },

  // ── Financeiro / Contas a Pagar ────────────────────────────────────────
  {
    id: CHART_IDS.FIN_007,
    title: "Despesas por Categoria",
    section: "financeiro",
    defaultType: "bar",
    supportedTypes: ["bar", "donut", "line"],
    dataSource: "caixa_202",
    apiEndpoint: "/api/charts/financeiro",
    metricFormat: "brl",
    description: "Gastos distribuídos por tipo de evento (combustível, pedágio, manutenção...)",
  },
  {
    id: CHART_IDS.FIN_008,
    title: "Top 10 Fornecedores",
    section: "financeiro",
    defaultType: "bar",
    supportedTypes: ["bar"],
    dataSource: "caixa_202",
    apiEndpoint: "/api/charts/financeiro",
    metricFormat: "brl",
    description: "Fornecedores com maior volume de pagamentos no período",
  },
  {
    id: CHART_IDS.FIN_009,
    title: "Despesas por Unidade",
    section: "financeiro",
    defaultType: "bar",
    supportedTypes: ["bar", "donut"],
    dataSource: "caixa_202",
    apiEndpoint: "/api/charts/financeiro",
    metricFormat: "brl",
    description: "Distribuição de despesas por unidade pagadora",
  },
  {
    id: CHART_IDS.FIN_010,
    title: "Status de Pagamentos",
    section: "financeiro",
    defaultType: "donut",
    supportedTypes: ["donut", "bar"],
    dataSource: "caixa_202",
    apiEndpoint: "/api/charts/financeiro",
    metricFormat: "int",
    description: "Proporção de pagamentos realizados vs pendentes no período",
  },

  // ── Financeiro / Receita de Frete ──────────────────────────────────────
  {
    id: CHART_IDS.FIN_011,
    title: "Receita de Frete por ABC",
    section: "financeiro",
    defaultType: "bar",
    supportedTypes: ["bar", "donut"],
    dataSource: "cliente_203",
    apiEndpoint: "/api/charts/financeiro",
    metricFormat: "brl",
    description: "Receita de frete agrupada por classificação ABC do cliente",
  },
  {
    id: CHART_IDS.FIN_012,
    title: "Top 10 Clientes por Receita",
    section: "financeiro",
    defaultType: "bar",
    supportedTypes: ["bar", "line"],
    dataSource: "cliente_203",
    apiEndpoint: "/api/charts/financeiro",
    metricFormat: "brl",
    description: "Clientes que mais geraram receita de frete no período",
  },
  {
    id: CHART_IDS.FIN_013,
    title: "Volume de CTRCs por Cliente",
    section: "financeiro",
    defaultType: "bar",
    supportedTypes: ["bar"],
    dataSource: "cliente_203",
    apiEndpoint: "/api/charts/financeiro",
    metricFormat: "int",
    description: "Quantidade de CTRCs emitidos por cliente no período",
  },

  // ── Operacional / Performance de Entregas ──────────────────────────────
  {
    id: CHART_IDS.OPR_001,
    title: "On-Time Delivery Rate",
    section: "operacional",
    defaultType: "donut",
    supportedTypes: ["donut", "bar", "line"],
    dataSource: "cliente_017",
    apiEndpoint: "/api/charts/operacional",
    metricFormat: "int",
    description: "Proporção de entregas no prazo, antecipadas e em atraso",
  },
  {
    id: CHART_IDS.OPR_002,
    title: "Distribuição de Performance",
    section: "operacional",
    defaultType: "bar",
    supportedTypes: ["bar"],
    dataSource: "cliente_017",
    apiEndpoint: "/api/charts/operacional",
    metricFormat: "int",
    description: "Histograma de dias de atraso/antecipação nas entregas",
  },
  {
    id: CHART_IDS.OPR_003,
    title: "Performance por Cliente",
    section: "operacional",
    defaultType: "bar",
    supportedTypes: ["bar"],
    dataSource: "cliente_017",
    apiEndpoint: "/api/charts/operacional",
    metricFormat: "days",
    description: "Média de dias de atraso por cliente pagador",
  },
  {
    id: CHART_IDS.OPR_004,
    title: "Performance por Estado",
    section: "operacional",
    defaultType: "bar",
    supportedTypes: ["bar"],
    dataSource: "cliente_017",
    apiEndpoint: "/api/charts/operacional",
    metricFormat: "days",
    description: "Média de performance de entrega por UF de destino",
  },
  {
    id: CHART_IDS.OPR_005,
    title: "Motivo de Não Entrega",
    section: "operacional",
    defaultType: "donut",
    supportedTypes: ["donut", "bar"],
    dataSource: "cliente_017",
    apiEndpoint: "/api/charts/operacional",
    metricFormat: "int",
    description: "Responsabilidade pelo atraso: transportadora vs cliente",
  },

  // ── Operacional / Pipeline de Faturamento ──────────────────────────────
  {
    id: CHART_IDS.OPR_006,
    title: "CTRCs a Faturar por Cliente",
    section: "operacional",
    defaultType: "bar",
    supportedTypes: ["bar"],
    dataSource: "ctrc_231",
    apiEndpoint: "/api/charts/operacional",
    metricFormat: "int",
    description: "Quantidade de CTRCs disponíveis para faturamento por cliente",
  },
  {
    id: CHART_IDS.OPR_008,
    title: "CTRCs por Tabela de Cálculo",
    section: "operacional",
    defaultType: "bar",
    supportedTypes: ["bar"],
    dataSource: "ctrc_231",
    apiEndpoint: "/api/charts/operacional",
    metricFormat: "int",
    description: "Distribuição dos CTRCs a faturar por tabela de cálculo aplicada",
  },

  // ── Frota / Composição ────────────────────────────────────────────────
  {
    id: CHART_IDS.FLT_001,
    title: "Composição da Frota por Tipo",
    section: "frota",
    defaultType: "donut",
    supportedTypes: ["donut", "bar"],
    dataSource: "tabelas_245",
    apiEndpoint: "/api/charts/frota",
    metricFormat: "int",
    description: "Distribuição da frota por tipo de veículo (TRUCK, TOCO, CARRETA, CAVALO...)",
  },
  {
    id: CHART_IDS.FLT_002,
    title: "Frota Própria vs Terceiros",
    section: "frota",
    defaultType: "donut",
    supportedTypes: ["donut", "bar"],
    dataSource: "tabelas_245",
    apiEndpoint: "/api/charts/frota",
    metricFormat: "int",
    description: "Proporção entre veículos próprios, agregados e carreteiros",
  },
  {
    id: CHART_IDS.FLT_003,
    title: "Distribuição por Fabricante",
    section: "frota",
    defaultType: "bar",
    supportedTypes: ["bar", "donut"],
    dataSource: "tabelas_245",
    apiEndpoint: "/api/charts/frota",
    metricFormat: "int",
    description: "Quantidade de veículos por fabricante (Mercedes, Volvo, VW...)",
  },
  {
    id: CHART_IDS.FLT_004,
    title: "Idade da Frota",
    section: "frota",
    defaultType: "bar",
    supportedTypes: ["bar"],
    dataSource: "tabelas_245",
    apiEndpoint: "/api/charts/frota",
    metricFormat: "int",
    description: "Distribuição dos veículos por ano de fabricação",
  },
  {
    id: CHART_IDS.FLT_005,
    title: "Frota por Combustível",
    section: "frota",
    defaultType: "donut",
    supportedTypes: ["donut", "bar"],
    dataSource: "tabelas_245",
    apiEndpoint: "/api/charts/frota",
    metricFormat: "int",
    description: "Proporção de veículos por tipo de combustível (Diesel, GNV, Gasolina)",
  },

  // ── Frota / Operação ──────────────────────────────────────────────────
  {
    id: CHART_IDS.FLT_006,
    title: "Localização Atual da Frota",
    section: "frota",
    defaultType: "bar",
    supportedTypes: ["bar"],
    dataSource: "tabelas_245",
    apiEndpoint: "/api/charts/frota",
    metricFormat: "int",
    description: "Quantidade de veículos por unidade onde está registrado o último movimento",
  },
  {
    id: CHART_IDS.FLT_007,
    title: "Taxa de Rastreamento",
    section: "frota",
    defaultType: "donut",
    supportedTypes: ["donut", "bar"],
    dataSource: "tabelas_245",
    apiEndpoint: "/api/charts/frota",
    metricFormat: "int",
    description: "Proporção de veículos com rastreador ativo vs sem rastreamento",
  },
  {
    id: CHART_IDS.FLT_008,
    title: "Vencimento de Seguros",
    section: "frota",
    defaultType: "bar",
    supportedTypes: ["bar"],
    dataSource: "tabelas_245",
    apiEndpoint: "/api/charts/frota",
    metricFormat: "int",
    description: "Quantidade de seguros vencendo por mês — alerta para renovações",
  },
  {
    id: CHART_IDS.FLT_009,
    title: "Capacidade por Tipo",
    section: "frota",
    defaultType: "bar",
    supportedTypes: ["bar"],
    dataSource: "tabelas_245",
    apiEndpoint: "/api/charts/frota",
    metricFormat: "m3",
    description: "Capacidade total (m³) disponível por tipo de veículo",
  },
  {
    id: CHART_IDS.FLT_010,
    title: "Hodômetro Médio por Tipo",
    section: "frota",
    defaultType: "bar",
    supportedTypes: ["bar"],
    dataSource: "tabelas_245",
    apiEndpoint: "/api/charts/frota",
    metricFormat: "km",
    description: "Quilometragem média registrada por tipo de veículo — proxy de desgaste",
  },
];

// ---------------------------------------------------------------------------
// KPI IDs
// ---------------------------------------------------------------------------

export const KPI_IDS = {
  KPI_001: "KPI_001", // Saldo Total Vencido (R$)
  KPI_002: "KPI_002", // Prazo Médio de Atraso (dias)
  KPI_003: "KPI_003", // OTD Index (%)
  KPI_004: "KPI_004", // Total a Faturar (R$)
  KPI_005: "KPI_005", // Receita Total de Frete (R$)
  KPI_006: "KPI_006", // Total da Frota (qtd)
  KPI_007: "KPI_007", // Taxa de Rastreamento (%)
} as const;

export type KpiId = (typeof KPI_IDS)[keyof typeof KPI_IDS];

// ---------------------------------------------------------------------------
// KPI REGISTRY
// ---------------------------------------------------------------------------

export const KPI_REGISTRY: KpiMetadata[] = [
  {
    id: KPI_IDS.KPI_001,
    title: "Saldo Total Vencido",
    section: "financeiro",
    format: "brl",
    apiSource: "financeiro",
    description: "Soma de todos os saldos de faturas vencidas (caixa_240). Indica o total de inadimplência.",
    accentColor: "#EF4444",
  },
  {
    id: KPI_IDS.KPI_002,
    title: "Prazo Médio de Atraso",
    section: "financeiro",
    format: "days",
    apiSource: "financeiro",
    description: "Média de dias de atraso das faturas vencidas (caixa_240). Indica gravidade da inadimplência.",
    accentColor: "#F59E0B",
  },
  {
    id: KPI_IDS.KPI_003,
    title: "OTD Index",
    section: "operacional",
    format: "pct",
    apiSource: "operacional",
    description: "% de CTRCs entregues no prazo ou antes do previsto (cliente_017). Meta: quanto maior, melhor.",
    accentColor: "#10B981",
  },
  {
    id: KPI_IDS.KPI_004,
    title: "CTRCs a Faturar",
    section: "operacional",
    format: "int",
    apiSource: "operacional",
    description: "Quantidade de CTRCs disponíveis para faturamento (ctrc_231).",
    accentColor: "#F3DE3D",
  },
  {
    id: KPI_IDS.KPI_005,
    title: "Receita de Frete",
    section: "financeiro",
    format: "brl",
    apiSource: "financeiro",
    description: "Receita total de frete emitida no período de referência (cliente_203).",
    accentColor: "#F3DE3D",
  },
  {
    id: KPI_IDS.KPI_006,
    title: "Total da Frota",
    section: "frota",
    format: "int",
    apiSource: "frota",
    description: "Quantidade total de veículos cadastrados e ativos (tabelas_245).",
    accentColor: "#3B82F6",
  },
  {
    id: KPI_IDS.KPI_007,
    title: "Taxa de Rastreamento",
    section: "frota",
    format: "pct",
    apiSource: "frota",
    description: "% de veículos com rastreador ativo (tabelas_245). Indica cobertura de monitoramento.",
    accentColor: "#10B981",
  },
];

// ---------------------------------------------------------------------------
// KPIs padrão para novos usuários (posições 1–4)
// ---------------------------------------------------------------------------

export const DEFAULT_KPI_SLOTS: Array<{ position: 1 | 2 | 3 | 4; kpiId: KpiId }> = [
  { position: 1, kpiId: KPI_IDS.KPI_001 }, // Saldo Vencido — financeiro, alerta
  { position: 2, kpiId: KPI_IDS.KPI_003 }, // OTD Index    — operacional, saúde
  { position: 3, kpiId: KPI_IDS.KPI_004 }, // A Faturar    — pipeline, oportunidade
  { position: 4, kpiId: KPI_IDS.KPI_005 }, // Receita      — visão geral
];
