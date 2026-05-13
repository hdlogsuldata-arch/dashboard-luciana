"use client";

import React, { useState, useRef, useCallback } from "react";
import Toast, { type ToastItem } from "./Toast";

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

type MetaStatus = "on_track" | "at_risk" | "missed" | "achieved";

const STATUS_CONFIG: Record<MetaStatus, { bg: string; text: string; border: string; label: string }> = {
  on_track: { bg: "rgba(16,185,129,0.12)",  text: "rgb(110,231,183)", border: "rgba(16,185,129,0.3)",  label: "No Prazo"  },
  at_risk:  { bg: "rgba(245,158,11,0.12)",  text: "rgb(253,211,77)",  border: "rgba(245,158,11,0.3)",  label: "Em Risco"  },
  missed:   { bg: "rgba(239,68,68,0.12)",   text: "rgb(252,165,165)", border: "rgba(239,68,68,0.3)",   label: "Atrasada"  },
  achieved: { bg: "rgba(59,130,246,0.12)",  text: "rgb(147,197,253)", border: "rgba(59,130,246,0.3)",  label: "Atingida"  },
};

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

// TODO: Replace with fetch /api/admin/metas
const MOCK_METAS: MetaRow[] = [
  {
    id: "meta_001",
    titulo: "OTD Index acima de 90%",
    kpiTitle: "OTD Index",
    kpiAccentColor: "#10B981",
    targetFormatted: "≥ 90%",
    deadline: "30/06/2026",
    owner: "Carlos Medeiros",
    status: "at_risk",
  },
  {
    id: "meta_002",
    titulo: "Reduzir Saldo Vencido abaixo de R$ 800k",
    kpiTitle: "Saldo Total Vencido",
    kpiAccentColor: "#EF4444",
    targetFormatted: "≤ R$ 800k",
    deadline: "31/05/2026",
    owner: "Ana Paula Ramos",
    status: "at_risk",
  },
  {
    id: "meta_003",
    titulo: "Taxa de Rastreamento acima de 95%",
    kpiTitle: "Taxa de Rastreamento",
    kpiAccentColor: "#10B981",
    targetFormatted: "≥ 95%",
    deadline: "31/07/2026",
    owner: "Roberto Silva",
    status: "achieved",
  },
  {
    id: "meta_004",
    titulo: "Pipeline de Faturamento enxuto",
    kpiTitle: "CTRCs a Faturar",
    kpiAccentColor: "#F3DE3D",
    targetFormatted: "≤ 150 un.",
    deadline: "15/06/2026",
    owner: "Mariana Costa",
    status: "missed",
  },
  {
    id: "meta_005",
    titulo: "Meta de Receita de Frete mensal",
    kpiTitle: "Receita de Frete",
    kpiAccentColor: "#F3DE3D",
    targetFormatted: "≥ R$ 2,5M",
    deadline: "30/06/2026",
    owner: "Pedro Santos",
    status: "on_track",
  },
];

// ── Icons ──────────────────────────────────────────────────────────────────

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

// ── Sub-components ─────────────────────────────────────────────────────────

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

// ── Main component ─────────────────────────────────────────────────────────

