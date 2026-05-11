/**
 * Agregações de Contas a Receber — caixa_240.csv
 * (Faturas vencidas / inadimplência)
 *
 * Colunas relevantes:
 *   Fatura, Emissao, CNPJ pagador, Nome pagador, ClienteABC,
 *   Cidade pagador, UF pagador, UnidResp, Vendedor, Banco,
 *   Valor, Vencimento, DiasAtraso, Saldo
 */

import { readCsvAuto, parseBRL, parseIntBR } from "./csvParser";
import type { ChartCompareDatum } from "../chartTypes";

const FILE = "caixa_240.csv";

function getRows(ref?: string) {
  return readCsvAuto(FILE, ref).rows;
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

export function getAgingBuckets(ref?: string): ChartCompareDatum[] {
  const rows = getRows(ref);
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

export function getTopDebtors(n = 10, ref?: string): ChartCompareDatum[] {
  const rows = getRows(ref);
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

export function getByABC(ref?: string): ChartCompareDatum[] {
  const rows = getRows(ref);
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

export function getByUnidade(ref?: string): ChartCompareDatum[] {
  const rows = getRows(ref);
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

export function getByUF(ref?: string): ChartCompareDatum[] {
  const rows = getRows(ref);
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

export function getByBanco(ref?: string): ChartCompareDatum[] {
  const rows = getRows(ref);
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

export function getKpiSaldoTotal(ref?: string): number {
  const rows = getRows(ref);
  return rows.reduce((sum, r) => sum + parseBRL(r["Saldo"] ?? "0"), 0);
}

// ---------------------------------------------------------------------------
// KPI_002 — Prazo Médio de Atraso (dias)
// ---------------------------------------------------------------------------

export function getKpiPrazoMedio(ref?: string): number {
  const rows = getRows(ref);
  if (rows.length === 0) return 0;
  const total = rows.reduce((sum, r) => sum + parseIntBR(r["DiasAtraso"] ?? "0"), 0);
  return Math.round(total / rows.length);
}
