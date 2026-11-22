/** Leitura centralizada das variaveis de ambiente. */
require('dotenv').config();

const env = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  corsOrigins: (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origem) => origem.trim())
    .filter(Boolean),

  databaseUrl: process.env.DATABASE_URL,

  supabase: {
    url: process.env.SUPABASE_URL,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    bucket: process.env.SUPABASE_BUCKET || 'equipamentos',
  },

  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    // As quebras de linha da chave privada chegam escapadas como "\n"
    // quando a chave e colada dentro de uma variavel de ambiente.
    privateKey: process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      : undefined,
  },

  // Atalho de desenvolvimento para testes no Postman.
  // Ignorado quando NODE_ENV=production.
  authDesabilitada:
    process.env.AUTH_DISABLED === 'true' && process.env.NODE_ENV !== 'production',
};

env.ehProducao = env.nodeEnv === 'production';

/** Confere as variaveis essenciais e avisa no console o que falta. */
function validarAmbiente() {
  const faltando = [];

  if (!env.databaseUrl) faltando.push('DATABASE_URL');
  if (!env.supabase.url) faltando.push('SUPABASE_URL');
  if (!env.supabase.serviceRoleKey) faltando.push('SUPABASE_SERVICE_ROLE_KEY');

  if (!env.authDesabilitada) {
    if (!env.firebase.projectId) faltando.push('FIREBASE_PROJECT_ID');
    if (!env.firebase.clientEmail) faltando.push('FIREBASE_CLIENT_EMAIL');
    if (!env.firebase.privateKey) faltando.push('FIREBASE_PRIVATE_KEY');
  }

  if (faltando.length > 0) {
    console.warn(
      '[config] Variaveis de ambiente ausentes:',
      faltando.join(', '),
      '\n          Copie o .env.example para .env e preencha os valores.'
    );
  }

  if (env.authDesabilitada) {
    console.warn(
      '[config] AUTH_DISABLED=true -> autenticacao desligada. Use isso apenas',
      'para testes locais no Postman.'
    );
  }

  return faltando;
}

module.exports = { env, validarAmbiente };
