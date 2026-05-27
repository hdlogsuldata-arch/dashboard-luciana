"use client";

import { useState, useMemo } from "react";
import { Maximize2 } from "lucide-react";
import type { ChartType, ChartCompareDatum, ChartSeries, TargetLine } from "../../lib/chartTypes";
import type { ChartMetadata } from "../../lib/charts/types";
import { ChartRenderer } from "./ChartRenderer";
import ChartTypeToggle from "./ChartTypeToggle";
import ChartFullscreen from "./ChartFullscreen";
import SeriesFilterButton from "./SeriesFilterButton";
import { unitFormatter } from "../../lib/formatter";
import { useDashboardFilter, formatDateRangeLabel } from "../../lib/dashboardFilters";

export interface DonutBadge {
  op: "≥" | "≤";
  formatted: string; // pre-formatted value (e.g. "95,0%")
  titulo: string;
}

type Props = {
  meta: ChartMetadata;
  data: ChartCompareDatum[] | null;
  series?: ChartSeries[];
  height?: number;
  lineDisabled?: boolean;
  targetLine?: TargetLine;
  donutBadge?: DonutBadge;
};

export default function ChartCard({
  meta,
  data,
  series,
  height = 280,
  lineDisabled = true,
  targetLine,
  donutBadge,
}: Props) {
  const [activeType, setActiveType] = useState<ChartType>(meta.defaultType);
  const [fullscreen, setFullscreen] = useState(false);
  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(new Set());
  const { range } = useDashboardFilter();

  const showDonutBadge = donutBadge && activeType === "donut";

  // ── Chaves disponíveis para filtro (dependem do tipo ativo) ──────────────
  const allKeys = useMemo(() => {
    if (activeType === "line") return (series ?? []).map((s) => s.name);
    return (data ?? []).map((d) => d.name);
  }, [activeType, series, data]);

  // Exibe botão de filtro somente quando há mais de 4 itens
  const showFilter = allKeys.length > 4;

  // ── Dados filtrados ──────────────────────────────────────────────────────
  const filteredData = useMemo(() => {
    if (!data || hiddenKeys.size === 0) return data;
    return data.filter((d) => !hiddenKeys.has(d.name));
  }, [data, hiddenKeys]);

  const filteredSeries = useMemo(() => {
    if (!series || hiddenKeys.size === 0) return series;
    return series.filter((s) => !hiddenKeys.has(s.name));
  }, [series, hiddenKeys]);

  // ── Handlers de filtro ───────────────────────────────────────────────────
  const handleToggleKey = (key: string) => {
    setHiddenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSelectAll = () => setHiddenKeys(new Set());
  const handleDeselectAll = () => setHiddenKeys(new Set(allKeys));

  return (
    <>
      <div
        style={{
          background: "#1F1C30",
          border: "1px solid #3E3960",
          borderRadius: 12,
          padding: "20px 24px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ margin: 0, fontSize: 11, color: "#646C7F", fontWeight: 500 }}>
              {meta.id}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <h3
                style={{
                  margin: 0,
                  fontSize: 16,
                  fontWeight: 600,
                  color: "#FFFFFF",
                  lineHeight: 1.3,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {meta.title}
              </h3>

              {/* Meta badge — shown instead of a reference line for donut charts */}
              {showDonutBadge && (
                <span
                  title={donutBadge.titulo}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "2px 7px",
                    borderRadius: 999,
                    background: "rgba(243,222,61,0.1)",
                    border: "1px dashed rgba(243,222,61,0.5)",
                    color: "#F3DE3D",
                    fontSize: 11,
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  Meta {donutBadge.op} {donutBadge.formatted}
                </span>
              )}
            </div>
          </div>

          {/* Controles: tipo + filtro + tela cheia */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {meta.supportedTypes.length > 1 && (
              <ChartTypeToggle
                supported={meta.supportedTypes}
                value={activeType}
                onChange={setActiveType}
                lineDisabled={lineDisabled}
              />
            )}

            {/* Botão de filtro — só aparece quando há mais de 4 dados */}
            {showFilter && (
              <SeriesFilterButton
                allKeys={allKeys}
                hiddenKeys={hiddenKeys}
                onToggle={handleToggleKey}
                onSelectAll={handleSelectAll}
                onDeselectAll={handleDeselectAll}
              />
            )}

            <button
              onClick={() => setFullscreen(true)}
              title="Tela cheia"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 28,
                height: 28,
                borderRadius: 6,
                border: "1px solid #3E3960",
                background: "transparent",
                color: "#646C7F",
                cursor: "pointer",
                flexShrink: 0,
                transition: "color 0.15s, border-color 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = "#F3DE3D";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#F3DE3D";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = "#646C7F";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#3E3960";
              }}
            >
              <Maximize2 size={13} />
            </button>
          </div>
        </div>

        {/* Chart — usa dados já filtrados */}
        <ChartRenderer
          type={activeType}
          compareData={filteredData ?? []}
          series={filteredSeries ?? []}
          loading={data === null}
          height={height}
          metricFormat={unitFormatter[meta.metricFormat]}
          targetLine={targetLine}
        />
      </div>

      {fullscreen && (
        <ChartFullscreen
          meta={meta}
          data={filteredData}
          series={filteredSeries}
          activeType={activeType}
          onChangeType={setActiveType}
          onClose={() => setFullscreen(false)}
          rangeLabel={formatDateRangeLabel(range)}
          lineDisabled={lineDisabled}
          targetLine={targetLine}
          donutBadge={donutBadge}
          allKeys={showFilter ? allKeys : undefined}
          hiddenKeys={hiddenKeys}
          onToggleKey={handleToggleKey}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
        />
      )}
    </>
  );
}
