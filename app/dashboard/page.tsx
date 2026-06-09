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
import { useDashboardFilter } from "@/lib/dashboardFilters";
import { rangeToQuery } from "@/lib/data/dateRange";

type KpiSlot = { position: number; kpiId: string };

type ApiData = {
  kpis: Record<string, number>;
  charts: Record<string, ChartCompareDatum[]>;
};

type SectionConfig = { chartIds: string[] };
type Configs = Record<"financeiro" | "operacional" | "frota", SectionConfig>;

export default function DashboardHome() {
  const router = useRouter();
  const { range } = useDashboardFilter();

  const [kpiSlots, setKpiSlots] = useState<KpiSlot[] | null>(null);
  const [configs, setConfigs]   = useState<Configs | null>(null);
  const [finData, setFinData]   = useState<ApiData | null>(null);
  const [oprData, setOprData]   = useState<ApiData | null>(null);
  const [fltData, setFltData]   = useState<ApiData | null>(null);

  // Section configs: fetch once, independent of ref
  useEffect(() => {
    Promise.all([
      fetch("/api/me/section-config?section=financeiro").then((r) => r.json()),
      fetch("/api/me/section-config?section=operacional").then((r) => r.json()),
      fetch("/api/me/section-config?section=frota").then((r) => r.json()),
    ])
      .then(([fin, opr, flt]) =>
        setConfigs({
          financeiro:  { chartIds: fin.chartIds  ?? [] },
          operacional: { chartIds: opr.chartIds  ?? [] },
          frota:       { chartIds: flt.chartIds  ?? [] },
        })
      )
      .catch(() => {});
  }, []);

  // Chart data: refetch on every range change
  useEffect(() => {
    setFinData(null);
    setOprData(null);
    setFltData(null);

    const q = `?${rangeToQuery(range)}`;
    Promise.all([
      fetch("/api/kpis/me").then((r) => r.json()).catch(() => ({ slots: [] })),
      fetch(`/api/charts/financeiro${q}`, { cache: "no-store" }).then((r) => r.json()).catch(() => null),
      fetch(`/api/charts/operacional${q}`, { cache: "no-store" }).then((r) => r.json()).catch(() => null),
      fetch(`/api/charts/frota${q}`, { cache: "no-store" }).then((r) => r.json()).catch(() => null),
    ]).then(([kpiRes, fin, opr, flt]) => {
      setKpiSlots(kpiRes.slots ?? []);
      setFinData(fin);
      setOprData(opr);
      setFltData(flt);
    });
  }, [range.startDate.getTime(), range.endDate.getTime()]);

  function getKpiValue(kpiId: string): number | null {
    const meta = KPI_REGISTRY.find((k) => k.id === kpiId);
    if (!meta) return null;
    const source =
      meta.apiSource === "financeiro" ? finData :
      meta.apiSource === "operacional" ? oprData : fltData;
    return source?.kpis?.[kpiId] ?? null;
  }

  // Uses CHART_REGISTRY to find the right data source — no hardcoded arrays
  function getChartData(chartId: string): ChartCompareDatum[] | null {
    const section = CHART_REGISTRY.find((c) => c.id === chartId)?.section;
    if (section === "financeiro")  return finData?.charts?.[chartId] ?? null;
    if (section === "operacional") return oprData?.charts?.[chartId] ?? null;
    if (section === "frota")       return fltData?.charts?.[chartId] ?? null;
    return null;
  }

  const isLoading = kpiSlots === null || finData === null || oprData === null || fltData === null;
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

        {/* KPI row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
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

        {/* 3 section previews */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
          <Section
            title="Financeiro"
            href="/dashboard/financeiro"
            chartIds={(configs?.financeiro.chartIds ?? []).slice(0, 2)}
            getData={getChartData}
          />
          <Section
            title="Operacional"
            href="/dashboard/operacional"
            chartIds={(configs?.operacional.chartIds ?? []).slice(0, 2)}
            getData={getChartData}
          />
          <Section
            title="Frota"
            href="/dashboard/frota"
            chartIds={(configs?.frota.chartIds ?? []).slice(0, 2)}
            getData={getChartData}
          />
        </div>
      </div>
    </AppShell>
  );
}

// ─── Section preview ─────────────────────────────────────────────────────────

type SectionProps = {
  title: string;
  href: string;
  chartIds: string[];
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

      {chartIds.map((id) => {
        const meta = CHART_REGISTRY.find((c) => c.id === id);
        if (!meta) return null;
        return (
          <ChartCard key={id} meta={meta} data={getData(id)} height={180} lineDisabled />
        );
      })}
    </div>
  );
}
