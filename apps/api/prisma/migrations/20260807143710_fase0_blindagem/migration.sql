-- AlterTable
ALTER TABLE "embarcacao" ADD COLUMN     "excluido_em" TIMESTAMPTZ;

-- CreateIndex
CREATE INDEX "embarcacao_excluido_em_idx" ON "embarcacao"("excluido_em");
