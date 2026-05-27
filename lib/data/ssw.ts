/**
 * Acesso a `ssw_extractions` (Neon Postgres) — fonte única dos dados do dashboard.
 *
 * A tabela é append-only, populada diariamente pelo ETL ssw-integration:
 *   (report_pasta, report_codigo, extracted_at, row_index, payload JSONB)
 *
 * Padrão de uso:
 *   - Para KPIs/gráficos pontuais: `getLatestPayloads` (snapshot mais recente, sem filtro)
 *     ou `getLatestPayloadsInRange` (snapshot mais recente, filtrado por campo de data no payload).
 *   - Para séries temporais: ver `neon-series.ts` que varre todos os snapshots.
 *
 * Estratégia anti dupla-contagem: sempre opera no `MAX(extracted_at)` por
 * `(report_pasta, report_codigo)`. Filtrar por range sobre todos os snapshots
 * somaria a mesma fatura várias vezes.
 */

import { prisma } from "../prisma";
import { toIsoDate, type DateRange } from "./dateRange";

export type Payload = Record<string, string>;

// ---------------------------------------------------------------------------
// Allowlist de campos de data por relatório — usado pra blindar SQL injection
// (o nome do campo entra interpolado em payload->>'...' porque Prisma não
// parametriza chaves JSON).
// ---------------------------------------------------------------------------

const VALID_DATE_FIELDS: Record<string, Set<string>> = {
  "caixa/240": new Set(["Emissao", "Vencimento"]),
  "caixa/202": new Set(["DataVencimento", "DataPagamento", "DataConciliacao"]),
  "cliente/17": new Set(["DATA AUTORIZACAO", "DATA PREVENTR", "DATA ENTREGA"]),
  "cliente/203": new Set([]),
  "ctrc/174": new Set(["data_emissao", "prev_ent"]),
  "ctrc/231": new Set(["Emissao"]),
  "tabelas/245": new Set([]),
};

function assertValidDateField(pasta: string, codigo: number, dateField: string): void {
  const key = `${pasta}/${codigo}`;
  const allow = VALID_DATE_FIELDS[key];
  if (!allow || !allow.has(dateField)) {
    throw new Error(
      `[ssw] dateField "${dateField}" não permitido para ${key}. Adicione ao VALID_DATE_FIELDS.`,
    );
  }
}

// ---------------------------------------------------------------------------
// Resiliência: qualquer falha (Neon frio, tabela vazia, payload malformado)
// → retorna []. Mesma filosofia de `neon-series.ts`.
// ---------------------------------------------------------------------------

async function safe<T>(fn: () => Promise<T>, fallback: T, label: string): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.error(`[ssw] ${label}:`, err);
    return fallback;
  }
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Retorna todas as linhas do snapshot MAIS RECENTE de (pasta, codigo).
 * Sem filtro de data — usado por gráficos cujo dataset não tem coluna de data
 * (frota) ou para joins auxiliares (ex: ABC do cliente).
 */
export async function getLatestPayloads(pasta: string, codigo: number): Promise<Payload[]> {
  return safe(
    async () => {
      const rows = await prisma.$queryRaw<{ payload: Payload }[]>`
        WITH latest AS (
          SELECT MAX(extracted_at) AS ts
          FROM ssw_extractions
          WHERE report_pasta = ${pasta} AND report_codigo = ${codigo}
        )
        SELECT s.payload
        FROM ssw_extractions s, latest
        WHERE s.report_pasta = ${pasta}
          AND s.report_codigo = ${codigo}
          AND s.extracted_at = latest.ts
        ORDER BY s.row_index
      `;
      return rows.map((r) => r.payload);
    },
    [],
    `getLatestPayloads(${pasta}/${codigo})`,
  );
}

/**
 * Retorna as linhas do snapshot mais recente cujo `payload->>dateField`
 * cai no range `[start, end]` (inclusive em ambas as pontas).
 *
 * Tolera os dois formatos de data presentes nos CSVs:
 *   - DD/MM/YY   (caixa_240, caixa_202, cliente_017, ctrc_231)
 *   - DD/MM/YYYY (ctrc_174)
 *
 * Linhas com campo vazio ou malformado são descartadas silenciosamente.
 */
