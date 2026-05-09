"use client";

import { createContext, useContext } from "react";

export type DashboardFilterContextValue = {
  ref: string;              // mês selecionado: "2026-04"
  setRef: (r: string) => void;
  availableMonths: string[];
};

export const DashboardFilterContext = createContext<DashboardFilterContextValue>({
  ref: "2026-04",
  setRef: () => {},
  availableMonths: ["2026-04"],
});

export function useDashboardFilter() {
  return useContext(DashboardFilterContext);
}

/** Formata "2026-04" como "Abril/2026" em pt-BR */
export function formatMonthLabel(ref: string): string {
  const [year, month] = ref.split("-");
  if (!year || !month) return ref;
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}
