const prisma = require('./prisma');

// Reaproveitado nas consultas: traz categoria e local junto, para a tela
// nao precisar de uma requisicao extra para cada nome.
const inclusaoPadrao = {
  categoria: { select: { id: true, nome: true } },
  local: { select: { id: true, nome: true, cidade: true, uf: true } },
};

const equipamentoModel = {
  async listar({ busca, status, categoriaId, localId, pagina, limite }) {
    const where = {
      ...(status ? { status } : {}),
      ...(categoriaId ? { categoriaId } : {}),
      ...(localId ? { localId } : {}),
      ...(busca
        ? {
            OR: [
              { nome: { contains: busca, mode: 'insensitive' } },
              { patrimonio: { contains: busca, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [dados, total] = await prisma.$transaction([
      prisma.equipamento.findMany({
        where,
        orderBy: { nome: 'asc' },
        skip: (pagina - 1) * limite,
        take: limite,
        include: { ...inclusaoPadrao, _count: { select: { ordens: true } } },
      }),
      prisma.equipamento.count({ where }),
    ]);

    return { dados, total };
  },

  buscarPorId(id) {
    return prisma.equipamento.findUnique({
      where: { id },
      include: { ...inclusaoPadrao, _count: { select: { ordens: true } } },
    });
  },

  criar(dados) {
    return prisma.equipamento.create({ data: dados, include: inclusaoPadrao });
  },

  atualizar(id, dados) {
    return prisma.equipamento.update({
      where: { id },
      data: dados,
      include: inclusaoPadrao,
    });
  },

  remover(id) {
    return prisma.equipamento.delete({ where: { id } });
  },

  /**
   * Historico de manutencoes do equipamento (item 4.8 do enunciado).
   * Mais recente primeiro.
   */
  listarHistorico(id) {
    return prisma.ordemServico.findMany({
      where: { equipamentoId: id },
      orderBy: { dataAbertura: 'desc' },
      include: {
        tecnico: { select: { id: true, nome: true, especialidade: true } },
      },
    });
  },

  contarOrdens(id) {
    return prisma.ordemServico.count({ where: { equipamentoId: id } });
  },
};

module.exports = { equipamentoModel, inclusaoPadrao };
