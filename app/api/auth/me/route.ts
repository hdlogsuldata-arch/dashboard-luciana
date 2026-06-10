import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_in_prod";

function extractToken(authHeader?: string | null): string | null {
  if (!authHeader) return null;
  const match = /^Bearer\s+(.+)$/i.exec(authHeader.trim());
  return match?.[1] || null;
}

function verifyToken(token: string): { sub: string; role: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { sub: string; role: string };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const token =
      extractToken(req.headers.get("authorization")) ||
      req.cookies.get("dl_token")?.value ||
      null;

    if (!token) {
      return NextResponse.json({ error: "Token ausente" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded?.sub) {
      return NextResponse.json({ error: "Token inválido ou expirado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        allowedDashboards: true,
        createdAt: true,
        image: true,
        mustChangePassword: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    // Re-assina com allowedDashboards FRESCO do banco — assim, toda vez que o
    // client carrega a app (AuthContext chama /api/auth/me), o cookie é
    // renovado com as permissões atuais (o admin pode tê-las alterado).
    const newToken = jwt.sign(
      { sub: user.id, role: user.role, allowedDashboards: user.allowedDashboards },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    const res = NextResponse.json({ user, token: newToken });

    res.cookies.set("dl_token", newToken, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (err) {
    console.error("Erro em /api/auth/me:", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
