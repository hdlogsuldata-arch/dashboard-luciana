import { NextRequest, NextResponse } from "next/server";
import { getGlobalDateRange } from "@/lib/data/ssw";
import { requireAuth } from "@/lib/auth-server";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { earliest, latest } = await getGlobalDateRange();
  return NextResponse.json({
    earliest: earliest ? earliest.toISOString() : null,
    latest: latest ? latest.toISOString() : null,
  });
}
