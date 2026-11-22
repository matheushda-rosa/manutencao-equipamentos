/**
 * Detalhe do equipamento e historico de manutencoes (item 4.8).
 *
 * O id vem pela URL: equipamento.html?id=3
 *
 * Uma unica chamada a /api/equipamentos/:id/historico traz o
 * equipamento, as ordens e o resumo.
 */
import { protegerPagina } from './auth.js';
import { renderizarLayout, renderizarTitulo } from './layout.js';
import { api } from './api.js';
import {
  avisar,
  esc,
  formatarData,
  formatarDataHora,
  seloPrioridade,
  seloStatusEquipamento,
  seloStatusOrdem,
} from './ui.js';

const usuario = await protegerPagina();

renderizarLayout({ usuario, ativo: 'equipamentos' });

const conteudo = document.getElementById('conteudo');
const id = new URLSearchParams(window.location.search).get('id');

if (!id) {
  conteudo.innerHTML = `
    <div class="alert alert-warning">
      Equipamento nao informado.
      <a href="equipamentos.html" class="alert-link">Voltar para a lista</a>.
    </div>`;
  // throw interrompe o modulo: nada abaixo faz sentido sem um id.
  throw new Error('Parametro id ausente na URL.');
}

/** Monta a linha do tempo das manutencoes. */
function montarLinhaTempo(ordens) {
  if (ordens.length === 0) {
    return `
      <div class="text-center text-secondary py-5">
        <i class="bi bi-clock-history fs-1 d-block mb-2"></i>
        Este equipamento ainda nao possui manutencoes registradas.
      </div>`;
  }

  const itens = ordens
    .map((ordem) => {
      const classe = ordem.status === 'CONCLUIDA'
        ? 'concluida'
        : ordem.status === 'CANCELADA'
          ? 'cancelada'
          : '';

      const conclusao = ordem.dataConclusao
        ? `<div class="smaller text-success">
             <i class="bi bi-check2 me-1"></i>Concluida em ${formatarDataHora(ordem.dataConclusao)}
           </div>`
        : '';

      const solucao = ordem.solucao
        ? `<div class="mt-2 p-2 bg-light rounded small">
             <strong>Servico realizado:</strong> ${esc(ordem.solucao)}
           </div>`
        : '';

      return `
        <li class="${classe}">
          <div class="d-flex flex-wrap align-items-center gap-2 mb-1">
            <span class="fw-semibold">OS #${ordem.id}</span>
            ${seloStatusOrdem(ordem.status)}
            ${seloPrioridade(ordem.prioridade)}
            <span class="badge text-bg-light border">${esc(ordem.tipo)}</span>
          </div>

          <div class="smaller text-secondary mb-1">
            Aberta em ${formatarDataHora(ordem.dataAbertura)}
            ${ordem.tecnico ? ` &middot; Tecnico: ${esc(ordem.tecnico.nome)}` : ''}
          </div>
          ${conclusao}

          <p class="mb-0 mt-2">${esc(ordem.descricao)}</p>
          ${solucao}
        </li>`;
    })
    .join('');

  return `<ul class="linha-tempo">${itens}</ul>`;
}

function desenhar({ equipamento, ordens, resumo }) {
  renderizarTitulo({
    titulo: equipamento.nome,
    descricao: `Patrimonio ${equipamento.patrimonio}`,
    acao: `<a href="equipamentos.html" class="btn btn-outline-secondary">
             <i class="bi bi-arrow-left me-1"></i>Voltar
           </a>`,
  });

  const foto = equipamento.fotoUrl
    ? `<img src="${esc(equipamento.fotoUrl)}" class="foto-equipamento"
            alt="Foto de ${esc(equipamento.nome)}">`
    : `<div class="foto-equipamento sem-foto">Sem foto cadastrada</div>`;

  conteudo.innerHTML = `
    <div class="row g-3">
      <!-- Dados do equipamento -->
      <div class="col-12 col-lg-4">
        <div class="card h-100">
          <div class="card-body">
            ${foto}

            <div class="d-flex justify-content-between align-items-center mt-3 mb-3">
              <span class="text-secondary small">Situacao atual</span>
              ${seloStatusEquipamento(equipamento.status)}
            </div>

            <dl class="row mb-0 small">
              <dt class="col-5 text-secondary fw-normal">Categoria</dt>
              <dd class="col-7">${esc(equipamento.categoria.nome)}</dd>

              <dt class="col-5 text-secondary fw-normal">Local</dt>
              <dd class="col-7">${esc(equipamento.local.nome)}</dd>

              <dt class="col-5 text-secondary fw-normal">Cidade</dt>
              <dd class="col-7">${esc(equipamento.local.cidade)}/${esc(equipamento.local.uf)}</dd>

              <dt class="col-5 text-secondary fw-normal">Aquisicao</dt>
              <dd class="col-7">${formatarData(equipamento.dataAquisicao)}</dd>

              <dt class="col-5 text-secondary fw-normal">Descricao</dt>
              <dd class="col-7">${esc(equipamento.descricao || '-')}</dd>
            </dl>
          </div>
        </div>
      </div>

      <!-- Resumo e historico -->
      <div class="col-12 col-lg-8">
        <div class="row g-3 mb-3">
          <div class="col-6 col-sm-3">
            <div class="card text-center h-100">
              <div class="card-body py-3">
                <div class="h4 mb-0">${resumo.total}</div>
                <div class="smaller text-secondary text-uppercase">Manutencoes</div>
              </div>
            </div>
          </div>
          <div class="col-6 col-sm-3">
            <div class="card text-center h-100">
              <div class="card-body py-3">
                <div class="h4 mb-0 text-warning">${resumo.emAberto}</div>
                <div class="smaller text-secondary text-uppercase">Em aberto</div>
              </div>
            </div>
          </div>
          <div class="col-6 col-sm-3">
            <div class="card text-center h-100">
              <div class="card-body py-3">
                <div class="h4 mb-0">${resumo.preventivas}</div>
                <div class="smaller text-secondary text-uppercase">Preventivas</div>
              </div>
            </div>
          </div>
          <div class="col-6 col-sm-3">
            <div class="card text-center h-100">
              <div class="card-body py-3">
                <div class="h4 mb-0">${resumo.corretivas}</div>
                <div class="smaller text-secondary text-uppercase">Corretivas</div>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <span>Historico de manutencoes</span>
            <span class="smaller text-secondary">
              ${resumo.ultimaManutencao
      ? `Ultima conclusao: ${formatarData(resumo.ultimaManutencao)}`
      : 'Nenhuma manutencao concluida'}
            </span>
          </div>
          <div class="card-body">
            ${montarLinhaTempo(ordens)}
          </div>
        </div>
      </div>
    </div>`;
}

try {
  const { dados } = await api.get(`/equipamentos/${id}/historico`);
  desenhar(dados);
} catch (erro) {
  console.error('[equipamento] Falha ao carregar:', erro);
  conteudo.innerHTML = `
    <div class="alert alert-danger">
      ${esc(erro.message)}
      <a href="equipamentos.html" class="alert-link">Voltar para a lista</a>.
    </div>`;
  avisar(erro.message, 'danger');
}
