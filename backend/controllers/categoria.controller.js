const categoriaService = require('../services/categoria.service');
const assincrono = require('../utils/assincrono');

const categoriaController = {
  listar: assincrono(async (req, res) => {
    const { busca, pagina, limite } = req.query;
    const { dados, total } = await categoriaService.listar({ busca, pagina, limite });

    res.json({
      sucesso: true,
      dados,
      paginacao: {
        pagina,
        limite,
        total,
        paginas: Math.ceil(total / limite) || 1,
      },
    });
  }),

  buscarPorId: assincrono(async (req, res) => {
    const categoria = await categoriaService.buscarPorId(req.params.id);
    res.json({ sucesso: true, dados: categoria });
  }),

  criar: assincrono(async (req, res) => {
    const categoria = await categoriaService.criar(req.body);
    console.log('[categorias] Criada:', categoria.nome);

    // 201 Created, com o recurso criado no corpo.
    res.status(201).json({
      sucesso: true,
      mensagem: 'Categoria cadastrada com sucesso.',
      dados: categoria,
    });
  }),

  atualizar: assincrono(async (req, res) => {
    const categoria = await categoriaService.atualizar(req.params.id, req.body);
    res.json({
      sucesso: true,
      mensagem: 'Categoria atualizada com sucesso.',
      dados: categoria,
    });
  }),

  remover: assincrono(async (req, res) => {
    await categoriaService.remover(req.params.id);
    res.json({ sucesso: true, mensagem: 'Categoria excluida com sucesso.' });
  }),
};

module.exports = categoriaController;
