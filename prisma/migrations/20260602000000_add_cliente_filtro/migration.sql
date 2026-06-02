-- CreateTable
CREATE TABLE "ClienteFiltro" (
    "id" SERIAL NOT NULL,
    "cnpj" TEXT NOT NULL,
    "nome" TEXT,
    "excluido" BOOLEAN NOT NULL DEFAULT false,
    "grupo" TEXT,
    "motivo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClienteFiltro_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClienteFiltro_cnpj_key" ON "ClienteFiltro"("cnpj");
