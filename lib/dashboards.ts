export interface Dashboard {
  id: string;
  label: string;
  href: string;
  /** Telas restritas a ADMIN, independentemente de allowedDashboards. */
  adminOnly?: boolean;
}

export const DASHBOARDS: Dashboard[] = [
  { id: "dash_operacional", label: "Dashboard Operacional", href: "/dashboard/operacional" },
  { id: "dash_financeiro",  label: "Dashboard Financeiro",  href: "/dashboard/financeiro" },
  { id: "dash_frota",       label: "Dashboard de Frota",    href: "/dashboard/frota" },
  { id: "metas",            label: "Gestão de Metas",       href: "/dashboard/metas" },
  { id: "usuarios",         label: "Gestão de Usuários",    href: "/admin/usuarios",      adminOnly: true },
  { id: "configuracoes",    label: "Configurações",         href: "/admin/configuracoes", adminOnly: true },
];
