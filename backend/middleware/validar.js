/**
 * Validacao de dados com Zod.
 * O resultado validado substitui req[origem], ja com os tipos
 * convertidos - tudo que chega por HTTP chega como texto.
 */
const AppError = require('../utils/AppError');

function validar(esquema, origem = 'body') {
  return (req, _res, next) => {
    const resultado = esquema.safeParse(req[origem]);

    if (!resultado.success) {
      const detalhes = resultado.error.issues.map((problema) => ({
        campo: problema.path.join('.') || origem,
        mensagem: problema.message,
      }));

      console.warn('[validacao] Dados invalidos em', req.originalUrl, detalhes);

      return next(new AppError('Dados invalidos.', 400, detalhes));
    }

    req[origem] = resultado.data;
    return next();
  };
}

module.exports = validar;
