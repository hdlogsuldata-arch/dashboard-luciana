// Whether a higher or lower KPI value is better — determines meta comparison direction
export const KPI_BETTER_WHEN: Record<string, "higher" | "lower"> = {
  KPI_001: "lower",   // Saldo Total Vencido — menos inadimplência é melhor
  KPI_002: "lower",   // Prazo Médio de Atraso — menos dias de atraso é melhor
  KPI_003: "higher",  // OTD Index — mais entregas no prazo é melhor
  KPI_004: "lower",   // CTRCs a Faturar — pipeline menor (mais ágil) é melhor
  KPI_005: "higher",  // Receita de Frete — mais receita é melhor
  KPI_006: "higher",  // Total da Frota — mais veículos ativos é melhor
  KPI_007: "higher",  // Taxa de Rastreamento — mais rastreados é melhor
};

// Charts where a meta target line (ReferenceLine) makes visual sense.
// Only bar/line charts — donuts don't support ReferenceLine in recharts.
// Same metric unit as the KPI required.
// Maps kpiId → chartId[]
export const KPI_TO_CHART_TARGETS: Record<string, string[]> = {
  // Saldo Total Vencido (brl) → Aging de Inadimplência + Top 10 Devedores
  KPI_001: ["FIN_001", "FIN_002"],

  // Prazo Médio de Atraso (days) → Performance por Cliente + Performance por Estado
  KPI_002: ["OPR_003", "OPR_004"],

  // CTRCs a Faturar (int) → Pipeline por Cliente + CTRCs por Tabela de Cálculo
  KPI_004: ["OPR_006", "OPR_008"],

  // Receita de Frete (brl) → Receita por ABC + Top 10 Clientes por Receita
  KPI_005: ["FIN_011", "FIN_012"],
};

// KPIs whose corresponding chart is a donut — can't draw a ReferenceLine.
// These get a target badge shown in the chart card header instead.
// Maps kpiId → chartId[]
export const KPI_DONUT_BADGE_TARGETS: Record<string, string[]> = {
  KPI_003: ["OPR_001"],  // OTD Index (pct) → On-Time Delivery Rate (donut)
  KPI_007: ["FLT_007"],  // Taxa de Rastreamento (pct) → Taxa de Rastreamento (donut)
};
