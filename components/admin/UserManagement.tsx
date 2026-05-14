"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { DASHBOARDS } from "@/lib/dashboards";
import { ROLE_TO_FUNCAO, type Funcao } from "@/lib/roles";
import UserFormModal, { type UserFormData, type EditableUser } from "./UserFormModal";
import DeleteModal from "./DeleteModal";
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

const ROLE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Administrador: { bg: "rgba(30,20,97,0.35)",    text: "rgb(180,170,255)", border: "rgba(30,20,97,0.7)" },
  Gerente:       { bg: "rgba(59,130,246,0.15)",  text: "rgb(147,197,253)", border: "rgba(59,130,246,0.35)" },
  Analista:      { bg: "rgba(16,185,129,0.12)",  text: "rgb(110,231,183)", border: "rgba(16,185,129,0.3)" },
  Operador:      { bg: "rgba(243,222,61,0.12)",  text: "rgb(253,224,71)",  border: "rgba(243,222,61,0.3)" },
  Visualizador:  { bg: "rgba(100,116,139,0.18)", text: "rgb(148,163,184)", border: "rgba(100,116,139,0.35)" },
};

interface UserRow {
  id: string;
  name: string | null;
  email: string;
  role: string;
  funcao: string;
  allowedDashboards: string[];
  createdAt: string;
  lastLoginAt: string | null;
  mustChangePassword: boolean;
}

function initials(name: string | null, email: string): string {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
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

function RoleBadge({ funcao }: { funcao: string }) {
  const colors = ROLE_COLORS[funcao] ?? ROLE_COLORS["Visualizador"];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "3px 8px",
        borderRadius: 999,
        background: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.3px",
      }}
    >
      {funcao}
    </span>
  );
}

