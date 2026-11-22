const categoriaModel = require('../models/categoria.model');
const AppError = require('../utils/AppError');

const categoriaService = {
  listar(filtros) {
    return categoriaModel.listar(filtros);
  },

  async buscarPorId(id) {
    const categoria = await categoriaModel.buscarPorId(id);
    if (!categoria) throw AppError.naoEncontrado('Categoria');
    return categoria;
  },

  criar(dados) {
    // A unicidade do nome e garantida pela restricao UNIQUE: o Prisma
    // lanca P2002 e o middleware de erros traduz para 409. Verificar
    // antes com findFirst abriria uma condicao de corrida.
    return categoriaModel.criar(dados);
  },

  async atualizar(id, dados) {
    await categoriaService.buscarPorId(id);
    return categoriaModel.atualizar(id, dados);
  },

  async remover(id) {
    await categoriaService.buscarPorId(id);

    // Categoria em uso nao e excluida: a checagem antecipa a violacao
    // de chave estrangeira com uma mensagem util.
    const vinculados = await categoriaModel.contarEquipamentos(id);

    if (vinculados > 0) {
      throw AppError.conflito(
        `Esta categoria possui ${vinculados} equipamento(s) vinculado(s). ` +
          'Altere a categoria desses equipamentos antes de excluir.'
      );
    }

    await categoriaModel.remover(id);
  },
};

module.exports = categoriaService;
