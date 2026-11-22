/**
 * Controle de sessao no navegador.
 *
 * protegerPagina() aguarda o Firebase restaurar a sessao, redireciona
 * para o login quando nao ha usuario e devolve o perfil vindo de
 * /api/usuarios/eu.
 *
 * A espera e necessaria: auth.currentUser comeca null mesmo para quem
 * esta logado, enquanto o SDK carrega a sessao do armazenamento local.
 */
import { auth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from './firebase.js';
import { api } from './api.js';

/** Resolve assim que o Firebase define o estado da sessao. */
export function aguardarUsuario() {
  return new Promise((resolve) => {
    const cancelar = onAuthStateChanged(auth, (usuario) => {
      cancelar(); // escuta uma unica vez
      resolve(usuario);
    });
  });
}

/** Traduz os codigos de erro do Firebase para mensagens em portugues. */
export function traduzirErroLogin(codigo) {
  const mensagens = {
    'auth/invalid-email': 'E-mail invalido.',
    'auth/user-disabled': 'Este usuario foi desativado.',
    'auth/user-not-found': 'E-mail ou senha incorretos.',
    'auth/wrong-password': 'E-mail ou senha incorretos.',
    // Codigo generico: o Firebase nao distingue e-mail de senha
    // incorretos, para nao revelar quais contas existem.
    'auth/invalid-credential': 'E-mail ou senha incorretos.',
    'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
    'auth/network-request-failed': 'Falha de rede. Verifique sua conexao.',
  };

  return mensagens[codigo] || 'Nao foi possivel entrar. Tente novamente.';
}

export async function fazerLogin(email, senha) {
  const credencial = await signInWithEmailAndPassword(auth, email, senha);
  console.log('[auth] Login realizado:', credencial.user.email);
  return credencial.user;
}

export async function fazerLogout() {
  await signOut(auth);
  console.log('[auth] Sessao encerrada.');
}

/**
 * Protege a pagina e devolve o usuario com o perfil do banco.
 * @param {string} caminhoLogin caminho relativo para a tela de login
 */
export async function protegerPagina(caminhoLogin = '../index.html') {
  const usuarioFirebase = await aguardarUsuario();

  if (!usuarioFirebase) {
    window.location.replace(caminhoLogin);
    // Promise que nunca resolve: evita que o resto da pagina execute
    // durante o redirecionamento.
    return new Promise(() => {});
  }

  try {
    const resposta = await api.get('/usuarios/eu');
    return resposta.dados;
  } catch (erro) {
    console.error('[auth] Nao foi possivel carregar o perfil:', erro.message);

    // Token valido no Firebase e recusado pelo backend (usuario
    // desativado): encerra a sessao em vez de abrir a tela sem acesso.
    if (erro.status === 403) {
      await fazerLogout();
      window.location.replace(`${caminhoLogin}?semAcesso=1`);
      return new Promise(() => {});
    }

    throw erro;
  }
}

export const ehAdmin = (usuario) => usuario?.perfil === 'ADMIN';
