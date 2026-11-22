/**
 * Inicializacao do Firebase Authentication no navegador.
 *
 * SDK modular importado do CDN, sem bundler: por isso as paginas
 * carregam os scripts com type="module".
 *
 * O Firebase emite o token; o backend verifica a assinatura e decide as
 * permissoes.
 */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';

import { FIREBASE_CONFIG, configuracaoPendente } from './config.js';

if (configuracaoPendente()) {
  console.error(
    '[firebase] js/config.js ainda nao foi preenchido com os dados do seu projeto Firebase.'
  );
}

const app = initializeApp(FIREBASE_CONFIG);
const auth = getAuth(app);

// Mantem a sessao ao fechar e reabrir o navegador.
setPersistence(auth, browserLocalPersistence).catch((erro) => {
  console.warn('[firebase] Nao foi possivel definir a persistencia:', erro.code);
});

export { auth, signInWithEmailAndPassword, signOut, onAuthStateChanged };
