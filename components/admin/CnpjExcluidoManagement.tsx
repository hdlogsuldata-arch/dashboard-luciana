"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { formatCnpj, normalizeCnpj } from "@/lib/data/cnpjFormat";
import CnpjFormModal, { type CnpjFormData, type EditableCnpj } from "./CnpjFormModal";
import CnpjDeleteModal from "./CnpjDeleteModal";
import Toast, { type ToastItem } from "./Toast";

const C = {
  bg:       "rgb(20,18,32)",
  panel:    "rgb(31,28,48)",
  border:   "rgb(62,57,96)",
  white:    "rgb(255,255,255)",
  textSec:  "rgb(148,163,184)",
  textMuted:"rgb(100,116,139)",
  textLight:"rgb(203,213,225)",
  yellow:   "rgb(243,222,61)",
  brand:    "rgb(30,20,97)",
};

interface CnpjRow {
  cnpj: string;
  nomeEmpresa: string;
  notas: string | null;
  criadoPor: string;
  criadoEm: string;
  atualizadoEm: string;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CnpjExcluidoManagement() {
  const [items, setItems] = useState<CnpjRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<EditableCnpj | null>(null);
  const [delItem, setDelItem] = useState<CnpjRow | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextToastId = useRef(1);

  const toast = useCallback((msg: string, type: "success" | "error" = "success") => {
    const id = nextToastId.current++;
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  }, []);

  const fetchItems = useCallback(async () => {
    try {
      const data = await apiFetch("/api/admin/cnpjs-excluidos");
      setItems(data.items as CnpjRow[]);
      setError(null);
    } catch {
      setError("Erro ao carregar CNPJs excluídos. Verifique sua conexão.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const filtered = items.filter((u) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    const qDigits = normalizeCnpj(q);
    return (
      u.nomeEmpresa.toLowerCase().includes(q) ||
      u.criadoPor.toLowerCase().includes(q) ||
      (qDigits && u.cnpj.includes(qDigits)) ||
      formatCnpj(u.cnpj).includes(q)
    );
  });

  const handleCreate = () => {
    setEditItem(null);
    setFormOpen(true);
  };

  const handleEdit = (u: CnpjRow) => {
    setEditItem({
      cnpj: u.cnpj,
      nomeEmpresa: u.nomeEmpresa,
      notas: u.notas,
    });
    setFormOpen(true);
  };

  const handleSave = async (data: CnpjFormData) => {
    try {
      if (editItem) {
        await apiFetch(`/api/admin/cnpjs-excluidos/${editItem.cnpj}`, {
          method: "PUT",
          body: JSON.stringify({
            nomeEmpresa: data.nomeEmpresa,
            notas: data.notas,
          }),
        });
        toast(`${data.nomeEmpresa} atualizado.`);
      } else {
        await apiFetch("/api/admin/cnpjs-excluidos", {
          method: "POST",
          body: JSON.stringify(data),
        });
        toast(`${data.nomeEmpresa} adicionado à exclusão.`);
      }
      await fetchItems();
    } catch (e: unknown) {
      const raw = e instanceof Error ? e.message : "Erro ao salvar CNPJ";
      const cleaned = raw
        .replace(/^HTTP \d+:\s*/, "")
        .replace(/^{.*"error":"/, "")
        .replace(/".*}$/, "");
      toast(cleaned || "Erro ao salvar CNPJ", "error");
      throw e; // mantém o modal aberto
    }
  };

  const handleConfirmDelete = async () => {
    if (!delItem) return;
    try {
      await apiFetch(`/api/admin/cnpjs-excluidos/${delItem.cnpj}`, { method: "DELETE" });
      toast(`${delItem.nomeEmpresa} removido da exclusão.`, "error");
      setDelItem(null);
      await fetchItems();
    } catch (e: unknown) {
      const raw = e instanceof Error ? e.message : "Erro ao remover";
      toast(raw.replace(/^HTTP \d+:\s*/, "").replace(/^{.*"error":"/, "").replace(/".*}$/, ""), "error");
    }
  };

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
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );

  const IconTrash = () => (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
      <path
        d="M3 6h14M8 6V4h4v2M5 6l1 11h8l1-11"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const IconSettings = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );

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
        .cnpj-row:hover > div { background: rgba(31,28,48,0.6) !important; }
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
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "rgba(243,222,61,0.1)",
              border: `1px solid rgba(243,222,61,0.25)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: C.yellow,
            }}
          >
            <IconSettings />
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, color: C.white }}>
            Configurações
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
            placeholder="Pesquisar por CNPJ ou nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: 280,
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

      {/* Main */}
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
                margin: "0 0 6px 0",
              }}
            >
              CNPJs excluídos das análises
            </h1>
            <p style={{ fontSize: 15, color: C.textSec, margin: 0, maxWidth: 720 }}>
              CNPJs cadastrados aqui não entram no cálculo dos KPIs 001-004
              (Saldo Vencido, Prazo Médio, OTD Index e CTRCs a Faturar) nem nos
              gráficos relacionados. Use para excluir clientes em agendamento
              fracionado ou com lançamentos faltando.
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
              transition: "all 0.15s",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            <IconPlus /> Adicionar CNPJ
          </button>
        </div>

        {/* Error state */}
        {error && (
          <div
            style={{
              padding: "16px 20px",
              borderRadius: 10,
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
              color: "rgb(252,165,165)",
              fontSize: 13,
              marginBottom: 24,
            }}
          >
            {error}
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
          {/* Table header */}
          <div
            style={{
              background: "rgba(31,28,48,0.5)",
              borderBottom: `1px solid ${C.border}`,
              display: "grid",
              gridTemplateColumns: "200px 1fr 1fr 160px 100px",
              padding: "0 20px",
            }}
          >
            {["CNPJ", "Nome da Empresa", "Adicionado por", "Data", "Ações"].map((h) => (
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

          {loading && (
            <div
              style={{
                padding: "48px 24px",
                textAlign: "center",
                color: C.textMuted,
                fontSize: 14,
              }}
            >
              Carregando CNPJs...
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div
              style={{
                padding: "48px 24px",
                textAlign: "center",
                color: C.textMuted,
                fontSize: 14,
              }}
            >
              {search
                ? `Nenhum CNPJ encontrado para "${search}"`
                : "Nenhum CNPJ excluído ainda. Clique em \"Adicionar CNPJ\" pra começar."}
            </div>
          )}

          {!loading &&
            filtered.map((u, idx) => (
              <div
                key={u.cnpj}
                className="cnpj-row"
                style={{
                  display: "grid",
                  gridTemplateColumns: "200px 1fr 1fr 160px 100px",
                  padding: "0 20px",
                  borderBottom:
                    idx < filtered.length - 1
                      ? `1px solid rgba(62,57,96,0.5)`
                      : "none",
                  transition: "background 0.1s",
                }}
              >
                {/* CNPJ */}
                <div
                  style={{
                    padding: "16px 8px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <code
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: C.yellow,
                      background: "rgba(243,222,61,0.08)",
                      padding: "3px 8px",
                      borderRadius: 4,
                      letterSpacing: "0.3px",
                    }}
                  >
                    {formatCnpj(u.cnpj)}
                  </code>
                </div>

                {/* Nome empresa */}
                <div
                  style={{
                    padding: "16px 8px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    gap: 2,
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: C.white,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={u.nomeEmpresa}
                  >
                    {u.nomeEmpresa}
                  </div>
                  {u.notas && (
                    <div
                      style={{
                        fontSize: 11,
                        color: C.textMuted,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={u.notas}
                    >
                      {u.notas}
                    </div>
                  )}
                </div>

                {/* Criado por */}
                <div
                  style={{
                    padding: "16px 8px",
                    display: "flex",
                    alignItems: "center",
                    fontSize: 12,
                    color: C.textSec,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={u.criadoPor}
                >
                  {u.criadoPor}
                </div>

                {/* Data */}
                <div
                  style={{
                    padding: "16px 8px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontSize: 12, color: C.textSec }}>
                    {formatDate(u.criadoEm)}
                  </span>
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
                    onClick={() => handleEdit(u)}
                    title="Editar"
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
                    onClick={() => setDelItem(u)}
                    title="Remover da exclusão"
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
              {filtered.length === 1 ? "CNPJ excluído" : "CNPJs excluídos"} de{" "}
              {items.length} total
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
              <IconPlus size={10} /> Adicionar CNPJ
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
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
          Filtros aplicados globalmente nos KPIs 001-004.
        </span>
      </footer>

      {/* Modals */}
      <CnpjFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
        editItem={editItem}
      />
      <CnpjDeleteModal
        open={!!delItem}
        onClose={() => setDelItem(null)}
        onConfirm={handleConfirmDelete}
        item={delItem}
      />

      {/* Toasts */}
      <Toast toasts={toasts} />
    </div>
  );
}
