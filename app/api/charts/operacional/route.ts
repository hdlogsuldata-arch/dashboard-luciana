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

export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get("ref") ?? undefined;

  try {
    const data = {
      kpis: {
        KPI_003: getKpiOTD(ref),
        KPI_004: getKpiTotalFaturar(ref),
      },
      charts: {
        OPR_001: getOTDRate(ref),
        OPR_002: getPerformanceDistribution(ref),
        OPR_003: getPerformanceByCliente(15, ref),
        OPR_004: getPerformanceByUF(ref),
        OPR_005: getMotivoNaoEntrega(ref),
        OPR_006: getPipelineByCliente(10, ref),
        OPR_008: getByUltimaOcorrencia(ref),
      },
    };

    return NextResponse.json(data);
  } catch (err) {
    console.error("[api/charts/operacional]", err);
    return NextResponse.json(
      { error: "Erro ao carregar dados operacionais" },
      { status: 500 }
    );
  }
}
