/**
 * Rotas de Ordens de Servico.
 * Permissoes do item 4.10 do enunciado: ADMIN faz tudo; TECNICO
 * consulta, altera status e conclui manutencao.
 */
const { Router } = require('express');

const ordemServicoController = require('../controllers/ordemServico.controller');
const autorizar = require('../middleware/autorizar');
const validar = require('../middleware/validar');
const { idParamSchema } = require('../validators/comum.validator');
const {
  abrirOrdemSchema,
  atualizarOrdemSchema,
  alterarStatusSchema,
  concluirOrdemSchema,
  listarOrdensSchema,
} = require('../validators/ordemServico.validator');

const router = Router();

router.get(
  '/',
  autorizar('ADMIN', 'TECNICO'),
  validar(listarOrdensSchema, 'query'),
  ordemServicoController.listar
);

router.get(
  '/:id',
  autorizar('ADMIN', 'TECNICO'),
  validar(idParamSchema, 'params'),
  ordemServicoController.buscarPorId
);

router.post('/', autorizar('ADMIN'), validar(abrirOrdemSchema), ordemServicoController.abrir);

router.put(
  '/:id',
  autorizar('ADMIN', 'TECNICO'),
  validar(idParamSchema, 'params'),
  validar(atualizarOrdemSchema),
  ordemServicoController.atualizar
);

// PATCH: altera apenas o status, nao o recurso inteiro.
router.patch(
  '/:id/status',
  autorizar('ADMIN', 'TECNICO'),
  validar(idParamSchema, 'params'),
  validar(alterarStatusSchema),
  ordemServicoController.alterarStatus
);

router.patch(
  '/:id/concluir',
  autorizar('ADMIN', 'TECNICO'),
  validar(idParamSchema, 'params'),
  validar(concluirOrdemSchema),
  ordemServicoController.concluir
);

module.exports = router;
