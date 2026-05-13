"use client";

import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import {
  CHART_REGISTRY,
  KPI_REGISTRY,
  DEFAULT_KPI_SLOTS,
} from "@/lib/charts/registry";
import Toast, { type ToastItem } from "./Toast";

// ── Color palette (same as UserManagement) ─────────────────────────────────

const C = {
  bg:        "rgb(20,18,32)",
  panel:     "rgb(31,28,48)",
  border:    "rgb(62,57,96)",
  white:     "rgb(255,255,255)",
  textSec:   "rgb(148,163,184)",
  textMuted: "rgb(100,116,139)",
  yellow:    "rgb(243,222,61)",
  brand:     "rgb(30,20,97)",
};

// ── Constants ──────────────────────────────────────────────────────────────

const CHART_SECTIONS = [
  { key: "financeiro"  as const, label: "Financeiro"  },
  { key: "operacional" as const, label: "Operacional" },
  { key: "frota"       as const, label: "Frota"       },
];

// TODO: Replace MOCK_USER with:
//   const params = useParams();
//   const [user, setUser] = useState<UserInfo | null>(null);
//   useEffect(() => {
//     apiFetch(`/api/admin/usuarios/${params.id}`).then(d => setUser(d.user));
//   }, [params.id]);
const MOCK_USER = {
  id:    "usr_mock_001",
  name:  "Fernanda Oliveira",
  email: "fernanda.oliveira@hdlog.com.br",
};

// ── Helpers ────────────────────────────────────────────────────────────────

function fmtKpi(format: string): string {
  switch (format) {
    case "brl":  return "R$";
    case "pct":  return "%";
    case "int":  return "qtd";
    case "days": return "dias";
    case "m3":   return "m³";
    case "km":   return "km";
    default:     return format;
  }
}

// ── KPI Slot card with custom dropdown ────────────────────────────────────

