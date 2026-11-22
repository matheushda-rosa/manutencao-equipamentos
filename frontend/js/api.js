/**
 * Cliente HTTP da aplicacao.
 * Centraliza o token do Firebase, o formato de erro da API, o
 * redirecionamento no 401 e a escolha entre JSON e FormData.
 */
import { API_URL } from './config.js';
import { auth } from './firebase.js';

/** Erro de API, com a mensagem que o backend devolveu. */
export class ErroApi extends Error {
  constructor(mensagem, status, detalhes) {
    super(mensagem);
    this.name = 'ErroApi';
    this.status = status;
    this.detalhes = detalhes;
  }
}

/** Pega o token do usuario logado. */
async function obterToken() {
  const usuario = auth.currentUser;
  if (!usuario) return null;

  // getIdToken cuida da renovacao: o token do Firebase expira em 1h e
  // o SDK devolve um novo automaticamente quando necessario.
  return usuario.getIdToken();
}

/**
 * Executa a requisicao.
 * @param {string} caminho  ex.: '/equipamentos'
 * @param {object} opcoes   { metodo, corpo, query }
 */
export async function requisicao(caminho, { metodo = 'GET', corpo, query } = {}) {
  const url = new URL(API_URL + caminho);

  if (query) {
    Object.entries(query).forEach(([chave, valor]) => {
      // Ignora filtros vazios para nao enviar "?status=" na URL.
      if (valor !== undefined && valor !== null && valor !== '') {
        url.searchParams.set(chave, valor);
      }
    });
  }

  const cabecalhos = {};
  const token = await obterToken();
  if (token) cabecalhos.Authorization = `Bearer ${token}`;

  let body;

  if (corpo instanceof FormData) {
    // Com FormData NAO definimos Content-Type: o navegador precisa
    // gerar o boundary do multipart por conta propria.
    body = corpo;
  } else if (corpo !== undefined) {
    cabecalhos['Content-Type'] = 'application/json';
    body = JSON.stringify(corpo);
  }

  let resposta;

  try {
    resposta = await fetch(url, { method: metodo, headers: cabecalhos, body });
  } catch (erro) {
    // Cai aqui quando a API esta fora do ar ou o CORS bloqueou.
    console.error('[api] Falha de rede:', erro);
    throw new ErroApi(
      'Nao foi possivel contatar o servidor. Verifique sua conexao e se a API esta no ar.',
      0
    );
  }

  // 204 nao tem corpo para interpretar.
  const dados = resposta.status === 204 ? null : await resposta.json().catch(() => null);

  if (!resposta.ok) {
    if (resposta.status === 401) {
      console.warn('[api] Sessao expirada, redirecionando para o login.');
      window.location.href = caminho.startsWith('/') && window.location.pathname.includes('/pages/')
        ? '../index.html?expirada=1'
        : 'index.html?expirada=1';
    }

    throw new ErroApi(
      dados?.mensagem || `Erro ${resposta.status} ao chamar a API.`,
      resposta.status,
      dados?.detalhes
    );
  }

  return dados;
}

/** Atalhos para deixar o codigo das telas mais curto. */
export const api = {
  get: (caminho, query) => requisicao(caminho, { query }),
  post: (caminho, corpo) => requisicao(caminho, { metodo: 'POST', corpo }),
  put: (caminho, corpo) => requisicao(caminho, { metodo: 'PUT', corpo }),
  patch: (caminho, corpo) => requisicao(caminho, { metodo: 'PATCH', corpo }),
  remover: (caminho) => requisicao(caminho, { metodo: 'DELETE' }),
};
