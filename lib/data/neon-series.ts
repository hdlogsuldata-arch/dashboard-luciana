/**
 * Séries temporais a partir do Neon — HDLOG Dashboard
 *
 * Diferente de lib/data/*.ts (que lêem um snapshot CSV de um mês), este módulo
 * consulta a tabela append-only `ssw_extractions` no Neon e agrupa os payloads
 * por `extracted_at` — a data/hora em que o pipeline ssw-integration puxou o dado.
 *
 * Cada execução do ETL (semanal, via GitHub Actions) acrescenta um snapshot novo;
 * aqui esses snapshots viram pontos no eixo X de um gráfico de linha (ChartSeries).
 *
 * Os payloads são JSONB com as MESMAS chaves do CSV cru da SSW (ex: "Saldo",
 * "DiasAtraso", "ValorFrete") — valores em string com formato BR ("1.234,56").
 */

import { prisma } from "../prisma";
import type { ChartCompareDatum, ChartSeries } from "../chartTypes";

// ---------------------------------------------------------------------------
// Helpers de parsing BR (espelham lib/data/csvParser.ts — payloads são strings BR)
// ---------------------------------------------------------------------------

/** "1.234,56" → 1234.56 */
function parseBRL(s: string | undefined): number {
  if (!s) return 0;
  const n = parseFloat(s.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

/** "127" ou "127,00" → 127 */
function parseIntBR(s: string | undefined): number {
  return Math.round(parseBRL(s));
}

/** "0", "-2", "3" → número (performance de entrega) */
function parseSigned(s: string | undefined): number {
  const n = parseInt((s ?? "0").trim(), 10);
  return Number.isFinite(n) ? n : 0;
}

/** Date (instante UTC do Postgres) → rótulo legível em BRT ("14/05/26 18:23") */
function formatX(d: Date): string {
  return d.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ---------------------------------------------------------------------------
// Acesso ao Neon
// ---------------------------------------------------------------------------

type Payload = Record<string, string>;
type SnapshotGroup = { extractedAt: Date; rows: Payload[] };

/**
 * Busca todos os payloads de um relatório, agrupados por extracted_at (ordem crescente).
 * Cada grupo é um snapshot — o estado completo daquele relatório naquela execução do ETL.
 */
async function getSnapshots(pasta: string, codigo: number): Promise<SnapshotGroup[]> {
  const rows = await prisma.$queryRaw<{ extracted_at: Date; payload: Payload }[]>`
    SELECT extracted_at, payload
    FROM ssw_extractions
    WHERE report_pasta = ${pasta} AND report_codigo = ${codigo}
    ORDER BY extracted_at ASC, row_index ASC
  `;

  const byTime = new Map<number, SnapshotGroup>();
  for (const r of rows) {
    const key = r.extracted_at.getTime();
    let group = byTime.get(key);
    if (!group) {
      group = { extractedAt: r.extracted_at, rows: [] };
      byTime.set(key, group);
    }
    group.rows.push(r.payload);
  }
  return [...byTime.values()].sort(
    (a, b) => a.extractedAt.getTime() - b.extractedAt.getTime(),
  );
}

// ---------------------------------------------------------------------------
// Lift genérico: agregação-de-snapshot → série temporal
// ---------------------------------------------------------------------------

type AggFn = (rows: Payload[]) => ChartCompareDatum[];

/**
 * Aplica `aggFn` em cada snapshot e pivota o resultado em ChartSeries[]:
 * cada categoria da agregação vira uma linha, com um ponto por extracted_at.
 *
 * @param keep  se informado, só essas categorias viram série (na ordem dada);
 *              o resto é somado em "Outros" quando `bucketRest` é true.
 */
function liftToSeries(
  groups: SnapshotGroup[],
  aggFn: AggFn,
  keep?: string[],
  bucketRest = false,
): ChartSeries[] {
  // keep vazio = sem filtro (não "tudo vira Outros") — evita footgun
  const keepSet = keep && keep.length > 0 ? new Set(keep) : null;
  const seriesMap = new Map<string, Array<{ x: string; y: number }>>();
  // ordem estável das séries
  if (keepSet) for (const c of keep!) seriesMap.set(c, []);

  for (const g of groups) {
    const x = formatX(g.extractedAt);
    let outros = 0;
    for (const d of aggFn(g.rows)) {
      if (keepSet && !keepSet.has(d.name)) {
        outros += d.value;
        continue;
      }
      let pts = seriesMap.get(d.name);
      if (!pts) {
        pts = [];
        seriesMap.set(d.name, pts);
      }
      pts.push({ x, y: d.value });
    }
    if (bucketRest && outros > 0) {
      let pts = seriesMap.get("Outros");
      if (!pts) {
        pts = [];
        seriesMap.set("Outros", pts);
      }
      pts.push({ x, y: outros });
    }
  }

  return [...seriesMap.entries()]
    .filter(([, points]) => points.length > 0)
    .map(([name, points]) => ({ name, points }));
}

/** Categorias com maior valor acumulado somando todos os snapshots (pra escolher top-N). */
function topCategories(groups: SnapshotGroup[], aggFn: AggFn, n: number): string[] {
  const totals = new Map<string, number>();
  for (const g of groups) {
    for (const d of aggFn(g.rows)) {
      totals.set(d.name, (totals.get(d.name) ?? 0) + d.value);
    }
  }
  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])) // desempate determinístico
    .slice(0, n)
    .map(([name]) => name);
}

