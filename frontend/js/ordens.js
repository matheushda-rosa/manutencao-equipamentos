/**
 * Tela de Ordens de Servico (item 4.7 do enunciado).
 * As transicoes validas sao repetidas aqui para montar o select; a
 * decisao final e do backend, que recusa transicao proibida.
 */
import { protegerPagina, ehAdmin } from './auth.js';
import { renderizarLayout, renderizarTitulo } from './layout.js';
import { api } from './api.js';
import {
  avisar,
  debounce,
  esc,
  formatarDataHora,
  linhaCarregando,
  linhaVazia,
  mostrarErros,
  preencherSelect,
  renderizarPaginacao,
  rotuloStatusOrdem,
  seloPrioridade,
  seloStatusOrdem,
} from './ui.js';

/** Espelho de TRANSICOES_PERMITIDAS do backend. */
const TRANSICOES = {
  ABERTA: ['EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA'],
  EM_ANDAMENTO: ['CONCLUIDA', 'CANCELADA'],
  CONCLUIDA: [],
  CANCELADA: [],
};

const usuario = await protegerPagina();
const administrador = ehAdmin(usuario);

renderizarLayout({ usuario, ativo: 'ordens' });
renderizarTitulo({
  titulo: 'Ordens de Servico',
  descricao: 'Abertura, acompanhamento e conclusao das manutencoes.',
  acao: administrador
    ? `<button class="btn btn-primary" id="btnNovo">
         <i class="bi bi-plus-lg me-1"></i>Abrir ordem
       </button>`
    : '',
});

const estado = { pagina: 1, busca: '', status: '', tipo: '', prioridade: '', tecnicoId: '' };

const tabela = document.getElementById('tabela');
const resumo = document.getElementById('resumo');
const paginacao = document.getElementById('paginacao');

const formulario = document.getElementById('formulario');
const modal = new bootstrap.Modal('#modalForm');
const botaoSalvar = document.getElementById('btnSalvar');

const formularioStatus = document.getElementById('formularioStatus');
const modalStatus = new bootstrap.Modal('#modalStatus');
const botaoSalvarStatus = document.getElementById('btnSalvarStatus');
const campoSolucao = document.getElementById('campoSolucao');

// ------------------------- Listas auxiliares ------------------------

async function carregarListasAuxiliares() {
  try {
    const [tecnicos, equipamentos] = await Promise.all([
      api.get('/tecnicos', { limite: 100 }),
      api.get('/equipamentos', { limite: 100 }),
    ]);

    preencherSelect(document.getElementById('filtroTecnico'), tecnicos.dados, {
      vazio: 'Todos',
    });

    if (administrador) {
      // Somente tecnicos ativos podem receber novas ordens.
      preencherSelect(
        formulario.elements.tecnicoId,
        tecnicos.dados.filter((tecnico) => tecnico.ativo),
        { vazio: 'Selecione o tecnico' }
      );

      // Equipamentos inativos nao aceitam abertura de OS (regra do
      // service), entao nem aparecem na lista.
      const disponiveis = equipamentos.dados
        .filter((equipamento) => equipamento.status !== 'INATIVO')
        .map((equipamento) => ({
          id: equipamento.id,
          nome: `${equipamento.patrimonio} - ${equipamento.nome}`,
        }));

      preencherSelect(formulario.elements.equipamentoId, disponiveis, {
        vazio: 'Selecione o equipamento',
      });
    }
  } catch (erro) {
    console.error('[ordens] Falha ao carregar listas auxiliares:', erro);
    avisar('Nao foi possivel carregar tecnicos e equipamentos.', 'danger');
  }
}

// ----------------------------- Listagem -----------------------------

function montarAcoes(ordem) {
  const encerrada = ['CONCLUIDA', 'CANCELADA'].includes(ordem.status);

  const botoes = [
    `<a href="equipamento.html?id=${ordem.equipamento.id}"
        class="btn btn-sm btn-outline-secondary" title="Historico do equipamento">
       <i class="bi bi-clock-history"></i>
     </a>`,
  ];

  if (!encerrada) {
    // Alterar status e concluir: permitido tambem ao TECNICO.
    botoes.push(`
      <button class="btn btn-sm btn-outline-primary" data-acao="status"
              data-id="${ordem.id}" data-status="${ordem.status}" title="Alterar status">
        <i class="bi bi-arrow-repeat"></i>
      </button>`);

    botoes.push(`
      <button class="btn btn-sm btn-outline-success" data-acao="concluir"
              data-id="${ordem.id}" data-status="${ordem.status}" title="Concluir manutencao">
        <i class="bi bi-check2-circle"></i>
      </button>`);

    if (administrador) {
      botoes.push(`
        <button class="btn btn-sm btn-outline-secondary" data-acao="editar"
                data-id="${ordem.id}" title="Editar dados da ordem">
          <i class="bi bi-pencil"></i>
        </button>`);
    }
  }

  return botoes.join('');
}

