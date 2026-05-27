/**
 * CSV Parser — usado apenas pelo script de seed (`scripts/seed-ssw-from-csv.ts`).
 *
 * Os dados em runtime vêm de `ssw_extractions` no Neon (lib/data/ssw.ts);
 * os CSVs em `data_csv/data/` servem como seed local pra dev sem ETL.
 *
 * Lida com dois formatos gerados pelo sistema INEA:
 *   - Formato INEA: linha "1;col1;col2..." (headers), linhas "2;val1;val2..." (dados)
 *   - Formato padrão: primeira linha é cabeçalho, resto são dados
 *
 * Encoding: latin1 (ISO-8859-1) — obrigatório para caracteres portugueses
 * Separador: ponto-e-vírgula (;)
 * Decimais: vírgula (ex: "1.234,56" → 1234.56)
 */

import fs from "fs";
import path from "path";

const CSV_DATA_DIR =
  process.env.CSV_DATA_DIR ?? path.join(process.cwd(), "data_csv", "data");

export type ParsedCsv = {
  headers: string[];
  rows: Record<string, string>[];
};

function splitLine(line: string): string[] {
  return line.split(";").map((v) => {
    const t = v.trim();
    if (t.startsWith('"') && t.endsWith('"') && t.length >= 2) {
      return t.slice(1, -1).trim();
    }
    return t;
  });
}

function cleanHeader(h: string): string {
  return h.replace(/�/g, "").replace(/﻿/g, "").trim();
}

function isIneaFormat(firstLine: string): boolean {
  return /^\d;/.test(firstLine.trim());
}

export function readCsvAuto(filename: string): ParsedCsv {
  const filePath = path.join(CSV_DATA_DIR, filename);
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

function parseIneaFormat(lines: string[]): ParsedCsv {
  const headerLine = lines.find((l) => l.startsWith("1;"));
  const dataLines = lines.filter((l) => l.startsWith("2;"));

  if (!headerLine) return { headers: [], rows: [] };

  const headers = splitLine(headerLine.slice(2)).map(cleanHeader);

  const rows = dataLines.map((line) => {
    const values = splitLine(line.slice(2));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = (values[i] ?? "").replace(/�/g, "").trim();
    });
    return row;
  });

  return { headers, rows };
}

function parseStandardFormat(lines: string[]): ParsedCsv {
  const headers = splitLine(lines[0]).map(cleanHeader);
  const rows = lines.slice(1).map((line) => {
    const values = splitLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = (values[i] ?? "").replace(/�/g, "").trim();
    });
    return row;
  });
  return { headers, rows };
}

// ---------------------------------------------------------------------------
// Helpers de conversão de tipos (re-exportados pelos parsers que rodam sobre
// os payloads do ssw_extractions — mesmo formato de strings BR)
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