function DashBadge({ label }: { label: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 7px",
        borderRadius: 4,
        background: "rgba(59,130,246,0.1)",
        color: "rgb(147,197,253)",
        border: "1px solid rgba(59,130,246,0.25)",
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.2px",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editUser, setEditUser] = useState<EditableUser | null>(null);
  const [delUser, setDelUser] = useState<UserRow | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextToastId = useRef(1);

  const toast = useCallback((msg: string, type: "success" | "error" = "success") => {
    const id = nextToastId.current++;
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const data = await apiFetch("/api/admin/usuarios");
      setUsers(
        (data.users as UserRow[]).map((u) => ({
          ...u,
          funcao: u.funcao || ROLE_TO_FUNCAO[u.role] || "Visualizador",
        }))
      );
    } catch {
      setError("Erro ao carregar usuários. Verifique sua conexão.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      (u.name ?? "").toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.funcao.toLowerCase().includes(q)
    );
  });

  const handleCreate = () => {
    setEditUser(null);
    setFormOpen(true);
  };

  const handleEdit = (u: UserRow) => {
    setEditUser({
      id: u.id,
      name: u.name,
      email: u.email,
      funcao: u.funcao,
      allowedDashboards: u.allowedDashboards,
    });
    setFormOpen(true);
  };

  const handleSave = async (data: UserFormData) => {
    if (editUser) {
      await apiFetch(`/api/admin/usuarios/${editUser.id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      toast(`Usuário ${data.name} atualizado com sucesso.`);
    } else {
      await apiFetch("/api/admin/usuarios", {
        method: "POST",
        body: JSON.stringify(data),
      });
      toast(`Usuário ${data.name} criado com sucesso.`);
    }
    await fetchUsers();
  };

  const handleConfirmDelete = async () => {
    if (!delUser) return;
    try {
      await apiFetch(`/api/admin/usuarios/${delUser.id}`, { method: "DELETE" });
      toast(`Usuário ${delUser.name ?? delUser.email} removido.`, "error");
      setDelUser(null);
      await fetchUsers();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro ao excluir usuário";
      toast(msg.replace(/^HTTP \d+:\s*/, "").replace(/^{.*"error":"/, "").replace(/".*}$/, ""), "error");
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

  const IconCharts = () => (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
      <rect x="2" y="10" width="3" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="8" y="6" width="3" height="12" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="14" y="2" width="3" height="16" rx="1" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );

  const IconUsers = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M2 20c0-4 3.1-7 7-7s7 3 7 7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M19 11c1.7.5 3 2.2 3 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="17" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" />
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
        .usr-row:hover td, .usr-row:hover > div > div { background: rgba(31,28,48,0.6) !important; }
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
            <IconUsers />
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, color: C.white }}>
            Gestão de Usuários
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
            placeholder="Pesquisar por nome, e-mail ou função..."
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
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 6,
              }}
            >
              <h1
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: C.white,
                  letterSpacing: "-0.5px",
                  margin: 0,
                }}
              >
                Gestão de Usuários
              </h1>
            </div>
            <p style={{ fontSize: 15, color: C.textSec, margin: 0 }}>
              Gerencie acessos, perfis e dashboards disponíveis para cada usuário do sistema.
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
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            <IconPlus /> Novo Usuário
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
              gridTemplateColumns: "1fr 1fr 1fr 160px 136px",
              padding: "0 20px",
            }}
          >
            {["Nome / E-mail", "Função", "Dashboards", "Último Acesso", "Ações"].map(
              (h) => (
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
              )
            )}
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
              Carregando usuários...
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
                ? `Nenhum usuário encontrado para "${search}"`
                : "Nenhum usuário cadastrado."}
            </div>
          )}

          {!loading &&
            filtered.map((u, idx) => {
              const dashLabels = DASHBOARDS.filter((d) =>
                u.allowedDashboards.includes(d.id)
              ).map((d) => d.label);

              return (
                <div
                  key={u.id}
                  className="usr-row"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr 160px 136px",
                    padding: "0 20px",
                    borderBottom:
                      idx < filtered.length - 1
                        ? `1px solid rgba(62,57,96,0.5)`
                        : "none",
                    transition: "background 0.1s",
                  }}
                >
                  {/* Nome / Email */}
                  <div
                    style={{
                      padding: "16px 8px",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
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
                      {initials(u.name, u.email)}
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: C.white,
                        }}
                      >
                        {u.name ?? u.email}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: C.textMuted,
                          marginTop: 1,
                        }}
                      >
                        {u.email}
                      </div>
                    </div>
                  </div>

                  {/* Função */}
                  <div
                    style={{
                      padding: "16px 8px",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <RoleBadge funcao={u.funcao} />
                  </div>

                  {/* Dashboards */}
                  <div
                    style={{
                      padding: "14px 8px",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      flexWrap: "wrap",
                    }}
                  >
                    {dashLabels.slice(0, 2).map((l) => (
                      <DashBadge key={l} label={l} />
                    ))}
                    {dashLabels.length > 2 && (
                      <span
                        style={{
                          fontSize: 10,
                          color: C.textMuted,
                          fontWeight: 600,
                        }}
                      >
                        +{dashLabels.length - 2}
                      </span>
                    )}
                    {dashLabels.length === 0 && (
                      <span style={{ fontSize: 11, color: C.textMuted }}>—</span>
                    )}
                  </div>

                  {/* Último Acesso */}
                  <div
                    style={{
                      padding: "16px 8px",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontSize: 12, color: C.textSec }}>
                      {formatDate(u.lastLoginAt)}
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
                    <a
                      href={`/admin/usuarios/${u.id}/graficos`}
                      title="Configurar gráficos e KPIs"
                      className="act-btn"
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
                        textDecoration: "none",
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "rgba(243,222,61,0.5)";
                        e.currentTarget.style.color = C.yellow;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = C.border;
                        e.currentTarget.style.color = C.textSec;
                      }}
                    >
                      <IconCharts />
                    </a>
                    <button
                      className="act-btn"
                      onClick={() => handleEdit(u)}
                      title="Editar usuário"
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
                      onClick={() => setDelUser(u)}
                      title="Excluir usuário"
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
              );
            })}

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
              {filtered.length === 1 ? "usuário encontrado" : "usuários encontrados"} de{" "}
              {users.length} total
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
              <IconPlus size={10} /> Adicionar Usuário
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
          Segurança de dados e conformidade operacional garantida.
        </span>
      </footer>

      {/* Modals */}
      <UserFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
        editUser={editUser}
      />
      <DeleteModal
        open={!!delUser}
        onClose={() => setDelUser(null)}
        onConfirm={handleConfirmDelete}
        user={delUser}
      />

      {/* Toasts */}
      <Toast toasts={toasts} />
    </div>
  );
}
