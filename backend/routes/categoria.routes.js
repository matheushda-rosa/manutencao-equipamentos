/**
 * Rotas de Categorias.
 * A autenticacao e aplicada uma unica vez em routes/index.js.
 */
const { Router } = require('express');

const categoriaController = require('../controllers/categoria.controller');
const autorizar = require('../middleware/autorizar');
const validar = require('../middleware/validar');
const { idParamSchema, listagemQuerySchema } = require('../validators/comum.validator');
const {
  criarCategoriaSchema,
  atualizarCategoriaSchema,
} = require('../validators/categoria.validator');

const router = Router();

// Leitura: os dois perfis podem consultar.
router.get(
  '/',
  autorizar('ADMIN', 'TECNICO'),
  validar(listagemQuerySchema, 'query'),
  categoriaController.listar
);

router.get(
  '/:id',
  autorizar('ADMIN', 'TECNICO'),
  validar(idParamSchema, 'params'),
  categoriaController.buscarPorId
);

// Escrita: somente ADMIN (item 4.10 do enunciado).
router.post(
  '/',
  autorizar('ADMIN'),
  validar(criarCategoriaSchema),
  categoriaController.criar
);

router.put(
  '/:id',
  autorizar('ADMIN'),
  validar(idParamSchema, 'params'),
  validar(atualizarCategoriaSchema),
  categoriaController.atualizar
);

router.delete(
  '/:id',
  autorizar('ADMIN'),
  validar(idParamSchema, 'params'),
  categoriaController.remover
);

module.exports = router;
