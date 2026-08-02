-- Esquema do banco de dados para o sistema de Gerenciamento de Embarcação
-- Todas as tabelas usam IF NOT EXISTS para permitir execução idempotente no startup.

CREATE TABLE IF NOT EXISTS usuario (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha_hash VARCHAR(200) NOT NULL,
    papel VARCHAR(20) NOT NULL CHECK (papel IN ('ADMIN', 'EDITOR', 'VISUALIZADOR')) DEFAULT 'VISUALIZADOR',
    status VARCHAR(20) NOT NULL CHECK (status IN ('PENDENTE', 'APROVADO', 'REJEITADO')) DEFAULT 'PENDENTE',
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS embarcacao (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    tipo_configuracao VARCHAR(20) NOT NULL CHECK (tipo_configuracao IN ('MONOMOTOR', 'BIMOTOR')),
    latitude DECIMAL(9,6),
    longitude DECIMAL(9,6),
    localizacao_atualizada_em TIMESTAMPTZ,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS motor (
    id SERIAL PRIMARY KEY,
    embarcacao_id INT NOT NULL REFERENCES embarcacao(id) ON DELETE CASCADE,
    posicao VARCHAR(20) NOT NULL CHECK (posicao IN ('MONO', 'BORE/BABOR', 'ESTIBORDO')),
    marca VARCHAR(50),
    modelo VARCHAR(50),
    potencia_config VARCHAR(50),
    num_serie VARCHAR(50),
    horimetro_atual DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_motor_embarcacao_id ON motor(embarcacao_id);

CREATE TABLE IF NOT EXISTS caixa_reversora (
    id SERIAL PRIMARY KEY,
    motor_id INT NOT NULL UNIQUE REFERENCES motor(id) ON DELETE CASCADE,
    marca VARCHAR(50),
    modelo VARCHAR(50),
    ratio VARCHAR(20),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sistema_eixo_helice (
    id SERIAL PRIMARY KEY,
    motor_id INT NOT NULL UNIQUE REFERENCES motor(id) ON DELETE CASCADE,
    diametro_helice VARCHAR(20),
    passo_helice VARCHAR(20),
    num_pas INT,
    diametro_eixo VARCHAR(20),
    grau_cone VARCHAR(20),
    comprimento_cone VARCHAR(20),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS correia (
    id SERIAL PRIMARY KEY,
    motor_id INT NOT NULL REFERENCES motor(id) ON DELETE CASCADE,
    funcao_aplicacao VARCHAR(100),
    especificacao_tamanho VARCHAR(50),
    quantidade INT NOT NULL DEFAULT 1 CHECK (quantidade > 0),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_correia_motor_id ON correia(motor_id);

CREATE TABLE IF NOT EXISTS manutencao_preventiva (
    id SERIAL PRIMARY KEY,
    motor_id INT NOT NULL REFERENCES motor(id) ON DELETE CASCADE,
    tipo_servico VARCHAR(50) NOT NULL,
    horimetro_ultima_troca DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    intervalo_horas INT NOT NULL CHECK (intervalo_horas > 0),
    alerta_limite_horas INT NOT NULL DEFAULT 0 CHECK (alerta_limite_horas >= 0),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_manutencao_preventiva_motor_id ON manutencao_preventiva(motor_id);

CREATE TABLE IF NOT EXISTS manutencao_casco_pintura (
    id SERIAL PRIMARY KEY,
    embarcacao_id INT NOT NULL REFERENCES embarcacao(id) ON DELETE CASCADE,
    tipo_intervencao VARCHAR(50) NOT NULL CHECK (tipo_intervencao IN ('CASCO', 'PINTURA')),
    data_execucao DATE,
    horimetro_embarcacao DECIMAL(10,2),
    esquema_produtos TEXT,
    historico_observacoes TEXT,
    alerta_vencimento_data DATE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_manutencao_casco_pintura_embarcacao_id ON manutencao_casco_pintura(embarcacao_id);

-- Migrações idempotentes para bancos já existentes (tabela criada antes destas colunas existirem)
ALTER TABLE embarcacao ADD COLUMN IF NOT EXISTS latitude DECIMAL(9,6);
ALTER TABLE embarcacao ADD COLUMN IF NOT EXISTS longitude DECIMAL(9,6);
ALTER TABLE embarcacao ADD COLUMN IF NOT EXISTS localizacao_atualizada_em TIMESTAMPTZ;
