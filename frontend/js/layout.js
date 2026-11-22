/**
 * Monta o cabecalho e o menu das paginas internas.
 *
 * O menu e gerado em um unico lugar e filtrado pelo perfil do usuario
 * (item 4.10 do enunciado). Isso e apresentacao: a permissao efetiva e
 * aplicada pelo backend, que responde 403.
 */
import { fazerLogout } from './auth.js';
import { esc } from './ui.js';

const ITENS_MENU = [
  { id: 'dashboard', rotulo: 'Dashboard', arquivo: 'dashboard.html', perfis: ['ADMIN', 'TECNICO'] },
  { id: 'equipamentos', rotulo: 'Equipamentos', arquivo: 'equipamentos.html', perfis: ['ADMIN', 'TECNICO'] },
  { id: 'ordens', rotulo: 'Ordens de Servico', arquivo: 'ordens.html', perfis: ['ADMIN', 'TECNICO'] },
  { id: 'categorias', rotulo: 'Categorias', arquivo: 'categorias.html', perfis: ['ADMIN'] },
  { id: 'locais', rotulo: 'Locais', arquivo: 'locais.html', perfis: ['ADMIN'] },
  { id: 'tecnicos', rotulo: 'Tecnicos', arquivo: 'tecnicos.html', perfis: ['ADMIN'] },
  { id: 'usuarios', rotulo: 'Usuarios', arquivo: 'usuarios.html', perfis: ['ADMIN'] },
];

/** Iniciais do nome, para o avatar do menu. */
function iniciais(nome) {
  return String(nome || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase();
}

export function renderizarLayout({ usuario, ativo }) {
  const alvo = document.getElementById('cabecalho');
  if (!alvo) return;

  const itens = ITENS_MENU.filter((item) => item.perfis.includes(usuario.perfil))
    .map(
      (item) => `
        <li class="nav-item">
          <a class="nav-link ${item.id === ativo ? 'active' : ''}" href="${item.arquivo}">
            ${esc(item.rotulo)}
          </a>
        </li>`
    )
    .join('');

  alvo.innerHTML = `
    <nav class="navbar navbar-expand-lg navbar-dark app-navbar sticky-top">
      <div class="container-fluid px-lg-4">
        <a class="navbar-brand d-flex align-items-center gap-2" href="dashboard.html">
          <span class="navbar-logo" aria-hidden="true">MN</span>
          <span class="d-none d-sm-inline">Controle de Manutencao</span>
        </a>

        <button class="navbar-toggler" type="button" data-bs-toggle="collapse"
                data-bs-target="#menuPrincipal" aria-controls="menuPrincipal"
                aria-expanded="false" aria-label="Alternar navegacao">
          <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" id="menuPrincipal">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">${itens}</ul>

          <div class="dropdown">
            <button class="btn btn-sm btn-outline-light dropdown-toggle d-flex align-items-center gap-2"
                    data-bs-toggle="dropdown" aria-expanded="false">
              <span class="avatar-iniciais">${esc(iniciais(usuario.nome))}</span>
              <span class="text-start lh-sm d-none d-sm-block">
                <span class="d-block small">${esc(usuario.nome)}</span>
                <span class="d-block smaller opacity-75">${esc(usuario.perfil)}</span>
              </span>
            </button>
            <ul class="dropdown-menu dropdown-menu-end">
              <li><h6 class="dropdown-header">${esc(usuario.email)}</h6></li>
              <li><hr class="dropdown-divider"></li>
              <li><button class="dropdown-item text-danger" id="btnSair">Sair</button></li>
            </ul>
          </div>
        </div>
      </div>
    </nav>`;

  document.getElementById('btnSair').addEventListener('click', async () => {
    await fazerLogout();
    window.location.replace('../index.html');
  });
}

/**
 * Titulo da pagina com um botao de acao opcional a direita.
 */
export function renderizarTitulo({ titulo, descricao, acao }) {
  const alvo = document.getElementById('titulo-pagina');
  if (!alvo) return;

  alvo.innerHTML = `
    <div class="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
      <div>
        <h1 class="h3 mb-1">${esc(titulo)}</h1>
        ${descricao ? `<p class="text-secondary mb-0">${esc(descricao)}</p>` : ''}
      </div>
      ${acao ? `<div>${acao}</div>` : ''}
    </div>`;
}
