"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/ui/AppShell";
import ChartCard from "@/components/charts/ChartCard";
import ChartErrorBoundary from "@/components/charts/ChartErrorBoundary";
import KpiStrip from "@/components/charts/KpiStrip";
import GlobalFilterBar from "@/components/dashboard/GlobalFilterBar";
import { CHART_REGISTRY } from "@/lib/charts/registry";
import type { ChartCompareDatum } from "@/lib/chartTypes";
import { useDashboardFilter } from "@/lib/dashboardFilters";

type ApiData = {
  kpis: Record<string, number>;
  charts: Record<string, ChartCompareDatum[]>;
};

type SectionConfig = { chartIds: string[]; kpiIds: string[] };

export default function FinanceiroPage() {
  const { ref } = useDashboardFilter();
  const [config, setConfig] = useState<SectionConfig | null>(null);
  const [data, setData] = useState<ApiData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/me/section-config?section=financeiro")
      .then((r) => r.json())
      .then(setConfig)
      .catch(() => {});
  }, []);

  useEffect(() => {
    setData(null);
    setError(false);
    fetch(`/api/charts/financeiro?ref=${encodeURIComponent(ref)}`)
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
              Dashboard Financeiro
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#94A3B8" }}>
              Inadimplência · Despesas · Receitas
            </p>
          </div>
          <GlobalFilterBar />
        </div>

        <KpiStrip
          items={(config?.kpiIds ?? []).map((kpiId) => ({
            kpiId,
            value: data?.kpis?.[kpiId] ?? null,
          }))}
        />

        {error && (
          <p style={{ color: "#EF4444", fontSize: 14 }}>
            Erro ao carregar dados. Verifique os CSVs e tente novamente.
          </p>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }}>
          {(config?.chartIds ?? []).map((id) => {
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
