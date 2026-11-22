/**
 * Tela de Tecnicos (item 4.6 do enunciado).
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

renderizarLayout({ usuario, ativo: 'tecnicos' });
renderizarTitulo({
  titulo: 'Tecnicos',
  descricao: 'Equipe responsavel pelas manutencoes.',
  acao: `<button class="btn btn-primary" id="btnNovo">
           <i class="bi bi-plus-lg me-1"></i>Novo tecnico
         </button>`,
});

const estado = { pagina: 1, busca: '' };

const tabela = document.getElementById('tabela');
const resumo = document.getElementById('resumo');
const paginacao = document.getElementById('paginacao');
const formulario = document.getElementById('formulario');
const modal = new bootstrap.Modal('#modalForm');
const botaoSalvar = document.getElementById('btnSalvar');

/** Aplica a mascara de telefone conforme o usuario digita. */
function aplicarMascaraTelefone(valor) {
  const digitos = valor.replace(/\D/g, '').slice(0, 11);

  if (digitos.length <= 2) return digitos;
  if (digitos.length <= 6) return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
  if (digitos.length <= 10) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
  }
  return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
}

formulario.elements.telefone.addEventListener('input', (evento) => {
  evento.target.value = aplicarMascaraTelefone(evento.target.value);
});

// ----------------------------- Listagem -----------------------------

function desenharLinhas(tecnicos) {
  if (tecnicos.length === 0) {
    tabela.innerHTML = linhaVazia(6, 'Nenhum tecnico cadastrado.');
    return;
  }

  tabela.innerHTML = tecnicos
    .map(
      (tecnico) => `
        <tr class="${tecnico.ativo ? '' : 'opacity-75'}">
          <td class="fw-semibold">${esc(tecnico.nome)}</td>
          <td>${esc(tecnico.especialidade)}</td>
          <td class="text-secondary smaller">
            <div>${esc(tecnico.telefone)}</div>
            <div>${esc(tecnico.email)}</div>
          </td>
          <td class="text-center">
            <span class="badge text-bg-light border">${tecnico._count.ordens}</span>
          </td>
          <td class="text-center">
            <span class="badge text-bg-${tecnico.ativo ? 'success' : 'secondary'}">
              ${tecnico.ativo ? 'Ativo' : 'Inativo'}
            </span>
          </td>
          <td class="coluna-acoes text-end">
            <button class="btn btn-sm btn-outline-secondary" data-acao="editar"
                    data-id="${tecnico.id}" title="Editar">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger" data-acao="excluir"
                    data-id="${tecnico.id}" data-nome="${esc(tecnico.nome)}" title="Excluir">
              <i class="bi bi-trash"></i>
            </button>
          </td>
        </tr>`
    )
    .join('');
}

async function carregar() {
  tabela.innerHTML = linhaCarregando(6);

  try {
    const resposta = await api.get('/tecnicos', { busca: estado.busca, pagina: estado.pagina });

    desenharLinhas(resposta.dados);
    resumo.textContent = `${resposta.paginacao.total} tecnico(s)`;

    renderizarPaginacao(paginacao, resposta.paginacao, (pagina) => {
      estado.pagina = pagina;
      carregar();
    });
  } catch (erro) {
    console.error('[tecnicos] Falha ao listar:', erro);
    tabela.innerHTML = linhaVazia(6, 'Nao foi possivel carregar a lista.');
    avisar(erro.message, 'danger');
  }
}

// ------------------------- Cadastro e edicao ------------------------

function abrirFormulario(tecnico = null) {
  formulario.reset();
  formulario.querySelectorAll('.is-invalid').forEach((el) => el.classList.remove('is-invalid'));
  formulario.querySelectorAll('.invalid-feedback.api').forEach((el) => el.remove());

  document.getElementById('modalTitulo').textContent = tecnico ? 'Editar tecnico' : 'Novo tecnico';

  formulario.elements.id.value = tecnico?.id || '';
  formulario.elements.nome.value = tecnico?.nome || '';
  formulario.elements.especialidade.value = tecnico?.especialidade || '';
  formulario.elements.telefone.value = tecnico?.telefone || '';
  formulario.elements.email.value = tecnico?.email || '';
  // Novo cadastro entra como ativo; na edicao respeita o valor atual.
  formulario.elements.ativo.checked = tecnico ? tecnico.ativo : true;

  modal.show();
  setTimeout(() => formulario.elements.nome.focus(), 300);
}

document.getElementById('btnNovo').addEventListener('click', () => abrirFormulario());

formulario.addEventListener('submit', async (evento) => {
  evento.preventDefault();

  const id = formulario.elements.id.value;

  const corpo = {
    nome: formulario.elements.nome.value.trim(),
    especialidade: formulario.elements.especialidade.value.trim(),
    telefone: formulario.elements.telefone.value.trim(),
    email: formulario.elements.email.value.trim(),
    // Checkbox nao enviado pelo FormData quando desmarcado: lemos a
    // propriedade .checked diretamente para nao perder o valor "false".
    ativo: formulario.elements.ativo.checked,
  };

  botaoSalvar.disabled = true;
  botaoSalvar.querySelector('.spinner-border').classList.remove('d-none');

  try {
    const resposta = id
      ? await api.put(`/tecnicos/${id}`, corpo)
      : await api.post('/tecnicos', corpo);

    modal.hide();
    avisar(resposta.mensagem);
    carregar();
  } catch (erro) {
    console.warn('[tecnicos] Falha ao salvar:', erro.message);
    mostrarErros(formulario, erro);
  } finally {
    botaoSalvar.disabled = false;
    botaoSalvar.querySelector('.spinner-border').classList.add('d-none');
  }
});

// ------------------------------ Acoes -------------------------------

tabela.addEventListener('click', async (evento) => {
  const botao = evento.target.closest('button[data-acao]');
  if (!botao) return;

  const { acao, id, nome } = botao.dataset;

  if (acao === 'editar') {
    try {
      const { dados } = await api.get(`/tecnicos/${id}`);
      abrirFormulario(dados);
    } catch (erro) {
      avisar(erro.message, 'danger');
    }
    return;
  }

  if (acao === 'excluir') {
    const confirmado = await confirmar(`Excluir o tecnico "${nome}"?`, {
      titulo: 'Excluir tecnico',
      rotuloOk: 'Excluir',
    });

    if (!confirmado) return;

    try {
      const resposta = await api.remover(`/tecnicos/${id}`);
      avisar(resposta.mensagem);
      carregar();
    } catch (erro) {
      // Tecnico com ordens vinculadas nao pode ser excluido: a API
      // sugere desativar o cadastro.
      avisar(erro.message, 'danger');
    }
  }
});

document.getElementById('busca').addEventListener(
  'input',
  debounce((evento) => {
    estado.busca = evento.target.value.trim();
    estado.pagina = 1;
    carregar();
  })
);

carregar();
