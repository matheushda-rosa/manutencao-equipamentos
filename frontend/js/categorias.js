/**
 * Tela de Categorias (item 4.4 do enunciado).
 * Um unico modal atende criacao e edicao; o campo oculto "id"
 * distingue os dois casos.
 */
import { protegerPagina } from './auth.js';
import { renderizarLayout, renderizarTitulo } from './layout.js';
import { api } from './api.js';
import {
  avisar,
  confirmar,
  debounce,
  esc,
  linhaCarregando,
  linhaVazia,
  mostrarErros,
  renderizarPaginacao,
} from './ui.js';

const usuario = await protegerPagina();

renderizarLayout({ usuario, ativo: 'categorias' });
renderizarTitulo({
  titulo: 'Categorias',
  descricao: 'Agrupamento dos equipamentos por tipo.',
  acao: `<button class="btn btn-primary" id="btnNovo">
           <i class="bi bi-plus-lg me-1"></i>Nova categoria
         </button>`,
});

const estado = { pagina: 1, busca: '' };

const tabela = document.getElementById('tabela');
const resumo = document.getElementById('resumo');
const paginacao = document.getElementById('paginacao');
const formulario = document.getElementById('formulario');
const modal = new bootstrap.Modal('#modalForm');
const botaoSalvar = document.getElementById('btnSalvar');

// ----------------------------- Listagem -----------------------------

function desenharLinhas(categorias) {
  if (categorias.length === 0) {
    tabela.innerHTML = linhaVazia(4, 'Nenhuma categoria cadastrada.');
    return;
  }

  tabela.innerHTML = categorias
    .map(
      (categoria) => `
        <tr>
          <td class="fw-semibold">${esc(categoria.nome)}</td>
          <td class="text-secondary">${esc(categoria.descricao || '-')}</td>
          <td class="text-center">
            <span class="badge text-bg-light border">${categoria._count.equipamentos}</span>
          </td>
          <td class="coluna-acoes text-end">
            <button class="btn btn-sm btn-outline-secondary" data-acao="editar"
                    data-id="${categoria.id}" title="Editar">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger" data-acao="excluir"
                    data-id="${categoria.id}" data-nome="${esc(categoria.nome)}" title="Excluir">
              <i class="bi bi-trash"></i>
            </button>
          </td>
        </tr>`
    )
    .join('');
}

async function carregar() {
  tabela.innerHTML = linhaCarregando(4);

  try {
    const resposta = await api.get('/categorias', {
      busca: estado.busca,
      pagina: estado.pagina,
    });

    desenharLinhas(resposta.dados);

    resumo.textContent = `${resposta.paginacao.total} categoria(s)`;
    renderizarPaginacao(paginacao, resposta.paginacao, (pagina) => {
      estado.pagina = pagina;
      carregar();
    });
  } catch (erro) {
    console.error('[categorias] Falha ao listar:', erro);
    tabela.innerHTML = linhaVazia(4, 'Nao foi possivel carregar a lista.');
    avisar(erro.message, 'danger');
  }
}

// ------------------------- Cadastro e edicao ------------------------

function abrirFormulario(categoria = null) {
  formulario.reset();
  formulario.querySelectorAll('.is-invalid').forEach((el) => el.classList.remove('is-invalid'));
  formulario.querySelectorAll('.invalid-feedback.api').forEach((el) => el.remove());

  document.getElementById('modalTitulo').textContent = categoria
    ? 'Editar categoria'
    : 'Nova categoria';

  formulario.elements.id.value = categoria?.id || '';
  formulario.elements.nome.value = categoria?.nome || '';
  formulario.elements.descricao.value = categoria?.descricao || '';

  modal.show();
  // Pequeno atraso: o foco so funciona depois que o modal termina de abrir.
  setTimeout(() => formulario.elements.nome.focus(), 300);
}

document.getElementById('btnNovo').addEventListener('click', () => abrirFormulario());

formulario.addEventListener('submit', async (evento) => {
  evento.preventDefault();

  const id = formulario.elements.id.value;
  const corpo = {
    nome: formulario.elements.nome.value.trim(),
    descricao: formulario.elements.descricao.value.trim(),
  };

  botaoSalvar.disabled = true;
  botaoSalvar.querySelector('.spinner-border').classList.remove('d-none');

  try {
    // id preenchido = edicao (PUT); vazio = criacao (POST).
    const resposta = id
      ? await api.put(`/categorias/${id}`, corpo)
      : await api.post('/categorias', corpo);

    modal.hide();
    avisar(resposta.mensagem);
    carregar();
  } catch (erro) {
    console.warn('[categorias] Falha ao salvar:', erro.message);
    mostrarErros(formulario, erro);
  } finally {
    botaoSalvar.disabled = false;
    botaoSalvar.querySelector('.spinner-border').classList.add('d-none');
  }
});

// ------------------------------ Acoes -------------------------------

// Delegacao de eventos: a tabela e redesenhada a cada carregamento.
tabela.addEventListener('click', async (evento) => {
  const botao = evento.target.closest('button[data-acao]');
  if (!botao) return;

  const { acao, id, nome } = botao.dataset;

  if (acao === 'editar') {
    try {
      const { dados } = await api.get(`/categorias/${id}`);
      abrirFormulario(dados);
    } catch (erro) {
      avisar(erro.message, 'danger');
    }
    return;
  }

  if (acao === 'excluir') {
    const confirmado = await confirmar(
      `Excluir a categoria "${nome}"? Esta acao nao pode ser desfeita.`,
      { titulo: 'Excluir categoria', rotuloOk: 'Excluir' }
    );

    if (!confirmado) return;

    try {
      const resposta = await api.remover(`/categorias/${id}`);
      avisar(resposta.mensagem);
      carregar();
    } catch (erro) {
      // A API recusa a exclusao quando ha equipamentos vinculados,
      // com uma mensagem explicando o motivo.
      avisar(erro.message, 'danger');
    }
  }
});

document.getElementById('busca').addEventListener(
  'input',
  debounce((evento) => {
    estado.busca = evento.target.value.trim();
    estado.pagina = 1; // volta para a primeira pagina a cada nova busca
    carregar();
  })
);

carregar();
