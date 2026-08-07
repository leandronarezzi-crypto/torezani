-- CreateTable
CREATE TABLE "execucao_manutencao" (
    "id" SERIAL NOT NULL,
    "manutencao_id" INTEGER NOT NULL,
    "horimetro" DECIMAL(10,2) NOT NULL,
    "data_execucao" TIMESTAMPTZ NOT NULL,
    "observacoes" TEXT,
    "origem" VARCHAR(20) NOT NULL DEFAULT 'REGISTRO',
    "registrado_por_id" INTEGER,
    "registrado_por_nome" VARCHAR(150),
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "execucao_manutencao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "execucao_manutencao_manutencao_id_idx" ON "execucao_manutencao"("manutencao_id");

-- CreateIndex
CREATE INDEX "execucao_manutencao_data_execucao_idx" ON "execucao_manutencao"("data_execucao");

-- AddForeignKey
ALTER TABLE "execucao_manutencao" ADD CONSTRAINT "execucao_manutencao_manutencao_id_fkey" FOREIGN KEY ("manutencao_id") REFERENCES "manutencao_preventiva"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "execucao_manutencao" ADD CONSTRAINT "execucao_manutencao_registrado_por_id_fkey" FOREIGN KEY ("registrado_por_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
