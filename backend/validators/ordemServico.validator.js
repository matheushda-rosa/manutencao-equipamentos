const { z } = require('zod');

const STATUS = ['ABERTA', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA'];
const PRIORIDADES = ['BAIXA', 'MEDIA', 'ALTA', 'URGENTE'];
const TIPOS = ['PREVENTIVA', 'CORRETIVA'];

const vazioParaIndefinido = (valor) => (valor === '' || valor === null ? undefined : valor);

const abrirOrdemSchema = z.object({
  equipamentoId: z.coerce
    .number({ required_error: 'Selecione o equipamento.' })
    .int()
    .positive('Selecione o equipamento.'),
  tecnicoId: z.coerce
    .number({ required_error: 'Selecione o tecnico responsavel.' })
    .int()
    .positive('Selecione o tecnico responsavel.'),
  descricao: z
    .string({ required_error: 'Descreva o problema ou o servico.' })
    .trim()
    .min(10, 'A descricao deve ter ao menos 10 caracteres.')
    .max(1000, 'A descricao deve ter no maximo 1000 caracteres.'),
  tipo: z.preprocess(vazioParaIndefinido, z.enum(TIPOS).default('CORRETIVA')),
  prioridade: z.preprocess(vazioParaIndefinido, z.enum(PRIORIDADES).default('MEDIA')),
  // Opcional: permite registrar uma OS retroativa. Sem valor, o banco
  // usa a data/hora atual (default(now) no schema.prisma).
  dataAbertura: z.preprocess(vazioParaIndefinido, z.coerce.date().optional()),
});

const atualizarOrdemSchema = z
  .object({
    tecnicoId: z.coerce.number().int().positive().optional(),
    descricao: z.string().trim().min(10).max(1000).optional(),
    tipo: z.preprocess(vazioParaIndefinido, z.enum(TIPOS).optional()),
    prioridade: z.preprocess(vazioParaIndefinido, z.enum(PRIORIDADES).optional()),
  })
  .refine((dados) => Object.keys(dados).length > 0, {
    message: 'Informe ao menos um campo para atualizar.',
  });

/**
 * Alteracao de status.
 * A solucao so e exigida quando o destino e CONCLUIDA - regra que depende
 * de outro campo, dai o superRefine.
 */
const alterarStatusSchema = z
  .object({
    status: z.enum(STATUS, { errorMap: () => ({ message: 'Status invalido.' }) }),
    solucao: z.string().trim().max(1000).optional(),
  })
  .superRefine((dados, contexto) => {
    if (dados.status === 'CONCLUIDA' && (!dados.solucao || dados.solucao.length < 5)) {
      contexto.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['solucao'],
        message: 'Descreva o servico realizado para concluir a ordem.',
      });
    }
  });

const concluirOrdemSchema = z.object({
  solucao: z
    .string({ required_error: 'Descreva o servico realizado.' })
    .trim()
    .min(5, 'Descreva o servico realizado.')
    .max(1000),
});

const listarOrdensSchema = z.object({
  busca: z.string().trim().max(120).optional(),
  status: z.preprocess(vazioParaIndefinido, z.enum(STATUS).optional()),
  tipo: z.preprocess(vazioParaIndefinido, z.enum(TIPOS).optional()),
  prioridade: z.preprocess(vazioParaIndefinido, z.enum(PRIORIDADES).optional()),
  equipamentoId: z.preprocess(vazioParaIndefinido, z.coerce.number().int().positive().optional()),
  tecnicoId: z.preprocess(vazioParaIndefinido, z.coerce.number().int().positive().optional()),
  pagina: z.coerce.number().int().positive().default(1),
  limite: z.coerce.number().int().positive().max(100).default(20),
});

module.exports = {
  STATUS,
  PRIORIDADES,
  TIPOS,
  abrirOrdemSchema,
  atualizarOrdemSchema,
  alterarStatusSchema,
  concluirOrdemSchema,
  listarOrdensSchema,
};
