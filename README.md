# Sistema de Controle de Manutenção de Equipamentos

Sistema web interno para informatizar o controle de manutenção de equipamentos
de uma empresa, substituindo o controle por planilhas e registros manuais.

Projeto final da disciplina de Desenvolvimento Web.

**Autor:** Matheus Henrique da Rosa — ADS / UniSENAI SC — Chapecó/SC

---

## O que o sistema faz

| Módulo | Descrição |
|---|---|
| **Login** | Autenticação por e-mail e senha com Firebase Authentication, com proteção das páginas internas |
| **Dashboard** | Indicadores de equipamentos ativos, em manutenção e manutenções preventivas, mais ordens por prioridade e atividade recente |
| **Equipamentos** | Cadastro, edição, exclusão, pesquisa e listagem, com foto armazenada no Supabase Storage |
| **Categorias** | Cadastro completo, com bloqueio de exclusão quando há equipamentos vinculados |
| **Locais** | Cadastro com preenchimento automático do endereço pela API ViaCEP |
| **Técnicos** | Cadastro da equipe, com especialidade e situação (ativo/inativo) |
| **Ordens de serviço** | Abertura, mudança de status validada, conclusão com registro do serviço realizado |
| **Histórico** | Linha do tempo de todas as manutenções de cada equipamento |
| **Permissões** | Perfis Administrador e Técnico, aplicados no backend e refletidos na interface |

---

## Tecnologias utilizadas

**Front-end**
- HTML5, CSS3
- Bootstrap 5.3 e Bootstrap Icons
- JavaScript ES6+ (módulos nativos, `import`/`export`, `async/await`)

**Back-end**
- Node.js 20+ e Express 4
- Prisma ORM 6
- Zod (validação de dados)
- Multer (upload de arquivos)

**Serviços**
- Supabase PostgreSQL (banco de dados)
- Supabase Storage (fotos dos equipamentos)
- Firebase Authentication (autenticação)
- API ViaCEP (endereços)

**Infraestrutura**
- Back-end: Render
- Front-end: Firebase Hosting
- Versionamento: Git e GitHub
- Testes de API: Postman

---

## Estrutura do projeto

```
frontend/
├── css/style.css            Estilos próprios aplicados sobre o Bootstrap
├── js/
│   ├── config.js            >>> PREENCHER: URL da API e chaves do Firebase
│   ├── firebase.js          Inicialização do Firebase Auth
│   ├── api.js               Cliente HTTP (token, erros, JSON/FormData)
│   ├── auth.js              Login, logout e proteção de página
│   ├── layout.js            Menu gerado conforme o perfil do usuário
│   ├── ui.js                Avisos, formatação, selos, paginação
│   ├── viacep.js            Integração com a API ViaCEP
│   └── <página>.js          Um arquivo por tela
├── images/
├── pages/                   Páginas internas (protegidas)
└── index.html               Tela de login

backend/
├── controllers/             Leem a requisição e devolvem a resposta
├── routes/                  Definem as URLs e a fila de middlewares
├── services/                Regras de negócio
├── models/                  Acesso ao banco (consultas Prisma)
├── middleware/              Autenticação, autorização, validação, upload, erros
├── validators/              Esquemas de validação (Zod)
├── config/                  Variáveis de ambiente, Firebase, Supabase
├── utils/                   AppError e utilitários
├── prisma/
│   ├── schema.prisma        Modelagem do banco
│   └── seed.js              Dados de demonstração
├── app.js                   Montagem da aplicação Express
└── server.js                Inicialização do servidor

docs/                        Coleção do Postman para teste da API
```

A separação em **controller → service → model** é o que o enunciado pede como
"arquitetura MVC e organização em camadas". Cada camada tem uma
responsabilidade única:

- **controller** conhece HTTP (status, corpo, cabeçalhos), não conhece o banco;
- **service** conhece as regras do negócio, não conhece HTTP;
- **model** conhece o banco, não conhece regra nem HTTP.

O ganho prático: para mudar a regra de conclusão de uma ordem de serviço, o
único arquivo a tocar é `services/ordemServico.service.js`.

---

## Como executar localmente

### Pré-requisitos
- Node.js 20 ou superior
- Conta no Supabase, no Firebase e no Render (todas no plano gratuito)
- Uma extensão de servidor local para o front-end, como Live Server do VS Code

> **Importante:** o front-end usa módulos JavaScript (`type="module"`), que não
> funcionam ao abrir o arquivo com duplo clique (`file://`). É preciso servir as
> páginas por HTTP — Live Server, `npx serve` ou `firebase serve`.

### 1. Clonar e instalar

```bash
git clone https://github.com/matheushda-rosa/manutencao-equipamentos.git
cd manutencao-equipamentos/backend
npm install
```

### 2. Configurar as variáveis de ambiente

```bash
cp .env.example .env
```

Preencha o `.env` com os dados do Supabase e do Firebase.
Cada variável está comentada no próprio `.env.example`.

### 3. Criar as tabelas e popular o banco

```bash
npx prisma migrate dev --name inicial
npm run seed
```

### 4. Subir a API

```bash
npm run dev
```

A API responde em `http://localhost:3000`.
Teste com `http://localhost:3000/api/health`.

### 5. Configurar e abrir o front-end

Edite `frontend/js/config.js` com a URL da API e as chaves do Firebase.
Depois abra `frontend/index.html` com o Live Server.

---

## Scripts disponíveis (back-end)

