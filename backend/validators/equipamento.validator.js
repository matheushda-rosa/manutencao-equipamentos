const { z } = require('zod');
const { textoObrigatorio, textoOpcional } = require('./comum.validator');

const STATUS = ['ATIVO', 'EM_MANUTENCAO', 'INATIVO'];

/**
 * Em multipart/form-data todos os campos chegam como texto, e os campos
 * em branco chegam como string vazia em vez de ausentes. Dai o z.coerce
 * e o preprocess abaixo.
 */
const vazioParaIndefinido = (valor) => (valor === '' || valor === null ? undefined : valor);

const criarEquipamentoSchema = z.object({
  nome: textoObrigatorio('O nome', 120),
  patrimonio: textoObrigatorio('O patrimonio', 40),
  descricao: textoOpcional(255),
  dataAquisicao: z.preprocess(
    vazioParaIndefinido,
    z.coerce.date({
      required_error: 'A data de aquisicao e obrigatoria.',
      invalid_type_error: 'Data de aquisicao invalida.',
    })
  ),
  status: z.preprocess(
    vazioParaIndefinido,
    z.enum(STATUS, { errorMap: () => ({ message: 'Status invalido.' }) }).default('ATIVO')
  ),
  categoriaId: z.coerce
    .number({ required_error: 'Selecione a categoria.', invalid_type_error: 'Categoria invalida.' })
    .int()
    .positive('Selecione a categoria.'),
  localId: z.coerce
    .number({ required_error: 'Selecione o local.', invalid_type_error: 'Local invalido.' })
    .int()
    .positive('Selecione o local.'),
});

const atualizarEquipamentoSchema = criarEquipamentoSchema
  .partial()
  .refine((dados) => Object.keys(dados).length > 0, {
    message: 'Informe ao menos um campo para atualizar.',
  });

/** Filtros aceitos na listagem de equipamentos. */
const listarEquipamentosSchema = z.object({
  busca: z.string().trim().max(120).optional(),
  status: z.preprocess(vazioParaIndefinido, z.enum(STATUS).optional()),
  categoriaId: z.preprocess(vazioParaIndefinido, z.coerce.number().int().positive().optional()),
  localId: z.preprocess(vazioParaIndefinido, z.coerce.number().int().positive().optional()),
  pagina: z.coerce.number().int().positive().default(1),
  limite: z.coerce.number().int().positive().max(100).default(12),
});

module.exports = {
  STATUS,
  criarEquipamentoSchema,
  atualizarEquipamentoSchema,
  listarEquipamentosSchema,
};
