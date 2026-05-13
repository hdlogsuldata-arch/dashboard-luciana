import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-server";
import { KPI_REGISTRY } from "@/lib/charts/registry";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const section = req.nextUrl.searchParams.get("section");

  let whereKpiIds: string[] | undefined;
  if (section) {
    whereKpiIds = KPI_REGISTRY.filter((k) => k.section === section).map((k) => k.id);
    if (!whereKpiIds.length) return NextResponse.json({ metas: [] });
  }

  const metas = await prisma.meta.findMany({
    where: whereKpiIds ? { kpiId: { in: whereKpiIds } } : undefined,
    select: {
      id: true,
      titulo: true,
      kpiId: true,
      targetValue: true,
      deadline: true,
      status: true,
    },
    orderBy: { deadline: "asc" },
  });

  return NextResponse.json({ metas });
}
