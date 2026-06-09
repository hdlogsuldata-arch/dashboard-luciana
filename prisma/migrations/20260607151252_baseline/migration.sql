-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "MetaStatus" AS ENUM ('NO_PRAZO', 'EM_RISCO', 'ATRASADA', 'ALCANCADA');

-- CreateEnum
CREATE TYPE "TipoLancamento" AS ENUM ('FRETE_VISTA_NAO_LIQUIDADO', 'DISPONIVEL_FATURAR', 'FATURA_VENCIDA', 'RELATORIO_FATURA');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MANAGER', 'ANALYST', 'OPERATOR', 'VIEWER');

-- CreateTable
CREATE TABLE "Veiculo" (
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
CREATE TABLE "Ctrc" (
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
CREATE TABLE "Motorista" (
    "id" SERIAL NOT NULL,
    "cpf" TEXT NOT NULL,
    "nome" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Motorista_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendedor" (
    "id" SERIAL NOT NULL,
    "codigo" INTEGER,
    "nome" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vendedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ocorrencia" (
    "id" SERIAL NOT NULL,
    "ctrcId" INTEGER NOT NULL,
    "codigo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "local" TEXT NOT NULL,
    "dataHora" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ocorrencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lancamento" (
    "id" SERIAL NOT NULL,
    "tipo" "TipoLancamento" NOT NULL,
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
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'VIEWER',
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "allowedDashboards" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "funcao" TEXT NOT NULL DEFAULT 'Visualizador',
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserKpi" (
    "userId" TEXT NOT NULL,
    "kpiId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "section" TEXT NOT NULL,

    CONSTRAINT "UserKpi_pkey" PRIMARY KEY ("userId","kpiId")
);

-- CreateTable
CREATE TABLE "UserChart" (
    "userId" TEXT NOT NULL,
    "chartId" TEXT NOT NULL,
    "section" TEXT NOT NULL,

    CONSTRAINT "UserChart_pkey" PRIMARY KEY ("userId","chartId")
);

-- CreateTable
CREATE TABLE "Meta" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "chartId" TEXT NOT NULL,
    "op" TEXT NOT NULL DEFAULT '>=',
    "targetValue" DOUBLE PRECISION NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "status" "MetaStatus" NOT NULL DEFAULT 'NO_PRAZO',
    "ownerEmail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Meta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CnpjExcluido" (
    "cnpj" TEXT NOT NULL,
    "nomeEmpresa" TEXT NOT NULL,
    "notas" TEXT,
    "criadoPor" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CnpjExcluido_pkey" PRIMARY KEY ("cnpj")
);

-- CreateTable
CREATE TABLE "SnapshotImport" (
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
CREATE TABLE "_migrations" (
    "name" TEXT NOT NULL,
    "applied_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "_migrations_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "ssw_extractions" (
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
CREATE TABLE "ssw_runs" (
    "extracted_at" TIMESTAMPTZ(6) NOT NULL,
    "reports_ok" INTEGER NOT NULL DEFAULT 0,
    "reports_fail" INTEGER NOT NULL DEFAULT 0,
    "total_rows" INTEGER NOT NULL DEFAULT 0,
    "duration_ms" INTEGER,
    "errors" JSONB,

    CONSTRAINT "ssw_runs_pkey" PRIMARY KEY ("extracted_at")
);

-- CreateIndex
CREATE UNIQUE INDEX "Veiculo_placa_key" ON "Veiculo"("placa");

-- CreateIndex
CREATE INDEX "Ctrc_situacao_idx" ON "Ctrc"("situacao");

-- CreateIndex
CREATE INDEX "Ctrc_dataEmissao_idx" ON "Ctrc"("dataEmissao");

-- CreateIndex
CREATE INDEX "Ctrc_pagadorCnpj_idx" ON "Ctrc"("pagadorCnpj");

-- CreateIndex
CREATE UNIQUE INDEX "Ctrc_sigla_numero_key" ON "Ctrc"("sigla", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "Motorista_cpf_key" ON "Motorista"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "Vendedor_codigo_key" ON "Vendedor"("codigo");

-- CreateIndex
CREATE INDEX "Ocorrencia_ctrcId_idx" ON "Ocorrencia"("ctrcId");

-- CreateIndex
CREATE INDEX "Lancamento_tipo_idx" ON "Lancamento"("tipo");

-- CreateIndex
CREATE INDEX "Lancamento_pagadorCnpj_idx" ON "Lancamento"("pagadorCnpj");

-- CreateIndex
CREATE INDEX "Lancamento_emissao_idx" ON "Lancamento"("emissao");

-- CreateIndex
CREATE INDEX "Lancamento_vencimento_idx" ON "Lancamento"("vencimento");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserKpi_userId_position_key" ON "UserKpi"("userId", "position");

-- CreateIndex
CREATE INDEX "CnpjExcluido_nomeEmpresa_idx" ON "CnpjExcluido"("nomeEmpresa");

-- CreateIndex
CREATE INDEX "SnapshotImport_referenceDate_idx" ON "SnapshotImport"("referenceDate");

-- CreateIndex
CREATE UNIQUE INDEX "SnapshotImport_referenceDate_filename_key" ON "SnapshotImport"("referenceDate", "filename");

-- CreateIndex
CREATE INDEX "idx_ssw_lookup" ON "ssw_extractions"("report_pasta", "report_codigo", "extracted_at" DESC);

-- CreateIndex
CREATE INDEX "idx_ssw_payload_gin" ON "ssw_extractions" USING GIN ("payload");

-- AddForeignKey
ALTER TABLE "Veiculo" ADD CONSTRAINT "Veiculo_motoristaId_fkey" FOREIGN KEY ("motoristaId") REFERENCES "Motorista"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ctrc" ADD CONSTRAINT "Ctrc_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "Vendedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ocorrencia" ADD CONSTRAINT "Ocorrencia_ctrcId_fkey" FOREIGN KEY ("ctrcId") REFERENCES "Ctrc"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lancamento" ADD CONSTRAINT "Lancamento_ctrcId_fkey" FOREIGN KEY ("ctrcId") REFERENCES "Ctrc"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserKpi" ADD CONSTRAINT "UserKpi_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserChart" ADD CONSTRAINT "UserChart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meta" ADD CONSTRAINT "Meta_ownerEmail_fkey" FOREIGN KEY ("ownerEmail") REFERENCES "User"("email") ON DELETE RESTRICT ON UPDATE CASCADE;

