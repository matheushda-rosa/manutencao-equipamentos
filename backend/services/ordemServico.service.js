/**
 * Regras de negocio das Ordens de Servico.
 *
 * Duas regras centrais:
 *
 * 1) Maquina de estados: CONCLUIDA e CANCELADA sao estados finais.
 *
 * 2) O status do equipamento e consequencia das ordens dele - existe
 *    ordem ABERTA ou EM_ANDAMENTO, entao o equipamento esta
 *    EM_MANUTENCAO. As duas escritas acontecem na mesma transacao, e o
 *    status e recalculado a partir da contagem real de ordens abertas.
 */
const prisma = require('../models/prisma');
const { ordemServicoModel, inclusaoPadrao } = require('../models/ordemServico.model');
const AppError = require('../utils/AppError');

/** Transicoes permitidas a partir de cada status. */
const TRANSICOES_PERMITIDAS = {
  ABERTA: ['EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA'],
  EM_ANDAMENTO: ['CONCLUIDA', 'CANCELADA'],
  CONCLUIDA: [], // estado final
  CANCELADA: [], // estado final
};

const STATUS_EM_ABERTO = ['ABERTA', 'EM_ANDAMENTO'];

const ROTULOS_STATUS = {
  ABERTA: 'Aberta',
  EM_ANDAMENTO: 'Em andamento',
  CONCLUIDA: 'Concluida',
  CANCELADA: 'Cancelada',
};

/**
 * Recalcula o status do equipamento a partir das ordens dele.
 * Recebe o cliente da transacao (tx), nao o prisma global.
 */
async function recalcularStatusEquipamento(tx, equipamentoId) {
  const equipamento = await tx.equipamento.findUnique({ where: { id: equipamentoId } });
  if (!equipamento) return;

  // INATIVO e uma decisao administrativa (equipamento baixado, fora de
  // operacao). As ordens de servico nao devem sobrescrever isso.
  if (equipamento.status === 'INATIVO') return;

  const ordensEmAberto = await tx.ordemServico.count({
    where: { equipamentoId, status: { in: STATUS_EM_ABERTO } },
  });

  const novoStatus = ordensEmAberto > 0 ? 'EM_MANUTENCAO' : 'ATIVO';

  if (novoStatus !== equipamento.status) {
    await tx.equipamento.update({
      where: { id: equipamentoId },
      data: { status: novoStatus },
    });

    console.log(
      `[ordens] Equipamento ${equipamento.patrimonio}: ${equipamento.status} -> ${novoStatus}`
    );
  }
}

const ordemServicoService = {
  listar(filtros) {
    return ordemServicoModel.listar(filtros);
  },

  async buscarPorId(id) {
    const ordem = await ordemServicoModel.buscarPorId(id);
    if (!ordem) throw AppError.naoEncontrado('Ordem de servico');
    return ordem;
  },

  async abrir(dados) {
    return prisma.$transaction(async (tx) => {
      const equipamento = await tx.equipamento.findUnique({
        where: { id: dados.equipamentoId },
      });

      if (!equipamento) {
        throw new AppError('Equipamento informado nao existe.', 400);
      }

      if (equipamento.status === 'INATIVO') {
        throw AppError.conflito(
          'Este equipamento esta INATIVO. Reative-o antes de abrir uma ordem de servico.'
        );
      }

      const tecnico = await tx.tecnico.findUnique({ where: { id: dados.tecnicoId } });

      if (!tecnico) {
        throw new AppError('Tecnico informado nao existe.', 400);
      }

      if (!tecnico.ativo) {
        throw AppError.conflito('Este tecnico esta inativo e nao pode receber ordens.');
      }

      const criada = await tx.ordemServico.create({ data: dados });

      await recalcularStatusEquipamento(tx, dados.equipamentoId);

      // Recarrega a ordem ja com o equipamento no status atualizado,
      // para a tela nao mostrar o valor antigo.
      return tx.ordemServico.findUnique({ where: { id: criada.id }, include: inclusaoPadrao });
    });
  },

  /** Edicao dos dados descritivos (nao mexe no status). */
  async atualizar(id, dados) {
    const ordem = await ordemServicoService.buscarPorId(id);

    if (['CONCLUIDA', 'CANCELADA'].includes(ordem.status)) {
      throw AppError.conflito(
        `Esta ordem esta ${ROTULOS_STATUS[ordem.status].toLowerCase()} e nao pode mais ser editada.`
      );
    }

    if (dados.tecnicoId) {
      const tecnico = await prisma.tecnico.findUnique({ where: { id: dados.tecnicoId } });
      if (!tecnico) throw new AppError('Tecnico informado nao existe.', 400);
    }

    return ordemServicoModel.atualizar(id, dados);
  },

  /** Alteracao de status, com validacao da transicao. */
  async alterarStatus(id, novoStatus, solucao) {
    return prisma.$transaction(async (tx) => {
      const ordem = await tx.ordemServico.findUnique({ where: { id } });
      if (!ordem) throw AppError.naoEncontrado('Ordem de servico');

      if (ordem.status === novoStatus) {
        throw AppError.conflito(
          `A ordem ja esta com o status "${ROTULOS_STATUS[novoStatus]}".`
        );
      }

      const permitidas = TRANSICOES_PERMITIDAS[ordem.status] || [];

      if (!permitidas.includes(novoStatus)) {
        throw AppError.conflito(
          `Nao e possivel mudar de "${ROTULOS_STATUS[ordem.status]}" para ` +
            `"${ROTULOS_STATUS[novoStatus]}".` +
            (permitidas.length
              ? ` Transicoes possiveis: ${permitidas.map((s) => ROTULOS_STATUS[s]).join(', ')}.`
              : ' Esta ordem esta encerrada.')
        );
      }

      const dados = { status: novoStatus };

      if (novoStatus === 'CONCLUIDA') {
        dados.solucao = solucao;
        // Data de conclusao definida pelo servidor, nao pelo cliente.
        dados.dataConclusao = new Date();
      }

      await tx.ordemServico.update({ where: { id }, data: dados });

      await recalcularStatusEquipamento(tx, ordem.equipamentoId);

      console.log(`[ordens] OS #${id}: ${ordem.status} -> ${novoStatus}`);

      return tx.ordemServico.findUnique({ where: { id }, include: inclusaoPadrao });
    });
  },

  /** Atalho de conclusao: equivale a alterarStatus com CONCLUIDA. */
  concluir(id, solucao) {
    return ordemServicoService.alterarStatus(id, 'CONCLUIDA', solucao);
  },
};

module.exports = { ordemServicoService, TRANSICOES_PERMITIDAS };