| Comando | O que faz |
|---|---|
| `npm run dev` | Sobe a API com recarga automática |
| `npm start` | Sobe a API em modo produção |
| `npm run prisma:migrate` | Cria/aplica migrations no banco |
| `npm run prisma:studio` | Abre o Prisma Studio para inspecionar os dados |
| `npm run seed` | Popula o banco com dados de demonstração |

---

## API

Base local: `http://localhost:3000/api`

Todas as rotas, exceto `/health`, exigem o ID Token do Firebase:

```
Authorization: Bearer <idToken>
```

No front-end isso é feito automaticamente por `js/api.js`.

### Formato das respostas

```json
{ "sucesso": true, "dados": { }, "mensagem": "Opcional" }
```

Listagens incluem paginação:

```json
{
  "sucesso": true,
  "dados": [ ],
  "paginacao": { "pagina": 1, "limite": 20, "total": 37, "paginas": 2 }
}
```

Erros seguem um formato único, lido em um só ponto do front-end:

```json
{
  "sucesso": false,
  "mensagem": "Dados invalidos.",
  "detalhes": [ { "campo": "nome", "mensagem": "O nome e obrigatorio." } ]
}
```

| Status | Significado |
|---|---|
| 200 / 201 | Operação concluída / registro criado |
| 400 | Dados inválidos |
| 401 | Token ausente, inválido ou expirado |
| 403 | Perfil sem permissão para a ação |
| 404 | Registro não encontrado |
| 409 | Conflito: duplicidade, vínculo existente ou transição inválida |
| 500 | Erro interno |

### Endpoints

| Método | Rota | Perfil |
|---|---|---|
| `GET` | `/health` | público |
| `GET` | `/usuarios/eu` | autenticado |
| `GET` | `/usuarios` | ADMIN |
| `PATCH` | `/usuarios/:id/perfil` | ADMIN |
| `GET` | `/dashboard` | ADMIN, TECNICO |
| `GET/POST/PUT/DELETE` | `/categorias` | leitura: ambos / escrita: ADMIN |
| `GET/POST/PUT/DELETE` | `/locais` | leitura: ambos / escrita: ADMIN |
| `GET/POST/PUT/DELETE` | `/tecnicos` | leitura: ambos / escrita: ADMIN |
| `GET/POST/PUT/DELETE` | `/equipamentos` | leitura: ambos / escrita: ADMIN |
| `GET` | `/equipamentos/:id/historico` | ADMIN, TECNICO |
| `GET/POST/PUT` | `/ordens-servico` | abertura: ADMIN |
| `PATCH` | `/ordens-servico/:id/status` | ADMIN, TECNICO |
| `PATCH` | `/ordens-servico/:id/concluir` | ADMIN, TECNICO |

Listagens aceitam `?busca=`, `?pagina=` e `?limite=`. Equipamentos aceitam
ainda `status`, `categoriaId` e `localId`; ordens de serviço aceitam `status`,
`tipo`, `prioridade`, `equipamentoId` e `tecnicoId`.

### Cadastro de equipamento

Aceita `application/json` ou `multipart/form-data` quando há foto, enviada no
campo `foto` (JPEG, PNG ou WEBP, até 5 MB).

```json
{
  "nome": "Ar Condicionado Split 18000 BTU",
  "patrimonio": "PAT-0002",
  "dataAquisicao": "2022-11-02",
  "status": "ATIVO",
  "categoriaId": 2,
  "localId": 1
}
```

`status`: `ATIVO` | `EM_MANUTENCAO` | `INATIVO`

### Ordens de serviço

```json
{
  "equipamentoId": 2,
  "tecnicoId": 2,
  "descricao": "Equipamento nao esta gelando e apresenta ruido.",
  "tipo": "CORRETIVA",
  "prioridade": "ALTA"
}
```

`tipo`: `PREVENTIVA` | `CORRETIVA` · `prioridade`: `BAIXA` | `MEDIA` | `ALTA` | `URGENTE`

Ao abrir uma ordem, o equipamento passa para `EM_MANUTENCAO` na mesma
transação. Quando não resta nenhuma ordem em aberto, volta para `ATIVO`.

Transições de status permitidas:

| De | Para |
|---|---|
| `ABERTA` | `EM_ANDAMENTO`, `CONCLUIDA`, `CANCELADA` |
| `EM_ANDAMENTO` | `CONCLUIDA`, `CANCELADA` |
| `CONCLUIDA` | — (estado final) |
| `CANCELADA` | — (estado final) |

Para concluir, a descrição do serviço é obrigatória:

```json
{ "status": "CONCLUIDA", "solucao": "Gas recarregado e filtro substituido." }
```

Transição inválida devolve **409** com a lista de transições possíveis.

### Testes no Postman

A coleção `docs/manutencao-equipamentos.postman_collection.json` cobre todos os
endpoints em 44 requisições, incluindo uma pasta de testes de erro
(404, validação, duplicidade e transição inválida). Importe no Postman e
ajuste a variável `baseUrl`.

---

## Links do projeto

| Item | Link |
|---|---|
| Repositório | <https://github.com/matheushda-rosa/manutencao-equipamentos> |
| Front-end (Firebase Hosting) | `https://SEU-PROJETO.web.app` |
| API (Render) | `https://SEU-SERVICO.onrender.com` |
| Banco de dados | Supabase PostgreSQL (projeto privado) |

> A API está hospedada no plano gratuito do Render, que hiberna o serviço após
> alguns minutos sem acesso. A primeira requisição depois da hibernação pode
> levar cerca de 50 segundos.
