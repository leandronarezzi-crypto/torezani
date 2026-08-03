-- CreateTable
CREATE TABLE "auditoria" (
    "id" SERIAL NOT NULL,
    "embarcacao_id" INTEGER NOT NULL,
    "responsavel" VARCHAR(150) NOT NULL,
    "data_realizacao" DATE NOT NULL,
    "horimetro" DECIMAL(10,2),
    "observacoes_gerais" TEXT,
    "criado_por_id" INTEGER,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditoria_item" (
    "id" SERIAL NOT NULL,
    "auditoria_id" INTEGER NOT NULL,
    "categoria" VARCHAR(50) NOT NULL,
    "descricao" TEXT NOT NULL,
    "concluido" BOOLEAN NOT NULL DEFAULT false,
    "observacao" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "auditoria_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "auditoria_embarcacao_id_idx" ON "auditoria"("embarcacao_id");

-- CreateIndex
CREATE INDEX "auditoria_item_auditoria_id_idx" ON "auditoria_item"("auditoria_id");

-- AddForeignKey
ALTER TABLE "auditoria" ADD CONSTRAINT "auditoria_embarcacao_id_fkey" FOREIGN KEY ("embarcacao_id") REFERENCES "embarcacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria" ADD CONSTRAINT "auditoria_criado_por_id_fkey" FOREIGN KEY ("criado_por_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria_item" ADD CONSTRAINT "auditoria_item_auditoria_id_fkey" FOREIGN KEY ("auditoria_id") REFERENCES "auditoria"("id") ON DELETE CASCADE ON UPDATE CASCADE;