function desenharLinhas(ordens) {
  if (ordens.length === 0) {
    tabela.innerHTML = linhaVazia(8, 'Nenhuma ordem de servico encontrada.');
    return;
  }

  tabela.innerHTML = ordens
    .map(
      (ordem) => `
        <tr>
          <td class="fw-semibold">#${ordem.id}</td>
          <td>
            <div>${esc(ordem.equipamento.nome)}</div>
            <div class="smaller text-secondary">${esc(ordem.equipamento.patrimonio)}</div>
          </td>
          <td>${esc(ordem.tecnico?.nome || '-')}</td>
          <td><span class="smaller text-uppercase text-secondary">${esc(ordem.tipo)}</span></td>
          <td>${seloPrioridade(ordem.prioridade)}</td>
          <td class="smaller">${formatarDataHora(ordem.dataAbertura)}</td>
          <td>${seloStatusOrdem(ordem.status)}</td>
          <td class="coluna-acoes text-end">
            <div class="d-flex gap-1 justify-content-end">${montarAcoes(ordem)}</div>
          </td>
        </tr>`
    )
    .join('');
}

async function carregar() {
  tabela.innerHTML = linhaCarregando(8);

  try {
    const resposta = await api.get('/ordens-servico', {
      busca: estado.busca,
      status: estado.status,
      tipo: estado.tipo,
      prioridade: estado.prioridade,
      tecnicoId: estado.tecnicoId,
      pagina: estado.pagina,
    });

    desenharLinhas(resposta.dados);
    resumo.textContent = `${resposta.paginacao.total} ordem(ns)`;

    renderizarPaginacao(paginacao, resposta.paginacao, (pagina) => {
      estado.pagina = pagina;
      carregar();
    });
  } catch (erro) {
    console.error('[ordens] Falha ao listar:', erro);
    tabela.innerHTML = linhaVazia(8, 'Nao foi possivel carregar a lista.');
    avisar(erro.message, 'danger');
  }
}

// ----------------------- Abertura e edicao de OS --------------------

function abrirFormulario(ordem = null) {
  formulario.reset();
  formulario.querySelectorAll('.is-invalid').forEach((el) => el.classList.remove('is-invalid'));
  formulario.querySelectorAll('.invalid-feedback.api').forEach((el) => el.remove());

  const edicao = Boolean(ordem);

  document.getElementById('modalTitulo').textContent = edicao
    ? `Editar OS #${ordem.id}`
    : 'Abrir ordem de servico';

  formulario.elements.id.value = ordem?.id || '';
  formulario.elements.equipamentoId.value = ordem?.equipamentoId || '';
  formulario.elements.tecnicoId.value = ordem?.tecnicoId || '';
  formulario.elements.tipo.value = ordem?.tipo || 'CORRETIVA';
  formulario.elements.prioridade.value = ordem?.prioridade || 'MEDIA';
  formulario.elements.descricao.value = ordem?.descricao || '';

  // O equipamento de uma OS existente nao muda: o caminho e cancelar
  // esta ordem e abrir outra.
  formulario.elements.equipamentoId.disabled = edicao;

  modal.show();
  setTimeout(() => formulario.elements.descricao.focus(), 300);
}

document.getElementById('btnNovo')?.addEventListener('click', () => abrirFormulario());

formulario?.addEventListener('submit', async (evento) => {
  evento.preventDefault();

  const id = formulario.elements.id.value;

  botaoSalvar.disabled = true;
  botaoSalvar.querySelector('.spinner-border').classList.remove('d-none');

  try {
    let resposta;

    if (id) {
      // Na edicao enviamos apenas os campos que a API aceita alterar.
      resposta = await api.put(`/ordens-servico/${id}`, {
        tecnicoId: Number(formulario.elements.tecnicoId.value),
        tipo: formulario.elements.tipo.value,
        prioridade: formulario.elements.prioridade.value,
        descricao: formulario.elements.descricao.value.trim(),
      });
    } else {
      resposta = await api.post('/ordens-servico', {
        equipamentoId: Number(formulario.elements.equipamentoId.value),
        tecnicoId: Number(formulario.elements.tecnicoId.value),
        tipo: formulario.elements.tipo.value,
        prioridade: formulario.elements.prioridade.value,
        descricao: formulario.elements.descricao.value.trim(),
      });
    }

    modal.hide();
    avisar(resposta.mensagem);
    carregar();
  } catch (erro) {
    console.warn('[ordens] Falha ao salvar:', erro.message);
    mostrarErros(formulario, erro);
  } finally {
    botaoSalvar.disabled = false;
    botaoSalvar.querySelector('.spinner-border').classList.add('d-none');
  }
});

