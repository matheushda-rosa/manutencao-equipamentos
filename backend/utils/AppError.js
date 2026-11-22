/**
 * Erro de aplicacao: falha prevista, com codigo HTTP conhecido
 * (400 dado invalido, 404 nao encontrado, 409 conflito).
 * O middleware de erros usa isso para distinguir de falha inesperada.
 */
class AppError extends Error {
  constructor(mensagem, status = 400, detalhes = null) {
    super(mensagem);
    this.name = 'AppError';
    this.status = status;
    this.detalhes = detalhes;
    // Marca usada pelo middleware de erros para distinguir os dois casos.
    this.ehEsperado = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static naoEncontrado(recurso = 'Registro') {
    return new AppError(`${recurso} nao encontrado.`, 404);
  }

  static conflito(mensagem) {
    return new AppError(mensagem, 409);
  }

  static naoAutorizado(mensagem = 'Autenticacao necessaria.') {
    return new AppError(mensagem, 401);
  }

  static acessoNegado(mensagem = 'Voce nao tem permissao para esta acao.') {
    return new AppError(mensagem, 403);
  }
}

module.exports = AppError;
