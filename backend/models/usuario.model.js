const prisma = require('./prisma');

const usuarioModel = {
  contar() {
    return prisma.usuario.count();
  },

  buscarPorFirebaseUid(firebaseUid) {
    return prisma.usuario.findUnique({ where: { firebaseUid } });
  },

  buscarPorId(id) {
    return prisma.usuario.findUnique({ where: { id } });
  },

  listar() {
    return prisma.usuario.findMany({ orderBy: { nome: 'asc' } });
  },

  criar(dados) {
    return prisma.usuario.create({ data: dados });
  },

  atualizar(id, dados) {
    return prisma.usuario.update({ where: { id }, data: dados });
  },
};

module.exports = usuarioModel;
