import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_in_prod";

export interface TokenPayload {
  sub: string;
  role: string;
}

export function extractToken(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader) {
    const match = /^Bearer\s+(.+)$/i.exec(authHeader.trim());
    if (match?.[1]) return match[1];
  }
  return req.cookies.get("dl_token")?.value ?? null;
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export function requireAuth(req: NextRequest): TokenPayload | NextResponse {
  const token = extractToken(req);
  if (!token) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  const payload = verifyToken(token);
  if (!payload?.sub) {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }
  return payload;
}

export function requireAdmin(req: NextRequest): TokenPayload | NextResponse {
  const result = requireAuth(req);
  if (result instanceof NextResponse) return result;
  if (result.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }
  return result;
}
