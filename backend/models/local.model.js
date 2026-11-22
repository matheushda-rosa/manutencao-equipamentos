const prisma = require('./prisma');

const localModel = {
  async listar({ busca, pagina, limite }) {
    // OR: a busca procura no nome, na cidade e no bairro ao mesmo tempo.
    const where = busca
      ? {
          OR: [
            { nome: { contains: busca, mode: 'insensitive' } },
            { cidade: { contains: busca, mode: 'insensitive' } },
            { bairro: { contains: busca, mode: 'insensitive' } },
          ],
        }
      : {};

    const [dados, total] = await prisma.$transaction([
      prisma.local.findMany({
        where,
        orderBy: { nome: 'asc' },
        skip: (pagina - 1) * limite,
        take: limite,
        include: { _count: { select: { equipamentos: true } } },
      }),
      prisma.local.count({ where }),
    ]);

    return { dados, total };
  },

  buscarPorId(id) {
    return prisma.local.findUnique({
      where: { id },
      include: { _count: { select: { equipamentos: true } } },
    });
  },

  criar(dados) {
    return prisma.local.create({ data: dados });
  },

  atualizar(id, dados) {
    return prisma.local.update({ where: { id }, data: dados });
  },

  remover(id) {
    return prisma.local.delete({ where: { id } });
  },

  contarEquipamentos(id) {
    return prisma.equipamento.count({ where: { localId: id } });
  },
};

module.exports = localModel;
