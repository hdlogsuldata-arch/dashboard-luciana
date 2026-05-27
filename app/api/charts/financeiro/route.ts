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
} from "@/lib/data/ctrc174";
import {
  getAgingSeries,
  getDespesasSeries,
  getTopClientesSeries,
} from "@/lib/data/neon-series";
import { rangeFromRequest } from "@/lib/data/dateRange";

export async function GET(req: NextRequest) {
  const range = rangeFromRequest(req.nextUrl.searchParams);

  try {
    const [
      finSeries007,
      finSeries012,
      finSeries001,
      kpi001,
      kpi002,
      kpi005,
      fin001,
      fin002,
      fin003,
      fin004,
      fin005,
      fin006,
      fin007,
      fin008,
      fin009,
      fin010,
      fin011,
      fin012,
      fin013,
    ] = await Promise.all([
      getDespesasSeries(),
      getTopClientesSeries(),
      getAgingSeries(),
      getKpiSaldoTotal(range),
      getKpiPrazoMedio(range),
      getKpiReceitaFrete(range),
      getAgingBuckets(range),
      getTopDebtors(10, range),
      getByABC(range),
      getAdimByUnidade(range),
      getByUF(range),
      getByBanco(range),
      getByEvento(range),
      getTopFornecedores(10, range),
      getDespByUnidade(range),
      getStatusPagamentos(range),
      getReceitaByABC(range),
      getTopClientesByReceita(10, range),
      getCtrcsByCliente(10, range),
    ]);

    return NextResponse.json({
      kpis: {
        KPI_001: kpi001,
        KPI_002: kpi002,
        KPI_005: kpi005,
      },
      charts: {
        FIN_001: fin001,
        FIN_002: fin002,
        FIN_003: fin003,
        FIN_004: fin004,
        FIN_005: fin005,
        FIN_006: fin006,
        FIN_007: fin007,
        FIN_008: fin008,
        FIN_009: fin009,
        FIN_010: fin010,
        FIN_011: fin011,
        FIN_012: fin012,
        FIN_013: fin013,
      },
      series: {
        FIN_001: finSeries001,
        FIN_007: finSeries007,
        FIN_012: finSeries012,
      },
    });
  } catch (err) {
    console.error("[api/charts/financeiro]", err);
    return NextResponse.json(
      { error: "Erro ao carregar dados financeiros" },
      { status: 500 }
    );
  }
}
