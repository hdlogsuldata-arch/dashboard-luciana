"use client";

import { useEffect, useRef, useState } from "react";
import { Calendar, ChevronDown, X } from "lucide-react";
import { useDashboardFilter } from "@/lib/dashboardFilters";
import {
  PRESET_LABELS,
  PRESET_ORDER,
  customRange,
  formatDateRangeLabel,
  fromIsoDate,
  toIsoDate,
  type DatePreset,
} from "@/lib/data/dateRange";

const COLORS = {
  bg: "#1F1C30",
  border: "#3E3960",
  text: "#FFFFFF",
  textMuted: "#94A3B8",
  textDim: "#646C7F",
  accent: "#F3DE3D",
  highlight: "rgba(243, 222, 61, 0.12)",
};

export default function GlobalFilterBar() {
  const { range, setRange, setPreset, globalRange } = useDashboardFilter();
  const [open, setOpen] = useState(false);
  const [customStart, setCustomStart] = useState(toIsoDate(range.startDate));
  const [customEnd, setCustomEnd] = useState(toIsoDate(range.endDate));
  const [error, setError] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Sincroniza inputs quando o range muda externamente
  useEffect(() => {
    setCustomStart(toIsoDate(range.startDate));
    setCustomEnd(toIsoDate(range.endDate));
  }, [range.startDate, range.endDate]);

  // Fecha o popover ao clicar fora
  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      const target = e.target as Node;
      if (popoverRef.current?.contains(target)) return;
      if (buttonRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  function handlePreset(p: DatePreset) {
    setPreset(p);
    setError(null);
    setOpen(false);
  }

  function handleApplyCustom() {
    const sd = fromIsoDate(customStart);
    const ed = fromIsoDate(customEnd);
    if (!sd || !ed) {
      setError("Datas inválidas.");
      return;
    }
    if (ed < sd) {
      setError("A data final deve ser igual ou posterior à inicial.");
      return;
    }
    setError(null);
    setRange(customRange(sd, ed));
    setOpen(false);
  }

  const minDate = globalRange ? toIsoDate(globalRange.earliest) : undefined;
  const maxDate = globalRange ? toIsoDate(globalRange.latest) : undefined;

  return (
    <div style={{ position: "relative" }}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: COLORS.bg,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 6,
          color: COLORS.accent,
          fontSize: 13,
          fontWeight: 500,
          padding: "5px 10px",
          cursor: "pointer",
        }}
      >
        <Calendar size={14} style={{ color: COLORS.textDim }} />
        <span style={{ color: COLORS.textMuted }}>Período:</span>
        <span>{formatDateRangeLabel(range)}</span>
        <ChevronDown size={14} style={{ color: COLORS.textDim }} />
      </button>

      {open && (
        <div
          ref={popoverRef}
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            display: "flex",
            background: COLORS.bg,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 8,
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            zIndex: 50,
            minWidth: 460,
            overflow: "hidden",
            colorScheme: "dark",
          }}
        >
          {/* Coluna esquerda: presets */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              padding: "8px 0",
              borderRight: `1px solid ${COLORS.border}`,
              minWidth: 180,
            }}
          >
            {PRESET_ORDER.map((p) => {
              const isSelected = range.preset === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => handlePreset(p)}
                  style={{
                    background: isSelected ? COLORS.highlight : "transparent",
                    border: "none",
                    color: isSelected ? COLORS.accent : COLORS.text,
                    fontSize: 13,
                    textAlign: "left",
                    padding: "8px 16px",
                    cursor: "pointer",
                  }}
                >
                  {PRESET_LABELS[p]}
                </button>
              );
            })}
          </div>

          {/* Coluna direita: range customizado */}
          <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: COLORS.textMuted, fontWeight: 500 }}>
                Personalizado
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                style={{ background: "transparent", border: "none", color: COLORS.textDim, cursor: "pointer", padding: 0 }}
                aria-label="Fechar"
              >
                <X size={14} />
              </button>
            </div>

            <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: COLORS.textMuted }}>
              De
              <input
                type="date"
                value={customStart}
                min={minDate}
                max={maxDate}
                onChange={(e) => setCustomStart(e.target.value)}
                style={{
                  background: "#15121F",
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 4,
                  color: COLORS.text,
                  fontSize: 13,
                  padding: "5px 8px",
                  colorScheme: "dark",
                }}
              />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: COLORS.textMuted }}>
              Até
              <input
                type="date"
                value={customEnd}
                min={minDate}
                max={maxDate}
                onChange={(e) => setCustomEnd(e.target.value)}
                style={{
                  background: "#15121F",
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 4,
                  color: COLORS.text,
                  fontSize: 13,
                  padding: "5px 8px",
                  colorScheme: "dark",
                }}
              />
            </label>

            {error && (
              <span style={{ fontSize: 12, color: "#F87171" }}>{error}</span>
            )}

            {globalRange && (
              <span style={{ fontSize: 11, color: COLORS.textDim }}>
                Dados disponíveis: {globalRange.earliest.toLocaleDateString("pt-BR")} —{" "}
                {globalRange.latest.toLocaleDateString("pt-BR")}
              </span>
            )}

            <button
              type="button"
              onClick={handleApplyCustom}
              style={{
                background: COLORS.accent,
                border: "none",
                borderRadius: 4,
                color: "#15121F",
                fontSize: 13,
                fontWeight: 600,
                padding: "6px 12px",
                cursor: "pointer",
                marginTop: 4,
              }}
            >
              Aplicar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
