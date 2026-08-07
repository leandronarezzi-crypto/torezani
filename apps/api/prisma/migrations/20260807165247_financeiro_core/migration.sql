-- CreateEnum
CREATE TYPE "StatusContrato" AS ENUM ('ATIVO', 'ENCERRADO', 'SUSPENSO');

-- CreateEnum
CREATE TYPE "StatusReceita" AS ENUM ('RECEBIDO', 'PENDENTE', 'EM_ATRASO');

-- CreateEnum
CREATE TYPE "CategoriaDespesa" AS ENUM ('COMBUSTIVEL', 'LUBRIFICANTES', 'OLEO', 'PECAS', 'OFICINA', 'ESTALEIRO', 'MOTOR', 'GERADOR', 'BOMBAS', 'ELETRICA', 'HIDRAULICA', 'ALIMENTACAO', 'HOSPEDAGEM', 'SALARIOS', 'IMPOSTOS', 'SEGURO', 'DOCUMENTACAO', 'MATERIAL_CONSUMO', 'FERRAMENTAS', 'TERCEIROS', 'FRETES', 'OUTROS');

-- CreateTable
CREATE TABLE "cliente" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "documento" VARCHAR(20),
    "contato_nome" VARCHAR(150),
    "contato_email" VARCHAR(150),
    "contato_telefone" VARCHAR(30),
    "observacoes" TEXT,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "excluido_em" TIMESTAMPTZ,

    CONSTRAINT "cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contrato" (
    "id" SERIAL NOT NULL,
    "cliente_id" INTEGER NOT NULL,
    "numero" VARCHAR(50),
    "descricao" TEXT,
    "valor" DECIMAL(12,2),
    "data_inicio" DATE,
    "data_fim" DATE,
    "status" "StatusContrato" NOT NULL DEFAULT 'ATIVO',
    "observacoes" TEXT,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "excluido_em" TIMESTAMPTZ,

    CONSTRAINT "contrato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "centro_custo" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "pai_id" INTEGER,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "centro_custo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "despesa" (
    "id" SERIAL NOT NULL,
    "categoria" "CategoriaDespesa" NOT NULL,
    "subcategoria" VARCHAR(100),
    "embarcacao_id" INTEGER,
    "centro_custo_id" INTEGER,
    "fornecedor" VARCHAR(150),
    "numero_nota_fiscal" VARCHAR(50),
    "valor" DECIMAL(12,2) NOT NULL,
    "data" DATE NOT NULL,
    "forma_pagamento" VARCHAR(50),
    "observacoes" TEXT,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "excluido_em" TIMESTAMPTZ,

    CONSTRAINT "despesa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receita" (
    "id" SERIAL NOT NULL,
    "cliente_id" INTEGER NOT NULL,
    "contrato_id" INTEGER,
    "embarcacao_id" INTEGER,
    "tipo_servico" VARCHAR(150),
    "valor_contratado" DECIMAL(12,2),
    "valor_faturado" DECIMAL(12,2),
    "valor_recebido" DECIMAL(12,2),
    "data" DATE NOT NULL,
    "status" "StatusReceita" NOT NULL DEFAULT 'PENDENTE',
    "observacoes" TEXT,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "excluido_em" TIMESTAMPTZ,

    CONSTRAINT "receita_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cliente_excluido_em_idx" ON "cliente"("excluido_em");

-- CreateIndex
CREATE INDEX "contrato_cliente_id_idx" ON "contrato"("cliente_id");

-- CreateIndex
CREATE INDEX "contrato_excluido_em_idx" ON "contrato"("excluido_em");

-- CreateIndex
CREATE INDEX "centro_custo_pai_id_idx" ON "centro_custo"("pai_id");

-- CreateIndex
CREATE INDEX "despesa_embarcacao_id_idx" ON "despesa"("embarcacao_id");

-- CreateIndex
CREATE INDEX "despesa_centro_custo_id_idx" ON "despesa"("centro_custo_id");

-- CreateIndex
CREATE INDEX "despesa_data_idx" ON "despesa"("data");

-- CreateIndex
CREATE INDEX "despesa_excluido_em_idx" ON "despesa"("excluido_em");

-- CreateIndex
CREATE INDEX "receita_cliente_id_idx" ON "receita"("cliente_id");

-- CreateIndex
CREATE INDEX "receita_contrato_id_idx" ON "receita"("contrato_id");

-- CreateIndex
CREATE INDEX "receita_embarcacao_id_idx" ON "receita"("embarcacao_id");

-- CreateIndex
CREATE INDEX "receita_data_idx" ON "receita"("data");

-- CreateIndex
CREATE INDEX "receita_excluido_em_idx" ON "receita"("excluido_em");

-- AddForeignKey
ALTER TABLE "contrato" ADD CONSTRAINT "contrato_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "centro_custo" ADD CONSTRAINT "centro_custo_pai_id_fkey" FOREIGN KEY ("pai_id") REFERENCES "centro_custo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "despesa" ADD CONSTRAINT "despesa_embarcacao_id_fkey" FOREIGN KEY ("embarcacao_id") REFERENCES "embarcacao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "despesa" ADD CONSTRAINT "despesa_centro_custo_id_fkey" FOREIGN KEY ("centro_custo_id") REFERENCES "centro_custo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receita" ADD CONSTRAINT "receita_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receita" ADD CONSTRAINT "receita_contrato_id_fkey" FOREIGN KEY ("contrato_id") REFERENCES "contrato"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receita" ADD CONSTRAINT "receita_embarcacao_id_fkey" FOREIGN KEY ("embarcacao_id") REFERENCES "embarcacao"("id") ON DELETE SET NULL ON UPDATE CASCADE;
