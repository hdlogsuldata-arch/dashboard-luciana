"use client";

import React, { useState, useEffect } from "react";
import Modal from "./Modal";
import { DASHBOARDS } from "@/lib/dashboards";
import { FUNCOES, type Funcao } from "@/lib/roles";

const C = {
  border:   "rgb(62,57,96)",
  inputBg:  "rgb(30,41,59)",
  inputBdr: "rgb(51,65,85)",
  white:    "rgb(255,255,255)",
  textSec:  "rgb(148,163,184)",
  textMuted:"rgb(100,116,139)",
  textLight:"rgb(203,213,225)",
  yellow:   "rgb(243,222,61)",
  brand:    "rgb(30,20,97)",
  red:      "rgb(239,68,68)",
  panel:    "rgb(31,28,48)",
};

export interface UserFormData {
  name: string;
  email: string;
  funcao: Funcao;
  password: string;
  allowedDashboards: string[];
}

export interface EditableUser {
  id: string;
  name: string | null;
  email: string;
  funcao: string;
  allowedDashboards: string[];
}

interface UserFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: UserFormData) => Promise<void>;
  editUser?: EditableUser | null;
}

function FieldInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
  icon,
  rightSlot,
  error,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  icon?: React.ReactNode;
  rightSlot?: React.ReactNode;
  error?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && (
        <label
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: C.textLight,
            letterSpacing: "0.2px",
          }}
        >
          {label}
        </label>
      )}
      <div style={{ position: "relative" }}>
        {icon && (
          <div
            style={{
              position: "absolute",
              left: 14,
              top: "50%",
              transform: "translateY(-50%)",
              color: C.textMuted,
              display: "flex",
              pointerEvents: "none",
            }}
          >
            {icon}
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: "100%",
            height: 42,
            background: C.inputBg,
            border: `1px solid ${error ? C.red : C.inputBdr}`,
            borderRadius: 8,
            color: C.white,
            fontSize: 14,
            padding: icon
              ? "0 40px 0 42px"
              : rightSlot
              ? "0 44px 0 14px"
              : "0 14px",
            outline: "none",
            fontFamily: "inherit",
            transition: "border-color 0.15s",
          }}
          onFocus={(e) => {
            if (!error) e.target.style.borderColor = C.yellow;
          }}
          onBlur={(e) => {
            e.target.style.borderColor = error ? C.red : C.inputBdr;
          }}
        />
        {rightSlot && (
          <div
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              cursor: "pointer",
              color: C.textMuted,
            }}
          >
            {rightSlot}
          </div>
        )}
      </div>
      {error && (
        <span style={{ fontSize: 11, color: C.red }}>{error}</span>
      )}
    </div>
  );
}

