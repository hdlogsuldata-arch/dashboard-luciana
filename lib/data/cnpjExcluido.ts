/**
 * Filtro global de CNPJs excluídos das análises (server-side).
 *
 * Os datasets `caixa/240` (KPI_001, KPI_002) e `cliente/17` (KPI_003) têm CNPJ
 * no payload — comparação direta. O dataset `ctrc/231` (KPI_004) não tem CNPJ,
 * só nome de cliente — comparação por nome normalizado.
 *
 * Funções puras (normalizeCnpj, normalizeNome, formatCnpj) vivem em
 * `cnpjFormat.ts` pra poderem ser importadas por client components sem
 * arrastar o Prisma pro bundle.
 */

import "server-only";
import { prisma } from "../prisma";
import { normalizeCnpj, normalizeNome } from "./cnpjFormat";

export type ExclusionSet = {
  cnpjs: Set<string>;
  nomes: Set<string>;
};

/**
 * Devolve dois sets prontos pra .has() — um com CNPJs (14 dígitos) e outro com
 * nomes normalizados. Cada chamada é uma query Prisma; sem cache na v1
 * (a tabela é pequena e a query roda 1x por API request).
 */
export async function getExclusionSet(): Promise<ExclusionSet> {
  try {
    const rows = await prisma.cnpjExcluido.findMany({
      select: { cnpj: true, nomeEmpresa: true },
    });
    const cnpjs = new Set<string>();
    const nomes = new Set<string>();
    for (const r of rows) {
      cnpjs.add(normalizeCnpj(r.cnpj));
      nomes.add(normalizeNome(r.nomeEmpresa));
    }
    return { cnpjs, nomes };
  } catch (err) {
    console.error("[cnpjExcluido] getExclusionSet falhou:", err);
    return { cnpjs: new Set(), nomes: new Set() };
  }
}
