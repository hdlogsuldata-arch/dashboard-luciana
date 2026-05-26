"use client";

/**
 * ChartRenderer — HDLOG Dashboard
 * Componente polimórfico: bar | donut | line
 *
 * Adaptado do dash-mkt para tema escuro HDLOG.
 * Todas as cores são inline styles (sem classes Tailwind de cor).
 */

import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell as PieCell,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ReferenceArea,
  type TooltipProps,
} from "recharts";

import type { ChartRendererProps, BarMultiSeries } from "../../lib/chartTypes";
import { safeNum } from "../../lib/formatter";
import { useColorResolver } from "../../lib/colorHooks";
import { normKey } from "../../lib/colors";

// ── Cores do tema escuro HDLOG ──────────────────────────────────────────────
const THEME = {
  card:        "#1F1C30",
  border:      "#3E3960",
  textPrimary: "#FFFFFF",
  textMuted:   "#94A3B8",
  grid:        "rgba(62,57,96,0.5)",
  tooltipBg:   "#0F172A",
  targetStroke:"#F3DE3D",  // amarelo brand para linha de meta
  targetOpacity: 0.7,
} as const;

// ── Helpers ─────────────────────────────────────────────────────────────────

function displayName(raw: any): string {
  const s = String(raw ?? "").trim();
  if (!s) return "";
  return s;
}

/** Trunca o label para exibição na legenda; o nome completo fica no title para hover. */
function truncateLegendLabel(label: string, maxLen = 12): string {
  return label.length > maxLen ? label.slice(0, maxLen) + "…" : label;
}

function computeTopWithHeadroom(dataMax: number, targetValue: number): number {
  return Math.max(dataMax, targetValue) * 1.18;
}

// ── Componente ───────────────────────────────────────────────────────────────

