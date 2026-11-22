const { z } = require('zod');
const { textoObrigatorio, textoOpcional } = require('./comum.validator');

const criarLocalSchema = z.object({
  nome: textoObrigatorio('O nome', 120),
  // Aceita 89801-000 ou 89801000 e guarda sempre com a mascara, para
  // que a listagem fique uniforme.
  cep: z
    .string({ required_error: 'O CEP e obrigatorio.' })
    .trim()
    .regex(/^\d{5}-?\d{3}$/, 'CEP invalido. Use o formato 89801-000.')
    .transform((valor) => {
      const digitos = valor.replace(/\D/g, '');
      return `${digitos.slice(0, 5)}-${digitos.slice(5)}`;
    }),
  logradouro: textoObrigatorio('O logradouro', 160),
  numero: textoOpcional(20),
  complemento: textoOpcional(80),
  bairro: textoObrigatorio('O bairro', 120),
  cidade: textoObrigatorio('A cidade', 120),
  uf: z
    .string({ required_error: 'A UF e obrigatoria.' })
    .trim()
    .length(2, 'A UF deve ter 2 letras.')
    .transform((valor) => valor.toUpperCase()),
});

const atualizarLocalSchema = criarLocalSchema
  .partial()
  .refine((dados) => Object.keys(dados).length > 0, {
    message: 'Informe ao menos um campo para atualizar.',
  });

module.exports = { criarLocalSchema, atualizarLocalSchema };
