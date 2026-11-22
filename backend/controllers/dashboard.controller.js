const dashboardService = require('../services/dashboard.service');
const assincrono = require('../utils/assincrono');

const dashboardController = {
  resumo: assincrono(async (_req, res) => {
    const dados = await dashboardService.obterResumo();
    res.json({ sucesso: true, dados });
  }),
};

module.exports = dashboardController;
