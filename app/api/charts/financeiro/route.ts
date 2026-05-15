import { NextRequest, NextResponse } from "next/server";
import {
  getAgingBuckets,
  getTopDebtors,
  getByABC,
  getByUnidade as getAdimByUnidade,
  getByUF,
  getByBanco,
  getKpiSaldoTotal,
  getKpiPrazoMedio,
} from "@/lib/data/caixa240";
import {
  getByEvento,
  getTopFornecedores,
  getByUnidade as getDespByUnidade,
  getStatusPagamentos,
} from "@/lib/data/caixa202";
import {
  getReceitaByABC,
  getTopClientesByReceita,
  getCtrcsByCliente,
  getKpiReceitaFrete,
} from "@/lib/data/cliente203";
import {
  getAgingSeries,
  getDespesasSeries,
  getTopClientesSeries,
} from "@/lib/data/neon-series";

export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get("ref") ?? undefined;

  try {
    // `charts` = snapshot do mês (CSV). `series` = histórico temporal (Neon).
    // As séries são resolvidas em paralelo e cada uma é resiliente a falha.
    const [finSeries007, finSeries012, finSeries001] = await Promise.all([
      getDespesasSeries(),
      getTopClientesSeries(),
      getAgingSeries(),
    ]);

    const data = {
      kpis: {
        KPI_001: getKpiSaldoTotal(ref),
        KPI_002: getKpiPrazoMedio(ref),
        KPI_005: getKpiReceitaFrete(ref),
      },
      charts: {
        FIN_001: getAgingBuckets(ref),
        FIN_002: getTopDebtors(10, ref),
        FIN_003: getByABC(ref),
        FIN_004: getAdimByUnidade(ref),
        FIN_005: getByUF(ref),
        FIN_006: getByBanco(ref),
        FIN_007: getByEvento(ref),
        FIN_008: getTopFornecedores(10, ref),
        FIN_009: getDespByUnidade(ref),
        FIN_010: getStatusPagamentos(ref),
        FIN_011: getReceitaByABC(ref),
        FIN_012: getTopClientesByReceita(10, ref),
        FIN_013: getCtrcsByCliente(10, ref),
      },
      series: {
        FIN_001: finSeries001,
        FIN_007: finSeries007,
        FIN_012: finSeries012,
      },
    };

    return NextResponse.json(data);
  } catch (err) {
    console.error("[api/charts/financeiro]", err);
    return NextResponse.json(
      { error: "Erro ao carregar dados financeiros" },
      { status: 500 }
    );
  }
}
