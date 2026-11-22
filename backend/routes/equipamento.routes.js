/**
 * Rotas de Equipamentos.
 * tratarUploadFoto vem antes de validar: em multipart/form-data os
 * campos de texto so existem em req.body depois do multer.
 */
const { Router } = require('express');

const equipamentoController = require('../controllers/equipamento.controller');
const autorizar = require('../middleware/autorizar');
const validar = require('../middleware/validar');
const { tratarUploadFoto } = require('../middleware/upload');
const { idParamSchema } = require('../validators/comum.validator');
const {
  criarEquipamentoSchema,
  atualizarEquipamentoSchema,
  listarEquipamentosSchema,
} = require('../validators/equipamento.validator');

const router = Router();

// Consulta: ADMIN e TECNICO (o tecnico precisa visualizar equipamentos).
router.get(
  '/',
  autorizar('ADMIN', 'TECNICO'),
  validar(listarEquipamentosSchema, 'query'),
  equipamentoController.listar
);

router.get(
  '/:id',
  autorizar('ADMIN', 'TECNICO'),
  validar(idParamSchema, 'params'),
  equipamentoController.buscarPorId
);

// Historico de manutencoes do equipamento (item 4.8).
router.get(
  '/:id/historico',
  autorizar('ADMIN', 'TECNICO'),
  validar(idParamSchema, 'params'),
  equipamentoController.historico
);

// Escrita: somente ADMIN.
router.post(
  '/',
  autorizar('ADMIN'),
  tratarUploadFoto,
  validar(criarEquipamentoSchema),
  equipamentoController.criar
);

router.put(
  '/:id',
  autorizar('ADMIN'),
  validar(idParamSchema, 'params'),
  tratarUploadFoto,
  validar(atualizarEquipamentoSchema),
  equipamentoController.atualizar
);

router.delete(
  '/:id',
  autorizar('ADMIN'),
  validar(idParamSchema, 'params'),
  equipamentoController.remover
);

module.exports = router;