export function ChartRenderer({
  type,
  metricFormat,
  compareData,
  series,
  barMulti,
  yAxisLabel,
  targetLine,
  loading,
  height = 280 as number | string,
  fontScale = 1,
}: ChartRendererProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const { getColor } = useColorResolver();

  const barMultiSeries: BarMultiSeries[] = barMulti?.series ?? [];
  const isBarMulti = type === "bar" && !!barMulti && barMultiSeries.length > 0;

  // Label map para tooltip/legend do barMulti
  const barMultiLabelByKey = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of barMultiSeries) m.set(String(s.key), String(s.label ?? s.key));
    return m;
  }, [barMultiSeries]);

  // ── Normalização de dados ──────────────────────────────────────────────────

  const donutData = useMemo(
    () => (compareData ?? []).map((d) => ({ ...d, name: displayName(d.name), value: safeNum(d.value) })),
    [compareData],
  );

  const lineData = useMemo(() => {
    const map = new Map<string, Record<string, any>>();
    for (const s of series ?? []) {
      for (const p of s.points ?? []) {
        const row = map.get(p.x) ?? { x: p.x };
        row[s.name] = safeNum(p.y);
        map.set(p.x, row);
      }
    }
    return Array.from(map.values());
  }, [series]);

  const barMultiData = useMemo(() => {
    if (!barMulti?.data?.length) return [];
    return barMulti.data.map((row) => {
      const out: Record<string, any> = { ...row };
      out.name = displayName(out.name);
      for (const s of barMultiSeries) out[s.key] = safeNum(out[s.key]);
      return out;
    });
  }, [barMulti?.data, barMultiSeries]);

  // ── Estados vazios ─────────────────────────────────────────────────────────

  const isEmpty =
    (isBarMulti && barMultiData.length === 0) ||
    (type !== "line" && !isBarMulti && (compareData?.length ?? 0) === 0) ||
    (type === "line" && (series?.length ?? 0) === 0);

  // ── Target line / zona de meta ─────────────────────────────────────────────

  const gradId = useMemo(() => `hdlog-grad-${Math.random().toString(36).slice(2, 8)}`, []);

  const targetTop = useMemo(() => {
    if (!targetLine) return undefined;
    if (type === "bar" && !isBarMulti) {
      const max = (compareData ?? []).reduce((acc, d) => Math.max(acc, safeNum(d.value)), 0);
      return computeTopWithHeadroom(max, targetLine.value);
    }
    if (type === "line") {
      let max = 0;
      for (const row of lineData) {
        for (const k of Object.keys(row)) {
          if (k !== "x") max = Math.max(max, safeNum(row[k]));
        }
      }
      return computeTopWithHeadroom(max, targetLine.value);
    }
    return undefined;
  }, [targetLine, type, isBarMulti, compareData, lineData]);

  const shade = useMemo(() => {
    if (!targetLine || targetTop == null) return null;
    const op = (targetLine as any).op as "=" | ">=" | "<=" | undefined;
    if (op === "=") return null;
    const eff = op ?? "<=";
    return eff === ">=" ? { y1: 0, y2: targetLine.value } : { y1: targetLine.value, y2: targetTop };
  }, [targetLine, targetTop]);

  // ── Estilos comuns Recharts ────────────────────────────────────────────────

  const fs  = (n: number) => Math.round(n * fontScale); // font scale helper
  const sc  = (n: number) => Math.round(n * fontScale); // space scale (px dimensions)

  // Y-axis width needs to accommodate the formatted tick labels.
  // BRL labels ("R$ 158.820,00") are wider than int/days/km labels.
  // We detect "R$" by sampling the first formatted value; otherwise use a narrower base.
  const yAxisWidthBase = (() => {
    const sample = metricFormat(999999);
    if (sample.startsWith("R$")) return 96;   // "R$ 999.999,00" ~14 chars
    if (sample.includes(" km")) return 84;    // "999.999 km"
    if (sample.includes(" dias")) return 78;  // "999 dias"
    if (sample.includes(" m³")) return 78;    // "999,99 m³"
    return 64;                                 // int: "999.999"
  })();
  const yAxisWidth = sc(yAxisWidthBase);

  const tickStyle = { fill: THEME.textMuted, fontSize: fs(11) };
  const axisLineStyle = { stroke: THEME.border };
  const yAxisLabelStyle = { fill: THEME.textMuted, fontSize: fs(11), fontWeight: 500 };

  const tooltipStyle = {
    contentStyle: {
      background: THEME.tooltipBg,
      border: `1px solid ${THEME.border}`,
      borderRadius: 8,
      color: THEME.textPrimary,
      fontSize: fs(12),
    },
    labelStyle: { color: THEME.textMuted, fontSize: fs(11), marginBottom: 4 },
    itemStyle: { color: THEME.textPrimary },
    cursor: { fill: "rgba(255,255,255,0.04)" },
  };

  // ── Formatters de tooltip ──────────────────────────────────────────────────

  const tooltipLabelFormatter = (label: any) => displayName(label);

  const tooltipFormatter: TooltipProps<any, any>["formatter"] = (value, name) => {
    if (isBarMulti) {
      const key = String(name ?? "");
      const s = barMultiSeries.find((x) => x.key === key);
      const label = s ? String(s.label ?? s.key) : key;
      return [metricFormat(safeNum(value)), label];
    }
    return [metricFormat(safeNum(value)), displayName(name) || "Valor"];
  };

  // ── Legend ─────────────────────────────────────────────────────────────────

  const LegendContent = useMemo(() => {
    return function LegendImpl(props: any) {
      const payload = Array.isArray(props?.payload) ? props.payload : [];
      const filtered = payload.filter(
        (item: any) => String(item?.value ?? "").toLowerCase() !== "value",
      );

      return (
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: 8, padding: "0 8px 4px" }}>
          {filtered.map((item: any) => {
            const dataKey = String(item?.dataKey ?? "");
            const rawValue = String(item?.value ?? "");
            const label = isBarMulti && dataKey
              ? (barMultiLabelByKey.get(dataKey) ?? rawValue)
              : displayName(rawValue);

            return (
              <div key={`${rawValue}-${dataKey}`} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: fs(11), color: THEME.textMuted }}>
                <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: item?.color ?? THEME.textMuted }} />
                <span title={label}>{truncateLegendLabel(label)}</span>
              </div>
            );
          })}

          {targetLine ? (
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: fs(11), color: THEME.textMuted, border: `1px solid ${THEME.border}`, borderRadius: 12, padding: "2px 8px" }}>
              <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, border: `2px dashed ${THEME.targetStroke}`, opacity: THEME.targetOpacity }} />
              <span style={{ fontWeight: 600 }}>{String(targetLine.label ?? "Meta")}</span>
            </div>
          ) : null}
        </div>
      );
    };
  }, [isBarMulti, barMultiLabelByKey, targetLine]);

  const renderLegend = () => {
    if (type === "bar") return <Legend content={LegendContent as any} />;
    if (type === "line") return (
      <Legend verticalAlign="top" align="center" height={26} wrapperStyle={{ fontSize: fs(11) }} content={LegendContent as any} />
    );
    return null;
  };

  // ── Container base ─────────────────────────────────────────────────────────

  const containerStyle: React.CSSProperties = {
    width: "100%",
    height,
  };

  if (loading) {
    return (
      <div style={{ ...containerStyle, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.03)", borderRadius: 8 }}>
        <div style={{ color: THEME.textMuted, fontSize: 13 }}>Carregando…</div>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div style={{ ...containerStyle, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.03)", borderRadius: 8 }}>
        <div style={{ color: THEME.textMuted, fontSize: 13 }}>Sem dados</div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={containerStyle} onMouseLeave={() => setActiveIndex(null)}>
      <ResponsiveContainer width="100%" height="100%">
        {type === "bar" ? (
          isBarMulti ? (
            // ── Bar duplo (dois eixos Y) ───────────────────────────────────
            <BarChart data={barMultiData} margin={{ top: 8, right: sc(40), left: sc(8), bottom: 8 }}>
              <CartesianGrid vertical={false} stroke={THEME.grid} />
              <XAxis dataKey="name" tick={tickStyle} axisLine={axisLineStyle} tickLine={false} />
              <YAxis yAxisId="left" orientation="left" width={yAxisWidth} tick={tickStyle} axisLine={axisLineStyle} tickLine={false} tickMargin={6}
                label={barMultiSeries[0]?.label ? { value: barMultiSeries[0].label, angle: -90, position: "insideLeft", offset: -16, style: yAxisLabelStyle } : undefined}
              />
              <YAxis yAxisId="right" orientation="right" width={yAxisWidth} tick={tickStyle} axisLine={axisLineStyle} tickLine={false} tickMargin={6}
                label={barMultiSeries[1]?.label ? { value: barMultiSeries[1].label, angle: 90, position: "insideRight", offset: -16, style: yAxisLabelStyle } : undefined}
              />
              <Tooltip formatter={tooltipFormatter} labelFormatter={tooltipLabelFormatter} {...tooltipStyle} />
              {renderLegend()}
              {barMultiSeries.map((s, i) => (
                <Bar key={s.key} dataKey={s.key} name={s.key} yAxisId={s.axis === "left" ? "left" : "right"}
                  fill={getColor(s.label, i)} radius={[6, 6, 0, 0]}
                />
              ))}
            </BarChart>
          ) : (
            // ── Bar simples ───────────────────────────────────────────────
            <BarChart
              data={(compareData ?? []).map((d) => ({ ...d, name: displayName(d.name), value: safeNum(d.value) }))}
              margin={{ top: 8, right: sc(16), left: sc(8), bottom: 8 }}
              onMouseMove={(st: any) => {
                if (typeof st?.activeTooltipIndex === "number") setActiveIndex(st.activeTooltipIndex);
              }}
            >
              <defs>
                <linearGradient id={`${gradId}-up`} x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0%" stopColor={THEME.targetStroke} stopOpacity="0.08" />
                  <stop offset="100%" stopColor={THEME.targetStroke} stopOpacity="0" />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke={THEME.grid} />
              <XAxis dataKey="name" tick={tickStyle} axisLine={axisLineStyle} tickLine={false} />
              <YAxis width={yAxisWidth} tick={tickStyle} axisLine={axisLineStyle} tickLine={false} tickMargin={6}
                tickFormatter={(v) => metricFormat(safeNum(v))}
                label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: "insideLeft", offset: -20, style: yAxisLabelStyle } : undefined}
                domain={targetLine && targetTop ? [0, targetTop] : undefined}
              />
              {shade && <ReferenceArea y1={shade.y1} y2={shade.y2} fill={`url(#${gradId}-up)`} ifOverflow="extendDomain" />}
              {targetLine && (
                <ReferenceLine y={targetLine.value} stroke={THEME.targetStroke} strokeOpacity={THEME.targetOpacity}
                  strokeWidth={2} strokeDasharray="6 4" ifOverflow="extendDomain"
                />
              )}
              <Tooltip formatter={tooltipFormatter} labelFormatter={tooltipLabelFormatter} {...tooltipStyle} />
              {renderLegend()}
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {(compareData ?? []).map((d, idx) => (
                  <PieCell
                    key={`${normKey(displayName(d.name))}--${idx}`}
                    fill={getColor(displayName(d.name), idx)}
                    opacity={activeIndex !== null && activeIndex !== idx ? 0.4 : 1}
                  />
                ))}
              </Bar>
            </BarChart>
          )
        ) : type === "donut" ? (
          // ── Donut ─────────────────────────────────────────────────────────
          <PieChart margin={{ top: 4, right: sc(100), left: 4, bottom: 4 }}>
            <Tooltip formatter={tooltipFormatter} labelFormatter={tooltipLabelFormatter} {...tooltipStyle} />
            <Legend
              layout="vertical" align="right" verticalAlign="middle"
              wrapperStyle={{ fontSize: fs(11), maxHeight: "100%", overflow: "auto" }}
              formatter={(value: any) => {
                const name = displayName(value);
                const found = donutData.find((d) => d.name === name);
                const v = found ? safeNum(found.value) : 0;
                const displayLabel = truncateLegendLabel(name);
                return (
                  <span title={name} style={{ color: THEME.textMuted }}>{`${displayLabel} — ${metricFormat(v)}`}</span>
                );
              }}
            />
            <Pie
              data={donutData}
              dataKey="value"
              nameKey="name"
              innerRadius="52%"
              outerRadius="78%"
              stroke="none"
              paddingAngle={2}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {donutData.map((d, idx) => (
                <PieCell
                  key={`${normKey(d.name)}--${idx}`}
                  fill={getColor(d.name, idx)}
                  opacity={activeIndex !== null && activeIndex !== idx ? 0.35 : 1}
                  onMouseEnter={() => setActiveIndex(idx)}
                />
              ))}
            </Pie>
          </PieChart>
        ) : (
          // ── Line ──────────────────────────────────────────────────────────
          <LineChart data={lineData} margin={{ top: 8, right: sc(16), left: sc(8), bottom: 8 }}>
            <defs>
              <linearGradient id={`${gradId}-up`} x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor={THEME.targetStroke} stopOpacity="0.08" />
                <stop offset="100%" stopColor={THEME.targetStroke} stopOpacity="0" />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke={THEME.grid} />
            <XAxis dataKey="x" tick={tickStyle} axisLine={axisLineStyle} tickLine={false} />
            <YAxis width={yAxisWidth} tick={tickStyle} axisLine={axisLineStyle} tickLine={false} tickMargin={6}
              tickFormatter={(v) => metricFormat(safeNum(v))}
              domain={targetLine && targetTop ? [0, targetTop] : undefined}
            />
            {shade && <ReferenceArea y1={shade.y1} y2={shade.y2} fill={`url(#${gradId}-up)`} ifOverflow="extendDomain" />}
            {targetLine && (
              <ReferenceLine y={targetLine.value} stroke={THEME.targetStroke} strokeOpacity={THEME.targetOpacity}
                strokeWidth={2} strokeDasharray="6 4" ifOverflow="extendDomain"
              />
            )}
            <Tooltip formatter={tooltipFormatter} labelFormatter={tooltipLabelFormatter} {...tooltipStyle} />
            {renderLegend()}
            {(series ?? []).map((s, idx) => (
              <Line
                key={`${normKey(s.name)}--${idx}`}
                type="monotone"
                dataKey={s.name}
                name={displayName(s.name)}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
                strokeWidth={2.5}
                stroke={getColor(s.name, idx)}
              />
            ))}
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
