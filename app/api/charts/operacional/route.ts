import { NextRequest, NextResponse } from "next/server";
import {
  getOTDRate,
  getPerformanceDistribution,
  getPerformanceByCliente,
  getPerformanceByUF,
  getMotivoNaoEntrega,
  getKpiOTD,
} from "@/lib/data/cliente017";
import {
  getPipelineByCliente,
  getByUltimaOcorrencia,
  getKpiTotalFaturar,
} from "@/lib/data/ctrc231";
import { getOTDSeries } from "@/lib/data/neon-series";
import { rangeFromRequest } from "@/lib/data/dateRange";
import { requireDashboard } from "@/lib/auth-server";

export async function GET(req: NextRequest) {
  const auth = requireDashboard(req, "/dashboard/operacional");
  if (auth instanceof NextResponse) return auth;

  const range = rangeFromRequest(req.nextUrl.searchParams);

  try {
    const [
      oprSeries001,
      kpi003,
      kpi004,
      opr001,
      opr002,
      opr003,
      opr004,
      opr005,
      opr006,
      opr008,
    ] = await Promise.all([
      getOTDSeries(),
      getKpiOTD(range),
      getKpiTotalFaturar(range),
      getOTDRate(range),
      getPerformanceDistribution(range),
      getPerformanceByCliente(15, range),
      getPerformanceByUF(range),
      getMotivoNaoEntrega(range),
      getPipelineByCliente(10, range),
      getByUltimaOcorrencia(range),
    ]);

    return NextResponse.json({
      kpis: {
        KPI_003: kpi003,
        KPI_004: kpi004,
      },
      charts: {
        OPR_001: opr001,
        OPR_002: opr002,
        OPR_003: opr003,
        OPR_004: opr004,
        OPR_005: opr005,
        OPR_006: opr006,
        OPR_008: opr008,
      },
      series: {
        OPR_001: oprSeries001,
      },
    });
  } catch (err) {
    console.error("[api/charts/operacional]", err);
    return NextResponse.json(
      { error: "Erro ao carregar dados operacionais" },
      { status: 500 }
    );
  }
}
