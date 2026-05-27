/**
 * Agregações de Frota — ssw_extractions (tabelas/245).
 * (Relação de veículos cadastrados — snapshot estático sem campo de data útil)
 *
 * Colunas relevantes no payload:
 *   PLACA, TIPO, RELACIONAMENTO, DISPONIVEL, MARCA, MODELO,
 *   ANO, CARROCERIA, CAPACIDADE, COMBUSTIVEL, RASTREADO,
 *   KM ODOMETRO, ULT MVTO, VIGENCIA SEGURO
 *
 * Sem filtro de data: usa sempre o snapshot mais recente. A assinatura recebe
 * `DateRange` apenas para uniformidade com os outros parsers, mas ignora.
 */

import { getLatestPayloads } from "./ssw";
import { parseBRL } from "./csvParser";
import type { ChartCompareDatum } from "../chartTypes";
import type { DateRange } from "./dateRange";

const PASTA = "tabelas";
const CODIGO = 245;

async function getRows(_range?: DateRange) {
  return getLatestPayloads(PASTA, CODIGO);
}

// ---------------------------------------------------------------------------
// FLT_001 — Composição da Frota por Tipo
// ---------------------------------------------------------------------------

export async function getComposicaoByTipo(range?: DateRange): Promise<ChartCompareDatum[]> {
  const rows = await getRows(range);
  const byTipo: Record<string, number> = {};

  for (const r of rows) {
    const tipo = r["TIPO"]?.trim() || "Outros";
    byTipo[tipo] = (byTipo[tipo] ?? 0) + 1;
  }

  return Object.entries(byTipo)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

// ---------------------------------------------------------------------------
// FLT_002 — Frota Própria vs Terceiros (RELACIONAMENTO)
// ---------------------------------------------------------------------------

export async function getRelacionamento(range?: DateRange): Promise<ChartCompareDatum[]> {
  const rows = await getRows(range);
  const byRel: Record<string, number> = {};

  for (const r of rows) {
    const rel = r["RELACIONAMENTO"]?.trim() || "Outros";
    byRel[rel] = (byRel[rel] ?? 0) + 1;
  }

  return Object.entries(byRel)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

// ---------------------------------------------------------------------------
// FLT_003 — Distribuição por Fabricante
// ---------------------------------------------------------------------------

export async function getByFabricante(range?: DateRange): Promise<ChartCompareDatum[]> {
  const rows = await getRows(range);
  const byMarca: Record<string, number> = {};

  for (const r of rows) {
    const marca = r["MARCA"]?.trim() || "Sem marca";
    byMarca[marca] = (byMarca[marca] ?? 0) + 1;
  }

  return Object.entries(byMarca)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

// ---------------------------------------------------------------------------
// FLT_004 — Idade da Frota (por ano de fabricação)
// ---------------------------------------------------------------------------

export async function getIdadeFrota(range?: DateRange): Promise<ChartCompareDatum[]> {
  const rows = await getRows(range);
  const byAno: Record<string, number> = {};

  for (const r of rows) {
    const raw = r["ANO"]?.trim();
    if (!raw) { byAno["Sem ano"] = (byAno["Sem ano"] ?? 0) + 1; continue; }
    const n = parseInt(raw, 10);
    const currentYY = new Date().getFullYear() % 100;
    const ano = raw.length === 2
      ? String(n <= currentYY ? 2000 + n : 1900 + n)
      : raw;
    byAno[ano] = (byAno[ano] ?? 0) + 1;
  }

  return Object.entries(byAno)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => {
      if (a.name === "Sem ano") return 1;
      if (b.name === "Sem ano") return -1;
      return parseInt(a.name) - parseInt(b.name);
    });
}

// ---------------------------------------------------------------------------
// FLT_005 — Frota por Combustível
// ---------------------------------------------------------------------------

export async function getByCombustivel(range?: DateRange): Promise<ChartCompareDatum[]> {
  const rows = await getRows(range);
  const byComb: Record<string, number> = {};

  for (const r of rows) {
    const comb = r["COMBUSTIVEL"]?.trim() || "Não informado";
    byComb[comb] = (byComb[comb] ?? 0) + 1;
  }

  return Object.entries(byComb)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

// ---------------------------------------------------------------------------
// FLT_006 — Localização Atual (último movimento por unidade)
// ---------------------------------------------------------------------------

export async function getLocalizacaoAtual(range?: DateRange): Promise<ChartCompareDatum[]> {
  const rows = await getRows(range);
  const byLocal: Record<string, number> = {};

  for (const r of rows) {
    const raw = r["ULT MVTO"]?.trim() || "";
    const local = raw.split(/\s+/)[0] || "Não registrado";
    byLocal[local] = (byLocal[local] ?? 0) + 1;
  }

  return Object.entries(byLocal)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

// ---------------------------------------------------------------------------
// FLT_007 — Taxa de Rastreamento
// ---------------------------------------------------------------------------

export async function getRastreamento(range?: DateRange): Promise<ChartCompareDatum[]> {
  const rows = await getRows(range);
  let rastreado = 0;
  let naoRastreado = 0;

  for (const r of rows) {
    const val = r["RASTREADO"]?.trim().toUpperCase();
    const isTracked = val !== "" && val !== "N" && val !== "0";
    if (isTracked) rastreado++;
    else naoRastreado++;
  }

  return [
    { name: "Rastreado", value: rastreado },
    { name: "Sem Rastreamento", value: naoRastreado },
  ];
}

// ---------------------------------------------------------------------------
// FLT_008 — Vencimento de Seguros por Mês
// ---------------------------------------------------------------------------

export async function getVencimentoSeguros(range?: DateRange): Promise<ChartCompareDatum[]> {
  const rows = await getRows(range);
  const byMes: Record<string, number> = {};

  for (const r of rows) {
    const vigencia = r["VIGENCIA SEGURO"]?.trim();
    if (!vigencia) continue;

    const partes = vigencia.split(/\s+A\s+/i);
    const dataFim = (partes.length === 2 ? partes[1] : partes[0]).trim();

    const segs = dataFim.split("/");
    if (segs.length !== 3) continue;

    const [, mes, anoRaw] = segs;
    const ano = anoRaw.length === 2 ? `20${anoRaw}` : anoRaw;
    const label = `${mes.padStart(2, "0")}/${ano}`;

    byMes[label] = (byMes[label] ?? 0) + 1;
  }

  return Object.entries(byMes)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => {
      const [ma, ya] = a.name.split("/");
      const [mb, yb] = b.name.split("/");
      return parseInt(ya ?? "0") * 12 + parseInt(ma ?? "0") -
             (parseInt(yb ?? "0") * 12 + parseInt(mb ?? "0"));
    });
}

// ---------------------------------------------------------------------------
// FLT_009 — Capacidade Total por Tipo (soma de m³)
// ---------------------------------------------------------------------------

export async function getCapacidadeByTipo(range?: DateRange): Promise<ChartCompareDatum[]> {
  const rows = await getRows(range);
  const byTipo: Record<string, number> = {};

  for (const r of rows) {
    const tipo = r["TIPO"]?.trim() || "Outros";
    const cap = parseBRL(r["CAPACIDADE"] ?? "0");
    byTipo[tipo] = (byTipo[tipo] ?? 0) + cap;
  }

  return Object.entries(byTipo)
    .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }))
    .sort((a, b) => b.value - a.value);
}

