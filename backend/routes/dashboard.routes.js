const { Router } = require('express');

const dashboardController = require('../controllers/dashboard.controller');
const autorizar = require('../middleware/autorizar');

const router = Router();

router.get('/', autorizar('ADMIN', 'TECNICO'), dashboardController.resumo);

module.exports = router;