function Checkbox({
  checked,
  onChange,
  label,
  sublabel,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  sublabel?: string | null;
}) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        cursor: "pointer",
        padding: "8px 0",
      }}
      onClick={onChange}
    >
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: 4,
          flexShrink: 0,
          marginTop: 1,
          background: checked ? C.yellow : C.inputBg,
          border: `1px solid ${checked ? C.yellow : C.inputBdr}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.15s",
        }}
      >
        {checked && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path
              d="M1 4l3 3 5-6"
              stroke={C.brand}
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      <div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: checked ? C.white : C.textLight,
            lineHeight: "18px",
            transition: "color 0.15s",
          }}
        >
          {label}
        </div>
        {sublabel && (
          <div
            style={{
              fontSize: 11,
              color: C.textMuted,
              lineHeight: "16px",
              marginTop: 1,
            }}
          >
            {sublabel}
          </div>
        )}
      </div>
    </label>
  );
}

type Tab = "dados" | "acesso";

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  dashes?: string;
}

export default function UserFormModal({
  open,
  onClose,
  onSave,
  editUser,
}: UserFormModalProps) {
  const isEdit = !!editUser;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [funcao, setFuncao] = useState<Funcao>("Visualizador");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [dashes, setDashes] = useState<string[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [activeTab, setActiveTab] = useState<Tab>("dados");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (editUser) {
        setName(editUser.name ?? "");
        setEmail(editUser.email);
        setFuncao((editUser.funcao as Funcao) ?? "Visualizador");
        setPassword("");
        setConfirmPassword("");
        setDashes([...editUser.allowedDashboards]);
      } else {
        setName("");
        setEmail("");
        setFuncao("Visualizador");
        setPassword("");
        setConfirmPassword("");
        setDashes([]);
      }
      setErrors({});
      setActiveTab("dados");
      setShowPw(false);
      setSaving(false);
    }
  }, [open, editUser]);

  const toggleDash = (id: string) =>
    setDashes((d) =>
      d.includes(id) ? d.filter((x) => x !== id) : [...d, id]
    );

  const validate = (): FormErrors => {
    const e: FormErrors = {};
    if (!name.trim()) e.name = "Nome obrigatório";
    if (!email.trim()) e.email = "E-mail obrigatório";
    if (!isEdit && !password) e.password = "Senha obrigatória";
    if (password && password.length < 6) e.password = "Mínimo 6 caracteres";
    if (password && password !== confirmPassword) e.confirmPassword = "Senhas não coincidem";
    if (dashes.length === 0) e.dashes = "Selecione ao menos um dashboard";
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      if (e.dashes && !e.name && !e.email && !e.password && !e.confirmPassword) {
        setActiveTab("acesso");
      }
      return;
    }

    setSaving(true);
    try {
      await onSave({
        name,
        email,
        funcao,
        password,
        allowedDashboards: dashes,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const tabStyle = (id: Tab): React.CSSProperties => ({
    flex: 1,
    padding: "10px 0",
    textAlign: "center",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.15s",
    borderRadius: 6,
    background: activeTab === id ? C.yellow : "transparent",
    color: activeTab === id ? C.brand : C.textSec,
    border: "none",
    fontFamily: "inherit",
  });

  const IconUser = () => (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M2 18c0-4 3.6-7 8-7s8 3 8 7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );

  const IconMail = () => (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
      <rect x="2" y="4" width="16" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 7l8 6 8-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );

  const IconKey = () => (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
      <circle cx="7" cy="10" r="5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M11 7l7 7-2 2-1-1-2 2-1-1 1-1-2-2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const IconEye = ({ show }: { show: boolean }) =>
    show ? (
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
        <path
          d="M2 10C4 6 7 4 10 4s6 2 8 6c-2 4-5 6-8 6s-6-2-8-6z"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ) : (
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
        <path
          d="M3 3l14 14M8.5 5.5A8 8 0 0 1 10 5c3 0 6 2 8 5-1 2-2.5 3.5-4 4.5M4 7C2.5 8 1.3 9 1 10c2 3 5 5 8 5 1.2 0 2.4-.3 3.5-.8"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar Usuário" : "Novo Usuário"}
      width={560}
    >
      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 4,
          padding: "16px 24px 0",
          background: "rgb(22,20,36)",
          flexShrink: 0,
        }}
      >
        <button style={tabStyle("dados")} onClick={() => setActiveTab("dados")}>
          Dados &amp; Função
        </button>
        <button style={tabStyle("acesso")} onClick={() => setActiveTab("acesso")}>
          Acesso aos Dashboards
        </button>
      </div>

      {/* Body */}
      <div
        style={{
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {activeTab === "dados" && (
          <>
            <FieldInput
              label="Nome completo"
              value={name}
              onChange={setName}
              placeholder="Ex: João da Silva"
              icon={<IconUser />}
              error={errors.name}
            />
            <FieldInput
              label="E-mail (usado para login)"
              value={email}
              onChange={setEmail}
              placeholder="joao.silva@empresa.com"
              icon={<IconMail />}
              error={errors.email}
            />

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: C.textLight,
                }}
              >
                Função / Perfil
              </label>
              <select
                value={funcao}
                onChange={(e) => setFuncao(e.target.value as Funcao)}
                style={{
                  width: "100%",
                  height: 42,
                  background: C.inputBg,
                  border: `1px solid ${C.inputBdr}`,
                  borderRadius: 8,
                  color: C.white,
                  fontSize: 14,
                  padding: "0 14px",
                  outline: "none",
                  fontFamily: "inherit",
                  appearance: "none",
                  cursor: "pointer",
                }}
              >
                {FUNCOES.map((f) => (
                  <option key={f} value={f} style={{ background: C.inputBg }}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            <div
              style={{
                borderTop: `1px solid ${C.border}`,
                paddingTop: 16,
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: C.textLight,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <IconKey />
                {isEdit
                  ? "Nova Senha (deixe em branco para manter a atual)"
                  : "Definir Senha"}
              </div>
              <FieldInput
                value={password}
                onChange={setPassword}
                type={showPw ? "text" : "password"}
                placeholder="••••••••"
                error={errors.password}
                rightSlot={
                  <span onClick={() => setShowPw((s) => !s)}>
                    <IconEye show={showPw} />
                  </span>
                }
              />
              <FieldInput
                label="Confirmar senha"
                value={confirmPassword}
                onChange={setConfirmPassword}
                type={showPw ? "text" : "password"}
                placeholder="••••••••"
                error={errors.confirmPassword}
              />
            </div>
          </>
        )}

        {activeTab === "acesso" && (
          <>
            <div style={{ fontSize: 13, color: C.textSec, lineHeight: "1.6" }}>
              Selecione quais dashboards este usuário poderá visualizar após o login.
            </div>
            {errors.dashes && (
              <div
                style={{
                  fontSize: 12,
                  color: C.red,
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  borderRadius: 6,
                  padding: "8px 12px",
                }}
              >
                {errors.dashes}
              </div>
            )}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                overflow: "hidden",
              }}
            >
              {DASHBOARDS.map((d, i) => (
                <div
                  key={d.id}
                  style={{
                    borderBottom:
                      i < DASHBOARDS.length - 1
                        ? `1px solid ${C.border}`
                        : "none",
                    padding: "4px 16px",
                    background: dashes.includes(d.id)
                      ? "rgba(243,222,61,0.04)"
                      : "transparent",
                    transition: "background 0.15s",
                  }}
                >
                  <Checkbox
                    checked={dashes.includes(d.id)}
                    onChange={() => toggleDash(d.id)}
                    label={d.label}
                    sublabel={
                      d.id === "usuarios"
                        ? "Requer privilégio de Administrador"
                        : null
                    }
                  />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                onClick={() => setDashes(DASHBOARDS.map((d) => d.id))}
                style={{
                  fontSize: 11,
                  color: C.yellow,
                  background: "transparent",
                  border: "1px solid rgba(243,222,61,0.25)",
                  borderRadius: 5,
                  padding: "4px 10px",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontWeight: 600,
                }}
              >
                Selecionar todos
              </button>
              <button
                onClick={() => setDashes([])}
                style={{
                  fontSize: 11,
                  color: C.textMuted,
                  background: "transparent",
                  border: `1px solid ${C.border}`,
                  borderRadius: 5,
                  padding: "4px 10px",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Limpar
              </button>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 24px",
          borderTop: `1px solid ${C.border}`,
          flexShrink: 0,
          background: "rgba(31,28,48,0.5)",
        }}
      >
        <div style={{ fontSize: 12, color: C.textMuted }}>
          {activeTab === "dados"
            ? "Próximo: definir acesso →"
            : "← Voltar: dados do usuário"}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              padding: "9px 18px",
              borderRadius: 7,
              background: "transparent",
              border: `1px solid ${C.border}`,
              color: C.textLight,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = C.panel)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            Cancelar
          </button>
          {activeTab === "dados" ? (
            <button
              onClick={() => setActiveTab("acesso")}
              style={{
                padding: "9px 22px",
                borderRadius: 7,
                background: C.panel,
                border: `1px solid ${C.border}`,
                color: C.white,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.15s",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgb(42,38,64)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = C.panel)
              }
            >
              Avançar
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: "9px 22px",
                borderRadius: 7,
                background: saving ? "rgba(243,222,61,0.5)" : C.yellow,
                border: "none",
                color: C.brand,
                fontSize: 13,
                fontWeight: 700,
                cursor: saving ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                transition: "all 0.15s",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
              onMouseEnter={(e) => {
                if (!saving) e.currentTarget.style.opacity = "0.9";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
              }}
            >
              {saving ? "Salvando..." : isEdit ? "Salvar Alterações" : "Criar Usuário"}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
