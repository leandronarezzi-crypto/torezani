-- CreateTable
CREATE TABLE "log_alteracao" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER,
    "usuario_email" VARCHAR(150),
    "usuario_papel" VARCHAR(20),
    "metodo" VARCHAR(10) NOT NULL,
    "rota" VARCHAR(300) NOT NULL,
    "entidade" VARCHAR(60),
    "registro_id" VARCHAR(60),
    "dados" JSONB,
    "status_code" INTEGER NOT NULL,
    "sucesso" BOOLEAN NOT NULL DEFAULT true,
    "erro" TEXT,
    "ip" VARCHAR(60),
    "duracao_ms" INTEGER,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "log_alteracao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "log_alteracao_usuario_id_idx" ON "log_alteracao"("usuario_id");

-- CreateIndex
CREATE INDEX "log_alteracao_criado_em_idx" ON "log_alteracao"("criado_em");

-- CreateIndex
CREATE INDEX "log_alteracao_entidade_registro_id_idx" ON "log_alteracao"("entidade", "registro_id");

-- AddForeignKey
ALTER TABLE "log_alteracao" ADD CONSTRAINT "log_alteracao_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
