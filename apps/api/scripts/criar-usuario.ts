/**
 * Cria (ou redefine a senha de) um usuário diretamente no banco.
 *
 * Uso típico — conta de dono, SOMENTE LEITURA:
 *   npx ts-node scripts/criar-usuario.ts --nome "Leandro" --email leandro@dominio.com --senha "SenhaForte123"
 *
 * Apenas gerar o SQL, sem conectar no banco (rode o INSERT no console do Render):
 *   npx ts-node scripts/criar-usuario.ts --nome "Leandro" --email leandro@dominio.com --senha "SenhaForte123" --sql
 *
 * Conta ADMIN de emergência (break-glass) — exige confirmação explícita:
 *   npx ts-node scripts/criar-usuario.ts --nome "Leandro ADM" --email adm@dominio.com --senha "..." --papel ADMIN --confirmar-admin
 *
 * Redefinir a senha de um e-mail que já existe (NÃO altera papel nem status):
 *   npx ts-node scripts/criar-usuario.ts --email leandro@dominio.com --senha "NovaSenha" --redefinir-senha
 *
 * O script NUNCA apaga nem altera dados operacionais (embarcações, motores,
 * manutenções, auditorias). Ele só toca na tabela `usuario`.
 */
import * as bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

type Papel = 'ADMIN' | 'EDITOR' | 'VISUALIZADOR';
const PAPEIS_VALIDOS: Papel[] = ['ADMIN', 'EDITOR', 'VISUALIZADOR'];

function parseArgs(argv: string[]) {
  const out: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const chave = a.slice(2);
    const proximo = argv[i + 1];
    if (proximo && !proximo.startsWith('--')) {
      out[chave] = proximo;
      i++;
    } else {
      out[chave] = true;
    }
  }
  return out;
}

function erro(msg: string): never {
  console.error(`\n  ERRO: ${msg}\n`);
  process.exit(1);
}

function escaparSql(v: string): string {
  return v.replace(/'/g, "''");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const email = String(args.email || '').trim().toLowerCase();
  const senha = String(args.senha || '');
  const nome = String(args.nome || '').trim();
  const papel = String(args.papel || 'VISUALIZADOR').toUpperCase() as Papel;
  const somenteSql = Boolean(args.sql);
  const redefinirSenha = Boolean(args['redefinir-senha']);

  if (!email || !email.includes('@')) erro('informe --email valido');
  if (senha.length < 8) erro('informe --senha com pelo menos 8 caracteres');
  if (!redefinirSenha && !nome) erro('informe --nome');
  if (!PAPEIS_VALIDOS.includes(papel)) erro(`--papel deve ser um de: ${PAPEIS_VALIDOS.join(', ')}`);
  if (papel === 'ADMIN' && !args['confirmar-admin']) {
    erro('criar conta ADMIN da poder de escrita total. Se e isso mesmo, repita com --confirmar-admin');
  }

  const senhaHash = await bcrypt.hash(senha, 10);

  if (somenteSql) {
    console.log('\n-- Rode este SQL no banco de PRODUCAO (faca backup antes):');
    if (redefinirSenha) {
      console.log(
        `UPDATE usuario SET senha_hash = '${senhaHash}' WHERE email = '${escaparSql(email)}';`,
      );
    } else {
      console.log(
        `INSERT INTO usuario (nome, email, senha_hash, papel, status, criado_em)\n` +
          `VALUES ('${escaparSql(nome)}', '${escaparSql(email)}', '${senhaHash}', '${papel}', 'APROVADO', now());`,
      );
    }
    console.log('');
    return;
  }

  if (!process.env.DATABASE_URL) {
    erro('DATABASE_URL nao definida. Exporte a URL do banco alvo ou use --sql para so gerar o comando.');
  }

  const prisma = new PrismaClient();
  try {
    const existente = await prisma.usuario.findUnique({ where: { email } });

    if (existente && !redefinirSenha) {
      erro(
        `ja existe usuario com o e-mail ${email} (id ${existente.id}, papel ${existente.papel}). ` +
          'Use --redefinir-senha para trocar apenas a senha, ou escolha outro e-mail.',
      );
    }

    if (existente && redefinirSenha) {
      const atualizado = await prisma.usuario.update({
        where: { email },
        data: { senhaHash },
        select: { id: true, nome: true, email: true, papel: true, status: true },
      });
      console.log('\n  Senha redefinida (papel e status preservados):');
      console.table([atualizado]);
      return;
    }

    const criado = await prisma.usuario.create({
      data: { nome, email, senhaHash, papel, status: 'APROVADO' },
      select: { id: true, nome: true, email: true, papel: true, status: true },
    });

    console.log('\n  Usuario criado:');
    console.table([criado]);
    if (papel === 'VISUALIZADOR') {
      console.log('  Acesso SOMENTE LEITURA: o WriteGuard bloqueia qualquer POST/PUT/PATCH/DELETE.');
    } else {
      console.log('  ATENCAO: este papel PODE alterar dados do cliente.');
    }
    console.log('');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
