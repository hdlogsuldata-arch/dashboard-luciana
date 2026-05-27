/**
 * Range de datas — contrato canônico de filtragem temporal do dashboard.
 *
 * Substitui o antigo filtro mensal (`ref: "YYYY-MM"`). O dashboard inteiro
 * passa a operar sobre um intervalo `[startDate, endDate]` em America/Sao_Paulo,
 * com a preferência guardada via querystring (?start=&end=&preset=) e
 * sessionStorage como fallback de navegação interna.
 */

export type DatePreset =
  | "today"
  | "last7"
  | "last30"
  | "thisMonth"
  | "lastMonth"
  | "last3Months"
  | "thisYear"
  | "all"
  | "custom";

export type DateRange = {
  startDate: Date;
  endDate: Date;
  preset: DatePreset;
};

export const PRESET_LABELS: Record<DatePreset, string> = {
  today: "Hoje",
  last7: "Últimos 7 dias",
  last30: "Últimos 30 dias",
  thisMonth: "Este mês",
  lastMonth: "Mês passado",
  last3Months: "Últimos 3 meses",
  thisYear: "Este ano",
  all: "Tudo",
  custom: "Personalizado",
};

export const PRESET_ORDER: DatePreset[] = [
  "today",
  "last7",
  "last30",
  "thisMonth",
  "lastMonth",
  "last3Months",
  "thisYear",
  "all",
];

const ALL_START = new Date(2000, 0, 1, 0, 0, 0, 0);

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

/** Resolve um preset em um DateRange concreto baseado em "agora". */
export function resolvePreset(preset: DatePreset, now: Date = new Date()): DateRange {
  const end = endOfDay(now);
  switch (preset) {
    case "today":
      return { preset, startDate: startOfDay(now), endDate: end };
    case "last7": {
      const start = startOfDay(now);
      start.setDate(start.getDate() - 6);
      return { preset, startDate: start, endDate: end };
    }
    case "last30": {
      const start = startOfDay(now);
      start.setDate(start.getDate() - 29);
      return { preset, startDate: start, endDate: end };
    }
    case "thisMonth": {
      const start = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
      return { preset, startDate: start, endDate: end };
    }
    case "lastMonth": {
      const start = startOfDay(new Date(now.getFullYear(), now.getMonth() - 1, 1));
      const last = endOfDay(new Date(now.getFullYear(), now.getMonth(), 0));
      return { preset, startDate: start, endDate: last };
    }
    case "last3Months": {
      const start = startOfDay(now);
      start.setMonth(start.getMonth() - 3);
      return { preset, startDate: start, endDate: end };
    }
    case "thisYear": {
      const start = startOfDay(new Date(now.getFullYear(), 0, 1));
      return { preset, startDate: start, endDate: end };
    }
    case "all":
      return { preset, startDate: ALL_START, endDate: end };
    case "custom":
      // custom sem dados explícitos → cai pra last30
      return resolvePreset("last30", now);
  }
}

/** Range customizado a partir de duas datas (interpretadas como dia local BRT). */
export function customRange(start: Date, end: Date): DateRange {
  return {
    preset: "custom",
    startDate: startOfDay(start),
    endDate: endOfDay(end),
  };
}

/** YYYY-MM-DD em horário local (usa para passar pra API e SQL). */
export function toIsoDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** Parse de "YYYY-MM-DD" para Date local (sem timezone surprises). */
export function fromIsoDate(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Serializa um range para querystring (?start=&end=&preset=). */
export function rangeToQuery(r: DateRange): string {
  const p = new URLSearchParams();
  p.set("start", toIsoDate(r.startDate));
  p.set("end", toIsoDate(r.endDate));
  p.set("preset", r.preset);
  return p.toString();
}

/** Reconstrói um range a partir de URLSearchParams (null se faltar dados). */
export function rangeFromQuery(
  params: URLSearchParams | { get(key: string): string | null },
): DateRange | null {
  const start = params.get("start");
  const end = params.get("end");
  if (!start || !end) return null;
  const sd = fromIsoDate(start);
  const ed = fromIsoDate(end);
  if (!sd || !ed) return null;
  const presetRaw = params.get("preset") ?? "custom";
  const preset = (PRESET_ORDER as string[]).includes(presetRaw) || presetRaw === "custom"
    ? (presetRaw as DatePreset)
    : "custom";
  return {
    preset,
    startDate: startOfDay(sd),
    endDate: endOfDay(ed),
  };
}

/** Label legível em pt-BR ("Últimos 30 dias" ou "01/04/2026 — 30/04/2026"). */
export function formatDateRangeLabel(r: DateRange): string {
  if (r.preset !== "custom") return PRESET_LABELS[r.preset];
  const fmt = (d: Date) =>
    d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  if (toIsoDate(r.startDate) === toIsoDate(r.endDate)) return fmt(r.startDate);
  return `${fmt(r.startDate)} — ${fmt(r.endDate)}`;
}

/** Default usado quando não há nenhuma preferência salva. */
export function defaultRange(now: Date = new Date()): DateRange {
  return resolvePreset("last30", now);
}

/**
 * Resolve um DateRange a partir dos searchParams de uma request da API.
 * Precedência:
 *   1. ?start=&end= (novo)
 *   2. ?ref=YYYY-MM (legado, expande para mês inteiro)
 *   3. defaultRange() (últimos 30 dias)
 */
export function rangeFromRequest(
  params: URLSearchParams | { get(key: string): string | null },
): DateRange {
  const fromQuery = rangeFromQuery(params);
  if (fromQuery) return fromQuery;
  const ref = params.get("ref");
  if (ref) {
    const legacy = rangeFromLegacyRef(ref);
    if (legacy) return legacy;
  }
  return defaultRange();
}

/** Converte ?ref=YYYY-MM (legado) em range do mês inteiro. Retorna null se inválido. */
export function rangeFromLegacyRef(ref: string): DateRange | null {
  const m = /^(\d{4})-(\d{2})$/.exec(ref.trim());
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  if (month < 1 || month > 12) return null;
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0); // último dia
  return {
    preset: "custom",
    startDate: startOfDay(start),
    endDate: endOfDay(end),
  };
}
