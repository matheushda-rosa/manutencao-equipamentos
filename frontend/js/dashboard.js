/**
 * Tela do Dashboard (item 4.2 do enunciado).
 * Os indicadores vem prontos de /api/dashboard; a tela apenas desenha.
 */
import { protegerPagina } from './auth.js';
import { renderizarLayout, renderizarTitulo } from './layout.js';
import { api } from './api.js';
import {
  avisar,
  esc,
  formatarDataHora,
  linhaCarregando,
  linhaVazia,
  seloPrioridade,
  seloStatusOrdem,
} from './ui.js';

const CORES_PRIORIDADE = {
  URGENTE: 'danger',
  ALTA: 'warning',
  MEDIA: 'secondary',
  BAIXA: 'info',
};

const usuario = await protegerPagina();

renderizarLayout({ usuario, ativo: 'dashboard' });
renderizarTitulo({
  titulo: `Ola, ${usuario.nome.split(' ')[0]}`,
  descricao: 'Panorama atual dos equipamentos e das manutencoes.',
  acao: `<button class="btn btn-outline-primary" id="btnAtualizar">
           <i class="bi bi-arrow-clockwise me-1"></i>Atualizar
         </button>`,
});

document.getElementById('btnAtualizar').addEventListener('click', () => carregar());

/** Barras de proporcao reaproveitadas pelos dois paineis. */
function montarBarras(itens, { rotulo, quantidade, cor }) {
  if (itens.length === 0) {
    return '<p class="text-secondary mb-0">Nenhum registro.</p>';
  }

  const maior = Math.max(...itens.map((item) => item[quantidade]), 1);

  return itens
    .map((item) => {
      const valor = item[quantidade];
      const largura = Math.round((valor / maior) * 100);
      const classeCor = typeof cor === 'function' ? cor(item) : cor;

      return `
        <div class="mb-3">
          <div class="d-flex justify-content-between small mb-1">
            <span>${esc(item[rotulo])}</span>
            <span class="fw-semibold">${valor}</span>
          </div>
          <div class="progress" style="height: 7px;" role="progressbar"
               aria-valuenow="${valor}" aria-valuemin="0" aria-valuemax="${maior}">
            <div class="progress-bar bg-${classeCor}" style="width: ${largura}%"></div>
          </div>
        </div>`;
    })
    .join('');
}

function preencherUltimasOrdens(ordens) {
  const corpo = document.getElementById('tabelaUltimas');

  if (ordens.length === 0) {
    corpo.innerHTML = linhaVazia(7, 'Nenhuma ordem de servico registrada ainda.');
    return;
  }

  corpo.innerHTML = ordens
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
        </tr>`
    )
    .join('');
}

async function carregar() {
  document.getElementById('tabelaUltimas').innerHTML = linhaCarregando(7);

  try {
    const { dados } = await api.get('/dashboard');

    // Indicadores obrigatorios
    document.getElementById('kpiAtivos').textContent = dados.equipamentosAtivos;
    document.getElementById('kpiManutencao').textContent = dados.equipamentosEmManutencao;
    document.getElementById('kpiPreventivas').textContent = dados.manutencoesPreventivas;
    document.getElementById('kpiTotal').textContent = dados.equipamentosTotal;

    // Painel de ordens
    document.getElementById('osAbertas').textContent = dados.ordens.abertas;
    document.getElementById('osAndamento').textContent = dados.ordens.emAndamento;
    document.getElementById('osConcluidas').textContent = dados.ordens.concluidas;
    document.getElementById('osUltimos30').textContent = dados.ordens.concluidasUltimos30Dias;

    document.getElementById('porPrioridade').innerHTML = montarBarras(
      dados.ordensPorPrioridade,
      {
        rotulo: 'prioridade',
        quantidade: 'quantidade',
        cor: (item) => CORES_PRIORIDADE[item.prioridade] || 'secondary',
      }
    );

    document.getElementById('porCategoria').innerHTML = montarBarras(
      dados.equipamentosPorCategoria,
      { rotulo: 'categoria', quantidade: 'quantidade', cor: 'primary' }
    );

    preencherUltimasOrdens(dados.ultimasOrdens);
  } catch (erro) {
    console.error('[dashboard] Falha ao carregar indicadores:', erro);
    avisar(erro.message, 'danger');
    document.getElementById('tabelaUltimas').innerHTML = linhaVazia(
      7,
      'Nao foi possivel carregar os dados.'
    );
  }
}

carregar();
