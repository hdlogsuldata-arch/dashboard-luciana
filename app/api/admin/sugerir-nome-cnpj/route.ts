import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { getLatestPayloads } from "@/lib/data/ssw";
import { normalizeCnpj } from "@/lib/data/cnpjFormat";

type Fonte = "caixa240" | "cliente017" | "ctrc" | null;

/**
 * Procura o nome da empresa a partir do CNPJ em 3 fontes, em ordem:
 *   1. SSW caixa/240 (campo "Nome pagador")
 *   2. SSW cliente/17 (campo "PAGADOR")
 *   3. Tabela Ctrc do Postgres (coluna pagadorNome)
 * Resposta sempre 200, com { nome: string | null, fonte: Fonte }.
 *
 * Mora aqui (e não em /cnpjs-excluidos/sugerir-nome) pra não colidir com a
 * rota dinâmica [cnpj] no mesmo nível — Turbopack do Next 16 não lida bem
 * com literal+dynamic siblings no app router.
 */
export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const cnpjParam = req.nextUrl.searchParams.get("cnpj") ?? "";
  const cnpj = normalizeCnpj(cnpjParam);
  if (cnpj.length !== 14) {
    return NextResponse.json(
      { error: "CNPJ deve ter 14 dígitos" },
      { status: 400 }
    );
  }

  // 1. caixa/240
  try {
    const rows = await getLatestPayloads("caixa", 240);
    for (const r of rows) {
      if (normalizeCnpj(r["CNPJ pagador"]) === cnpj) {
        const nome = r["Nome pagador"]?.trim();
        if (nome) {
          return NextResponse.json({ nome, fonte: "caixa240" satisfies Fonte });
        }
      }
    }
  } catch (err) {
    console.error("[sugerir-nome] caixa240:", err);
  }

  // 2. cliente/17
  try {
    const rows = await getLatestPayloads("cliente", 17);
    for (const r of rows) {
      if (normalizeCnpj(r["CNPJ PAGADOR"]) === cnpj) {
        const nome = r["PAGADOR"]?.trim();
        if (nome) {
          return NextResponse.json({ nome, fonte: "cliente017" satisfies Fonte });
        }
      }
    }
  } catch (err) {
    console.error("[sugerir-nome] cliente017:", err);
  }

  // 3. Tabela Ctrc
  try {
    const ctrc = await prisma.ctrc.findFirst({
      where: { pagadorCnpj: cnpj },
      select: { pagadorNome: true },
    });
    if (ctrc?.pagadorNome) {
      return NextResponse.json({
        nome: ctrc.pagadorNome,
        fonte: "ctrc" satisfies Fonte,
      });
    }
  } catch (err) {
    console.error("[sugerir-nome] ctrc:", err);
  }

  return NextResponse.json({ nome: null, fonte: null satisfies Fonte });
}