export async function getLatestPayloadsInRange(
  pasta: string,
  codigo: number,
  dateField: string,
  range: DateRange,
): Promise<Payload[]> {
  assertValidDateField(pasta, codigo, dateField);

  return safe(
    async () => {
      const startIso = toIsoDate(range.startDate);
      const endIso = toIsoDate(range.endDate);
      const field = dateField; // já validado pela allowlist

      // payload->>'campo' é interpolado direto (não há parametrização Prisma para
      // chaves JSON). A allowlist garante segurança.
      const sql = `
        WITH latest AS (
          SELECT MAX(extracted_at) AS ts
          FROM ssw_extractions
          WHERE report_pasta = $1 AND report_codigo = $2
        )
        SELECT s.payload
        FROM ssw_extractions s, latest
        WHERE s.report_pasta = $1
          AND s.report_codigo = $2
          AND s.extracted_at = latest.ts
          AND s.payload->>'${field}' ~ '^\\d{2}/\\d{2}/\\d{2,4}$'
          AND TO_DATE(
            s.payload->>'${field}',
            CASE WHEN length(s.payload->>'${field}') <= 8
                 THEN 'DD/MM/YY' ELSE 'DD/MM/YYYY' END
          ) BETWEEN $3::date AND $4::date
        ORDER BY s.row_index
      `;

      const rows = await prisma.$queryRawUnsafe<{ payload: Payload }[]>(
        sql,
        pasta,
        codigo,
        startIso,
        endIso,
      );
      return rows.map((r) => r.payload);
    },
    [],
    `getLatestPayloadsInRange(${pasta}/${codigo}, ${dateField})`,
  );
}

/**
 * Min/max das datas presentes em algum campo "âncora" de cada relatório
 * (usado pelo seletor de período para indicar quais datas têm dados).
 * Faz UNION ALL das min/max de cada campo canônico.
 */
export async function getGlobalDateRange(): Promise<{
  earliest: Date | null;
  latest: Date | null;
}> {
  return safe(
    async () => {
      // Apenas os campos âncora canônicos (um por relatório).
      const ANCHORS: Array<[string, number, string]> = [
        ["caixa", 240, "Emissao"],
        ["caixa", 202, "DataVencimento"],
        ["cliente", 17, "DATA AUTORIZACAO"],
        ["ctrc", 174, "data_emissao"],
        ["ctrc", 231, "Emissao"],
      ];

      const parts: string[] = ANCHORS.map((_, i) => {
        const offset = i * 3;
        return `
          SELECT
            MIN(TO_DATE(
              s.payload->>$${offset + 3},
              CASE WHEN length(s.payload->>$${offset + 3}) <= 8
                   THEN 'DD/MM/YY' ELSE 'DD/MM/YYYY' END
            )) AS min_d,
            MAX(TO_DATE(
              s.payload->>$${offset + 3},
              CASE WHEN length(s.payload->>$${offset + 3}) <= 8
                   THEN 'DD/MM/YY' ELSE 'DD/MM/YYYY' END
            )) AS max_d
          FROM ssw_extractions s, (
            SELECT MAX(extracted_at) AS ts
            FROM ssw_extractions
            WHERE report_pasta = $${offset + 1} AND report_codigo = $${offset + 2}
          ) latest
          WHERE s.report_pasta = $${offset + 1}
            AND s.report_codigo = $${offset + 2}
            AND s.extracted_at = latest.ts
            AND s.payload->>$${offset + 3} ~ '^\\d{2}/\\d{2}/\\d{2,4}$'
        `;
      });

      const sql = `
        SELECT MIN(min_d) AS earliest, MAX(max_d) AS latest
        FROM (
          ${parts.join(" UNION ALL ")}
        ) u
      `;

      const args: unknown[] = [];
      for (const [pasta, codigo, field] of ANCHORS) {
        args.push(pasta, codigo, field);
      }

      const rows = await prisma.$queryRawUnsafe<{ earliest: Date | null; latest: Date | null }[]>(
        sql,
        ...args,
      );
      const r = rows[0] ?? { earliest: null, latest: null };
      return {
        earliest: r.earliest ? new Date(r.earliest) : null,
        latest: r.latest ? new Date(r.latest) : null,
      };
    },
    { earliest: null, latest: null },
    "getGlobalDateRange",
  );
}
