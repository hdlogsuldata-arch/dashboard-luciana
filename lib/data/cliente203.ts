/**
 * Agregações de CTRC Mensal por Cliente — cliente_203.csv
 * (CTRCs emitidos no período, agrupados por cliente)
 *
 * Colunas relevantes:
 *   Cliente, CNPJ, ClienteABC, Cidade Cliente, UF Cliente,
 *   Vendedor, UnidOrigem, UnidDestino,
 *   ValorMercadoria, QtdeCTRC, QtdeVolume, M3,
 *   PesoReal, PesoCalc, ValorFrete
 */

import { readCsvAuto, parseBRL, parseIntBR } from "./csvParser";
import type { ChartCompareDatum } from "../chartTypes";

const FILE = "cliente_203.csv";

function getRows(ref?: string) {
  return readCsvAuto(FILE, ref).rows;
}

// ---------------------------------------------------------------------------
// FIN_011 — Receita de Frete por ABC
// ---------------------------------------------------------------------------

export function getReceitaByABC(ref?: string): ChartCompareDatum[] {
  const rows = getRows(ref);
  const byABC: Record<string, number> = {};

  for (const r of rows) {
    const abc = r["ClienteABC"]?.trim() || "Sem ABC";
    const frete = parseBRL(r["ValorFrete"] ?? "0");
    byABC[abc] = (byABC[abc] ?? 0) + frete;
  }

  return Object.entries(byABC)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

// ---------------------------------------------------------------------------
// FIN_012 — Top N Clientes por Receita
// ---------------------------------------------------------------------------

export function getTopClientesByReceita(n = 10, ref?: string): ChartCompareDatum[] {
  const rows = getRows(ref);
  const byCliente: Record<string, number> = {};

  for (const r of rows) {
    const cliente = r["Cliente"]?.trim() || "Desconhecido";
    const frete = parseBRL(r["ValorFrete"] ?? "0");
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

export function getCtrcsByCliente(n = 10, ref?: string): ChartCompareDatum[] {
  const rows = getRows(ref);
  const byCliente: Record<string, number> = {};

  for (const r of rows) {
    const cliente = r["Cliente"]?.trim() || "Desconhecido";
    const qty = parseIntBR(r["QtdeCTRC"] ?? "0");
    byCliente[cliente] = (byCliente[cliente] ?? 0) + qty;
  }

  return Object.entries(byCliente)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, n);
}

// ---------------------------------------------------------------------------
// KPI_005 — Receita Total de Frete
// ---------------------------------------------------------------------------

export function getKpiReceitaFrete(ref?: string): number {
  const rows = getRows(ref);
  return rows.reduce((sum, r) => sum + parseBRL(r["ValorFrete"] ?? "0"), 0);
}
