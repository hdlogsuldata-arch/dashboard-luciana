// Sistema de resolução de cores para gráficos — HDLOG
// Adaptado do dash-mkt. Paleta ajustada para identidade visual HDLOG.

// Paleta principal (ordem de prioridade de uso)
export const FALLBACK_PALETTE = [
  "#F3DE3D", // amarelo brand (HDLOG)
  "#3B82F6", // azul info
  "#10B981", // verde success
  "#EF4444", // vermelho error
  "#8B5CF6", // roxo
  "#F59E0B", // âmbar
  "#06B6D4", // ciano
  "#EC4899", // rosa
  "#14B8A6", // teal
  "#F97316", // laranja
];

// Cores semânticas fixas para categorias conhecidas
export const SEMANTIC_COLORS: Record<string, string> = {
  // ABC Classification
  a1: "#10B981",
  a2: "#34D399",
  b: "#F3DE3D",
  b2: "#FDE68A",
  c: "#F59E0B",
  c2: "#FCA5A5",

  // Status de pagamento
  pago: "#10B981",
  pendente: "#F3DE3D",
  atrasado: "#EF4444",
  vencido: "#EF4444",

  // On-time delivery
  "no prazo": "#10B981",
  antecipado: "#3B82F6",
  atrasada: "#EF4444",

  // Tipo de frota
  frota: "#3B82F6",
  agregado: "#06B6D4",
  carreteiro: "#8B5CF6",

  // Combustível
  diesel: "#F59E0B",
  gasolina: "#10B981",
  gnv: "#3B82F6",

  // CIF/FOB
  cif: "#3B82F6",
  fob: "#F3DE3D",

  // Aging de inadimplência (do mais novo ao mais velho)
  "1-30 dias": "#10B981",
  "31-60 dias": "#F3DE3D",
  "61-90 dias": "#F59E0B",
  "91-180 dias": "#EF4444",
  "> 180 dias": "#7F1D1D",
};

export function normKey(s: string) {
  return String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/** Resolve cor por nome — verifica semânticas primeiro, depois usa paleta por índice */
export function resolveColor(name: string, index: number): string {
  const key = normKey(name);
  if (SEMANTIC_COLORS[key]) return SEMANTIC_COLORS[key];
  return FALLBACK_PALETTE[index % FALLBACK_PALETTE.length];
}

export function fallbackHex(i: number): string {
  return FALLBACK_PALETTE[i % FALLBACK_PALETTE.length];
}
