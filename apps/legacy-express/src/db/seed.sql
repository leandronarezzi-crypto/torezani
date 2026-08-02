-- Dados de exemplo para demonstração do sistema.
-- Pode ser executado múltiplas vezes; cada execução cria novos registros de exemplo.

INSERT INTO embarcacao (nome, tipo_configuracao) VALUES ('Lancha Teste', 'BIMOTOR');

INSERT INTO motor (embarcacao_id, posicao, marca, modelo, potencia_config, num_serie, horimetro_atual)
SELECT id, 'BORE/BABOR', 'Volvo Penta', 'D6-400', '400HP', 'VP-BB-1001', 210.00
FROM embarcacao WHERE nome = 'Lancha Teste' ORDER BY id DESC LIMIT 1;

INSERT INTO motor (embarcacao_id, posicao, marca, modelo, potencia_config, num_serie, horimetro_atual)
SELECT id, 'ESTIBORDO', 'Volvo Penta', 'D6-400', '400HP', 'VP-ES-1002', 205.00
FROM embarcacao WHERE nome = 'Lancha Teste' ORDER BY id DESC LIMIT 1;

INSERT INTO caixa_reversora (motor_id, marca, modelo, ratio)
SELECT id, 'ZF Marine', 'ZF63A', '2.48:1' FROM motor WHERE num_serie = 'VP-BB-1001';

INSERT INTO caixa_reversora (motor_id, marca, modelo, ratio)
SELECT id, 'ZF Marine', 'ZF63A', '2.48:1' FROM motor WHERE num_serie = 'VP-ES-1002';

INSERT INTO sistema_eixo_helice (motor_id, diametro_helice, passo_helice, num_pas, diametro_eixo, grau_cone, comprimento_cone)
SELECT id, '22"', '24"', 4, '1.75"', '12', '3.5"' FROM motor WHERE num_serie = 'VP-BB-1001';

INSERT INTO sistema_eixo_helice (motor_id, diametro_helice, passo_helice, num_pas, diametro_eixo, grau_cone, comprimento_cone)
SELECT id, '22"', '24"', 4, '1.75"', '12', '3.5"' FROM motor WHERE num_serie = 'VP-ES-1002';

INSERT INTO correia (motor_id, funcao_aplicacao, especificacao_tamanho, quantidade)
SELECT id, 'Alternador', 'A-45', 1 FROM motor WHERE num_serie = 'VP-BB-1001';

INSERT INTO correia (motor_id, funcao_aplicacao, especificacao_tamanho, quantidade)
SELECT id, 'Alternador', 'A-45', 1 FROM motor WHERE num_serie = 'VP-ES-1002';

INSERT INTO manutencao_preventiva (motor_id, tipo_servico, horimetro_ultima_troca, intervalo_horas, alerta_limite_horas)
SELECT id, 'OLEO_MOTOR', 0.00, 250, 50 FROM motor WHERE num_serie = 'VP-BB-1001';

INSERT INTO manutencao_preventiva (motor_id, tipo_servico, horimetro_ultima_troca, intervalo_horas, alerta_limite_horas)
SELECT id, 'FILTRO_DIESEL', 0.00, 500, 50 FROM motor WHERE num_serie = 'VP-BB-1001';

INSERT INTO manutencao_preventiva (motor_id, tipo_servico, horimetro_ultima_troca, intervalo_horas, alerta_limite_horas)
SELECT id, 'OLEO_MOTOR', 0.00, 250, 50 FROM motor WHERE num_serie = 'VP-ES-1002';

INSERT INTO manutencao_casco_pintura (embarcacao_id, tipo_intervencao, data_execucao, horimetro_embarcacao, esquema_produtos, historico_observacoes, alerta_vencimento_data)
SELECT id, 'PINTURA', CURRENT_DATE - INTERVAL '11 months', 180.00, 'Tinta anti-incrustante Sea Hawk', 'Aplicação padrão, sem intercorrências', CURRENT_DATE + INTERVAL '20 days'
FROM embarcacao WHERE nome = 'Lancha Teste' ORDER BY id DESC LIMIT 1;

INSERT INTO embarcacao (nome, tipo_configuracao) VALUES ('Barco Pequeno', 'MONOMOTOR');

INSERT INTO motor (embarcacao_id, posicao, marca, modelo, potencia_config, num_serie, horimetro_atual)
SELECT id, 'MONO', 'Yanmar', '4JH80', '80HP', 'YM-MONO-2001', 95.00
FROM embarcacao WHERE nome = 'Barco Pequeno' ORDER BY id DESC LIMIT 1;

INSERT INTO manutencao_preventiva (motor_id, tipo_servico, horimetro_ultima_troca, intervalo_horas, alerta_limite_horas)
SELECT id, 'OLEO_MOTOR', 50.00, 100, 20 FROM motor WHERE num_serie = 'YM-MONO-2001';
