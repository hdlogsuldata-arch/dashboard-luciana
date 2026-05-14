"use client";

import React, { useState, useEffect, useMemo } from "react";
import Modal from "./Modal";
import { CHART_REGISTRY } from "@/lib/charts/registry";
import { apiFetch } from "@/lib/api";
import { unitFormatter, type MetricUnit } from "@/lib/formatter";

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

export type DbStatus = "NO_PRAZO" | "EM_RISCO" | "ATRASADA" | "ALCANCADA";

const STATUS_OPTS: { value: DbStatus; label: string }[] = [
  { value: "NO_PRAZO",  label: "No Prazo"  },
  { value: "EM_RISCO",  label: "Em Risco"  },
  { value: "ATRASADA",  label: "Atrasada"  },
  { value: "ALCANCADA", label: "Atingida"  },
];

// Unit label shown next to the field label and as suffix inside the input
const FORMAT_UNIT: Record<string, string> = {
  brl:  "R$",
  pct:  "%",
  int:  "un.",
  days: "dias",
  km:   "km",
  m3:   "m³",
};

// Placeholder text per format
const FORMAT_PLACEHOLDER: Record<string, string> = {
  brl:  "Ex: 800000",
  pct:  "Ex: 90  (para 90%)",
  int:  "Ex: 150",
  days: "Ex: 30",
  km:   "Ex: 50000",
  m3:   "Ex: 45.5",
};

export interface MetaFormData {
  titulo: string;
  chartId: string;
  op: ">=" | "<=";
  targetValue: number;
  deadline: string;
  status: DbStatus;
  ownerEmail: string;
}

export interface EditableMeta extends MetaFormData {
  id: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: MetaFormData) => Promise<void>;
  editMeta?: EditableMeta | null;
}

interface FormErrors {
  titulo?: string;
  chartId?: string;
  targetValue?: string;
  deadline?: string;
  ownerEmail?: string;
}

interface UserOption {
  email: string;
  name: string | null;
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: C.textLight, letterSpacing: "0.2px" }}>
        {label}
      </label>
      {children}
      {hint && !error && (
        <span style={{ fontSize: 11, color: C.textMuted }}>{hint}</span>
      )}
      {error && (
        <span style={{ fontSize: 11, color: C.red }}>{error}</span>
      )}
    </div>
  );
}

function baseInputStyle(hasError?: boolean): React.CSSProperties {
  return {
    width: "100%",
    height: 42,
    background: C.inputBg,
    border: `1px solid ${hasError ? C.red : C.inputBdr}`,
    borderRadius: 8,
    color: C.white,
    fontSize: 14,
    padding: "0 14px",
    outline: "none",
    fontFamily: "inherit",
    transition: "border-color 0.15s",
  };
}

// Group charts by section for the select optgroups
const CHART_SECTIONS = [
  { label: "Financeiro",  section: "financeiro"  },
  { label: "Operacional", section: "operacional" },
  { label: "Frota",       section: "frota"       },
];

