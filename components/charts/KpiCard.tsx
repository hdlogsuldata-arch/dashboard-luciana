"use client";

import { KPI_REGISTRY } from "../../lib/charts/registry";
import type { KpiId } from "../../lib/charts/registry";
import { formatBRL, formatInt, formatPct, formatDays } from "../../lib/formatter";

type MetaStatus = "NO_PRAZO" | "EM_RISCO" | "ATRASADA" | "ALCANCADA";

const STATUS_COLORS: Record<MetaStatus, { text: string; label: string }> = {
  NO_PRAZO:  { text: "rgb(110,231,183)", label: "No Prazo" },
  EM_RISCO:  { text: "rgb(253,211,77)",  label: "Em Risco" },
  ATRASADA:  { text: "rgb(252,165,165)", label: "Atrasada" },
  ALCANCADA: { text: "rgb(147,197,253)", label: "Atingida" },
};

export interface KpiTarget {
  value: number;
  formatted: string;
  titulo: string;
  status: MetaStatus;
  betterWhen: "higher" | "lower";
}

type Props = {
  kpiId: KpiId;
  value: number | null; // null = loading (skeleton)
  position?: 1 | 2 | 3 | 4;
  target?: KpiTarget;
};

function formatValue(value: number, format: string): string {
  switch (format) {
    case "brl":  return formatBRL(value);
    case "int":  return formatInt(value);
    case "pct":  return formatPct(value);
    case "days": return formatDays(value);
    default:     return String(value);
  }
}

export default function KpiCard({ kpiId, value, position, target }: Props) {
  const meta = KPI_REGISTRY.find((k) => k.id === kpiId);

  if (!meta) return null;

  // Determine if current value meets the meta target
  let targetMet: boolean | null = null;
  if (target && value !== null) {
    targetMet =
      target.betterWhen === "higher"
        ? value >= target.value
        : value <= target.value;
  }

  const statusColor = target ? STATUS_COLORS[target.status] : null;
  const opLabel = target
    ? target.betterWhen === "higher" ? "≥" : "≤"
    : "";

  return (
    <div
      aria-label={position ? `KPI slot ${position}: ${meta.title}` : meta.title}
      style={{
        background: "#1F1C30",
        border: "1px solid #3E3960",
        borderRadius: 10,
        padding: "16px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        minWidth: 0,
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 12,
          color: "#94A3B8",
          fontWeight: 500,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {meta.title}
      </p>

      {value === null ? (
        <div
          style={{
            height: 32,
            borderRadius: 6,
            background: "rgba(62,57,96,0.4)",
            animation: "pulse 1.5s ease-in-out infinite",
            width: "70%",
          }}
        />
      ) : (
        <p
          style={{
            margin: 0,
            fontSize: 28,
            fontWeight: 700,
            color: meta.accentColor,
            lineHeight: 1.1,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {formatValue(value, meta.format)}
        </p>
      )}

      <p style={{ margin: 0, fontSize: 11, color: "#646C7F" }}>
        {meta.id} · {meta.section}
      </p>

      {/* Meta target indicator */}
      {target && value !== null && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            paddingTop: 6,
            borderTop: "1px solid rgba(62,57,96,0.5)",
          }}
        >
          {/* Target met/miss dot */}
          <span
            style={{
              display: "inline-block",
              width: 6,
              height: 6,
              borderRadius: "50%",
              flexShrink: 0,
              background: targetMet ? "rgb(110,231,183)" : "rgb(252,165,165)",
            }}
          />
          <span style={{ fontSize: 10, color: "#646C7F" }}>Meta:</span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: "#CBD5E1",
              fontFamily: "monospace",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              flex: 1,
            }}
          >
            {opLabel} {target.formatted}
          </span>
          {statusColor && (
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: statusColor.text,
                flexShrink: 0,
              }}
            >
              {statusColor.label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
