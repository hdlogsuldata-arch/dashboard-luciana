import type { ChartType } from "../chartTypes";
import type { MetricUnit } from "../formatter";

export type { ChartType };

export type ChartSection = "financeiro" | "operacional" | "frota";

export type ChartMetadata = {
  id: string;
  title: string;
  section: ChartSection;
  defaultType: ChartType;
  /** Tipos que o toggle exibe. "line" aparece disabled quando há menos de 2 meses de dados. */
  supportedTypes: ChartType[];
  /** Nome do CSV de origem (sem extensão) */
  dataSource: string;
  /** Rota de API que serve os dados deste gráfico */
  apiEndpoint: string;
  /** Formato dos valores nos eixos, tooltip e legenda */
  metricFormat: MetricUnit;
  description?: string;
};

export type KpiMetadata = {
  id: string;
  title: string;
  section: ChartSection;
  format: MetricUnit;
  /** Qual rota de API retorna o valor deste KPI */
  apiSource: ChartSection;
  /** Descrição exibida como tooltip no painel admin */
  description: string;
  /** Cor do valor exibido no KpiCard */
  accentColor: string;
};
