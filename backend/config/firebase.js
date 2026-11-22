/**
 * Firebase Admin SDK.
 * Verifica a assinatura dos ID Tokens emitidos no login do frontend.
 */
const admin = require('firebase-admin');
const { env } = require('./env');

let app = null;

function obterApp() {
  if (app) return app;

  const { projectId, clientEmail, privateKey } = env.firebase;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Credenciais do Firebase ausentes. Verifique FIREBASE_PROJECT_ID, ' +
        'FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY no .env'
    );
  }

  app = admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
  });

  console.log('[firebase] Admin SDK inicializado para o projeto', projectId);
  return app;
}

/** Verifica o ID Token e devolve os dados do usuario autenticado. */
async function verificarToken(idToken) {
  return admin.auth(obterApp()).verifyIdToken(idToken);
}

module.exports = { obterApp, verificarToken };
