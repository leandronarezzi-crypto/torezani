-- CreateTable
CREATE TABLE "ordem_servico" (
    "id" SERIAL NOT NULL,
    "manutencao_id" INTEGER,
    "embarcacao_id" INTEGER NOT NULL,
    "motor_id" INTEGER,
    "tipo" "TipoManutencao" NOT NULL,
    "tipo_servico" VARCHAR(255) NOT NULL,
    "horimetro_atual" DECIMAL(10,2),
    "horas_restantes" INTEGER,
    "status" VARCHAR(20) NOT NULL,
    "observacoes" TEXT,
    "emitido_por_id" INTEGER,
    "emitido_por_nome" VARCHAR(150),
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ordem_servico_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ordem_servico_embarcacao_id_idx" ON "ordem_servico"("embarcacao_id");

-- CreateIndex
CREATE INDEX "ordem_servico_manutencao_id_idx" ON "ordem_servico"("manutencao_id");

-- CreateIndex
CREATE INDEX "ordem_servico_criado_em_idx" ON "ordem_servico"("criado_em");

-- AddForeignKey
ALTER TABLE "ordem_servico" ADD CONSTRAINT "ordem_servico_manutencao_id_fkey" FOREIGN KEY ("manutencao_id") REFERENCES "manutencao_preventiva"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordem_servico" ADD CONSTRAINT "ordem_servico_embarcacao_id_fkey" FOREIGN KEY ("embarcacao_id") REFERENCES "embarcacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordem_servico" ADD CONSTRAINT "ordem_servico_motor_id_fkey" FOREIGN KEY ("motor_id") REFERENCES "motor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordem_servico" ADD CONSTRAINT "ordem_servico_emitido_por_id_fkey" FOREIGN KEY ("emitido_por_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
