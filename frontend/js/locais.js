/**
 * Tela de Locais (item 4.5 do enunciado).
 * A consulta ao ViaCEP fica isolada em js/viacep.js; esta tela apenas
 * liga o formulario a ela.
 */
import { protegerPagina } from './auth.js';
import { renderizarLayout, renderizarTitulo } from './layout.js';
import { api } from './api.js';
import { ligarAutocompleteCep, formatarCep } from './viacep.js';
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

renderizarLayout({ usuario, ativo: 'locais' });
renderizarTitulo({
  titulo: 'Locais',
  descricao: 'Onde os equipamentos estao instalados.',
  acao: `<button class="btn btn-primary" id="btnNovo">
           <i class="bi bi-plus-lg me-1"></i>Novo local
         </button>`,
});

const estado = { pagina: 1, busca: '' };

const tabela = document.getElementById('tabela');
const resumo = document.getElementById('resumo');
const paginacao = document.getElementById('paginacao');
const formulario = document.getElementById('formulario');
const modal = new bootstrap.Modal('#modalForm');
const botaoSalvar = document.getElementById('btnSalvar');

const CAMPOS = ['nome', 'cep', 'logradouro', 'numero', 'complemento', 'bairro', 'cidade', 'uf'];

// Liga o autocomplete de CEP uma unica vez, no formulario.
ligarAutocompleteCep(formulario, {
  aoErro: (erro) => avisar(erro.message, 'warning'),
  aoSucesso: () => console.log('[locais] Endereco preenchido pelo ViaCEP.'),
});

// ----------------------------- Listagem -----------------------------

function montarEndereco(local) {
  const partes = [local.logradouro, local.numero, local.complemento].filter(Boolean);
  return `${partes.join(', ')} - ${local.bairro}`;
}

function desenharLinhas(locais) {
  if (locais.length === 0) {
    tabela.innerHTML = linhaVazia(5, 'Nenhum local cadastrado.');
    return;
  }

  tabela.innerHTML = locais
    .map(
      (local) => `
        <tr>
          <td class="fw-semibold">${esc(local.nome)}</td>
          <td class="text-secondary">
            ${esc(montarEndereco(local))}
            <div class="smaller">CEP ${esc(local.cep)}</div>
          </td>
          <td>${esc(local.cidade)}/${esc(local.uf)}</td>
          <td class="text-center">
            <span class="badge text-bg-light border">${local._count.equipamentos}</span>
          </td>
          <td class="coluna-acoes text-end">
            <button class="btn btn-sm btn-outline-secondary" data-acao="editar"
                    data-id="${local.id}" title="Editar">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger" data-acao="excluir"
                    data-id="${local.id}" data-nome="${esc(local.nome)}" title="Excluir">
              <i class="bi bi-trash"></i>
            </button>
          </td>
        </tr>`
    )
    .join('');
}

async function carregar() {
  tabela.innerHTML = linhaCarregando(5);

  try {
    const resposta = await api.get('/locais', { busca: estado.busca, pagina: estado.pagina });

    desenharLinhas(resposta.dados);
    resumo.textContent = `${resposta.paginacao.total} local(is)`;

    renderizarPaginacao(paginacao, resposta.paginacao, (pagina) => {
      estado.pagina = pagina;
      carregar();
    });
  } catch (erro) {
    console.error('[locais] Falha ao listar:', erro);
    tabela.innerHTML = linhaVazia(5, 'Nao foi possivel carregar a lista.');
    avisar(erro.message, 'danger');
  }
}

// ------------------------- Cadastro e edicao ------------------------

function abrirFormulario(local = null) {
  formulario.reset();
  formulario.querySelectorAll('.is-invalid').forEach((el) => el.classList.remove('is-invalid'));
  formulario.querySelectorAll('.invalid-feedback.api').forEach((el) => el.remove());

  document.getElementById('modalTitulo').textContent = local ? 'Editar local' : 'Novo local';
  formulario.elements.id.value = local?.id || '';

  CAMPOS.forEach((campo) => {
    formulario.elements[campo].value = local?.[campo] || '';
  });

  modal.show();
  setTimeout(() => formulario.elements.nome.focus(), 300);
}

document.getElementById('btnNovo').addEventListener('click', () => abrirFormulario());

formulario.addEventListener('submit', async (evento) => {
  evento.preventDefault();

  const id = formulario.elements.id.value;

  const corpo = {};
  CAMPOS.forEach((campo) => {
    const valor = formulario.elements[campo].value.trim();
    // Campos opcionais em branco nao vao no corpo: o backend trata
    // ausencia e string vazia de formas diferentes.
    if (valor) corpo[campo] = valor;
  });

  corpo.cep = formatarCep(corpo.cep || '');

  botaoSalvar.disabled = true;
  botaoSalvar.querySelector('.spinner-border').classList.remove('d-none');

  try {
    const resposta = id
      ? await api.put(`/locais/${id}`, corpo)
      : await api.post('/locais', corpo);

    modal.hide();
    avisar(resposta.mensagem);
    carregar();
  } catch (erro) {
    console.warn('[locais] Falha ao salvar:', erro.message);
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
      const { dados } = await api.get(`/locais/${id}`);
      abrirFormulario(dados);
    } catch (erro) {
      avisar(erro.message, 'danger');
    }
    return;
  }

  if (acao === 'excluir') {
    const confirmado = await confirmar(`Excluir o local "${nome}"?`, {
      titulo: 'Excluir local',
      rotuloOk: 'Excluir',
    });

    if (!confirmado) return;

    try {
      const resposta = await api.remover(`/locais/${id}`);
      avisar(resposta.mensagem);
      carregar();
    } catch (erro) {
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
