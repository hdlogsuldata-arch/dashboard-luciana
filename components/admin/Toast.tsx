"use client";

import React from "react";

export interface ToastItem {
  id: number;
  msg: string;
  type: "success" | "error";
}

interface ToastProps {
  toasts: ToastItem[];
}

export default function Toast({ toasts }: ToastProps) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 2000,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            padding: "12px 18px",
            borderRadius: 8,
            background:
              t.type === "error"
                ? "rgba(239,68,68,0.15)"
                : "rgba(16,185,129,0.15)",
            border: `1px solid ${
              t.type === "error"
                ? "rgba(239,68,68,0.35)"
                : "rgba(16,185,129,0.35)"
            }`,
            color:
              t.type === "error" ? "rgb(252,165,165)" : "rgb(110,231,183)",
            fontSize: 13,
            fontWeight: 600,
            boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
            minWidth: 240,
            display: "flex",
            alignItems: "center",
            gap: 10,
            animation: "slideIn 0.2s ease",
          }}
        >
          <span style={{ fontSize: 16 }}>{t.type === "error" ? "✕" : "✓"}</span>
          {t.msg}
        </div>
      ))}
    </div>
  );
}
