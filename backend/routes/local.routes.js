const { Router } = require('express');

const localController = require('../controllers/local.controller');
const autorizar = require('../middleware/autorizar');
const validar = require('../middleware/validar');
const { idParamSchema, listagemQuerySchema } = require('../validators/comum.validator');
const { criarLocalSchema, atualizarLocalSchema } = require('../validators/local.validator');

const router = Router();

router.get(
  '/',
  autorizar('ADMIN', 'TECNICO'),
  validar(listagemQuerySchema, 'query'),
  localController.listar
);

router.get(
  '/:id',
  autorizar('ADMIN', 'TECNICO'),
  validar(idParamSchema, 'params'),
  localController.buscarPorId
);

router.post('/', autorizar('ADMIN'), validar(criarLocalSchema), localController.criar);

router.put(
  '/:id',
  autorizar('ADMIN'),
  validar(idParamSchema, 'params'),
  validar(atualizarLocalSchema),
  localController.atualizar
);

router.delete(
  '/:id',
  autorizar('ADMIN'),
  validar(idParamSchema, 'params'),
  localController.remover
);

module.exports = router;