// ---------------------------------------------------------------------------
// FLT_010 — Hodômetro Médio por Tipo
// ---------------------------------------------------------------------------

export async function getOdometroMedioByTipo(range?: DateRange): Promise<ChartCompareDatum[]> {
  const rows = await getRows(range);
  const sums: Record<string, { total: number; count: number }> = {};

  for (const r of rows) {
    const tipo = r["TIPO"]?.trim() || "Outros";
    const km = parseBRL(r["KM ODOMETRO"] ?? "0");
    if (km === 0) continue;
    if (!sums[tipo]) sums[tipo] = { total: 0, count: 0 };
    sums[tipo].total += km;
    sums[tipo].count++;
  }

  return Object.entries(sums)
    .map(([name, { total, count }]) => ({
      name,
      value: Math.round(total / count),
    }))
    .sort((a, b) => b.value - a.value);
}

// ---------------------------------------------------------------------------
// KPI_006 — Total da Frota (quantidade)
// ---------------------------------------------------------------------------

export async function getKpiTotalFrota(range?: DateRange): Promise<number> {
  const rows = await getRows(range);
  return rows.length;
}

// ---------------------------------------------------------------------------
// KPI_007 — Taxa de Rastreamento (fração 0-1)
// ---------------------------------------------------------------------------

export async function getKpiTaxaRastreamento(range?: DateRange): Promise<number> {
  const rows = await getRows(range);
  if (rows.length === 0) return 0;
  const rastreados = rows.filter((r) => {
    const val = r["RASTREADO"]?.trim().toUpperCase();
    return val !== "" && val !== "N" && val !== "0";
  }).length;
  return rastreados / rows.length;
}
