/**
 * Monta os indicadores do Dashboard, convertendo o retorno bruto do
 * groupBy em listas prontas para a tela desenhar.
 */
const dashboardModel = require('../models/dashboard.model');

const PRIORIDADES = ['URGENTE', 'ALTA', 'MEDIA', 'BAIXA'];

const dashboardService = {
  async obterResumo() {
    const [indicadores, ultimasOrdens, categorias] = await Promise.all([
      dashboardModel.obterIndicadores(),
      dashboardModel.listarUltimasOrdens(5),
      dashboardModel.listarNomesCategorias(),
    ]);

    // Map para resolver o nome da categoria em tempo constante.
    const nomePorCategoria = new Map(categorias.map((c) => [c.id, c.nome]));

    const equipamentosPorCategoria = indicadores.porCategoria
      .map((grupo) => ({
        categoria: nomePorCategoria.get(grupo.categoriaId) || 'Sem categoria',
        quantidade: grupo._count._all,
      }))
      .sort((a, b) => b.quantidade - a.quantidade);

    // Todas as prioridades aparecem, inclusive as zeradas.
    const contagemPrioridade = new Map(
      indicadores.porPrioridade.map((grupo) => [grupo.prioridade, grupo._count._all])
    );

    const ordensPorPrioridade = PRIORIDADES.map((prioridade) => ({
      prioridade,
      quantidade: contagemPrioridade.get(prioridade) || 0,
    }));

    return {
      // --- Indicadores obrigatorios do enunciado ---
      equipamentosAtivos: indicadores.equipamentosAtivos,
      equipamentosEmManutencao: indicadores.equipamentosEmManutencao,
      manutencoesPreventivas: indicadores.manutencoesPreventivas,

      // --- Complementares ---
      equipamentosTotal: indicadores.equipamentosTotal,
      equipamentosInativos: indicadores.equipamentosInativos,
      manutencoesCorretivas: indicadores.manutencoesCorretivas,
      ordens: {
        abertas: indicadores.ordensAbertas,
        emAndamento: indicadores.ordensEmAndamento,
        concluidas: indicadores.ordensConcluidas,
        canceladas: indicadores.ordensCanceladas,
        emAberto: indicadores.ordensAbertas + indicadores.ordensEmAndamento,
        concluidasUltimos30Dias: indicadores.concluidasUltimos30Dias,
      },
      cadastros: {
        categorias: indicadores.totalCategorias,
        locais: indicadores.totalLocais,
        tecnicos: indicadores.totalTecnicos,
      },
      ordensPorPrioridade,
      equipamentosPorCategoria,
      ultimasOrdens,
    };
  },
};

module.exports = dashboardService;
