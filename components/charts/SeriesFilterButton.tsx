"use client";

import { useRef, useEffect, useState } from "react";
import { SlidersHorizontal } from "lucide-react";

type Props = {
  allKeys: string[];
  hiddenKeys: Set<string>;
  onToggle: (key: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  /** Escala de tamanho — 1 = card normal, 1.5 = tela cheia */
  scale?: number;
};

export default function SeriesFilterButton({
  allKeys,
  hiddenKeys,
  onToggle,
  onSelectAll,
  onDeselectAll,
  scale = 1,
}: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Fecha ao clicar fora
  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const isActive = open || hiddenKeys.size > 0;
  const visibleCount = allKeys.length - hiddenKeys.size;

  const btnSize = Math.round(28 * scale);
  const iconSize = Math.round(13 * scale);

  return (
    <div ref={wrapRef} style={{ position: "relative", flexShrink: 0 }}>
      {/* Botão de filtro */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="Filtrar dados"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: btnSize,
          height: btnSize,
          borderRadius: 6,
          border: `1px solid ${isActive ? "#F3DE3D" : "#3E3960"}`,
          background: "transparent",
          color: isActive ? "#F3DE3D" : "#646C7F",
          cursor: "pointer",
          flexShrink: 0,
          transition: "color 0.15s, border-color 0.15s",
          position: "relative",
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            (e.currentTarget as HTMLButtonElement).style.color = "#F3DE3D";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "#F3DE3D";
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            (e.currentTarget as HTMLButtonElement).style.color = "#646C7F";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "#3E3960";
          }
        }}
      >
        <SlidersHorizontal size={iconSize} />

        {/* Badge amarelo quando há itens ocultos */}
        {hiddenKeys.size > 0 && (
          <span
            aria-label={`${hiddenKeys.size} itens ocultos`}
            style={{
              position: "absolute",
              top: -3,
              right: -3,
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "#F3DE3D",
              border: "1.5px solid #1F1C30",
            }}
          />
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            zIndex: 400,
            background: "#1A1730",
            border: "1px solid #3E3960",
            borderRadius: 10,
            minWidth: 230,
            maxHeight: 300,
            overflowY: "auto",
            boxShadow: "0 8px 32px rgba(0,0,0,0.7)",
          }}
        >
          {/* Cabeçalho: contagem + ações */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 12px",
              borderBottom: "1px solid #3E3960",
              gap: 8,
              position: "sticky",
              top: 0,
              background: "#1A1730",
              zIndex: 1,
            }}
          >
            <span style={{ fontSize: 11, color: "#646C7F", fontWeight: 500, whiteSpace: "nowrap" }}>
              {visibleCount}/{allKeys.length} visíveis
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                type="button"
                onClick={() => { onSelectAll(); }}
                style={{
                  fontSize: 11,
                  padding: "2px 8px",
                  borderRadius: 4,
                  border: "1px solid #3E3960",
                  background: "transparent",
                  color: "#94A3B8",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "color 0.1s, border-color 0.1s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = "#F3DE3D";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "#F3DE3D";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = "#94A3B8";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "#3E3960";
                }}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => { onDeselectAll(); }}
                style={{
                  fontSize: 11,
                  padding: "2px 8px",
                  borderRadius: 4,
                  border: "1px solid #3E3960",
                  background: "transparent",
                  color: "#94A3B8",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "color 0.1s, border-color 0.1s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = "#94A3B8";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "#3E3960";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = "#94A3B8";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "#3E3960";
                }}
              >
                Nenhum
              </button>
            </div>
          </div>

          {/* Lista de itens com checkboxes */}
          <div style={{ padding: "4px 0" }}>
            {allKeys.map((key) => {
              const visible = !hiddenKeys.has(key);
              return (
                <label
                  key={key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "7px 14px",
                    cursor: "pointer",
                    userSelect: "none",
                    background: "transparent",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLLabelElement).style.background = "rgba(255,255,255,0.04)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLLabelElement).style.background = "transparent";
                  }}
                >
                  <input
                    type="checkbox"
                    checked={visible}
                    onChange={() => onToggle(key)}
                    style={{ accentColor: "#F3DE3D", width: 14, height: 14, flexShrink: 0, cursor: "pointer" }}
                  />
                  <span
                    style={{
                      fontSize: 12,
                      color: visible ? "#E2E8F0" : "#4B5563",
                      lineHeight: 1.4,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      transition: "color 0.15s",
                    }}
                  >
                    {key}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
