"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/ui/AppShell";
import ChartCard from "@/components/charts/ChartCard";
import ChartErrorBoundary from "@/components/charts/ChartErrorBoundary";
import KpiCard from "@/components/charts/KpiCard";
import GlobalFilterBar from "@/components/dashboard/GlobalFilterBar";
import { CHART_REGISTRY } from "@/lib/charts/registry";
import type { ChartCompareDatum } from "@/lib/chartTypes";
import { useDashboardFilter } from "@/lib/dashboardFilters";

type ApiData = {
  kpis: Record<string, number>;
  charts: Record<string, ChartCompareDatum[]>;
};

const FLT_CHART_IDS = [
  "FLT_001", "FLT_002", "FLT_003", "FLT_004", "FLT_005",
  "FLT_006", "FLT_007", "FLT_008", "FLT_009", "FLT_010",
] as const;

export default function FrotaPage() {
  const { ref } = useDashboardFilter();
  const [data, setData] = useState<ApiData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    setData(null);
    setError(false);
    fetch(`/api/charts/frota?ref=${encodeURIComponent(ref)}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setError(true));
  }, [ref]);

  return (
    <AppShell>
      <div style={{ padding: "32px 36px", display: "flex", flexDirection: "column", gap: 28 }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#FFFFFF" }}>
              Dashboard de Frota
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#94A3B8" }}>
              Veículos · Rastreamento · Capacidade
            </p>
          </div>
          <GlobalFilterBar />
        </div>

        {/* KPI strip */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, maxWidth: 600 }}>
          <KpiCard kpiId="KPI_006" value={data?.kpis?.KPI_006 ?? null} />
          <KpiCard kpiId="KPI_007" value={data?.kpis?.KPI_007 ?? null} />
        </div>

        {error && (
          <p style={{ color: "#EF4444", fontSize: 14 }}>
            Erro ao carregar dados. Verifique os CSVs e tente novamente.
          </p>
        )}

        {/* Charts grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 20,
          }}
        >
          {FLT_CHART_IDS.map((id) => {
            const meta = CHART_REGISTRY.find((c) => c.id === id);
            if (!meta) return null;
            return (
              <ChartErrorBoundary key={id} chartId={id}>
                <ChartCard meta={meta} data={data?.charts?.[id] ?? null} lineDisabled />
              </ChartErrorBoundary>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
