/**
 * Teste unitário da regra central de autorização de telas (lib/access.ts).
 * Roda sem DB/browser: `npx tsx scripts/test-access.ts`
 * Cobre o bug: usuário não-admin só pode acessar telas em allowedDashboards.
 */
import assert from "node:assert";
import { canAccessPath, visibleDashboards } from "../lib/access";

let passed = 0;
function check(desc: string, cond: boolean) {
  assert.ok(cond, `FALHOU: ${desc}`);
  passed++;
}

// ADMIN acessa tudo
check("ADMIN acessa operacional", canAccessPath("/dashboard/operacional", "ADMIN", []));
check("ADMIN acessa /admin/usuarios", canAccessPath("/admin/usuarios", "ADMIN", []));

// VIEWER com permissão específica
check("VIEWER permitido vê financeiro", canAccessPath("/dashboard/financeiro", "VIEWER", ["dash_financeiro"]));
check("VIEWER permitido vê subrota de financeiro", canAccessPath("/dashboard/financeiro/x", "VIEWER", ["dash_financeiro"]));
check("VIEWER NÃO vê operacional sem permissão", !canAccessPath("/dashboard/operacional", "VIEWER", ["dash_financeiro"]));
check("VIEWER sem nada NÃO vê operacional", !canAccessPath("/dashboard/operacional", "VIEWER", []));
check("VIEWER com metas vê metas", canAccessPath("/dashboard/metas", "VIEWER", ["metas"]));

// Rotas não-configuráveis liberadas a autenticados
check("VIEWER acessa home /dashboard", canAccessPath("/dashboard", "VIEWER", ["dash_financeiro"]));
check("VIEWER acessa /dashboard/ctrcs (não configurável)", canAccessPath("/dashboard/ctrcs", "VIEWER", []));

// Rotas admin-only barram não-admin mesmo com allowedDashboards
check("VIEWER NÃO acessa /admin/usuarios", !canAccessPath("/admin/usuarios", "VIEWER", ["dash_operacional"]));
check("VIEWER NÃO acessa /admin/configuracoes", !canAccessPath("/admin/configuracoes", "MANAGER", ["dash_operacional"]));

// Robustez com null/undefined
check("role null não quebra", !canAccessPath("/dashboard/operacional", null, null));
check("allowed undefined não quebra", !canAccessPath("/dashboard/operacional", "VIEWER", undefined));

// visibleDashboards
const visViewer = visibleDashboards("VIEWER", ["dash_financeiro"]).map((d) => d.id);
check("menu do VIEWER mostra só financeiro", visViewer.length === 1 && visViewer[0] === "dash_financeiro");
const visAdmin = visibleDashboards("ADMIN", []).map((d) => d.id);
check("menu do ADMIN mostra todas as 6 telas", visAdmin.length === 6);
const visEmpty = visibleDashboards("VIEWER", []);
check("VIEWER sem permissão tem menu vazio", visEmpty.length === 0);

console.log(`OK — ${passed} asserções passaram`);
