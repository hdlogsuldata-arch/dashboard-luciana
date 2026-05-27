"use client";

import { createContext, useContext } from "react";
import {
  defaultRange,
  type DatePreset,
  type DateRange,
} from "./data/dateRange";

export type GlobalDateBounds = { earliest: Date; latest: Date } | null;

export type DashboardFilterContextValue = {
  range: DateRange;
  setRange: (r: DateRange) => void;
  setPreset: (p: DatePreset) => void;
  globalRange: GlobalDateBounds;
};

export const DashboardFilterContext = createContext<DashboardFilterContextValue>({
  range: defaultRange(),
  setRange: () => {},
  setPreset: () => {},
  globalRange: null,
});

export function useDashboardFilter() {
  return useContext(DashboardFilterContext);
}

export { formatDateRangeLabel } from "./data/dateRange";