export default function MetaFormModal({ open, onClose, onSave, editMeta }: Props) {
  const isEdit = !!editMeta;

  const [titulo, setTitulo]           = useState("");
  const [chartId, setChartId]         = useState("");
  const [op, setOp]                   = useState<">=" | "<=">(">=");
  const [targetStr, setTargetStr]     = useState("");
  const [deadline, setDeadline]       = useState("");
  const [status, setStatus]           = useState<DbStatus>("NO_PRAZO");
  const [ownerEmail, setOwnerEmail]   = useState("");
  const [errors, setErrors]           = useState<FormErrors>({});
  const [saving, setSaving]           = useState(false);
  const [users, setUsers]             = useState<UserOption[]>([]);

  // Fetch users once for the responsável select
  useEffect(() => {
    apiFetch("/api/admin/usuarios")
      .then((d) => setUsers(d.users ?? []))
      .catch(() => setUsers([]));
  }, []);

  // Reset form when modal opens
  useEffect(() => {
    if (!open) return;
    if (editMeta) {
      setTitulo(editMeta.titulo);
      setChartId(editMeta.chartId);
      setOp(editMeta.op);
      setTargetStr(String(editMeta.targetValue));
      setDeadline(editMeta.deadline.slice(0, 10));
      setStatus(editMeta.status);
      setOwnerEmail(editMeta.ownerEmail);
    } else {
      setTitulo("");
      setChartId("");
      setOp(">=");
      setTargetStr("");
      setDeadline("");
      setStatus("NO_PRAZO");
      setOwnerEmail("");
    }
    setErrors({});
    setSaving(false);
  }, [open, editMeta]);

  const selectedChart = CHART_REGISTRY.find((c) => c.id === chartId);

  // Live preview: shows how the stored value will be displayed
  const targetPreview = useMemo(() => {
    if (!selectedChart || !targetStr) return null;
    const raw = parseFloat(targetStr.replace(",", "."));
    if (isNaN(raw) || !isFinite(raw)) return null;
    return unitFormatter[selectedChart.metricFormat as MetricUnit](raw);
  }, [selectedChart, targetStr]);

  const validate = (): FormErrors => {
    const e: FormErrors = {};
    if (!titulo.trim()) e.titulo = "Título obrigatório";
    if (!chartId) e.chartId = "Selecione um gráfico";
    const tv = parseFloat(targetStr.replace(",", "."));
    if (!targetStr || isNaN(tv)) e.targetValue = "Valor alvo inválido";
    if (!deadline) e.deadline = "Prazo obrigatório";
    if (!ownerEmail) e.ownerEmail = "Selecione o responsável";
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setSaving(true);
    try {
      const targetValue = parseFloat(targetStr.replace(",", "."));
      await onSave({
        titulo: titulo.trim(),
        chartId,
        op,
        targetValue,
        deadline,
        status,
        ownerEmail,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Editar Meta" : "Nova Meta"} width={520}>
      <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Título */}
        <Field label="Título da meta" error={errors.titulo}>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ex: OTD Index acima de 90%"
            style={baseInputStyle(!!errors.titulo)}
            onFocus={(e) => { if (!errors.titulo) e.target.style.borderColor = C.yellow; }}
            onBlur={(e) => { e.target.style.borderColor = errors.titulo ? C.red : C.inputBdr; }}
          />
        </Field>

        {/* Gráfico */}
        <Field label="Gráfico vinculado" error={errors.chartId}>
          <select
            value={chartId}
            onChange={(e) => setChartId(e.target.value)}
            style={{ ...baseInputStyle(!!errors.chartId), appearance: "none", cursor: "pointer" }}
          >
            <option value="" style={{ background: C.inputBg }}>Selecione um gráfico...</option>
            {CHART_SECTIONS.map((g) => {
              const charts = CHART_REGISTRY.filter((c) => c.section === g.section);
              if (!charts.length) return null;
              return (
                <optgroup key={g.section} label={g.label}>
                  {charts.map((c) => (
                    <option key={c.id} value={c.id} style={{ background: C.inputBg }}>
                      {c.title}
                    </option>
                  ))}
                </optgroup>
              );
            })}
          </select>
        </Field>

        {/* Direção da meta (op toggle) */}
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: C.textLight, letterSpacing: "0.2px" }}>
            Direção da meta
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={() => setOp(">=")}
              style={{
                flex: 1,
                height: 38,
                borderRadius: 8,
                border: `1px solid ${op === ">=" ? C.yellow : C.border}`,
                background: op === ">=" ? "#F3DE3D" : C.panel,
                color: op === ">=" ? "rgb(30,20,97)" : C.textLight,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.15s",
              }}
            >
              ≥ Acima de
            </button>
            <button
              type="button"
              onClick={() => setOp("<=")}
              style={{
                flex: 1,
                height: 38,
                borderRadius: 8,
                border: `1px solid ${op === "<=" ? C.yellow : C.border}`,
                background: op === "<=" ? "#F3DE3D" : C.panel,
                color: op === "<=" ? "rgb(30,20,97)" : C.textLight,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.15s",
              }}
            >
              ≤ Abaixo de
            </button>
          </div>
        </div>

        {/* Valor Alvo + Prazo */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {/* Valor Alvo — with dynamic unit label, suffix and live preview */}
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.textLight, letterSpacing: "0.2px" }}>
              Valor Alvo
              {selectedChart && (
                <span style={{ fontWeight: 400, color: C.textMuted, marginLeft: 5 }}>
                  ({FORMAT_UNIT[selectedChart.metricFormat] ?? selectedChart.metricFormat})
                </span>
              )}
            </label>
            {/* Input with unit suffix */}
            <div style={{ position: "relative" }}>
              <input
                type="text"
                inputMode="decimal"
                value={targetStr}
                onChange={(e) => setTargetStr(e.target.value)}
                placeholder={selectedChart ? FORMAT_PLACEHOLDER[selectedChart.metricFormat] ?? "Ex: 0" : "Selecione um gráfico primeiro"}
                style={{
                  ...baseInputStyle(!!errors.targetValue),
                  paddingRight: selectedChart ? 44 : 14,
                }}
                onFocus={(e) => { if (!errors.targetValue) e.target.style.borderColor = C.yellow; }}
                onBlur={(e) => { e.target.style.borderColor = errors.targetValue ? C.red : C.inputBdr; }}
              />
              {selectedChart && (
                <span
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: 12,
                    fontWeight: 700,
                    color: C.textMuted,
                    pointerEvents: "none",
                    userSelect: "none",
                  }}
                >
                  {FORMAT_UNIT[selectedChart.metricFormat]}
                </span>
              )}
            </div>
            {/* Live preview */}
            {targetPreview && !errors.targetValue && (
              <span style={{ fontSize: 11, color: "rgb(243,222,61)", display: "flex", alignItems: "center", gap: 4 }}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5h6M5.5 2.5L8 5l-2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                será exibido como: <strong>{targetPreview}</strong>
              </span>
            )}
            {errors.targetValue && (
              <span style={{ fontSize: 11, color: C.red }}>{errors.targetValue}</span>
            )}
          </div>

          <Field label="Prazo" error={errors.deadline}>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              style={{ ...baseInputStyle(!!errors.deadline), colorScheme: "dark" }}
              onFocus={(e) => { if (!errors.deadline) e.target.style.borderColor = C.yellow; }}
              onBlur={(e) => { e.target.style.borderColor = errors.deadline ? C.red : C.inputBdr; }}
            />
          </Field>
        </div>

        {/* Status + Responsável */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Status">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as DbStatus)}
              style={{ ...baseInputStyle(), appearance: "none", cursor: "pointer" }}
            >
              {STATUS_OPTS.map((s) => (
                <option key={s.value} value={s.value} style={{ background: C.inputBg }}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Responsável" error={errors.ownerEmail}>
            <select
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
              style={{ ...baseInputStyle(!!errors.ownerEmail), appearance: "none", cursor: "pointer" }}
            >
              <option value="" style={{ background: C.inputBg }}>Selecione...</option>
              {users.map((u) => (
                <option key={u.email} value={u.email} style={{ background: C.inputBg }}>
                  {u.name ?? u.email}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
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
            transition: "opacity 0.15s",
          }}
          onMouseEnter={(e) => { if (!saving) e.currentTarget.style.opacity = "0.9"; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
        >
          {saving ? "Salvando..." : isEdit ? "Salvar Alterações" : "Criar Meta"}
        </button>
      </div>
    </Modal>
  );
}
