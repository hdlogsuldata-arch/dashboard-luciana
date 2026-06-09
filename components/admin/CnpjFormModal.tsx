"use client";

import React, { useState, useEffect, useRef } from "react";
import Modal from "./Modal";
import { apiFetch } from "@/lib/api";
import { normalizeCnpj, formatCnpj } from "@/lib/data/cnpjFormat";

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
  green:    "rgb(16,185,129)",
  panel:    "rgb(31,28,48)",
};

export interface CnpjFormData {
  cnpj: string;
  nomeEmpresa: string;
  notas: string;
}

export interface EditableCnpj {
  cnpj: string;
  nomeEmpresa: string;
  notas: string | null;
}

interface CnpjFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: CnpjFormData) => Promise<void>;
  editItem?: EditableCnpj | null;
}

function applyCnpjMask(digits: string): string {
  const d = digits.slice(0, 14);
  const parts: string[] = [];
  if (d.length > 0) parts.push(d.slice(0, 2));
  if (d.length >= 3) parts[0] = `${d.slice(0, 2)}.${d.slice(2, 5)}`;
  if (d.length >= 6) parts[0] = `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}`;
  if (d.length >= 9) parts[0] = `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}`;
  if (d.length >= 13) parts[0] = `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12, 14)}`;
  return parts[0] ?? "";
}

