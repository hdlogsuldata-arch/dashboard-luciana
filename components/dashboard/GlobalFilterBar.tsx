"use client";

import { useDashboardFilter, formatMonthLabel } from "@/lib/dashboardFilters";
import { Calendar } from "lucide-react";

export default function GlobalFilterBar() {
  const { ref, setRef, availableMonths } = useDashboardFilter();

  if (availableMonths.length <= 1) {
    // Single month — show label only, no dropdown needed
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 13,
          color: "#94A3B8",
        }}
      >
        <Calendar size={14} style={{ color: "#646C7F" }} />
        <span>Referência:</span>
        <span style={{ color: "#F3DE3D", fontWeight: 500 }}>
          {formatMonthLabel(ref)}
        </span>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <Calendar size={14} style={{ color: "#646C7F" }} />
      <span style={{ fontSize: 13, color: "#94A3B8" }}>Referência:</span>
      <select
        value={ref}
        onChange={(e) => setRef(e.target.value)}
        style={{
          background: "#1F1C30",
          border: "1px solid #3E3960",
          borderRadius: 6,
          color: "#F3DE3D",
          fontSize: 13,
          fontWeight: 500,
          padding: "3px 8px",
          cursor: "pointer",
          outline: "none",
        }}
      >
        {availableMonths.map((m) => (
          <option key={m} value={m} style={{ background: "#1F1C30", color: "#FFFFFF" }}>
            {formatMonthLabel(m)}
          </option>
        ))}
      </select>
    </div>
  );
}
