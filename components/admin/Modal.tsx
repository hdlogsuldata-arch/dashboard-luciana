"use client";

import React from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  width?: number;
  children: React.ReactNode;
}

export default function Modal({ open, onClose, title, width = 520, children }: ModalProps) {
  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(10,8,20,0.8)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width,
          maxWidth: "100%",
          maxHeight: "90vh",
          background: "rgb(22,20,36)",
          border: "1px solid rgb(62,57,96)",
          borderRadius: 14,
          boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 24px",
            borderBottom: "1px solid rgb(62,57,96)",
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 700, color: "rgb(255,255,255)" }}>
            {title}
          </span>
          <button
            onClick={onClose}
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: "transparent",
              border: "1px solid rgb(62,57,96)",
              color: "rgb(100,116,139)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgb(31,28,48)";
              e.currentTarget.style.color = "rgb(255,255,255)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "rgb(100,116,139)";
            }}
          >
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
              <path
                d="M4 4l12 12M16 4L4 16"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <div style={{ overflowY: "auto", flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}
