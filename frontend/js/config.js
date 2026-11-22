/**
 * Configuracao do frontend.
 *
 * API_URL aponta para o backend: localhost em desenvolvimento, a URL
 * do Render em producao.
 *
 * As chaves do FIREBASE_CONFIG apenas identificam o projeto e podem
 * ficar no cliente. A service role key do Supabase, nunca.
 */

// Em desenvolvimento aponta para a API local; publicado, para o Render.
export const API_URL =
  ['localhost', '127.0.0.1'].includes(location.hostname)
    ? 'http://localhost:3000/api'
    : 'https://manutencao-equipamentos.onrender.com/api';

export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyAHMfuIeFdZs3EgXuXD6lVU7m2yh9rWrQE',
  authDomain: 'manutencao-equipamentos-66448.firebaseapp.com',
  projectId: 'manutencao-equipamentos-66448',
  storageBucket: 'manutencao-equipamentos-66448.firebasestorage.app',
  messagingSenderId: '581011038988',
  appId: '1:581011038988:web:ba1bb11fa9500305641f29',
};

/** Avisa no console se o arquivo ainda nao foi preenchido. */
export function configuracaoPendente() {
  return Object.values(FIREBASE_CONFIG).some(
    (valor) => typeof valor === 'string' && (valor.includes('COLE_AQUI') || valor.includes('SEU-PROJETO'))
  );
}
