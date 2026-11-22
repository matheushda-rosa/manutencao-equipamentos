/**
 * Regras de negocio de Equipamentos.
 * A foto vive no Supabase Storage e o registro no banco. Como o banco
 * nao faz rollback de arquivo, cada operacao trata explicitamente a
 * falha parcial entre os dois lados.
 */
const { equipamentoModel } = require('../models/equipamento.model');
const categoriaModel = require('../models/categoria.model');
const localModel = require('../models/local.model');
const storageService = require('./storage.service');
const AppError = require('../utils/AppError');

/**
 * Confere se categoria e local informados existem, para devolver erro de
 * campo em vez de violacao de chave estrangeira.
 */
async function validarVinculos({ categoriaId, localId }) {
  if (categoriaId !== undefined) {
    const categoria = await categoriaModel.buscarPorId(categoriaId);
    if (!categoria) throw new AppError('Categoria informada nao existe.', 400);
  }

  if (localId !== undefined) {
    const local = await localModel.buscarPorId(localId);
    if (!local) throw new AppError('Local informado nao existe.', 400);
  }
}

const equipamentoService = {
  listar(filtros) {
    return equipamentoModel.listar(filtros);
  },

  async buscarPorId(id) {
    const equipamento = await equipamentoModel.buscarPorId(id);
    if (!equipamento) throw AppError.naoEncontrado('Equipamento');
    return equipamento;
  },

  async criar(dados, arquivo) {
    await validarVinculos(dados);

    let foto = null;

    if (arquivo) {
      foto = await storageService.enviarFoto(arquivo);
    }

    try {
      return await equipamentoModel.criar({
        ...dados,
        fotoUrl: foto?.url,
        fotoPath: foto?.caminho,
      });
    } catch (erro) {
      // Registro nao criado apos o upload: remove a foto orfa.
      if (foto) {
        console.warn('[equipamentos] Criacao falhou, revertendo upload da foto.');
        await storageService.removerFoto(foto.caminho);
      }
      throw erro;
    }
  },

  async atualizar(id, dados, arquivo) {
    const atual = await equipamentoService.buscarPorId(id);
    await validarVinculos(dados);

    let foto = null;

    if (arquivo) {
      foto = await storageService.enviarFoto(arquivo);
    }

    try {
      const atualizado = await equipamentoModel.atualizar(id, {
        ...dados,
        ...(foto ? { fotoUrl: foto.url, fotoPath: foto.caminho } : {}),
      });

      // A foto antiga so sai depois que o banco confirma a troca.
      if (foto && atual.fotoPath) {
        await storageService.removerFoto(atual.fotoPath);
      }

      return atualizado;
    } catch (erro) {
      if (foto) {
        console.warn('[equipamentos] Atualizacao falhou, revertendo upload da foto.');
        await storageService.removerFoto(foto.caminho);
      }
      throw erro;
    }
  },

  async remover(id) {
    const equipamento = await equipamentoService.buscarPorId(id);

    // Equipamento com ordens nao e excluido, para preservar o
    // historico. A alternativa e marca-lo como INATIVO.
    const ordens = await equipamentoModel.contarOrdens(id);

    if (ordens > 0) {
      throw AppError.conflito(
        `Este equipamento possui ${ordens} ordem(ns) de servico no historico e nao pode ` +
          'ser excluido. Altere o status para INATIVO para retira-lo de operacao.'
      );
    }

    await equipamentoModel.remover(id);
    await storageService.removerFoto(equipamento.fotoPath);
  },

  /** Historico de manutencoes do equipamento (item 4.8). */
  async historico(id) {
    const equipamento = await equipamentoService.buscarPorId(id);
    const ordens = await equipamentoModel.listarHistorico(id);

    const concluidas = ordens.filter((ordem) => ordem.status === 'CONCLUIDA');

    return {
      equipamento,
      ordens,
      resumo: {
        total: ordens.length,
        concluidas: concluidas.length,
        emAberto: ordens.filter((ordem) =>
          ['ABERTA', 'EM_ANDAMENTO'].includes(ordem.status)
        ).length,
        preventivas: ordens.filter((ordem) => ordem.tipo === 'PREVENTIVA').length,
        corretivas: ordens.filter((ordem) => ordem.tipo === 'CORRETIVA').length,
        ultimaManutencao: concluidas[0]?.dataConclusao ?? null,
      },
    };
  },
};

module.exports = equipamentoService;
