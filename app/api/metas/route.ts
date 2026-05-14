import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-server";
import { CHART_REGISTRY } from "@/lib/charts/registry";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const section = req.nextUrl.searchParams.get("section");

  let whereChartIds: string[] | undefined;
  if (section) {
    whereChartIds = CHART_REGISTRY.filter((c) => c.section === section).map((c) => c.id);
    if (!whereChartIds.length) return NextResponse.json({ metas: [] });
  }

  const metas = await prisma.meta.findMany({
    where: whereChartIds ? { chartId: { in: whereChartIds } } : undefined,
    select: {
      id: true,
      titulo: true,
      chartId: true,
      op: true,
      targetValue: true,
      deadline: true,
      status: true,
    },
    orderBy: { deadline: "asc" },
  });

  return NextResponse.json({ metas });
}
