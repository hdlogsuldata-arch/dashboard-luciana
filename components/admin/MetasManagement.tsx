"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import Toast, { type ToastItem } from "./Toast";
import Modal from "./Modal";
import MetaFormModal, { type EditableMeta, type MetaFormData, type DbStatus } from "./MetaFormModal";
import { KPI_REGISTRY } from "@/lib/charts/registry";
import { apiFetch } from "@/lib/api";
import { unitFormatter, type MetricUnit } from "@/lib/formatter";

const C = {
  bg:        "rgb(20,18,32)",
  panel:     "rgb(31,28,48)",
  border:    "rgb(62,57,96)",
  white:     "rgb(255,255,255)",
  textSec:   "rgb(148,163,184)",
  textMuted: "rgb(100,116,139)",
  yellow:    "rgb(243,222,61)",
  brand:     "rgb(30,20,97)",
  red:       "rgb(239,68,68)",
};

type MetaStatus = "on_track" | "at_risk" | "missed" | "achieved";

const STATUS_CONFIG: Record<MetaStatus, { bg: string; text: string; border: string; label: string }> = {
  on_track: { bg: "rgba(16,185,129,0.12)",  text: "rgb(110,231,183)", border: "rgba(16,185,129,0.3)",  label: "No Prazo" },
  at_risk:  { bg: "rgba(245,158,11,0.12)",  text: "rgb(253,211,77)",  border: "rgba(245,158,11,0.3)",  label: "Em Risco" },
  missed:   { bg: "rgba(239,68,68,0.12)",   text: "rgb(252,165,165)", border: "rgba(239,68,68,0.3)",   label: "Atrasada" },
  achieved: { bg: "rgba(59,130,246,0.12)",  text: "rgb(147,197,253)", border: "rgba(59,130,246,0.3)",  label: "Atingida" },
};

const DB_TO_STATUS: Record<DbStatus, MetaStatus> = {
  NO_PRAZO:  "on_track",
  EM_RISCO:  "at_risk",
  ATRASADA:  "missed",
  ALCANCADA: "achieved",
};

interface ApiMeta {
  id: string;
  titulo: string;
  kpiId: string;
  targetValue: number;
  deadline: string;
  status: DbStatus;
  ownerEmail: string;
  owner: { name: string | null; email: string };
  createdAt: string;
}

interface MetaRow {
  id: string;
  titulo: string;
  kpiTitle: string;
  kpiAccentColor: string;
  targetFormatted: string;
  deadline: string;
  owner: string;
  status: MetaStatus;
}

function apiToRow(m: ApiMeta): MetaRow {
  const kpi = KPI_REGISTRY.find((k) => k.id === m.kpiId);
  const fmt = (kpi?.format ?? "int") as MetricUnit;
  return {
    id: m.id,
    titulo: m.titulo,
    kpiTitle: kpi?.title ?? m.kpiId,
    kpiAccentColor: kpi?.accentColor ?? "#888888",
    targetFormatted: unitFormatter[fmt](m.targetValue),
    deadline: new Date(m.deadline).toLocaleDateString("pt-BR"),
    owner: m.owner.name ?? m.owner.email,
    status: DB_TO_STATUS[m.status] ?? "on_track",
  };
}

function toEditable(m: ApiMeta): EditableMeta {
  return {
    id: m.id,
    titulo: m.titulo,
    kpiId: m.kpiId,
    targetValue: m.targetValue,
    deadline: m.deadline,
    status: m.status,
    ownerEmail: m.ownerEmail,
  };
}

// ── Icons ───────────────────────────────────────────────────────────────────

const IconTarget = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="12" cy="12" r="6"  stroke="currentColor" strokeWidth="1.5" />
    <circle cx="12" cy="12" r="2"  fill="currentColor" />
  </svg>
);

const IconSearch = () => (
  <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
    <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.8" />
    <path d="M14.5 14.5L18 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const IconPlus = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 12 12" fill="currentColor">
    <path d="M5 0h2v5h5v2H7v5H5V7H0V5h5V0z" />
  </svg>
);

