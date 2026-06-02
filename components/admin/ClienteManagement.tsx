"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import ClienteFormModal, { type ClienteFormData, type EditableCliente } from "./ClienteFormModal";
import DeleteModal from "./DeleteModal";
import Toast, { type ToastItem } from "./Toast";

const C = {
  bg:        "rgb(20,18,32)",
  panel:     "rgb(31,28,48)",
  border:    "rgb(62,57,96)",
  white:     "rgb(255,255,255)",
  textSec:   "rgb(148,163,184)",
  textMuted: "rgb(100,116,139)",
  textLight: "rgb(203,213,225)",
  yellow:    "rgb(243,222,61)",
  brand:     "rgb(30,20,97)",
};

interface ClienteRow {
  id: number;
  cnpj: string;
  nome: string | null;
  excluido: boolean;
  grupo: string | null;
  motivo: string | null;
  createdAt: string;
}

function formatCnpj(v: string): string {
  const d = v.replace(/\D/g, "");
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

function StatusBadge({ excluido }: { excluido: boolean }) {
  const cfg = excluido
    ? { bg: "rgba(239,68,68,0.12)", text: "rgb(252,165,165)", border: "rgba(239,68,68,0.3)", label: "Excluído" }
    : { bg: "rgba(16,185,129,0.12)", text: "rgb(110,231,183)", border: "rgba(16,185,129,0.3)", label: "Ativo" };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 8px",
        borderRadius: 999,
        background: cfg.bg,
        color: cfg.text,
        border: `1px solid ${cfg.border}`,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.3px",
      }}
    >
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.text, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

function GrupoBadge({ grupo }: { grupo: string | null }) {
  if (!grupo) return <span style={{ fontSize: 11, color: C.textMuted }}>—</span>;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 7px",
        borderRadius: 4,
        background: "rgba(139,92,246,0.1)",
        color: "rgb(196,181,253)",
        border: "1px solid rgba(139,92,246,0.25)",
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.2px",
        whiteSpace: "nowrap",
      }}
    >
      {grupo}
    </span>
  );
}

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

