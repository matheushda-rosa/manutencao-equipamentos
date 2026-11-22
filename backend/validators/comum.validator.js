/** Esquemas de validacao reaproveitados por mais de um modulo. */
const { z } = require('zod');

/**
 * Valida o :id da URL.
 * z.coerce porque tudo que vem na URL chega como texto.
 */
const idParamSchema = z.object({
  id: z.coerce
    .number({ invalid_type_error: 'O id deve ser numerico.' })
    .int('O id deve ser um numero inteiro.')
    .positive('O id deve ser positivo.'),
});

/** Parametros de busca e paginacao da query string. */
const listagemQuerySchema = z.object({
  busca: z.string().trim().max(120).optional(),
  pagina: z.coerce.number().int().positive().default(1),
  limite: z.coerce.number().int().positive().max(100).default(20),
});

/** Texto obrigatorio com limite de tamanho e mensagem em portugues. */
function textoObrigatorio(rotulo, maximo) {
  return z
    .string({ required_error: `${rotulo} e obrigatorio.` })
    .trim()
    .min(1, `${rotulo} e obrigatorio.`)
    .max(maximo, `${rotulo} deve ter no maximo ${maximo} caracteres.`);
}

/**
 * Texto opcional. String vazia vira null, nao undefined: o Prisma ignora
 * campos undefined no update, o que impediria limpar um campo ja
 * preenchido.
 */
function textoOpcional(maximo) {
  return z
    .string()
    .trim()
    .max(maximo)
    .optional()
    .transform((valor) => (valor === '' ? null : valor));
}

module.exports = {
  idParamSchema,
  listagemQuerySchema,
  textoObrigatorio,
  textoOpcional,
};