export default function MetasManagement() {
  // TODO: Replace MOCK_METAS with: const [metas, setMetas] = useState<MetaRow[]>([]);
  //       useEffect(() => { apiFetch("/api/admin/metas").then(d => setMetas(d.metas)); }, []);
  const [metas] = useState<MetaRow[]>(MOCK_METAS);
  const [search, setSearch] = useState("");
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextToastId = useRef(1);

  const toast = useCallback((msg: string, type: "success" | "error" = "success") => {
    const id = nextToastId.current++;
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  }, []);

  const filtered = metas.filter((m) => {
    const q = search.toLowerCase();
    return (
      m.titulo.toLowerCase().includes(q) ||
      m.kpiTitle.toLowerCase().includes(q) ||
      m.owner.toLowerCase().includes(q)
    );
  });

  // TODO: Implement create/edit via MetaFormModal (similar to UserFormModal)
  const handleCreate = () => toast("Funcionalidade em desenvolvimento.", "error");
  // TODO: Implement edit — open form modal with existing meta data
  const handleEdit = (_id: string) => toast("Edição em desenvolvimento.", "error");
  // TODO: Implement delete — show DeleteModal and call DELETE /api/admin/metas/[id]
  const handleDelete = (_id: string) => toast("Exclusão em desenvolvimento.", "error");

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
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "rgba(243,222,61,0.1)",
              border: "1px solid rgba(243,222,61,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: C.yellow,
            }}
          >
            <IconTarget />
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, color: C.white }}>
            Gestão de Metas
          </span>
        </div>

        <div style={{ position: "relative" }}>
          <div
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: C.textMuted,
              display: "flex",
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
              width: 310,
              height: 36,
              background: C.panel,
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              color: C.white,
              fontSize: 13,
              padding: "0 14px 0 38px",
              outline: "none",
              fontFamily: "inherit",
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
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: 32,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: C.white,
                letterSpacing: "-0.5px",
                margin: "0 0 6px",
              }}
            >
              Gestão de Metas
            </h1>
            <p style={{ fontSize: 15, color: C.textSec, margin: 0 }}>
              Defina e acompanhe os objetivos estratégicos vinculados aos KPIs do dashboard.
            </p>
          </div>
          <button
            onClick={handleCreate}
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
            <IconPlus /> Nova Meta
          </button>
        </div>

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

          {/* Empty state */}
          {filtered.length === 0 && (
            <div
              style={{
                padding: "48px 24px",
                textAlign: "center",
                color: C.textMuted,
                fontSize: 14,
              }}
            >
              {search
                ? `Nenhuma meta encontrada para "${search}"`
                : "Nenhuma meta cadastrada."}
            </div>
          )}

          {/* Rows */}
          {filtered.map((m, idx) => (
            <div
              key={m.id}
              className="meta-row"
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1.1fr 110px 1fr 120px 100px",
                padding: "0 20px",
                borderBottom:
                  idx < filtered.length - 1 ? `1px solid rgba(62,57,96,0.5)` : "none",
                transition: "background 0.1s",
              }}
            >
              {/* Meta / KPI */}
              <div style={{ padding: "16px 8px" }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: C.white,
                    marginBottom: 5,
                  }}
                >
                  {m.titulo}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span
                    style={{
                      display: "inline-block",
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: m.kpiAccentColor,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: 11, color: C.textMuted }}>{m.kpiTitle}</span>
                </div>
              </div>

              {/* Valor Alvo */}
              <div
                style={{
                  padding: "16px 8px",
                  display: "flex",
                  alignItems: "center",
                  fontSize: 13,
                  fontWeight: 600,
                  color: C.textSec,
                  fontFamily: "monospace",
                }}
              >
                {m.targetFormatted}
              </div>

              {/* Prazo */}
              <div
                style={{
                  padding: "16px 8px",
                  display: "flex",
                  alignItems: "center",
                  fontSize: 12,
                  color: C.textSec,
                }}
              >
                {m.deadline}
              </div>

              {/* Responsável */}
              <div
                style={{
                  padding: "16px 8px",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <OwnerAvatar name={m.owner} />
                <span style={{ fontSize: 12, color: C.textSec }}>{m.owner}</span>
              </div>

              {/* Status */}
              <div
                style={{
                  padding: "16px 8px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <StatusBadge status={m.status} />
              </div>

              {/* Ações */}
              <div
                style={{
                  padding: "16px 8px",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <button
                  className="act-btn"
                  onClick={() => handleEdit(m.id)}
                  title="Editar meta"
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 6,
                    background: "transparent",
                    border: `1px solid ${C.border}`,
                    color: C.textSec,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
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
                    width: 30,
                    height: 30,
                    borderRadius: 6,
                    background: "transparent",
                    border: `1px solid ${C.border}`,
                    color: C.textSec,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
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
              {filtered.length}{" "}
              {filtered.length === 1 ? "meta encontrada" : "metas encontradas"} de{" "}
              {metas.length} total
            </span>
            <button
              onClick={handleCreate}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                fontWeight: 700,
                color: C.yellow,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
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

      <Toast toasts={toasts} />
    </div>
  );
}
