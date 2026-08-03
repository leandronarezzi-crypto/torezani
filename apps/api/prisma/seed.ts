import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const senhaHash = await bcrypt.hash('torezani123', 10);
  await prisma.usuario.upsert({
    where: { email: 'admin@torezani.com.br' },
    update: {},
    create: {
      nome: 'Administrador',
      email: 'admin@torezani.com.br',
      senhaHash,
      papel: 'ADMIN',
      status: 'APROVADO',
    },
  });
  console.log('Usuário admin@torezani.com.br / torezani123 disponível (dev).');

  const lancha = await prisma.embarcacao.create({
    data: { nome: 'Lancha Teste', tipoConfiguracao: 'BIMOTOR' },
  });

  const motorBB = await prisma.motor.create({
    data: {
      embarcacaoId: lancha.id,
      posicao: 'BORE_BABOR',
      marca: 'Volvo Penta',
      modelo: 'D6-400',
      potenciaConfig: '400HP',
      numSerie: 'VP-BB-1001',
      horimetroAtual: 210,
    },
  });
  const motorES = await prisma.motor.create({
    data: {
      embarcacaoId: lancha.id,
      posicao: 'ESTIBORDO',
      marca: 'Volvo Penta',
      modelo: 'D6-400',
      potenciaConfig: '400HP',
      numSerie: 'VP-ES-1002',
      horimetroAtual: 205,
    },
  });

  for (const motor of [motorBB, motorES]) {
    await prisma.caixaReversora.create({
      data: { motorId: motor.id, marca: 'ZF Marine', modelo: 'ZF63A', ratio: '2.48:1' },
    });
    await prisma.sistemaEixoHelice.create({
      data: {
        motorId: motor.id,
        diametroHelice: '22"',
        passoHelice: '24"',
        numPas: 4,
        diametroEixo: '1.75"',
        grauCone: '12',
        comprimentoCone: '3.5"',
      },
    });
    await prisma.correia.create({
      data: { motorId: motor.id, funcaoAplicacao: 'Alternador', especificacaoTamanho: 'A-45', quantidade: 1 },
    });
  }

  await prisma.manutencaoPreventiva.createMany({
    data: [
      { motorId: motorBB.id, tipoServico: 'OLEO_MOTOR', horimetroUltimaTroca: 0, intervaloHoras: 250, alertaLimiteHoras: 50 },
      { motorId: motorBB.id, tipoServico: 'FILTRO_DIESEL', horimetroUltimaTroca: 0, intervaloHoras: 500, alertaLimiteHoras: 50 },
      { motorId: motorES.id, tipoServico: 'OLEO_MOTOR', horimetroUltimaTroca: 0, intervaloHoras: 250, alertaLimiteHoras: 50 },
    ],
  });

  const onzeMesesAtras = new Date();
  onzeMesesAtras.setMonth(onzeMesesAtras.getMonth() - 11);
  const em20Dias = new Date();
  em20Dias.setDate(em20Dias.getDate() + 20);

  await prisma.manutencaoCascoPintura.create({
    data: {
      embarcacaoId: lancha.id,
      tipoIntervencao: 'PINTURA',
      dataExecucao: onzeMesesAtras,
      horimetroEmbarcacao: 180,
      esquemaProdutos: 'Tinta anti-incrustante Sea Hawk',
      historicoObservacoes: 'Aplicação padrão, sem intercorrências',
      alertaVencimentoData: em20Dias,
    },
  });

  const barco = await prisma.embarcacao.create({
    data: { nome: 'Barco Pequeno', tipoConfiguracao: 'MONOMOTOR' },
  });
  const motorMono = await prisma.motor.create({
    data: {
      embarcacaoId: barco.id,
      posicao: 'MONO',
      marca: 'Yanmar',
      modelo: '4JH80',
      potenciaConfig: '80HP',
      numSerie: 'YM-MONO-2001',
      horimetroAtual: 95,
    },
  });
  await prisma.manutencaoPreventiva.create({
    data: { motorId: motorMono.id, tipoServico: 'OLEO_MOTOR', horimetroUltimaTroca: 50, intervaloHoras: 100, alertaLimiteHoras: 20 },
  });

  console.log('Dados de exemplo inseridos com sucesso.');
}

main()
  .catch((err) => {
    console.error('Falha ao inserir dados de exemplo:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
