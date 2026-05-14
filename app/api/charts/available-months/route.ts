import { NextResponse } from "next/server";
import { listAvailableMonths } from "@/lib/data/csvParser";

// Mês de referência atual — representa os dados na pasta "data/" (fallback)
const CURRENT_MONTH = process.env.CURRENT_REFERENCE_MONTH ?? "2026-04";

export async function GET() {
  const months = listAvailableMonths();

  // Always include the current month (backed by data/ fallback folder)
  if (!months.includes(CURRENT_MONTH)) {
    months.unshift(CURRENT_MONTH);
  }

  return NextResponse.json({ months, current: CURRENT_MONTH });
}
