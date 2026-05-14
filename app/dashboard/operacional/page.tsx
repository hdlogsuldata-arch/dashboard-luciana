"use client";

import { useEffect, useState, useMemo } from "react";
import AppShell from "@/components/ui/AppShell";
import ChartCard from "@/components/charts/ChartCard";
import ChartErrorBoundary from "@/components/charts/ChartErrorBoundary";
import KpiStrip from "@/components/charts/KpiStrip";
import MetasStrip, { type MetaStripItem } from "@/components/charts/MetasStrip";
import GlobalFilterBar from "@/components/dashboard/GlobalFilterBar";
import { CHART_REGISTRY, KPI_REGISTRY } from "@/lib/charts/registry";
import { KPI_BETTER_WHEN, KPI_TO_CHART_TARGETS, KPI_DONUT_BADGE_TARGETS } from "@/lib/charts/metaTargets";
import type { DonutBadge } from "@/components/charts/ChartCard";
import { unitFormatter } from "@/lib/formatter";
import type { MetricUnit } from "@/lib/formatter";
import type { ChartCompareDatum, TargetLine } from "@/lib/chartTypes";
import type { KpiTarget } from "@/components/charts/KpiCard";
import { useDashboardFilter } from "@/lib/dashboardFilters";

type ApiData = {
  kpis: Record<string, number>;
  charts: Record<string, ChartCompareDatum[]>;
};

type SectionConfig = { chartIds: string[]; kpiIds: string[] };

interface ApiMeta {
  id: string;
  titulo: string;
  kpiId: string;
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

  // KPI targets: one meta per kpiId (first match)
  const kpiTargets = useMemo(() => {
    const result: Record<string, KpiTarget> = {};
    for (const m of metas) {
      if (!result[m.kpiId]) {
        const kpi = KPI_REGISTRY.find((k) => k.id === m.kpiId);
        if (kpi) {
          result[m.kpiId] = {
            value: m.targetValue,
            formatted: unitFormatter[kpi.format as MetricUnit](m.targetValue),
            titulo: m.titulo,
            status: m.status,
            betterWhen: KPI_BETTER_WHEN[m.kpiId] ?? "higher",
          };
        }
      }
    }
    return result;
  }, [metas]);

  // Donut badge targets: maps chartId → DonutBadge (for donut charts with pct metas)
  const donutBadges = useMemo(() => {
    const result: Record<string, DonutBadge> = {};
    for (const m of metas) {
      const chartIds = KPI_DONUT_BADGE_TARGETS[m.kpiId] ?? [];
      const kpi = KPI_REGISTRY.find((k) => k.id === m.kpiId);
      const bw = KPI_BETTER_WHEN[m.kpiId] ?? "higher";
      for (const chartId of chartIds) {
        if (!result[chartId] && kpi) {
          result[chartId] = {
            op: bw === "higher" ? "≥" : "≤",
            formatted: unitFormatter[kpi.format as MetricUnit](m.targetValue),
            titulo: m.titulo,
          };
        }
      }
    }
    return result;
  }, [metas]);

  // Chart targets: maps chartId → TargetLine
  const chartTargets = useMemo(() => {
    const result: Record<string, TargetLine> = {};
    for (const m of metas) {
      const chartIds = KPI_TO_CHART_TARGETS[m.kpiId] ?? [];
      const bw = KPI_BETTER_WHEN[m.kpiId] ?? "higher";
      for (const chartId of chartIds) {
        if (!result[chartId]) {
          result[chartId] = {
            value: m.targetValue,
            label: m.titulo,
            op: bw === "higher" ? ">=" : "<=",
          };
        }
      }
    }
    return result;
  }, [metas]);

  // Extended targets: adds pct→count conversion for donut charts that also support bar mode.
  // OPR_001 (OTD Index): target% × total deliveries (sum of OPR_001 data) → count for bar mode.
  const allChartTargets = useMemo(() => {
    const result = { ...chartTargets };
    for (const m of metas) {
      if (m.kpiId === "KPI_003") {
        const opr001 = data?.charts?.["OPR_001"];
        if (opr001?.length) {
          const total = opr001.reduce((sum, d) => sum + d.value, 0);
          if (total > 0) {
            result["OPR_001"] = {
              value: m.targetValue * total,
              label: m.titulo,
              op: ">=",
            };
          }
        }
      }
    }
    return result;
  }, [chartTargets, metas, data]);

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
            target: kpiTargets[kpiId],
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
                  targetLine={allChartTargets[id]}
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
