/**
 * Consultas agregadas do Dashboard (item 4.2 do enunciado).
 * Tudo e count/groupBy no PostgreSQL, em uma unica transacao, para que
 * os indicadores reflitam o mesmo instante do banco.
 */
const prisma = require('./prisma');

const STATUS_EM_ABERTO = ['ABERTA', 'EM_ANDAMENTO'];

const dashboardModel = {
  async obterIndicadores() {
    const trintaDiasAtras = new Date();
    trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);

    const [
      equipamentosTotal,
      equipamentosAtivos,
      equipamentosEmManutencao,
      equipamentosInativos,
      manutencoesPreventivas,
      manutencoesCorretivas,
      ordensAbertas,
      ordensEmAndamento,
      ordensConcluidas,
      ordensCanceladas,
      concluidasUltimos30Dias,
      porPrioridade,
      porCategoria,
      totalCategorias,
      totalLocais,
      totalTecnicos,
    ] = await prisma.$transaction([
      prisma.equipamento.count(),
      prisma.equipamento.count({ where: { status: 'ATIVO' } }),
      prisma.equipamento.count({ where: { status: 'EM_MANUTENCAO' } }),
      prisma.equipamento.count({ where: { status: 'INATIVO' } }),

      prisma.ordemServico.count({ where: { tipo: 'PREVENTIVA' } }),
      prisma.ordemServico.count({ where: { tipo: 'CORRETIVA' } }),

      prisma.ordemServico.count({ where: { status: 'ABERTA' } }),
      prisma.ordemServico.count({ where: { status: 'EM_ANDAMENTO' } }),
      prisma.ordemServico.count({ where: { status: 'CONCLUIDA' } }),
      prisma.ordemServico.count({ where: { status: 'CANCELADA' } }),

      prisma.ordemServico.count({
        where: { status: 'CONCLUIDA', dataConclusao: { gte: trintaDiasAtras } },
      }),

      // groupBy devolve a contagem por prioridade apenas das ordens em
      // aberto: e o que interessa para priorizar o trabalho do dia.
      prisma.ordemServico.groupBy({
        by: ['prioridade'],
        where: { status: { in: STATUS_EM_ABERTO } },
        _count: { _all: true },
      }),

      prisma.equipamento.groupBy({
        by: ['categoriaId'],
        _count: { _all: true },
      }),

      prisma.categoria.count(),
      prisma.local.count(),
      prisma.tecnico.count(),
    ]);

    return {
      equipamentosTotal,
      equipamentosAtivos,
      equipamentosEmManutencao,
      equipamentosInativos,
      manutencoesPreventivas,
      manutencoesCorretivas,
      ordensAbertas,
      ordensEmAndamento,
      ordensConcluidas,
      ordensCanceladas,
      concluidasUltimos30Dias,
      porPrioridade,
      porCategoria,
      totalCategorias,
      totalLocais,
      totalTecnicos,
    };
  },

  /** Ultimas ordens, para o painel de atividade recente. */
  listarUltimasOrdens(quantidade = 5) {
    return prisma.ordemServico.findMany({
      take: quantidade,
      orderBy: { dataAbertura: 'desc' },
      include: {
        equipamento: { select: { id: true, nome: true, patrimonio: true } },
        tecnico: { select: { id: true, nome: true } },
      },
    });
  },

  /** Nomes das categorias, para dar rotulo aos ids do groupBy. */
  listarNomesCategorias() {
    return prisma.categoria.findMany({ select: { id: true, nome: true } });
  },
};

module.exports = dashboardModel;
