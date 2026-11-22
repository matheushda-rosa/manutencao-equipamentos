const localModel = require('../models/local.model');
const AppError = require('../utils/AppError');

const localService = {
  listar(filtros) {
    return localModel.listar(filtros);
  },

  async buscarPorId(id) {
    const local = await localModel.buscarPorId(id);
    if (!local) throw AppError.naoEncontrado('Local');
    return local;
  },

  criar(dados) {
    // O endereco chega preenchido pelo ViaCEP na tela, mas e validado
    // aqui tambem: a API pode ser chamada sem passar pelo formulario.
    return localModel.criar(dados);
  },

  async atualizar(id, dados) {
    await localService.buscarPorId(id);
    return localModel.atualizar(id, dados);
  },

  async remover(id) {
    await localService.buscarPorId(id);

    const vinculados = await localModel.contarEquipamentos(id);

    if (vinculados > 0) {
      throw AppError.conflito(
        `Este local possui ${vinculados} equipamento(s) vinculado(s). ` +
          'Transfira esses equipamentos antes de excluir o local.'
      );
    }

    await localModel.remover(id);
  },
};

module.exports = localService;
