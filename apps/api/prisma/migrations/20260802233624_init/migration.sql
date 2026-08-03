-- CreateEnum
CREATE TYPE "Papel" AS ENUM ('ADMIN', 'EDITOR', 'VISUALIZADOR');

-- CreateEnum
CREATE TYPE "StatusUsuario" AS ENUM ('PENDENTE', 'APROVADO', 'REJEITADO');

-- CreateEnum
CREATE TYPE "TipoConfiguracao" AS ENUM ('MONOMOTOR', 'BIMOTOR');

-- CreateEnum
CREATE TYPE "PosicaoMotor" AS ENUM ('MONO', 'BORE/BABOR', 'ESTIBORDO');

-- CreateEnum
CREATE TYPE "TipoIntervencao" AS ENUM ('CASCO', 'PINTURA');

-- CreateTable
CREATE TABLE "usuario" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "senha_hash" VARCHAR(200) NOT NULL,
    "papel" "Papel" NOT NULL DEFAULT 'VISUALIZADOR',
    "status" "StatusUsuario" NOT NULL DEFAULT 'PENDENTE',
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "embarcacao" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "tipo_configuracao" "TipoConfiguracao" NOT NULL,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "localizacao_atualizada_em" TIMESTAMPTZ,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "embarcacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "motor" (
    "id" SERIAL NOT NULL,
    "embarcacao_id" INTEGER NOT NULL,
    "posicao" "PosicaoMotor" NOT NULL,
    "marca" VARCHAR(50),
    "modelo" VARCHAR(50),
    "potencia_config" VARCHAR(50),
    "num_serie" VARCHAR(50),
    "horimetro_atual" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "motor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "caixa_reversora" (
    "id" SERIAL NOT NULL,
    "motor_id" INTEGER NOT NULL,
    "marca" VARCHAR(50),
    "modelo" VARCHAR(50),
    "ratio" VARCHAR(20),
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "caixa_reversora_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sistema_eixo_helice" (
    "id" SERIAL NOT NULL,
    "motor_id" INTEGER NOT NULL,
    "diametro_helice" VARCHAR(20),
    "passo_helice" VARCHAR(20),
    "num_pas" INTEGER,
    "diametro_eixo" VARCHAR(20),
    "grau_cone" VARCHAR(20),
    "comprimento_cone" VARCHAR(20),
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sistema_eixo_helice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "correia" (
    "id" SERIAL NOT NULL,
    "motor_id" INTEGER NOT NULL,
    "funcao_aplicacao" VARCHAR(100),
    "especificacao_tamanho" VARCHAR(50),
    "quantidade" INTEGER NOT NULL DEFAULT 1,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "correia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manutencao_preventiva" (
    "id" SERIAL NOT NULL,
    "motor_id" INTEGER NOT NULL,
    "tipo_servico" VARCHAR(50) NOT NULL,
    "horimetro_ultima_troca" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "intervalo_horas" INTEGER NOT NULL,
    "alerta_limite_horas" INTEGER NOT NULL DEFAULT 0,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "manutencao_preventiva_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manutencao_casco_pintura" (
    "id" SERIAL NOT NULL,
    "embarcacao_id" INTEGER NOT NULL,
    "tipo_intervencao" "TipoIntervencao" NOT NULL,
    "data_execucao" DATE,
    "horimetro_embarcacao" DECIMAL(10,2),
    "esquema_produtos" TEXT,
    "historico_observacoes" TEXT,
    "alerta_vencimento_data" DATE,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "manutencao_casco_pintura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_read" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "notification_id" VARCHAR(80) NOT NULL,
    "lido_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_read_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- CreateIndex
CREATE INDEX "motor_embarcacao_id_idx" ON "motor"("embarcacao_id");

-- CreateIndex
CREATE UNIQUE INDEX "caixa_reversora_motor_id_key" ON "caixa_reversora"("motor_id");

-- CreateIndex
CREATE UNIQUE INDEX "sistema_eixo_helice_motor_id_key" ON "sistema_eixo_helice"("motor_id");

-- CreateIndex
CREATE INDEX "correia_motor_id_idx" ON "correia"("motor_id");

-- CreateIndex
CREATE INDEX "manutencao_preventiva_motor_id_idx" ON "manutencao_preventiva"("motor_id");

-- CreateIndex
CREATE INDEX "manutencao_casco_pintura_embarcacao_id_idx" ON "manutencao_casco_pintura"("embarcacao_id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_read_usuario_id_notification_id_key" ON "notification_read"("usuario_id", "notification_id");

-- AddForeignKey
ALTER TABLE "motor" ADD CONSTRAINT "motor_embarcacao_id_fkey" FOREIGN KEY ("embarcacao_id") REFERENCES "embarcacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "caixa_reversora" ADD CONSTRAINT "caixa_reversora_motor_id_fkey" FOREIGN KEY ("motor_id") REFERENCES "motor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sistema_eixo_helice" ADD CONSTRAINT "sistema_eixo_helice_motor_id_fkey" FOREIGN KEY ("motor_id") REFERENCES "motor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "correia" ADD CONSTRAINT "correia_motor_id_fkey" FOREIGN KEY ("motor_id") REFERENCES "motor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manutencao_preventiva" ADD CONSTRAINT "manutencao_preventiva_motor_id_fkey" FOREIGN KEY ("motor_id") REFERENCES "motor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manutencao_casco_pintura" ADD CONSTRAINT "manutencao_casco_pintura_embarcacao_id_fkey" FOREIGN KEY ("embarcacao_id") REFERENCES "embarcacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_read" ADD CONSTRAINT "notification_read_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
