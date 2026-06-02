import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-server";

const createSchema = z.object({
  cnpj: z
    .string()
    .trim()
    .min(14, "CNPJ inválido")
    .transform((v) => v.replace(/\D/g, "")),
  nome: z.string().trim().optional(),
  excluido: z.boolean().optional().default(false),
  grupo: z.string().trim().optional(),
  motivo: z.string().trim().optional(),
});

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const clientes = await prisma.clienteFiltro.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ clientes });
}

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

  const { cnpj, nome, excluido, grupo, motivo } = parsed.data;

  const existing = await prisma.clienteFiltro.findUnique({ where: { cnpj } });
  if (existing) {
    return NextResponse.json({ error: "CNPJ já cadastrado" }, { status: 409 });
  }

  const cliente = await prisma.clienteFiltro.create({
    data: { cnpj, nome, excluido: excluido ?? false, grupo, motivo },
  });

  return NextResponse.json({ cliente }, { status: 201 });
}
