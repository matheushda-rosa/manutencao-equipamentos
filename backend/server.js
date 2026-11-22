const app = require('./app');
const { env, validarAmbiente } = require('./config/env');
const prisma = require('./models/prisma');

validarAmbiente();

const servidor = app.listen(env.port, () => {
  console.log('------------------------------------------------------------');
  console.log(' API de Controle de Manutencao de Equipamentos');
  console.log(` Ambiente : ${env.nodeEnv}`);
  console.log(` Porta    : ${env.port}`);
  console.log(` URL      : http://localhost:${env.port}`);
  console.log('------------------------------------------------------------');
});

/**
 * Encerramento limpo: fecha o servidor e a conexao com o banco antes de
 * sair, para nao deixar conexoes penduradas no Supabase.
 */
async function encerrar(sinal) {
  console.log(`\n[servidor] Recebido ${sinal}, encerrando...`);

  servidor.close(async () => {
    await prisma.$disconnect();
    console.log('[servidor] Conexoes encerradas.');
    process.exit(0);
  });

  // Rede de seguranca: se algo travar, forca a saida.
  setTimeout(() => process.exit(1), 10000);
}

process.on('SIGTERM', () => encerrar('SIGTERM'));
process.on('SIGINT', () => encerrar('SIGINT'));

process.on('unhandledRejection', (motivo) => {
  console.error('[servidor] Promise rejeitada sem tratamento:', motivo);
});
