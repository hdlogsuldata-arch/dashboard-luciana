/*
  Warnings:

  - Added the required column `section` to the `UserKpi` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MetaStatus" AS ENUM ('NO_PRAZO', 'EM_RISCO', 'ATRASADA', 'ALCANCADA');

-- AlterTable
ALTER TABLE "UserKpi" ADD COLUMN     "section" TEXT NOT NULL;

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
    "kpiId" TEXT NOT NULL,
    "targetValue" DOUBLE PRECISION NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "status" "MetaStatus" NOT NULL DEFAULT 'NO_PRAZO',
    "ownerEmail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Meta_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UserChart" ADD CONSTRAINT "UserChart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meta" ADD CONSTRAINT "Meta_ownerEmail_fkey" FOREIGN KEY ("ownerEmail") REFERENCES "User"("email") ON DELETE RESTRICT ON UPDATE CASCADE;
