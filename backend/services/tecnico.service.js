const tecnicoModel = require('../models/tecnico.model');
const AppError = require('../utils/AppError');

const tecnicoService = {
  listar(filtros) {
    return tecnicoModel.listar(filtros);
  },

  async buscarPorId(id) {
    const tecnico = await tecnicoModel.buscarPorId(id);
    if (!tecnico) throw AppError.naoEncontrado('Tecnico');
    return tecnico;
  },

  criar(dados) {
    return tecnicoModel.criar(dados);
  },

  async atualizar(id, dados) {
    await tecnicoService.buscarPorId(id);
    return tecnicoModel.atualizar(id, dados);
  },

  async remover(id) {
    await tecnicoService.buscarPorId(id);

    // Tecnico com ordens nao e excluido, para preservar o historico
    // (item 4.8). A alternativa e desativar o cadastro.
    const ordens = await tecnicoModel.contarOrdens(id);

    if (ordens > 0) {
      throw AppError.conflito(
        `Este tecnico possui ${ordens} ordem(ns) de servico registrada(s) e nao pode ` +
          'ser excluido, para preservar o historico. Desative o cadastro em vez de excluir.'
      );
    }

    await tecnicoModel.remover(id);
  },
};

module.exports = tecnicoService;
