const prisma = require('./prisma');

const categoriaModel = {
  /**
   * Lista com busca por nome e paginacao.
   * mode: 'insensitive' ignora maiusculas e minusculas.
   */
  async listar({ busca, pagina, limite }) {
    const where = busca
      ? { nome: { contains: busca, mode: 'insensitive' } }
      : {};

    // Pagina e total na mesma transacao, para nao divergirem.
    const [dados, total] = await prisma.$transaction([
      prisma.categoria.findMany({
        where,
        orderBy: { nome: 'asc' },
        skip: (pagina - 1) * limite,
        take: limite,
        include: {
          // _count traz a quantidade de equipamentos sem carregar todos
          // eles: uma consulta agregada no banco, nao um laco no Node.
          _count: { select: { equipamentos: true } },
        },
      }),
      prisma.categoria.count({ where }),
    ]);

    return { dados, total };
  },

  buscarPorId(id) {
    return prisma.categoria.findUnique({
      where: { id },
      include: { _count: { select: { equipamentos: true } } },
    });
  },

  criar(dados) {
    return prisma.categoria.create({ data: dados });
  },

  atualizar(id, dados) {
    return prisma.categoria.update({ where: { id }, data: dados });
  },

  remover(id) {
    return prisma.categoria.delete({ where: { id } });
  },

  contarEquipamentos(id) {
    return prisma.equipamento.count({ where: { categoriaId: id } });
  },
};

module.exports = categoriaModel;
