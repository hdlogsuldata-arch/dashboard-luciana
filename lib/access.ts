import { DASHBOARDS, type Dashboard } from "./dashboards";

/**
 * Regra central de autorização de telas.
 *
 * Módulo PURO (sem prisma/node/next server-only) para poder ser importado
 * tanto no middleware (edge runtime) quanto em client components (Sidebar),
 * mantendo uma única fonte de verdade da regra de acesso.
 */

export const ADMIN_ROLE = "ADMIN";

/** Retorna o dashboard configurável cuja rota casa com o pathname, ou null. */
export function matchDashboard(pathname: string): Dashboard | null {
  return (
    DASHBOARDS.find(
      (d) => pathname === d.href || pathname.startsWith(d.href + "/"),
    ) ?? null
  );
}

/**
 * Pode o usuário acessar a rota?
 * - ADMIN acessa tudo.
 * - Rota que não corresponde a um dashboard configurável (ex.: home /dashboard,
 *   /dashboard/ctrcs) é liberada a qualquer usuário autenticado.
 * - Dashboard adminOnly (usuarios/configuracoes) exige ADMIN.
 * - Demais dashboards exigem o id presente em allowedDashboards.
 */
export function canAccessPath(
  pathname: string,
  role: string | null | undefined,
  allowedDashboards: string[] | null | undefined,
): boolean {
  if (role === ADMIN_ROLE) return true;
  const dash = matchDashboard(pathname);
  if (!dash) return true;
  if (dash.adminOnly) return false;
  return (allowedDashboards ?? []).includes(dash.id);
}

/** Telas visíveis no menu para o usuário (mesma regra de canAccessPath). */
export function visibleDashboards(
  role: string | null | undefined,
  allowedDashboards: string[] | null | undefined,
): Dashboard[] {
  return DASHBOARDS.filter((d) => {
    if (role === ADMIN_ROLE) return true;
    if (d.adminOnly) return false;
    return (allowedDashboards ?? []).includes(d.id);
  });
}

/** Primeira tela permitida (para redirecionar quem cai numa tela barrada). */
export function firstAllowedHref(
  role: string | null | undefined,
  allowedDashboards: string[] | null | undefined,
): string {
  const vis = visibleDashboards(role, allowedDashboards);
  return vis[0]?.href ?? "/dashboard";
}
