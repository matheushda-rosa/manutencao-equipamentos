const { Router } = require('express');
const { z } = require('zod');

const usuarioController = require('../controllers/usuario.controller');
const autorizar = require('../middleware/autorizar');
const validar = require('../middleware/validar');
const { idParamSchema } = require('../validators/comum.validator');

const router = Router();

const alterarPerfilSchema = z.object({
  perfil: z.enum(['ADMIN', 'TECNICO'], {
    errorMap: () => ({ message: 'Perfil invalido. Use ADMIN ou TECNICO.' }),
  }),
});

// Qualquer usuario autenticado consulta os proprios dados.
router.get('/eu', usuarioController.eu);

// Gestao de usuarios: somente ADMIN.
router.get('/', autorizar('ADMIN'), usuarioController.listar);

router.patch(
  '/:id/perfil',
  autorizar('ADMIN'),
  validar(idParamSchema, 'params'),
  validar(alterarPerfilSchema),
  usuarioController.alterarPerfil
);

module.exports = router;
