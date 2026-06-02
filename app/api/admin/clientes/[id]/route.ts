import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-server";

const updateSchema = z.object({
  cnpj: z
    .string()
    .trim()
    .min(14, "CNPJ inválido")
    .transform((v) => v.replace(/\D/g, ""))
    .optional(),
  nome: z.string().trim().optional(),
  excluido: z.boolean().optional(),
  grupo: z.string().trim().nullable().optional(),
  motivo: z.string().trim().nullable().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const numId = parseInt(id);
  if (isNaN(numId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 }
    );
  }

  const data = parsed.data;

  if (data.cnpj) {
    const conflict = await prisma.clienteFiltro.findFirst({
      where: { cnpj: data.cnpj, NOT: { id: numId } },
    });
    if (conflict) {
      return NextResponse.json({ error: "CNPJ já utilizado por outro registro" }, { status: 409 });
    }
  }

  const cliente = await prisma.clienteFiltro.update({
    where: { id: numId },
    data,
  });

  return NextResponse.json({ cliente });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const numId = parseInt(id);
  if (isNaN(numId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  await prisma.clienteFiltro.delete({ where: { id: numId } });

  return NextResponse.json({ ok: true });
}
