"use client";

import React, { useState, useEffect } from "react";
import Modal from "./Modal";

const C = {
  border:    "rgb(62,57,96)",
  inputBg:   "rgb(30,41,59)",
  inputBdr:  "rgb(51,65,85)",
  white:     "rgb(255,255,255)",
  textSec:   "rgb(148,163,184)",
  textMuted: "rgb(100,116,139)",
  textLight: "rgb(203,213,225)",
  yellow:    "rgb(243,222,61)",
  brand:     "rgb(30,20,97)",
  red:       "rgb(239,68,68)",
  panel:     "rgb(31,28,48)",
};

export interface ClienteFormData {
  cnpj: string;
  nome: string;
  excluido: boolean;
  grupo: string;
  motivo: string;
}

export interface EditableCliente {
  id: number;
  cnpj: string;
  nome: string | null;
  excluido: boolean;
  grupo: string | null;
  motivo: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: ClienteFormData) => Promise<void>;
  editCliente?: EditableCliente | null;
}

function FieldInput({
  label,
  value,
  onChange,
  placeholder = "",
  error,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  hint?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: C.textLight, letterSpacing: "0.2px" }}>
        {label}
      </label>
      <input
        type="text"
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
          padding: "0 14px",
          outline: "none",
          fontFamily: "inherit",
          transition: "border-color 0.15s",
          boxSizing: "border-box",
        }}
        onFocus={(e) => { if (!error) e.target.style.borderColor = C.yellow; }}
        onBlur={(e) => { e.target.style.borderColor = error ? C.red : C.inputBdr; }}
      />
      {hint && !error && <span style={{ fontSize: 11, color: C.textMuted }}>{hint}</span>}
      {error && <span style={{ fontSize: 11, color: C.red }}>{error}</span>}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  description?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 14px",
        borderRadius: 8,
        background: checked ? "rgba(239,68,68,0.06)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${checked ? "rgba(239,68,68,0.25)" : C.inputBdr}`,
        cursor: "pointer",
        transition: "all 0.15s",
      }}
      onClick={onChange}
    >
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: checked ? "rgb(252,165,165)" : C.textLight }}>
          {label}
        </div>
        {description && (
          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{description}</div>
        )}
      </div>
      <div
        style={{
          width: 40,
          height: 22,
          borderRadius: 11,
          background: checked ? "rgb(239,68,68)" : C.inputBdr,
          position: "relative",
          flexShrink: 0,
          transition: "background 0.2s",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 3,
            left: checked ? 21 : 3,
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: C.white,
            transition: "left 0.2s",
          }}
        />
      </div>
    </div>
  );
}

function formatCnpj(v: string): string {
  const digits = v.replace(/\D/g, "").slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

interface FormErrors {
  cnpj?: string;
}

export default function ClienteFormModal({ open, onClose, onSave, editCliente }: Props) {
  const isEdit = !!editCliente;

  const [cnpj, setCnpj] = useState("");
  const [nome, setNome] = useState("");
  const [excluido, setExcluido] = useState(false);
  const [grupo, setGrupo] = useState("");
  const [motivo, setMotivo] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (editCliente) {
        setCnpj(formatCnpj(editCliente.cnpj));
        setNome(editCliente.nome ?? "");
        setExcluido(editCliente.excluido);
        setGrupo(editCliente.grupo ?? "");
        setMotivo(editCliente.motivo ?? "");
      } else {
        setCnpj("");
        setNome("");
        setExcluido(false);
        setGrupo("");
        setMotivo("");
      }
      setErrors({});
      setSaving(false);
    }
  }, [open, editCliente]);

  const handleCnpjChange = (v: string) => setCnpj(formatCnpj(v));

  const validate = (): FormErrors => {
    const e: FormErrors = {};
    const digits = cnpj.replace(/\D/g, "");
    if (digits.length !== 14) e.cnpj = "CNPJ deve ter 14 dígitos";
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      await onSave({ cnpj, nome, excluido, grupo, motivo });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar Cliente" : "Novo Cliente"}
      width={520}
    >
      <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 16 }}>
        <FieldInput
          label="CNPJ *"
          value={cnpj}
          onChange={handleCnpjChange}
          placeholder="00.000.000/0001-00"
          error={errors.cnpj}
          hint="Apenas os números também são aceitos"
        />
        <FieldInput
          label="Nome / Razão Social"
          value={nome}
          onChange={setNome}
          placeholder="Ex: Empresa ABC LTDA"
        />
        <FieldInput
          label="Grupo"
          value={grupo}
          onChange={setGrupo}
          placeholder="Ex: Grupo ABC, Cliente Próprio..."
          hint="Usado para agrupar clientes nas análises"
        />
        <Toggle
          checked={excluido}
          onChange={() => setExcluido((v) => !v)}
          label="Excluir das análises"
          description="CTRCs deste CNPJ serão filtrados nas análises dos dashboards"
        />
        <FieldInput
          label="Motivo / Observação"
          value={motivo}
          onChange={setMotivo}
          placeholder="Ex: cliente interno, filial, excluir por duplicidade..."
        />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: 10,
          padding: "16px 24px",
          borderTop: `1px solid ${C.border}`,
          background: "rgba(31,28,48,0.5)",
          flexShrink: 0,
        }}
      >
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
          onMouseEnter={(e) => (e.currentTarget.style.background = C.panel)}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          Cancelar
        </button>
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
          }}
          onMouseEnter={(e) => { if (!saving) e.currentTarget.style.opacity = "0.9"; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
        >
          {saving ? "Salvando..." : isEdit ? "Salvar Alterações" : "Adicionar Cliente"}
        </button>
      </div>
    </Modal>
  );
}
