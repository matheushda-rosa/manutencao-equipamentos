/**
 * Tela de Usuarios: define quem e ADMIN e quem e TECNICO.
 * A criacao de usuarios fica no Firebase Authentication, que ja trata
 * hash de senha, recuperacao e bloqueio por tentativas.
 */
import { protegerPagina } from './auth.js';
import { renderizarLayout, renderizarTitulo } from './layout.js';
import { api } from './api.js';
import { avisar, confirmar, esc, formatarDataHora, linhaCarregando, linhaVazia } from './ui.js';

const usuario = await protegerPagina();

renderizarLayout({ usuario, ativo: 'usuarios' });
renderizarTitulo({
  titulo: 'Usuarios',
  descricao: 'Controle de perfis de acesso ao sistema.',
});

const tabela = document.getElementById('tabela');

function desenhar(usuarios) {
  if (usuarios.length === 0) {
    tabela.innerHTML = linhaVazia(5, 'Nenhum usuario registrado.');
    return;
  }

  tabela.innerHTML = usuarios
    .map((item) => {
      const ehAtual = item.id === usuario.id;
      const alvo = item.perfil === 'ADMIN' ? 'TECNICO' : 'ADMIN';

      return `
        <tr>
          <td class="fw-semibold">
            ${esc(item.nome)}
            ${ehAtual ? '<span class="badge text-bg-light border ms-1">voce</span>' : ''}
          </td>
          <td class="text-secondary">${esc(item.email)}</td>
          <td>
            <span class="badge text-bg-${item.perfil === 'ADMIN' ? 'primary' : 'secondary'}">
              ${esc(item.perfil)}
            </span>
          </td>
          <td class="smaller text-secondary">${formatarDataHora(item.criadoEm)}</td>
          <td class="coluna-acoes text-end">
            <button class="btn btn-sm btn-outline-primary" data-acao="perfil"
                    data-id="${item.id}" data-perfil="${alvo}" data-nome="${esc(item.nome)}"
                    ${ehAtual ? 'disabled title="Voce nao pode alterar o seu proprio perfil"' : ''}>
              Tornar ${alvo}
            </button>
          </td>
        </tr>`;
    })
    .join('');
}

async function carregar() {
  tabela.innerHTML = linhaCarregando(5);

  try {
    const { dados } = await api.get('/usuarios');
    desenhar(dados);
  } catch (erro) {
    console.error('[usuarios] Falha ao listar:', erro);
    tabela.innerHTML = linhaVazia(5, 'Nao foi possivel carregar a lista.');
    avisar(erro.message, 'danger');
  }
}

tabela.addEventListener('click', async (evento) => {
  const botao = evento.target.closest('button[data-acao="perfil"]');
  if (!botao) return;

  const { id, perfil, nome } = botao.dataset;

  const confirmado = await confirmar(
    `Alterar o perfil de ${nome} para ${perfil}?`,
    { titulo: 'Alterar perfil', rotuloOk: 'Alterar', perigo: false }
  );

  if (!confirmado) return;

  try {
    const resposta = await api.patch(`/usuarios/${id}/perfil`, { perfil });
    avisar(resposta.mensagem);
    carregar();
  } catch (erro) {
    avisar(erro.message, 'danger');
  }
});

carregar();
