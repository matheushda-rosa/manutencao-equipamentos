const localService = require('../services/local.service');
const assincrono = require('../utils/assincrono');

const localController = {
  listar: assincrono(async (req, res) => {
    const { busca, pagina, limite } = req.query;
    const { dados, total } = await localService.listar({ busca, pagina, limite });

    res.json({
      sucesso: true,
      dados,
      paginacao: { pagina, limite, total, paginas: Math.ceil(total / limite) || 1 },
    });
  }),

  buscarPorId: assincrono(async (req, res) => {
    const local = await localService.buscarPorId(req.params.id);
    res.json({ sucesso: true, dados: local });
  }),

  criar: assincrono(async (req, res) => {
    const local = await localService.criar(req.body);
    console.log('[locais] Criado:', local.nome);

    res.status(201).json({
      sucesso: true,
      mensagem: 'Local cadastrado com sucesso.',
      dados: local,
    });
  }),

  atualizar: assincrono(async (req, res) => {
    const local = await localService.atualizar(req.params.id, req.body);
    res.json({ sucesso: true, mensagem: 'Local atualizado com sucesso.', dados: local });
  }),

  remover: assincrono(async (req, res) => {
    await localService.remover(req.params.id);
    res.json({ sucesso: true, mensagem: 'Local excluido com sucesso.' });
  }),
};

module.exports = localController;
