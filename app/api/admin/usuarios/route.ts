import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-server";
import { FUNCAO_TO_ROLE } from "@/lib/roles";

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  funcao: true,
  allowedDashboards: true,
  createdAt: true,
  lastLoginAt: true,
  mustChangePassword: true,
  image: true,
} as const;

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const users = await prisma.user.findMany({
    select: USER_SELECT,
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ users });
}

const createSchema = z.object({
  name: z.string().trim().min(1, "Nome obrigatório"),
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  funcao: z.enum(["Administrador", "Gerente", "Analista", "Operador", "Visualizador"]),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  allowedDashboards: z.array(z.string()).min(1, "Selecione ao menos um dashboard"),
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

  const { name, email, funcao, password, allowedDashboards } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "E-mail já cadastrado" }, { status: 409 });
  }

  const passwordHash = await hash(password, 10);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const role = FUNCAO_TO_ROLE[funcao] as any;

  const user = await prisma.user.create({
    data: { name, email, passwordHash, role, funcao, allowedDashboards },
    select: USER_SELECT,
  });

  return NextResponse.json({ user }, { status: 201 });
}
