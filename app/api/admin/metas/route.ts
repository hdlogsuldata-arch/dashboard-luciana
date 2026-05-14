import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-server";

const META_SELECT = {
  id: true,
  titulo: true,
  kpiId: true,
  targetValue: true,
  deadline: true,
  status: true,
  ownerEmail: true,
  owner: { select: { name: true, email: true } },
  createdAt: true,
} as const;

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const metas = await prisma.meta.findMany({
    select: META_SELECT,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ metas });
}

const createSchema = z.object({
  titulo: z.string().trim().min(1, "Título obrigatório"),
  kpiId: z.string().min(1, "KPI obrigatório"),
  targetValue: z.number({ error: "Valor alvo inválido" }),
  deadline: z.string().min(1, "Prazo obrigatório"),
  status: z.enum(["NO_PRAZO", "EM_RISCO", "ATRASADA", "ALCANCADA"]).default("NO_PRAZO"),
  ownerEmail: z.string().email("E-mail do responsável inválido"),
});

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const body = await req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 }
    );
  }

  const { titulo, kpiId, targetValue, deadline, status, ownerEmail } = parsed.data;

  const owner = await prisma.user.findUnique({ where: { email: ownerEmail } });
  if (!owner) {
    return NextResponse.json({ error: "Responsável não encontrado no sistema" }, { status: 404 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const meta = await prisma.meta.create({
    data: { titulo, kpiId, targetValue, deadline: new Date(deadline), status: status as any, ownerEmail },
    select: META_SELECT,
  });

  return NextResponse.json({ meta }, { status: 201 });
}
