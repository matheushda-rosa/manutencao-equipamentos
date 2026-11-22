/**
 * Popula o banco com dados de demonstracao.
 *
 * Rode com:  npm run seed
 *
 * Usuarios nao sao criados aqui: vem do Firebase e sao espelhados no
 * banco no primeiro login (ver services/usuario.service.js).
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed...');

  // --- Categorias -------------------------------------------------
  // upsert com "nome" (campo unico) deixa o seed idempotente: rodar
  // duas vezes nao duplica registro.
  const categorias = await Promise.all(
    [
      { nome: 'Informatica', descricao: 'Computadores, notebooks e perifericos' },
      { nome: 'Refrigeracao', descricao: 'Ar condicionado, bebedouros e geladeiras' },
      { nome: 'Maquinas Industriais', descricao: 'Equipamentos de producao' },
      { nome: 'Mobiliario', descricao: 'Moveis e estruturas' },
    ].map((dados) =>
      prisma.categoria.upsert({
        where: { nome: dados.nome },
        update: {},
        create: dados,
      })
    )
  );
  console.log(`  ${categorias.length} categorias`);

  // --- Locais -----------------------------------------------------
  // Enderecos reais de Chapeco/SC, no formato que o ViaCEP devolve.
  const locaisExistentes = await prisma.local.count();
  let locais = await prisma.local.findMany();

  if (locaisExistentes === 0) {
    locais = await Promise.all(
      [
        {
          nome: 'Matriz - Administrativo',
          cep: '89801-000',
          logradouro: 'Avenida Getulio Dorneles Vargas',
          numero: '100',
          bairro: 'Centro',
          cidade: 'Chapeco',
          uf: 'SC',
        },
        {
          nome: 'Galpao de Producao',
          cep: '89805-000',
          logradouro: 'Rua Benjamin Constant',
          numero: '850',
          complemento: 'Galpao B',
          bairro: 'Presidente Medici',
          cidade: 'Chapeco',
          uf: 'SC',
        },
        {
          nome: 'Centro de Distribuicao',
          cep: '89803-000',
          logradouro: 'Rua Marechal Deodoro',
          numero: '2200',
          bairro: 'Sao Cristovao',
          cidade: 'Chapeco',
          uf: 'SC',
        },
      ].map((dados) => prisma.local.create({ data: dados }))
    );
    console.log(`  ${locais.length} locais`);
  } else {
    console.log(`  locais ja existiam (${locaisExistentes}), nada criado`);
  }

  // --- Tecnicos ---------------------------------------------------
  const tecnicos = await Promise.all(
    [
      {
        nome: 'Carlos Pereira',
        telefone: '(49) 99111-2233',
        email: 'carlos.pereira@empresa.com.br',
        especialidade: 'Eletrica',
      },
      {
        nome: 'Juliana Souza',
        telefone: '(49) 99222-3344',
        email: 'juliana.souza@empresa.com.br',
        especialidade: 'Refrigeracao',
      },
      {
        nome: 'Marcos Lima',
        telefone: '(49) 99333-4455',
        email: 'marcos.lima@empresa.com.br',
        especialidade: 'Informatica',
      },
    ].map((dados) =>
      prisma.tecnico.upsert({
        where: { email: dados.email },
        update: {},
        create: dados,
      })
    )
  );
  console.log(`  ${tecnicos.length} tecnicos`);

  // --- Equipamentos -----------------------------------------------
  const porNome = (lista, nome) => lista.find((item) => item.nome === nome);

  const equipamentosSeed = [
    {
      nome: 'Notebook Dell Latitude 5440',
      patrimonio: 'PAT-0001',
      descricao: 'Notebook do setor administrativo',
      dataAquisicao: new Date('2023-03-15'),
      status: 'ATIVO',
      categoria: 'Informatica',
      local: 'Matriz - Administrativo',
    },
    {
      nome: 'Ar Condicionado Split 18000 BTU',
      patrimonio: 'PAT-0002',
      descricao: 'Sala de reunioes',
      dataAquisicao: new Date('2022-11-02'),
      status: 'EM_MANUTENCAO',
      categoria: 'Refrigeracao',
      local: 'Matriz - Administrativo',
    },
    {
      nome: 'Compressor de Ar 100L',
      patrimonio: 'PAT-0003',
      dataAquisicao: new Date('2021-07-20'),
      status: 'ATIVO',
      categoria: 'Maquinas Industriais',
      local: 'Galpao de Producao',
    },
    {
      nome: 'Empilhadeira Eletrica',
      patrimonio: 'PAT-0004',
      descricao: 'Capacidade 1,5t',
      dataAquisicao: new Date('2020-05-10'),
      status: 'EM_MANUTENCAO',
      categoria: 'Maquinas Industriais',
      local: 'Centro de Distribuicao',
    },
    {
      nome: 'Bebedouro Industrial',
      patrimonio: 'PAT-0005',
      dataAquisicao: new Date('2024-01-08'),
      status: 'ATIVO',
      categoria: 'Refrigeracao',
      local: 'Galpao de Producao',
    },
    {
      nome: 'Impressora Multifuncional HP',
      patrimonio: 'PAT-0006',
      dataAquisicao: new Date('2023-09-30'),
      status: 'INATIVO',
      categoria: 'Informatica',
      local: 'Matriz - Administrativo',
    },
  ];

  const equipamentos = [];
  for (const dados of equipamentosSeed) {
    const categoria = porNome(categorias, dados.categoria);
    const local = porNome(locais, dados.local);
    if (!categoria || !local) continue;

    const equipamento = await prisma.equipamento.upsert({
      where: { patrimonio: dados.patrimonio },
      update: {},
      create: {
        nome: dados.nome,
        patrimonio: dados.patrimonio,
        descricao: dados.descricao,
        dataAquisicao: dados.dataAquisicao,
        status: dados.status,
        categoriaId: categoria.id,
        localId: local.id,
      },
    });
    equipamentos.push(equipamento);
  }
  console.log(`  ${equipamentos.length} equipamentos`);

  // --- Ordens de servico ------------------------------------------
  // So cria se ainda nao houver nenhuma, porque OS nao tem campo unico
  // para usar no upsert.
  const ordensExistentes = await prisma.ordemServico.count();
  if (ordensExistentes === 0) {
    const porPatrimonio = (patrimonio) =>
      equipamentos.find((equipamento) => equipamento.patrimonio === patrimonio);

    const ordens = [
      {
        patrimonio: 'PAT-0002',
        tecnico: tecnicos[1].id,
        descricao: 'Ar condicionado nao esta gelando e apresenta ruido no ventilador.',
        tipo: 'CORRETIVA',
        prioridade: 'ALTA',
        status: 'EM_ANDAMENTO',
        dataAbertura: new Date('2026-11-10T09:30:00'),
      },
      {
        patrimonio: 'PAT-0004',
        tecnico: tecnicos[0].id,
        descricao: 'Revisao preventiva semestral do sistema eletrico e das baterias.',
        tipo: 'PREVENTIVA',
        prioridade: 'MEDIA',
        status: 'ABERTA',
        dataAbertura: new Date('2026-11-17T14:00:00'),
      },
      {
        patrimonio: 'PAT-0001',
        tecnico: tecnicos[2].id,
        descricao: 'Troca de pasta termica e limpeza interna.',
        solucao: 'Pasta termica substituida e coolers limpos. Temperatura normalizada.',
        tipo: 'PREVENTIVA',
        prioridade: 'BAIXA',
        status: 'CONCLUIDA',
        dataAbertura: new Date('2026-09-02T08:00:00'),
        dataConclusao: new Date('2026-09-02T11:20:00'),
      },
      {
        patrimonio: 'PAT-0003',
        tecnico: tecnicos[0].id,
        descricao: 'Vazamento de ar na mangueira principal.',
        solucao: 'Mangueira e abracadeira substituidas.',
        tipo: 'CORRETIVA',
        prioridade: 'URGENTE',
        status: 'CONCLUIDA',
        dataAbertura: new Date('2026-10-21T13:15:00'),
        dataConclusao: new Date('2026-10-22T10:00:00'),
      },
      {
        patrimonio: 'PAT-0005',
        tecnico: tecnicos[1].id,
        descricao: 'Limpeza preventiva do filtro e troca do elemento filtrante.',
        solucao: 'Filtro trocado conforme plano de manutencao.',
        tipo: 'PREVENTIVA',
        prioridade: 'BAIXA',
        status: 'CONCLUIDA',
        dataAbertura: new Date('2026-11-05T07:45:00'),
        dataConclusao: new Date('2026-11-05T09:00:00'),
      },
    ];

    let criadas = 0;
    for (const ordem of ordens) {
      const equipamento = porPatrimonio(ordem.patrimonio);
      if (!equipamento) continue;

      await prisma.ordemServico.create({
        data: {
          equipamentoId: equipamento.id,
          tecnicoId: ordem.tecnico,
          descricao: ordem.descricao,
          solucao: ordem.solucao,
          tipo: ordem.tipo,
          prioridade: ordem.prioridade,
          status: ordem.status,
          dataAbertura: ordem.dataAbertura,
          dataConclusao: ordem.dataConclusao,
        },
      });
      criadas += 1;
    }
    console.log(`  ${criadas} ordens de servico`);
  } else {
    console.log(`  ordens de servico ja existiam (${ordensExistentes}), nada criado`);
  }

  console.log('Seed concluido.');
}

main()
  .catch((erro) => {
    console.error('Falha no seed:', erro);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
