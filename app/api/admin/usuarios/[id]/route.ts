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

const updateSchema = z.object({
  name: z.string().trim().min(1, "Nome obrigatório"),
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  funcao: z.enum(["Administrador", "Gerente", "Analista", "Operador", "Visualizador"]),
  password: z.string().min(6, "Mínimo 6 caracteres").optional().or(z.literal("")),
  allowedDashboards: z.array(z.string()).min(1, "Selecione ao menos um dashboard"),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  const body = await req.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 }
    );
  }

  const { name, email, funcao, password, allowedDashboards } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }

  const emailConflict = await prisma.user.findFirst({
    where: { email, NOT: { id } },
  });
  if (emailConflict) {
    return NextResponse.json({ error: "E-mail já em uso por outro usuário" }, { status: 409 });
  }

  // Prevent demoting yourself from ADMIN
  if (id === auth.sub && funcao !== "Administrador") {
    return NextResponse.json(
      { error: "Você não pode remover seus próprios privilégios de administrador" },
      { status: 400 }
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const role = FUNCAO_TO_ROLE[funcao] as any;

  const updateData: Record<string, unknown> = {
    name,
    email,
    funcao,
    role,
    allowedDashboards,
  };

  if (password) {
    updateData.passwordHash = await hash(password, 10);
  }

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
    select: USER_SELECT,
  });

  return NextResponse.json({ user });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  if (id === auth.sub) {
    return NextResponse.json(
      { error: "Você não pode excluir sua própria conta" },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }

  await prisma.user.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
