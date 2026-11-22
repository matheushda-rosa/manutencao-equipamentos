const usuarioModel = require('../models/usuario.model');
const AppError = require('../utils/AppError');

const usuarioService = {
  /**
   * Espelha no banco o usuario autenticado pelo Firebase.
   *
   * O Firebase guarda e-mail e senha; o perfil (ADMIN/TECNICO) e o
   * vinculo com as demais tabelas ficam aqui.
   *
   * Se a tabela esta vazia, o primeiro acesso recebe o perfil ADMIN -
   * sem isso nao haveria ninguem para promover o primeiro administrador.
   * Os seguintes entram como TECNICO.
   */
  async sincronizar({ uid, email, nome }) {
    const existente = await usuarioModel.buscarPorFirebaseUid(uid);

    if (existente) {
      if (!existente.ativo) {
        throw AppError.acessoNegado('Usuario desativado. Procure um administrador.');
      }
      return existente;
    }

    const total = await usuarioModel.contar();
    const perfil = total === 0 ? 'ADMIN' : 'TECNICO';

    const criado = await usuarioModel.criar({
      firebaseUid: uid,
      email,
      nome: nome || email,
      perfil,
    });

    console.log(
      `[auth] Novo usuario espelhado no banco: ${criado.email} (perfil ${perfil})`
    );

    return criado;
  },

  listar() {
    return usuarioModel.listar();
  },

  async alterarPerfil(id, perfil) {
    const usuario = await usuarioModel.buscarPorId(id);
    if (!usuario) throw AppError.naoEncontrado('Usuario');

    return usuarioModel.atualizar(id, { perfil });
  },

  async definirAtivo(id, ativo) {
    const usuario = await usuarioModel.buscarPorId(id);
    if (!usuario) throw AppError.naoEncontrado('Usuario');

    return usuarioModel.atualizar(id, { ativo });
  },
};

module.exports = usuarioService;