const IconBuilding = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M9 21V12h6v9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M9 7h.01M12 7h.01M15 7h.01M9 11h.01M15 11h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export default function ClienteManagement() {
  const [clientes, setClientes] = useState<ClienteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editCliente, setEditCliente] = useState<EditableCliente | null>(null);
  const [delCliente, setDelCliente] = useState<ClienteRow | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextToastId = useRef(1);

  const toast = useCallback((msg: string, type: "success" | "error" = "success") => {
    const id = nextToastId.current++;
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  }, []);

  const fetchClientes = useCallback(async () => {
    try {
      const data = await apiFetch("/api/admin/clientes");
      setClientes(data.clientes as ClienteRow[]);
    } catch {
      setError("Erro ao carregar clientes. Verifique sua conexão.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchClientes(); }, [fetchClientes]);

  const filtered = clientes.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.cnpj.includes(q) ||
      (c.nome ?? "").toLowerCase().includes(q) ||
      (c.grupo ?? "").toLowerCase().includes(q)
    );
  });

  const handleCreate = () => { setEditCliente(null); setFormOpen(true); };

  const handleEdit = (c: ClienteRow) => {
    setEditCliente({ id: c.id, cnpj: c.cnpj, nome: c.nome, excluido: c.excluido, grupo: c.grupo, motivo: c.motivo });
    setFormOpen(true);
  };

  const handleSave = async (data: ClienteFormData) => {
    if (editCliente) {
      await apiFetch(`/api/admin/clientes/${editCliente.id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      toast(`Cliente ${data.nome || data.cnpj} atualizado com sucesso.`);
    } else {
      await apiFetch("/api/admin/clientes", {
        method: "POST",
        body: JSON.stringify(data),
      });
      toast(`Cliente ${data.nome || data.cnpj} adicionado com sucesso.`);
    }
    await fetchClientes();
  };

  const handleConfirmDelete = async () => {
    if (!delCliente) return;
    try {
      await apiFetch(`/api/admin/clientes/${delCliente.id}`, { method: "DELETE" });
      toast(`Cliente ${delCliente.nome ?? delCliente.cnpj} removido.`, "error");
      setDelCliente(null);
      await fetchClientes();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro ao excluir cliente";
      toast(msg.replace(/^HTTP \d+:\s*/, "").replace(/^{.*"error":"/, "").replace(/".*}$/, ""), "error");
    }
  };

  const totalExcluidos = clientes.filter((c) => c.excluido).length;

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
        .cli-row:hover { background: rgba(31,28,48,0.6) !important; }
        .act-btn:hover { background: rgba(255,255,255,0.06) !important; }
      `}</style>

      {/* Header */}
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
              background: "rgba(243,222,61,0.1)",
              border: "1px solid rgba(243,222,61,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: C.yellow,
            }}
          >
            <IconBuilding />
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, color: C.white }}>
            Gestão de Clientes
          </span>
        </div>
        <div style={{ position: "relative" }}>
          <div
            style={{
              position: "absolute", left: 12, top: "50%",
              transform: "translateY(-50%)", color: C.textMuted, display: "flex",
            }}
          >
            <IconSearch />
          </div>
          <input
            type="text"
            placeholder="Pesquisar por CNPJ, nome ou grupo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: 290, height: 36,
              background: C.panel, border: `1px solid ${C.border}`,
              borderRadius: 8, color: C.white, fontSize: 13,
              padding: "0 14px 0 38px", outline: "none", fontFamily: "inherit",
            }}
          />
        </div>
      </header>

      {/* Main */}
      <main style={{ flex: 1, padding: "32px 24px 60px", maxWidth: 1280, width: "100%", margin: "0 auto" }}>
        {/* Page header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: C.white, letterSpacing: "-0.5px", margin: "0 0 6px" }}>
              Gestão de Clientes
            </h1>
            <p style={{ fontSize: 15, color: C.textSec, margin: 0 }}>
              Gerencie CNPJs de clientes, defina grupos e controle quais são excluídos das análises.
            </p>
          </div>
          <button
            onClick={handleCreate}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 20px", borderRadius: 8,
              background: C.yellow, border: "none",
              color: C.brand, fontSize: 14, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
              boxShadow: "0 4px 14px rgba(243,222,61,0.2)",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            <IconPlus /> Novo Cliente
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 16, marginBottom: 28 }}>
          {[
            { label: "Total cadastrado", value: clientes.length, color: C.yellow },
            { label: "Excluídos das análises", value: totalExcluidos, color: "rgb(252,165,165)" },
            { label: "Ativos nas análises", value: clientes.length - totalExcluidos, color: "rgb(110,231,183)" },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                padding: "14px 20px", borderRadius: 10,
                background: C.panel, border: `1px solid ${C.border}`,
                display: "flex", flexDirection: "column", gap: 4,
                minWidth: 160,
              }}
            >
              <span style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</span>
              <span style={{ fontSize: 12, color: C.textMuted }}>{s.label}</span>
            </div>
          ))}
        </div>

        {error && (
          <div style={{
            padding: "16px 20px", borderRadius: 10,
            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
            color: "rgb(252,165,165)", fontSize: 13, marginBottom: 24,
          }}>
            {error}
          </div>
        )}

        {/* Table */}
        <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }}>
          {/* Table header */}
          <div
            style={{
              background: "rgba(31,28,48,0.5)",
              borderBottom: `1px solid ${C.border}`,
              display: "grid",
              gridTemplateColumns: "180px 1fr 140px 140px 100px",
              padding: "0 20px",
            }}
          >
            {["CNPJ", "Nome / Razão Social", "Grupo", "Status", "Ações"].map((h) => (
              <div
                key={h}
                style={{
                  padding: "13px 8px", fontSize: 11,
                  fontWeight: 700, color: C.textMuted,
                  letterSpacing: "0.6px", textTransform: "uppercase",
                }}
              >
                {h}
              </div>
            ))}
          </div>

          {loading && (
            <div style={{ padding: "48px 24px", textAlign: "center", color: C.textMuted, fontSize: 14 }}>
              Carregando clientes...
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div style={{ padding: "48px 24px", textAlign: "center", color: C.textMuted, fontSize: 14 }}>
              {search ? `Nenhum cliente encontrado para "${search}"` : "Nenhum cliente cadastrado."}
            </div>
          )}

          {!loading && filtered.map((c, idx) => (
            <div
              key={c.id}
              className="cli-row"
              style={{
                display: "grid",
                gridTemplateColumns: "180px 1fr 140px 140px 100px",
                padding: "0 20px",
                borderBottom: idx < filtered.length - 1 ? `1px solid rgba(62,57,96,0.5)` : "none",
                transition: "background 0.1s",
              }}
            >
              {/* CNPJ */}
              <div style={{ padding: "16px 8px", display: "flex", alignItems: "center" }}>
                <code
                  style={{
                    fontSize: 13, fontWeight: 600,
                    color: C.yellow,
                    background: "rgba(243,222,61,0.07)",
                    padding: "3px 8px", borderRadius: 5,
                    letterSpacing: "0.5px",
                  }}
                >
                  {formatCnpj(c.cnpj)}
                </code>
              </div>

              {/* Nome */}
              <div style={{ padding: "16px 8px", display: "flex", alignItems: "center" }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: c.nome ? C.white : C.textMuted }}>
                  {c.nome || "—"}
                </span>
              </div>

              {/* Grupo */}
              <div style={{ padding: "16px 8px", display: "flex", alignItems: "center" }}>
                <GrupoBadge grupo={c.grupo} />
              </div>

              {/* Status */}
              <div style={{ padding: "16px 8px", display: "flex", alignItems: "center" }}>
                <StatusBadge excluido={c.excluido} />
              </div>

              {/* Ações */}
              <div style={{ padding: "16px 8px", display: "flex", alignItems: "center", gap: 4 }}>
                <button
                  className="act-btn"
                  onClick={() => handleEdit(c)}
                  title="Editar cliente"
                  style={{
                    width: 30, height: 30, borderRadius: 6,
                    background: "transparent", border: `1px solid ${C.border}`,
                    color: C.textSec, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(59,130,246,0.5)"; e.currentTarget.style.color = "rgb(147,197,253)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textSec; }}
                >
                  <IconEdit />
                </button>
                <button
                  className="act-btn"
                  onClick={() => setDelCliente(c)}
                  title="Remover cliente"
                  style={{
                    width: 30, height: 30, borderRadius: 6,
                    background: "transparent", border: `1px solid ${C.border}`,
                    color: C.textSec, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(239,68,68,0.5)"; e.currentTarget.style.color = "rgb(252,165,165)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textSec; }}
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
              {filtered.length === 1 ? "cliente encontrado" : "clientes encontrados"} de{" "}
              {clientes.length} total
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
              <IconPlus size={10} /> Adicionar Cliente
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${C.border}`, padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, color: C.textMuted }}>© 2026 H. D. Log Transportes LTDA — Sistema de Controle Interno</span>
        <span style={{ fontSize: 12, color: C.textMuted }}>Segurança de dados e conformidade operacional garantida.</span>
      </footer>

      <ClienteFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
        editCliente={editCliente}
      />

      <DeleteModal
        open={!!delCliente}
        onClose={() => setDelCliente(null)}
        onConfirm={handleConfirmDelete}
        user={delCliente ? { id: String(delCliente.id), name: delCliente.nome, email: delCliente.cnpj } : null}
      />

      <Toast toasts={toasts} />
    </div>
  );
}
