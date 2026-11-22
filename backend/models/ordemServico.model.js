const prisma = require('./prisma');

const inclusaoPadrao = {
  equipamento: {
    select: {
      id: true,
      nome: true,
      patrimonio: true,
      status: true,
      fotoUrl: true,
      categoria: { select: { nome: true } },
      local: { select: { nome: true } },
    },
  },
  tecnico: { select: { id: true, nome: true, especialidade: true } },
};

const ordemServicoModel = {
  async listar({ busca, status, tipo, prioridade, equipamentoId, tecnicoId, pagina, limite }) {
    const where = {
      ...(status ? { status } : {}),
      ...(tipo ? { tipo } : {}),
      ...(prioridade ? { prioridade } : {}),
      ...(equipamentoId ? { equipamentoId } : {}),
      ...(tecnicoId ? { tecnicoId } : {}),
      ...(busca
        ? {
            OR: [
              { descricao: { contains: busca, mode: 'insensitive' } },
              { equipamento: { nome: { contains: busca, mode: 'insensitive' } } },
              { equipamento: { patrimonio: { contains: busca, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const [dados, total] = await prisma.$transaction([
      prisma.ordemServico.findMany({
        where,
        // Em aberto primeiro (ordem do enum), depois da mais recente.
        orderBy: [{ status: 'asc' }, { dataAbertura: 'desc' }],
        skip: (pagina - 1) * limite,
        take: limite,
        include: inclusaoPadrao,
      }),
      prisma.ordemServico.count({ where }),
    ]);

    return { dados, total };
  },

  buscarPorId(id) {
    return prisma.ordemServico.findUnique({ where: { id }, include: inclusaoPadrao });
  },

  criar(dados) {
    return prisma.ordemServico.create({ data: dados, include: inclusaoPadrao });
  },

  atualizar(id, dados) {
    return prisma.ordemServico.update({ where: { id }, data: dados, include: inclusaoPadrao });
  },
};

module.exports = { ordemServicoModel, inclusaoPadrao };