export default function CnpjFormModal({
  open,
  onClose,
  onSave,
  editItem,
}: CnpjFormModalProps) {
  const isEdit = !!editItem;

  const [cnpjMasked, setCnpjMasked] = useState("");
  const [nomeEmpresa, setNomeEmpresa] = useState("");
  const [notas, setNotas] = useState("");
  const [cnpjError, setCnpjError] = useState<string | null>(null);
  const [nomeError, setNomeError] = useState<string | null>(null);
  const [sugestaoFonte, setSugestaoFonte] = useState<string | null>(null);
  const [buscandoNome, setBuscandoNome] = useState(false);
  const [saving, setSaving] = useState(false);

  const lastSuggestedCnpj = useRef<string>("");

  useEffect(() => {
    if (open) {
      if (editItem) {
        setCnpjMasked(formatCnpj(editItem.cnpj));
        setNomeEmpresa(editItem.nomeEmpresa);
        setNotas(editItem.notas ?? "");
      } else {
        setCnpjMasked("");
        setNomeEmpresa("");
        setNotas("");
      }
      setCnpjError(null);
      setNomeError(null);
      setSugestaoFonte(null);
      setBuscandoNome(false);
      setSaving(false);
      lastSuggestedCnpj.current = "";
    }
  }, [open, editItem]);

  const cnpjDigits = normalizeCnpj(cnpjMasked);

  const buscarSugestao = async (cnpj: string) => {
    if (cnpj.length !== 14) return;
    if (lastSuggestedCnpj.current === cnpj) return;
    lastSuggestedCnpj.current = cnpj;
    setBuscandoNome(true);
    setSugestaoFonte(null);
    try {
      const data = await apiFetch(`/api/admin/sugerir-nome-cnpj?cnpj=${cnpj}`);
      if (data?.nome && !nomeEmpresa.trim()) {
        setNomeEmpresa(data.nome);
        setSugestaoFonte(data.fonte ?? null);
      } else if (data?.nome) {
        // Já preencheu manualmente — não sobrescreve, mas mostra fonte como informação
        setSugestaoFonte(data.fonte ?? null);
      }
    } catch {
      // silencioso — usuária pode digitar manual
    } finally {
      setBuscandoNome(false);
    }
  };

  const handleCnpjChange = (raw: string) => {
    if (isEdit) return;
    const digits = raw.replace(/\D/g, "").slice(0, 14);
    setCnpjMasked(applyCnpjMask(digits));
    setCnpjError(null);
    if (digits.length === 14) {
      buscarSugestao(digits);
    } else {
      lastSuggestedCnpj.current = "";
      setSugestaoFonte(null);
    }
  };

  const handleSave = async () => {
    let hasError = false;
    if (!isEdit && cnpjDigits.length !== 14) {
      setCnpjError("CNPJ deve ter 14 dígitos");
      hasError = true;
    }
    if (!nomeEmpresa.trim()) {
      setNomeError("Nome da empresa obrigatório");
      hasError = true;
    }
    if (hasError) return;

    setSaving(true);
    try {
      await onSave({
        cnpj: cnpjDigits,
        nomeEmpresa: nomeEmpresa.trim(),
        notas: notas.trim(),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const fonteLabel: Record<string, string> = {
    caixa240: "Sugerido pelo Contas a Receber",
    cliente017: "Sugerido pelo histórico de entregas",
    ctrc: "Sugerido pela base de CTRCs",
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar CNPJ excluído" : "Adicionar CNPJ à exclusão"}
      width={520}
    >
      <div
        style={{
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* CNPJ */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: C.textLight,
              letterSpacing: "0.2px",
            }}
          >
            CNPJ
          </label>
          <input
            type="text"
            value={cnpjMasked}
            onChange={(e) => handleCnpjChange(e.target.value)}
            placeholder="00.000.000/0000-00"
            disabled={isEdit}
            style={{
              width: "100%",
              height: 42,
              background: isEdit ? "rgba(30,41,59,0.5)" : C.inputBg,
              border: `1px solid ${cnpjError ? C.red : C.inputBdr}`,
              borderRadius: 8,
              color: isEdit ? C.textMuted : C.white,
              fontSize: 14,
              padding: "0 14px",
              outline: "none",
              fontFamily: "inherit",
              cursor: isEdit ? "not-allowed" : "text",
              letterSpacing: "0.5px",
              transition: "border-color 0.15s",
            }}
            onFocus={(e) => {
              if (!cnpjError && !isEdit) e.target.style.borderColor = C.yellow;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = cnpjError ? C.red : C.inputBdr;
            }}
          />
          {cnpjError && <span style={{ fontSize: 11, color: C.red }}>{cnpjError}</span>}
          {!cnpjError && !isEdit && cnpjDigits.length > 0 && cnpjDigits.length < 14 && (
            <span style={{ fontSize: 11, color: C.textMuted }}>
              {cnpjDigits.length}/14 dígitos
            </span>
          )}
        </div>

        {/* Nome empresa */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: C.textLight,
              letterSpacing: "0.2px",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            Nome da empresa
            {buscandoNome && (
              <span style={{ fontSize: 10, color: C.textMuted, fontWeight: 500 }}>
                buscando...
              </span>
            )}
          </label>
          <input
            type="text"
            value={nomeEmpresa}
            onChange={(e) => {
              setNomeEmpresa(e.target.value);
              setNomeError(null);
            }}
            placeholder="Ex: Transportes XYZ Ltda"
            style={{
              width: "100%",
              height: 42,
              background: C.inputBg,
              border: `1px solid ${nomeError ? C.red : C.inputBdr}`,
              borderRadius: 8,
              color: C.white,
              fontSize: 14,
              padding: "0 14px",
              outline: "none",
              fontFamily: "inherit",
              transition: "border-color 0.15s",
            }}
            onFocus={(e) => {
              if (!nomeError) e.target.style.borderColor = C.yellow;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = nomeError ? C.red : C.inputBdr;
            }}
          />
          {nomeError && <span style={{ fontSize: 11, color: C.red }}>{nomeError}</span>}
          {!nomeError && sugestaoFonte && fonteLabel[sugestaoFonte] && (
            <span style={{ fontSize: 11, color: C.green }}>
              ✓ {fonteLabel[sugestaoFonte]} — edite se necessário
            </span>
          )}
        </div>

        {/* Notas */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: C.textLight,
              letterSpacing: "0.2px",
            }}
          >
            Notas (opcional)
          </label>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Ex: Cliente usa agendamento fracionado, pagamentos pendentes…"
            rows={3}
            style={{
              width: "100%",
              background: C.inputBg,
              border: `1px solid ${C.inputBdr}`,
              borderRadius: 8,
              color: C.white,
              fontSize: 13,
              padding: "10px 14px",
              outline: "none",
              fontFamily: "inherit",
              resize: "vertical",
              minHeight: 70,
              transition: "border-color 0.15s",
            }}
            onFocus={(e) => (e.target.style.borderColor = C.yellow)}
            onBlur={(e) => (e.target.style.borderColor = C.inputBdr)}
          />
          <span style={{ fontSize: 11, color: C.textMuted }}>
            Útil pra explicar pra equipe por que esse CNPJ foi excluído.
          </span>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: 10,
          padding: "16px 24px",
          borderTop: `1px solid ${C.border}`,
          flexShrink: 0,
          background: "rgba(31,28,48,0.5)",
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
          onMouseEnter={(e) => {
            if (!saving) e.currentTarget.style.opacity = "0.9";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "1";
          }}
        >
          {saving ? "Salvando..." : isEdit ? "Salvar Alterações" : "Adicionar"}
        </button>
      </div>
    </Modal>
  );
}
