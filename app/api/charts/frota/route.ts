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

// Frota não tem campo de data útil — query é ignorada, sempre snapshot atual.
export async function GET(_req: NextRequest) {
  try {
    const [
      kpi006,
      kpi007,
      flt001,
      flt002,
      flt003,
      flt004,
      flt005,
      flt006,
      flt007,
      flt008,
      flt009,
      flt010,
    ] = await Promise.all([
      getKpiTotalFrota(),
      getKpiTaxaRastreamento(),
      getComposicaoByTipo(),
      getRelacionamento(),
      getByFabricante(),
      getIdadeFrota(),
      getByCombustivel(),
      getLocalizacaoAtual(),
      getRastreamento(),
      getVencimentoSeguros(),
      getCapacidadeByTipo(),
      getOdometroMedioByTipo(),
    ]);

    return NextResponse.json({
      kpis: {
        KPI_006: kpi006,
        KPI_007: kpi007,
      },
      charts: {
        FLT_001: flt001,
        FLT_002: flt002,
        FLT_003: flt003,
        FLT_004: flt004,
        FLT_005: flt005,
        FLT_006: flt006,
        FLT_007: flt007,
        FLT_008: flt008,
        FLT_009: flt009,
        FLT_010: flt010,
      },
    });
  } catch (err) {
    console.error("[api/charts/frota]", err);
    return NextResponse.json(
      { error: "Erro ao carregar dados de frota" },
      { status: 500 }
    );
  }
}
