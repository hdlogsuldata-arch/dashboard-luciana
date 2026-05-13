import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth-server"
import { CHART_REGISTRY, KPI_REGISTRY, DEFAULT_KPI_SLOTS } from "@/lib/charts/registry"
import { z } from "zod"

// Offsets por section para satisfazer @@unique([userId, position]) do schema
// sem colidir com slots da home (posições 1–4) nem entre sections
const SECTION_OFFSET: Record<string, number> = {
  financeiro: 100,
  operacional: 200,
  frota:       300,
}

const VALID_SECTIONS = ["financeiro", "operacional", "frota"] as const

const schema = z.object({
  section: z.enum(VALID_SECTIONS),
  selectedCharts: z.array(
    z.string().refine(
      id => CHART_REGISTRY.some(c => c.id === id),
      { message: "chartId inválido" }
    )
  ),
  kpiIds: z
    .array(
      z.string().refine(
        id => KPI_REGISTRY.some(k => k.id === id),
        { message: "kpiId inválido" }
      )
    )
    .max(KPI_REGISTRY.length)
    .refine(ids => new Set(ids).size === ids.length, { message: "kpiIds com duplicatas" }),
})

// ─── GET ─────────────────────────────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdmin(req)
  if (auth instanceof NextResponse) return auth

  const { searchParams } = new URL(req.url)
  const section = searchParams.get("section")

  if (!section || !(VALID_SECTIONS as readonly string[]).includes(section)) {
    return NextResponse.json({ error: "section inválida ou não informada" }, { status: 400 })
  }

  const userId = (await params).id

  const [charts, kpis] = await Promise.all([
    prisma.userChart.findMany({ where: { userId, section } }),
    prisma.userKpi.findMany({ where: { userId, section }, orderBy: { position: "asc" } }),
  ])

  const selectedCharts = charts.length > 0
    ? charts.map(c => c.chartId)
    : CHART_REGISTRY.filter(c => c.section === section).map(c => c.id)

  const kpiIds = kpis.length > 0
    ? kpis.map(k => k.kpiId)
    : DEFAULT_KPI_SLOTS
        .filter(s => KPI_REGISTRY.find(k => k.id === s.kpiId)?.section === section)
        .map(s => s.kpiId)

  return NextResponse.json({ section, selectedCharts, kpiIds })
}

// ─── PUT ─────────────────────────────────────────────────────────────────────

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdmin(req)
  if (auth instanceof NextResponse) return auth

  const body = await req.json()
  const result = schema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 })
  }

  const { section, selectedCharts, kpiIds } = result.data

  const chartsInvalidos = selectedCharts.filter(
    id => CHART_REGISTRY.find(c => c.id === id)?.section !== section
  )
  if (chartsInvalidos.length > 0) {
    return NextResponse.json(
      { error: `Charts não pertencem à aba ${section}: ${chartsInvalidos.join(", ")}` },
      { status: 400 }
    )
  }

  const kpisInvalidos = kpiIds.filter(
    id => KPI_REGISTRY.find(k => k.id === id)?.section !== section
  )
  if (kpisInvalidos.length > 0) {
    return NextResponse.json(
      { error: `KPIs não pertencem à aba ${section}: ${kpisInvalidos.join(", ")}` },
      { status: 400 }
    )
  }

  const userId = (await params).id

  const usuario = await prisma.user.findUnique({ where: { id: userId } })
  if (!usuario) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
  }

  const offset = SECTION_OFFSET[section]

  await prisma.$transaction([
    prisma.userChart.deleteMany({ where: { userId, section } }),
    prisma.userKpi.deleteMany({ where: { userId, section } }),
    prisma.userChart.createMany({
      data: selectedCharts.map(chartId => ({ userId, section, chartId })),
    }),
    prisma.userKpi.createMany({
      data: kpiIds.map((kpiId, i) => ({ userId, section, kpiId, position: offset + i })),
    }),
  ])

  return NextResponse.json({ ok: true })
}

// ─── DELETE ──────────────────────────────────────────────────────────────────

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdmin(req)
  if (auth instanceof NextResponse) return auth

  const { searchParams } = new URL(req.url)
  const section = searchParams.get("section")

  if (!section || !(VALID_SECTIONS as readonly string[]).includes(section)) {
    return NextResponse.json({ error: "section inválida ou não informada" }, { status: 400 })
  }

  const userId = (await params).id

  const usuario = await prisma.user.findUnique({ where: { id: userId } })
  if (!usuario) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
  }

  await prisma.$transaction([
    prisma.userChart.deleteMany({ where: { userId, section } }),
    prisma.userKpi.deleteMany({ where: { userId, section } }),
  ])

  return NextResponse.json({ ok: true })
}
