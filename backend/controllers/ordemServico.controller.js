const { ordemServicoService } = require('../services/ordemServico.service');
const assincrono = require('../utils/assincrono');

const ordemServicoController = {
  listar: assincrono(async (req, res) => {
    const { pagina, limite } = req.query;
    const { dados, total } = await ordemServicoService.listar(req.query);

    res.json({
      sucesso: true,
      dados,
      paginacao: { pagina, limite, total, paginas: Math.ceil(total / limite) || 1 },
    });
  }),

  buscarPorId: assincrono(async (req, res) => {
    const ordem = await ordemServicoService.buscarPorId(req.params.id);
    res.json({ sucesso: true, dados: ordem });
  }),

  abrir: assincrono(async (req, res) => {
    const ordem = await ordemServicoService.abrir(req.body);
    console.log(
      `[ordens] Aberta OS #${ordem.id} para ${ordem.equipamento.patrimonio} ` +
        `por ${req.usuario.email}`
    );

    res.status(201).json({
      sucesso: true,
      mensagem: 'Ordem de servico aberta com sucesso.',
      dados: ordem,
    });
  }),

  atualizar: assincrono(async (req, res) => {
    const ordem = await ordemServicoService.atualizar(req.params.id, req.body);
    res.json({ sucesso: true, mensagem: 'Ordem de servico atualizada.', dados: ordem });
  }),

  alterarStatus: assincrono(async (req, res) => {
    const { status, solucao } = req.body;
    const ordem = await ordemServicoService.alterarStatus(req.params.id, status, solucao);

    res.json({
      sucesso: true,
      mensagem: `Status alterado para ${status}.`,
      dados: ordem,
    });
  }),

  concluir: assincrono(async (req, res) => {
    const ordem = await ordemServicoService.concluir(req.params.id, req.body.solucao);
    res.json({
      sucesso: true,
      mensagem: 'Manutencao concluida com sucesso.',
      dados: ordem,
    });
  }),
};

module.exports = ordemServicoController;
