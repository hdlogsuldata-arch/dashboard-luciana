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

// Charts where a meta target line makes visual sense (bar charts with same unit as KPI)
// Maps kpiId → chartId[]
export const KPI_TO_CHART_TARGETS: Record<string, string[]> = {
  KPI_002: ["OPR_003"], // Prazo Médio de Atraso (days) → Performance por Cliente (days)
};
