import { NextRequest, NextResponse } from "next/server";
import {
  getComposicaoByTipo,
  getRelacionamento,
  getByFabricante,
  getIdadeFrota,
  getByCombustivel,
  getLocalizacaoAtual,
  getRastreamento,
  getVencimentoSeguros,
  getCapacidadeByTipo,
  getOdometroMedioByTipo,
  getKpiTotalFrota,
  getKpiTaxaRastreamento,
} from "@/lib/data/tabelas245";

export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get("ref") ?? undefined;

  try {
    const data = {
      kpis: {
        KPI_006: getKpiTotalFrota(ref),
        KPI_007: getKpiTaxaRastreamento(ref),
      },
      charts: {
        FLT_001: getComposicaoByTipo(ref),
        FLT_002: getRelacionamento(ref),
        FLT_003: getByFabricante(ref),
        FLT_004: getIdadeFrota(ref),
        FLT_005: getByCombustivel(ref),
        FLT_006: getLocalizacaoAtual(ref),
        FLT_007: getRastreamento(ref),
        FLT_008: getVencimentoSeguros(ref),
        FLT_009: getCapacidadeByTipo(ref),
        FLT_010: getOdometroMedioByTipo(ref),
      },
    };

    return NextResponse.json(data);
  } catch (err) {
    console.error("[api/charts/frota]", err);
    return NextResponse.json(
      { error: "Erro ao carregar dados de frota" },
      { status: 500 }
    );
  }
}
