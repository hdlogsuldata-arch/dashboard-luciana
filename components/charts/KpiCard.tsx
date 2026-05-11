"use client";

import { KPI_REGISTRY } from "../../lib/charts/registry";
import type { KpiId } from "../../lib/charts/registry";
import { formatBRL, formatInt, formatPct, formatDays } from "../../lib/formatter";

type Props = {
  kpiId: KpiId;
  value: number | null; // null = loading (skeleton)
  position?: 1 | 2 | 3 | 4;
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

export default function KpiCard({ kpiId, value, position }: Props) {
  const meta = KPI_REGISTRY.find((k) => k.id === kpiId);

  if (!meta) return null;

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
        // Skeleton
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

      <p
        style={{
          margin: 0,
          fontSize: 11,
          color: "#646C7F",
        }}
      >
        {meta.id} · {meta.section}
      </p>
    </div>
  );
}
