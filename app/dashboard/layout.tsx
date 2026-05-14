"use client";

import { useState, useEffect } from "react";
import { DashboardFilterContext } from "@/lib/dashboardFilters";

const DEFAULT_REF = process.env.NEXT_PUBLIC_CURRENT_REF ?? "2026-04";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [ref, setRef] = useState(DEFAULT_REF);
  const [availableMonths, setAvailableMonths] = useState<string[]>([DEFAULT_REF]);

  useEffect(() => {
    fetch("/api/charts/available-months")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.months) && data.months.length > 0) {
          setAvailableMonths(data.months);
          // Set to the most recent month on first load
          setRef(data.current ?? data.months[0]);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <DashboardFilterContext.Provider value={{ ref, setRef, availableMonths }}>
      {children}
    </DashboardFilterContext.Provider>
  );
}
