const { z } = require('zod');
const { textoObrigatorio } = require('./comum.validator');

const criarTecnicoSchema = z.object({
  nome: textoObrigatorio('O nome', 120),
  telefone: z
    .string({ required_error: 'O telefone e obrigatorio.' })
    .trim()
    .min(10, 'Telefone invalido.')
    .max(20, 'Telefone invalido.')
    // Valida os digitos, nao a mascara: aceita (49) 99999-9999,
    // 49999999999 e 49 99999-9999.
    .refine((valor) => valor.replace(/\D/g, '').length >= 10, {
      message: 'Informe DDD e numero. Exemplo: (49) 99999-9999',
    }),
  email: z
    .string({ required_error: 'O e-mail e obrigatorio.' })
    .trim()
    .toLowerCase()
    .email('E-mail invalido.')
    .max(160),
  especialidade: textoObrigatorio('A especialidade', 120),
  // z.coerce.boolean() nao serve aqui: Boolean("false") e true, o que
  // inverteria a desativacao quando o valor chega como texto.
  ativo: z
    .preprocess((valor) => {
      if (valor === 'true' || valor === 'on' || valor === '1') return true;
      if (valor === 'false' || valor === 'off' || valor === '0') return false;
      return valor;
    }, z.boolean({ invalid_type_error: 'Situacao invalida.' }))
    .optional(),
});

const atualizarTecnicoSchema = criarTecnicoSchema
  .partial()
  .refine((dados) => Object.keys(dados).length > 0, {
    message: 'Informe ao menos um campo para atualizar.',
  });

module.exports = { criarTecnicoSchema, atualizarTecnicoSchema };
