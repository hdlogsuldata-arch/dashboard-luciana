/**
 * Agregações de Contas a Pagar — caixa_202.csv
 * (Pagamentos a fornecedores)
 *
 * Colunas relevantes:
 *   NumLancto, UnidPagadora, Fornecedor, Evento,
 *   ValorParcela, DataVencimento, DataPagamento, DataConciliacao
 */

import { readCsvAuto, parseBRL } from "./csvParser";
import type { ChartCompareDatum } from "../chartTypes";

const FILE = "caixa_202.csv";

function getRows(ref?: string) {
  return readCsvAuto(FILE, ref).rows;
}

// ---------------------------------------------------------------------------
// FIN_007 — Despesas por Categoria (Evento)
// ---------------------------------------------------------------------------

export function getByEvento(ref?: string): ChartCompareDatum[] {
  const rows = getRows(ref);
  const byEvento: Record<string, number> = {};

  for (const r of rows) {
    const evento = r["Evento"]?.trim() || "Outros";
    const valor = parseBRL(r["ValorParcela"] ?? "0");
    byEvento[evento] = (byEvento[evento] ?? 0) + valor;
  }

  return Object.entries(byEvento)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

// ---------------------------------------------------------------------------
// FIN_008 — Top N Fornecedores
// ---------------------------------------------------------------------------

export function getTopFornecedores(n = 10, ref?: string): ChartCompareDatum[] {
  const rows = getRows(ref);
  const byFornecedor: Record<string, number> = {};

  for (const r of rows) {
    const fornecedor = r["Fornecedor"]?.trim() || "Desconhecido";
    const valor = parseBRL(r["ValorParcela"] ?? "0");
    byFornecedor[fornecedor] = (byFornecedor[fornecedor] ?? 0) + valor;
  }

  return Object.entries(byFornecedor)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, n);
}

// ---------------------------------------------------------------------------
// FIN_009 — Despesas por Unidade Pagadora
// ---------------------------------------------------------------------------

export function getByUnidade(ref?: string): ChartCompareDatum[] {
  const rows = getRows(ref);
  const byUnid: Record<string, number> = {};

  for (const r of rows) {
    const unid = r["UnidPagadora"]?.trim() || "Sem Unidade";
    const valor = parseBRL(r["ValorParcela"] ?? "0");
    byUnid[unid] = (byUnid[unid] ?? 0) + valor;
  }

  return Object.entries(byUnid)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

// ---------------------------------------------------------------------------
// FIN_010 — Status de Pagamentos (pago vs pendente)
// ---------------------------------------------------------------------------

export function getStatusPagamentos(ref?: string): ChartCompareDatum[] {
  const rows = getRows(ref);
  let pago = 0;
  let pendente = 0;

  for (const r of rows) {
    const valor = parseBRL(r["ValorParcela"] ?? "0");
    const dataPgto = r["DataPagamento"]?.trim();
    // DataPagamento vazio ou só espaços = pendente
    if (dataPgto && dataPgto.length > 0) {
      pago += valor;
    } else {
      pendente += valor;
    }
  }

  return [
    { name: "Pago", value: pago },
    { name: "Pendente", value: pendente },
  ];
}

// ---------------------------------------------------------------------------
// KPI auxiliar — Total de despesas do período
// ---------------------------------------------------------------------------

export function getKpiTotalDespesas(ref?: string): number {
  const rows = getRows(ref);
  return rows.reduce((sum, r) => sum + parseBRL(r["ValorParcela"] ?? "0"), 0);
}
