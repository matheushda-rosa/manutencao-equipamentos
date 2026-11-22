/**
 * Autenticacao.
 * Valida o ID Token do Firebase recebido em "Authorization: Bearer" e
 * carrega o usuario correspondente em req.usuario.
 */
const { verificarToken } = require('../config/firebase');
const usuarioService = require('../services/usuario.service');
const AppError = require('../utils/AppError');
const { env } = require('../config/env');

async function autenticar(req, _res, next) {
  try {
    // Atalho exclusivo de desenvolvimento (ver config/env.js).
    if (env.authDesabilitada) {
      console.warn('[auth] Requisicao aceita sem token (AUTH_DISABLED=true):', req.originalUrl);
      req.usuario = {
        id: 0,
        nome: 'Desenvolvimento',
        email: 'dev@local',
        perfil: 'ADMIN',
      };
      return next();
    }

    const cabecalho = req.headers.authorization || '';

    if (!cabecalho.startsWith('Bearer ')) {
      throw AppError.naoAutorizado('Token nao informado.');
    }

    const idToken = cabecalho.substring(7).trim();
    if (!idToken) {
      throw AppError.naoAutorizado('Token nao informado.');
    }

    const dadosToken = await verificarToken(idToken);

    req.usuario = await usuarioService.sincronizar({
      uid: dadosToken.uid,
      email: dadosToken.email,
      nome: dadosToken.name,
    });

    return next();
  } catch (erro) {
    if (erro instanceof AppError) return next(erro);

    // Erros vindos do proprio Firebase (token expirado, malformado...).
    if (erro.code && String(erro.code).startsWith('auth/')) {
      console.warn('[auth] Token rejeitado:', erro.code);
      return next(AppError.naoAutorizado('Sessao invalida ou expirada. Faca login novamente.'));
    }

    return next(erro);
  }
}

module.exports = autenticar;
