-- CreateEnum
CREATE TYPE "TipoManutencao" AS ENUM ('PREVENTIVA', 'PREDITIVA', 'CORRETIVA');

-- AlterTable
ALTER TABLE "execucao_manutencao" ADD COLUMN     "custo" DECIMAL(12,2),
ADD COLUMN     "despesa_id" INTEGER,
ADD COLUMN     "fornecedor" VARCHAR(150);

-- AlterTable
ALTER TABLE "manutencao_preventiva" ADD COLUMN     "tipo" "TipoManutencao" NOT NULL DEFAULT 'PREVENTIVA',
ALTER COLUMN "intervalo_horas" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "execucao_manutencao_despesa_id_key" ON "execucao_manutencao"("despesa_id");

-- AddForeignKey
ALTER TABLE "execucao_manutencao" ADD CONSTRAINT "execucao_manutencao_despesa_id_fkey" FOREIGN KEY ("despesa_id") REFERENCES "despesa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

