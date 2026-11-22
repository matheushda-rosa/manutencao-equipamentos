const { z } = require('zod');
const { textoObrigatorio, textoOpcional } = require('./comum.validator');

const criarCategoriaSchema = z.object({
  nome: textoObrigatorio('O nome', 80),
  descricao: textoOpcional(255),
});

// Na edicao todos os campos sao opcionais, mas o corpo nao pode vir vazio.
const atualizarCategoriaSchema = criarCategoriaSchema
  .partial()
  .refine((dados) => Object.keys(dados).length > 0, {
    message: 'Informe ao menos um campo para atualizar.',
  });

module.exports = { criarCategoriaSchema, atualizarCategoriaSchema };
