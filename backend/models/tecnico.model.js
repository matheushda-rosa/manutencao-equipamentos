const prisma = require('./prisma');

const tecnicoModel = {
  async listar({ busca, pagina, limite }) {
    const where = busca
      ? {
          OR: [
            { nome: { contains: busca, mode: 'insensitive' } },
            { especialidade: { contains: busca, mode: 'insensitive' } },
            { email: { contains: busca, mode: 'insensitive' } },
          ],
        }
      : {};

    const [dados, total] = await prisma.$transaction([
      prisma.tecnico.findMany({
        where,
        orderBy: { nome: 'asc' },
        skip: (pagina - 1) * limite,
        take: limite,
        include: { _count: { select: { ordens: true } } },
      }),
      prisma.tecnico.count({ where }),
    ]);

    return { dados, total };
  },

  buscarPorId(id) {
    return prisma.tecnico.findUnique({
      where: { id },
      include: { _count: { select: { ordens: true } } },
    });
  },

  criar(dados) {
    return prisma.tecnico.create({ data: dados });
  },

  atualizar(id, dados) {
    return prisma.tecnico.update({ where: { id }, data: dados });
  },

  remover(id) {
    return prisma.tecnico.delete({ where: { id } });
  },

  contarOrdens(id) {
    return prisma.ordemServico.count({ where: { tecnicoId: id } });
  },
};

module.exports = tecnicoModel;
