"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { DashboardFilterContext, type GlobalDateBounds } from "@/lib/dashboardFilters";
import {
  defaultRange,
  rangeFromQuery,
  rangeToQuery,
  resolvePreset,
  type DateRange,
  type DatePreset,
} from "@/lib/data/dateRange";

const STORAGE_KEY = "dashboard.range.v1";

function rangeFromStorage(): DateRange | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      startDate: string;
      endDate: string;
      preset: DatePreset;
    };
    return {
      startDate: new Date(parsed.startDate),
      endDate: new Date(parsed.endDate),
      preset: parsed.preset,
    };
  } catch {
    return null;
  }
}

function rangeToStorage(r: DateRange) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      startDate: r.startDate.toISOString(),
      endDate: r.endDate.toISOString(),
      preset: r.preset,
    }),
  );
}

function DashboardFilterInner({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [range, setRangeState] = useState<DateRange>(() => {
    // Precedência: ?start=&end= > sessionStorage > preset default
    return (
      rangeFromQuery(searchParams) ??
      rangeFromStorage() ??
      defaultRange()
    );
  });
  const [globalRange, setGlobalRange] = useState<GlobalDateBounds>(null);

  useEffect(() => {
    fetch("/api/charts/data-range")
      .then((r) => r.json())
      .then((d) => {
        if (d.earliest && d.latest) {
          setGlobalRange({
            earliest: new Date(d.earliest),
            latest: new Date(d.latest),
          });
        }
      })
      .catch(() => {});
  }, []);

  const setRange = useCallback(
    (r: DateRange) => {
      setRangeState(r);
      rangeToStorage(r);
      const qs = rangeToQuery(r);
      router.replace(`${pathname}?${qs}`, { scroll: false });
    },
    [pathname, router],
  );

  const setPreset = useCallback(
    (p: DatePreset) => setRange(resolvePreset(p)),
    [setRange],
  );

  return (
    <DashboardFilterContext.Provider value={{ range, setRange, setPreset, globalRange }}>
      {children}
    </DashboardFilterContext.Provider>
  );
}

// useSearchParams() exige um boundary de Suspense acima quando a rota é
// prerenderizada (senão o build estático falha com CSR bailout). O layout
// envolve o componente que lê os search params em <Suspense>.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <DashboardFilterInner>{children}</DashboardFilterInner>
    </Suspense>
  );
}