const IconEdit = () => (
  <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
    <path
      d="M14.7 3.3a1 1 0 0 1 1.4 0l.6.6a1 1 0 0 1 0 1.4L5.5 16.5 2 17.5l1-3.5L14.7 3.3z"
      stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"
    />
  </svg>
);

const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
    <path
      d="M3 6h14M8 6V4h4v2M5 6l1 11h8l1-11"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
    />
  </svg>
);

// ── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: MetaStatus }) {
  const s = STATUS_CONFIG[status];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 8px",
        borderRadius: 999,
        background: s.bg,
        color: s.text,
        border: `1px solid ${s.border}`,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.3px",
        whiteSpace: "nowrap",
      }}
    >
      {s.label}
    </span>
  );
}

function OwnerAvatar({ name }: { name: string }) {
  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div
      style={{
        width: 26,
        height: 26,
        borderRadius: "50%",
        flexShrink: 0,
        background: "rgba(30,20,97,0.25)",
        border: "1.5px solid rgba(30,20,97,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 10,
        fontWeight: 700,
        color: "rgb(180,170,255)",
      }}
    >
      {initials}
    </div>
  );
}

// ── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  accentColor,
}: {
  label: string;
  value: number;
  accentColor: string;
}) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 120,
        background: C.panel,
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        padding: "16px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <span style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: "0.5px", textTransform: "uppercase" }}>
        {label}
      </span>
      <span
        style={{
          fontSize: 28,
          fontWeight: 800,
          color: accentColor,
          lineHeight: 1,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ── Donut chart custom tooltip ────────────────────────────────────────────────

function DonutTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "rgb(31,28,48)",
        border: "1px solid rgb(62,57,96)",
        borderRadius: 8,
        padding: "8px 12px",
        fontSize: 12,
        color: "rgb(255,255,255)",
      }}
    >
      <strong>{payload[0].name}</strong>: {payload[0].value}
    </div>
  );
}

// ── Delete confirmation modal ────────────────────────────────────────────────

