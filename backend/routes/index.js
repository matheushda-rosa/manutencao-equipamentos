/**
 * Roteador principal: junta os modulos sob o prefixo /api.
 * autenticar e aplicado uma vez aqui, para todas as rotas de recurso.
 * /health fica antes dele, porque o health check do Render nao tem token.
 */
const { Router } = require('express');

const autenticar = require('../middleware/autenticar');

const dashboardRoutes = require('./dashboard.routes');
const categoriaRoutes = require('./categoria.routes');
const localRoutes = require('./local.routes');
const tecnicoRoutes = require('./tecnico.routes');
const equipamentoRoutes = require('./equipamento.routes');
const ordemServicoRoutes = require('./ordemServico.routes');
const usuarioRoutes = require('./usuario.routes');

const router = Router();

// --- Rota publica de verificacao ---
router.get('/health', (_req, res) => {
  res.json({
    sucesso: true,
    status: 'ok',
    horario: new Date().toISOString(),
  });
});

// --- A partir daqui, tudo exige token valido ---
router.use(autenticar);

router.use('/usuarios', usuarioRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/categorias', categoriaRoutes);
router.use('/locais', localRoutes);
router.use('/tecnicos', tecnicoRoutes);
router.use('/equipamentos', equipamentoRoutes);
router.use('/ordens-servico', ordemServicoRoutes);

module.exports = router;
