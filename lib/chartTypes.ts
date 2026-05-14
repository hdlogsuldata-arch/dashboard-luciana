// Tipos centrais para o sistema de gráficos do dashboard HDLOG
// Adaptado do dash-mkt (adicionado "donut" como ChartType)
import React from "react";
import type { MetricUnit } from "./formatter";
export type { MetricUnit };

export type ChartType = "bar" | "donut" | "line";
export type BarMultiAxis = "left" | "right";

export type BarMultiSeries = {
  key: string;
  label: string;
  axis: BarMultiAxis;
  unit: MetricUnit;
  format?: (n: number) => string;
};

export type TargetLine = {
  value: number;
  label: string;
  yAxisId?: BarMultiAxis;
  op?: "=" | ">=" | "<=";
};

export type ChartCompareDatum = { name: string; value: number };

export type ChartSeries = {
  name: string;
  points: Array<{ x: string; y: number }>;
};

export type ChartRendererProps = {
  type: ChartType;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  metricFormat: (n: number) => string;
  compareData: ChartCompareDatum[];
  series: ChartSeries[];
  barMulti?: {
    data: Array<Record<string, any>>;
    series: BarMultiSeries[];
  };
  yAxisLabel?: string;
  targetLine?: TargetLine;
  loading?: boolean;
  height?: number | string; // número em px ou "100%" para fullscreen
  fontScale?: number;       // 1 = padrão, >1 = maior (ex: 1.5 para TV)
};
