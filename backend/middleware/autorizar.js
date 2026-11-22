/**
 * Autorizacao por perfil (item 4.10 do enunciado).
 * Uso: router.post('/', autorizar('ADMIN'), controller.criar)
 */
const AppError = require('../utils/AppError');

function autorizar(...perfisPermitidos) {
  return (req, _res, next) => {
    if (!req.usuario) {
      return next(AppError.naoAutorizado());
    }

    if (!perfisPermitidos.includes(req.usuario.perfil)) {
      console.warn(
        `[auth] Acesso negado: ${req.usuario.email} (${req.usuario.perfil}) tentou ` +
          `${req.method} ${req.originalUrl}`
      );
      return next(
        AppError.acessoNegado(
          'Esta acao e restrita ao perfil: ' + perfisPermitidos.join(' ou ') + '.'
        )
      );
    }

    return next();
  };
}

module.exports = autorizar;
