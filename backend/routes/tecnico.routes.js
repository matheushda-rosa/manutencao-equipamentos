const { Router } = require('express');

const tecnicoController = require('../controllers/tecnico.controller');
const autorizar = require('../middleware/autorizar');
const validar = require('../middleware/validar');
const { idParamSchema, listagemQuerySchema } = require('../validators/comum.validator');
const {
  criarTecnicoSchema,
  atualizarTecnicoSchema,
} = require('../validators/tecnico.validator');

const router = Router();

// O tecnico precisa ver a lista de tecnicos para abrir/atualizar ordens.
router.get(
  '/',
  autorizar('ADMIN', 'TECNICO'),
  validar(listagemQuerySchema, 'query'),
  tecnicoController.listar
);

router.get(
  '/:id',
  autorizar('ADMIN', 'TECNICO'),
  validar(idParamSchema, 'params'),
  tecnicoController.buscarPorId
);

router.post('/', autorizar('ADMIN'), validar(criarTecnicoSchema), tecnicoController.criar);

router.put(
  '/:id',
  autorizar('ADMIN'),
  validar(idParamSchema, 'params'),
  validar(atualizarTecnicoSchema),
  tecnicoController.atualizar
);

router.delete(
  '/:id',
  autorizar('ADMIN'),
  validar(idParamSchema, 'params'),
  tecnicoController.remover
);

module.exports = router;