function ConfirmDeleteModal({
  open,
  titulo,
  onClose,
  onConfirm,
  loading,
}: {
  open: boolean;
  titulo: string;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Confirmar Exclusão" width={420}>
      <div style={{ padding: "28px 24px", display: "flex", flexDirection: "column", gap: 20, alignItems: "center", textAlign: "center" }}>
        <div
          style={{
            width: 56, height: 56, borderRadius: 14,
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 20h20L12 2z" stroke="rgb(239,68,68)" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M12 9v5M12 16.5v.5" stroke="rgb(239,68,68)" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "rgb(255,255,255)", marginBottom: 8 }}>
            Excluir meta?
          </div>
          <div style={{ fontSize: 13, color: "rgb(148,163,184)", lineHeight: "1.6" }}>
            A meta{" "}
            <strong style={{ color: "rgb(203,213,225)" }}>{titulo}</strong>{" "}
            será permanentemente removida do sistema.
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, width: "100%", marginTop: 4 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: "10px 0", borderRadius: 7,
              background: "transparent", border: "1px solid rgb(62,57,96)",
              color: "rgb(203,213,225)", fontSize: 13, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgb(31,28,48)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              flex: 1, padding: "10px 0", borderRadius: 7,
              background: loading ? "rgba(239,68,68,0.5)" : "rgb(239,68,68)",
              border: "none", color: "rgb(255,255,255)", fontSize: 13, fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit",
            }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.opacity = "0.85"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
          >
            {loading ? "Excluindo..." : "Excluir"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

const DONUT_COLORS: Record<MetaStatus, string> = {
  on_track: "rgb(110,231,183)",
  at_risk:  "rgb(253,211,77)",
  missed:   "rgb(252,165,165)",
  achieved: "rgb(147,197,253)",
};

export default function MetasManagement() {
  const [metas, setMetas]             = useState<ApiMeta[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [toasts, setToasts]           = useState<ToastItem[]>([]);
  const [formOpen, setFormOpen]       = useState(false);
  const [editingMeta, setEditingMeta] = useState<EditableMeta | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ApiMeta | null>(null);
  const [deleting, setDeleting]       = useState(false);
  const nextToastId                   = useRef(1);

  const toast = useCallback((msg: string, type: "success" | "error" = "success") => {
    const id = nextToastId.current++;
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  }, []);

  const loadMetas = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/api/admin/metas");
      setMetas(data.metas ?? []);
    } catch {
      toast("Erro ao carregar metas.", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadMetas(); }, [loadMetas]);

  const rows = metas.map(apiToRow);

  const filtered = rows.filter((m) => {
    const q = search.toLowerCase();
    return (
      m.titulo.toLowerCase().includes(q) ||
      m.kpiTitle.toLowerCase().includes(q) ||
      m.owner.toLowerCase().includes(q)
    );
  });

  // Summary counts
  const counts = {
    total:    metas.length,
    on_track: metas.filter((m) => m.status === "NO_PRAZO").length,
    at_risk:  metas.filter((m) => m.status === "EM_RISCO").length,
    missed:   metas.filter((m) => m.status === "ATRASADA").length,
    achieved: metas.filter((m) => m.status === "ALCANCADA").length,
  };

  const donutData = (
    [
      { key: "on_track" as MetaStatus, name: "No Prazo",  value: counts.on_track },
      { key: "at_risk"  as MetaStatus, name: "Em Risco",  value: counts.at_risk  },
      { key: "missed"   as MetaStatus, name: "Atrasada",  value: counts.missed   },
      { key: "achieved" as MetaStatus, name: "Atingida",  value: counts.achieved },
    ] as const
  ).filter((d) => d.value > 0);

  const handleCreate = () => {
    setEditingMeta(null);
    setFormOpen(true);
  };

  const handleEdit = (id: string) => {
    const meta = metas.find((m) => m.id === id);
    if (!meta) return;
    setEditingMeta(toEditable(meta));
    setFormOpen(true);
  };

  const handleDelete = (id: string) => {
    const meta = metas.find((m) => m.id === id);
    if (!meta) return;
    setDeleteTarget(meta);
  };

  const handleSaveForm = async (data: MetaFormData) => {
    try {
      if (editingMeta) {
        await apiFetch(`/api/admin/metas/${editingMeta.id}`, {
          method: "PUT",
          body: JSON.stringify(data),
        });
        toast("Meta atualizada com sucesso.");
      } else {
        await apiFetch("/api/admin/metas", {
          method: "POST",
          body: JSON.stringify(data),
        });
        toast("Meta criada com sucesso.");
      }
      await loadMetas();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar meta.";
      toast(msg.replace(/^HTTP \d+: /, ""), "error");
      throw err;
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/admin/metas/${deleteTarget.id}`, { method: "DELETE" });
      toast("Meta excluída.");
      setDeleteTarget(null);
      await loadMetas();
    } catch {
      toast("Erro ao excluir meta.", "error");
    } finally {
      setDeleting(false);
    }
  };

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
        .meta-row:hover { background: rgba(31,28,48,0.6) !important; }
        .act-btn:hover { background: rgba(255,255,255,0.06) !important; }
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
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 32, height: 32, borderRadius: 8,
              background: "rgba(243,222,61,0.1)", border: "1px solid rgba(243,222,61,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center", color: C.yellow,
            }}
          >
            <IconTarget />
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, color: C.white }}>Gestão de Metas</span>
        </div>

        <div style={{ position: "relative" }}>
          <div
            style={{
              position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
              color: C.textMuted, display: "flex",
            }}
          >
            <IconSearch />
          </div>
          <input
            type="text"
            placeholder="Pesquisar por título, KPI ou responsável..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: 310, height: 36,
              background: C.panel, border: `1px solid ${C.border}`,
              borderRadius: 8, color: C.white, fontSize: 13,
              padding: "0 14px 0 38px", outline: "none", fontFamily: "inherit",
            }}
          />
        </div>
      </header>

      {/* ── Main ── */}
      <main
        style={{
          flex: 1,
          padding: "32px 24px 60px",
          maxWidth: 1280,
          width: "100%",
          margin: "0 auto",
        }}
      >
        {/* Page header */}
        <div
          style={{
            display: "flex", justifyContent: "space-between",
            alignItems: "flex-end", marginBottom: 28,
          }}
        >
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: C.white, letterSpacing: "-0.5px", margin: "0 0 6px" }}>
              Gestão de Metas
            </h1>
            <p style={{ fontSize: 15, color: C.textSec, margin: 0 }}>
              Defina e acompanhe os objetivos estratégicos vinculados aos KPIs do dashboard.
            </p>
          </div>
          <button
            onClick={handleCreate}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 20px", borderRadius: 8,
              background: C.yellow, border: "none", color: C.brand,
              fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              boxShadow: "0 4px 14px rgba(243,222,61,0.2)", transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            <IconPlus /> Nova Meta
          </button>
        </div>

        {/* ── Visual summary section ── */}
        {!loading && metas.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: 16,
              marginBottom: 28,
              alignItems: "stretch",
              flexWrap: "wrap",
            }}
          >
            {/* Stat cards */}
            <div style={{ display: "flex", gap: 12, flex: "1 1 400px", flexWrap: "wrap" }}>
              <StatCard label="Total"    value={counts.total}    accentColor="rgb(255,255,255)" />
              <StatCard label="No Prazo" value={counts.on_track} accentColor="rgb(110,231,183)" />
              <StatCard label="Em Risco" value={counts.at_risk}  accentColor="rgb(253,211,77)"  />
              <StatCard label="Atrasada" value={counts.missed}   accentColor="rgb(252,165,165)" />
              <StatCard label="Atingida" value={counts.achieved} accentColor="rgb(147,197,253)" />
            </div>

            {/* Status donut */}
            {donutData.length > 0 && (
              <div
                style={{
                  background: C.panel,
                  border: `1px solid ${C.border}`,
                  borderRadius: 10,
                  padding: "16px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  minWidth: 220,
                  flex: "0 0 auto",
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: "0.5px", textTransform: "uppercase" }}>
                  Distribuição por Status
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 100, height: 100 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={donutData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius="55%"
                          outerRadius="90%"
                          strokeWidth={0}
                          paddingAngle={2}
                        >
                          {donutData.map((d) => (
                            <Cell key={d.key} fill={DONUT_COLORS[d.key]} />
                          ))}
                        </Pie>
                        <Tooltip content={<DonutTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    {donutData.map((d) => (
                      <div key={d.key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span
                          style={{
                            display: "inline-block", width: 8, height: 8,
                            borderRadius: "50%", background: DONUT_COLORS[d.key], flexShrink: 0,
                          }}
                        />
                        <span style={{ fontSize: 11, color: C.textSec }}>
                          {d.name} ({d.value})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Table */}
        <div
          style={{
            background: C.bg,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          }}
        >
          {/* Table header row */}
          <div
            style={{
              background: "rgba(31,28,48,0.5)",
              borderBottom: `1px solid ${C.border}`,
              display: "grid",
              gridTemplateColumns: "2fr 1.1fr 110px 1fr 120px 100px",
              padding: "0 20px",
            }}
          >
            {["Meta / KPI", "Valor Alvo", "Prazo", "Responsável", "Status", "Ações"].map((h) => (
              <div
                key={h}
                style={{
                  padding: "13px 8px",
                  fontSize: 11,
                  fontWeight: 700,
                  color: C.textMuted,
                  letterSpacing: "0.6px",
                  textTransform: "uppercase",
                }}
              >
                {h}
              </div>
            ))}
          </div>

          {/* Loading state */}
          {loading && (
            <div style={{ padding: "48px 24px", textAlign: "center", color: C.textMuted, fontSize: 14 }}>
              Carregando metas...
            </div>
          )}

          {/* Empty state */}
          {!loading && filtered.length === 0 && (
            <div style={{ padding: "48px 24px", textAlign: "center", color: C.textMuted, fontSize: 14 }}>
              {search
                ? `Nenhuma meta encontrada para "${search}"`
                : "Nenhuma meta cadastrada. Clique em \"Nova Meta\" para começar."}
            </div>
          )}

          {/* Rows */}
          {!loading && filtered.map((m, idx) => (
            <div
              key={m.id}
              className="meta-row"
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1.1fr 110px 1fr 120px 100px",
                padding: "0 20px",
                borderBottom: idx < filtered.length - 1 ? `1px solid rgba(62,57,96,0.5)` : "none",
                transition: "background 0.1s",
              }}
            >
              {/* Meta / KPI */}
              <div style={{ padding: "16px 8px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.white, marginBottom: 5 }}>
                  {m.titulo}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span
                    style={{
                      display: "inline-block", width: 8, height: 8,
                      borderRadius: "50%", background: m.kpiAccentColor, flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: 11, color: C.textMuted }}>{m.kpiTitle}</span>
                </div>
              </div>

              {/* Valor Alvo */}
              <div
                style={{
                  padding: "16px 8px", display: "flex", alignItems: "center",
                  fontSize: 13, fontWeight: 600, color: C.textSec, fontFamily: "monospace",
                }}
              >
                {m.targetFormatted}
              </div>

              {/* Prazo */}
              <div
                style={{
                  padding: "16px 8px", display: "flex", alignItems: "center",
                  fontSize: 12, color: C.textSec,
                }}
              >
                {m.deadline}
              </div>

              {/* Responsável */}
              <div style={{ padding: "16px 8px", display: "flex", alignItems: "center", gap: 8 }}>
                <OwnerAvatar name={m.owner} />
                <span style={{ fontSize: 12, color: C.textSec }}>{m.owner}</span>
              </div>

              {/* Status */}
              <div style={{ padding: "16px 8px", display: "flex", alignItems: "center" }}>
                <StatusBadge status={m.status} />
              </div>

              {/* Ações */}
              <div style={{ padding: "16px 8px", display: "flex", alignItems: "center", gap: 4 }}>
                <button
                  className="act-btn"
                  onClick={() => handleEdit(m.id)}
                  title="Editar meta"
                  style={{
                    width: 30, height: 30, borderRadius: 6,
                    background: "transparent", border: `1px solid ${C.border}`,
                    color: C.textSec, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(59,130,246,0.5)";
                    e.currentTarget.style.color = "rgb(147,197,253)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = C.border;
                    e.currentTarget.style.color = C.textSec;
                  }}
                >
                  <IconEdit />
                </button>
                <button
                  className="act-btn"
                  onClick={() => handleDelete(m.id)}
                  title="Excluir meta"
                  style={{
                    width: 30, height: 30, borderRadius: 6,
                    background: "transparent", border: `1px solid ${C.border}`,
                    color: C.textSec, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(239,68,68,0.5)";
                    e.currentTarget.style.color = "rgb(252,165,165)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = C.border;
                    e.currentTarget.style.color = C.textSec;
                  }}
                >
                  <IconTrash />
                </button>
              </div>
            </div>
          ))}

          {/* Table footer */}
          <div
            style={{
              background: "rgba(31,28,48,0.4)",
              borderTop: `1px solid ${C.border}`,
              padding: "12px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontSize: 12, color: C.textMuted }}>
              {loading
                ? "Carregando..."
                : `${filtered.length} ${filtered.length === 1 ? "meta encontrada" : "metas encontradas"} de ${metas.length} total`}
            </span>
            <button
              onClick={handleCreate}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                fontSize: 12, fontWeight: 700, color: C.yellow,
                background: "transparent", border: "none",
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              <IconPlus size={10} /> Adicionar Meta
            </button>
          </div>
        </div>
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

      {/* ── Modals ── */}
      <MetaFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSaveForm}
        editMeta={editingMeta}
      />

      <ConfirmDeleteModal
        open={!!deleteTarget}
        titulo={deleteTarget?.titulo ?? ""}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        loading={deleting}
      />

      <Toast toasts={toasts} />
    </div>
  );
}
