export interface Dashboard {
  id: string;
  label: string;
}

export const DASHBOARDS: Dashboard[] = [
  { id: "dash_operacional", label: "Dashboard Operacional" },
  { id: "dash_financeiro",  label: "Dashboard Financeiro" },
  { id: "dash_frota",       label: "Dashboard de Frota" },
  { id: "metas",            label: "Gestão de Metas" },
  { id: "usuarios",         label: "Gestão de Usuários" },
  { id: "clientes",         label: "Gestão de Clientes" },
];