// ---------------------------------------------------------------------------
// Agregações puras (rows → ChartCompareDatum[]) — espelham lib/data/*.ts
// ---------------------------------------------------------------------------

const AGING_BUCKETS = [
  { label: "1-30 dias", min: 1, max: 30 },
  { label: "31-60 dias", min: 31, max: 60 },
  { label: "61-90 dias", min: 61, max: 90 },
  { label: "91-180 dias", min: 91, max: 180 },
  { label: "> 180 dias", min: 181, max: Infinity },
];

/** FIN_001 — saldo vencido por faixa de atraso (caixa/240) */
const aggAging: AggFn = (rows) => {
  const totals: Record<string, number> = {};
  AGING_BUCKETS.forEach((b) => (totals[b.label] = 0));
  for (const r of rows) {
    const days = parseIntBR(r["DiasAtraso"]);
    const saldo = parseBRL(r["Saldo"]);
    const bucket = AGING_BUCKETS.find((b) => days >= b.min && days <= b.max);
    if (bucket) totals[bucket.label] += saldo;
  }
  return AGING_BUCKETS.map((b) => ({ name: b.label, value: totals[b.label] }));
};

/** FIN_007 — despesas por categoria/evento (caixa/202) */
const aggEvento: AggFn = (rows) => {
  const byEvento: Record<string, number> = {};
  for (const r of rows) {
    const evento = r["Evento"]?.trim() || "Outros";
    byEvento[evento] = (byEvento[evento] ?? 0) + parseBRL(r["ValorParcela"]);
  }
  return Object.entries(byEvento).map(([name, value]) => ({ name, value }));
};

/** FIN_012 — receita de frete por cliente (cliente/203) */
const aggReceitaCliente: AggFn = (rows) => {
  const byCliente: Record<string, number> = {};
  for (const r of rows) {
    const cliente = r["Cliente"]?.trim() || "Desconhecido";
    byCliente[cliente] = (byCliente[cliente] ?? 0) + parseBRL(r["ValorFrete"]);
  }
  return Object.entries(byCliente).map(([name, value]) => ({ name, value }));
};

/** OPR_001 — entregas por classe de performance (cliente/017) */
const aggOTD: AggFn = (rows) => {
  let noPrazo = 0;
  let antecipado = 0;
  let atrasado = 0;
  for (const r of rows) {
    const perf = parseSigned(r["PERFORMANCE"]);
    if (perf < 0) antecipado++;
    else if (perf === 0) noPrazo++;
    else atrasado++;
  }
  return [
    { name: "No Prazo", value: noPrazo },
    { name: "Antecipado", value: antecipado },
    { name: "Atrasado", value: atrasado },
  ];
};

// ---------------------------------------------------------------------------
// API pública — uma função por gráfico com suporte a "line" no registry
// ---------------------------------------------------------------------------

/** Resiliente: qualquer falha (Neon frio, tabela vazia) → série vazia, nunca derruba a API. */
async function safe(
  fn: () => Promise<ChartSeries[]>,
  label: string,
): Promise<ChartSeries[]> {
  try {
    return await fn();
  } catch (err) {
    console.error(`[neon-series] ${label}:`, err);
    return [];
  }
}

/** FIN_001 — Aging de Inadimplência ao longo do tempo (5 séries, uma por faixa) */
export function getAgingSeries(): Promise<ChartSeries[]> {
  return safe(async () => {
    const groups = await getSnapshots("caixa", 240);
    return liftToSeries(groups, aggAging);
  }, "FIN_001 aging");
}

/** FIN_007 — Despesas por Categoria ao longo do tempo (top 6 eventos + Outros) */
export function getDespesasSeries(): Promise<ChartSeries[]> {
  return safe(async () => {
    const groups = await getSnapshots("caixa", 202);
    const top = topCategories(groups, aggEvento, 6);
    return liftToSeries(groups, aggEvento, top, true);
  }, "FIN_007 despesas");
}

/** FIN_012 — Receita de Frete dos top 10 clientes ao longo do tempo */
export function getTopClientesSeries(): Promise<ChartSeries[]> {
  return safe(async () => {
    const groups = await getSnapshots("cliente", 203);
    const top = topCategories(groups, aggReceitaCliente, 10);
    return liftToSeries(groups, aggReceitaCliente, top, false);
  }, "FIN_012 top clientes");
}

/** OPR_001 — On-Time Delivery ao longo do tempo (3 séries: no prazo / antecipado / atrasado) */
export function getOTDSeries(): Promise<ChartSeries[]> {
  return safe(async () => {
    const groups = await getSnapshots("cliente", 17);
    return liftToSeries(groups, aggOTD);
  }, "OPR_001 OTD");
}
