"use client";

import { useState } from "react";
import { Maximize2 } from "lucide-react";
import type { ChartType, ChartCompareDatum, ChartSeries, TargetLine } from "../../lib/chartTypes";
import type { ChartMetadata } from "../../lib/charts/types";
import { ChartRenderer } from "./ChartRenderer";
import ChartTypeToggle from "./ChartTypeToggle";
import ChartFullscreen from "./ChartFullscreen";
import { unitFormatter } from "../../lib/formatter";
import { useDashboardFilter } from "../../lib/dashboardFilters";

type Props = {
  meta: ChartMetadata;
  data: ChartCompareDatum[] | null; // null = loading
  series?: ChartSeries[];
  height?: number;
  lineDisabled?: boolean;
  targetLine?: TargetLine;
};

export default function ChartCard({
  meta,
  data,
  series,
  height = 280,
  lineDisabled = true,
  targetLine,
}: Props) {
  const [activeType, setActiveType] = useState<ChartType>(meta.defaultType);
  const [fullscreen, setFullscreen] = useState(false);
  const { ref } = useDashboardFilter();

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
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 11, color: "#646C7F", fontWeight: 500 }}>
              {meta.id}
            </p>
            <h3
              style={{
                margin: 0,
                fontSize: 14,
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
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {meta.supportedTypes.length > 1 && (
              <ChartTypeToggle
                supported={meta.supportedTypes}
                value={activeType}
                onChange={setActiveType}
                lineDisabled={lineDisabled}
              />
            )}

            {/* Expand button */}
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

        {/* Chart */}
        <ChartRenderer
          type={activeType}
          compareData={data ?? []}
          series={series ?? []}
          loading={data === null}
          height={height}
          metricFormat={unitFormatter[meta.metricFormat]}
          targetLine={targetLine}
        />
      </div>

      {/* Fullscreen overlay (portal) */}
      {fullscreen && (
        <ChartFullscreen
          meta={meta}
          data={data}
          series={series}
          activeType={activeType}
          onChangeType={setActiveType}
          onClose={() => setFullscreen(false)}
          ref_={ref}
          lineDisabled={lineDisabled}
          targetLine={targetLine}
        />
      )}
    </>
  );
}
