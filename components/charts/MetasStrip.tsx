"use client";

import { useState } from "react";
import { KPI_REGISTRY } from "../../lib/charts/registry";
import { unitFormatter } from "../../lib/formatter";
import type { MetricUnit } from "../../lib/formatter";

type MetaStatus = "NO_PRAZO" | "EM_RISCO" | "ATRASADA" | "ALCANCADA";

export interface MetaStripItem {
  id: string;
  titulo: string;
  kpiId: string;
  targetValue: number;
  deadline: string; // ISO
  status: MetaStatus;
}

const STATUS_CONFIG: Record<MetaStatus, { color: string; label: string; border: string }> = {
  NO_PRAZO:  { color: "rgb(110,231,183)", label: "No Prazo", border: "rgba(16,185,129,0.35)" },
  EM_RISCO:  { color: "rgb(253,211,77)",  label: "Em Risco", border: "rgba(245,158,11,0.35)" },
  ATRASADA:  { color: "rgb(252,165,165)", label: "Atrasada", border: "rgba(239,68,68,0.35)"  },
  ALCANCADA: { color: "rgb(147,197,253)", label: "Atingida", border: "rgba(59,130,246,0.35)" },
};

function MetaCard({ item }: { item: MetaStripItem }) {
  const kpi = KPI_REGISTRY.find((k) => k.id === item.kpiId);
  const s = STATUS_CONFIG[item.status];
  const formatted = kpi
    ? unitFormatter[kpi.format as MetricUnit](item.targetValue)
    : String(item.targetValue);
  const deadline = new Date(item.deadline).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });

  return (
    <div
      style={{
        flexShrink: 0,
        width: 210,
        background: "#1F1C30",
        border: `1px solid ${s.border}`,
        borderLeft: `3px solid ${s.color}`,
        borderRadius: 8,
        padding: "10px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        cursor: "default",
      }}
    >
      {/* Status + deadline */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: s.color,
            letterSpacing: "0.3px",
          }}
        >
          {s.label}
        </span>
        <span style={{ fontSize: 10, color: "#646C7F" }}>{deadline}</span>
      </div>

      {/* Title */}
      <p
        style={{
          margin: 0,
          fontSize: 12,
          fontWeight: 600,
          color: "#FFFFFF",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {item.titulo}
      </p>

      {/* KPI + target */}
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        {kpi && (
          <span
            style={{
              display: "inline-block",
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: kpi.accentColor,
              flexShrink: 0,
            }}
          />
        )}
        <span
          style={{
            fontSize: 10,
            color: "#94A3B8",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            flex: 1,
          }}
        >
          {kpi?.title ?? item.kpiId}
        </span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: "#CBD5E1",
            fontFamily: "monospace",
            flexShrink: 0,
          }}
        >
          {formatted}
        </span>
      </div>
    </div>
  );
}

// Collapse icon
const ChevronIcon = ({ up }: { up: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
    <path
      d={up ? "M5 13l5-5 5 5" : "M5 7l5 5 5-5"}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconTarget = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="12" cy="12" r="6"  stroke="currentColor" strokeWidth="1.5" />
    <circle cx="12" cy="12" r="2"  fill="currentColor" />
  </svg>
);

export default function MetasStrip({ metas }: { metas: MetaStripItem[] }) {
  const [collapsed, setCollapsed] = useState(false);

  if (!metas.length) return null;

  return (
    <div
      style={{
        background: "rgba(31,28,48,0.5)",
        border: "1px solid #3E3960",
        borderRadius: 10,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 16px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          fontFamily: "inherit",
          color: "#94A3B8",
          borderBottom: collapsed ? "none" : "1px solid #3E3960",
          transition: "border-color 0.15s",
        }}
      >
        <span style={{ color: "rgb(243,222,61)", display: "flex" }}>
          <IconTarget />
        </span>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#CBD5E1" }}>
          Metas desta seção
        </span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            background: "rgba(243,222,61,0.12)",
            color: "rgb(243,222,61)",
            border: "1px solid rgba(243,222,61,0.25)",
            borderRadius: 999,
            padding: "1px 7px",
          }}
        >
          {metas.length}
        </span>
        <span style={{ marginLeft: "auto", color: "#646C7F" }}>
          <ChevronIcon up={!collapsed} />
        </span>
      </button>

      {/* Cards */}
      {!collapsed && (
        <div
          style={{
            display: "flex",
            gap: 12,
            padding: "12px 16px",
            overflowX: "auto",
            scrollbarWidth: "thin",
          }}
        >
          {metas.map((m) => (
            <MetaCard key={m.id} item={m} />
          ))}
        </div>
      )}
    </div>
  );
}
