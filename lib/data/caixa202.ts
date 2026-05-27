/**
 * Agregações de Contas a Pagar — ssw_extractions (caixa/202).
 * (Pagamentos a fornecedores)
 *
 * Colunas relevantes no payload:
 *   NumLancto, UnidPagadora, Fornecedor, Evento,
 *   ValorParcela, DataVencimento, DataPagamento, DataConciliacao
 *
 * Campo de data canônico: `DataVencimento` (dd/mm/yy).
 */

import { getLatestPayloadsInRange } from "./ssw";
import { parseBRL } from "./csvParser";
import type { ChartCompareDatum } from "../chartTypes";
import type { DateRange } from "./dateRange";

const PASTA = "caixa";
const CODIGO = 202;
const DATE_FIELD = "DataVencimento";

async function getRows(range: DateRange) {
  return getLatestPayloadsInRange(PASTA, CODIGO, DATE_FIELD, range);
}

// ---------------------------------------------------------------------------
// FIN_007 — Despesas por Categoria (Evento)
// ---------------------------------------------------------------------------

export async function getByEvento(range: DateRange): Promise<ChartCompareDatum[]> {
  const rows = await getRows(range);
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

export async function getTopFornecedores(n: number, range: DateRange): Promise<ChartCompareDatum[]> {
  const rows = await getRows(range);
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

export async function getByUnidade(range: DateRange): Promise<ChartCompareDatum[]> {
  const rows = await getRows(range);
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

export async function getStatusPagamentos(range: DateRange): Promise<ChartCompareDatum[]> {
  const rows = await getRows(range);
  let pago = 0;
  let pendente = 0;

  for (const r of rows) {
    const valor = parseBRL(r["ValorParcela"] ?? "0");
    const dataPgto = r["DataPagamento"]?.trim();
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

export async function getKpiTotalDespesas(range: DateRange): Promise<number> {
  const rows = await getRows(range);
  return rows.reduce((sum, r) => sum + parseBRL(r["ValorParcela"] ?? "0"), 0);
}
