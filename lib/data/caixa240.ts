/**
 * Agregações de Contas a Receber — ssw_extractions (caixa/240).
 * (Faturas vencidas / inadimplência)
 *
 * Colunas relevantes no payload:
 *   Fatura, Emissao, CNPJ pagador, Nome pagador, ClienteABC,
 *   Cidade pagador, UF pagador, UnidResp, Vendedor, Banco,
 *   Valor, Vencimento, DiasAtraso, Saldo
 *
 * Campo de data canônico: `Emissao` (dd/mm/yy).
 */

import { getLatestPayloadsInRange } from "./ssw";
import { parseBRL, parseIntBR } from "./csvParser";
import { getExclusionSet } from "./cnpjExcluido";
import { normalizeCnpj } from "./cnpjFormat";
import type { ChartCompareDatum } from "../chartTypes";
import type { DateRange } from "./dateRange";

const PASTA = "caixa";
const CODIGO = 240;
const DATE_FIELD = "Emissao";

async function getRows(range: DateRange) {
  const [rows, exclusion] = await Promise.all([
    getLatestPayloadsInRange(PASTA, CODIGO, DATE_FIELD, range),
    getExclusionSet(),
  ]);
  if (exclusion.cnpjs.size === 0) return rows;
  return rows.filter((r) => !exclusion.cnpjs.has(normalizeCnpj(r["CNPJ pagador"])));
}

// ---------------------------------------------------------------------------
// FIN_001 — Aging de Inadimplência
// ---------------------------------------------------------------------------

const AGING_BUCKETS = [
  { label: "1-30 dias",   min: 1,   max: 30 },
  { label: "31-60 dias",  min: 31,  max: 60 },
  { label: "61-90 dias",  min: 61,  max: 90 },
  { label: "91-180 dias", min: 91,  max: 180 },
  { label: "> 180 dias",  min: 181, max: Infinity },
];

export async function getAgingBuckets(range: DateRange): Promise<ChartCompareDatum[]> {
  const rows = await getRows(range);
  const totals: Record<string, number> = {};
  AGING_BUCKETS.forEach((b) => (totals[b.label] = 0));

  for (const r of rows) {
    const days = parseIntBR(r["DiasAtraso"] ?? "0");
    const saldo = parseBRL(r["Saldo"] ?? "0");
    const bucket = AGING_BUCKETS.find((b) => days >= b.min && days <= b.max);
    if (bucket) totals[bucket.label] += saldo;
  }

  return AGING_BUCKETS.map((b) => ({ name: b.label, value: totals[b.label] }));
}

// ---------------------------------------------------------------------------
// FIN_002 — Top N Devedores
// ---------------------------------------------------------------------------

export async function getTopDebtors(n: number, range: DateRange): Promise<ChartCompareDatum[]> {
  const rows = await getRows(range);
  const byClient: Record<string, number> = {};

  for (const r of rows) {
    const name = r["Nome pagador"]?.trim() || "Desconhecido";
    const saldo = parseBRL(r["Saldo"] ?? "0");
    byClient[name] = (byClient[name] ?? 0) + saldo;
  }

  return Object.entries(byClient)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, n);
}

// ---------------------------------------------------------------------------
// FIN_003 — Por Classificação ABC
// ---------------------------------------------------------------------------

export async function getByABC(range: DateRange): Promise<ChartCompareDatum[]> {
  const rows = await getRows(range);
  const byABC: Record<string, number> = {};

  for (const r of rows) {
    const abc = r["ClienteABC"]?.trim() || "Sem ABC";
    const saldo = parseBRL(r["Saldo"] ?? "0");
    byABC[abc] = (byABC[abc] ?? 0) + saldo;
  }

  return Object.entries(byABC)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

// ---------------------------------------------------------------------------
// FIN_004 — Por Unidade Responsável
// ---------------------------------------------------------------------------

export async function getByUnidade(range: DateRange): Promise<ChartCompareDatum[]> {
  const rows = await getRows(range);
  const byUnid: Record<string, number> = {};

  for (const r of rows) {
    const unid = r["UnidResp"]?.trim() || "Sem Unidade";
    const saldo = parseBRL(r["Saldo"] ?? "0");
    byUnid[unid] = (byUnid[unid] ?? 0) + saldo;
  }

  return Object.entries(byUnid)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

// ---------------------------------------------------------------------------
// FIN_005 — Por Estado (UF)
// ---------------------------------------------------------------------------

export async function getByUF(range: DateRange): Promise<ChartCompareDatum[]> {
  const rows = await getRows(range);
  const byUF: Record<string, number> = {};

  for (const r of rows) {
    const uf = r["UF pagador"]?.trim() || "Sem UF";
    const saldo = parseBRL(r["Saldo"] ?? "0");
    byUF[uf] = (byUF[uf] ?? 0) + saldo;
  }

  return Object.entries(byUF)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

// ---------------------------------------------------------------------------
// FIN_006 — Por Banco/Carteira
// ---------------------------------------------------------------------------

export async function getByBanco(range: DateRange): Promise<ChartCompareDatum[]> {
  const rows = await getRows(range);
  const byBanco: Record<string, number> = {};

  for (const r of rows) {
    const banco = r["Banco"]?.trim() || "Carteira";
    const saldo = parseBRL(r["Saldo"] ?? "0");
    byBanco[banco] = (byBanco[banco] ?? 0) + saldo;
  }

  return Object.entries(byBanco)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

// ---------------------------------------------------------------------------
// KPI_001 — Saldo Total Vencido
// ---------------------------------------------------------------------------

export async function getKpiSaldoTotal(range: DateRange): Promise<number> {
  const rows = await getRows(range);
  return rows.reduce((sum, r) => sum + parseBRL(r["Saldo"] ?? "0"), 0);
}

// ---------------------------------------------------------------------------
// KPI_002 — Prazo Médio de Atraso (dias)
// ---------------------------------------------------------------------------

export async function getKpiPrazoMedio(range: DateRange): Promise<number> {
  const rows = await getRows(range);
  if (rows.length === 0) return 0;
  const total = rows.reduce((sum, r) => sum + parseIntBR(r["DiasAtraso"] ?? "0"), 0);
  return Math.round(total / rows.length);
}
