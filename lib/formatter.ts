// Funções de formatação de números para pt-BR
// Adaptado do dash-mkt para o dashboard HDLOG

export type MetricUnit = "brl" | "pct" | "int" | "days" | "km" | "m3";

function safeFinite(n: any) {
  const x = Number(n);
  return Number.isFinite(x) ? x : 0;
}

function formatNumberPtBr(
  n: number,
  opts?: { minFrac?: number; maxFrac?: number; useGrouping?: boolean },
) {
  const { minFrac = 0, maxFrac = 2, useGrouping = true } = opts ?? {};
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: minFrac,
    maximumFractionDigits: maxFrac,
    useGrouping,
  }).format(n);
}

export function formatBRL(n: number) {
  const x = safeFinite(n);
  return `R$ ${formatNumberPtBr(x, { minFrac: 2, maxFrac: 2 })}`;
}

export function formatInt(n: number) {
  const x = Math.round(safeFinite(n));
  return formatNumberPtBr(x, { minFrac: 0, maxFrac: 0 });
}

/** Espera fração (0.856 → "85,60%") */
export function formatPct(frac: number) {
  const x = safeFinite(frac) * 100;
  return `${formatNumberPtBr(x, { minFrac: 1, maxFrac: 1 })}%`;
}

/** Formata dias inteiros (127 → "127 dias") */
export function formatDays(n: number) {
  const x = Math.round(safeFinite(n));
  return `${formatNumberPtBr(x, { minFrac: 0, maxFrac: 0 })} dias`;
}

/** Quilometragem (85000 → "85.000 km") */
export function formatKm(n: number) {
  const x = Math.round(safeFinite(n));
  return `${formatNumberPtBr(x, { minFrac: 0, maxFrac: 0 })} km`;
}

/** Metros cúbicos (45.5 → "45,50 m³") */
export function formatM3(n: number) {
  const x = safeFinite(n);
  return `${formatNumberPtBr(x, { minFrac: 2, maxFrac: 2 })} m³`;
}

export const unitFormatter: Record<MetricUnit, (n: number) => string> = {
  brl:  formatBRL,
  pct:  formatPct,
  int:  formatInt,
  days: formatDays,
  km:   formatKm,
  m3:   formatM3,
};

export function safeNum(x: any): number {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}
