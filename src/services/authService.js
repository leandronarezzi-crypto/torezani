const bcrypt = require('bcryptjs');
const pool = require('../db/pool');
const HttpError = require('../utils/HttpError');

const PAPEIS_VALIDOS = ['ADMIN', 'EDITOR', 'VISUALIZADOR'];
const STATUS_VALIDOS = ['PENDENTE', 'APROVADO', 'REJEITADO'];

const USER_FIELDS = 'id, nome, email, papel, status, criado_em';

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

async function registrar({ nome, email, senha }) {
  if (!nome || !nome.trim()) throw new HttpError(400, 'Nome é obrigatório');
  const emailNorm = normalizeEmail(email);
  if (!emailNorm || !emailNorm.includes('@')) throw new HttpError(400, 'E-mail inválido');
  if (!senha || senha.length < 6) throw new HttpError(400, 'Senha deve ter ao menos 6 caracteres');

  const { rows: existentes } = await pool.query('SELECT id FROM usuario WHERE email = $1', [emailNorm]);
  if (existentes[0]) throw new HttpError(409, 'Já existe uma conta com este e-mail');

  const { rows: totalRows } = await pool.query('SELECT count(*)::int AS total FROM usuario');
  const isPrimeiroUsuario = totalRows[0].total === 0;

  const senhaHash = await bcrypt.hash(senha, 10);
  const papel = isPrimeiroUsuario ? 'ADMIN' : 'VISUALIZADOR';
  const status = isPrimeiroUsuario ? 'APROVADO' : 'PENDENTE';

  const { rows: [usuario] } = await pool.query(
    `INSERT INTO usuario (nome, email, senha_hash, papel, status) VALUES ($1, $2, $3, $4, $5)
     RETURNING ${USER_FIELDS}`,
    [nome.trim(), emailNorm, senhaHash, papel, status]
  );
  return usuario;
}

async function autenticar({ email, senha }) {
  const emailNorm = normalizeEmail(email);
  const { rows } = await pool.query('SELECT * FROM usuario WHERE email = $1', [emailNorm]);
  const usuario = rows[0];
  if (!usuario) throw new HttpError(401, 'E-mail ou senha inválidos');

  const senhaOk = await bcrypt.compare(senha || '', usuario.senha_hash);
  if (!senhaOk) throw new HttpError(401, 'E-mail ou senha inválidos');

  if (usuario.status === 'PENDENTE') throw new HttpError(403, 'Sua conta ainda não foi liberada pelo administrador');
  if (usuario.status === 'REJEITADO') throw new HttpError(403, 'Seu acesso foi recusado pelo administrador');

  delete usuario.senha_hash;
  return usuario;
}

async function getUsuarioById(id) {
  const { rows } = await pool.query(`SELECT ${USER_FIELDS} FROM usuario WHERE id = $1`, [id]);
  if (!rows[0]) throw new HttpError(401, 'Sessão inválida');
  return rows[0];
}

async function listUsuarios() {
  const { rows } = await pool.query(`SELECT ${USER_FIELDS} FROM usuario ORDER BY status = 'PENDENTE' DESC, criado_em DESC`);
  return rows;
}

async function atualizarUsuario(id, { papel, status, nome, email, senha }) {
  if (papel && !PAPEIS_VALIDOS.includes(papel)) throw new HttpError(400, 'Papel inválido');
  if (status && !STATUS_VALIDOS.includes(status)) throw new HttpError(400, 'Status inválido');
  if (nome !== undefined && !nome.trim()) throw new HttpError(400, 'Nome é obrigatório');
  if (senha !== undefined && senha !== '' && senha.length < 6) {
    throw new HttpError(400, 'Senha deve ter ao menos 6 caracteres');
  }

  const atual = await getUsuarioById(id);

  let emailNorm = atual.email;
  if (email !== undefined) {
    emailNorm = normalizeEmail(email);
    if (!emailNorm || !emailNorm.includes('@')) throw new HttpError(400, 'E-mail inválido');
    if (emailNorm !== atual.email) {
      const { rows: existentes } = await pool.query('SELECT id FROM usuario WHERE email = $1 AND id <> $2', [emailNorm, id]);
      if (existentes[0]) throw new HttpError(409, 'Já existe uma conta com este e-mail');
    }
  }

  const novoNome = nome !== undefined ? nome.trim() : atual.nome;
  const novoPapel = papel || atual.papel;
  const novoStatus = status || atual.status;
  const novaSenhaHash = senha ? await bcrypt.hash(senha, 10) : null;

  const { rows } = await pool.query(
    `UPDATE usuario
     SET nome = $1, email = $2, papel = $3, status = $4,
         senha_hash = COALESCE($5, senha_hash)
     WHERE id = $6 RETURNING ${USER_FIELDS}`,
    [novoNome, emailNorm, novoPapel, novoStatus, novaSenhaHash, id]
  );
  return rows[0];
}

module.exports = { registrar, autenticar, getUsuarioById, listUsuarios, atualizarUsuario };
