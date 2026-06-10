/**
 * Verificação end-to-end do enforcement de telas no middleware.
 * Forja cookies dl_token (mesmo segredo do app, via .env) e checa redirects.
 * Pré-req: servidor rodando em http://localhost:3000 (npm start).
 *   npx tsx scripts/verify-mw.ts
 */
import "dotenv/config";
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "dev_secret_change_in_prod";
const BASE = "http://localhost:3000";

function tok(role: string, allowed: string[]) {
  return jwt.sign({ sub: `test-${role}`, role, allowedDashboards: allowed }, SECRET, {
    expiresIn: "1h",
  });
}

const adminTok = tok("ADMIN", []);
const viewerFin = tok("VIEWER", ["dash_financeiro"]);
const viewerEmpty = tok("VIEWER", []);

async function hit(path: string, cookie?: string) {
  const res = await fetch(BASE + path, {
    redirect: "manual",
    headers: cookie ? { cookie: `dl_token=${cookie}` } : {},
  });
  const loc = res.headers.get("location");
  return { status: res.status, location: loc ? new URL(loc, BASE).pathname : null };
}

type Case = { desc: string; path: string; cookie?: string; expectStatus: number; expectLoc?: string | null };

const cases: Case[] = [
  { desc: "sem token → redirect login", path: "/dashboard/operacional", expectStatus: 307, expectLoc: "/login" },
  { desc: "VIEWER permitido acessa financeiro (200)", path: "/dashboard/financeiro", cookie: viewerFin, expectStatus: 200 },
  { desc: "VIEWER BARRADO em operacional → redirect p/ financeiro", path: "/dashboard/operacional", cookie: viewerFin, expectStatus: 307, expectLoc: "/dashboard/financeiro" },
  { desc: "VIEWER BARRADO em frota → redirect p/ financeiro", path: "/dashboard/frota", cookie: viewerFin, expectStatus: 307, expectLoc: "/dashboard/financeiro" },
  { desc: "VIEWER sem telas → redirect p/ /dashboard", path: "/dashboard/operacional", cookie: viewerEmpty, expectStatus: 307, expectLoc: "/dashboard" },
  { desc: "VIEWER não acessa /admin/usuarios", path: "/admin/usuarios", cookie: viewerFin, expectStatus: 307, expectLoc: "/dashboard" },
  { desc: "ADMIN acessa operacional (200)", path: "/dashboard/operacional", cookie: adminTok, expectStatus: 200 },
  { desc: "ADMIN acessa /admin/usuarios (200)", path: "/admin/usuarios", cookie: adminTok, expectStatus: 200 },
  { desc: "home /dashboard acessível a VIEWER", path: "/dashboard", cookie: viewerEmpty, expectStatus: 200 },

  // Enforcement na camada de API (bypass por fetch direto)
  { desc: "API charts/operacional sem token → 401", path: "/api/charts/operacional", expectStatus: 401 },
  { desc: "API charts/operacional VIEWER barrado → 403", path: "/api/charts/operacional", cookie: viewerFin, expectStatus: 403 },
  { desc: "API charts/frota VIEWER barrado → 403", path: "/api/charts/frota", cookie: viewerFin, expectStatus: 403 },
  { desc: "API charts/financeiro VIEWER permitido → não 401/403", path: "/api/charts/financeiro", cookie: viewerFin, expectStatus: -1 },
  { desc: "API charts/operacional ADMIN → não 401/403", path: "/api/charts/operacional", cookie: adminTok, expectStatus: -1 },

  // /dashboard/ctrcs restrito a ADMIN
  { desc: "ctrcs sem token → login", path: "/dashboard/ctrcs", expectStatus: 307, expectLoc: "/login" },
  { desc: "ctrcs VIEWER → redirect /dashboard", path: "/dashboard/ctrcs", cookie: viewerFin, expectStatus: 307, expectLoc: "/dashboard" },
  { desc: "ctrcs ADMIN → 200", path: "/dashboard/ctrcs", cookie: adminTok, expectStatus: 200 },

  // data-range exige autenticação (qualquer usuário logado)
  { desc: "API data-range sem token → 401", path: "/api/charts/data-range", expectStatus: 401 },
  { desc: "API data-range VIEWER → não 401/403", path: "/api/charts/data-range", cookie: viewerEmpty, expectStatus: -1 },
];

async function main() {
  let fail = 0;
  for (const c of cases) {
    const r = await hit(c.path, c.cookie);
    // expectStatus === -1 → "auth passou" (não pode ser 401/403); ignora o resto (DB pode dar 200/500).
    const okStatus =
      c.expectStatus === -1 ? r.status !== 401 && r.status !== 403 : r.status === c.expectStatus;
    const okLoc = c.expectLoc === undefined || r.location === c.expectLoc;
    const ok = okStatus && okLoc;
    if (!ok) fail++;
    console.log(
      `${ok ? "PASS" : "FAIL"} | ${c.desc} | got ${r.status}${r.location ? " → " + r.location : ""}` +
        (ok ? "" : ` | esperado ${c.expectStatus}${c.expectLoc ? " → " + c.expectLoc : ""}`),
    );
  }
  console.log(fail === 0 ? `\nTODOS OK (${cases.length})` : `\n${fail} FALHA(S)`);
  process.exit(fail === 0 ? 0 : 1);
}

main();
