const embarcacaoService = require('./embarcacaoService');
const motorService = require('./motorService');
const caixaReversoraService = require('./caixaReversoraService');
const eixoHeliceService = require('./eixoHeliceService');
const correiaService = require('./correiaService');
const manutencaoService = require('./manutencaoService');
const cascoPinturaService = require('./cascoPinturaService');

async function getEmbarcacaoDetail(embarcacaoId) {
  const embarcacao = await embarcacaoService.getEmbarcacao(embarcacaoId);
  const motores = await motorService.listByEmbarcacaoId(embarcacaoId);

  const motoresDetalhados = await Promise.all(
    motores.map(async (motor) => {
      const [caixaReversora, sistemaEixoHelice, correias, manutencoes] = await Promise.all([
        caixaReversoraService.getByMotorId(motor.id),
        eixoHeliceService.getByMotorId(motor.id),
        correiaService.listByMotorId(motor.id),
        manutencaoService.listByMotorId(motor.id),
      ]);
      return { ...motor, caixaReversora, sistemaEixoHelice, correias, manutencoes };
    })
  );

  const cascoPintura = await cascoPinturaService.listByEmbarcacaoId(embarcacaoId);

  return { ...embarcacao, motores: motoresDetalhados, cascoPintura };
}

module.exports = { getEmbarcacaoDetail };
