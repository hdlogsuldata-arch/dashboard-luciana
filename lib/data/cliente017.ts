/**
 * Agregações de Performance de Entregas — ssw_extractions (cliente/17).
 * (CTRCs entregues e sua performance)
 *
 * Colunas relevantes no payload:
 *   CTRC, TIPO DOCUMENTO, NF, DATA AUTORIZACAO,
 *   CNPJ REMETENTE, REMETENTE, CNPJ PAGADOR, PAGADOR, ABC,
 *   CNPJ DESTINATARIO, DESTINATARIO, CIDADE DESTINO, UF DESTINO,
 *   UNIDADE DESTINO, DATA PREVENTR, DATA ENTREGA,
 *   PERFORMANCE, RESP CLIENTE
 *
 * PERFORMANCE: número de dias (negativo = antecipado, positivo = atrasado, 0 = no prazo)
 * RESP CLIENTE: "SIM" se o atraso é responsabilidade do cliente, "NAO" se da transportadora
 *
 * Campo de data canônico: `DATA AUTORIZACAO` (dd/mm/yy).
 */

import { getLatestPayloadsInRange } from "./ssw";
import { getExclusionSet } from "./cnpjExcluido";
import { normalizeCnpj } from "./cnpjFormat";
import type { ChartCompareDatum } from "../chartTypes";
import type { DateRange } from "./dateRange";

const PASTA = "cliente";
const CODIGO = 17;
const DATE_FIELD = "DATA AUTORIZACAO";

async function getRows(range: DateRange) {
  const [rows, exclusion] = await Promise.all([
    getLatestPayloadsInRange(PASTA, CODIGO, DATE_FIELD, range),
    getExclusionSet(),
  ]);
  if (exclusion.cnpjs.size === 0) return rows;
  return rows.filter((r) => !exclusion.cnpjs.has(normalizeCnpj(r["CNPJ PAGADOR"])));
}

function parsePerformance(s: string): number {
  const n = parseInt(s?.trim() ?? "0", 10);
  return Number.isFinite(n) ? n : 0;
}

// ---------------------------------------------------------------------------
// OPR_001 — On-Time Delivery Rate
// ---------------------------------------------------------------------------

export async function getOTDRate(range: DateRange): Promise<ChartCompareDatum[]> {
  const rows = await getRows(range);
  let noPrazo = 0;
  let antecipado = 0;
  let atrasado = 0;

  for (const r of rows) {
    const perf = parsePerformance(r["PERFORMANCE"] ?? "0");
    if (perf < 0) antecipado++;
    else if (perf === 0) noPrazo++;
    else atrasado++;
  }

  return [
    { name: "No Prazo", value: noPrazo },
    { name: "Antecipado", value: antecipado },
    { name: "Atrasado", value: atrasado },
  ];
}

// ---------------------------------------------------------------------------
// OPR_002 — Distribuição de Performance (histograma por faixas de dias)
// ---------------------------------------------------------------------------

export async function getPerformanceDistribution(range: DateRange): Promise<ChartCompareDatum[]> {
  const rows = await getRows(range);
  const buckets: Record<string, number> = {
    "≤ -3 dias": 0,
    "-2 dias": 0,
    "-1 dia": 0,
    "No prazo": 0,
    "+1 dia": 0,
    "+2 dias": 0,
    "≥ +3 dias": 0,
  };

  for (const r of rows) {
    const perf = parsePerformance(r["PERFORMANCE"] ?? "0");
    if (perf <= -3) buckets["≤ -3 dias"]++;
    else if (perf === -2) buckets["-2 dias"]++;
    else if (perf === -1) buckets["-1 dia"]++;
    else if (perf === 0) buckets["No prazo"]++;
    else if (perf === 1) buckets["+1 dia"]++;
    else if (perf === 2) buckets["+2 dias"]++;
    else buckets["≥ +3 dias"]++;
  }

  return Object.entries(buckets).map(([name, value]) => ({ name, value }));
}

// ---------------------------------------------------------------------------
// OPR_003 — Performance por Cliente (média de dias por pagador)
// ---------------------------------------------------------------------------

export async function getPerformanceByCliente(n: number, range: DateRange): Promise<ChartCompareDatum[]> {
  const rows = await getRows(range);
  const sums: Record<string, { total: number; count: number }> = {};

  for (const r of rows) {
    const cliente = r["PAGADOR"]?.trim() || "Desconhecido";
    const perf = parsePerformance(r["PERFORMANCE"] ?? "0");
    if (!sums[cliente]) sums[cliente] = { total: 0, count: 0 };
    sums[cliente].total += perf;
    sums[cliente].count++;
  }

  return Object.entries(sums)
    .map(([name, { total, count }]) => ({
      name,
      value: parseFloat((total / count).toFixed(1)),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, n);
}

// ---------------------------------------------------------------------------
// OPR_004 — Performance por Estado de Destino
// ---------------------------------------------------------------------------

export async function getPerformanceByUF(range: DateRange): Promise<ChartCompareDatum[]> {
  const rows = await getRows(range);
  const sums: Record<string, { total: number; count: number }> = {};

  for (const r of rows) {
    const uf = r["UF DESTINO"]?.trim() || "Sem UF";
    const perf = parsePerformance(r["PERFORMANCE"] ?? "0");
    if (!sums[uf]) sums[uf] = { total: 0, count: 0 };
    sums[uf].total += perf;
    sums[uf].count++;
  }

  return Object.entries(sums)
    .map(([name, { total, count }]) => ({
      name,
      value: parseFloat((total / count).toFixed(1)),
    }))
    .sort((a, b) => b.value - a.value);
}

// ---------------------------------------------------------------------------
// OPR_005 — Motivo de Não Entrega (responsabilidade)
// ---------------------------------------------------------------------------

export async function getMotivoNaoEntrega(range: DateRange): Promise<ChartCompareDatum[]> {
  const rows = await getRows(range);
  let respCliente = 0;
  let respTransportadora = 0;

  for (const r of rows) {
    const perf = parsePerformance(r["PERFORMANCE"] ?? "0");
    if (perf <= 0) continue;
    const resp = r["RESP CLIENTE"]?.trim().toUpperCase();
    if (resp === "SIM") respCliente++;
    else respTransportadora++;
  }

  return [
    { name: "Responsabilidade do Cliente", value: respCliente },
    { name: "Responsabilidade da Transportadora", value: respTransportadora },
  ];
}

// ---------------------------------------------------------------------------
// KPI_003 — OTD Index (fração 0-1)
// ---------------------------------------------------------------------------

export async function getKpiOTD(range: DateRange): Promise<number> {
  const rows = await getRows(range);
  if (rows.length === 0) return 0;
  const noPrazoOuAntes = rows.filter(
    (r) => parsePerformance(r["PERFORMANCE"] ?? "0") <= 0,
  ).length;
  return noPrazoOuAntes / rows.length;
}
