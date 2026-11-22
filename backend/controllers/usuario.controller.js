/**
 * Controller de Usuarios e da sessao.
 * /api/usuarios/eu devolve o perfil que a interface usa para montar o menu.
 */
const usuarioService = require('../services/usuario.service');
const assincrono = require('../utils/assincrono');

const usuarioController = {
  // O middleware de autenticacao ja carregou (ou criou) o usuario.
  eu: assincrono(async (req, res) => {
    res.json({
      sucesso: true,
      dados: {
        id: req.usuario.id,
        nome: req.usuario.nome,
        email: req.usuario.email,
        perfil: req.usuario.perfil,
      },
    });
  }),

  listar: assincrono(async (_req, res) => {
    const usuarios = await usuarioService.listar();
    res.json({ sucesso: true, dados: usuarios });
  }),

  alterarPerfil: assincrono(async (req, res) => {
    const usuario = await usuarioService.alterarPerfil(req.params.id, req.body.perfil);
    console.log(`[usuarios] ${usuario.email} agora e ${usuario.perfil}`);

    res.json({
      sucesso: true,
      mensagem: `Perfil alterado para ${usuario.perfil}.`,
      dados: usuario,
    });
  }),
};

module.exports = usuarioController;
