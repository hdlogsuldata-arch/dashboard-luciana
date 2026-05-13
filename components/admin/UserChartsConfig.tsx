"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { CHART_REGISTRY, KPI_REGISTRY } from "@/lib/charts/registry";
import Toast, { type ToastItem } from "./Toast";

// ── Color palette ───────────────────────────────────────────────────────────

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

// ── Types ───────────────────────────────────────────────────────────────────

type SectionKey = "financeiro" | "operacional" | "frota";

type SectionConfig = {
  charts: Set<string>;
  kpiIds: string[];
};

type Config = Record<SectionKey, SectionConfig>;

type UserInfo = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  funcao: string;
};

// ── Constants ───────────────────────────────────────────────────────────────

const SECTIONS: { key: SectionKey; label: string }[] = [
  { key: "financeiro",  label: "Financeiro"  },
  { key: "operacional", label: "Operacional" },
  { key: "frota",       label: "Frota"       },
];

function fmtKpi(format: string): string {
  switch (format) {
    case "brl":  return "R$";
    case "pct":  return "%";
    case "int":  return "qtd";
    case "days": return "dias";
    default:     return format;
  }
}

// ── Main component ──────────────────────────────────────────────────────────

export default function UserChartsConfig({ userId }: { userId: string }) {
  const [activeTab, setActiveTab] = useState<"graficos" | "kpis">("graficos");
  const [user, setUser]           = useState<UserInfo | null>(null);
  const [config, setConfig]       = useState<Config | null>(null);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [toasts, setToasts]       = useState<ToastItem[]>([]);
  const nextToastId = useRef(1);

  const toast = useCallback((msg: string, type: "success" | "error" = "success") => {
    const id = nextToastId.current++;
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  }, []);

  // ── Load ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    Promise.all([
      fetch(`/api/usuarios/${userId}`).then((r) => r.json()),
      fetch(`/api/usuarios/${userId}/charts-kpis_config?section=financeiro`).then((r) => r.json()),
      fetch(`/api/usuarios/${userId}/charts-kpis_config?section=operacional`).then((r) => r.json()),
      fetch(`/api/usuarios/${userId}/charts-kpis_config?section=frota`).then((r) => r.json()),
    ])
      .then(([userRes, fin, opr, flt]) => {
        if (userRes.error) throw new Error(userRes.error);
        setUser(userRes.user);
        setConfig({
          financeiro:  { charts: new Set(fin.chartIds  ?? []), kpiIds: fin.kpiIds  ?? [] },
          operacional: { charts: new Set(opr.chartIds  ?? []), kpiIds: opr.kpiIds  ?? [] },
          frota:       { charts: new Set(flt.chartIds  ?? []), kpiIds: flt.kpiIds  ?? [] },
        });
      })
      .catch(() => toast("Erro ao carregar configurações", "error"))
      .finally(() => setLoading(false));
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    if (!config) return;
    setSaving(true);
    try {
      await Promise.all(
        SECTIONS.map(({ key }) =>
          fetch(`/api/usuarios/${userId}/charts-kpis_config`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              section:        key,
              selectedCharts: [...config[key].charts],
              kpiIds:         config[key].kpiIds,
            }),
          }).then((r) => { if (!r.ok) throw new Error(); })
        )
      );
      toast("Configurações salvas com sucesso!");
    } catch {
      toast("Erro ao salvar configurações", "error");
    } finally {
      setSaving(false);
    }
  }, [config, userId]);

  // ── Chart toggles ─────────────────────────────────────────────────────────

  const toggleChart = useCallback((section: SectionKey, id: string) => {
    setConfig((prev) => {
      if (!prev) return prev;
      const next = new Set(prev[section].charts);
      if (next.has(id)) next.delete(id); else next.add(id);
      return { ...prev, [section]: { ...prev[section], charts: next } };
    });
  }, []);

  const selectAllCharts = useCallback((section: SectionKey) => {
    setConfig((prev) => {
      if (!prev) return prev;
      const all = new Set(CHART_REGISTRY.filter((c) => c.section === section).map((c) => c.id));
      return { ...prev, [section]: { ...prev[section], charts: all } };
    });
  }, []);

  const selectNoneCharts = useCallback((section: SectionKey) => {
    setConfig((prev) => {
      if (!prev) return prev;
      return { ...prev, [section]: { ...prev[section], charts: new Set<string>() } };
    });
  }, []);

  // ── KPI toggles ───────────────────────────────────────────────────────────

  const toggleKpi = useCallback((section: SectionKey, kpiId: string) => {
    setConfig((prev) => {
      if (!prev) return prev;
      const current = prev[section].kpiIds;
      const kpiIds = current.includes(kpiId)
        ? current.filter((id) => id !== kpiId)
        : [...current, kpiId];
      return { ...prev, [section]: { ...prev[section], kpiIds } };
    });
  }, []);

  // ── Render helpers ────────────────────────────────────────────────────────

  const userInitials = (user?.name ?? user?.email ?? "?")
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
        @keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:.7} }
        .chart-row:hover { background: rgba(255,255,255,0.025) !important; }
        .chart-row label { display:flex; align-items:center; gap:12px; padding:10px 16px; cursor:pointer; width:100%; box-sizing:border-box; }
        input[type="checkbox"] { accent-color: rgb(243,222,61); cursor:pointer; }
      `}</style>

      {/* ── Sticky header ─────────────────────────────────────────────────── */}
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
              whiteSpace: "nowrap",
            }}
          >
            ← Usuários
          </a>

          <div style={{ width: 1, height: 24, background: C.border }} />

          {loading ? (
            <div
              style={{
                width: 180,
                height: 34,
                borderRadius: 6,
                background: "rgba(62,57,96,0.4)",
                animation: "pulse 1.5s ease-in-out infinite",
              }}
            />
          ) : (
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
                  {user?.name ?? user?.email}
                </div>
                <div style={{ fontSize: 11, color: C.textMuted, marginTop: 1 }}>
                  {user?.email}
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleSave}
          disabled={loading || saving}
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
            cursor: loading || saving ? "not-allowed" : "pointer",
            fontFamily: "inherit",
            opacity: loading || saving ? 0.6 : 1,
            boxShadow: "0 4px 14px rgba(243,222,61,0.2)",
            transition: "opacity 0.15s",
          }}
        >
          {saving ? "Salvando…" : "Salvar configurações"}
        </button>
      </header>

      {/* ── Main ──────────────────────────────────────────────────────────── */}
      <main
        style={{
          flex: 1,
          padding: "32px 24px 60px",
          maxWidth: 1100,
          width: "100%",
          margin: "0 auto",
        }}
      >
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: C.white, letterSpacing: "-0.4px", margin: "0 0 6px" }}>
            Configuração de Visualização
          </h1>
          <p style={{ fontSize: 14, color: C.textSec, margin: 0 }}>
            Selecione os gráficos e KPIs disponíveis para este usuário em cada seção do dashboard.
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

        {/* ── Loading skeleton ── */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  height: 120,
                  borderRadius: 12,
                  background: "rgba(62,57,96,0.3)",
                  animation: "pulse 1.5s ease-in-out infinite",
                  animationDelay: `${i * 0.15}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* ── Gráficos tab ── */}
        {!loading && activeTab === "graficos" && config && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {SECTIONS.map(({ key, label }) => {
              const charts = CHART_REGISTRY.filter((c) => c.section === key);
              const selectedCount = charts.filter((c) => config[key].charts.has(c.id)).length;

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
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.white }}>{label}</span>

                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: 999,
                        background:
                          selectedCount === charts.length ? "rgba(16,185,129,0.12)"
                          : selectedCount === 0           ? "rgba(239,68,68,0.1)"
                          :                                 "rgba(243,222,61,0.1)",
                        color:
                          selectedCount === charts.length ? "rgb(110,231,183)"
                          : selectedCount === 0           ? "rgb(252,165,165)"
                          :                                 "rgb(253,224,71)",
                        border: `1px solid ${
                          selectedCount === charts.length ? "rgba(16,185,129,0.25)"
                          : selectedCount === 0           ? "rgba(239,68,68,0.2)"
                          :                                 "rgba(243,222,61,0.2)"
                        }`,
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {selectedCount}/{charts.length} selecionados
                    </span>

                    <div style={{ flex: 1 }} />

                    {(["Todos", "Nenhum"] as const).map((action) => (
                      <button
                        key={action}
                        onClick={() => action === "Todos" ? selectAllCharts(key) : selectNoneCharts(key)}
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
                        }}
                      >
                        {action}
                      </button>
                    ))}
                  </div>

                  {charts.map((chart, idx) => (
                    <div
                      key={chart.id}
                      className="chart-row"
                      style={{
                        borderBottom: idx < charts.length - 1 ? `1px solid rgba(62,57,96,0.4)` : "none",
                        transition: "background 0.1s",
                      }}
                    >
                      <label>
                        <input
                          type="checkbox"
                          checked={config[key].charts.has(chart.id)}
                          onChange={() => toggleChart(key, chart.id)}
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
        {!loading && activeTab === "kpis" && config && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <p style={{ fontSize: 13, color: C.textSec, margin: "0 0 4px" }}>
              Escolha quais KPIs aparecem no topo de cada seção do dashboard para este usuário.
            </p>

            {SECTIONS.map(({ key, label }) => {
              const kpis = KPI_REGISTRY.filter((k) => k.section === key);
              const selectedCount = kpis.filter((k) => config[key].kpiIds.includes(k.id)).length;

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
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.white }}>{label}</span>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: 999,
                        background:
                          selectedCount === kpis.length ? "rgba(16,185,129,0.12)"
                          : selectedCount === 0         ? "rgba(239,68,68,0.1)"
                          :                               "rgba(243,222,61,0.1)",
                        color:
                          selectedCount === kpis.length ? "rgb(110,231,183)"
                          : selectedCount === 0         ? "rgb(252,165,165)"
                          :                               "rgb(253,224,71)",
                        border: `1px solid ${
                          selectedCount === kpis.length ? "rgba(16,185,129,0.25)"
                          : selectedCount === 0         ? "rgba(239,68,68,0.2)"
                          :                               "rgba(243,222,61,0.2)"
                        }`,
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {selectedCount}/{kpis.length} ativos
                    </span>
                  </div>

                  {kpis.map((kpi, idx) => (
                    <div
                      key={kpi.id}
                      className="chart-row"
                      style={{
                        borderBottom: idx < kpis.length - 1 ? `1px solid rgba(62,57,96,0.4)` : "none",
                        transition: "background 0.1s",
                      }}
                    >
                      <label>
                        <input
                          type="checkbox"
                          checked={config[key].kpiIds.includes(kpi.id)}
                          onChange={() => toggleKpi(key, kpi.id)}
                          style={{ width: 15, height: 15, flexShrink: 0 }}
                        />
                        <span
                          style={{
                            display: "inline-block",
                            width: 9,
                            height: 9,
                            borderRadius: "50%",
                            background: kpi.accentColor,
                            flexShrink: 0,
                          }}
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
                          {kpi.title}
                        </span>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "1px 7px",
                            borderRadius: 999,
                            background: `${kpi.accentColor}22`,
                            border: `1px solid ${kpi.accentColor}55`,
                            fontSize: 10,
                            color: kpi.accentColor,
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {fmtKpi(kpi.format)}
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
                          {kpi.description}
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
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