// ------------------------- Alteracao de status ----------------------

/** Mostra o campo de solucao somente quando o destino e CONCLUIDA. */
function ajustarCampoSolucao() {
  const concluindo = formularioStatus.elements.status.value === 'CONCLUIDA';
  campoSolucao.classList.toggle('d-none', !concluindo);
  formularioStatus.elements.solucao.required = concluindo;
}

formularioStatus.elements.status.addEventListener('change', ajustarCampoSolucao);

/**
 * @param {string} id
 * @param {string} statusAtual
 * @param {string|null} destino status ja escolhido (botao "concluir")
 */
function abrirModalStatus(id, statusAtual, destino = null) {
  formularioStatus.reset();
  formularioStatus.querySelectorAll('.is-invalid').forEach((el) => el.classList.remove('is-invalid'));
  formularioStatus.querySelectorAll('.invalid-feedback.api').forEach((el) => el.remove());

  formularioStatus.elements.id.value = id;

  const possiveis = TRANSICOES[statusAtual] || [];

  if (possiveis.length === 0) {
    avisar('Esta ordem esta encerrada e nao aceita mudanca de status.', 'warning');
    return;
  }

  document.getElementById('statusAtual').innerHTML =
    `OS #${esc(id)} &middot; status atual: <strong>${esc(rotuloStatusOrdem(statusAtual))}</strong>`;

  formularioStatus.elements.status.innerHTML = possiveis
    .map(
      (status) =>
        `<option value="${status}" ${status === destino ? 'selected' : ''}>
           ${esc(rotuloStatusOrdem(status))}
         </option>`
    )
    .join('');

  ajustarCampoSolucao();
  modalStatus.show();

  if (formularioStatus.elements.status.value === 'CONCLUIDA') {
    setTimeout(() => formularioStatus.elements.solucao.focus(), 300);
  }
}

formularioStatus.addEventListener('submit', async (evento) => {
  evento.preventDefault();

  const id = formularioStatus.elements.id.value;
  const status = formularioStatus.elements.status.value;
  const solucao = formularioStatus.elements.solucao.value.trim();

  botaoSalvarStatus.disabled = true;
  botaoSalvarStatus.querySelector('.spinner-border').classList.remove('d-none');

  try {
    const resposta = await api.patch(`/ordens-servico/${id}/status`, {
      status,
      // Enviado so quando relevante: o backend exige a solucao apenas
      // para a conclusao.
      ...(status === 'CONCLUIDA' ? { solucao } : {}),
    });

    modalStatus.hide();
    avisar(resposta.mensagem);
    carregar();
  } catch (erro) {
    console.warn('[ordens] Falha ao alterar status:', erro.message);
    mostrarErros(formularioStatus, erro);
  } finally {
    botaoSalvarStatus.disabled = false;
    botaoSalvarStatus.querySelector('.spinner-border').classList.add('d-none');
  }
});

// ------------------------------ Acoes -------------------------------

tabela.addEventListener('click', async (evento) => {
  const botao = evento.target.closest('button[data-acao]');
  if (!botao) return;

  const { acao, id, status } = botao.dataset;

  if (acao === 'status') {
    abrirModalStatus(id, status);
    return;
  }

  if (acao === 'concluir') {
    abrirModalStatus(id, status, 'CONCLUIDA');
    return;
  }

  if (acao === 'editar') {
    try {
      const { dados } = await api.get(`/ordens-servico/${id}`);
      abrirFormulario(dados);
    } catch (erro) {
      avisar(erro.message, 'danger');
    }
  }
});

// ------------------------------ Filtros -----------------------------

document.getElementById('busca').addEventListener(
  'input',
  debounce((evento) => {
    estado.busca = evento.target.value.trim();
    estado.pagina = 1;
    carregar();
  })
);

[
  ['filtroStatus', 'status'],
  ['filtroTipo', 'tipo'],
  ['filtroPrioridade', 'prioridade'],
  ['filtroTecnico', 'tecnicoId'],
].forEach(([elementoId, chave]) => {
  document.getElementById(elementoId).addEventListener('change', (evento) => {
    estado[chave] = evento.target.value;
    estado.pagina = 1;
    carregar();
  });
});

await carregarListasAuxiliares();
carregar();
