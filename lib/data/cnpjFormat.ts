/**
 * Helpers puros de CNPJ/nome — sem dependência de Prisma ou Node APIs.
 * Seguro pra usar em client components.
 *
 * Separado de `cnpjExcluido.ts` (que importa Prisma e roda só no server)
 * pra evitar que o bundler do Next puxe o Prisma pro client.
 */

/** Retorna só os dígitos (descarta máscara, traços, etc.). */
export function normalizeCnpj(s: string | undefined | null): string {
  return (s ?? "").replace(/\D/g, "");
}

/** Trim + lowercase + colapsa espaços. Match em ctrc/231 (campo `Cliente`). */
export function normalizeNome(s: string | undefined | null): string {
  return (s ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/** Formata CNPJ pra exibição: 00.000.000/0000-00 (espera 14 dígitos). */
export function formatCnpj(cnpj: string): string {
  const d = normalizeCnpj(cnpj);
  if (d.length !== 14) return cnpj;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12, 14)}`;
}
