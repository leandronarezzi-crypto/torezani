const jwt = require('jsonwebtoken');
const HttpError = require('../utils/HttpError');
const authService = require('../services/authService');
const asyncHandler = require('../utils/asyncHandler');

const COOKIE_NAME = 'token';
const TOKEN_TTL = '7d';

function signToken(usuario) {
  return jwt.sign({ sub: usuario.id }, process.env.JWT_SECRET, { expiresIn: TOKEN_TTL });
}

function setAuthCookie(res, usuario) {
  res.cookie(COOKIE_NAME, signToken(usuario), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME);
}

const authGuard = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) throw new HttpError(401, 'Não autenticado');

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new HttpError(401, 'Sessão expirada, faça login novamente');
  }

  const usuario = await authService.getUsuarioById(payload.sub);
  if (usuario.status !== 'APROVADO') throw new HttpError(403, 'Seu acesso ainda não foi liberado');
  req.user = usuario;
  next();
});

function writeGuard(req, res, next) {
  const readOnlyMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (readOnlyMethods.includes(req.method)) return next();
  if (req.user.papel === 'VISUALIZADOR') {
    return next(new HttpError(403, 'Seu acesso é somente leitura'));
  }
  next();
}

function requireAdmin(req, res, next) {
  if (req.user.papel !== 'ADMIN') return next(new HttpError(403, 'Apenas administradores podem acessar isto'));
  next();
}

module.exports = { authGuard, writeGuard, requireAdmin, setAuthCookie, clearAuthCookie };
