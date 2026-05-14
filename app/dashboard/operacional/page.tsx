"use client";

import { useEffect, useState, useMemo } from "react";
import AppShell from "@/components/ui/AppShell";
import ChartCard from "@/components/charts/ChartCard";
import ChartErrorBoundary from "@/components/charts/ChartErrorBoundary";
import KpiStrip from "@/components/charts/KpiStrip";
import MetasStrip, { type MetaStripItem } from "@/components/charts/MetasStrip";
import GlobalFilterBar from "@/components/dashboard/GlobalFilterBar";
import { CHART_REGISTRY } from "@/lib/charts/registry";
import type { DonutBadge } from "@/components/charts/ChartCard";
import { unitFormatter } from "@/lib/formatter";
import type { MetricUnit } from "@/lib/formatter";
import type { ChartCompareDatum, TargetLine } from "@/lib/chartTypes";
import { useDashboardFilter } from "@/lib/dashboardFilters";

type ApiData = {
  kpis: Record<string, number>;
  charts: Record<string, ChartCompareDatum[]>;
};

type SectionConfig = { chartIds: string[]; kpiIds: string[] };

interface ApiMeta {
  id: string;
  titulo: string;
  chartId: string;
  op: string;
  targetValue: number;
  deadline: string;
  status: "NO_PRAZO" | "EM_RISCO" | "ATRASADA" | "ALCANCADA";
}

export default function OperacionalPage() {
  const { ref } = useDashboardFilter();
  const [config, setConfig] = useState<SectionConfig | null>(null);
  const [data, setData] = useState<ApiData | null>(null);
  const [error, setError] = useState(false);
  const [metas, setMetas] = useState<ApiMeta[]>([]);

  useEffect(() => {
    fetch("/api/me/section-config?section=operacional")
      .then((r) => r.json())
      .then(setConfig)
      .catch(() => {});
  }, []);

  useEffect(() => {
    setData(null);
    setError(false);
    fetch(`/api/charts/operacional?ref=${encodeURIComponent(ref)}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setError(true));
  }, [ref]);

  useEffect(() => {
    fetch("/api/metas?section=operacional")
      .then((r) => r.json())
      .then((d) => setMetas(d.metas ?? []))
      .catch(() => {});
  }, []);

  // Direct chart targets from meta.chartId
  const chartTargets = useMemo(() => {
    const result: Record<string, TargetLine> = {};
    for (const m of metas) {
      if (!result[m.chartId]) {
        result[m.chartId] = {
          value: m.targetValue,
          label: m.titulo,
          op: m.op as ">=" | "<=",
        };
      }
    }
    return result;
  }, [metas]);

  // Donut badges for charts whose defaultType is "donut"
  const donutBadges = useMemo(() => {
    const result: Record<string, DonutBadge> = {};
    for (const m of metas) {
      const chart = CHART_REGISTRY.find((c) => c.id === m.chartId);
      if (chart?.defaultType === "donut" && !result[m.chartId]) {
        result[m.chartId] = {
          op: m.op === ">=" ? "≥" : "≤",
          formatted: unitFormatter[chart.metricFormat as MetricUnit](m.targetValue),
          titulo: m.titulo,
        };
      }
    }
    return result;
  }, [metas]);

  return (
    <AppShell>
      <div style={{ padding: "32px 36px", display: "flex", flexDirection: "column", gap: 28 }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#FFFFFF" }}>
              Dashboard Operacional
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#94A3B8" }}>
              Entregas · Pipeline · Faturamento
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

        <MetasStrip metas={metas as MetaStripItem[]} />

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
                <ChartCard
                  meta={meta}
                  data={data?.charts?.[id] ?? null}
                  lineDisabled
                  targetLine={chartTargets[id]}
                  donutBadge={donutBadges[id]}
                />
              </ChartErrorBoundary>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
