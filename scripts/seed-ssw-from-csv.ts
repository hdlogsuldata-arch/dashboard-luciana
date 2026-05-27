/**
 * Seed de `ssw_extractions` a partir dos CSVs em `data_csv/data/`.
 * Usado para desenvolvimento local sem depender do ETL externo (ssw-integration).
 *
 * Uso:
 *   npx tsx scripts/seed-ssw-from-csv.ts
 *
 * Cada execução INSERE um snapshot novo com extracted_at = NOW(). Não apaga
 * snapshots anteriores (a tabela é append-only). Para limpar, use o psql/Studio.
 */

import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { readCsvAuto } from "../lib/data/csvParser";

const prisma = new PrismaClient();

type ReportSpec = {
  file: string;
  pasta: string;
  codigo: number;
};

const REPORTS: ReportSpec[] = [
  { file: "caixa_240.csv", pasta: "caixa", codigo: 240 },
  { file: "caixa_202.csv", pasta: "caixa", codigo: 202 },
  { file: "cliente_017.csv", pasta: "cliente", codigo: 17 },
  { file: "cliente_203.csv", pasta: "cliente", codigo: 203 },
  { file: "ctrc_174.csv", pasta: "ctrc", codigo: 174 },
  { file: "ctrc_231.csv", pasta: "ctrc", codigo: 231 },
  { file: "tabelas_245.csv", pasta: "tabelas", codigo: 245 },
];

async function main() {
  const extractedAt = new Date();
  console.log(`\n[seed-ssw] extracted_at = ${extractedAt.toISOString()}`);

  let okCount = 0;
  let failCount = 0;
  let totalRows = 0;

  for (const spec of REPORTS) {
    try {
      const { rows } = readCsvAuto(spec.file);
      if (rows.length === 0) {
        console.log(`  · ${spec.file}: vazio, pulando`);
        continue;
      }

      const data = rows.map((payload, row_index) => ({
        report_pasta: spec.pasta,
        report_codigo: spec.codigo,
        extracted_at: extractedAt,
        data_param: "seed",
        row_index,
        payload,
      }));

      await prisma.ssw_extractions.createMany({
        data,
        skipDuplicates: true,
      });

      okCount++;
      totalRows += rows.length;
      console.log(`  ✓ ${spec.file} → ${spec.pasta}/${spec.codigo}: ${rows.length} linhas`);
    } catch (err) {
      failCount++;
      console.error(`  ✗ ${spec.file}: ${(err as Error).message}`);
    }
  }

  // Log da execução em ssw_runs (cria/atualiza).
  await prisma.ssw_runs.upsert({
    where: { extracted_at: extractedAt },
    update: { reports_ok: okCount, reports_fail: failCount, total_rows: totalRows },
    create: {
      extracted_at: extractedAt,
      reports_ok: okCount,
      reports_fail: failCount,
      total_rows: totalRows,
    },
  });

  console.log(`\n[seed-ssw] ${okCount} OK, ${failCount} falha, ${totalRows} linhas totais\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
