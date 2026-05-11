/**
 * CSV Parser — HDLOG Dashboard
 *
 * Lida com dois formatos de CSV gerados pelo sistema INEA:
 *
 * Formato INEA (caixa_240, cliente_017, cliente_203, tabelas_245):
 *   Linha 0: metadata (nome do relatório, data, hora)
 *   Linha 1: prefixada com "1;" — nomes das colunas
 *   Linhas 2+: prefixadas com "2;" — dados
 *
 * Formato padrão (caixa_202, ctrc_231):
 *   Linha 0: cabeçalho direto (sem prefixo)
 *   Linhas 1+: dados
 *
 * Encoding: latin1 (ISO-8859-1) — obrigatório para caracteres portugueses
 * Separador: ponto-e-vírgula (;)
 * Decimais: vírgula (ex: "1.234,56" → 1234.56)
 */

import fs from "fs";
import path from "path";

// Raiz do diretório de dados — subpastas por mês (YYYY-MM) ou "data" como fallback
const DATA_ROOT = process.env.CSV_DATA_DIR
  ? path.resolve(process.env.CSV_DATA_DIR, "..")   // se CSV_DATA_DIR aponta para /data, sobe um nível
  : path.resolve(process.cwd(), "data_csv");

// Pasta fallback (dados "atuais" sem organização por mês)
const CSV_DATA_DIR = path.join(DATA_ROOT, "data");

/** Resolve o diretório de CSVs para um mês de referência (YYYY-MM).
 *  Se a pasta do mês não existe, cai no diretório "data" padrão.
 */
export function resolveDataDir(ref?: string): string {
  if (!ref) return CSV_DATA_DIR;
  const monthDir = path.join(DATA_ROOT, ref);
  try {
    if (fs.statSync(monthDir).isDirectory()) return monthDir;
  } catch {}
  return CSV_DATA_DIR;
}

/** Lista os meses disponíveis em data_csv/ (subpastas no formato YYYY-MM) */
export function listAvailableMonths(): string[] {
  try {
    const entries = fs.readdirSync(DATA_ROOT, { withFileTypes: true });
    const months = entries
      .filter((e) => e.isDirectory() && /^\d{4}-\d{2}$/.test(e.name))
      .map((e) => e.name)
      .sort()
      .reverse(); // mais recente primeiro
    return months;
  } catch {
    return [];
  }
}

export type ParsedCsv = {
  headers: string[];
  rows: Record<string, string>[];
};

function splitLine(line: string): string[] {
  return line.split(";").map((v) => {
    const t = v.trim();
    // Remove aspas duplas que envolvem o campo inteiro (ex: "A2" → A2)
    if (t.startsWith('"') && t.endsWith('"') && t.length >= 2) {
      return t.slice(1, -1).trim();
    }
    return t;
  });
}

function cleanHeader(h: string): string {
  return h
    .replace(/\uFFFD/g, "")
    .replace(/\uFEFF/g, "")
    .trim();
}

/** Detecta se o arquivo usa o formato INEA (primeira linha começa com dígito + ";") */
function isIneaFormat(firstLine: string): boolean {
  return /^\d;/.test(firstLine.trim());
}

/** Lê e faz parse de um CSV do diretório de dados.
 *  Se `ref` for fornecido (ex: "2026-04"), tenta a pasta desse mês primeiro.
 */
export function readCsvAuto(filename: string, ref?: string): ParsedCsv {
  const dir = resolveDataDir(ref);
  const filePath = path.join(dir, filename);
  const raw = fs.readFileSync(filePath, "latin1");
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter((l) => l.trim().length > 0);

  if (lines.length === 0) return { headers: [], rows: [] };

  if (isIneaFormat(lines[0])) {
    return parseIneaFormat(lines);
  }
  return parseStandardFormat(lines);
}

/** Formato INEA: linha 1 com "1;col1;col2...", linhas de dados com "2;val1;val2..." */
function parseIneaFormat(lines: string[]): ParsedCsv {
  const headerLine = lines.find((l) => l.startsWith("1;"));
  const dataLines = lines.filter((l) => l.startsWith("2;"));

  if (!headerLine) return { headers: [], rows: [] };

  // Remove o prefixo "1;"
  const headers = splitLine(headerLine.slice(2)).map(cleanHeader);

  const rows = dataLines.map((line) => {
    const values = splitLine(line.slice(2)); // Remove "2;"
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = (values[i] ?? "").replace(/\uFFFD/g, "").trim();
    });
    return row;
  });

  return { headers, rows };
}

/** Formato padrão: primeira linha é o cabeçalho, resto são dados */
function parseStandardFormat(lines: string[]): ParsedCsv {
  const headers = splitLine(lines[0]).map(cleanHeader);
  const rows = lines.slice(1).map((line) => {
    const values = splitLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = (values[i] ?? "").replace(/\uFFFD/g, "").trim();
    });
    return row;
  });
  return { headers, rows };
}

// ---------------------------------------------------------------------------
// Helpers de conversão de tipos
// ---------------------------------------------------------------------------

/** "1.234,56" → 1234.56 */
export function parseBRL(s: string): number {
  if (!s) return 0;
  const cleaned = s.replace(/\./g, "").replace(",", ".");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

/** "127" ou "127,00" → 127 */
export function parseIntBR(s: string): number {
  return Math.round(parseBRL(s));
}

/** "22/04/26" ou "22/04/2026" → Date (ou null se inválida) */
export function parseDateBR(s: string): Date | null {
  if (!s) return null;
  const parts = s.split("/");
  if (parts.length !== 3) return null;
  const [day, month, yearRaw] = parts;
  const year = yearRaw.length === 2 ? `20${yearRaw}` : yearRaw;
  const d = new Date(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`);
  return isNaN(d.getTime()) ? null : d;
}

/** Retorna o DATA_ROOT atual (útil para debug) */
export function getCsvDir(): string {
  return DATA_ROOT;
}
