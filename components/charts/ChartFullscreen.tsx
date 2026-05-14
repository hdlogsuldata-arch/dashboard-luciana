"use client";

import { useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { ChartRenderer } from "./ChartRenderer";
import ChartTypeToggle from "./ChartTypeToggle";
import type { ChartType, ChartCompareDatum, ChartSeries, TargetLine } from "../../lib/chartTypes";
import type { ChartMetadata } from "../../lib/charts/types";
import type { DonutBadge } from "./ChartCard";
import { unitFormatter } from "../../lib/formatter";
import { formatMonthLabel } from "../../lib/dashboardFilters";

type Props = {
  meta: ChartMetadata;
  data: ChartCompareDatum[] | null;
  series?: ChartSeries[];
  activeType: ChartType;
  onChangeType: (t: ChartType) => void;
  onClose: () => void;
  ref_: string;
  lineDisabled?: boolean;
  targetLine?: TargetLine;
  donutBadge?: DonutBadge;
};

export default function ChartFullscreen({
  meta,
  data,
  series,
  activeType,
  onChangeType,
  onClose,
  ref_,
  lineDisabled = true,
  targetLine,
  donutBadge,
}: Props) {
  // ESC to close
  const handleKey = useCallback(
    (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKey);
    // Prevent body scroll while open
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [handleKey]);

  const content = (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#0D0B18",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 36px 12px",
          borderBottom: "1px solid #3E3960",
          flexShrink: 0,
          gap: 16,
        }}
      >
        {/* Left: ID + title */}
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 13, color: "#646C7F", fontWeight: 500 }}>
            {meta.id} · {formatMonthLabel(ref_)}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4, flexWrap: "wrap" }}>
            <h2
              style={{
                margin: 0,
                fontSize: 26,
                fontWeight: 700,
                color: "#FFFFFF",
                lineHeight: 1.2,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {meta.title}
            </h2>
            {donutBadge && activeType === "donut" && (
              <span
                title={donutBadge.titulo}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "3px 10px",
                  borderRadius: 999,
                  background: "rgba(243,222,61,0.1)",
                  border: "1px dashed rgba(243,222,61,0.5)",
                  color: "#F3DE3D",
                  fontSize: 13,
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

        {/* Right: toggle + close */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
          {meta.supportedTypes.length > 1 && (
            <ChartTypeToggle
              supported={meta.supportedTypes}
              value={activeType}
              onChange={onChangeType}
              lineDisabled={lineDisabled}
            />
          )}

          <button
            onClick={onClose}
            title="Fechar (ESC)"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 36,
              height: 36,
              borderRadius: 8,
              border: "1px solid #3E3960",
              background: "transparent",
              color: "#94A3B8",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* ── Chart area ───────────────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          padding: "20px 36px 28px",
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <ChartRenderer
          type={activeType}
          compareData={data ?? []}
          series={series ?? []}
          loading={data === null}
          height="100%"
          metricFormat={unitFormatter[meta.metricFormat]}
          fontScale={1.5}
          targetLine={targetLine}
        />
      </div>

      {/* ── ESC hint ─────────────────────────────────────────────────────── */}
      <div
        style={{
          textAlign: "center",
          padding: "0 0 10px",
          fontSize: 11,
          color: "#3E3960",
          flexShrink: 0,
        }}
      >
        Pressione ESC para fechar
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
