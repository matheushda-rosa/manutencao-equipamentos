const tecnicoService = require('../services/tecnico.service');
const assincrono = require('../utils/assincrono');

const tecnicoController = {
  listar: assincrono(async (req, res) => {
    const { busca, pagina, limite } = req.query;
    const { dados, total } = await tecnicoService.listar({ busca, pagina, limite });

    res.json({
      sucesso: true,
      dados,
      paginacao: { pagina, limite, total, paginas: Math.ceil(total / limite) || 1 },
    });
  }),

  buscarPorId: assincrono(async (req, res) => {
    const tecnico = await tecnicoService.buscarPorId(req.params.id);
    res.json({ sucesso: true, dados: tecnico });
  }),

  criar: assincrono(async (req, res) => {
    const tecnico = await tecnicoService.criar(req.body);
    console.log('[tecnicos] Criado:', tecnico.nome);

    res.status(201).json({
      sucesso: true,
      mensagem: 'Tecnico cadastrado com sucesso.',
      dados: tecnico,
    });
  }),

  atualizar: assincrono(async (req, res) => {
    const tecnico = await tecnicoService.atualizar(req.params.id, req.body);
    res.json({ sucesso: true, mensagem: 'Tecnico atualizado com sucesso.', dados: tecnico });
  }),

  remover: assincrono(async (req, res) => {
    await tecnicoService.remover(req.params.id);
    res.json({ sucesso: true, mensagem: 'Tecnico excluido com sucesso.' });
  }),
};

module.exports = tecnicoController;
