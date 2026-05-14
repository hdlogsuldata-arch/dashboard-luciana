-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('ADMIN', 'MANAGER', 'ANALYST', 'OPERATOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "public"."TipoLancamento" AS ENUM ('FRETE_VISTA_NAO_LIQUIDADO', 'DISPONIVEL_FATURAR', 'FATURA_VENCIDA', 'RELATORIO_FATURA');

-- CreateTable
CREATE TABLE "public"."Ctrc" (
    "id" SERIAL NOT NULL,
    "numero" TEXT NOT NULL,
    "sigla" TEXT NOT NULL,
    "situacao" TEXT NOT NULL,
    "tipoDocumento" TEXT NOT NULL,
    "dataEmissao" TIMESTAMP(3) NOT NULL,
    "prevEntrega" TIMESTAMP(3),
    "sitLiquidacao" TEXT,
    "dataLiquidacao" TIMESTAMP(3),
    "remetenteNome" TEXT NOT NULL,
    "remetenteCnpj" TEXT NOT NULL,
    "remetenteCidade" TEXT NOT NULL,
    "remetenteUf" TEXT NOT NULL,
    "destinatarioNome" TEXT NOT NULL,
    "destinatarioCnpj" TEXT NOT NULL,
    "destinatarioCidade" TEXT NOT NULL,
    "destinatarioUf" TEXT NOT NULL,
    "pagadorNome" TEXT NOT NULL,
    "pagadorCnpj" TEXT NOT NULL,
    "resultadoComercial" DECIMAL(65,30),
    "grupoCnpj" TEXT,
    "cidadeDestino" TEXT NOT NULL,
    "ufDestino" TEXT NOT NULL,
    "pesoReal" DOUBLE PRECISION NOT NULL,
    "kgCalculo" DOUBLE PRECISION NOT NULL,
    "cubagem" DOUBLE PRECISION NOT NULL,
    "qtdeVolumes" INTEGER NOT NULL,
    "tipoFrete" TEXT NOT NULL,
    "tipoMercadoria" TEXT,
    "veiculoColeta" TEXT,
    "veiculoEntrega" TEXT,
    "tabelaCalculo" TEXT,
    "nroManifesto" TEXT,
    "unidEmit" TEXT NOT NULL,
    "valorMercadoria" DOUBLE PRECISION NOT NULL,
    "valorFrete" DOUBLE PRECISION NOT NULL,
    "valorLiquido" DOUBLE PRECISION NOT NULL,
    "vlrLiquidado" DOUBLE PRECISION NOT NULL,
    "vlrGris" DOUBLE PRECISION,
    "vlrPedagio" DOUBLE PRECISION,
    "vlrIcms" DOUBLE PRECISION,
    "vendedorId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ctrc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Lancamento" (
    "id" SERIAL NOT NULL,
    "tipo" "public"."TipoLancamento" NOT NULL,
    "referencia" TEXT NOT NULL,
    "emissao" TIMESTAMP(3) NOT NULL,
    "pagadorCnpj" TEXT NOT NULL,
    "pagadorNome" TEXT NOT NULL,
    "pagadorCidade" TEXT,
    "pagadorUf" TEXT,
    "vendedor" TEXT,
    "unidResp" TEXT,
    "valor" DOUBLE PRECISION NOT NULL,
    "tipoCobranca" TEXT,
    "vencimento" TIMESTAMP(3),
    "diasAtraso" INTEGER,
    "saldo" DOUBLE PRECISION,
    "banco" TEXT,
    "tipoFrete" TEXT,
    "tipoDocumento" TEXT,
    "localizacao" TEXT,
    "dataLiquidacao" TIMESTAMP(3),
    "vlrPago" DOUBLE PRECISION,
    "vencimentoOriginal" TIMESTAMP(3),
    "dataCancelamento" TIMESTAMP(3),
    "dataPromessa" TIMESTAMP(3),
    "dataCreditoCaixa" TIMESTAMP(3),
    "vlrCtrcs" DOUBLE PRECISION,
    "vlrDebito" DOUBLE PRECISION,
    "vlrCredito" DOUBLE PRECISION,
    "vlrJuros" DOUBLE PRECISION,
    "vlrMulta" DOUBLE PRECISION,
    "vlrDesconto" DOUBLE PRECISION,
    "liquidada" BOOLEAN,
    "protestada" BOOLEAN,
    "prorrogada" BOOLEAN,
    "tipoBaixa" TEXT,
    "ctrcId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lancamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Motorista" (
    "id" SERIAL NOT NULL,
    "cpf" TEXT NOT NULL,
    "nome" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Motorista_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Ocorrencia" (
    "id" SERIAL NOT NULL,
    "ctrcId" INTEGER NOT NULL,
    "codigo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "local" TEXT NOT NULL,
    "dataHora" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ocorrencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SnapshotImport" (
    "id" SERIAL NOT NULL,
    "referenceDate" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rowCount" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,

    CONSTRAINT "SnapshotImport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL DEFAULT 'VIEWER',
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "allowedDashboards" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "funcao" TEXT NOT NULL DEFAULT 'Visualizador',
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserKpi" (
    "userId" TEXT NOT NULL,
    "kpiId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "UserKpi_pkey" PRIMARY KEY ("userId","kpiId")
);

-- CreateTable
CREATE TABLE "public"."Veiculo" (
    "id" SERIAL NOT NULL,
    "placa" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "disponivel" BOOLEAN NOT NULL,
    "marca" TEXT,
    "modelo" TEXT,
    "capacidade" DOUBLE PRECISION,
    "ano" INTEGER,
    "carroceria" TEXT,
    "eixos" INTEGER,
    "combustivel" TEXT,
    "rastreado" BOOLEAN NOT NULL,
    "marcaRastreador" TEXT,
    "kmOdometro" INTEGER,
    "tagPedagio" TEXT,
    "unidResp" TEXT,
    "ultimoMvto" TIMESTAMP(3),
    "motoristaId" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Veiculo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Vendedor" (
    "id" SERIAL NOT NULL,
    "codigo" INTEGER,
    "nome" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vendedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_migrations" (
    "name" TEXT NOT NULL,
    "applied_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "_migrations_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "public"."ssw_extractions" (
    "id" BIGSERIAL NOT NULL,
    "report_pasta" TEXT NOT NULL,
    "report_codigo" INTEGER NOT NULL,
    "extracted_at" TIMESTAMPTZ(6) NOT NULL,
    "data_param" TEXT NOT NULL,
    "row_index" INTEGER NOT NULL,
    "payload" JSONB NOT NULL,

    CONSTRAINT "ssw_extractions_pkey" PRIMARY KEY ("report_pasta","report_codigo","extracted_at","row_index")
);

-- CreateTable
CREATE TABLE "public"."ssw_runs" (
    "extracted_at" TIMESTAMPTZ(6) NOT NULL,
    "reports_ok" INTEGER NOT NULL DEFAULT 0,
    "reports_fail" INTEGER NOT NULL DEFAULT 0,
    "total_rows" INTEGER NOT NULL DEFAULT 0,
    "duration_ms" INTEGER,
    "errors" JSONB,

    CONSTRAINT "ssw_runs_pkey" PRIMARY KEY ("extracted_at")
);

-- CreateIndex
CREATE INDEX "Ctrc_dataEmissao_idx" ON "public"."Ctrc"("dataEmissao" ASC);

-- CreateIndex
CREATE INDEX "Ctrc_pagadorCnpj_idx" ON "public"."Ctrc"("pagadorCnpj" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Ctrc_sigla_numero_key" ON "public"."Ctrc"("sigla" ASC, "numero" ASC);

-- CreateIndex
CREATE INDEX "Ctrc_situacao_idx" ON "public"."Ctrc"("situacao" ASC);

-- CreateIndex
CREATE INDEX "Lancamento_emissao_idx" ON "public"."Lancamento"("emissao" ASC);

-- CreateIndex
CREATE INDEX "Lancamento_pagadorCnpj_idx" ON "public"."Lancamento"("pagadorCnpj" ASC);

-- CreateIndex
CREATE INDEX "Lancamento_tipo_idx" ON "public"."Lancamento"("tipo" ASC);

-- CreateIndex
CREATE INDEX "Lancamento_vencimento_idx" ON "public"."Lancamento"("vencimento" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Motorista_cpf_key" ON "public"."Motorista"("cpf" ASC);

-- CreateIndex
CREATE INDEX "Ocorrencia_ctrcId_idx" ON "public"."Ocorrencia"("ctrcId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "SnapshotImport_referenceDate_filename_key" ON "public"."SnapshotImport"("referenceDate" ASC, "filename" ASC);

-- CreateIndex
CREATE INDEX "SnapshotImport_referenceDate_idx" ON "public"."SnapshotImport"("referenceDate" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "UserKpi_userId_position_key" ON "public"."UserKpi"("userId" ASC, "position" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Veiculo_placa_key" ON "public"."Veiculo"("placa" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Vendedor_codigo_key" ON "public"."Vendedor"("codigo" ASC);

-- CreateIndex
CREATE INDEX "idx_ssw_lookup" ON "public"."ssw_extractions"("report_pasta" ASC, "report_codigo" ASC, "extracted_at" DESC);

-- CreateIndex
CREATE INDEX "idx_ssw_payload_gin" ON "ssw_extractions" USING GIN ("payload");

-- AddForeignKey
ALTER TABLE "public"."Ctrc" ADD CONSTRAINT "Ctrc_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "public"."Vendedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Lancamento" ADD CONSTRAINT "Lancamento_ctrcId_fkey" FOREIGN KEY ("ctrcId") REFERENCES "public"."Ctrc"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Ocorrencia" ADD CONSTRAINT "Ocorrencia_ctrcId_fkey" FOREIGN KEY ("ctrcId") REFERENCES "public"."Ctrc"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserKpi" ADD CONSTRAINT "UserKpi_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Veiculo" ADD CONSTRAINT "Veiculo_motoristaId_fkey" FOREIGN KEY ("motoristaId") REFERENCES "public"."Motorista"("id") ON DELETE SET NULL ON UPDATE CASCADE;

