/**
 * Tratamento centralizado de erros.
 * Erros previstos viram 4xx com mensagem; erros inesperados viram 500
 * generico, com os detalhes apenas no log do servidor.
 */
const AppError = require('../utils/AppError');
const { env } = require('../config/env');

function rotaNaoEncontrada(req, res) {
  console.warn('[404]', req.method, req.originalUrl);
  return res.status(404).json({
    sucesso: false,
    mensagem: `Rota nao encontrada: ${req.method} ${req.originalUrl}`,
  });
}

/**
 * Traduz os codigos de erro do Prisma.
 * https://www.prisma.io/docs/orm/reference/error-reference
 */
function traduzirErroPrisma(erro) {
  switch (erro.code) {
    case 'P2002': {
      // Violacao de restricao UNIQUE.
      const campos = Array.isArray(erro.meta?.target)
        ? erro.meta.target.join(', ')
        : erro.meta?.target || 'campo';
      return new AppError(`Ja existe um registro com este valor (${campos}).`, 409);
    }
    case 'P2003':
      // Violacao de chave estrangeira.
      return new AppError(
        'Registro relacionado invalido ou inexistente. Verifique os vinculos informados.',
        400
      );
    case 'P2025':
      return new AppError('Registro nao encontrado.', 404);
    case 'P2014':
      return new AppError(
        'Nao e possivel concluir: existem registros vinculados a este item.',
        409
      );
    default:
      return null;
  }
}

// O Express identifica o middleware de erro pela assinatura de 4
// parametros, entao "next" precisa existir mesmo sem uso.
// eslint-disable-next-line no-unused-vars
function tratarErros(erro, req, res, next) {
  let erroTratado = erro;

  if (!erro.ehEsperado && erro.code && String(erro.code).startsWith('P2')) {
    erroTratado = traduzirErroPrisma(erro) || erro;
  }

  if (erroTratado instanceof AppError || erroTratado.ehEsperado) {
    // Erro previsto: 4xx. Logamos como aviso, nao como falha.
    console.warn(
      `[erro ${erroTratado.status}] ${req.method} ${req.originalUrl} -> ${erroTratado.message}`
    );

    return res.status(erroTratado.status || 400).json({
      sucesso: false,
      mensagem: erroTratado.message,
      ...(erroTratado.detalhes ? { detalhes: erroTratado.detalhes } : {}),
    });
  }

  // Erro inesperado: registra tudo no servidor e responde generico.
  console.error(`[erro 500] ${req.method} ${req.originalUrl}`);
  console.error(erro);

  return res.status(500).json({
    sucesso: false,
    mensagem: 'Erro interno do servidor. Tente novamente em instantes.',
    ...(env.ehProducao ? {} : { erro: erro.message }),
  });
}

module.exports = { rotaNaoEncontrada, tratarErros };
