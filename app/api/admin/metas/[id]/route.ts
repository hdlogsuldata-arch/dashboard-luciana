import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-server";

const META_SELECT = {
  id: true,
  titulo: true,
  chartId: true,
  op: true,
  targetValue: true,
  deadline: true,
  status: true,
  ownerEmail: true,
  owner: { select: { name: true, email: true } },
  createdAt: true,
} as const;

const updateSchema = z.object({
  titulo: z.string().trim().min(1, "Título obrigatório"),
  chartId: z.string().min(1, "Gráfico obrigatório"),
  op: z.enum([">=", "<="]).default(">="),
  targetValue: z.number({ error: "Valor alvo inválido" }),
  deadline: z.string().min(1, "Prazo obrigatório"),
  status: z.enum(["NO_PRAZO", "EM_RISCO", "ATRASADA", "ALCANCADA"]),
  ownerEmail: z.string().email("E-mail do responsável inválido"),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  const existing = await prisma.meta.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Meta não encontrada" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 }
    );
  }

  const { titulo, chartId, op, targetValue, deadline, status, ownerEmail } = parsed.data;

  const owner = await prisma.user.findUnique({ where: { email: ownerEmail } });
  if (!owner) {
    return NextResponse.json({ error: "Responsável não encontrado no sistema" }, { status: 404 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const meta = await prisma.meta.update({
    where: { id },
    data: { titulo, chartId, op, targetValue, deadline: new Date(deadline), status: status as any, ownerEmail },
    select: META_SELECT,
  });

  return NextResponse.json({ meta });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  const existing = await prisma.meta.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Meta não encontrada" }, { status: 404 });
  }

  await prisma.meta.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
