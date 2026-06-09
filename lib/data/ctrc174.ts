/**
 * Agregações de Receita de Frete — ssw_extractions (ctrc/174).
 * (CTRCs emitidos, com data por linha — substitui o pré-agregado cliente/203)
 *
 * Colunas relevantes no payload:
 *   numero_ctrc, data_emissao, pagador_nome, pag_cnpj, valor_frete, ...
 *
 * Campo de data canônico: `data_emissao` (dd/mm/yyyy — note 4 dígitos).
 *
 * Para ClienteABC, faz join em memória contra o snapshot atual de cliente/203
 * (que mantém a tabela CNPJ → ABC mesmo sem ter data por linha).
 */

import { getLatestPayloads, getLatestPayloadsInRange } from "./ssw";
import { parseBRL } from "./csvParser";
import { normalizeCnpj } from "./cnpjFormat";
import type { ChartCompareDatum } from "../chartTypes";
import type { DateRange } from "./dateRange";

const PASTA = "ctrc";
const CODIGO = 174;
const DATE_FIELD = "data_emissao";

async function getRows(range: DateRange) {
  return getLatestPayloadsInRange(PASTA, CODIGO, DATE_FIELD, range);
}

/** Dicionário CNPJ → ABC montado a partir do snapshot atual de cliente/203. */
async function getAbcByCnpj(): Promise<Map<string, string>> {
  const rows = await getLatestPayloads("cliente", 203);
  const map = new Map<string, string>();
  for (const r of rows) {
    const cnpj = normalizeCnpj(r["CNPJ"]);
    if (!cnpj) continue;
    const abc = r["ClienteABC"]?.trim();
    if (abc) map.set(cnpj, abc);
  }
  return map;
}

// ---------------------------------------------------------------------------
// FIN_011 — Receita de Frete por ABC
// ---------------------------------------------------------------------------

export async function getReceitaByABC(range: DateRange): Promise<ChartCompareDatum[]> {
  const [rows, abcByCnpj] = await Promise.all([getRows(range), getAbcByCnpj()]);
  const byABC: Record<string, number> = {};

  for (const r of rows) {
    const cnpj = normalizeCnpj(r["pag_cnpj"]);
    const abc = abcByCnpj.get(cnpj) || "Sem ABC";
    const frete = parseBRL(r["valor_frete"] ?? "0");
    byABC[abc] = (byABC[abc] ?? 0) + frete;
  }

  return Object.entries(byABC)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

// ---------------------------------------------------------------------------
// FIN_012 — Top N Clientes por Receita
// ---------------------------------------------------------------------------

export async function getTopClientesByReceita(n: number, range: DateRange): Promise<ChartCompareDatum[]> {
  const rows = await getRows(range);
  const byCliente: Record<string, number> = {};

  for (const r of rows) {
    const cliente = r["pagador_nome"]?.trim() || "Desconhecido";
    const frete = parseBRL(r["valor_frete"] ?? "0");
    byCliente[cliente] = (byCliente[cliente] ?? 0) + frete;
  }

  return Object.entries(byCliente)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, n);
}

// ---------------------------------------------------------------------------
// FIN_013 — Volume de CTRCs por Cliente
// ---------------------------------------------------------------------------

export async function getCtrcsByCliente(n: number, range: DateRange): Promise<ChartCompareDatum[]> {
  const rows = await getRows(range);
  // Cada linha do ctrc_174 = 1 CTRC. Conta por pagador.
  const byCliente: Record<string, number> = {};

  for (const r of rows) {
    const cliente = r["pagador_nome"]?.trim() || "Desconhecido";
    byCliente[cliente] = (byCliente[cliente] ?? 0) + 1;
  }

  return Object.entries(byCliente)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, n);
}

// ---------------------------------------------------------------------------
// KPI_005 — Receita Total de Frete
// ---------------------------------------------------------------------------

export async function getKpiReceitaFrete(range: DateRange): Promise<number> {
  const rows = await getRows(range);
  return rows.reduce((sum, r) => sum + parseBRL(r["valor_frete"] ?? "0"), 0);
}
