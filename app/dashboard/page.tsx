"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/ui/AppShell";
import KpiCard from "@/components/charts/KpiCard";
import ChartCard from "@/components/charts/ChartCard";
import GlobalFilterBar from "@/components/dashboard/GlobalFilterBar";
import { KPI_REGISTRY, CHART_REGISTRY } from "@/lib/charts/registry";
import type { KpiId } from "@/lib/charts/registry";
import type { ChartCompareDatum } from "@/lib/chartTypes";
import { useDashboardFilter, formatMonthLabel } from "@/lib/dashboardFilters";

// KPI slot shape from /api/kpis/me
type KpiSlot = { position: number; kpiId: string };

// All chart + KPI data fetched from the 3 API routes
type ApiData = {
  kpis: Record<string, number>;
  charts: Record<string, ChartCompareDatum[]>;
};

// Mini-chart ids shown on the home page
const HOME_FIN_CHARTS  = ["FIN_001", "FIN_003"] as const;
const HOME_OPR_CHARTS  = ["OPR_001", "OPR_002"] as const;
const HOME_FLT_CHARTS  = ["FLT_001", "FLT_002"] as const;

export default function DashboardHome() {
  const router = useRouter();
  const { ref } = useDashboardFilter();

  const [kpiSlots, setKpiSlots]   = useState<KpiSlot[] | null>(null);
  const [finData, setFinData]     = useState<ApiData | null>(null);
  const [oprData, setOprData]     = useState<ApiData | null>(null);
  const [fltData, setFltData]     = useState<ApiData | null>(null);

  useEffect(() => {
    // Reset data on ref change to show loading state
    setFinData(null);
    setOprData(null);
    setFltData(null);

    const q = `?ref=${encodeURIComponent(ref)}`;
    Promise.all([
      fetch("/api/kpis/me").then((r) => r.json()).catch(() => ({ slots: [] })),
      fetch(`/api/charts/financeiro${q}`).then((r) => r.json()).catch(() => null),
      fetch(`/api/charts/operacional${q}`).then((r) => r.json()).catch(() => null),
      fetch(`/api/charts/frota${q}`).then((r) => r.json()).catch(() => null),
    ]).then(([kpiRes, fin, opr, flt]) => {
      setKpiSlots(kpiRes.slots ?? []);
      setFinData(fin);
      setOprData(opr);
      setFltData(flt);
    });
  }, [ref]);

  // Build the 4 KPI slots with their values
  function getKpiValue(kpiId: string): number | null {
    const meta = KPI_REGISTRY.find((k) => k.id === kpiId);
    if (!meta) return null;
    const source =
      meta.apiSource === "financeiro" ? finData :
      meta.apiSource === "operacional" ? oprData : fltData;
    return source?.kpis?.[kpiId] ?? null;
  }

  function getChartData(chartId: string): ChartCompareDatum[] | null {
    if (HOME_FIN_CHARTS.includes(chartId as typeof HOME_FIN_CHARTS[number])) {
      return finData?.charts?.[chartId] ?? null;
    }
    if (HOME_OPR_CHARTS.includes(chartId as typeof HOME_OPR_CHARTS[number])) {
      return oprData?.charts?.[chartId] ?? null;
    }
    return fltData?.charts?.[chartId] ?? null;
  }

  const isLoading = kpiSlots === null || finData === null || oprData === null || fltData === null;

  // Slots in order; fallback to empty array while loading
  const slots = kpiSlots ?? [];

  return (
    <AppShell>
      <div style={{ padding: "32px 36px", display: "flex", flexDirection: "column", gap: 32 }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#FFFFFF" }}>
              Dashboard HDLOG
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#94A3B8" }}>
              Visão geral
            </p>
          </div>
          <GlobalFilterBar />
        </div>

        {/* KPI row — 4 slots */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16,
          }}
        >
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    background: "#1F1C30",
                    border: "1px solid #3E3960",
                    borderRadius: 10,
                    height: 100,
                    opacity: 0.5,
                  }}
                />
              ))
            : slots.slice(0, 4).map((slot) => (
                <KpiCard
                  key={slot.kpiId}
                  kpiId={slot.kpiId as KpiId}
                  value={getKpiValue(slot.kpiId)}
                  position={slot.position as 1 | 2 | 3 | 4}
                />
              ))}
        </div>

        {/* 3 sections: mini charts */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 24,
          }}
        >
          <Section
            title="Financeiro"
            href="/dashboard/financeiro"
            chartIds={HOME_FIN_CHARTS}
            getData={getChartData}
          />
          <Section
            title="Operacional"
            href="/dashboard/operacional"
            chartIds={HOME_OPR_CHARTS}
            getData={getChartData}
          />
          <Section
            title="Frota"
            href="/dashboard/frota"
            chartIds={HOME_FLT_CHARTS}
            getData={getChartData}
          />
        </div>
      </div>
    </AppShell>
  );
}

// ─── Section ────────────────────────────────────────────────────────────────

type SectionProps = {
  title: string;
  href: string;
  chartIds: readonly string[];
  getData: (id: string) => ChartCompareDatum[] | null;
};

function Section({ title, href, chartIds, getData }: SectionProps) {
  const router = useRouter();

  return (
    <div
      style={{
        background: "#1F1C30",
        border: "1px solid #3E3960",
        borderRadius: 12,
        padding: "20px 20px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {/* Section header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#FFFFFF" }}>
          {title}
        </h2>
        <button
          onClick={() => router.push(href)}
          style={{
            fontSize: 12,
            color: "#F3DE3D",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          Ver mais →
        </button>
      </div>

      {/* Mini charts */}
      {chartIds.map((id) => {
        const meta = CHART_REGISTRY.find((c) => c.id === id);
        if (!meta) return null;
        return (
          <ChartCard
            key={id}
            meta={meta}
            data={getData(id)}
            height={180}
            lineDisabled
          />
        );
      })}
    </div>
  );
}
