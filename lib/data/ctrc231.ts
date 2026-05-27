/**
 * Agregações de Pipeline de Faturamento — ssw_extractions (ctrc/231).
 * (CTRCs disponíveis para faturar com resultado comercial abaixo do mínimo)
 *
 * Colunas no payload:
 *   CTRC, Emissao, Cliente, UnidOrigem, PracaDestino,
 *   Tabela, ResultComerc, ResultComercMin, Diferenca
 *
 * Campo de data canônico: `Emissao` (dd/mm/yy).
 */

import { getLatestPayloadsInRange } from "./ssw";
import type { ChartCompareDatum } from "../chartTypes";
import type { DateRange } from "./dateRange";

const PASTA = "ctrc";
const CODIGO = 231;
const DATE_FIELD = "Emissao";

async function getRows(range: DateRange) {
  return getLatestPayloadsInRange(PASTA, CODIGO, DATE_FIELD, range);
}

// ---------------------------------------------------------------------------
// OPR_006 — Pipeline de Faturamento por Cliente (contagem de CTRCs)
// ---------------------------------------------------------------------------

export async function getPipelineByCliente(n: number, range: DateRange): Promise<ChartCompareDatum[]> {
  const rows = await getRows(range);
  const byCliente: Record<string, number> = {};

  for (const r of rows) {
    const cliente = r["Cliente"]?.trim() || "Desconhecido";
    byCliente[cliente] = (byCliente[cliente] ?? 0) + 1;
  }

  return Object.entries(byCliente)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, n);
}

// ---------------------------------------------------------------------------
// OPR_008 — CTRCs por Tabela de Cálculo
// ---------------------------------------------------------------------------

export async function getByUltimaOcorrencia(range: DateRange): Promise<ChartCompareDatum[]> {
  const rows = await getRows(range);
  const byTabela: Record<string, number> = {};

  for (const r of rows) {
    const tabela = r["Tabela"]?.trim() || "Sem tabela";
    byTabela[tabela] = (byTabela[tabela] ?? 0) + 1;
  }

  return Object.entries(byTabela)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
}

// ---------------------------------------------------------------------------
// KPI_004 — CTRCs Disponíveis para Faturar (contagem)
// ---------------------------------------------------------------------------

export async function getKpiTotalFaturar(range: DateRange): Promise<number> {
  const rows = await getRows(range);
  return rows.length;
}
