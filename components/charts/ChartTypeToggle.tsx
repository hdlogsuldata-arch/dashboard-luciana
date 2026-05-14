"use client";

import type { ChartType } from "../../lib/chartTypes";

const LABELS: Record<ChartType, string> = {
  bar: "Barras",
  donut: "Donut",
  line: "Linha",
};

type Props = {
  supported: ChartType[];
  value: ChartType;
  onChange: (t: ChartType) => void;
  lineDisabled?: boolean; // true when only 1 month available
};

export default function ChartTypeToggle({
  supported,
  value,
  onChange,
  lineDisabled = false,
}: Props) {
  if (supported.length <= 1) return null;

  return (
    <div
      style={{
        display: "flex",
        gap: 2,
        background: "#141220",
        border: "1px solid #3E3960",
        borderRadius: 8,
        padding: 2,
      }}
    >
      {supported.map((t) => {
        const isActive = t === value;
        const isDisabled = t === "line" && lineDisabled;

        return (
          <button
            key={t}
            type="button"
            disabled={isDisabled}
            title={
              isDisabled
                ? "Disponível quando houver mais de 1 mês de dados"
                : undefined
            }
            onClick={() => !isDisabled && onChange(t)}
            style={{
              padding: "4px 10px",
              fontSize: 12,
              fontWeight: isActive ? 600 : 400,
              borderRadius: 6,
              border: "none",
              cursor: isDisabled ? "not-allowed" : "pointer",
              transition: "background 0.15s, color 0.15s",
              background: isActive ? "#F3DE3D" : "transparent",
              color: isDisabled
                ? "#3E3960"
                : isActive
                ? "#141220"
                : "#94A3B8",
              outline: "none",
            }}
          >
            {LABELS[t]}
          </button>
        );
      })}
    </div>
  );
}
