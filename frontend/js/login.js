/**
 * Tela de login: valida os campos, autentica no Firebase, traduz os
 * erros para portugues e desvia quem ja tem sessao ativa.
 */
import { fazerLogin, aguardarUsuario, traduzirErroLogin } from './auth.js';
import { configuracaoPendente } from './config.js';

const formulario = document.getElementById('formLogin');
const campoEmail = document.getElementById('email');
const campoSenha = document.getElementById('senha');
const erroEmail = document.getElementById('erroEmail');
const erroSenha = document.getElementById('erroSenha');
const aviso = document.getElementById('aviso');
const botao = document.getElementById('btnEntrar');
const carregando = document.getElementById('carregando');

function mostrarAviso(mensagem, tipo = 'danger') {
  aviso.className = `alert alert-${tipo}`;
  aviso.textContent = mensagem;
}

function limparAviso() {
  aviso.className = 'alert d-none';
  aviso.textContent = '';
}

function limparErros() {
  erroEmail.textContent = '';
  erroSenha.textContent = '';
  campoEmail.classList.remove('is-invalid');
  campoSenha.classList.remove('is-invalid');
}

function definirCarregando(ativo) {
  botao.disabled = ativo;
  carregando.classList.toggle('d-none', !ativo);
}

// --- Mensagens de contexto vindas por query string -----------------
const parametros = new URLSearchParams(window.location.search);

if (parametros.has('expirada')) {
  mostrarAviso('Sua sessao expirou. Entre novamente.', 'warning');
} else if (parametros.has('semAcesso')) {
  mostrarAviso('Seu usuario nao tem acesso ao sistema. Procure o administrador.', 'warning');
}

if (configuracaoPendente()) {
  mostrarAviso(
    'O arquivo js/config.js ainda nao foi configurado com os dados do Firebase.',
    'warning'
  );
}

// --- Se ja estiver logado, nao faz sentido mostrar o login ---------
aguardarUsuario().then((usuario) => {
  if (usuario) {
    console.log('[login] Sessao ativa encontrada, redirecionando.');
    window.location.replace('pages/dashboard.html');
  }
});

// --- Mostrar/ocultar senha -----------------------------------------
document.getElementById('btnVerSenha').addEventListener('click', () => {
  const visivel = campoSenha.type === 'text';
  campoSenha.type = visivel ? 'password' : 'text';
  document.getElementById('iconeSenha').className = visivel ? 'bi bi-eye' : 'bi bi-eye-slash';
});

// --- Envio ----------------------------------------------------------
formulario.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  limparErros();
  limparAviso();

  const email = campoEmail.value.trim();
  const senha = campoSenha.value;
  let valido = true;

  if (!email) {
    erroEmail.textContent = 'Informe o e-mail.';
    campoEmail.classList.add('is-invalid');
    valido = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    erroEmail.textContent = 'E-mail invalido.';
    campoEmail.classList.add('is-invalid');
    valido = false;
  }

  if (!senha) {
    erroSenha.textContent = 'Informe a senha.';
    campoSenha.classList.add('is-invalid');
    valido = false;
  }

  if (!valido) return;

  definirCarregando(true);

  try {
    await fazerLogin(email, senha);
    window.location.replace('pages/dashboard.html');
  } catch (erro) {
    console.warn('[login] Falha na autenticacao:', erro.code);
    mostrarAviso(traduzirErroLogin(erro.code));
    campoSenha.value = '';
    campoSenha.focus();
  } finally {
    definirCarregando(false);
  }
});
