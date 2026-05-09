import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_KPI_SLOTS } from "@/lib/charts/registry";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const slots = await prisma.userKpi.findMany({
    where: { userId: auth.sub },
    orderBy: { position: "asc" },
    select: { position: true, kpiId: true },
  });

  // If user has no custom config, return defaults
  const result = slots.length > 0 ? slots : DEFAULT_KPI_SLOTS;

  return NextResponse.json({ slots: result });
}
