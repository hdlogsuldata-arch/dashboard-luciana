import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { normalizeCnpj } from "@/lib/data/cnpjFormat";

const SELECT = {
  cnpj: true,
  nomeEmpresa: true,
  notas: true,
  criadoPor: true,
  criadoEm: true,
  atualizadoEm: true,
} as const;

const updateSchema = z.object({
  nomeEmpresa: z.string().trim().min(1, "Nome da empresa obrigatório"),
  notas: z.string().trim().optional().or(z.literal("")),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ cnpj: string }> }
) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const { cnpj: rawCnpj } = await params;
  const cnpj = normalizeCnpj(rawCnpj);

  const existing = await prisma.cnpjExcluido.findUnique({ where: { cnpj } });
  if (!existing) {
    return NextResponse.json({ error: "CNPJ não encontrado" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 }
    );
  }

  const item = await prisma.cnpjExcluido.update({
    where: { cnpj },
    data: {
      nomeEmpresa: parsed.data.nomeEmpresa,
      notas: parsed.data.notas || null,
    },
    select: SELECT,
  });

  return NextResponse.json({ item });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ cnpj: string }> }
) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const { cnpj: rawCnpj } = await params;
  const cnpj = normalizeCnpj(rawCnpj);

  const existing = await prisma.cnpjExcluido.findUnique({ where: { cnpj } });
  if (!existing) {
    return NextResponse.json({ error: "CNPJ não encontrado" }, { status: 404 });
  }

  await prisma.cnpjExcluido.delete({ where: { cnpj } });

  return NextResponse.json({ ok: true });
}
