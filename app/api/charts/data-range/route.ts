import { NextResponse } from "next/server";
import { getGlobalDateRange } from "@/lib/data/ssw";

// Cache de 1h — o range global muda raramente (só quando ETL roda).
export const revalidate = 3600;

export async function GET() {
  const { earliest, latest } = await getGlobalDateRange();
  return NextResponse.json({
    earliest: earliest ? earliest.toISOString() : null,
    latest: latest ? latest.toISOString() : null,
  });
}
