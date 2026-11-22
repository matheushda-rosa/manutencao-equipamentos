/**
 * Configuracao da aplicacao Express: middlewares e rotas.
 * O server.js e quem abre a porta.
 * A ordem de registro dos middlewares e significativa.
 */
const express = require('express');
const cors = require('cors');

const { env } = require('./config/env');
const rotas = require('./routes');
const { rotaNaoEncontrada, tratarErros } = require('./middleware/erros');

const app = express();

// --- CORS -------------------------------------------------------
// Origens liberadas explicitamente, em vez de "*".
app.use(
  cors({
    origin(origem, callback) {
      // Requisicoes sem Origin (Postman, curl, health check) passam.
      if (!origem) return callback(null, true);

      if (env.corsOrigins.length === 0 || env.corsOrigins.includes(origem)) {
        return callback(null, true);
      }

      console.warn('[cors] Origem bloqueada:', origem);
      return callback(new Error('Origem nao autorizada pelo CORS.'));
    },
  })
);

// --- Parsers ----------------------------------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Log simples de requisicoes ---------------------------------
// Metodo, rota, status e tempo de resposta, apenas fora de producao.
if (!env.ehProducao) {
  app.use((req, res, next) => {
    const inicio = Date.now();
    res.on('finish', () => {
      console.log(
        `${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - inicio}ms)`
      );
    });
    next();
  });
}

// --- Rotas ------------------------------------------------------
app.get('/', (_req, res) => {
  res.json({
    sucesso: true,
    mensagem: 'API do Sistema de Controle de Manutencao de Equipamentos',
    versao: '1.0.0',
    documentacao: '/api/health',
  });
});

app.use('/api', rotas);

// --- Erros (sempre por ultimo) ----------------------------------
app.use(rotaNaoEncontrada);
app.use(tratarErros);

module.exports = app;
