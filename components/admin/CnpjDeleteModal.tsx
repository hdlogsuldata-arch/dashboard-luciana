"use client";

import React from "react";
import Modal from "./Modal";
import { formatCnpj } from "@/lib/data/cnpjFormat";

interface CnpjRow {
  cnpj: string;
  nomeEmpresa: string;
}

interface CnpjDeleteModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  item: CnpjRow | null;
}

export default function CnpjDeleteModal({ open, onClose, onConfirm, item }: CnpjDeleteModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Remover CNPJ da exclusão" width={440}>
      <div
        style={{
          padding: "28px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 20,
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2L2 20h20L12 2z"
              stroke="rgb(239,68,68)"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <path
              d="M12 9v5M12 16.5v.5"
              stroke="rgb(239,68,68)"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "rgb(255,255,255)",
              marginBottom: 8,
            }}
          >
            Remover este CNPJ da lista de exclusão?
          </div>
          <div
            style={{
              fontSize: 13,
              color: "rgb(148,163,184)",
              lineHeight: "1.6",
            }}
          >
            <strong style={{ color: "rgb(203,213,225)" }}>{item?.nomeEmpresa}</strong>{" "}
            (
            <code
              style={{
                color: "rgb(243,222,61)",
                fontSize: 12,
                background: "rgba(243,222,61,0.08)",
                padding: "1px 5px",
                borderRadius: 3,
              }}
            >
              {item ? formatCnpj(item.cnpj) : ""}
            </code>
            ) voltará a aparecer nos KPIs e gráficos.
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, width: "100%", marginTop: 4 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: 7,
              background: "transparent",
              border: "1px solid rgb(62,57,96)",
              color: "rgb(203,213,225)",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgb(31,28,48)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: 7,
              background: "rgb(239,68,68)",
              border: "none",
              color: "rgb(255,255,255)",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "0.85";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1";
            }}
          >
            Remover
          </button>
        </div>
      </div>
    </Modal>
  );
}
