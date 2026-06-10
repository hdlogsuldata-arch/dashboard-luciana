import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { canAccessPath, firstAllowedHref } from "@/lib/access";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_in_prod";

const PUBLIC_ROUTES = ["/login", "/"];
const ADMIN_ROUTES = ["/admin", "/dashboard/ctrcs"];
const PUBLIC_FILE = /\.(.*)$/;

type Decoded = { sub: string; role: string; allowedDashboards: string[] };

async function verifyToken(token: string): Promise<Decoded | null> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const sub = typeof payload.sub === "string" ? payload.sub : null;
    const role = typeof payload.role === "string" ? payload.role : null;
    if (!sub || !role) return null;
    const allowedDashboards = Array.isArray(payload.allowedDashboards)
      ? (payload.allowedDashboards as unknown[]).filter(
          (x): x is string => typeof x === "string",
        )
      : [];
    return { sub, role, allowedDashboards };
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/assets") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  if (PUBLIC_ROUTES.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  const token = req.cookies.get("dl_token")?.value;

  if (!token) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  const decoded = await verifyToken(token);
  if (!decoded) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (ADMIN_ROUTES.some((p) => pathname.startsWith(p))) {
    if (decoded.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  // Enforcement de telas por usuário: bloqueia navegação direta (via URL) a um
  // dashboard que não está em allowedDashboards. Redireciona para a 1ª tela
  // permitida (ou /dashboard, sempre acessível) evitando loop de redirect.
  if (!canAccessPath(pathname, decoded.role, decoded.allowedDashboards)) {
    const dest = firstAllowedHref(decoded.role, decoded.allowedDashboards);
    return NextResponse.redirect(new URL(dest, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next|assets|favicon.ico|robots.txt|sitemap.xml).*)"],
};