function KpiSlotCard({
  position,
  kpiId,
  isDuplicate,
  onChange,
}: {
  position: 1 | 2 | 3 | 4;
  kpiId: string;
  isDuplicate: boolean;
  onChange: (kpiId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selected = KPI_REGISTRY.find((k) => k.id === kpiId);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        minWidth: 190,
        background: isDuplicate ? "rgba(239,68,68,0.06)" : C.panel,
        border: `1px solid ${isDuplicate ? "rgba(239,68,68,0.4)" : C.border}`,
        borderRadius: 10,
        padding: 16,
        position: "relative",
        transition: "border-color 0.15s",
      }}
    >
      {/* Slot label */}
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: C.textMuted,
          letterSpacing: "0.6px",
          textTransform: "uppercase",
          marginBottom: 10,
        }}
      >
        Slot {position}
      </div>

      {/* Trigger */}
      <div
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 10px",
          background: C.bg,
          border: `1px solid ${open ? "rgba(243,222,61,0.4)" : C.border}`,
          borderRadius: 6,
          cursor: "pointer",
          minHeight: 36,
          userSelect: "none",
          transition: "border-color 0.15s",
        }}
      >
        {selected && (
          <span
            style={{
              display: "inline-block",
              width: 9,
              height: 9,
              borderRadius: "50%",
              background: selected.accentColor,
              flexShrink: 0,
            }}
          />
        )}
        <span style={{ flex: 1, fontSize: 12, color: C.white, minWidth: 0 }}>
          {selected?.title ?? "—"}
        </span>
        {selected && (
          <span
            style={{
              fontSize: 10,
              color: C.textMuted,
              background: "rgba(255,255,255,0.06)",
              padding: "1px 5px",
              borderRadius: 3,
              flexShrink: 0,
            }}
          >
            {fmtKpi(selected.format)}
          </span>
        )}
        <span style={{ fontSize: 9, color: C.textMuted, flexShrink: 0, marginLeft: 2 }}>
          {open ? "▲" : "▼"}
        </span>
      </div>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% - 8px)",
            left: 16,
            right: 16,
            background: "rgb(31,28,48)",
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            zIndex: 300,
            boxShadow: "0 8px 28px rgba(0,0,0,0.55)",
            overflow: "hidden",
          }}
        >
          {KPI_REGISTRY.map((kpi) => (
            <div
              key={kpi.id}
              onClick={() => { onChange(kpi.id); setOpen(false); }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "9px 12px",
                cursor: "pointer",
                background: kpi.id === kpiId ? "rgba(255,255,255,0.07)" : "transparent",
                transition: "background 0.1s",
              }}
              onMouseEnter={(e) => {
                if (kpi.id !== kpiId)
                  e.currentTarget.style.background = "rgba(255,255,255,0.04)";
              }}
              onMouseLeave={(e) => {
                if (kpi.id !== kpiId)
                  e.currentTarget.style.background = "transparent";
              }}
            >
              {/* Colored pill */}
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "1px 7px",
                  borderRadius: 999,
                  background: `${kpi.accentColor}22`,
                  border: `1px solid ${kpi.accentColor}55`,
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: kpi.accentColor,
                  }}
                />
                <span style={{ fontSize: 10, color: kpi.accentColor, fontWeight: 700 }}>
                  {fmtKpi(kpi.format)}
                </span>
              </span>
              <span style={{ flex: 1, fontSize: 12, color: C.white }}>{kpi.title}</span>
            </div>
          ))}
        </div>
      )}

      {/* Duplicate warning */}
      {isDuplicate && (
        <div
          style={{
            marginTop: 8,
            fontSize: 11,
            color: "rgb(252,165,165)",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <span>⚠</span> KPI duplicado entre slots
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function UserChartsConfig() {
  const [activeTab, setActiveTab] = useState<"graficos" | "kpis">("graficos");

  // TODO: Replace with fetch /api/admin/usuarios/${id}/charts-config
  const [selectedCharts, setSelectedCharts] = useState<Set<string>>(
    () => new Set(CHART_REGISTRY.map((c) => c.id))
  );

  // TODO: Replace with fetch /api/admin/usuarios/${id}/kpi-config
  const [kpiSlots, setKpiSlots] = useState<
    Array<{ position: 1 | 2 | 3 | 4; kpiId: string }>
  >(() => DEFAULT_KPI_SLOTS.map((s) => ({ position: s.position, kpiId: s.kpiId as string })));

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextToastId = useRef(1);

  const toast = useCallback((msg: string, type: "success" | "error" = "success") => {
    const id = nextToastId.current++;
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  }, []);

  // TODO: Replace with:
  //   await apiFetch(`/api/admin/usuarios/${MOCK_USER.id}/charts-config`, {
  //     method: "PUT",
  //     body: JSON.stringify({ selectedCharts: [...selectedCharts], kpiSlots }),
  //   });
  const handleSave = useCallback(() => {
    toast("Configurações salvas com sucesso!");
  }, [toast]);

  const toggleChart = useCallback((id: string) => {
    setSelectedCharts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback((section: string) => {
    setSelectedCharts((prev) => {
      const next = new Set(prev);
      CHART_REGISTRY.filter((c) => c.section === section).forEach((c) => next.add(c.id));
      return next;
    });
  }, []);

  const selectNone = useCallback((section: string) => {
    setSelectedCharts((prev) => {
      const next = new Set(prev);
      CHART_REGISTRY.filter((c) => c.section === section).forEach((c) => next.delete(c.id));
      return next;
    });
  }, []);

  const setSlotKpi = useCallback((position: 1 | 2 | 3 | 4, kpiId: string) => {
    setKpiSlots((prev) =>
      prev.map((s) => (s.position === position ? { ...s, kpiId } : s))
    );
  }, []);

  const duplicatePositions = useMemo(() => {
    const countMap = new Map<string, number[]>();
    kpiSlots.forEach((s) => {
      if (!countMap.has(s.kpiId)) countMap.set(s.kpiId, []);
      countMap.get(s.kpiId)!.push(s.position);
    });
    const result = new Set<number>();
    countMap.forEach((positions) => {
      if (positions.length > 1) positions.forEach((p) => result.add(p));
    });
    return result;
  }, [kpiSlots]);

  const userInitials = MOCK_USER.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.bg,
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Inter', 'Geist', sans-serif",
        color: C.white,
      }}
    >
      <style>{`
        @keyframes slideIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
        .chart-row:hover { background: rgba(255,255,255,0.025) !important; }
        .chart-row label { display:flex; align-items:center; gap:12px; padding:10px 16px; cursor:pointer; width:100%; box-sizing:border-box; }
        input[type="checkbox"] { accent-color: rgb(243,222,61); cursor:pointer; }
      `}</style>

      {/* ── Sticky header ── */}
      <header
        style={{
          height: 65,
          background: C.bg,
          borderBottom: `1px solid ${C.border}`,
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
          justifyContent: "space-between",
          flexShrink: 0,
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        {/* Left: back + user info */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <a
            href="/admin/usuarios"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              borderRadius: 6,
              background: "transparent",
              border: `1px solid ${C.border}`,
              color: C.textSec,
              fontSize: 12,
              fontWeight: 600,
              textDecoration: "none",
              transition: "all 0.15s",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)";
              e.currentTarget.style.color = C.white;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = C.border;
              e.currentTarget.style.color = C.textSec;
            }}
          >
            ← Usuários
          </a>

          <div style={{ width: 1, height: 24, background: C.border }} />

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                flexShrink: 0,
                background: "rgba(30,20,97,0.25)",
                border: "1.5px solid rgba(30,20,97,0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 700,
                color: "rgb(180,170,255)",
              }}
            >
              {userInitials}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.white, lineHeight: 1.2 }}>
                {MOCK_USER.name}
              </div>
              <div style={{ fontSize: 11, color: C.textMuted, marginTop: 1 }}>
                {MOCK_USER.email}
              </div>
            </div>
          </div>
        </div>

        {/* Right: save button */}
        <button
          onClick={handleSave}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 20px",
            borderRadius: 8,
            background: C.yellow,
            border: "none",
            color: C.brand,
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
            boxShadow: "0 4px 14px rgba(243,222,61,0.2)",
            transition: "opacity 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          Salvar configurações
        </button>
      </header>

      {/* ── Main ── */}
      <main
        style={{
          flex: 1,
          padding: "32px 24px 60px",
          maxWidth: 1100,
          width: "100%",
          margin: "0 auto",
        }}
      >
        {/* Page title */}
        <div style={{ marginBottom: 28 }}>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: C.white,
              letterSpacing: "-0.4px",
              margin: "0 0 6px",
            }}
          >
            Configuração de Visualização
          </h1>
          <p style={{ fontSize: 14, color: C.textSec, margin: 0 }}>
            Selecione os gráficos e KPIs disponíveis para este usuário no dashboard.
          </p>
        </div>

        {/* Tab switcher */}
        <div
          style={{
            display: "flex",
            gap: 4,
            padding: 4,
            background: C.panel,
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            width: "fit-content",
            marginBottom: 28,
          }}
        >
          {(["graficos", "kpis"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "8px 20px",
                borderRadius: 7,
                border: "none",
                background: activeTab === tab ? C.yellow : "transparent",
                color: activeTab === tab ? C.brand : C.textSec,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.15s",
              }}
            >
              {tab === "graficos" ? "Gráficos" : "KPIs"}
            </button>
          ))}
        </div>

        {/* ── Gráficos tab ── */}
        {activeTab === "graficos" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {CHART_SECTIONS.map(({ key, label }) => {
              const charts = CHART_REGISTRY.filter((c) => c.section === key);
              const selectedCount = charts.filter((c) => selectedCharts.has(c.id)).length;

              return (
                <div
                  key={key}
                  style={{
                    background: C.bg,
                    border: `1px solid ${C.border}`,
                    borderRadius: 12,
                    overflow: "hidden",
                  }}
                >
                  {/* Section header */}
                  <div
                    style={{
                      background: "rgba(31,28,48,0.5)",
                      borderBottom: `1px solid ${C.border}`,
                      padding: "12px 20px",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <span
                      style={{ fontSize: 13, fontWeight: 700, color: C.white }}
                    >
                      {label}
                    </span>

                    {/* Selected count badge */}
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: 999,
                        background:
                          selectedCount === charts.length
                            ? "rgba(16,185,129,0.12)"
                            : selectedCount === 0
                            ? "rgba(239,68,68,0.1)"
                            : "rgba(243,222,61,0.1)",
                        color:
                          selectedCount === charts.length
                            ? "rgb(110,231,183)"
                            : selectedCount === 0
                            ? "rgb(252,165,165)"
                            : "rgb(253,224,71)",
                        border: `1px solid ${
                          selectedCount === charts.length
                            ? "rgba(16,185,129,0.25)"
                            : selectedCount === 0
                            ? "rgba(239,68,68,0.2)"
                            : "rgba(243,222,61,0.2)"
                        }`,
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {selectedCount}/{charts.length} selecionados
                    </span>

                    <div style={{ flex: 1 }} />

                    {/* Todos / Nenhum */}
                    {(["Todos", "Nenhum"] as const).map((action) => (
                      <button
                        key={action}
                        onClick={() =>
                          action === "Todos" ? selectAll(key) : selectNone(key)
                        }
                        style={{
                          padding: "4px 10px",
                          borderRadius: 5,
                          background: "transparent",
                          border: `1px solid ${C.border}`,
                          color: C.textSec,
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer",
                          fontFamily: "inherit",
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "rgba(243,222,61,0.4)";
                          e.currentTarget.style.color = C.yellow;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = C.border;
                          e.currentTarget.style.color = C.textSec;
                        }}
                      >
                        {action}
                      </button>
                    ))}
                  </div>

                  {/* Chart rows */}
                  {charts.map((chart, idx) => (
                    <div
                      key={chart.id}
                      className="chart-row"
                      style={{
                        borderBottom:
                          idx < charts.length - 1
                            ? `1px solid rgba(62,57,96,0.4)`
                            : "none",
                        transition: "background 0.1s",
                      }}
                    >
                      <label>
                        <input
                          type="checkbox"
                          checked={selectedCharts.has(chart.id)}
                          onChange={() => toggleChart(chart.id)}
                          style={{ width: 15, height: 15, flexShrink: 0 }}
                        />
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: C.white,
                            flexShrink: 0,
                            minWidth: 220,
                          }}
                        >
                          {chart.title}
                        </span>
                        <span
                          style={{
                            fontSize: 12,
                            color: C.textMuted,
                            overflow: "hidden",
                            whiteSpace: "nowrap",
                            textOverflow: "ellipsis",
                            flex: 1,
                            minWidth: 0,
                          }}
                        >
                          {chart.description}
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {/* ── KPIs tab ── */}
        {activeTab === "kpis" && (
          <div>
            <p style={{ fontSize: 13, color: C.textSec, margin: "0 0 20px" }}>
              Escolha os 4 KPIs que aparecem na parte superior do dashboard para este usuário.
              KPIs repetidos entre slots são destacados em vermelho.
            </p>

            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              {([1, 2, 3, 4] as const).map((pos) => {
                const slot = kpiSlots.find((s) => s.position === pos);
                if (!slot) return null;
                return (
                  <KpiSlotCard
                    key={pos}
                    position={pos}
                    kpiId={slot.kpiId}
                    isDuplicate={duplicatePositions.has(pos)}
                    onChange={(kpiId) => setSlotKpi(pos, kpiId)}
                  />
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer
        style={{
          borderTop: `1px solid ${C.border}`,
          padding: "20px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: 12, color: C.textMuted }}>
          © 2026 H. D. Log Transportes LTDA — Sistema de Controle Interno
        </span>
        <span style={{ fontSize: 12, color: C.textMuted }}>
          Segurança de dados e conformidade operacional garantida.
        </span>
      </footer>

      <Toast toasts={toasts} />
    </div>
  );
}
