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

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const items = await prisma.cnpjExcluido.findMany({
    select: SELECT,
    orderBy: { nomeEmpresa: "asc" },
  });

  return NextResponse.json({ items });
}

const createSchema = z.object({
  cnpj: z.string().min(1, "CNPJ obrigatório"),
  nomeEmpresa: z.string().trim().min(1, "Nome da empresa obrigatório"),
  notas: z.string().trim().optional().or(z.literal("")),
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

  const cnpj = normalizeCnpj(parsed.data.cnpj);
  if (cnpj.length !== 14) {
    return NextResponse.json({ error: "CNPJ deve ter 14 dígitos" }, { status: 400 });
  }

  const existing = await prisma.cnpjExcluido.findUnique({ where: { cnpj } });
  if (existing) {
    return NextResponse.json({ error: "CNPJ já cadastrado" }, { status: 409 });
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.sub },
    select: { email: true },
  });

  const item = await prisma.cnpjExcluido.create({
    data: {
      cnpj,
      nomeEmpresa: parsed.data.nomeEmpresa,
      notas: parsed.data.notas || null,
      criadoPor: user?.email ?? auth.sub,
    },
    select: SELECT,
  });

  return NextResponse.json({ item }, { status: 201 });
}
