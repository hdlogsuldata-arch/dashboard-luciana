/**
 * Agregações de Pipeline de Faturamento — ctrc_231.csv
 * (CTRCs disponíveis para faturar com resultado comercial abaixo do mínimo)
 *
 * Colunas disponíveis nesta versão do CSV:
 *   CTRC, Emissao, Cliente, UnidOrigem, PracaDestino,
 *   Tabela, ResultComerc, ResultComercMin, Diferenca
 *
 * Nota: esta é a versão resumida do relatório. ResultComerc é um deficit
 * de resultado comercial (valor negativo = abaixo do mínimo aceitável),
 * NÃO é o valor do frete. OPR_007 (comprovantes) e OPR_009 (CIF/FOB)
 * não têm dados nesta versão e retornam vazio.
 */

import { readCsvAuto } from "./csvParser";
import type { ChartCompareDatum } from "../chartTypes";

const FILE = "ctrc_231.csv";

function getRows(ref?: string) {
  return readCsvAuto(FILE, ref).rows;
}

// ---------------------------------------------------------------------------
// OPR_006 — Pipeline de Faturamento por Cliente (contagem de CTRCs)
// ---------------------------------------------------------------------------

export function getPipelineByCliente(n = 10, ref?: string): ChartCompareDatum[] {
  const rows = getRows(ref);
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

export function getByUltimaOcorrencia(ref?: string): ChartCompareDatum[] {
  const rows = getRows(ref);
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

export function getKpiTotalFaturar(ref?: string): number {
  return getRows(ref).length;
}
