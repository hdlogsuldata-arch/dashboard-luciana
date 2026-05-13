import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-server"
import { prisma } from "@/lib/prisma"
import { CHART_REGISTRY, KPI_REGISTRY } from "@/lib/charts/registry"

const VALID_SECTIONS = ["financeiro", "operacional", "frota"] as const

export async function GET(req: NextRequest) {
  const auth = requireAuth(req)
  if (auth instanceof NextResponse) return auth

  const section = req.nextUrl.searchParams.get("section")
  if (!section || !(VALID_SECTIONS as readonly string[]).includes(section)) {
    return NextResponse.json({ error: "section inválida ou não informada" }, { status: 400 })
  }

  const userId = auth.sub

  const [charts, kpis] = await Promise.all([
    prisma.userChart.findMany({ where: { userId, section } }),
    prisma.userKpi.findMany({ where: { userId, section }, orderBy: { position: "asc" } }),
  ])

  const chartIds = charts.length > 0
    ? charts.map(c => c.chartId)
    : CHART_REGISTRY.filter(c => c.section === section).map(c => c.id)

  const kpiIds = kpis.length > 0
    ? kpis.map(k => k.kpiId)
    : KPI_REGISTRY.filter(k => k.section === section).map(k => k.id)

  return NextResponse.json({ section, chartIds, kpiIds })
}
