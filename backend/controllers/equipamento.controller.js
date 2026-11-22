const equipamentoService = require('../services/equipamento.service');
const assincrono = require('../utils/assincrono');

const equipamentoController = {
  listar: assincrono(async (req, res) => {
    const { pagina, limite } = req.query;
    const { dados, total } = await equipamentoService.listar(req.query);

    res.json({
      sucesso: true,
      dados,
      paginacao: { pagina, limite, total, paginas: Math.ceil(total / limite) || 1 },
    });
  }),

  buscarPorId: assincrono(async (req, res) => {
    const equipamento = await equipamentoService.buscarPorId(req.params.id);
    res.json({ sucesso: true, dados: equipamento });
  }),

  historico: assincrono(async (req, res) => {
    const historico = await equipamentoService.historico(req.params.id);
    res.json({ sucesso: true, dados: historico });
  }),

  criar: assincrono(async (req, res) => {
    // req.file e preenchido pelo multer quando o formulario envia foto.
    const equipamento = await equipamentoService.criar(req.body, req.file);
    console.log('[equipamentos] Criado:', equipamento.patrimonio, '-', equipamento.nome);

    res.status(201).json({
      sucesso: true,
      mensagem: 'Equipamento cadastrado com sucesso.',
      dados: equipamento,
    });
  }),

  atualizar: assincrono(async (req, res) => {
    const equipamento = await equipamentoService.atualizar(
      req.params.id,
      req.body,
      req.file
    );

    res.json({
      sucesso: true,
      mensagem: 'Equipamento atualizado com sucesso.',
      dados: equipamento,
    });
  }),

  remover: assincrono(async (req, res) => {
    await equipamentoService.remover(req.params.id);
    res.json({ sucesso: true, mensagem: 'Equipamento excluido com sucesso.' });
  }),
};

module.exports = equipamentoController;
